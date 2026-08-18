"use client";
import React, { useMemo, useState } from "react";
import { Info, FileText } from "lucide-react";
import EditarAlumnoForm from "@/components/alumno/EditarAlumnoForm";
import ObservacionesAlumnoForm from "@/components/alumno/ObservacionesAlumnoForm";

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
  const selectedObservacion = selectedObservacionId ? alumnos.find((a) => a.id === selectedObservacionId) : null;

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar alumnos por nombre o apellido"
        className="input-shell mb-4 w-full"
      />

      <ul className="mb-4 space-y-2.5 overflow-y-auto max-h-[250px]">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No se encontraron alumnos.</p>
        ) : (
          filtered.map((a) => (
            <li
              key={a.id}
              className="flex justify-between items-center text-sm sm:text-base text-slate-700 border-b border-slate-200 px-1"
            >
              <span>{a.apellido}, {a.nombre}</span>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full p-1 hover:bg-slate-100"
                  onClick={() => setSelectedAlumnoId((current) => (current === a.id ? null : a.id))}
                  aria-label="Editar alumno"
                >
                  <Info className="h-3.5 sm:h-4.5 w-3.5 sm:w-4.5 text-[#0f63ff]" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full p-1 hover:bg-slate-100"
                  onClick={() => setSelectedObservacionId((current) => (current === a.id ? null : a.id))}
                  aria-label="Seguimiento y observaciones del alumno"
                >
                  <FileText className="h-3.5 sm:h-4.5 w-3.5 sm:w-4.5 text-[#0f63ff]" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

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
    </div>
  );
}
