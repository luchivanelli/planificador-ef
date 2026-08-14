import type { z } from "zod";

export type ErroresPorCampo = Record<string, string>;

/**
 * Contrato único de todas las server actions que atienden formularios.
 * Los fallos esperables (validación, permisos, duplicados) se devuelven en vez
 * de lanzarse, así el cliente los puede pintar campo por campo con React Hook Form.
 */
export type ResultadoAccion<T = undefined> =
  | { ok: true; data: T; redirectTo?: string }
  | { ok: false; error: string; erroresPorCampo?: ErroresPorCampo };

export function exito<T = undefined>(data?: T, redirectTo?: string): ResultadoAccion<T> {
  return { ok: true, data: data as T, redirectTo };
}

export function fallo(error: string, erroresPorCampo?: ErroresPorCampo) {
  return { ok: false as const, error, erroresPorCampo };
}

export function mensajeDeError(error: unknown, porDefecto: string) {
  return error instanceof Error && error.message ? error.message : porDefecto;
}

type Validacion<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; erroresPorCampo: ErroresPorCampo };

/**
 * Revalida en el servidor con el mismo esquema Zod que usa el formulario:
 * el cliente puede ser manipulado, así que la validación de la UI no alcanza.
 */
export function validarPayload<S extends z.ZodType>(schema: S, input: unknown): Validacion<z.output<S>> {
  const resultado = schema.safeParse(input);

  if (resultado.success) {
    return { ok: true, data: resultado.data };
  }

  const erroresPorCampo: ErroresPorCampo = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.map(String).join(".");
    if (campo && !erroresPorCampo[campo]) {
      erroresPorCampo[campo] = issue.message;
    }
  }

  const primerMensaje = Object.values(erroresPorCampo)[0] ?? resultado.error.issues[0]?.message;

  return {
    ok: false,
    error: primerMensaje ?? "Revisá los datos del formulario",
    erroresPorCampo,
  };
}
