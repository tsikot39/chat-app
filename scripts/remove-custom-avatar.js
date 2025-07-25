// Migration script to remove customAvatar field from User documents
const mongoose = require("mongoose");

// User schema for migration
const userSchema = new mongoose.Schema(
  {
    email: String,
    name: String,
    image: String,
    customAvatar: String, // This will be removed
    provider: String,
    isOnline: Boolean,
    statusMessage: String,
    lastSeen: Date,
    settings: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function removeCustomAvatarField() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/nexuschat"
    );
    console.log("Connected to MongoDB");

    console.log("Removing customAvatar field from all users...");

    // Remove the customAvatar field from all documents
    const result = await User.updateMany(
      {}, // Match all documents
      { $unset: { customAvatar: "" } } // Remove the customAvatar field
    );

    console.log(
      `Migration completed. Modified ${result.modifiedCount} documents.`
    );

    // Verify the migration
    const sampleUsers = await User.find({}).limit(3);
    console.log("Sample users after migration:");
    sampleUsers.forEach((user) => {
      console.log(`- ${user.name}: hasCustomAvatar = ${!!user.customAvatar}`);
    });
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
removeCustomAvatarField();
