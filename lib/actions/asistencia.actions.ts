"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { EstadoAsistencia } from "@prisma/client";
import { requerirDocente, verificarPropietarioCurso } from "@/lib/auth";
import { aFecha } from "@/lib/schemas/common";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function marcarAsistencia(
  cursoId: string,
  alumnoId: string,
  fecha: string,
  estado: EstadoAsistencia,
  claseDiariaId?: string
) {
  // Todo lo que llega es del cliente: el curso tiene que ser de esta docente, y
  // el alumno y la clase tienen que colgar de ese curso. Sin esto, cualquiera
  // podía escribir asistencia en el curso de otra persona.
  const docente = await requerirDocente();
  await verificarPropietarioCurso(cursoId, docente.id);

  if (!FORMATO_FECHA.test(fecha)) {
    throw new Error("Fecha de asistencia inválida");
  }

  if (!Object.values(EstadoAsistencia).includes(estado)) {
    throw new Error("Estado de asistencia inválido");
  }

  const enElCurso = await db.cursoAlumno.findUnique({
    where: { cursoId_alumnoId: { cursoId, alumnoId } },
    select: { alumnoId: true },
  });
  if (!enElCurso) {
    throw new Error("El alumno no pertenece a este curso");
  }

  if (claseDiariaId) {
    const deEsteCurso = await db.claseDiaria.findFirst({
      where: { id: claseDiariaId, unidadDidactica: { planificacion: { cursoId } } },
      select: { id: true },
    });
    if (!deEsteCurso) {
      throw new Error("La clase no pertenece a este curso");
    }
  }

  // `aFecha` es la única conversión de fecha del proyecto: deja medianoche UTC,
  // igual que las fechas ya guardadas (ver `lib/schemas/common`).
  const fechaDate = aFecha(fecha);

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
