import { z } from "zod";

// Bloques reutilizables para armar los esquemas de cada formulario.
// Todos los mensajes están en español porque se muestran tal cual en la UI.

export const textoRequerido = (etiqueta: string, max = 200) =>
  z
    .string({ error: `${etiqueta} es obligatorio` })
    .trim()
    .min(1, `${etiqueta} es obligatorio`)
    .max(max, `${etiqueta} no puede superar los ${max} caracteres`);

export const textoOpcional = (etiqueta: string, max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `${etiqueta} no puede superar los ${max} caracteres`)
    .default("");

export const enteroRequerido = (etiqueta: string, min: number, max: number) =>
  z
    .number({ error: `${etiqueta} debe ser un número` })
    .int(`${etiqueta} debe ser un número entero`)
    .min(min, `${etiqueta} no puede ser menor a ${min}`)
    .max(max, `${etiqueta} no puede ser mayor a ${max}`);

/**
 * Texto opcional que, si viene cargado, debe cumplir un formato.
 * Evita uniones con `z.literal("")`, que se rompen con espacios sueltos.
 */
export const textoOpcionalConFormato = (formato: RegExp, mensaje: string) =>
  z
    .string()
    .trim()
    .refine((valor) => valor === "" || formato.test(valor), mensaje)
    .default("");

/** Texto obligatorio que además debe cumplir un formato. */
export const textoRequeridoConFormato = (etiqueta: string, formato: RegExp, mensaje: string) =>
  z
    .string({ error: `${etiqueta} es obligatorio` })
    .trim()
    .min(1, `${etiqueta} es obligatorio`)
    .regex(formato, mensaje);

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const fechaRequerida = (etiqueta: string) =>
  z
    .string({ error: `${etiqueta} es obligatoria` })
    .trim()
    .min(1, `${etiqueta} es obligatoria`)
    .regex(FORMATO_FECHA, `${etiqueta} no es válida`);

export const horaOpcional = (etiqueta: string) =>
  textoOpcionalConFormato(FORMATO_HORA, `${etiqueta} debe tener formato HH:MM`);

export const emailRequerido = z
  .string({ error: "El email es obligatorio" })
  .trim()
  .toLowerCase()
  .min(1, "El email es obligatorio")
  .max(160, "El email no puede superar los 160 caracteres")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Ingresá un email válido");

/** Los ids llegan de un `<select>`; vacío significa "sin asignar". */
export const idOpcional = z.string().trim().default("");

// ==========================================
// CAMPOS DE VARIOS ÍTEMS (UNO POR LÍNEA)
// ==========================================

// Objetivos, temas y contenidos son listas: la docente escribe un ítem por
// línea y se guardan en una sola columna de texto separados por `\n`. Para que
// el formato no se interprete distinto en cada vista, todo pasa por acá.

/** Viñeta al inicio de la línea: la propia (`•`) o la que viene de pegar de Word. */
const VINETA_AL_INICIO = /^\s*[•·*-]\s*/;

/** Los ítems cargados, sin viñetas, sin espacios de más y sin líneas vacías. */
export const itemsDeLista = (valor: string | null | undefined): string[] =>
  (valor ?? "")
    .split("\n")
    .map((linea) => linea.replace(VINETA_AL_INICIO, "").trim())
    .filter(Boolean);

/** Texto listo para guardar: un ítem por línea y nada más. */
export const normalizarLista = (valor: string | null | undefined) => itemsDeLista(valor).join("\n");

/** Todos los ítems en una sola línea, para títulos y textos corridos. */
export const resumenLista = (valor: string | null | undefined, separador = " · ") =>
  itemsDeLista(valor).join(separador);

/**
 * Campo de lista opcional. Normaliza antes de medir el largo, así el límite
 * cuenta lo que realmente se guarda y no las viñetas que agrega el formulario.
 */
export const listaOpcional = (etiqueta: string, max = 2000) =>
  z
    .string()
    .transform(normalizarLista)
    .refine((valor) => valor.length <= max, `${etiqueta} no puede superar los ${max} caracteres`)
    .default("");

// ==========================================
// CONVERSIONES FORMULARIO ↔ BASE DE DATOS
// ==========================================

/**
 * Las fechas se guardan como medianoche UTC, igual que hacía `new Date("YYYY-MM-DD")`,
 * para no desalinear los registros ya existentes.
 */
export const aFecha = (valor: string) => new Date(`${valor}T00:00:00.000Z`);

/**
 * El huso horario del colegio, fijo y explícito.
 *
 * Todo lo que dependa de "qué día es hoy" o "qué hora es" tiene que salir de
 * acá y no de `getDate()`/`getHours()`: esos leen el reloj del proceso, que en
 * desarrollo es el de la docente pero en el servidor de producción es UTC. Con
 * 3 horas de diferencia una clase de 21 a 22 aparecía terminada desde las 19.
 */
export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

// `en-CA` da el año, el mes y el día ya en formato ISO; `h23` evita que la
// medianoche salga como "24:00" (lo que hace `hour12: false` en algunas ICU).
const PARTES_EN_ZONA = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const partesEnZona = (referencia: Date) => {
  const partes = new Map(
    PARTES_EN_ZONA.formatToParts(referencia).map(({ type, value }) => [type, value])
  );
  return {
    dia: `${partes.get("year")}-${partes.get("month")}-${partes.get("day")}`,
    hora: `${partes.get("hour")}:${partes.get("minute")}`,
  };
};

/** El día del calendario en curso, como "AAAA-MM-DD". */
export const diaEnZona = (referencia: Date = new Date()) => partesEnZona(referencia).dia;

/**
 * La hora del reloj de pared, como "HH:MM" con cero adelante: el mismo formato
 * en que se cargan `horaInicio` y `horaFin`, así se comparan directo.
 */
export const horaEnZona = (referencia: Date = new Date()) => partesEnZona(referencia).hora;

/**
 * Rango `[inicio, fin)` que cubre un día entero con la misma convención que
 * `aFecha` (medianoche UTC), tomando el día del calendario en `ZONA_HORARIA`.
 * Armarlo con `setHours(0, 0, 0, 0)` corre el rango según el huso del proceso:
 * en UTC-3 empezaría a las 03:00 UTC y se saltearía las clases de ese día.
 */
export const rangoDelDia = (referencia: Date = new Date()) => {
  const inicio = aFecha(diaEnZona(referencia));
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 1);
  return { inicio, fin };
};

/** Inversa de `aFecha`: deja una fecha lista para un `<input type="date">`. */
export const aValorFecha = (fecha: Date | string) =>
  (fecha instanceof Date ? fecha : new Date(fecha)).toISOString().slice(0, 10);

/**
 * Única forma de mostrar una fecha en pantalla: siempre `DD/MM/AAAA`.
 *
 * Las dos opciones son necesarias y por motivos distintos:
 * - `timeZone: "UTC"` porque `aFecha` guarda medianoche UTC. Sin esto, en UTC-3
 *   una clase del 08/05 se renderiza como 07/05.
 * - `2-digit` porque `es-AR` por defecto no rellena con cero: da "8/5/2026".
 */
export const aFechaLegible = (fecha: Date | string) =>
  (fecha instanceof Date ? fecha : new Date(fecha)).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

/** Las columnas opcionales de Prisma esperan `null`, no cadena vacía. */
export const aTextoONull = (valor: string | null | undefined) => {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
};
