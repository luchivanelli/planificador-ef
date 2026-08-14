"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { EstadoAsistencia } from "@prisma/client";

export async function marcarAsistencia(
  cursoId: string,
  alumnoId: string,
  fecha: string,
  estado: EstadoAsistencia,
  claseDiariaId?: string
) {
  const fechaDate = new Date(fecha);

  const asistenciaExistente = await db.asistencia.findFirst({
    where: {
      cursoId,
      alumnoId,
      fecha: fechaDate,
      OR: claseDiariaId ? [{ claseDiariaId }, { claseDiariaId: null }] : [{ claseDiariaId: null }],
    },
  });

  if (asistenciaExistente) {
    await db.asistencia.update({
      where: { id: asistenciaExistente.id },
      data: { estado, claseDiariaId },
    });
  } else {
    try {
      await db.asistencia.create({
        data: { cursoId, alumnoId, fecha: fechaDate, estado, claseDiariaId },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint failed")) {
        const registroDuplicado = await db.asistencia.findFirst({
          where: { cursoId, alumnoId, fecha: fechaDate },
        });

        if (registroDuplicado) {
          await db.asistencia.update({
            where: { id: registroDuplicado.id },
            data: { estado, claseDiariaId },
          });
        }
      } else {
        throw error;
      }
    }
  }

  revalidatePath(`/cursos/${cursoId}`);
  if (claseDiariaId) {
    revalidatePath(`/cursos/${cursoId}/clase/${claseDiariaId}`);
  }
}
