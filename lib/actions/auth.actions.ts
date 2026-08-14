"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { loginSchema, registroSchema } from "@/lib/schemas/auth.schema";
import { exito, fallo, validarPayload, type ResultadoAccion } from "@/lib/form/action-result";

export async function registrarDocente(input: unknown): Promise<ResultadoAccion> {
  const validado = validarPayload(registroSchema, input);
  if (!validado.ok) return validado;

  const { nombre, apellido, email, password } = validado.data;

  const existente = await db.docente.findUnique({ where: { email } });
  if (existente) {
    return fallo("Ya existe una cuenta con ese email.", {
      email: "Ya existe una cuenta con ese email.",
    });
  }

  const passwordHash = await hashPassword(password);
  const docente = await db.docente.create({
    data: { nombre, apellido, email, passwordHash },
  });

  await createSession(docente.id);
  return exito(undefined, "/");
}

export async function iniciarSesion(input: unknown): Promise<ResultadoAccion> {
  const validado = validarPayload(loginSchema, input);
  if (!validado.ok) return validado;

  const { email, password } = validado.data;

  const docente = await db.docente.findUnique({ where: { email } });
  if (!docente) {
    return fallo("Email o contraseña incorrectos.");
  }

  const valido = await verifyPassword(password, docente.passwordHash);
  if (!valido) {
    return fallo("Email o contraseña incorrectos.");
  }

  await createSession(docente.id);
  return exito(undefined, "/");
}

export async function cerrarSesion() {
  await destroySession();
  redirect("/login");
}
