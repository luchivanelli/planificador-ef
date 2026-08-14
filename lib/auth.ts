import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { db } from "./db";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "pef_session";
const SESSION_DURATION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const DOCENTE_SEGURO_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  provincia: true,
  rol: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createSession(docenteId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.sesion.create({
    data: { token: hashToken(token), docenteId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.sesion.deleteMany({ where: { token: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getDocenteActual() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sesion = await db.sesion.findUnique({
    where: { token: hashToken(token) },
    select: {
      expiresAt: true,
      docente: { select: DOCENTE_SEGURO_SELECT },
    },
  });

  if (!sesion) return null;

  if (sesion.expiresAt < new Date()) {
    await db.sesion.deleteMany({ where: { token: hashToken(token) } });
    return null;
  }

  return sesion.docente;
}

export async function requerirDocente() {
  const docente = await getDocenteActual();
  if (!docente) redirect("/login");
  return docente;
}

export async function verificarPropietarioCurso(cursoId: string, docenteId: string) {
  const curso = await db.curso.findUnique({
    where: { id: cursoId },
    select: { docenteId: true },
  });
  if (!curso || curso.docenteId !== docenteId) {
    throw new Error("No tenés permiso sobre este curso");
  }
}

export async function verificarPropietarioPlanificacion(planificacionId: string, docenteId: string) {
  const planificacion = await db.planificacion.findUnique({
    where: { id: planificacionId },
    select: { docenteId: true },
  });
  if (!planificacion || planificacion.docenteId !== docenteId) {
    throw new Error("No tenés permiso sobre esta planificación");
  }
}

export async function verificarPropietarioUnidadDidactica(unidadDidacticaId: string, docenteId: string) {
  const unidad = await db.unidadDidactica.findUnique({
    where: { id: unidadDidacticaId },
    select: { planificacion: { select: { docenteId: true } } },
  });
  if (!unidad || unidad.planificacion.docenteId !== docenteId) {
    throw new Error("No tenés permiso sobre esta unidad didáctica");
  }
}

export async function verificarPropietarioClase(claseDiariaId: string, docenteId: string) {
  const clase = await db.claseDiaria.findUnique({
    where: { id: claseDiariaId },
    select: { unidadDidactica: { select: { planificacion: { select: { docenteId: true } } } } },
  });
  if (!clase || clase.unidadDidactica.planificacion.docenteId !== docenteId) {
    throw new Error("No tenés permiso sobre esta clase");
  }
}

export async function verificarPropietarioActividad(actividadId: string, docenteId: string) {
  const actividad = await db.claseActividad.findUnique({
    where: { id: actividadId },
    select: {
      claseDiaria: {
        select: { unidadDidactica: { select: { planificacion: { select: { docenteId: true } } } } },
      },
    },
  });
  if (!actividad || actividad.claseDiaria.unidadDidactica.planificacion.docenteId !== docenteId) {
    throw new Error("No tenés permiso sobre esta actividad");
  }
}