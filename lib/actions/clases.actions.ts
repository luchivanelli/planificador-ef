"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { EstadoClase, MotivoCancelacion } from "@prisma/client";
import { actividadSchema, claseSchema, type ClaseInput } from "@/lib/schemas/clase.schema";
import { aFecha, aTextoONull } from "@/lib/schemas/common";
import { EJE_OTRO } from "@/lib/types";
import {
  requerirDocente,
  verificarPropietarioUnidadDidactica,
  verificarPropietarioClase,
  verificarPropietarioActividad,
} from "@/lib/auth";
import {
  exito,
  fallo,
  mensajeDeError,
  validarPayload,
  type ResultadoAccion,
} from "@/lib/form/action-result";

// ==========================================
// CLASE DIARIA
// ==========================================

function datosDeClase(datos: ClaseInput) {
  const cancelada = datos.estado === "cancelada";
  // "Otro" no es un id de `EjeNap`: se guarda como texto libre y el FK queda en
  // null. Elegir un eje del listado limpia el texto, así nunca conviven los dos.
  const ejePropio = datos.ejeNapId === EJE_OTRO;

  return {
    fecha: aFecha(datos.fecha),
    horaInicio: aTextoONull(datos.horaInicio),
    horaFin: aTextoONull(datos.horaFin),
    objetivoClase: aTextoONull(datos.objetivoClase),
    ejeNapId: ejePropio ? null : datos.ejeNapId,
    ejeOtro: ejePropio ? aTextoONull(datos.ejeOtro) : null,
    espacioRequerido: datos.espacioRequerido || null,
    alternativaClima: aTextoONull(datos.alternativaClima),
    estado: datos.estado,
    // Sólo una clase cancelada guarda motivo; el resto lo limpia.
    motivoCancelacion: cancelada ? ((datos.motivoCancelacion || "otro") as MotivoCancelacion) : null,
    motivoCancelacionOtro: cancelada ? aTextoONull(datos.motivoCancelacionOtro) : null,
  };
}

export async function crearClase(
  unidadDidacticaId: string,
  cursoId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioUnidadDidactica(unidadDidacticaId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta unidad didáctica"));
  }

  const validado = validarPayload(claseSchema, input);
  if (!validado.ok) return validado;

  await db.claseDiaria.create({
    data: { unidadDidacticaId, ...datosDeClase(validado.data) },
  });

  revalidatePath(`/cursos/${cursoId}/unidades/${unidadDidacticaId}`);
  return exito();
}

export async function obtenerClase(claseId: string) {
  return db.claseDiaria.findUnique({
    where: { id: claseId },
    include: {
      unidadDidactica: {
        include: {
          planificacion: { include: { curso: { include: { alumnos: { include: { alumno: true } } } } } },
        },
      },
      actividades: { include: { juego: true }, orderBy: { orden: "asc" } },
    },
  });
}

export async function actualizarClase(
  claseId: string,
  cursoId: string,
  unidadDidacticaId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioClase(claseId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta clase"));
  }

  const validado = validarPayload(claseSchema, input);
  if (!validado.ok) return validado;

  await db.claseDiaria.update({
    where: { id: claseId },
    data: datosDeClase(validado.data),
  });

  revalidatePath(`/cursos/${cursoId}/clase/${claseId}`);
  revalidatePath(`/cursos/${cursoId}/unidades/${unidadDidacticaId}`);
  return exito();
}

export async function eliminarClase(claseId: string, cursoId: string, unidadDidacticaId: string) {
  const docente = await requerirDocente();
  await verificarPropietarioClase(claseId, docente.id);

  await db.claseDiaria.delete({ where: { id: claseId } });

  revalidatePath(`/cursos/${cursoId}/clase/${claseId}`);
  revalidatePath(`/cursos/${cursoId}/unidades/${unidadDidacticaId}`);
  redirect(`/cursos/${cursoId}/unidades/${unidadDidacticaId}?deletedClase=true`);
}

export async function cambiarEstadoClase(
  claseDiariaId: string,
  cursoId: string,
  estado: EstadoClase,
  motivoCancelacion?: MotivoCancelacion
) {
  const docente = await requerirDocente();
  await verificarPropietarioClase(claseDiariaId, docente.id);

  await db.claseDiaria.update({
    where: { id: claseDiariaId },
    data: { estado, motivoCancelacion: estado === "cancelada" ? motivoCancelacion ?? "otro" : null },
  });

  revalidatePath(`/cursos/${cursoId}/clase/${claseDiariaId}`);
  // El dashboard lista las clases de hoy y las pendientes de asistencia.
  revalidatePath("/");
}

export async function reprogramarClase(claseDiariaId: string, cursoId: string, nuevaFecha: string) {
  const docente = await requerirDocente();
  await verificarPropietarioClase(claseDiariaId, docente.id);

  const fecha = new Date(nuevaFecha);
  if (Number.isNaN(fecha.getTime())) throw new Error("Fecha de reprogramación inválida");

  const { unidadDidacticaId } = await db.$transaction(async (tx) => {
    const original = await tx.claseDiaria.findUnique({
      where: { id: claseDiariaId },
      include: {
        actividades: true,
        unidadDidactica: { select: { id: true, planificacionId: true } },
      },
    });
    if (!original) throw new Error("Clase no encontrada");

    const nueva = await tx.claseDiaria.create({
      data: {
        unidadDidacticaId: original.unidadDidacticaId,
        fecha,
        horaInicio: original.horaInicio,
        horaFin: original.horaFin,
        objetivoClase: original.objetivoClase,
        ejeNapId: original.ejeNapId,
        ejeOtro: original.ejeOtro,
        espacioRequerido: original.espacioRequerido,
        estado: "planificada",
        actividades: {
          create: original.actividades.map((a) => ({
            juegoId: a.juegoId,
            orden: a.orden,
            duracionMinutos: a.duracionMinutos,
            tipoBloque: a.tipoBloque,
          })),
        },
      },
    });

    // Estado propio en vez de `cancelada` + motivo "otro": así "cancelada"
    // significa una sola cosa y no hay que mirar `reprogramadaAId` para saber
    // si la clase tiene reemplazo.
    await tx.claseDiaria.update({
      where: { id: claseDiariaId },
      data: { estado: "reprogramada", reprogramadaAId: nueva.id },
    });

    return { unidadDidacticaId: original.unidadDidactica.id };
  });

  revalidatePath(`/cursos/${cursoId}/clase/${claseDiariaId}`);
  revalidatePath(`/cursos/${cursoId}/unidades/${unidadDidacticaId}`);
}

// ==========================================
// ACTIVIDADES DE CLASE
// ==========================================

const MENSAJE_ORDEN_OCUPADO = "Ya hay otra actividad con ese orden.";

/**
 * El orden ubica la actividad en la secuencia de la clase: dos no pueden
 * compartirlo. Necesita la base de datos, así que se valida acá y no en Zod.
 */
async function ordenOcupado(claseDiariaId: string, orden: number, actividadId?: string) {
  const conflicto = await db.claseActividad.findFirst({
    where: {
      claseDiariaId,
      orden,
      ...(actividadId && { NOT: { id: actividadId } }),
    },
    select: { id: true },
  });

  return Boolean(conflicto);
}

export async function agregarActividad(
  claseDiariaId: string,
  cursoId: string,
  unidadDidacticaId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioClase(claseDiariaId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta clase"));
  }

  const validado = validarPayload(actividadSchema, input);
  if (!validado.ok) return validado;

  const { juegoId, duracionMinutos, tipoBloque, orden } = validado.data;

  if (orden !== undefined && (await ordenOcupado(claseDiariaId, orden))) {
    return fallo(MENSAJE_ORDEN_OCUPADO, { orden: MENSAJE_ORDEN_OCUPADO });
  }

  await db.$transaction(async (tx) => {
    let ordenFinal = orden;
    if (!ordenFinal) {
      const ultima = await tx.claseActividad.aggregate({
        where: { claseDiariaId },
        _max: { orden: true },
      });
      ordenFinal = (ultima._max.orden ?? 0) + 1;
    }

    await tx.claseActividad.create({
      data: {
        claseDiariaId,
        juegoId: juegoId || null,
        orden: ordenFinal,
        duracionMinutos,
        tipoBloque,
      },
    });
  });

  revalidatePath(`/cursos/${cursoId}/unidades/${unidadDidacticaId}`);
  revalidatePath(`/cursos/${cursoId}/clase/${claseDiariaId}`);
  return exito();
}

export async function actualizarActividad(
  actividadId: string,
  claseDiariaId: string,
  cursoId: string,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioActividad(actividadId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta actividad"));
  }

  const validado = validarPayload(actividadSchema, input);
  if (!validado.ok) return validado;

  const { juegoId, duracionMinutos, tipoBloque, orden, duracionRealMinutos } = validado.data;

  if (orden !== undefined && (await ordenOcupado(claseDiariaId, orden, actividadId))) {
    return fallo(MENSAJE_ORDEN_OCUPADO, { orden: MENSAJE_ORDEN_OCUPADO });
  }

  await db.claseActividad.update({
    where: { id: actividadId },
    data: {
      juegoId: juegoId || null,
      duracionMinutos,
      tipoBloque,
      ...(orden !== undefined ? { orden } : {}),
      // Si el formulario no trae duración real, se conserva la que ya estaba.
      ...(duracionRealMinutos !== undefined ? { duracionRealMinutos } : {}),
    },
  });

  revalidatePath(`/cursos/${cursoId}/clase/${claseDiariaId}`);
  return exito();
}

/**
 * Reasigna el orden 1..n según la secuencia que dejó el docente al arrastrar.
 * Recibe la lista completa para poder reescribirla de una sola vez, sin pasar
 * por estados intermedios con dos actividades compartiendo el mismo orden.
 */
export async function reordenarActividades(
  claseDiariaId: string,
  cursoId: string,
  idsEnOrden: string[]
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioClase(claseDiariaId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre esta clase"));
  }

  const actividades = await db.claseActividad.findMany({
    where: { claseDiariaId },
    select: { id: true },
  });

  // Si la lista que manda el cliente no es exactamente la de la clase (quedó
  // desactualizada, o viene manipulada) se descarta entera: reordenar a medias
  // dejaría huecos o duplicados en la secuencia.
  const idsClase = new Set(actividades.map((a) => a.id));
  const idsRecibidos = new Set(idsEnOrden);
  const listaCompleta =
    idsRecibidos.size === idsEnOrden.length &&
    idsRecibidos.size === idsClase.size &&
    idsEnOrden.every((id) => idsClase.has(id));

  if (!listaCompleta) {
    return fallo("La lista de actividades cambió. Recargá la página e intentá de nuevo.");
  }

  await db.$transaction(
    idsEnOrden.map((id, indice) =>
      db.claseActividad.update({ where: { id }, data: { orden: indice + 1 } })
    )
  );

  revalidatePath(`/cursos/${cursoId}/clase/${claseDiariaId}`);
  return exito();
}

export async function eliminarActividad(actividadId: string, claseDiariaId: string, cursoId: string) {
  const docente = await requerirDocente();
  await verificarPropietarioActividad(actividadId, docente.id);

  await db.claseActividad.delete({ where: { id: actividadId } });

  revalidatePath(`/cursos/${cursoId}/clase/${claseDiariaId}`);
}
