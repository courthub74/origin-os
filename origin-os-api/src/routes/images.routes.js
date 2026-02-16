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
router.post("/generate", requireAuth, async (req, res) => {
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

    const userIdRaw = req.user?._id || req.user?.id || req.user?.sub;
    console.log("AUTH DEBUG userIdRaw =", userIdRaw);

    if (!userIdRaw)
      return res.status(401).json({ error: "Auth user id missing" });

    const userId = mongoose.Types.ObjectId.isValid(userIdRaw)
      ? new mongoose.Types.ObjectId(userIdRaw)
      : userIdRaw;


    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
      metadata: {
        userId: String(userId),       // ✅ safe conversion
        prompt: prompt.trim(),
        size
      }
    });


    
    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      return res.status(500).json({ error: "Failed to store image" });
    });


    uploadStream.on("finish", async (file) => {
      try {
        // ✅ Save metadata to MongoDB
        // const imageDoc = await Image.create({
        //   userId: req.user._id,
        //   prompt: prompt.trim(),
        //   size,
        //   mimeType,
        //   fileId: file._id,
        //   filename: file.filename
        // });

       const { artworkId } = req.body;
        if (!artworkId) return res.status(400).json({ error: "artworkId is required" });

        console.log("FINISH DEBUG", {
          artworkId,
          userId: String(userId),
          fileId: String(file._id)
        });


        const updated = await Artwork.findOneAndUpdate(
          { _id: artworkId, userId },  // ✅ use userId, not req.user._id
          { $set: { status: "generated", imageFileId: file._id, imageMimeType: mimeType, imageFilename: file.filename, updatedAt: new Date() } },
          { new: true }
        );

        console.log("FINISH DEBUG updated?", !!updated);

        if (!updated) {
          return res.status(404).json({ error: "Artwork not found for this user (userId mismatch)" });
        }

         // ✅ Respond once
        return res.json({
          ok: true,
          artwork: updated,
          mimeType,
          base64
        });

      // Error handling for metadata save  
      ////////////////////////////////////////////
      ////////////////////////////////////////////
      ////////////////////////////////////////////
      // START HERE
      } catch (e) {
        console.error("Image metadata save error:", e);
        return res.status(500).json({ error: "Failed to save image metadata" });
      }
    });

    uploadStream.end(buffer);

  // Error handling for the whole try block
  } catch (err) {
    console.error("Image generate error:", err);
    return res.status(500).json({ error: err.message || "Image generation failed." });
  }
});

export default router;
