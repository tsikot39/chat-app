// Migration script to clean up user data for Google-only authentication
const mongoose = require("mongoose");

// User schema (simplified for migration)
const userSchema = new mongoose.Schema(
  {
    email: String,
    name: String,
    image: String,
    customAvatar: String,
    password: String, // This will be removed
    provider: String,
    isOnline: Boolean,
    statusMessage: String,
    lastSeen: Date,
    settings: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function migrateUsers() {
  try {
    // Connect to MongoDB
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb+srv://tsikot39:n4w5rb@cluster0.3f8yqnc.mongodb.net/nexuschat?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI);

    console.log("Connected to MongoDB");

    // Find all users with password fields
    const usersWithPasswords = await User.find({ password: { $exists: true } });
    console.log(
      `Found ${usersWithPasswords.length} users with password fields`
    );

    // Update users to remove password field and set provider to google
    const result = await User.updateMany(
      {},
      {
        $unset: { password: "" },
        $set: { provider: "google" },
      }
    );

    console.log(`Updated ${result.modifiedCount} users:`);
    console.log("- Removed password fields");
    console.log('- Set provider to "google"');

    // Disconnect
    await mongoose.disconnect();
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateUsers();
