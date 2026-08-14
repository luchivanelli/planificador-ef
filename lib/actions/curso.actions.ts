"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requerirDocente, verificarPropietarioCurso } from "@/lib/auth";
import { alumnoSchema, cursoSchema, observacionesMedicasSchema } from "@/lib/schemas/curso.schema";
import { aFecha, aTextoONull } from "@/lib/schemas/common";
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

  const { nombre, apellido, fechaNacimiento, dni, contactoEmergencia } = validado.data;

  const existente = await db.alumno.findFirst({ where: { dni } });
  if (existente) {
    return fallo("Ya existe un alumno con ese DNI", { dni: "Ya existe un alumno con ese DNI" });
  }

  try {
    const alumno = await db.alumno.create({
      data: {
        nombre,
        apellido,
        fechaNacimiento: aFecha(fechaNacimiento),
        dni,
        contactoEmergencia: aTextoONull(contactoEmergencia),
      },
    });

    await db.cursoAlumno.create({
      data: { cursoId, alumnoId: alumno.id },
    });
  } catch (err) {
    // El índice único de DNI puede saltar igual si dos altas llegan a la vez.
    const e = err as { code?: string };
    if (e?.code === "P2002") {
      return fallo("Ya existe un alumno con ese DNI", { dni: "Ya existe un alumno con ese DNI" });
    }
    throw err;
  }

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

  const { nombre, apellido, fechaNacimiento, dni, contactoEmergencia } = validado.data;

  try {
    await db.alumno.update({
      where: { id: alumnoId },
      data: {
        nombre,
        apellido,
        fechaNacimiento: aFecha(fechaNacimiento),
        dni,
        contactoEmergencia: aTextoONull(contactoEmergencia),
      },
    });
  } catch (err) {
    const e = err as { code?: string };
    if (e?.code === "P2002") {
      return fallo("Ya existe un alumno con ese DNI", { dni: "Ya existe un alumno con ese DNI" });
    }
    throw err;
  }

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

export async function guardarObservacionesMedicas(
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

  const validado = validarPayload(observacionesMedicasSchema, input);
  if (!validado.ok) return validado;

  await db.alumno.update({
    where: { id: alumnoId },
    data: {
      observacionesMedicas: aTextoONull(validado.data.observacionesMedicas),
    },
  });

  revalidatePath(`/cursos/${cursoId}`);
  return exito();
}
