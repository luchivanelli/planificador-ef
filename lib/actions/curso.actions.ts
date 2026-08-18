"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requerirDocente, verificarPropietarioCurso } from "@/lib/auth";
import {
  alumnoSchema,
  cursoSchema,
  diagnosticoGrupalSchema,
  observacionesAlumnoSchema,
} from "@/lib/schemas/curso.schema";
import { aTextoONull } from "@/lib/schemas/common";
import {
  exito,
  fallo,
  mensajeDeError,
  validarPayload,
  type ResultadoAccion,
} from "@/lib/form/action-result";

export async function crearCurso(input: unknown): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  const validado = validarPayload(cursoSchema, input);
  if (!validado.ok) return validado;

  const { institucion: institucionNombre, nombre, nivel, ciclo, turno, anioLectivo } = validado.data;

  let institucion = await db.institucion.findFirst({
    where: { nombre: institucionNombre },
  });

  if (!institucion) {
    institucion = await db.institucion.create({
      data: {
        nombre: institucionNombre,
        provincia: docente.provincia || "Sin especificar",
        localidad: "Sin especificar",
        tipo: "publica",
      },
    });
  }

  await db.docenteInstitucion.upsert({
    where: { docenteId_institucionId: { docenteId: docente.id, institucionId: institucion.id } },
    update: {},
    create: { docenteId: docente.id, institucionId: institucion.id },
  });

  const curso = await db.curso.create({
    data: {
      institucionId: institucion.id,
      docenteId: docente.id,
      nombre,
      nivel,
      ciclo,
      turno,
      anioLectivo,
    },
  });

  revalidatePath("/");
  revalidatePath("/cursos");
  return exito(undefined, `/cursos/${curso.id}`);
}

export async function agregarAlumno(cursoId: string, input: unknown): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(alumnoSchema, input);
  if (!validado.ok) return validado;

  const { nombre, apellido, contactoEmergencia } = validado.data;

  const alumno = await db.alumno.create({
    data: {
      nombre,
      apellido,
      contactoEmergencia: aTextoONull(contactoEmergencia),
    },
  });

  await db.cursoAlumno.create({
    data: { cursoId, alumnoId: alumno.id },
  });

  revalidatePath(`/cursos/${cursoId}`);
  return exito();
}

export async function actualizarAlumno(
  alumnoId: string,
  cursoId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(alumnoSchema, input);
  if (!validado.ok) return validado;

  const { nombre, apellido, contactoEmergencia } = validado.data;

  await db.alumno.update({
    where: { id: alumnoId },
    data: {
      nombre,
      apellido,
      contactoEmergencia: aTextoONull(contactoEmergencia),
    },
  });

  revalidatePath(`/cursos/${cursoId}`);
  return exito();
}

export async function eliminarAlumno(alumnoId: string, cursoId: string) {
  const docente = await requerirDocente();
  await verificarPropietarioCurso(cursoId, docente.id);

  if (!alumnoId) {
    throw new Error("Faltan datos del alumno");
  }

  await db.alumno.delete({
    where: { id: alumnoId },
  });

  revalidatePath(`/cursos/${cursoId}`);
}

export async function guardarObservacionesAlumno(
  alumnoId: string,
  cursoId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(observacionesAlumnoSchema, input);
  if (!validado.ok) return validado;

  await db.alumno.update({
    where: { id: alumnoId },
    data: {
      observaciones: aTextoONull(validado.data.observaciones),
    },
  });

  revalidatePath(`/cursos/${cursoId}`);
  return exito();
}

export async function guardarDiagnosticoGrupal(
  cursoId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(diagnosticoGrupalSchema, input);
  if (!validado.ok) return validado;

  await db.curso.update({
    where: { id: cursoId },
    data: { diagnosticoGrupal: aTextoONull(validado.data.diagnosticoGrupal) },
  });

  revalidatePath(`/cursos/${cursoId}`);
  return exito();
}
