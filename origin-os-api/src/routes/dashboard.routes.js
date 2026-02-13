const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Artwork = require("../models/Artwork");

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
  const userId = req.user.sub;

  // Stats
  const totalWorks = await Artwork.countDocuments({ userId });

  // If you don't have real collection/drop models yet,
  // keep these at 0 or compute from fields later.
  const stats = {
    works: totalWorks,
    collections: 0,
    drops: 0
  };

  // Recent items (for recent activity panel)
  const recent = await Artwork.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(7)
    .select("_id title status updatedAt createdAt collection");

  // Continue tiles: most recently updated drafts
  const cont = await Artwork.find({ userId, status: "draft" })
    .sort({ updatedAt: -1 })
    .limit(4)
    .select("_id title updatedAt status collection");

  // Attention list rules (simple with your current schema):
  // - Draft missing collection => "Needs Collection"
  // - Non-draft missing title => "Missing title" (optional)
  // Adjust rules as you add image/social/mint fields.
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

  // Next recommended action:
  // Prefer latest draft. If none, null.
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

  // Shape recent activity into what your UI expects
  const recentItems = recent.map(a => ({
    type: a.status || "Draft",
    title: a.title || "Untitled",
    subtitle: `${(a.status || "Draft")} updated · ${timeAgo(a.updatedAt || a.createdAt)}`
  }));

  const continueItems = cont.map(a => ({
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

module.exports = router;
