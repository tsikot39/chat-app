import { NextRequest, NextResponse } from "next/server";
import { getCustomSession } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { userSearchSchema } from "@/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Validate input
    const validation = userSearchSchema.safeParse({ query, limit });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let users;
    if (query) {
      // Search users by name or email
      users = await User.find({
        _id: { $ne: currentUser._id },
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      })
        .select("_id name email image isOnline lastSeen")
        .limit(limit);
    } else {
      // Get all users except current user
      users = await User.find({ _id: { $ne: currentUser._id } })
        .select("_id name email image isOnline lastSeen")
        .limit(limit);
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
