import { z } from "zod";
import { NIVELES_LOGRO } from "@/lib/types";
import { textoOpcional, textoRequerido } from "./common";

const MENSAJE_NIVEL = "Elegí un nivel de logro";
const NIVEL_MINIMO = NIVELES_LOGRO[0];
const NIVEL_MAXIMO = NIVELES_LOGRO[NIVELES_LOGRO.length - 1];

/**
 * Los radios del formulario mandan el nivel como texto ("7"), así que se
 * convierte a número antes de validarlo. Sin responder llega como cadena vacía,
 * que se convierte en 0 y cae fuera del rango.
 */
export const nivelLogroSchema = z.coerce
  .number({ error: MENSAJE_NIVEL })
  .int({ error: MENSAJE_NIVEL })
  .min(NIVEL_MINIMO, { error: MENSAJE_NIVEL })
  .max(NIVEL_MAXIMO, { error: MENSAJE_NIVEL });

// El nivel y el ciclo no viajan en el formulario: la acción los toma del curso.
export const rubricaSchema = z.object({
  nombre: textoRequerido("El nombre de la rúbrica", 120),
  criterios: z
    .array(z.object({ nombre: textoRequerido("El criterio", 200) }))
    .min(1, "Agregá al menos un criterio")
    .max(20, "No podés cargar más de 20 criterios"),
});

/**
 * Los criterios son dinámicos (dependen de la rúbrica), así que se validan como
 * un mapa `criterioId -> nivel de logro`. El formulario arranca con todos los
 * criterios en cadena vacía, que el esquema rechaza: así cada criterio sin
 * responder muestra su propio error.
 */
export const evaluacionSchema = z.object({
  observacionDocente: textoOpcional("La observación", 2000),
  valores: z.record(z.string(), nivelLogroSchema),
});

export type NivelLogro = z.infer<typeof nivelLogroSchema>;
export type RubricaInput = z.infer<typeof rubricaSchema>;
export type EvaluacionInput = z.infer<typeof evaluacionSchema>;
