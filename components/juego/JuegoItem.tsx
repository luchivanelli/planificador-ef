"use client";

import { useState } from "react";
import JuegoForm, { type JuegoEditable } from "@/components/juego/JuegoForm";

export type JuegoListado = JuegoEditable & { etiqueta: string };

/** El formulario de edición, con su botón de eliminar, se despliega acá dentro. */
export default function JuegoItem({ juego }: { juego: JuegoListado }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="border border-primary bg-white p-4">
      <details
        open={abierto}
        onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 sm:text-lg">{juego.nombre}</span>
            <span className="rounded-full border-1 border-[#0f63ff]/20 bg-[#0f63ff]/10 px-2 py-0.5 text-[11px] font-medium text-[#0f63ff] sm:py-1 sm:text-xs">
              {juego.etiqueta}
            </span>
          </span>
          <span className="mt-2 block text-xs text-slate-500 sm:text-sm">{juego.descripcion ? juego.descripcion.slice(0, 100).trim() + "..." : ""}</span>
          {juego.materiales.length > 0 && (
            <span className="mt-2 block text-xs text-slate-500 sm:text-sm">
              <strong className="text-[#0f63ff] font-normal">Materiales:</strong> {juego.materiales.join(", ")}
            </span>
          )}
        </summary>
        {abierto && (
          <JuegoForm
            juego={juego}
            onGuardado={() => setAbierto(false)}
            onCancelar={() => setAbierto(false)}
          />
        )}
      </details>
    </div>
  );
}
