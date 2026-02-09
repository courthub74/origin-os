import express from "express";
import OpenAI from "openai";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    // 🔐 Guard FIRST
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not set on the server."
      });
    }

    // ✅ Create client only when needed
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { prompt, size = "1024x1024", format = "png" } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return res.status(400).json({ error: "Prompt is missing or too short." });
    }

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt.trim(),
      size,
      output_format: format
    });

    // ✅ Validate response structure
    console.log("OpenAI image generation response:", result);

    const img = result.data?.[0];
    if (!img?.b64_json) {
      return res.status(500).json({ error: "No image returned from model." });
    }

    const mimeType =
      format === "jpeg" ? "image/jpeg" :
      format === "webp" ? "image/webp" :
      "image/png";

    return res.json({
      mimeType,
      base64: img.b64_json
    });

  } catch (err) {
    console.error("Image generate error:", err);
    return res.status(500).json({ error: "Image generation failed." });
  }
});

export default router;
