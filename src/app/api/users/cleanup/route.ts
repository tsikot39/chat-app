import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET: Cleanup inactive users (set them offline after 2 minutes of inactivity)
export async function GET() {
  try {
    await connectDB();

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago

    // Set users offline if they haven't been seen in the last 2 minutes
    const result = await User.updateMany(
      {
        isOnline: true,
        lastSeen: { $lt: twoMinutesAgo },
      },
      {
        isOnline: false,
      }
    );

    return NextResponse.json({
      success: true,
      usersSetOffline: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in user cleanup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
