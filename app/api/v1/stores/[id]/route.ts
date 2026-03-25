import { connectDb } from "@/lib/db/db";
import { Store } from "@/models";
import { getPartnerFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const partner = getPartnerFromRequest(req);
    if (!partner) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const { id } = await params;
    const store = await Store.findById(id).select("-password").lean();

    if (!store) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to fetch store",
      },
      { status: 500 },
    );
  }
}
