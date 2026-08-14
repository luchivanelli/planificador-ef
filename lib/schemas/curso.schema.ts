import { z } from "zod";
import { CICLOS_POR_NIVEL } from "@/lib/types";
import {
  enteroRequerido,
  fechaRequerida,
  textoOpcional,
  textoRequerido,
  textoRequeridoConFormato,
} from "./common";

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

const hoy = () => new Date().toISOString().slice(0, 10);

export const alumnoSchema = z.object({
  nombre: textoRequerido("El nombre", 60),
  apellido: textoRequerido("El apellido", 60),
  fechaNacimiento: fechaRequerida("La fecha de nacimiento")
    .refine((valor) => valor >= "1900-01-01", "La fecha de nacimiento no es válida")
    .refine((valor) => valor <= hoy(), "La fecha de nacimiento no puede ser futura"),
  dni: textoRequeridoConFormato(
    "El DNI",
    /^\d{7,9}$/,
    "El DNI debe tener entre 7 y 9 números, sin puntos"
  ),
  contactoEmergencia: textoOpcional("El contacto de emergencia", 120),
});

export const observacionesMedicasSchema = z.object({
  observacionesMedicas: textoOpcional("La observación médica", 2000),
});

export type CursoInput = z.infer<typeof cursoSchema>;
export type AlumnoInput = z.infer<typeof alumnoSchema>;
export type ObservacionesMedicasInput = z.infer<typeof observacionesMedicasSchema>;
