import { NextRequest } from "next/server";
import { verifyAccess } from "./jwt/jwt";

export function getPartnerFromRequest(
  req: NextRequest,
): { id: string; role: string } | null {
  try {
    const token = req.cookies.get("accessToken")?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyAccess(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: NextRequest) {
  const partner = getPartnerFromRequest(req);

  if (!partner) {
    throw new Error("Unauthorized");
  }

  return partner;
}
