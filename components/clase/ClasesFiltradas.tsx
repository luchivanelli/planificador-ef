"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarX2, ChevronRight } from "lucide-react";
import type { EstadoClase } from "@prisma/client";
import type { PresentacionClase } from "@/lib/clases/estado";
import ClaseBadge from "@/components/clase/ClaseBadge";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";

export type ClaseListada = {
  id: string;
  titulo: string;
  fecha: string;
  horario: string;
  estado: EstadoClase;
  presentacion: PresentacionClase;
};

/**
 * Las claves del filtro no son los `EstadoClase` crudos: "sin asistencia" es un
 * estado derivado del reloj (ver `presentacionClase`) y no existe en la base.
 */
type ClaveEstado = "programada" | "dictada" | "suspendida" | "cancelada" | "sin_asistencia";

const ESTADOS: { value: ClaveEstado; label: string }[] = [
  { value: "sin_asistencia", label: "Sin asistencia" },
  { value: "programada", label: "Programadas" },
  { value: "dictada", label: "Dictadas" },
  { value: "suspendida", label: "Suspendidas" },
  { value: "cancelada", label: "Canceladas" },
];

function claveEstado(clase: ClaseListada): ClaveEstado | null {
  if (clase.presentacion.requiereAtencion) return "sin_asistencia";
  if (clase.estado === "suspendida") return "suspendida";
  if (clase.estado === "cancelada") return "cancelada";
  // La barrida todavía puede no haber pasado a `dictada` una clase ya cerrada:
  // la etiqueta es la que manda.
  if (clase.estado === "dictada" || clase.presentacion.etiqueta === "Dictada") return "dictada";
  // "Programada" es sólo la que todavía no empezó: una clase en curso ya no
  // entra acá (ver `presentacionClase`).
  if (clase.presentacion.etiqueta === "Programada") return "programada";
  return null;
}

export default function ClasesFiltradas({
  clases,
  cursoId,
}: {
  clases: ClaseListada[];
  cursoId: string;
}) {
  const [estado, setEstado] = useState<ClaveEstado | null>(null);
  const [q, setQ] = useState("");

  // Cuántas clases hay en cada filtro: así se ve de una qué vale la pena tocar.
  const conteos = useMemo(() => {
    const acumulado: Partial<Record<ClaveEstado, number>> = {};
    for (const clase of clases) {
      const clave = claveEstado(clase);
      if (clave) acumulado[clave] = (acumulado[clave] ?? 0) + 1;
    }
    return acumulado;
  }, [clases]);

  const filtradas = useMemo(() => {
    const busqueda = q.trim().toLowerCase();

    return clases.filter((clase) => {
      if (estado && claveEstado(clase) !== estado) return false;
      if (busqueda && !clase.titulo.toLowerCase().includes(busqueda)) return false;
      return true;
    });
  }, [clases, estado, q]);

  if (clases.length === 0) {
    return (
      <EmptyState
        icono={CalendarX2}
        titulo="Todavía no hay clases cargadas"
        descripcion="Agregá la primera clase de esta unidad con el botón de abajo."
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-4 sm:p-5">
        <SearchInput valor={q} onCambio={setQ} placeholder="Buscar clase por tema" />

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" onClick={() => setEstado(null)} className={`chip ${!estado ? "chip-activo" : ""}`}>
            Todas <span className="opacity-70">{clases.length}</span>
          </button>
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => setEstado(e.value)}
              className={`chip ${estado === e.value ? "chip-activo" : ""}`}
            >
              {e.label} <span className="opacity-70">{conteos[e.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        {filtradas.map((clase) => (
          <Link
            key={clase.id}
            href={`/cursos/${cursoId}/clase/${clase.id}`}
            className="card card-hover group flex items-center gap-3 border-l-[3px] border-l-brand-500 p-3.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold text-ink-900 sm:text-base">{clase.titulo}</p>
                <ClaseBadge presentacion={clase.presentacion} />
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500 sm:text-sm">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                {clase.fecha}
                {clase.horario}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </Link>
        ))}

        {filtradas.length === 0 && (
          <EmptyState
            icono={CalendarX2}
            titulo="No hay clases con estos filtros"
            descripcion="Probá con otro estado o limpiá la búsqueda."
          />
        )}
      </section>
    </div>
  );
}
