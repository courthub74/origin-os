import express from "express";
import OpenAI from "openai";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

import Artwork from "../models/Artwork.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Helpers
function getBucket() {
  return new GridFSBucket(mongoose.connection.db, { bucketName: "images" });
}

// Routes

// POST /api/images/generate
router.post("/generate", requireAuth, async (req, res) => {

  // debugging auth issues - check req.user early
  console.log("TOP DEBUG req.user =", req.user);
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server." });
    }

    const { prompt, size = "1024x1024", format = "png" } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return res.status(400).json({ error: "Prompt is missing or too short." });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt.trim(),
      size,
      output_format: format
    });

    const img = result.data?.[0];
    if (!img?.b64_json) {
      return res.status(500).json({ error: "No image returned from model." });
    }

    const base64 = img.b64_json;

    const mimeType =
      format === "jpeg" ? "image/jpeg" :
      format === "webp" ? "image/webp" :
      "image/png";


    // ✅ Save to GridFS
    const buffer = Buffer.from(base64, "base64");
    const bucket = getBucket();
    const filename = `origin_${Date.now()}.${format}`;

    console.log("AUTH DEBUG req.user =", req.user);

    const userIdRaw = req.user?.sub;
    if (!userIdRaw) return res.status(401).json({ error: "Auth user id missing" });

    const userId = new mongoose.Types.ObjectId(userIdRaw);

    const { artworkId } = req.body;
    if (!artworkId) return res.status(400).json({ error: "artworkId is required" });

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
      metadata: {
        userId: userIdRaw,  // store string version
        prompt: prompt.trim(),
        size
      }
    });
    
    // UploadStream ON ERROR - Handle upload errors
    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Failed to store image" });
      }
    });

    // UploadStream ON FINISH - Save metadata to Artwork document and respond
    uploadStream.on("finish", async () => {
      try {
        const fileId = uploadStream.id; // ✅ this is the GridFS file _id

        const byIdOnly = await Artwork.findById(artworkId).select("_id userId title status").lean();
        console.log("DEBUG artwork by id =", byIdOnly);
        console.log("DEBUG auth sub =", userIdRaw);
        console.log("DEBUG auth sub (ObjectId) =", String(userId));

        const updated = await Artwork.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(artworkId), userId },
          {
            $set: {
              status: "generated",
              imageFileId: fileId,
              imageMimeType: mimeType,
              imageFilename: filename, // ✅ you already know this
              updatedAt: new Date()
            }
          },
          { new: true }
        );

        if (!updated) {
          return res.status(404).json({ error: "Artwork not found for this user (userId mismatch)" });
        }

        return res.json({ ok: true, artwork: updated, mimeType, base64 });
      } catch (e) {
        console.error("Image metadata save error:", e);
        return res.status(500).json({ error: "Failed to save image metadata", details: e.message });
      }
  });

    uploadStream.end(buffer);
    return;

  // Error handling for the whole try block
  } catch (err) {
    console.error("Image generate error:", err);
    return res.status(500).json({ error: err.message || "Image generation failed." });
  }
});

// GET /api/images/:fileId - stream image by GridFS fileId with ownership check
router.get("/:fileId", requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid fileId" });
    }

    const bucket = getBucket();
    const _id = new mongoose.Types.ObjectId(fileId);

    // Optional: ensure ownership by checking metadata.userId in images.files
    const files = await bucket.find({ _id }).toArray();
    const f = files?.[0];
    if (!f) return res.status(404).json({ error: "File not found" });

    // ownership check (because you stored metadata.userId as string)
    if (String(f.metadata?.userId) !== String(req.user.sub)) {
      return res.status(403).json({ error: "Not authorized to access this image" });
    }

    res.set("Content-Type", f.contentType || "image/png");

    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on("error", () => res.status(404).end());
    downloadStream.pipe(res);
  } catch (e) {
    console.error("Image fetch error:", e);
    return res.status(500).json({ error: "Failed to fetch image" });
  }
});


export default router;
