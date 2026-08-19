import Link from "next/link";
import { Plus, School, SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/db";
import { buildCursosHref, getCursoFilterValues } from "@/lib/curso-filters";
import { NIVELES, TURNOS } from "@/lib/types";
import CursoCard from "@/components/curso/CursoCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

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

  const hayFiltros = Boolean(nivel || turno);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        titulo="Mis cursos"
        subtitulo="Filtrá por nivel y turno para encontrar rápidamente el curso que buscás."
        acciones={
          <Link href="/cursos/nuevo" className="button-primary">
            <Plus className="h-4 w-4" />
            Nuevo curso
          </Link>
        }
      />

      <section className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 pb-3">
          <SlidersHorizontal className="h-4 w-4 text-brand-500" />
          <p className="section-title">Filtros</p>
          {hayFiltros && (
            <Link href="/cursos" className="link-brand ml-auto text-xs">
              Limpiar
            </Link>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-500">Nivel</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={hrefFiltro(null, undefined)}
                className={`chip ${!nivel ? "chip-activo" : ""}`}
              >
                Todos
              </Link>
              {NIVELES.map((n) => (
                <Link
                  key={n.value}
                  href={hrefFiltro(n.value, undefined)}
                  className={`chip ${nivel === n.value ? "chip-activo" : ""}`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-500">Turno</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={hrefFiltro(undefined, null)}
                className={`chip ${!turno ? "chip-activo" : ""}`}
              >
                Todos
              </Link>
              {TURNOS.map((t) => (
                <Link
                  key={t.value}
                  href={hrefFiltro(undefined, t.value)}
                  className={`chip ${turno === t.value ? "chip-activo" : ""}`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="section-title">
            {cursos.length} {cursos.length === 1 ? "curso" : "cursos"}
          </p>
        </div>

        {cursos.length === 0 ? (
          <EmptyState
            icono={School}
            titulo={hayFiltros ? "No hay cursos con estos filtros" : "Todavía no hay cursos"}
            descripcion={
              hayFiltros
                ? "Probá quitando algún filtro para ver más resultados."
                : "Creá tu primer curso para empezar a planificar."
            }
            accion={
              hayFiltros ? (
                <Link href="/cursos" className="button-secondary">
                  Ver todos los cursos
                </Link>
              ) : (
                <Link href="/cursos/nuevo" className="button-primary">
                  <Plus className="h-4 w-4" />
                  Nuevo curso
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {cursos.map((curso) => (
              <CursoCard
                key={curso.id}
                curso={{
                  id: curso.id,
                  nombre: curso.nombre,
                  nivel: curso.nivel,
                  turno: curso.turno,
                  institucion: curso.institucion.nombre,
                  cantidadAlumnos: curso.alumnos.length,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default cursosPage;
