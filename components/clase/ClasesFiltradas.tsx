"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { EstadoClase } from "@prisma/client";
import type { PresentacionClase } from "@/lib/clases/estado";

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
  { value: "programada", label: "Programadas" },
  { value: "dictada", label: "Dictadas" },
  { value: "suspendida", label: "Suspendidas" },
  { value: "cancelada", label: "Canceladas" },
  { value: "sin_asistencia", label: "Sin asistencia" },
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

const pill = (activo: boolean) =>
  `rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${
    activo ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"
  }`;

export default function ClasesFiltradas({ clases, cursoId }: { clases: ClaseListada[]; cursoId: string }) {
  const [estado, setEstado] = useState<ClaveEstado | null>(null);
  const [q, setQ] = useState("");

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
      <div className="surface-card p-5 text-center text-sm text-slate-500">
        Todavía no hay clases cargadas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="surface-card p-5 sm:p-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar clase por tema"
          className="input-shell mb-3 w-full"
        />

        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setEstado(null)} className={pill(!estado)}>
            Todas
          </button>
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => setEstado(e.value)}
              className={pill(estado === e.value)}
            >
              {e.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2 overflow-y-auto max-h-[300px]">
        {filtradas.map((clase) => (
          <div key={clase.id} className="block border border-slate-200 border-l-[3px] border-l-[#0f63ff] p-3 md:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <Link href={`/cursos/${cursoId}/clase/${clase.id}`} className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  <span className={clase.presentacion.colorTexto} title={clase.presentacion.etiqueta}>
                    {clase.presentacion.icono}
                  </span>{" "}
                  {clase.titulo}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {clase.fecha}
                  {clase.horario}
                  {" · "}
                  <span className={clase.presentacion.colorTexto}>{clase.presentacion.etiqueta}</span>
                </p>
              </Link>
            </div>
          </div>
        ))}
        {filtradas.length === 0 && (
          <div className="surface-card p-5 text-center text-sm text-slate-500">
            No hay clases con estos filtros.
          </div>
        )}
      </section>
    </div>
  );
}
