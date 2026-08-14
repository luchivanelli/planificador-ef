import { z } from "zod";
import { textoOpcional, textoRequerido } from "./common";

export const juegoSchema = z.object({
  nombre: textoRequerido("El nombre del juego", 120),
  descripcion: textoOpcional("La descripción", 2000),
  rangoEtario: z.enum(["de_3_a_5", "de_6_a_8", "de_9_a_12", "de_12_a_15", "de_15_o_mas"], {
    error: "Elegí un rango etario",
  }),
  categoria: z.enum(["deportivo", "expresion_corporal", "cooperativo", "vida_naturaleza"], {
    error: "Elegí una categoría",
  }),
  estrategia: z.enum(
    [
      "mando_directo",
      "asignacion_de_tareas",
      "ensenianza_reciproca",
      "descubrimiento_guiado",
      "resolucion_de_problemas",
    ],
    { error: "Elegí una estrategia" }
  ),
  // Se carga como texto separado por comas y la acción lo convierte en lista.
  materiales: textoOpcional("Los materiales", 500),
});

export const separarMateriales = (valor: string) =>
  valor
    .split(",")
    .map((material) => material.trim())
    .filter(Boolean);

export type JuegoInput = z.infer<typeof juegoSchema>;
