import { z } from "zod";
import { EJE_OTRO, JUEGO_NUEVO } from "@/lib/types";
import { juegoNuevoSchema } from "./juego.schema";
import {
  enteroRequerido,
  fechaRequerida,
  horaOpcional,
  idOpcional,
  listaOpcional,
  textoOpcional,
  textoRequerido,
} from "./common";

export const claseSchema = z
  .object({
    fecha: fechaRequerida("La fecha"),
    horaInicio: horaOpcional("La hora de inicio"),
    horaFin: horaOpcional("La hora de fin"),
    // Listas: un ítem por línea (ver `listaOpcional`).
    objetivoClase: listaOpcional("El objetivo", 500),
    temaClase: listaOpcional("Los temas", 500),
    contenidosClase: listaOpcional("Los contenidos", 1000),
    // Un id de `EjeNap` o el centinela `otro`, que habilita `ejeOtro`.
    ejeNapId: textoRequerido("El eje", 40),
    ejeOtro: textoOpcional("El eje", 200),
    espacioRequerido: z
      .enum(["patio", "gimnasio", "cancha_externa"], { error: "Elegí un espacio válido" })
      .or(z.literal(""))
      .default(""),
    // `reprogramada` no se ofrece en el formulario, pero se acepta para poder
    // guardar sin cambios una clase que ya quedó en ese estado.
    estado: z
      .enum(["planificada", "dictada", "suspendida", "cancelada", "reprogramada"], {
        error: "Elegí un estado",
      })
      .default("planificada"),
    motivoCancelacion: z
      .enum(["clima", "feriado_suspension", "ausencia_docente", "otro"], {
        error: "Elegí un motivo válido",
      })
      .or(z.literal(""))
      .default(""),
    motivoCancelacionOtro: textoOpcional("El detalle del motivo", 300),
  })
  .refine(
    (datos) => !datos.horaInicio || !datos.horaFin || datos.horaFin > datos.horaInicio,
    { error: "La hora de fin debe ser posterior a la de inicio", path: ["horaFin"] }
  )
  .refine((datos) => datos.ejeNapId !== EJE_OTRO || datos.ejeOtro.trim() !== "", {
    error: "Escribí el nombre del eje",
    path: ["ejeOtro"],
  });

export const actividadSchema = z
  .object({
    tipoBloque: z.enum(["entrada_calor", "desarrollo", "vuelta_calma"], {
      error: "Elegí un tipo de bloque",
    }),
    // Un id del banco, vacío ("sin juego específico") o el centinela
    // `JUEGO_NUEVO`, que pide cargar el juego acá mismo con `juegoNuevo`.
    juegoId: idOpcional,
    juegoNuevo: juegoNuevoSchema.optional(),
    duracionMinutos: enteroRequerido("La duración", 1, 240),
    orden: enteroRequerido("El orden", 1, 99).optional(),
    duracionRealMinutos: enteroRequerido("La duración real", 0, 240).optional(),
  })
  .refine((datos) => datos.juegoId !== JUEGO_NUEVO || Boolean(datos.juegoNuevo?.nombre), {
    error: "El nombre del juego es obligatorio",
    path: ["juegoNuevo", "nombre"],
  });

/** Lo que valida y recibe la acción (con los `default` ya aplicados). */
export type ClaseInput = z.infer<typeof claseSchema>;
export type ActividadInput = z.infer<typeof actividadSchema>;

/** Lo que maneja el formulario, donde los campos con `default` son opcionales. */
export type ClaseFormValues = z.input<typeof claseSchema>;
export type ActividadFormValues = z.input<typeof actividadSchema>;
