import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type UserRole = "ADMIN" | "VENDEDOR" | "CONTADOR";

export interface SessionData {
  userId: string;
  nombre: string;
  email: string;
  rol: UserRole;
  empresaId: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.AUTH_SECRET ?? "cambia-esto-a-un-secreto-de-al-menos-32-caracteres-largo",
  cookieName: "sg_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
