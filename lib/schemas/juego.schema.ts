import { z } from "zod";
import { textoOpcional, textoRequerido } from "./common";

const rangoEtario = z.enum(["de_3_a_5", "de_6_a_8", "de_9_a_12", "de_12_a_15", "de_15_o_mas"], {
  error: "Elegí un rango etario",
});

const categoria = z.enum(["deportivo", "expresion_corporal", "cooperativo", "vida_naturaleza"], {
  error: "Elegí una categoría",
});

const estrategia = z.enum(
  [
    "mando_directo",
    "asignacion_de_tareas",
    "ensenianza_reciproca",
    "descubrimiento_guiado",
    "resolucion_de_problemas",
  ],
  { error: "Elegí una estrategia" }
);

export const juegoSchema = z.object({
  nombre: textoRequerido("El nombre del juego", 120),
  descripcion: textoOpcional("La descripción", 2000),
  rangoEtario,
  categoria,
  estrategia,
  // Se carga como texto separado por comas y la acción lo convierte en lista.
  materiales: textoOpcional("Los materiales", 500),
});

/**
 * Los mismos campos, pero cargados desde el formulario de una actividad.
 *
 * Dos diferencias con `juegoSchema`: el nombre no es obligatorio acá (lo exige
 * `actividadSchema` sólo cuando la docente eligió "Juego nuevo", así una
 * actividad con un juego del banco valida igual con el bloque vacío) y se suma
 * `guardarEnBanco`, que decide si el juego queda disponible para otras clases.
 */
export const juegoNuevoSchema = z.object({
  nombre: textoOpcional("El nombre del juego", 120),
  descripcion: textoOpcional("La descripción", 2000),
  rangoEtario,
  categoria,
  estrategia,
  materiales: textoOpcional("Los materiales", 500),
  guardarEnBanco: z.boolean().default(false),
});

export const separarMateriales = (valor: string) =>
  valor
    .split(",")
    .map((material) => material.trim())
    .filter(Boolean);

export type JuegoInput = z.infer<typeof juegoSchema>;
export type JuegoNuevoInput = z.infer<typeof juegoNuevoSchema>;
