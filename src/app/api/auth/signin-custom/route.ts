import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update user status to online
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date(),
    });

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image || null,
    };

    // Simple token (in production, use proper JWT)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString("base64");

    return NextResponse.json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
