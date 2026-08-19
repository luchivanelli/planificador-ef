"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requerirDocente, verificarPropietarioCurso } from "@/lib/auth";
import {
  evaluacionSchema,
  rubricaEdicionSchema,
  rubricaSchema,
} from "@/lib/schemas/evaluacion.schema";
import { aTextoONull } from "@/lib/schemas/common";
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

export async function crearRubrica(
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

  const validado = validarPayload(rubricaSchema, input);
  if (!validado.ok) return validado;

  const { nombre, indicadores } = validado.data;

  if (!(await claseDelCurso(claseId, cursoId))) {
    return fallo("La clase no existe o no pertenece a este curso");
  }

  await db.rubrica.create({
    data: {
      claseId,
      nombre,
      indicadores: {
        create: indicadores.map((indicador) => ({ nombre: indicador.nombre })),
      },
    },
  });

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return exito();
}

/**
 * Se conservan los indicadores que llegan con `id` (así sobrevive lo evaluado con
 * ellos), se crean los nuevos y se borran los que el formulario ya no manda.
 */
export async function actualizarRubrica(
  rubricaId: string,
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

  const validado = validarPayload(rubricaEdicionSchema, input);
  if (!validado.ok) return validado;

  const { nombre, indicadores } = validado.data;

  // La rúbrica es de la clase: alcanza con exigir que sea la de esta URL, ya
  // verificada como parte del curso del docente.
  const rubrica = await db.rubrica.findFirst({
    where: { id: rubricaId, claseId, clase: { unidadDidactica: { planificacion: { cursoId } } } },
    include: { indicadores: { select: { id: true } } },
  });
  if (!rubrica) {
    return fallo("La rúbrica no existe o no es de esta clase");
  }

  // El formulario es dinámico: se controla que los `id` que manda sean de esta
  // rúbrica y no de otra.
  const idsDeRubrica = new Set(rubrica.indicadores.map((indicador) => indicador.id));
  const existentes = indicadores.filter((indicador) => indicador.id);

  if (existentes.some((indicador) => !idsDeRubrica.has(indicador.id!))) {
    return fallo("Hay indicadores que no pertenecen a esta rúbrica");
  }

  const idsConservados = new Set(existentes.map((indicador) => indicador.id!));
  const idsABorrar = [...idsDeRubrica].filter((id) => !idsConservados.has(id));
  const nuevos = indicadores.filter((indicador) => !indicador.id);

  // Todo en una transacción: si algo falla, la rúbrica no queda a medio editar.
  await db.$transaction([
    ...(idsABorrar.length
      ? [db.rubricaIndicador.deleteMany({ where: { id: { in: idsABorrar }, rubricaId } })]
      : []),
    ...existentes.map((indicador) =>
      db.rubricaIndicador.update({
        where: { id: indicador.id },
        data: { nombre: indicador.nombre },
      })
    ),
    db.rubrica.update({
      where: { id: rubricaId },
      data: {
        nombre,
        indicadores: { create: nuevos.map((indicador) => ({ nombre: indicador.nombre })) },
      },
    }),
  ]);

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return exito();
}

/** Con la rúbrica caen sus indicadores y todo lo evaluado con ella (Cascade). */
export async function eliminarRubrica(rubricaId: string, cursoId: string, claseId: string) {
  const docente = await requerirDocente();

  await verificarPropietarioCurso(cursoId, docente.id);

  // La rúbrica es de la clase: alcanza con exigir que sea la de esta URL, ya
  // verificada como parte del curso del docente.
  const rubrica = await db.rubrica.findFirst({
    where: { id: rubricaId, claseId, clase: { unidadDidactica: { planificacion: { cursoId } } } },
    select: { id: true },
  });
  if (!rubrica) {
    throw new Error("La rúbrica no existe o no es de esta clase");
  }

  await db.rubrica.delete({ where: { id: rubricaId } });

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return { ok: true };
}

export async function guardarEvaluacion(
  cursoId: string,
  claseId: string,
  alumnoId: string,
  rubricaId: string,
  evaluacionId: string | null,
  input: unknown
): Promise<ResultadoAccion> {
  const docente = await requerirDocente();

  try {
    await verificarPropietarioCurso(cursoId, docente.id);
  } catch (error) {
    return fallo(mensajeDeError(error, "No tenés permiso sobre este curso"));
  }

  const validado = validarPayload(evaluacionSchema, input);
  if (!validado.ok) return validado;

  const { observacionDocente, valores } = validado.data;

  if (!(await claseDelCurso(claseId, cursoId))) {
    return fallo("La clase no existe o no pertenece a este curso");
  }

  // Las rúbricas son de la clase: si es la de esta URL, ya es del docente.
  const rubrica = await db.rubrica.findFirst({
    where: { id: rubricaId, claseId },
    include: { indicadores: { select: { id: true } } },
  });
  if (!rubrica) {
    return fallo("La rúbrica no existe o no es de esta clase");
  }

  // El formulario es dinámico: se controla acá que los indicadores enviados sean
  // los de la rúbrica y que no falte ninguno.
  const idsDeRubrica = new Set(rubrica.indicadores.map((indicador) => indicador.id));
  const idsEnviados = Object.keys(valores);

  if (idsEnviados.some((id) => !idsDeRubrica.has(id))) {
    return fallo("Hay indicadores que no pertenecen a esta rúbrica");
  }
  if (idsEnviados.length !== idsDeRubrica.size) {
    return fallo("Faltan indicadores por evaluar");
  }

  // El esquema ya dejó el puntaje como número en rango: se guarda tal cual.
  const detalles = idsEnviados.map((indicadorId) => ({
    indicadorId,
    valor: valores[indicadorId],
  }));

  if (evaluacionId) {
    await db.evaluacionAlumno.update({
      where: { id: evaluacionId },
      data: {
        observacionDocente: aTextoONull(observacionDocente),
        detalles: {
          deleteMany: {},
          create: detalles,
        },
      },
    });
  } else {
    await db.evaluacionAlumno.create({
      data: {
        alumnoId,
        claseId,
        rubricaId,
        observacionDocente: aTextoONull(observacionDocente),
        detalles: { create: detalles },
      },
    });
  }

  revalidatePath(rutaEvaluacion(cursoId, claseId));
  return exito();
}
