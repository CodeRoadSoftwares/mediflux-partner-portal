import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db/db";
import { PartnerReferral, Store, Partner } from "@/models";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const searchParams = request.nextUrl.searchParams;
    const partnerUserId = searchParams.get("partnerUserId");

    if (!partnerUserId) {
      return NextResponse.json(
        { message: "Partner user ID is required" },
        { status: 400 },
      );
    }

    if (!Types.ObjectId.isValid(partnerUserId)) {
      return NextResponse.json(
        { message: "Invalid partner user ID" },
        { status: 400 },
      );
    }

    const partnerObjectId = new Types.ObjectId(partnerUserId);

    const partner = await Partner.findById(partnerObjectId).lean();

    if (!partner) {
      return NextResponse.json(
        { message: "Partner not found" },
        { status: 404 },
      );
    }

    const defaultReferralAmount = partner.defaultReferralAmount || 0;

    const referrals = await PartnerReferral.find({
      partnerUserId: partnerObjectId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalEarnings = referrals.reduce(
      (sum, ref) => sum + (ref.referralAmount || 0),
      0,
    );

    const allStores = await Store.find({
      partnerUserId: partnerObjectId,
    }).lean();

    const storesWithReferrals = new Set(
      referrals.map((ref) => ref.storeId.toString()),
    );

    const storesWithoutReferrals = allStores.filter(
      (store) => !storesWithReferrals.has(store._id.toString()),
    );

    const pendingPaymentsCount = storesWithoutReferrals.length;
    const pendingPayments = pendingPaymentsCount * defaultReferralAmount;

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        summary: {
          totalEarnings,
          pendingPayments,
          pendingPaymentsCount,
          defaultReferralAmount,
          totalStores: allStores.length,
          storesWithPayments: referrals.length,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { message: "Failed to fetch referrals", error: error.message },
      { status: 500 },
    );
  }
}
