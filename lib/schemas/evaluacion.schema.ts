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

/** Los indicadores tienen los mismos límites al crear y al editar la rúbrica. */
const listaIndicadores = <S extends z.ZodType>(indicador: S) =>
  z
    .array(indicador)
    .min(1, "Agregá al menos un indicador")
    .max(20, "No podés cargar más de 20 indicadores");

const indicadorSchema = z.object({ nombre: textoRequerido("El indicador", 200) });

// La clase no viaja en el formulario: la acción la toma de la URL.
export const rubricaSchema = z.object({
  nombre: textoRequerido("El nombre de la rúbrica", 120),
  indicadores: listaIndicadores(indicadorSchema),
});

/**
 * Al editar, los indicadores que ya existen viajan con su `id` para conservarlos
 * (y con ellos lo que se evaluó con ellos). Los que llegan sin `id` son nuevos, y
 * los que el formulario ya no manda se borran.
 */
export const rubricaEdicionSchema = rubricaSchema.extend({
  indicadores: listaIndicadores(indicadorSchema.extend({ id: z.string().optional() })),
});

/**
 * Los indicadores son dinámicos (dependen de la rúbrica), así que se validan como
 * un mapa `indicadorId -> nivel de logro`. El formulario arranca con todos los
 * indicadores en cadena vacía, que el esquema rechaza: así cada indicador sin
 * responder muestra su propio error.
 */
export const evaluacionSchema = z.object({
  observacionDocente: textoOpcional("La observación", 2000),
  valores: z.record(z.string(), nivelLogroSchema),
});

export type NivelLogro = z.infer<typeof nivelLogroSchema>;
export type RubricaInput = z.infer<typeof rubricaSchema>;
export type RubricaEdicionInput = z.infer<typeof rubricaEdicionSchema>;
export type EvaluacionInput = z.infer<typeof evaluacionSchema>;
