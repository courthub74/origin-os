import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Artwork from "../models/Artwork.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.sub;

  const works = await Artwork.countDocuments({ userId });

  // placeholders for now (until you build these models)
  const collections = 0;
  const drops = 0;

  return res.json({ ok: true, stats: { works, collections, drops } });
});

export default router;
