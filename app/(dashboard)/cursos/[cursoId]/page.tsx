import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarRange,
  ChevronRight,
  ClipboardList,
  Clock,
  Layers,
  MapPin,
  NotebookPen,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import AddAlumnoClient from "@/components/alumno/AddAlumnoClient";
import AlumnosSearch from "@/components/alumno/AlumnosSearch";
import DiagnosticoGrupalForm from "@/components/curso/DiagnosticoGrupalForm";
import EditarCursoForm from "@/components/curso/EditarCursoForm";
import { NIVELES, TURNOS } from "@/lib/types";
import { aFechaLegible } from "@/lib/schemas/common";
import PlanificacionForm from "@/components/planificacion y unidades/PlanificacionForm";
import { GenericToast } from "@/components/GenericToast";
import Disclosure from "@/components/ui/Disclosure";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import StatTile from "@/components/ui/StatTile";

export default async function CursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ cursoId: string }>;
  searchParams: Promise<{ updatedPlanificacion?: string }>;
}) {
  const { cursoId } = await params;
  const { updatedPlanificacion } = await searchParams;

  const curso = await db.curso.findUnique({
    where: { id: cursoId },
    include: { alumnos: { include: { alumno: true } }, institucion: true },
  });
  if (!curso) notFound();

  const planificaciones = await db.planificacion.findMany({
    where: { cursoId },
    // Cada unidad muestra cuántas clases tiene cargadas.
    include: { unidades: { include: { _count: { select: { clases: true } } } } },
    orderBy: { anio: "desc" },
  });

  const alumnos = curso.alumnos.map((ca) => ca.alumno);
  const totalUnidades = planificaciones.reduce((total, p) => total + p.unidades.length, 0);
  const totalClases = planificaciones.reduce(
    (total, p) => total + p.unidades.reduce((suma, u) => suma + u._count.clases, 0),
    0
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <GenericToast
        visible={updatedPlanificacion === "true"}
        message="Planificación actualizada correctamente"
      />

      <PageHeader
        volverA="/cursos"
        volverTitulo="Volver a mis cursos"
        titulo={curso.nombre}
        etiquetas={
          <>
            <span className="pill pill-brand">
              {NIVELES.find((n) => n.value === curso.nivel)?.label} ·{" "}
              {TURNOS.find((t) => t.value === curso.turno)?.label}
            </span>
            <span className="pill">
              <MapPin className="h-3.5 w-3.5" />
              {curso.institucion.nombre}
            </span>
            <span className="pill">
              <Clock className="h-3.5 w-3.5" />
              Año {curso.anioLectivo}
            </span>
          </>
        }
      >
        <Disclosure titulo="Editar datos del curso" icono={Pencil} className="mt-4">
          <EditarCursoForm
            curso={{
              id: curso.id,
              nombre: curso.nombre,
              nivel: curso.nivel,
              ciclo: curso.ciclo,
              turno: curso.turno,
              anioLectivo: curso.anioLectivo,
              institucion: curso.institucion.nombre,
            }}
          />
        </Disclosure>
      </PageHeader>

      <section className="grid grid-cols-3 gap-3">
        <StatTile icono={Users} valor={alumnos.length} etiqueta="Alumnos" tono="esmeralda" />
        <StatTile icono={Layers} valor={totalUnidades} etiqueta="Unidades" tono="brand" />
        <StatTile icono={CalendarRange} valor={totalClases} etiqueta="Clases" tono="cielo" />
      </section>

      <SectionCard
        icono={NotebookPen}
        titulo="Planificación anual"
        subtitulo="Organizá la planificación del año y sus unidades didácticas."
      >
        {planificaciones.length === 0 ? (
          <div className="space-y-3">
            <EmptyState
              icono={NotebookPen}
              titulo="Todavía no hay planificaciones"
              descripcion="Creá la planificación del año para poder cargar unidades didácticas y clases."
            />
            <Disclosure titulo="Crear planificación" icono={Plus} tono="accion">
              <PlanificacionForm cursoId={cursoId} />
            </Disclosure>
          </div>
        ) : (
          <div className="space-y-5">
            {planificaciones.map((p) => (
              <div key={p.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-linea pb-2">
                  <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
                    Año {p.anio}
                    <span className="pill">
                      {p.unidades.length} {p.unidades.length === 1 ? "unidad" : "unidades"}
                    </span>
                  </h3>
                  <Link
                    href={`/cursos/${cursoId}/unidades/nueva?planificacionId=${p.id}`}
                    className="button-primary"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva unidad
                  </Link>
                </div>

                {p.unidades.length === 0 ? (
                  <EmptyState
                    icono={Layers}
                    titulo="Sin unidades didácticas"
                    descripcion="Agregá la primera unidad para empezar a planificar las clases."
                  />
                ) : (
                  <div className="grid gap-2.5 lg:grid-cols-2">
                    {p.unidades.map((u) => (
                      <Link
                        key={u.id}
                        href={`/cursos/${cursoId}/unidades/${u.id}`}
                        className="card card-hover group flex items-center gap-3 border-l-[3px] border-l-brand-500 p-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink-900 sm:text-base">
                            {u.titulo}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                            {aFechaLegible(u.fechaInicio)} — {aFechaLegible(u.fechaFin)}
                          </p>
                          <p className="mt-1.5">
                            <span className="pill">
                              {u._count.clases} {u._count.clases === 1 ? "clase" : "clases"}
                            </span>
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                      </Link>
                    ))}
                  </div>
                )}

                <Disclosure titulo={`Editar planificación ${p.anio}`} icono={Pencil}>
                  <PlanificacionForm
                    cursoId={cursoId}
                    planificacion={{
                      id: p.id,
                      anio: p.anio,
                      objetivos: p.objetivos,
                    }}
                  />
                </Disclosure>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icono={Users}
        titulo="Alumnos"
        subtitulo="Buscá, agregá y gestioná los alumnos de este curso."
        accion={<span className="pill pill-brand">{alumnos.length}</span>}
      >
        <AlumnosSearch alumnos={alumnos} cursoId={cursoId} />
        <AddAlumnoClient cursoId={cursoId} />
      </SectionCard>

      <SectionCard
        icono={ClipboardList}
        titulo="Diagnóstico grupal"
        subtitulo="Anotá cómo llega el grupo: nivel de partida, dinámica, lo que convenga tener presente."
      >
        <DiagnosticoGrupalForm cursoId={cursoId} diagnosticoGrupal={curso.diagnosticoGrupal} />
      </SectionCard>
    </div>
  );
}
