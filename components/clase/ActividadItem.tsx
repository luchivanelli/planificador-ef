"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Timer } from "lucide-react";
import ActividadForm, { type ActividadEditable, type JuegoOpcion } from "@/components/clase/ActividadForm";
import Cronometro from "@/components/Cronometro";
import { TIPOS_BLOQUE } from "@/lib/types";

export type ActividadListada = ActividadEditable & { nombreJuego: string | null };

/** Cada tipo de bloque tiene su color: la secuencia se lee de un vistazo. */
const COLOR_BLOQUE: Record<string, { barra: string; pill: string }> = {
  entrada_calor: { barra: "border-l-amber-400", pill: "border-amber-200 bg-amber-50 text-amber-700" },
  desarrollo: { barra: "border-l-brand-500", pill: "border-brand-200 bg-brand-50 text-brand-700" },
  vuelta_calma: { barra: "border-l-teal-400", pill: "border-teal-200 bg-teal-50 text-teal-700" },
};

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
  const [cronometro, setCronometro] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: actividad.id,
  });

  const tipoBloque =
    TIPOS_BLOQUE.find((t) => t.value === actividad.tipoBloque)?.label ?? actividad.tipoBloque;
  const colores = COLOR_BLOQUE[actividad.tipoBloque] ?? COLOR_BLOQUE.desarrollo;
  const nombre = actividad.nombreJuego ?? "Sin juego específico";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // Sin `overflow-hidden`: el desplegable de juegos del formulario se abre
      // por encima de la tarjeta y quedaría recortado.
      className={`card border-l-4 ${colores.barra} ${
        isDragging ? "relative z-10 opacity-90 shadow-pop" : "card-hover"
      }`}
    >
      <div className="flex items-start gap-1.5 pl-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${nombre}`}
          className="mt-2.5 cursor-grab touch-none rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-100 hover:text-brand-600 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 py-2.5 pr-2.5">
          <details
            open={abierto}
            onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-100 px-1 text-[11px] font-bold text-ink-500">
                    {posicion}
                  </span>
                  <span className="text-sm font-bold text-ink-900 sm:text-base">{nombre}</span>
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className={`pill ${colores.pill}`}>{tipoBloque}</span>
                  <span className="pill">
                    <Timer className="h-3.5 w-3.5" />
                    {actividad.duracionMinutos} min
                  </span>
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1">
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Mostrar cronómetro"
                  onClick={(evento) => {
                    // Está dentro del `<summary>`: sin esto, además de prender el
                    // cronómetro abriría el formulario de edición.
                    evento.preventDefault();
                    evento.stopPropagation();
                    setCronometro((c) => !c);
                  }}
                  onKeyDown={(evento) => {
                    if (evento.key !== "Enter" && evento.key !== " ") return;
                    evento.preventDefault();
                    setCronometro((c) => !c);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                    cronometro
                      ? "bg-brand-100 text-brand-700"
                      : "text-ink-400 hover:bg-ink-100 hover:text-brand-600"
                  }`}
                >
                  <Timer className="h-4 w-4" />
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400">
                  <ChevronDown className={`h-4 w-4 transition ${abierto ? "rotate-180" : ""}`} />
                </span>
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

          {cronometro && (
            <div className="mt-3">
              <Cronometro duracionMinutos={actividad.duracionMinutos} titulo={nombre} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
