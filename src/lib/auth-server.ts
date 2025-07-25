import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export interface CustomSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
}

export async function getCustomSession(
  request: NextRequest
): Promise<CustomSession | null> {
  try {
    // Check for NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id && !session?.user?.email) {
      console.log("No valid session found");
      return null;
    }

    // Use the user ID from session if available, otherwise find by email
    let userId = session.user.id;

    if (!userId && session.user.email) {
      // Fallback: Get user from database by email
      await connectDB();
      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        console.log(
          "User not found in database for email:",
          session.user.email
        );
        return null;
      }

      userId = user._id.toString();
    }

    return {
      user: {
        id: userId,
        email: session.user.email || "",
        name: session.user.name || "",
        image: session.user.image,
      },
    };
  } catch (error) {
    console.error("Error getting custom session:", error);
    return null;
  }
}
