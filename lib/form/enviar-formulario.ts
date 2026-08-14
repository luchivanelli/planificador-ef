"use client";

import { unstable_rethrow } from "next/navigation";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ErroresPorCampo, ResultadoAccion } from "./action-result";

function aplicarErroresDeServidor<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: string,
  erroresPorCampo?: ErroresPorCampo
) {
  const campos = Object.entries(erroresPorCampo ?? {});

  for (const [campo, mensaje] of campos) {
    setError(campo as Path<T>, { type: "server", message: mensaje });
  }

  // Sin errores por campo (permisos, duplicados, fallas de red) el mensaje va al
  // error general del formulario.
  if (campos.length === 0) {
    setError("root", { type: "server", message: error });
  }
}

type Opciones<T extends FieldValues, D> = {
  setError: UseFormSetError<T>;
  accion: () => Promise<ResultadoAccion<D>>;
  onExito?: (data: D, redirectTo?: string) => void;
  errorInesperado?: string;
};

/**
 * Envuelve la llamada a una server action desde `handleSubmit`:
 * pasa los errores del servidor al formulario y deja pasar los errores de
 * control de Next (redirect, notFound) para que el framework los maneje.
 */
export async function enviarFormulario<T extends FieldValues, D>({
  setError,
  accion,
  onExito,
  errorInesperado = "Ocurrió un error inesperado. Intentá de nuevo.",
}: Opciones<T, D>): Promise<boolean> {
  try {
    const resultado = await accion();

    if (!resultado.ok) {
      aplicarErroresDeServidor(setError, resultado.error, resultado.erroresPorCampo);
      return false;
    }

    onExito?.(resultado.data, resultado.redirectTo);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    aplicarErroresDeServidor(setError, errorInesperado);
    return false;
  }
}
