// Custom authentication system to replace NextAuth
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-jwt-secret";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export async function signInUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | null> {
  try {
    await connectDB();

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image || null,
    };

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user: authUser, token };
  } catch (error) {
    console.error("Sign in error:", error);
    return null;
  }
}

export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<{ user: AuthUser; token: string } | null> {
  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      isOnline: true,
      lastSeen: new Date(),
    });

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image || null,
    };

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user: authUser, token };
  } catch (error) {
    console.error("Create user error:", error);
    return null;
  }
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    await connectDB();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image || null,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}
