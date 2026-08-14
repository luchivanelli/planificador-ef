"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requerirDocente, verificarPropietarioCurso, verificarPropietarioPlanificacion } from "@/lib/auth";
import { planificacionSchema } from "@/lib/schemas/planificacion.schema";
import { aTextoONull } from "@/lib/schemas/common";
import {
  exito,
  fallo,
  mensajeDeError,
  validarPayload,
  type ResultadoAccion,
} from "@/lib/form/action-result";

const MENSAJE_ANIO_DUPLICADO = "Ya existe una planificación tuya para ese año en este curso.";

export async function crearPlanificacion(cursoId: string, input: unknown): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(planificacionSchema, input);
  if (!validado.ok) return validado;

  const { anio, objetivos } = validado.data;

  try {
    await db.planificacion.create({
      data: {
        docenteId: docente.id,
        cursoId,
        anio,
        objetivos: aTextoONull(objetivos),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fallo(MENSAJE_ANIO_DUPLICADO, { anio: MENSAJE_ANIO_DUPLICADO });
    }

    throw error;
  }

  revalidatePath(`/cursos/${cursoId}`);
  return exito(undefined, `/cursos/${cursoId}`);
}

export async function listarPlanificaciones(cursoId: string) {
  return db.planificacion.findMany({
    where: { cursoId },
    orderBy: { anio: "desc" },
    include: {
      unidades: {
        orderBy: { fechaInicio: "asc" },
        select: { id: true, titulo: true, fechaInicio: true, fechaFin: true },
      },
    },
  });
}

export async function obtenerPlanificacion(planificacionId: string) {
  return db.planificacion.findUnique({
    where: { id: planificacionId },
    include: { curso: true },
  });
}

export async function actualizarPlanificacion(
  planificacionId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioPlanificacion(planificacionId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta planificación"));
  }

  const validado = validarPayload(planificacionSchema, input);
  if (!validado.ok) return validado;

  const { anio, objetivos } = validado.data;

  let actualizada;
  try {
    actualizada = await db.planificacion.update({
      where: { id: planificacionId },
      data: {
        anio,
        objetivos: aTextoONull(objetivos),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fallo(MENSAJE_ANIO_DUPLICADO, { anio: MENSAJE_ANIO_DUPLICADO });
    }

    throw error;
  }

  revalidatePath(`/cursos/${actualizada.cursoId}`);
  return exito(undefined, `/cursos/${actualizada.cursoId}?updatedPlanificacion=true`);
}

export async function eliminarPlanificacion(planificacionId: string, cursoId: string) {
  const docente = await requerirDocente();
  await verificarPropietarioPlanificacion(planificacionId, docente.id);

  await db.planificacion.delete({ where: { id: planificacionId } });

  // Sin redirect: esta acción se invoca desde ConfirmActionButton (cliente),
  // que refresca la ruta actual. Un redirect acá se propagaría como NEXT_REDIRECT.
  revalidatePath(`/cursos/${cursoId}`);
}
