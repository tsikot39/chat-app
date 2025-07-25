import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json({
      session,
      status: "success",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
