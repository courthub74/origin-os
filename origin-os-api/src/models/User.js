const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Auth
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Identity
    displayName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    // Onboarding (v1)
    rolePrimary: {
      type: String,
      enum: ["artist", "creator", "marketer", "manager", "collector", ""],
      default: ""
    },
    roles: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) =>
          arr.every((v) => ["artist", "creator", "marketer", "manager", "collector"].includes(v)),
        message: "Invalid role in roles[]"
      }
    },

    brandName: { type: String, default: "" },
    focus: {
      type: String,
      enum: ["drops", "campaigns", "both", ""],
      default: ""
    },

    links: {
      website: { type: String, default: "" },
      x: { type: String, default: "" },
      instagram: { type: String, default: "" },
      opensea: { type: String, default: "" },
      xrpcafe: { type: String, default: "" }
    },

    onboardingComplete: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
