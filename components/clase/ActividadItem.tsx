"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import ActividadForm, { type ActividadEditable, type JuegoOpcion } from "@/components/clase/ActividadForm";
import { TIPOS_BLOQUE } from "@/lib/types";

export type ActividadListada = ActividadEditable & { nombreJuego: string | null };

/**
 * El asa de arrastre queda fuera del `<details>`: si estuviera dentro del
 * `<summary>`, cada intento de mover la actividad abriría el formulario.
 */
export default function ActividadItem({
  posicion,
  claseId,
  cursoId,
  unidadDidacticaId,
  juegos,
  actividad,
}: {
  posicion: number;
  claseId: string;
  cursoId: string;
  unidadDidacticaId: string;
  juegos: JuegoOpcion[];
  actividad: ActividadListada;
}) {
  const [abierto, setAbierto] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: actividad.id,
  });

  const tipoBloque =
    TIPOS_BLOQUE.find((t) => t.value === actividad.tipoBloque)?.label ?? actividad.tipoBloque;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 border border-slate-200 bg-slate-50 border-l-4 border-l-[#0f63ff] p-3 ${
        isDragging ? "relative z-10 opacity-80 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${actividad.nombreJuego ?? "actividad"}`}
        className="cursor-grab touch-none p-1 text-slate-400 hover:text-[#0f63ff] active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <details
        open={abierto}
        onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}
        className="min-w-0 flex-1"
      >
        <summary className="flex cursor-pointer list-none flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400 sm:text-base">{posicion}.</span>
            <span className="text-sm font-semibold text-slate-900 sm:text-base">
              {actividad.nombreJuego ?? "Sin juego específico"}
            </span>
          </div>
          <span className="rounded-full border border-[#0f63ff]/20 bg-[#0f63ff]/10 px-2 py-0.5 text-xs font-medium text-[#0f63ff] sm:py-1 sm:text-sm">
            {tipoBloque} · {actividad.duracionMinutos} min
          </span>
        </summary>
        {abierto && (
          <ActividadForm
            claseId={claseId}
            cursoId={cursoId}
            unidadDidacticaId={unidadDidacticaId}
            juegos={juegos}
            actividad={actividad}
            onGuardado={() => setAbierto(false)}
          />
        )}
      </details>
    </div>
  );
}
