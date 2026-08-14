"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  requerirDocente,
  verificarPropietarioPlanificacion,
  verificarPropietarioUnidadDidactica,
} from "@/lib/auth";
import { unidadDidacticaSchema } from "@/lib/schemas/planificacion.schema";
import { aFecha, aTextoONull } from "@/lib/schemas/common";
import {
  exito,
  fallo,
  mensajeDeError,
  validarPayload,
  type ResultadoAccion,
} from "@/lib/form/action-result";

type PayloadUnidad = {
  titulo: string;
  objetivo: string | null;
  fechaInicio: Date;
  fechaFin: Date;
};

/**
 * Dos unidades del mismo año no pueden solaparse: la validación necesita la base
 * de datos, así que vive en la acción y no en el esquema Zod.
 */
async function hayUnidadSuperpuesta(
  planificacionId: string,
  fechaInicio: Date,
  fechaFin: Date,
  unidadId?: string
) {
  const conflicto = await db.unidadDidactica.findFirst({
    where: {
      planificacionId,
      ...(unidadId && { NOT: { id: unidadId } }),
      AND: [{ fechaInicio: { lte: fechaFin } }, { fechaFin: { gte: fechaInicio } }],
    },
  });

  return Boolean(conflicto);
}

const MENSAJE_SUPERPOSICION = "Ya existe una unidad didáctica en ese período.";

export async function crearUnidadDidactica(
  planificacionId: string,
  cursoId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioPlanificacion(planificacionId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta planificación"));
  }

  const validado = validarPayload(unidadDidacticaSchema, input);
  if (!validado.ok) return validado;

  const payload: PayloadUnidad = {
    titulo: validado.data.titulo,
    objetivo: aTextoONull(validado.data.objetivo),
    fechaInicio: aFecha(validado.data.fechaInicio),
    fechaFin: aFecha(validado.data.fechaFin),
  };

  if (await hayUnidadSuperpuesta(planificacionId, payload.fechaInicio, payload.fechaFin)) {
    return fallo(MENSAJE_SUPERPOSICION, { fechaInicio: MENSAJE_SUPERPOSICION });
  }

  const unidad = await db.unidadDidactica.create({
    data: { planificacionId, ...payload },
  });

  revalidatePath(`/cursos/${cursoId}`);
  return exito(undefined, `/cursos/${cursoId}/unidades/${unidad.id}`);
}

export async function listarUnidadesDidacticas(planificacionId: string) {
  return db.unidadDidactica.findMany({
    where: { planificacionId },
    orderBy: { fechaInicio: "asc" },
    include: { _count: { select: { clases: true } } },
  });
}

export async function obtenerUnidadDidactica(unidadDidacticaId: string) {
  return db.unidadDidactica.findUnique({
    where: { id: unidadDidacticaId },
    include: {
      planificacion: true,
      clases: { orderBy: { fecha: "asc" } },
    },
  });
}

export async function actualizarUnidadDidactica(
  unidadDidacticaId: string,
  cursoId: string,
  planificacionId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioUnidadDidactica(unidadDidacticaId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta unidad didáctica"));
  }

  const validado = validarPayload(unidadDidacticaSchema, input);
  if (!validado.ok) return validado;

  const payload: PayloadUnidad = {
    titulo: validado.data.titulo,
    objetivo: aTextoONull(validado.data.objetivo),
    fechaInicio: aFecha(validado.data.fechaInicio),
    fechaFin: aFecha(validado.data.fechaFin),
  };

  if (
    await hayUnidadSuperpuesta(
      planificacionId,
      payload.fechaInicio,
      payload.fechaFin,
      unidadDidacticaId
    )
  ) {
    return fallo(MENSAJE_SUPERPOSICION, { fechaInicio: MENSAJE_SUPERPOSICION });
  }

  await db.unidadDidactica.update({
    where: { id: unidadDidacticaId },
    data: payload,
  });

  revalidatePath(`/cursos/${cursoId}`);
  revalidatePath(`/cursos/${cursoId}/unidades/${unidadDidacticaId}`);
  return exito();
}

export async function eliminarUnidadDidactica(unidadDidacticaId: string, cursoId: string) {
  const docente = await requerirDocente();
  await verificarPropietarioUnidadDidactica(unidadDidacticaId, docente.id);

  await db.unidadDidactica.delete({ where: { id: unidadDidacticaId } });

  revalidatePath(`/cursos/${cursoId}`);
}
