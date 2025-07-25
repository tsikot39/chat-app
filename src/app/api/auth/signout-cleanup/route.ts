import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomSession(request);

    // Allow the request even if session is expired, but verify email matches
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // If we have a session, make sure the email matches
    if (session?.user?.email && session.user.email !== email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Set user as offline
    await User.findOneAndUpdate(
      { email },
      {
        isOnline: false,
        lastSeen: new Date(),
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in signout cleanup:", error);
    // Return success even if there's an error to not block signout
    return NextResponse.json({ success: true });
  }
}
