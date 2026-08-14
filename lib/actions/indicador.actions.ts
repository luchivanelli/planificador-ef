"use server";

import { revalidatePath } from "next/cache";
import type { ValorIndicador } from "@prisma/client";
import { db } from "@/lib/db";
import { requerirDocente, verificarPropietarioCurso } from "@/lib/auth";
import { indicadorSchema, indicadoresClaseSchema } from "@/lib/schemas/indicador.schema";
import {
  exito,
  fallo,
  mensajeDeError,
  validarPayload,
  type ResultadoAccion,
} from "@/lib/form/action-result";

function rutaEvaluacion(cursoId: string, claseId: string) {
  return `/cursos/${cursoId}/clase/${claseId}/evaluacion`;
}

/**
 * `claseId` llega desde la URL, así que se confirma que la clase cuelgue de
 * este curso antes de escribir nada.
 */
async function claseDelCurso(claseId: string, cursoId: string) {
  return db.claseDiaria.findFirst({
    where: { id: claseId, unidadDidactica: { planificacion: { cursoId } } },
    select: { id: true },
  });
}

export async function crearIndicador(
  cursoId: string,
  claseId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(indicadorSchema, input);
  if (!validado.ok) return validado;

  await db.indicador.create({
    data: { docenteId: docente.id, titulo: validado.data.titulo },
  });

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return exito();
}

export async function renombrarIndicador(
  indicadorId: string,
  cursoId: string,
  claseId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  const indicador = await db.indicador.findUnique({
    where: { id: indicadorId },
    select: { docenteId: true },
  });
  if (!indicador) {
    return fallo("El indicador no existe");
  }
  if (indicador.docenteId !== docente.id) {
    return fallo("No tenés permiso sobre este indicador");
  }

  const validado = validarPayload(indicadorSchema, input);
  if (!validado.ok) return validado;

  await db.indicador.update({
    where: { id: indicadorId },
    data: { titulo: validado.data.titulo },
  });

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return exito();
}

export async function eliminarIndicador(indicadorId: string, cursoId: string, claseId: string) {
  const docente = await requerirDocente();

  const indicador = await db.indicador.findUnique({
    where: { id: indicadorId },
    select: { docenteId: true },
  });
  if (!indicador) {
    throw new Error("El indicador no existe");
  }
  if (indicador.docenteId !== docente.id) {
    throw new Error("No tenés permiso sobre este indicador");
  }

  // Las evaluaciones del indicador caen con él (onDelete: Cascade).
  await db.indicador.delete({ where: { id: indicadorId } });

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return { ok: true };
}

export async function guardarIndicadoresDeClase(
  cursoId: string,
  claseId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(indicadoresClaseSchema, input);
  if (!validado.ok) return validado;

  const { valores } = validado.data;

  if (!(await claseDelCurso(claseId, cursoId))) {
    return fallo("La clase no existe o no pertenece a este curso");
  }

  const propios = await db.indicador.findMany({
    where: { docenteId: docente.id },
    select: { id: true },
  });
  const idsPropios = new Set(propios.map((indicador) => indicador.id));

  const idsEnviados = Object.keys(valores);
  if (idsEnviados.some((id) => !idsPropios.has(id))) {
    return fallo("Hay indicadores que no son tuyos");
  }

  // Sin responder no se guarda como valor: se borra la evaluación que hubiera.
  const sinResponder = idsEnviados.filter((id) => valores[id] === "");
  const respondidos = idsEnviados
    .map((id) => ({ indicadorId: id, valor: valores[id] }))
    .filter((entrada): entrada is { indicadorId: string; valor: ValorIndicador } => entrada.valor !== "");

  await db.$transaction([
    db.evaluacionIndicador.deleteMany({
      where: { claseId, indicadorId: { in: sinResponder } },
    }),
    ...respondidos.map(({ indicadorId, valor }) =>
      db.evaluacionIndicador.upsert({
        where: { indicadorId_claseId: { indicadorId, claseId } },
        create: { indicadorId, claseId, valor },
        update: { valor },
      })
    ),
  ]);

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return exito();
}
