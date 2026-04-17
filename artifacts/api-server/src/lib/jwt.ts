import crypto from "node:crypto";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "pasabay-dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "pasabay-dev-refresh-secret";

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string, secret: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

function createToken(payload: object, secret: string, expiresInSec: number): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSec,
  }));
  return `${header}.${body}.${sign(`${header}.${body}`, secret)}`;
}

function decodeToken(token: string, secret: string): JWTPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [header, body, sig] = parts;
  const expected = sign(`${header}.${body}`, secret);
  const actualBuf = Buffer.from(sig, "base64url");
  const expectedBuf = Buffer.from(expected, "base64url");
  if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) {
    throw new Error("Invalid signature");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as JWTPayload;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  return payload;
}

export async function signAccessToken(p: JWTPayload): Promise<string> {
  return createToken({ sub: p.sub, email: p.email, role: p.role }, ACCESS_SECRET, 15 * 60);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  return decodeToken(token, ACCESS_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
