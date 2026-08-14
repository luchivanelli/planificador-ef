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
// CONVERSIONES FORMULARIO ↔ BASE DE DATOS
// ==========================================

/**
 * Las fechas se guardan como medianoche UTC, igual que hacía `new Date("YYYY-MM-DD")`,
 * para no desalinear los registros ya existentes.
 */
export const aFecha = (valor: string) => new Date(`${valor}T00:00:00.000Z`);

/**
 * Rango `[inicio, fin)` que cubre un día entero con la misma convención que
 * `aFecha` (medianoche UTC), tomando el día del calendario local.
 * Armarlo con `setHours(0, 0, 0, 0)` corre el rango según el huso horario:
 * en UTC-3 empezaría a las 03:00 UTC y se saltearía las clases de ese día.
 */
export const rangoDelDia = (referencia: Date = new Date()) => {
  const inicio = new Date(
    Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate())
  );
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 1);
  return { inicio, fin };
};

/** Inversa de `aFecha`: deja una fecha lista para un `<input type="date">`. */
export const aValorFecha = (fecha: Date | string) =>
  (fecha instanceof Date ? fecha : new Date(fecha)).toISOString().slice(0, 10);

/** Las columnas opcionales de Prisma esperan `null`, no cadena vacía. */
export const aTextoONull = (valor: string | null | undefined) => {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
};
