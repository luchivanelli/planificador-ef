"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

/**
 * Red de contención del panel: si una página falla, la docente ve un mensaje en
 * castellano y un botón para reintentar, en vez de la pantalla de error cruda.
 */
export default function ErrorDashboard({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <TriangleAlert className="h-7 w-7" />
      </span>
      <h1 className="page-title mt-4">Algo no salió como esperábamos</h1>
      <p className="page-subtitle mt-2">
        No pudimos cargar esta sección. Podés reintentar; si sigue pasando, volvé a entrar más tarde.
      </p>
      <button type="button" onClick={reset} className="button-primary mt-6 w-full">
        <RotateCcw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}
