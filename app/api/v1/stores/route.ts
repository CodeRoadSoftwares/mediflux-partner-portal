import { connectDb } from "@/lib/db/db";
import { Store } from "@/models";
import { getPartnerFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const partner = getPartnerFromRequest(req);
    if (!partner) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const query = searchParams.get("query") || "";
    const partnerUserId = searchParams.get("partnerUserId");

    const filter: any = {};

    if (partnerUserId) {
      try {
        const objectId = new Types.ObjectId(partnerUserId);
        filter.partnerUserId = objectId;
      } catch (e) {
        filter.partnerUserId = partnerUserId;
      }
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ];
    }

    const total = await Store.countDocuments(filter);

    const stores = await Store.find(filter)
      .select("-password")
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        stores,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to fetch stores",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const partner = getPartnerFromRequest(req);
    const cookies = req.cookies.getAll();

    if (!partner) {
      return NextResponse.json(
        { message: "Unauthorized - No valid access token" },
        { status: 401 },
      );
    }

    const data = await req.json();
    const externalApiUrl = process.env.EXTERNAL_API_URL?.trim();
    const apiKey = process.env.EXTERNAL_API_KEY?.trim();

    if (!externalApiUrl || !apiKey) {
      return NextResponse.json(
        { message: "External API configuration missing" },
        { status: 500 },
      );
    }

    const response = await axios.post(`${externalApiUrl}/stores/`, data, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("External API Error:", error.response?.data || error.message);

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to create store";

    return NextResponse.json({ message }, { status });
  }
}
