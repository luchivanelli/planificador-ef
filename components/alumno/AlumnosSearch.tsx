"use client";

import React, { useMemo, useState } from "react";
import { FileText, Pencil, UserRound } from "lucide-react";
import EditarAlumnoForm from "@/components/alumno/EditarAlumnoForm";
import ObservacionesAlumnoForm from "@/components/alumno/ObservacionesAlumnoForm";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";

type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  contactoEmergencia?: string | null;
  observaciones?: string | null;
};

export default function AlumnosSearch({ alumnos, cursoId }: { alumnos: Alumno[]; cursoId: string }) {
  const [q, setQ] = useState("");
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string | null>(null);
  const [selectedObservacionId, setSelectedObservacionId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    const result = !s
      ? [...alumnos]
      : alumnos.filter((a) => {
          const full = `${a.nombre} ${a.apellido}`.toLowerCase();
          const rev = `${a.apellido} ${a.nombre}`.toLowerCase();
          return full.includes(s) || rev.includes(s);
        });

    return result.sort((a, b) => {
      const apellido = a.apellido.localeCompare(b.apellido, "es", {
        sensitivity: "base",
      });

      if (apellido !== 0) return apellido;

      return a.nombre.localeCompare(b.nombre, "es", {
        sensitivity: "base",
      });
    });
  }, [q, alumnos]);

  const selectedAlumno = selectedAlumnoId ? alumnos.find((a) => a.id === selectedAlumnoId) : null;
  const selectedObservacion = selectedObservacionId
    ? alumnos.find((a) => a.id === selectedObservacionId)
    : null;

  return (
    <div className="space-y-3">
      <SearchInput valor={q} onCambio={setQ} placeholder="Buscar alumno por nombre o apellido" />

      {selectedAlumno && (
        // El `key` remonta el formulario al cambiar de alumno, así arranca con
        // los valores por defecto correctos.
        <EditarAlumnoForm
          key={`editar-${selectedAlumno.id}`}
          alumno={selectedAlumno}
          cursoId={cursoId}
          onCerrar={() => setSelectedAlumnoId(null)}
          onEliminado={() => {
            setSelectedAlumnoId(null);
            setSelectedObservacionId((current) => (current === selectedAlumno.id ? null : current));
          }}
        />
      )}

      {selectedObservacion && (
        <ObservacionesAlumnoForm
          key={`observaciones-${selectedObservacion.id}`}
          alumno={selectedObservacion}
          cursoId={cursoId}
          onCerrar={() => setSelectedObservacionId(null)}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icono={UserRound}
          titulo={q ? "No se encontraron alumnos" : "Todavía no hay alumnos"}
          descripcion={
            q
              ? "Probá con otro nombre o apellido."
              : "Agregá alumnos al curso para poder tomar asistencia y evaluar."
          }
        />
      ) : (
        <ul className="divide-y divide-linea overflow-hidden rounded-control border border-linea">
          {filtered.map((a) => {
            const editando = selectedAlumnoId === a.id;
            const observando = selectedObservacionId === a.id;

            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 px-3 py-2.5 transition ${
                  editando || observando ? "bg-brand-50/60" : "bg-white hover:bg-ink-50"
                }`}
              >
                <Avatar nombre={`${a.nombre} ${a.apellido}`} tamanio="sm" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {a.apellido}, {a.nombre}
                  </p>
                  {a.observaciones && (
                    <p className="truncate text-xs text-ink-400">Con observaciones cargadas</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Editar datos del alumno"
                    aria-label={`Editar datos de ${a.nombre} ${a.apellido}`}
                    onClick={() => setSelectedAlumnoId((current) => (current === a.id ? null : a.id))}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                      editando
                        ? "border-brand-300 bg-brand-100 text-brand-700"
                        : "border-ink-200 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"
                    }`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Seguimiento y observaciones"
                    aria-label={`Observaciones de ${a.nombre} ${a.apellido}`}
                    onClick={() =>
                      setSelectedObservacionId((current) => (current === a.id ? null : a.id))
                    }
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                      observando
                        ? "border-brand-300 bg-brand-100 text-brand-700"
                        : "border-ink-200 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
