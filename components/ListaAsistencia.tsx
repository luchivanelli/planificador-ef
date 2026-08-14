"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleOff, Clock3, ShieldAlert, Sparkles } from "lucide-react";
import { marcarAsistencia } from "@/lib/actions/asistencia.actions";
import type { EstadoAsistencia } from "@prisma/client";

// Atado al enum de la base en vez de repetido a mano: así un estado que se
// agrega o se saca del schema rompe acá en compilación y no en producción.
type Estado = EstadoAsistencia;
export type { Estado };

const CICLO: Estado[] = ["presente", "ausente", "tarde", "SAF"];

const ESTILOS: Record<Estado, string> = {
  presente: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ausente: "bg-rose-50 text-rose-700 border-rose-200",
  tarde: "bg-amber-50 text-amber-700 border-amber-200",
  SAF: "bg-slate-100 text-slate-600 border-slate-200",
};

const ETIQUETAS: Record<Estado, string> = {
  presente: "Presente",
  ausente: "Ausente",
  tarde: "Tarde",
  SAF: "SAF",
};

const ICONOS: Record<Estado, React.ReactNode> = {
  presente: <CheckCircle2 className="h-4 w-4" />,
  ausente: <CircleOff className="h-4 w-4" />,
  tarde: <Clock3 className="h-4 w-4" />,
  SAF: <ShieldAlert className="h-4 w-4" />,
};

export default function ListaAsistencia({
  cursoId,
  fecha,
  claseDiariaId,
  alumnos,
  estadosIniciales,
}: {
  cursoId: string;
  fecha: string;
  claseDiariaId?: string;
  alumnos: { id: string; nombre: string; apellido: string }[];
  estadosIniciales: Record<string, Estado | undefined>;
}) {
  const [estados, setEstados] = useState(estadosIniciales);
  const [isPending, startTransition] = useTransition();

  function toggle(alumnoId: string) {
    const actual = estados[alumnoId];
    const idx = actual ? CICLO.indexOf(actual) : -1;
    const siguiente = CICLO[(idx + 1) % CICLO.length];

    setEstados((prev) => ({ ...prev, [alumnoId]: siguiente }));
    startTransition(() => {
      marcarAsistencia(cursoId, alumnoId, fecha, siguiente, claseDiariaId);
    });
  }

  const presentes = Object.values(estados).filter((e) => e === "presente" || e === "tarde" || e === "SAF").length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between border border-dashed border-slate-200 px-3 py-2">
        <p className="text-xs font-medium text-slate-500">
          {presentes}/{alumnos.length} presentes
        </p>
        {isPending ? (
          <p className="flex items-center gap-1 text-xs text-[#0f63ff]">
            <Sparkles className="h-3.5 w-3.5" /> Guardando…
          </p>
        ) : (
          <p className="text-[11px] text-slate-400">Tocá en el alumno para cambiar</p>
        )}
      </div>
      <div className="space-y-2 overflow-y-auto max-h-[300px]">
        {alumnos.map((a) => {
          const estado = estados[a.id];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className="flex w-full items-center justify-between border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-[#0f63ff]/40 hover:bg-slate-50"
            >
              <span className="text-sm font-medium text-slate-800">
                {a.apellido}, {a.nombre}
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  estado ? ESTILOS[estado] : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {estado ? ICONOS[estado] : null}
                {estado ? ETIQUETAS[estado] : "Sin marcar"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
