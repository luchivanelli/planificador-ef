import { z } from "zod";
import { CICLOS_POR_NIVEL } from "@/lib/types";
import { enteroRequerido, listaOpcional, textoOpcional, textoRequerido } from "./common";

export const nivelSchema = z.enum(["primaria", "secundaria"], { error: "Elegí un nivel" });

export const cicloSchema = z.enum(
  ["primer_ciclo", "segundo_ciclo", "septimo_anio", "ciclo_basico", "ciclo_orientado"],
  { error: "Elegí un ciclo" }
);

export const cursoSchema = z
  .object({
    institucion: textoRequerido("La institución", 120),
    nombre: textoRequerido("El nombre del curso", 60),
    nivel: nivelSchema,
    ciclo: cicloSchema,
    turno: z.enum(["manana", "tarde"], { error: "Elegí un turno" }),
    anioLectivo: enteroRequerido("El año lectivo", 2000, 2100),
  })
  .refine(
    (datos) => CICLOS_POR_NIVEL[datos.nivel].some((ciclo) => ciclo.value === datos.ciclo),
    { error: "El ciclo no corresponde al nivel elegido", path: ["ciclo"] }
  );

export const alumnoSchema = z.object({
  nombre: textoRequerido("El nombre", 60),
  apellido: textoRequerido("El apellido", 60),
  contactoEmergencia: textoOpcional("El contacto de emergencia", 120),
});

export const observacionesAlumnoSchema = z.object({
  // Lista: un ítem por línea (ver `listaOpcional`).
  observaciones: listaOpcional("Las observaciones", 2000),
});

export const diagnosticoGrupalSchema = z.object({
  // Lista: un ítem por línea (ver `listaOpcional`).
  diagnosticoGrupal: listaOpcional("El diagnóstico grupal", 2000),
});

export type CursoInput = z.infer<typeof cursoSchema>;
export type AlumnoInput = z.infer<typeof alumnoSchema>;
export type ObservacionesAlumnoInput = z.infer<typeof observacionesAlumnoSchema>;
export type DiagnosticoGrupalInput = z.infer<typeof diagnosticoGrupalSchema>;
