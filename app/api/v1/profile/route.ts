import { connectDb } from "@/lib/db/db";
import { Partner } from "@/models";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { hashDjangoPassword, verifyDjangoPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  try {
    const partner = requireAuth(req);
    await connectDb();

    const data = (await Partner.findById(partner.id)
      .select("-password")
      .lean()) as any;

    if (!data) {
      return NextResponse.json(
        { message: "Partner not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ partner: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to fetch profile",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
      },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const partner = requireAuth(req);
    await connectDb();

    const body = await req.json();
    const { name, phone, address, currentPassword, newPassword } = body;

    const existing = (await Partner.findById(partner.id)) as any;
    if (!existing) {
      return NextResponse.json(
        { message: "Partner not found" },
        { status: 404 },
      );
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Current password is required to set a new password" },
          { status: 400 },
        );
      }
      const valid = verifyDjangoPassword(currentPassword, existing.password);
      if (!valid) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 400 },
        );
      }
      updates.password = hashDjangoPassword(newPassword);
    }

    updates.updatedAt = new Date();

    const updated = (await Partner.findByIdAndUpdate(
      partner.id,
      { $set: updates },
      { new: true },
    )
      .select("-password")
      .lean()) as any;

    return NextResponse.json({
      message: "Profile updated successfully",
      partner: {
        id: updated._id.toString(),
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        address: updated.address,
        partnerCode: updated.partnerCode,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update profile",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : 500,
      },
    );
  }
}
