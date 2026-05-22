import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const COOKIE = "admin_session";
const ALG = "HS256";

function secret() {
  const s = process.env.ADMIN_PASSWORD_HASH || "fallback-secret-change-me";
  return new TextEncoder().encode(s + "_jwt_salt");
}

export async function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const stored = process.env.ADMIN_PASSWORD_HASH || "";
  if (!expectedEmail || !stored) return false;
  if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) return false;
  if (stored.startsWith("$2")) {
    return await bcrypt.compare(password, stored);
  }
  // plain fallback
  return password === stored;
}

export async function issueAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function isAdmin(): Promise<boolean> {
  const t = getCookie(COOKIE);
  if (!t) return false;
  try {
    const { payload } = await jwtVerify(t, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function clearAdminSession() {
  deleteCookie(COOKIE, { path: "/" });
}
