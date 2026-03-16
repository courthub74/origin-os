import mongoose from "mongoose";

// Model for an artwork created by a user. This can be used for both AI-generated and human-created artworks, and can be extended with additional fields as needed. The "status" field tracks the lifecycle of the artwork, from draft to published, and can be used to manage the generation process for AI artworks.
const artworkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    title: { type: String, default: "" },
    description: { type: String, default: "" },
    year: { type: String, default: "" },

    output: { type: String, enum: ["square", "portrait", "landscape"], default: "square" },
    collection: { type: String, default: "" },

    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },

    // status: { type: String, enum: ["draft", "generated", "published", "failed"], default: "draft" },
    status: {
      type: String,
      enum: ["draft", "queued", "generating", "generated", "published", "failed"],
      default: "draft"
    },

    originalUrl: { type: String, default: "" },
    thumbUrl: { type: String, default: "" },

    imageFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    imageMimeType: { type: String, default: "" },
    imageFilename: { type: String, default: "" },
    promptCompiled: { type: String, default: "" },

    generationStartedAt: { type: Date, default: null },
    generationCompletedAt: { type: Date, default: null },
    generationError: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model("Artwork", artworkSchema);
