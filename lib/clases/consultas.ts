import type { Ciclo, Nivel } from "@prisma/client";
import { db } from "@/lib/db";
import { rangoDelDia } from "@/lib/schemas/common";

/** La hora local actual como "HH:MM", comparable contra la columna `horaFin`. */
function horaDeReloj(ahora: Date) {
  const hh = String(ahora.getHours()).padStart(2, "0");
  const mm = String(ahora.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * "El horario ya pasó", resuelto entero en la base.
 *
 * `horaFin` se guarda como "HH:MM" con cero adelante (lo garantiza el regex del
 * schema), así que su orden alfabético coincide con el cronológico y alcanza
 * con un `lt` de texto. Los `horaFin` nulos quedan fuera de la segunda rama, que
 * es lo que queremos: de una clase de hoy sin hora de fin no sabemos si terminó.
 */
function horarioVencido(ahora: Date) {
  const { inicio: hoyInicio } = rangoDelDia(ahora);
  return [
    { fecha: { lt: hoyInicio } },
    { fecha: hoyInicio, horaFin: { lt: horaDeReloj(ahora) } },
  ];
}

/**
 * Cierra las clases que ya terminaron **y tienen asistencia cargada**: ésa es la
 * única señal que prueba que la clase se dio. Las que vencieron sin asistencia
 * quedan en `planificada` y salen por `clasesPendientesDeAsistencia`, para que
 * la docente decida si se dictó o se suspendió; marcarlas solas inventaría datos.
 *
 * Es idempotente y se resuelve en una sola consulta, sin traer filas.
 */
export async function marcarClasesDictadas(docenteId: string) {
  const ahora = new Date();

  const { count } = await db.claseDiaria.updateMany({
    where: {
      estado: "planificada",
      asistencias: { some: {} },
      OR: horarioVencido(ahora),
      unidadDidactica: { planificacion: { curso: { docenteId } } },
    },
    data: { estado: "dictada" },
  });

  return count;
}

/**
 * Clases de días anteriores que quedaron sin cerrar: ya pasaron, nadie cargó
 * asistencia y siguen en `planificada`. Las de hoy quedan afuera a propósito,
 * porque el dashboard ya las muestra en "Clases de hoy" con su recordatorio.
 */
export async function clasesPendientesDeAsistencia(docenteId: string) {
  const { inicio: hoyInicio } = rangoDelDia();

  return db.claseDiaria.findMany({
    where: {
      estado: "planificada",
      asistencias: { none: {} },
      fecha: { lt: hoyInicio },
      unidadDidactica: { planificacion: { curso: { docenteId } } },
    },
    select: {
      id: true,
      fecha: true,
      horaInicio: true,
      horaFin: true,
      objetivoClase: true,
      unidadDidactica: {
        select: {
          titulo: true,
          planificacion: { select: { curso: { select: { id: true, nombre: true } } } },
        },
      },
    },
    orderBy: { fecha: "desc" },
  });
}

export type ClasePendiente = Awaited<ReturnType<typeof clasesPendientesDeAsistencia>>[number];

/**
 * Los ejes NAP que le corresponden a un curso según su nivel y ciclo: son los
 * que ofrecen los formularios de clase. Si la base todavía no está sembrada
 * (`npm run db:seed`) la lista viene vacía y sólo queda la opción "Otro".
 */
export function ejesDelCurso(nivel: Nivel, ciclo: Ciclo) {
  return db.ejeNap.findMany({
    where: { nivel, ciclo },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
