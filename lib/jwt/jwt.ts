import jwt from "jsonwebtoken";

export interface JwtPayload {
  _id: string;
  role: string;
}
export interface JwtToken {
  id: string;
  role: string;
}

export function signAccessToken(user: JwtPayload) {
  const secret = process.env.ACCESS_SECRET;
  if (!secret) {
    throw new Error("ACCESS_SECRET is not defined in environment variables");
  }
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    secret,
    { expiresIn: "15m" },
  );
}

export function signRefreshToken(user: JwtPayload) {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) {
    throw new Error("REFRESH_SECRET is not defined in environment variables");
  }
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    secret,
    { expiresIn: "15d" },
  );
}

export function verifyAccess(token: string) {
  const secret = process.env.ACCESS_SECRET;
  if (!secret) {
    throw new Error("ACCESS_SECRET is not defined in environment variables");
  }
  return jwt.verify(token, secret) as JwtToken;
}

export function verifyRefresh(token: string): JwtToken {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) {
    throw new Error("REFRESH_SECRET is not defined in environment variables");
  }
  return jwt.verify(token, secret) as JwtToken;
}

export function generateTokens(_id: string, role: string) {
  const jwtPayload = { _id, role };
  const accessToken = signAccessToken(jwtPayload);
  const refreshToken = signRefreshToken(jwtPayload);
  return { accessToken, refreshToken };
}
