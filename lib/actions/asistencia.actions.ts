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

  // `aFecha` es la única conversión de fecha del proyecto: deja medianoche UTC,
  // igual que las fechas ya guardadas (ver `lib/schemas/common`).
  // El formato se valida más abajo, en el orden de siempre; si no es válido la
  // fecha que sale de acá no se usa nunca.
  const fechaDate = FORMATO_FECHA.test(fecha) ? aFecha(fecha) : null;

  // Las comprobaciones y la búsqueda del registro salen todas juntas.
  //
  // Es la acción que más se usa de la app: la docente toca un botón por alumno
  // y antes cada toque encadenaba cinco viajes a la base esperando uno al otro.
  // Ahora salen en paralelo y el toque tarda lo que tarda el más lento.
  //
  // `allSettled` y no `Promise.all` a propósito: con `all` el error que llega
  // es el de la consulta que falla primero en el tiempo, y acá el orden de los
  // mensajes tiene que ser siempre el mismo, el de abajo.
  const [propietario, enElCurso, claseDelCurso, existente] = await Promise.allSettled([
    verificarPropietarioCurso(cursoId, docente.id),

    db.cursoAlumno.findUnique({
      where: { cursoId_alumnoId: { cursoId, alumnoId } },
      select: { alumnoId: true },
    }),

    claseDiariaId
      ? db.claseDiaria.findFirst({
          where: { id: claseDiariaId, unidadDidactica: { planificacion: { cursoId } } },
          select: { id: true },
        })
      : Promise.resolve(null),

    fechaDate
      ? db.asistencia.findFirst({
          where: {
            cursoId,
            alumnoId,
            fecha: fechaDate,
            OR: claseDiariaId
              ? [{ claseDiariaId }, { claseDiariaId: null }]
              : [{ claseDiariaId: null }],
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  // El mismo orden de siempre: primero el permiso sobre el curso, después el
  // formato de lo que llegó, y recién ahí la pertenencia del alumno y la clase.
  if (propietario.status === "rejected") throw propietario.reason;

  if (!fechaDate) {
    throw new Error("Fecha de asistencia inválida");
  }

  if (!Object.values(EstadoAsistencia).includes(estado)) {
    throw new Error("Estado de asistencia inválido");
  }

  if (enElCurso.status === "rejected") throw enElCurso.reason;
  if (!enElCurso.value) {
    throw new Error("El alumno no pertenece a este curso");
  }

  if (claseDelCurso.status === "rejected") throw claseDelCurso.reason;
  if (claseDiariaId && !claseDelCurso.value) {
    throw new Error("La clase no pertenece a este curso");
  }

  if (existente.status === "rejected") throw existente.reason;
  const asistenciaExistente = existente.value;

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
          select: { id: true },
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
