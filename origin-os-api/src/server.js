// SERVER JS (ESM)

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./db.js";

// Routes (ESM imports)
import authRoutes from "./routes/auth.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import artworksRoutes from "./routes/artworks.routes.js";
import usersRoutes from "./routes/users.routes.js";
import imagesRoutes from "./routes/images.routes.js";

// Diagnostic log (keep temporarily)
console.log("ENV CHECK:", {
  cwd: process.cwd(),
  hasKey: !!process.env.OPENAI_API_KEY
});

const app = express();

// Put JSON limit once (remove the duplicate express.json call)
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.get("/health", (req, res) => res.json({ ok: true }));

// Mount routes
app.use("/auth", authRoutes);
app.use("/stats", statsRoutes);
app.use("/artworks", artworksRoutes);
app.use("/users", usersRoutes);
app.use("/api/images", imagesRoutes);

const port = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`✅ API running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });
