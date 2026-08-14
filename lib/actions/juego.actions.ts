"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { juegoSchema, separarMateriales } from "@/lib/schemas/juego.schema";
import { aTextoONull } from "@/lib/schemas/common";
import { exito, fallo, validarPayload, type ResultadoAccion } from "@/lib/form/action-result";

export async function crearJuego(input: unknown): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  const validado = validarPayload(juegoSchema, input);
  if (!validado.ok) return validado;

  const { nombre, descripcion, rangoEtario, categoria, estrategia, materiales } = validado.data;

  await db.juego.create({
    data: {
      nombre,
      descripcion: aTextoONull(descripcion),
      rangoEtario,
      categoria,
      estrategia,
      materiales: separarMateriales(materiales),
      autorId: docente.id,
    },
  });

  revalidatePath("/juegos");
  return exito(undefined, "/juegos?created=true");
}

export async function actualizarJuego(juegoId: string, input: unknown): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  const juegoActual = await db.juego.findUnique({ where: { id: juegoId } });
  if (!juegoActual) {
    return fallo("El juego no existe");
  }

  if (juegoActual.autorId !== docente.id) {
    return fallo("No tenés permisos para editar este juego");
  }

  const validado = validarPayload(juegoSchema, input);
  if (!validado.ok) return validado;

  const { nombre, descripcion, rangoEtario, categoria, estrategia, materiales } = validado.data;

  await db.juego.update({
    where: { id: juegoId },
    data: {
      nombre,
      descripcion: aTextoONull(descripcion),
      rangoEtario,
      categoria,
      estrategia,
      materiales: separarMateriales(materiales),
    },
  });

  // Sin `redirectTo`: la edición pasa dentro de la lista, y navegar perdería
  // los filtros que la docente tenía puestos.
  revalidatePath("/juegos");
  return exito();
}

export async function eliminarJuego(juegoId: string) {
  const docente = await requerirDocente();

  const juegoActual = await db.juego.findUnique({ where: { id: juegoId } });
  if (!juegoActual) {
    throw new Error("El juego no existe");
  }

  if (juegoActual.autorId !== docente.id) {
    throw new Error("No tienes permisos para eliminar este juego");
  }

  await db.claseActividad.updateMany({
    where: { juegoId },
    data: { juegoId: null },
  });

  await db.juego.delete({ where: { id: juegoId } });

  revalidatePath("/juegos");
  return { ok: true };
}
