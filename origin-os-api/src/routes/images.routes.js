import express from "express";
import OpenAI from "openai";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

import Artwork from "../models/Artwork.js";
import { requireAuth } from "../core/middleware/auth.js";

const router = express.Router();

// Helpers
function getBucket() {
  return new GridFSBucket(mongoose.connection.db, { bucketName: "images" });
}

// Routes

// POST ROUTE: /api/images/generate
router.post("/generate", requireAuth, async (req, res) => {
  console.log("TOP DEBUG req.user =", req.user);

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server." });
    }

    const { prompt, size = "1024x1024", format = "png", artworkId } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return res.status(400).json({ error: "Prompt is missing or too short." });
    }

    const userIdRaw = req.user?.sub;
    if (!userIdRaw) {
      return res.status(401).json({ error: "Auth user id missing" });
    }

    if (!artworkId) {
      return res.status(400).json({ error: "artworkId is required" });
    }

    const userId = new mongoose.Types.ObjectId(userIdRaw);

    const artwork = await Artwork.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(artworkId), userId },
      {
        $set: {
          status: "queued",
          promptCompiled: prompt.trim(),
          generationError: "",
          generationStartedAt: null,
          generationCompletedAt: null,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found for this user" });
    }

    // respond immediately
    res.status(202).json({
      ok: true,
      artworkId: artwork._id,
      status: "queued"
    });

    // continue in background
    setImmediate(async () => {
      try {
        await Artwork.findByIdAndUpdate(artworkId, {
          $set: {
            status: "generating",
            generationStartedAt: new Date(),
            generationError: "",
            updatedAt: new Date()
          }
        });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const result = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt.trim(),
          size,
          output_format: format
        });

        const img = result.data?.[0];
        if (!img?.b64_json) {
          throw new Error("No image returned from model.");
        }

        const base64 = img.b64_json;
        const buffer = Buffer.from(base64, "base64");

        const mimeType =
          format === "jpeg" ? "image/jpeg" :
          format === "webp" ? "image/webp" :
          "image/png";

        const bucket = getBucket();
        const filename = `origin_${Date.now()}.${format}`;

        const uploadStream = bucket.openUploadStream(filename, {
          contentType: mimeType,
          metadata: {
            userId: userIdRaw,
            prompt: prompt.trim(),
            size
          }
        });

        uploadStream.on("error", async (err) => {
          console.error("GridFS upload error:", err);
          await Artwork.findByIdAndUpdate(artworkId, {
            $set: {
              status: "failed",
              generationError: "Failed to store image",
              updatedAt: new Date()
            }
          });
        });

        uploadStream.on("finish", async () => {
          try {
            const fileId = uploadStream.id;

            await Artwork.findOneAndUpdate(
              { _id: new mongoose.Types.ObjectId(artworkId), userId },
              {
                $set: {
                  status: "generated",
                  imageFileId: fileId,
                  imageMimeType: mimeType,
                  imageFilename: filename,
                  generationCompletedAt: new Date(),
                  generationError: "",
                  updatedAt: new Date()
                }
              }
            );
          } catch (e) {
            console.error("Image metadata save error:", e);
            await Artwork.findByIdAndUpdate(artworkId, {
              $set: {
                status: "failed",
                generationError: e.message || "Failed to save image metadata",
                updatedAt: new Date()
              }
            });
          }
        });

        uploadStream.end(buffer);
      } catch (err) {
        console.error("Background image generate error:", err);
        await Artwork.findByIdAndUpdate(artworkId, {
          $set: {
            status: "failed",
            generationError: err.message || "Image generation failed.",
            updatedAt: new Date()
          }
        });
      }
    });
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
