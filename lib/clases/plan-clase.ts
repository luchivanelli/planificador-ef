import { db } from "@/lib/db";
import { aFechaLegible, itemsDeLista } from "@/lib/schemas/common";
import {
  CICLOS,
  ESTRATEGIAS,
  MOTIVOS_CANCELACION,
  NIVELES,
  TURNOS,
} from "@/lib/types";
import type { TipoBloque } from "@prisma/client";

/**
 * Los datos del plan de clase imprimible, ya masticados para la hoja: el
 * documento sólo acomoda lo que sale de acá, sin volver a la base ni traducir
 * enums. Es la versión en papel de lo que la docente ve en la pantalla de la
 * clase, con el formato que piden los institutos (partes de la clase,
 * estrategias, recursos y duración en columnas).
 */

/** La etiqueta en castellano de un enum, a partir de las listas de `types`. */
const etiqueta = <T extends string>(
  opciones: readonly { value: T; label: string }[],
  valor: T | null | undefined
) => (valor ? opciones.find((opcion) => opcion.value === valor)?.label ?? null : null);

// `timeZone: "UTC"` por lo mismo que `aFechaLegible`: la fecha está guardada a
// medianoche UTC y sin esto el día de la semana se corre uno para atrás.
const DIA_DE_LA_SEMANA = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" });

/** "Jueves 11/09/2026": el día de la semana ubica la clase de un vistazo. */
export function fechaConDia(fecha: Date) {
  const dia = DIA_DE_LA_SEMANA.format(fecha);
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${aFechaLegible(fecha)}`;
}

/**
 * Las tres partes de la clase, en el orden en que se dictan. `TipoBloque` ya
 * las distingue; acá se les pone el nombre con el que aparecen en el plan.
 */
const PARTES: { tipo: TipoBloque; parte: string; bloque: string }[] = [
  { tipo: "entrada_calor", parte: "Parte inicial", bloque: "Entrada en calor" },
  { tipo: "desarrollo", parte: "Parte principal", bloque: "Desarrollo" },
  { tipo: "vuelta_calma", parte: "Parte final", bloque: "Vuelta a la calma" },
];

export type ActividadDelPlan = {
  id: string;
  nombre: string;
  descripcion: string[];
  estrategia: string | null;
  materiales: string[];
  duracionMinutos: number;
};

export type ParteDelPlan = {
  tipo: TipoBloque;
  parte: string;
  bloque: string;
  minutos: number;
  actividades: ActividadDelPlan[];
};

/**
 * Trae la clase con todo lo que lleva el plan, acotada al docente de la sesión
 * y al curso de la URL: una clase ajena devuelve `null` y la página hace 404.
 */
export async function planDeClase(claseId: string, cursoId: string, docenteId: string) {
  const clase = await db.claseDiaria.findFirst({
    where: {
      id: claseId,
      unidadDidactica: { planificacion: { cursoId, docenteId } },
    },
    include: {
      ejeNap: { select: { nombre: true } },
      unidadDidactica: {
        include: {
          planificacion: {
            include: {
              docente: { select: { nombre: true, apellido: true } },
              curso: {
                include: {
                  institucion: true,
                  // Los que siguen en el curso: los dados de baja no se cuentan.
                  alumnos: { where: { fechaBaja: null }, select: { alumnoId: true } },
                },
              },
            },
          },
        },
      },
      actividades: { include: { juego: true }, orderBy: { orden: "asc" } },
      rubricas: { include: { indicadores: true }, orderBy: { nombre: "asc" } },
    },
  });
  if (!clase) return null;

  const unidad = clase.unidadDidactica;
  const curso = unidad.planificacion.curso;
  const docente = unidad.planificacion.docente;

  // El número de unidad no se guarda: es la posición dentro de la planificación
  // del año, con el mismo orden cronológico que usa la pantalla de unidades.
  const unidades = await db.unidadDidactica.findMany({
    where: { planificacionId: unidad.planificacionId },
    select: { id: true },
    orderBy: [{ fechaInicio: "asc" }, { id: "asc" }],
  });
  const numeroUnidad = unidades.findIndex((u) => u.id === unidad.id) + 1;

  const partes: ParteDelPlan[] = PARTES.map(({ tipo, parte, bloque }) => {
    const actividades = clase.actividades
      .filter((actividad) => actividad.tipoBloque === tipo)
      .map((actividad) => ({
        id: actividad.id,
        // Una actividad puede no tener juego asociado: queda el bloque suelto.
        nombre: actividad.juego?.nombre ?? bloque,
        descripcion: itemsDeLista(actividad.juego?.descripcion),
        estrategia: etiqueta(ESTRATEGIAS, actividad.juego?.estrategia),
        materiales: [
          ...(actividad.juego?.materiales ?? []),
          ...itemsDeLista(actividad.juego?.materialesAlternativos),
        ],
        duracionMinutos: actividad.duracionMinutos,
      }));

    return {
      tipo,
      parte,
      bloque,
      minutos: actividades.reduce((total, act) => total + act.duracionMinutos, 0),
      actividades,
    };
  }).filter((parte) => parte.actividades.length > 0);

  // Una sola lista de materiales para preparar antes de la clase, sin repetidos
  // y respetando el orden en que aparecen en la secuencia.
  const materiales = [
    ...new Set(partes.flatMap((parte) => parte.actividades.flatMap((act) => act.materiales))),
  ];

  // Los indicadores con los que se evalúa: salen de las rúbricas de la clase.
  const indicadores = clase.rubricas.flatMap((rubrica) =>
    rubrica.indicadores.map((indicador) => ({
      id: indicador.id,
      nombre: indicador.nombre,
      // El nombre de la rúbrica sólo aporta si hay más de una.
      rubrica: clase.rubricas.length > 1 ? rubrica.nombre : null,
    }))
  );

  return {
    clase: {
      id: clase.id,
      fecha: clase.fecha,
      horaInicio: clase.horaInicio,
      horaFin: clase.horaFin,
      estado: clase.estado,
      // Con motivo "otro" el detalle está en `motivoCancelacionOtro`: mostrar la
      // etiqueta genérica en vez del texto que escribió la docente no diría nada.
      motivoCancelacion:
        clase.motivoCancelacion === "otro"
          ? clase.motivoCancelacionOtro
          : etiqueta(MOTIVOS_CANCELACION, clase.motivoCancelacion),
      tema: itemsDeLista(clase.temaClase),
      objetivos: itemsDeLista(clase.objetivoClase),
      contenidos: itemsDeLista(clase.contenidosClase),
      eje: clase.ejeNap?.nombre ?? clase.ejeOtro,
    },
    unidad: {
      numero: numeroUnidad,
      titulo: unidad.titulo,
      objetivo: itemsDeLista(unidad.objetivo),
    },
    curso: {
      id: curso.id,
      nombre: curso.nombre,
      nivel: etiqueta(NIVELES, curso.nivel),
      ciclo: CICLOS.find((c) => c.value === curso.ciclo)?.label ?? null,
      turno: etiqueta(TURNOS, curso.turno),
      anioLectivo: curso.anioLectivo,
      cantidadAlumnos: curso.alumnos.length,
    },
    institucion: curso.institucion,
    docente: `${docente.nombre} ${docente.apellido}`.trim(),
    partes,
    materiales,
    indicadores,
    minutosTotales: partes.reduce((total, parte) => total + parte.minutos, 0),
  };
}

export type PlanDeClase = NonNullable<Awaited<ReturnType<typeof planDeClase>>>;
