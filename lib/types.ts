import type {
  Nivel,
  Ciclo,
  Turno,
  RangoEtario,
  CategoriaJuego,
  EstrategiaJuego,
  EstadoClase,
  MotivoCancelacion,
  TipoBloque,
  EspacioTipo,
} from "@prisma/client";

export const NIVELES: { value: Nivel; label: string }[] = [
  { value: "primaria", label: "Primaria" },
  { value: "secundaria", label: "Secundaria" },
];

export const TURNOS: { value: Turno; label: string }[] = [
  { value: "manana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
];

export const CICLOS: { value: string; label: string }[] = [
  { value: "primer_ciclo", label: "Primer ciclo" },
  { value: "segundo_ciclo", label: "Segundo ciclo" },
  { value: "septimo_anio", label: "Séptimo año" },
  { value: "ciclo_basico", label: "Ciclo básico" },
  { value: "ciclo_orientado", label: "Ciclo orientado" },
];

// Qué ciclos habilita cada nivel. Lo usan el formulario de curso y el esquema
// Zod que valida la combinación nivel/ciclo, para que no se puedan desincronizar.
export const CICLOS_POR_NIVEL: Record<Nivel, { value: Ciclo; label: string }[]> = {
  primaria: [
    { value: "primer_ciclo", label: "Primer ciclo (1° a 3°)" },
    { value: "segundo_ciclo", label: "Segundo ciclo (4° a 6°)" },
    { value: "septimo_anio", label: "7° año" },
  ],
  secundaria: [
    { value: "ciclo_basico", label: "Ciclo básico" },
    { value: "ciclo_orientado", label: "Ciclo orientado" },
  ],
};

export const RANGOS: { value: RangoEtario; label: string }[] = [
  { value: "de_3_a_5", label: "3 a 5" },
  { value: "de_6_a_8", label: "6 a 8" },
  { value: "de_9_a_12", label: "9 a 12" },
  { value: "de_12_a_15", label: "12 a 15" },
  { value: "de_15_o_mas", label: "15+" },
];

export const CATEGORIAS: { value: CategoriaJuego; label: string }[] = [
  { value: "deportivo", label: "Deportivo" },
  { value: "cooperativo", label: "Cooperativo" },
  { value: "expresion_corporal", label: "Expresión corporal" },
  { value: "vida_naturaleza", label: "Vida en la naturaleza" },
];

export const ESTRATEGIAS: { value: EstrategiaJuego; label: string }[] = [
  { value: "mando_directo", label: "Mando directo" },
  { value: "asignacion_de_tareas", label: "Asignación de tareas" },
  { value: "ensenianza_reciproca", label: "Enseñanza recíproca" },
  { value: "descubrimiento_guiado", label: "Descubrimiento guiado" },
  { value: "resolucion_de_problemas", label: "Resolución de problemas" },
];

/**
 * Los ejes salen de la tabla `EjeNap` (los siembra `prisma/seed.ts` por nivel y
 * ciclo), así que el formulario los recibe como opciones ya filtradas para el
 * curso. `EJE_OTRO` es el valor centinela del `<select>` para cargar uno a mano:
 * no es un id de la base, y la acción lo traduce a `ejeOtro`.
 */
export type OpcionEje = { id: string; nombre: string };

export const EJE_OTRO = "otro";

/**
 * Los estados que la docente elige a mano. `reprogramada` queda afuera a
 * propósito: la pone `reprogramarClase`, porque implica crear la clase de
 * reemplazo y no tendría sentido elegirla suelta desde el formulario.
 */
export const ESTADOS_CLASE: { value: EstadoClase; label: string }[] = [
  { value: "planificada", label: "Planificada" },
  { value: "dictada", label: "Dictada" },
  { value: "suspendida", label: "Suspendida (no se dictó)" },
  { value: "cancelada", label: "Cancelada" },
];

export const MOTIVOS_CANCELACION: { value: MotivoCancelacion; label: string }[] = [
  { value: "clima", label: "Clima" },
  { value: "feriado_suspension", label: "Feriado o suspensión" },
  { value: "ausencia_docente", label: "Ausencia docente" },
  { value: "otro", label: "Otro" },
];

export const TIPOS_BLOQUE: { value: TipoBloque; label: string }[] = [
  { value: "entrada_calor", label: "Entrada en calor" },
  { value: "desarrollo", label: "Desarrollo" },
  { value: "vuelta_calma", label: "Vuelta a la calma" },
];

export const ESPACIOS: { value: EspacioTipo; label: string }[] = [
  { value: "patio", label: "Patio" },
  { value: "gimnasio", label: "Gimnasio" },
  { value: "cancha_externa", label: "Cancha externa" },
];

/** Escala con la que se puntúa cada indicador de la rúbrica, alumno por alumno. */
export const NIVELES_LOGRO = [1,2,3,4,5,6,7,8,9,10] as const;

export type NivelDeLogro = (typeof NIVELES_LOGRO)[number];
