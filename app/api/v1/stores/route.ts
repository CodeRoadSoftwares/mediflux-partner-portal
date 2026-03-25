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

    console.log("Fetching stores for partner:", partnerUserId);
    console.log("Partner ID type:", typeof partnerUserId);

    const filter: any = {};

    if (partnerUserId) {
      try {
        const objectId = new Types.ObjectId(partnerUserId);
        filter.partnerUserId = objectId;
        console.log("Converted to ObjectId:", objectId);
        console.log("Filter partnerUserId type:", typeof filter.partnerUserId);
        console.log(
          "Filter partnerUserId instanceof ObjectId:",
          filter.partnerUserId instanceof Types.ObjectId,
        );
      } catch (e) {
        console.log("ObjectId conversion failed, using string");
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

    console.log("Filter keys:", Object.keys(filter));
    console.log("About to query with filter...");

    const total = await Store.countDocuments(filter);
    console.log("Total stores found:", total);

    const stores = await Store.find(filter)
      .select("-password")
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    console.log("Stores returned:", stores.length);

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
    console.log(
      "All cookies:",
      cookies.map((c) => c.name),
    );
    console.log("Partner from token:", partner);

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

    console.log("Calling external API:", `${externalApiUrl}/stores/`);
    console.log("With API Key:", apiKey.substring(0, 10) + "...");

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
