"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, CircleOff, Clock3, Loader2, ShieldAlert } from "lucide-react";
import { marcarAsistencia } from "@/lib/actions/asistencia.actions";
import type { EstadoAsistencia } from "@prisma/client";

// Atado al enum de la base en vez de repetido a mano: así un estado que se
// agrega o se saca del schema rompe acá en compilación y no en producción.
type Estado = EstadoAsistencia;
export type { Estado };

const CICLO: Estado[] = ["presente", "ausente", "tarde", "SAF"];

const ESTILOS: Record<Estado, string> = {
  presente: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ausente: "border-rose-200 bg-rose-50 text-rose-700",
  tarde: "border-amber-200 bg-amber-50 text-amber-700",
  SAF: "border-ink-200 bg-ink-100 text-ink-600",
};

/** Cómo se ve el botón del estado cuando es el elegido. */
const ESTILOS_ACTIVOS: Record<Estado, string> = {
  presente: "border-emerald-500 bg-emerald-500 text-white",
  ausente: "border-rose-500 bg-rose-500 text-white",
  tarde: "border-amber-500 bg-amber-500 text-white",
  SAF: "border-ink-500 bg-ink-500 text-white",
};

const ETIQUETAS: Record<Estado, string> = {
  presente: "Presente",
  ausente: "Ausente",
  tarde: "Tarde",
  SAF: "SAF",
};

/** Abreviatura para los botones del celular, donde no entra la palabra entera. */
const ABREVIATURAS: Record<Estado, string> = {
  presente: "P",
  ausente: "A",
  tarde: "T",
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

  /**
   * Guarda el estado elegido. Antes había que tocar al alumno varias veces para
   * ciclar entre los cuatro estados; ahora cada uno tiene su botón, así que se
   * marca en un solo toque (y se puede corregir sin dar la vuelta completa).
   */
  function marcar(alumnoId: string, estado: Estado) {
    setEstados((prev) => ({ ...prev, [alumnoId]: estado }));
    startTransition(() => {
      marcarAsistencia(cursoId, alumnoId, fecha, estado, claseDiariaId);
    });
  }

  const ordenados = useMemo(
    () =>
      [...alumnos].sort(
        (a, b) =>
          a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" }) ||
          a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
      ),
    [alumnos]
  );

  const conteos = CICLO.map((estado) => ({
    estado,
    cantidad: Object.values(estados).filter((e) => e === estado).length,
  }));
  const marcados = conteos.reduce((total, c) => total + c.cantidad, 0);

  return (
    <div className="space-y-3">
      <div className="rounded-control border border-linea bg-ink-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink-600 sm:text-sm">
            {marcados} de {alumnos.length} marcados
          </p>
          {isPending ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-brand-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Guardando…
            </span>
          ) : (
            <span className="text-[11px] text-ink-400">Se guarda solo</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {conteos.map(({ estado, cantidad }) => (
            <span key={estado} className={`pill ${ESTILOS[estado]}`}>
              {ICONOS[estado]}
              {ETIQUETAS[estado]} {cantidad}
            </span>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {ordenados.map((alumno) => {
          const estado = estados[alumno.id];

          return (
            <li
              key={alumno.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-control border p-2 pl-3 transition ${
                estado ? "border-linea bg-white" : "border-dashed border-ink-300 bg-ink-50/60"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-800">
                {alumno.apellido}, {alumno.nombre}
              </span>

              <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Estado de asistencia">
                {CICLO.map((opcion) => {
                  const activo = estado === opcion;

                  return (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => marcar(alumno.id, opcion)}
                      aria-pressed={activo}
                      title={ETIQUETAS[opcion]}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-bold transition ${
                        activo
                          ? ESTILOS_ACTIVOS[opcion]
                          : "border-ink-200 bg-white text-ink-400 hover:border-brand-300 hover:text-brand-600"
                      }`}
                    >
                      <span className="sm:hidden">{ABREVIATURAS[opcion]}</span>
                      <span className="hidden sm:inline">{ETIQUETAS[opcion]}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
