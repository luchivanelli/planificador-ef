import { z } from "zod";
import { textoRequerido } from "./common";

export const indicadorSchema = z.object({
  titulo: textoRequerido("El indicador", 200),
});

/**
 * La cadena vacía es un valor más del enum, y no una unión aparte, para que un
 * valor inválido muestre este mensaje en lugar del genérico de Zod.
 */
export const valorIndicadorSchema = z.enum(["SI", "A_VECES", "NO", ""], {
  error: "Elegí un valor",
});

/**
 * Los indicadores son dinámicos (los crea cada docente), así que se validan como
 * un mapa `indicadorId -> valor`. A diferencia de la rúbrica, acá se admite dejar
 * indicadores sin responder: no todos aplican a todas las clases.
 */
export const indicadoresClaseSchema = z.object({
  valores: z.record(z.string(), valorIndicadorSchema),
});

export type IndicadorInput = z.infer<typeof indicadorSchema>;
export type IndicadoresClaseInput = z.infer<typeof indicadoresClaseSchema>;
