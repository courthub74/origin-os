import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Artwork from "../models/Artwork.js";

const router = express.Router();

function getUserObjectId(req) {
  const sub = req.user?.sub;
  if (!mongoose.Types.ObjectId.isValid(sub)) {
    const err = new Error("Invalid user id (sub) in token");
    err.status = 400;
    throw err;
  }
  return new mongoose.Types.ObjectId(sub);
}

// Create draft
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserObjectId(req);

    const {
      title = "",
      description = "",
      year = "",
      output = "square",
      collection = "",
      notes = "",
      tags = []
    } = req.body || {};

    const artwork = await Artwork.create({
      userId,
      title,
      description,
      year,
      output,
      collection,
      notes,
      tags,
      status: "draft"
    });

    return res.status(201).json({ ok: true, artwork });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Server error" });
  }
});

// Update draft
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    const { id } = req.params;

    const allowed = ["title", "description", "year", "output", "collection", "notes", "tags", "status"];
    const update = {};

    for (const k of allowed) {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, k)) {
        update[k] = req.body[k];
      }
    }

    update.updatedAt = new Date();

    const artwork = await Artwork.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );

    if (!artwork) return res.status(404).json({ error: "Artwork not found" });

    return res.json({ ok: true, artwork });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Server error" });
  }
});

// Get recent activity
router.get("/recent", requireAuth, async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    const limit = Math.min(parseInt(req.query.limit || "7", 10), 25);

    const items = await Artwork.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("_id title status updatedAt createdAt");

    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Server error" });
  }
});

// Get single artwork
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserObjectId(req);
    const { id } = req.params;

    const artwork = await Artwork.findOne({ _id: id, userId });
    if (!artwork) return res.status(404).json({ error: "Artwork not found" });

    return res.json({ ok: true, artwork });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Server error" });
  }
});

export default router;
