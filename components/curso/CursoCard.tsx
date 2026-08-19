import Link from "next/link";
import { ChevronRight, MapPin, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { NIVELES, TURNOS } from "@/lib/types";
import type { Nivel, Turno } from "@prisma/client";

export type CursoResumen = {
  id: string;
  nombre: string;
  nivel: Nivel;
  turno: Turno;
  institucion: string;
  cantidadAlumnos: number;
};

/** Tarjeta de curso. Se usa igual en el panel de inicio y en "Mis cursos". */
export default function CursoCard({ curso }: { curso: CursoResumen }) {
  const nivel = NIVELES.find((n) => n.value === curso.nivel)?.label;
  const turno = TURNOS.find((t) => t.value === curso.turno)?.label;

  return (
    <Link
      href={`/cursos/${curso.id}`}
      className="card card-hover group flex items-center gap-3 p-3.5 sm:p-4"
    >
      <Avatar nombre={curso.nombre} tamanio="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-sm font-bold text-ink-900 sm:text-base">{curso.nombre}</p>
          <span className="pill pill-brand">
            {nivel} · {turno}
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-ink-500 sm:text-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="truncate">{curso.institucion}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500 sm:text-sm">
          <Users className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          {curso.cantidadAlumnos} {curso.cantidadAlumnos === 1 ? "alumno" : "alumnos"}
        </p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </Link>
  );
}
