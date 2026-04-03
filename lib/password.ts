import crypto from "crypto";

export function verifyDjangoPassword(
  rawPassword: string,
  djangoHash: string,
): boolean {
  try {
    const parts = djangoHash.split("$");

    if (parts.length !== 4) {
      console.error("Invalid Django password format");
      return false;
    }

    const [algorithm, iterations, salt, expectedHash] = parts;

    if (algorithm !== "pbkdf2_sha256") {
      console.error(`Unsupported algorithm: ${algorithm}`);
      return false;
    }

    const hash = crypto.pbkdf2Sync(
      rawPassword,
      salt,
      parseInt(iterations),
      32,
      "sha256",
    );

    const computedHash = hash.toString("base64");

    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(computedHash),
    );
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

export function hashDjangoPassword(rawPassword: string): string {
  const iterations = 260000;
  const salt = crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 22);
  const hash = crypto.pbkdf2Sync(rawPassword, salt, iterations, 32, "sha256");
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString("base64")}`;
}
