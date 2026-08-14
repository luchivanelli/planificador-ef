import { School, MapPin, User, Plus } from 'lucide-react';
import { db } from "@/lib/db";
import { buildCursosHref, getCursoFilterValues } from "@/lib/curso-filters";
import Link from 'next/link';
import {NIVELES, TURNOS} from "@/lib/types";

const cursosPage = async ({
    searchParams,
  }: {
    searchParams: Promise<{ nivel?: string; turno?: string }>;
  }) => {

  const rawParams = await searchParams;
  const { nivel, turno } = getCursoFilterValues(rawParams);

  const cursos = await db.curso.findMany({
    where: {
      nivel,
      turno,
    },
    include: { alumnos: true, institucion: true },
    orderBy: { nombre: "asc" },
  });

  function hrefFiltro(nuevoNivel?: string | null, nuevoTurno?: string | null) {
    return buildCursosHref({ nivel, turno }, { nivel: nuevoNivel, turno: nuevoTurno });
  }

  return (
    <div className="space-y-4">
      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-4 sm:items-center">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <School className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Mis cursos</h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Filtrá por nivel y turno para encontrar rápidamente el curso que buscás.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={hrefFiltro(null, undefined)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${!nivel ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
            >
              Todos los niveles
            </Link>
            {NIVELES.map((n) => (
              <Link
                key={n.value}
                href={hrefFiltro(n.value, undefined)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${nivel === n.value ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={hrefFiltro(undefined, null)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${!turno ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
            >
              Todas los turnos
            </Link>
            {TURNOS.map((t) => (
              <Link
                key={t.value}
                href={hrefFiltro(undefined, t.value)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${turno === t.value ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2 pl-0 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        <div className="grid gap-3 md:grid-cols-2">
          {cursos.map((curso) => (
            <Link key={curso.id} href={`/cursos/${curso.id}`} className="block border-primary bg-white p-4 sm:flex sm:items-start sm:justify-between sm:gap-4 cursor-pointer">
              <div className="space-y-1 w-full">
                <div className="flex flex-wrap justify-between items-center gap-1">
                  <p className="text-sm pr-2 font-semibold text-slate-900 sm:text-lg">{curso.nombre}</p>
                  <span className="border-1 border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff] text-[11px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full">
                    {NIVELES.find((n) => n.value === curso.nivel)?.label} · {TURNOS.find((t) => t.value === curso.turno)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-[#0f63ff]"/>
                  <p className="text-xs text-slate-500 sm:text-sm">{curso.institucion.nombre}</p>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 sm:h-4 w-3 sm:w-4 text-[#0f63ff]"/>
                  <p className="text-xs text-slate-500 sm:text-sm">{curso.alumnos.length} alumnos</p>
                </div>
              </div>
            </Link>
          ))}
          {cursos.length === 0 && (
            <div className="surface-card w-full p-5 text-center text-sm sm:text-base text-slate-500">No hay cursos con estos filtros.</div>
          )}
        </div>
      </section>

      <Link href="/cursos/nuevo" className="flex items-center surface-card p-5 text-sm sm:text-base font-semibold text-slate-900">
        <Plus className="mr-2 h-3 sm:h-4 w-3 sm:w-4"/>
        Nuevo curso
      </Link>
    </div>
  )
}

export default cursosPage