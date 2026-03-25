import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 },
  );

  res.cookies.delete("accessToken");
  res.cookies.delete("refreshToken");

  return res;
}
