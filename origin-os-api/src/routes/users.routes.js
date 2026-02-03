const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.memoryStorage(); // Store in memory temporarily
const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images allowed"));
    }
  }
});

const ALLOWED_ROLES = ["artist", "creator", "marketer", "manager", "collector"];
const ALLOWED_FOCUS = ["drops", "campaigns", "both"];

router.post("/me/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    // Check if file was provided by multer
    if (!req.file) {
      return res.status(400).json({ error: "No avatar file provided" });
    }

    // Convert file buffer to base64 for storage
    const base64Data = req.file.buffer.toString("base64");
    const avatarDataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    // Update user with avatar URL (store as data URL for now)
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
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

router.patch("/me/onboarding", requireAuth, async (req, res) => {
  try {
    const {
      displayName,
      rolePrimary,
      roles,
      brandName,
      focus,
      links
    } = req.body || {};

    const update = {};

    if (typeof displayName === "string") update.displayName = displayName.trim();
    if (typeof brandName === "string") update.brandName = brandName.trim();

    if (typeof rolePrimary === "string") {
      const v = rolePrimary.trim().toLowerCase();
      if (v && !ALLOWED_ROLES.includes(v)) {
        return res.status(400).json({ error: "Invalid primary role" });
      }
      update.rolePrimary = v;
    }

    if (Array.isArray(roles)) {
      const cleaned = [...new Set(roles.map(r => String(r).trim().toLowerCase()))]
        .filter(Boolean);

      if (!cleaned.every(r => ALLOWED_ROLES.includes(r))) {
        return res.status(400).json({ error: "Invalid roles" });
      }
      update.roles = cleaned;
    }

    if (typeof focus === "string") {
      const v = focus.trim().toLowerCase();
      if (v && !ALLOWED_FOCUS.includes(v)) {
        return res.status(400).json({ error: "Invalid focus" });
      }
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

    // Decide if onboarding is "complete" (v1 rules)
    // You can tighten/loosen this later.
    const willComplete =
      (update.rolePrimary || "") &&
      (update.focus || "");

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

module.exports = router;
