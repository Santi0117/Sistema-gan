"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// DEV: credenciales hardcoded mientras no haya DB conectada
const DEV_USERS = [
  {
    email: "admin@sistemagan.cr",
    password: "admin123",
    userId: "dev-admin",
    nombre: "Administrador",
    rol: "ADMIN" as const,
    empresaId: "dev-empresa",
  },
  {
    email: "vendedor@sistemagan.cr",
    password: "vendedor123",
    userId: "dev-vendedor",
    nombre: "Vendedor Demo",
    rol: "VENDEDOR" as const,
    empresaId: "dev-empresa",
  },
];

export async function loginAction(_prev: { error: string }, formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;

  const user = DEV_USERS.find((u) => u.email === email && u.password === password);

  if (!user) {
    return { error: "Correo o contraseña incorrectos" as string };
  }

  const session = await getSession();
  session.userId = user.userId;
  session.nombre = user.nombre;
  session.email = user.email;
  session.rol = user.rol;
  session.empresaId = user.empresaId;
  session.isLoggedIn = true;
  await session.save();

  redirect("/control");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
