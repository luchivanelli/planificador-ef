import { z } from "zod";
import { enteroRequerido, fechaRequerida, textoOpcional, textoRequerido } from "./common";

export const planificacionSchema = z.object({
  anio: enteroRequerido("El año", 2000, 2100),
  objetivos: textoOpcional("Los objetivos", 2000),
});

export const unidadDidacticaSchema = z
  .object({
    titulo: textoRequerido("El título", 120),
    objetivo: textoOpcional("Los objetivos", 2000),
    fechaInicio: fechaRequerida("La fecha de inicio"),
    fechaFin: fechaRequerida("La fecha de fin"),
  })
  .refine((datos) => datos.fechaFin >= datos.fechaInicio, {
    error: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["fechaFin"],
  });

export type PlanificacionInput = z.infer<typeof planificacionSchema>;
export type UnidadDidacticaInput = z.infer<typeof unidadDidacticaSchema>;
