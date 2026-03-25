import { connectDb } from "@/lib/db/db";
import { generateTokens } from "@/lib/jwt/jwt";
import { Partner } from "@/models";
import { verifyDjangoPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDb();
    const data = await req.json();
    const { email, password } = data;

    const existingPartner = await Partner.findOne({ email });
    if (!existingPartner) {
      return NextResponse.json(
        { message: "Partner not found" },
        { status: 401 },
      );
    }

    const verify = verifyDjangoPassword(password, existingPartner.password);
    if (!verify) {
      return NextResponse.json(
        { message: "Invalid Password" },
        { status: 400 },
      );
    }

    const { accessToken, refreshToken } = generateTokens(
      existingPartner._id.toString(),
      "partner",
    );

    const res = NextResponse.json(
      {
        message: "Logged in successfully",
        partner: {
          id: existingPartner._id.toString(),
          email: existingPartner.email,
          phone: existingPartner.phone,
          address: existingPartner.address,
          partnerCode: existingPartner.partnerCode,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
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
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Login failed" },
      { status: 500 },
    );
  }
}
