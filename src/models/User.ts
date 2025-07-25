import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ["google"],
      default: "google",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    statusMessage: {
      type: String,
      default: "",
      maxlength: 100,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    settings: {
      notifications: {
        desktop: {
          type: Boolean,
          default: false,
        },
        sound: {
          type: Boolean,
          default: true,
        },
        messagePreview: {
          type: Boolean,
          default: true,
        },
        newMessages: {
          type: Boolean,
          default: true,
        },
        mentions: {
          type: Boolean,
          default: true,
        },
      },
      privacy: {
        onlineStatus: {
          type: Boolean,
          default: true,
        },
        readReceipts: {
          type: Boolean,
          default: true,
        },
        whoCanMessage: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
        typing: {
          type: Boolean,
          default: true,
        },
      },
      chat: {
        enterToSend: {
          type: Boolean,
          default: true,
        },
        fontSize: {
          type: String,
          enum: ["small", "medium", "large"],
          default: "medium",
        },
        showTimestamps: {
          type: Boolean,
          default: true,
        },
        messageHistory: {
          type: Number,
          default: 30,
          min: 7,
          max: 365,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance (excluding email since it's already unique)
userSchema.index({ name: 1 });
userSchema.index({ isOnline: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
