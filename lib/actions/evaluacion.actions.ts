"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requerirDocente, verificarPropietarioCurso } from "@/lib/auth";
import { evaluacionSchema, rubricaSchema } from "@/lib/schemas/evaluacion.schema";
import { aTextoONull } from "@/lib/schemas/common";
import {
  exito,
  fallo,
  mensajeDeError,
  validarPayload,
  type ResultadoAccion,
} from "@/lib/form/action-result";

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

  const { nombre, criterios } = validado.data;

  // El nivel y el ciclo se toman del curso, no del cliente.
  const curso = await db.curso.findUnique({
    where: { id: cursoId },
    select: { nivel: true, ciclo: true },
  });
  if (!curso) {
    return fallo("El curso no existe");
  }

  await db.rubrica.create({
    data: {
      docenteId: docente.id,
      nombre,
      nivel: curso.nivel,
      ciclo: curso.ciclo,
      criterios: {
        create: criterios.map((criterio) => ({ nombre: criterio.nombre })),
      },
    },
  });

  revalidatePath(`/cursos/${cursoId}/clase/${claseId}/evaluacion`);
  return exito();
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

  // `claseId` llega desde la URL, así que se confirma que la clase cuelgue de
  // este curso antes de escribir nada.
  const clase = await db.claseDiaria.findFirst({
    where: { id: claseId, unidadDidactica: { planificacion: { cursoId } } },
    select: { id: true },
  });
  if (!clase) {
    return fallo("La clase no existe o no pertenece a este curso");
  }

  const rubrica = await db.rubrica.findFirst({
    where: { id: rubricaId, docenteId: docente.id },
    include: { criterios: { select: { id: true } } },
  });
  if (!rubrica) {
    return fallo("La rúbrica no existe o no es tuya");
  }

  // El formulario es dinámico: se controla acá que los criterios enviados sean
  // los de la rúbrica y que no falte ninguno.
  const idsDeRubrica = new Set(rubrica.criterios.map((criterio) => criterio.id));
  const idsEnviados = Object.keys(valores);

  if (idsEnviados.some((id) => !idsDeRubrica.has(id))) {
    return fallo("Hay criterios que no pertenecen a esta rúbrica");
  }
  if (idsEnviados.length !== idsDeRubrica.size) {
    return fallo("Faltan criterios por evaluar");
  }

  // El esquema ya dejó el nivel como número en rango: se guarda tal cual.
  const detalles = idsEnviados.map((criterioId) => ({
    criterioId,
    valor: valores[criterioId],
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

  revalidatePath(`/cursos/${cursoId}/clase/${claseId}/evaluacion`);
  return exito();
}
