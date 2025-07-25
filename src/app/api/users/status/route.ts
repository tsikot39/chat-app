import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// POST: Update user online status
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { isOnline } = await request.json();

    // Find the user first to check their privacy settings
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has online status privacy setting enabled
    const onlineStatusEnabled =
      currentUser.settings?.privacy?.onlineStatus !== false;

    // Only update online status if privacy setting allows it
    const actualOnlineStatus = onlineStatusEnabled ? isOnline : false;

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        isOnline: actualOnlineStatus,
        lastSeen: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      privacyEnabled: onlineStatusEnabled,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
