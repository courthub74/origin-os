import express from "express";
import multer from "multer";

import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.memoryStorage(); // Store in memory temporarily
const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images allowed"));
  }
});

const ALLOWED_ROLES = ["artist", "creator", "marketer", "manager", "collector"];
const ALLOWED_FOCUS = ["drops", "campaigns", "both"];

// GET current user data
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        rolePrimary: user.rolePrimary,
        roles: user.roles,
        brandName: user.brandName,
        focus: user.focus,
        links: user.links,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST avatar upload
router.post("/me/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No avatar file provided" });

    const base64Data = req.file.buffer.toString("base64");
    const avatarDataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { avatarUrl: avatarDataUrl },
      { new: true }
    );

    return res.json({
      ok: true,
      avatarUrl: user.avatarUrl,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Avatar upload failed" });
  }
});

// PATCH onboarding
router.patch("/me/onboarding", requireAuth, async (req, res) => {
  try {
    const { displayName, rolePrimary, roles, brandName, focus, links } = req.body || {};
    const update = {};

    if (typeof displayName === "string") update.displayName = displayName.trim();
    if (typeof brandName === "string") update.brandName = brandName.trim();

    if (typeof rolePrimary === "string") {
      const v = rolePrimary.trim().toLowerCase();
      if (v && !ALLOWED_ROLES.includes(v)) return res.status(400).json({ error: "Invalid primary role" });
      update.rolePrimary = v;
    }

    if (Array.isArray(roles)) {
      const cleaned = [...new Set(roles.map((r) => String(r).trim().toLowerCase()))].filter(Boolean);
      if (!cleaned.every((r) => ALLOWED_ROLES.includes(r))) return res.status(400).json({ error: "Invalid roles" });
      update.roles = cleaned;
    }

    if (typeof focus === "string") {
      const v = focus.trim().toLowerCase();
      if (v && !ALLOWED_FOCUS.includes(v)) return res.status(400).json({ error: "Invalid focus" });
      update.focus = v;
    }

    if (links && typeof links === "object") {
      update.links = {
        website: String(links.website || "").trim(),
        x: String(links.x || "").trim(),
        instagram: String(links.instagram || "").trim(),
        opensea: String(links.opensea || "").trim(),
        xrpcafe: String(links.xrpcafe || "").trim()
      };
    }

    // v1 completion rule
    const willComplete = (update.rolePrimary || "") && (update.focus || "");
    if (willComplete) update.onboardingComplete = true;

    const user = await User.findByIdAndUpdate(req.user.sub, update, { new: true });

    return res.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        rolePrimary: user.rolePrimary,
        roles: user.roles,
        brandName: user.brandName,
        focus: user.focus,
        links: user.links,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
