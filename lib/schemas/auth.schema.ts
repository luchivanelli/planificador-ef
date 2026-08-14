import { z } from "zod";
import { emailRequerido, textoRequerido } from "./common";

export const loginSchema = z.object({
  email: emailRequerido,
  password: z.string({ error: "La contraseña es obligatoria" }).min(1, "La contraseña es obligatoria"),
});

export const registroSchema = z.object({
  nombre: textoRequerido("El nombre", 80),
  apellido: textoRequerido("El apellido", 80),
  email: emailRequerido,
  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    // bcrypt ignora lo que pase de 72 bytes: mejor avisar que truncar en silencio.
    .max(72, "La contraseña no puede superar los 72 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
