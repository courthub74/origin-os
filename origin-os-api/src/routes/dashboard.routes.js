import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Artwork from "../models/Artwork.js";

const router = express.Router();

function timeAgo(date) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

router.get("/", requireAuth, async (req, res) => {
  const sub = req.user.sub;

  // ✅ Normalize to ObjectId (and fail loudly if it's not valid)
  if (!mongoose.Types.ObjectId.isValid(sub)) {
    console.log("[/dashboard] INVALID sub (not ObjectId):", sub);
    return res.status(400).json({ error: "Invalid user id (sub) in token" });
  }

  const userId = new mongoose.Types.ObjectId(sub);

  console.log("[/dashboard] sub =", sub, "-> userId =", userId.toString());

  const sampleAny = await Artwork.findOne({}).select("_id userId title").lean();
  console.log("[/dashboard] sampleAny =", sampleAny);

  const sampleMine = await Artwork.findOne({ userId }).select("_id userId title").lean();
  console.log("[/dashboard] sampleMine =", sampleMine);

  const totalWorks = await Artwork.countDocuments({ userId });
  console.log("[/dashboard] totalWorks for user =", totalWorks);

  const stats = { works: totalWorks, collections: 0, drops: 0 };

  const recent = await Artwork.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(7)
    .select("_id title status updatedAt createdAt collection");

  const cont = await Artwork.find({ userId, status: "draft" })
    .sort({ updatedAt: -1 })
    .limit(4)
    .select("_id title updatedAt status collection");

  const attentionRaw = await Artwork.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(25)
    .select("_id title status updatedAt collection");

  const attention = [];
  for (const a of attentionRaw) {
    if ((a.status === "draft" || !a.status) && !a.collection) {
      attention.push({
        workId: a._id,
        title: a.title || "Untitled",
        reason: "Missing collection",
        tag: "Needs Collection",
        cta: { label: "Assign", go: "collections.html" }
      });
    }
    if (attention.length >= 5) break;
  }

  const next = cont[0]
    ? {
        type: "continue",
        workId: cont[0]._id,
        title: cont[0].title || "Untitled",
        subtitle: cont[0].collection
          ? `Draft edited ${timeAgo(cont[0].updatedAt)}.`
          : `Draft edited ${timeAgo(cont[0].updatedAt)}. Assign to a collection to unlock publishing.`,
        primaryCta: { label: "Continue", go: "create.html" },
        secondaryCta: cont[0].collection
          ? { label: "View Collections", go: "collections.html" }
          : { label: "Assign Collection", go: "collections.html" }
      }
    : null;

  const recentItems = recent.map((a) => ({
    type: a.status || "Draft",
    title: a.title || "Untitled",
    subtitle: `${a.status || "Draft"} updated · ${timeAgo(a.updatedAt || a.createdAt)}`
  }));

  const continueItems = cont.map((a) => ({
    workId: a._id,
    title: a.title || "Untitled",
    lastEditedText: timeAgo(a.updatedAt)
  }));

  return res.json({
    ok: true,
    stats,
    nextAction: next,
    attention,
    continue: continueItems,
    recent: recentItems
  });
});

export default router;
