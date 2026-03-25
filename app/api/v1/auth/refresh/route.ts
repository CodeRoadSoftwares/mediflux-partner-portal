import { generateTokens, verifyRefresh } from "@/lib/jwt/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("refreshToken")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Refresh token missing" },
        { status: 403 },
      );
    }
    const decoded = verifyRefresh(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { message: "Invalid refresh token" },
        { status: 403 },
      );
    }

    const { accessToken, refreshToken } = generateTokens(
      decoded.id,
      decoded.role || "partner",
    );

    const res = NextResponse.json(
      { message: "Token refreshed successfully" },
      { status: 200 },
    );

    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 15,
    });

    return res;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to refresh token",
      },
      { status: 500 },
    );
  }
}
