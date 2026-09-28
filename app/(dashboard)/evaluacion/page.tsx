import Link from "next/link";
import { GraduationCap, School, SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { buildCursosHref, getCursoFilterValues } from "@/lib/curso-filters";
import { NIVELES, TURNOS } from "@/lib/types";
import CursoCard from "@/components/curso/CursoCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

/**
 * La puerta de entrada a la evaluación general: primero el curso, después el
 * período. La evaluación siempre es de un curso, así que no hay forma de
 * empezar sin elegir uno.
 *
 * Los filtros son los mismos que los de "Mis cursos" y se arman con el mismo
 * helper (`buildCursosHref`), así que las dos pantallas se comportan igual.
 */
export default async function EvaluacionPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; turno?: string }>;
}) {
  const { nivel, turno } = getCursoFilterValues(await searchParams);

  // Antes de tocar la base: sin sesión no se llega a consultar nada.
  const docente = await requerirDocente();

  const cursos = await db.curso.findMany({
    // Cada docente evalúa sólo sus cursos.
    where: { docenteId: docente.id, nivel, turno },
    // La tarjeta sólo muestra el nombre de la institución y cuántos alumnos
    // activos hay: traer las filas enteras era traerse columnas que nadie lee.
    select: {
      id: true,
      nombre: true,
      nivel: true,
      turno: true,
      institucion: { select: { nombre: true } },
      alumnos: { where: { fechaBaja: null }, select: { alumnoId: true } },
    },
    orderBy: { nombre: "asc" },
  });

  function hrefFiltro(nuevoNivel?: string | null, nuevoTurno?: string | null) {
    return buildCursosHref({ nivel, turno }, { nivel: nuevoNivel, turno: nuevoTurno }, "/evaluacion");
  }

  const hayFiltros = Boolean(nivel || turno);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        titulo="Evaluación general"
        subtitulo="Elegí un curso y un período: el sistema junta los puntajes de las rúbricas y la asistencia de esas fechas y te sugiere una nota para cada alumno."
      />

      <section className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 pb-3">
          <SlidersHorizontal className="h-4 w-4 text-brand-500" />
          <p className="section-title">Filtros</p>
          {hayFiltros && (
            <Link href="/evaluacion" className="link-brand ml-auto text-xs">
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
        <p className="section-title mb-3">
          {cursos.length} {cursos.length === 1 ? "curso" : "cursos"}
        </p>

        {cursos.length === 0 ? (
          <EmptyState
            icono={School}
            titulo={
              hayFiltros ? "No hay cursos con estos filtros" : "Todavía no hay cursos para evaluar"
            }
            descripcion={
              hayFiltros
                ? "Probá quitando algún filtro para ver más resultados."
                : "Creá un curso, cargá sus alumnos y sus clases: con eso ya se puede armar la evaluación del período."
            }
            accion={
              hayFiltros ? (
                <Link href="/evaluacion" className="button-secondary">
                  Ver todos los cursos
                </Link>
              ) : (
                <Link href="/cursos/nuevo" className="button-primary">
                  <GraduationCap className="h-4 w-4" />
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
                href={`/evaluacion/${curso.id}`}
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
}
