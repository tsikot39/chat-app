// Simple avatar sync utility
// You can run this in the browser console to manually sync your avatar

async function syncAvatarToDatabase() {
  try {
    // Get avatar from localStorage
    const savedSettings = localStorage.getItem("nexuschat-settings");
    if (!savedSettings) {
      console.log("No settings found in localStorage");
      return;
    }

    const settings = JSON.parse(savedSettings);
    const customAvatar = settings.profile?.avatar;

    if (!customAvatar) {
      console.log("No custom avatar found in localStorage");
      return;
    }

    console.log("Syncing avatar to database:", customAvatar);

    // Get current session for name/status
    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();

    if (!session || !session.user) {
      console.log("Not authenticated");
      return;
    }

    // Update profile in database
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: session.user.name,
        statusMessage: settings.profile?.statusMessage || "",
        customAvatar: customAvatar,
      }),
    });

    if (response.ok) {
      console.log("✅ Avatar synced to database successfully!");
      console.log("Others should now see your custom avatar in chat headers");
    } else {
      console.error("❌ Failed to sync avatar to database");
    }
  } catch (error) {
    console.error("❌ Error syncing avatar:", error);
  }
}

// Run the sync
syncAvatarToDatabase();
