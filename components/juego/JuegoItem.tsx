"use client";

import { useState } from "react";
import { ChevronDown, Package, Pencil } from "lucide-react";
import JuegoForm, { type JuegoEditable } from "@/components/juego/JuegoForm";

export type JuegoListado = JuegoEditable & { etiqueta: string };

/** El formulario de edición, con su botón de eliminar, se despliega acá dentro. */
export default function JuegoItem({ juego }: { juego: JuegoListado }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={`card ${abierto ? "border-brand-200" : "card-hover"} overflow-hidden`}>
      <details
        open={abierto}
        onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink-900 sm:text-base">{juego.nombre}</span>
                <span className="pill pill-brand">{juego.etiqueta}</span>
              </span>

              {juego.descripcion && (
                <span className="mt-2 block text-xs leading-relaxed text-ink-500 sm:text-sm">
                  {juego.descripcion.length > 140
                    ? `${juego.descripcion.slice(0, 140).trim()}…`
                    : juego.descripcion}
                </span>
              )}

              {juego.materiales.length > 0 && (
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                  {juego.materiales.map((material) => (
                    <span key={material} className="pill">
                      {material}
                    </span>
                  ))}
                </span>
              )}
            </span>

            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                abierto ? "bg-brand-50 text-brand-600" : "text-ink-400"
              }`}
              title={abierto ? "Cerrar" : "Editar juego"}
            >
              {abierto ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Pencil className="h-4 w-4" />}
            </span>
          </span>
        </summary>

        {abierto && (
          <div className="border-t border-linea bg-ink-50/60 px-4 pb-4">
            <JuegoForm
              juego={juego}
              onGuardado={() => setAbierto(false)}
              onCancelar={() => setAbierto(false)}
            />
          </div>
        )}
      </details>
    </div>
  );
}
