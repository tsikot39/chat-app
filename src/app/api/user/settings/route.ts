import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomSession(request);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      settings: user.settings || {
        notifications: {
          desktop: false,
          sound: true,
          messagePreview: true,
          newMessages: true,
          mentions: true,
        },
        privacy: {
          onlineStatus: true,
          readReceipts: true,
          whoCanMessage: "everyone",
          typing: true,
        },
        chat: {
          enterToSend: true,
          fontSize: "medium",
          showTimestamps: true,
          messageHistory: 30,
        },
      },
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCustomSession(request);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json(
        { error: "Settings data is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { settings },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: updatedUser.settings,
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
