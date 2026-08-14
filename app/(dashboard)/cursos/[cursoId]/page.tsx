import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, User, Clock, NotebookPen } from "lucide-react";
import { db } from "@/lib/db";
import AddAlumnoClient from "@/components/alumno/AddAlumnoClient";
import AlumnosSearch from "@/components/alumno/AlumnosSearch";
import BackLink from "@/components/BackLink";
import {NIVELES, TURNOS} from "@/lib/types";
import PlanificacionForm from "@/components/planificacion y unidades/PlanificacionForm";
import { GenericToast } from "@/components/GenericToast";

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
    include: { unidades: true },
    orderBy: { anio: "desc" }
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const alumnos = curso.alumnos.map((ca) => ({
    ...ca.alumno,
    fechaNacimiento: ca.alumno.fechaNacimiento.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <GenericToast visible={updatedPlanificacion === "true"} message="Planificación actualizada correctamente" />
      <section className="primary-card p-5 sm:p-6">
        <BackLink href="/cursos" title="Volver a mis cursos" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between gap-2">
              <h1 className="page-title">{curso.nombre}</h1>
            </div>
            <div className="sm:flex gap-8 space-y-1 sm:space-y-0">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-[#0f63ff]"/>
                <p className="text-sm text-slate-500 sm:text-base">{curso.institucion.nombre} · {NIVELES.find((n) => n.value === curso.nivel)?.label}</p>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 sm:h-4 w-3 sm:w-4 text-[#0f63ff]"/>
                <p className="text-sm text-slate-500 sm:text-base">Turno {TURNOS.find((t) => t.value === curso.turno)?.label}</p>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 sm:h-4 w-3 sm:w-4 text-[#0f63ff]"/>
                <p className="text-sm text-slate-500 sm:text-base">{curso.alumnos.length} alumno/s</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1  gap-4">
        <section className="surface-card p-5 sm:p-6 w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
                <NotebookPen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Planificacion anual</h1>
                <p className="text-sm text-slate-500 sm:text-base">
                  Organizá tu planificacion y unidades didácticas.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {planificaciones.map((p) => {
              return (
                <div key={p.id}>
                  <h3 className="text-sm font-semibold text-[#0f63ff] sm:text-base">Año {p.anio} · <span className="text-xs sm:text-sm text-slate-500 font-normal">{p.unidades.length} unidad/es didáctica/s</span></h3>
                  {p.unidades.length === 0 && (
                    <div className="border border-dashed border-slate-200 bg-slate-50 px-2 py-4 mt-2 text-center text-xs sm:text-sm text-slate-500">
                      Todavía no hay unidades didácticas cargadas para esta planificación.
                    </div>
                  )}
                  <div className="space-y-2 mt-2">
                    {p.unidades.map((u)=> (
                      <Link key={u.id} href={`/cursos/${cursoId}/unidades/${u.id}`} className="block border border-slate-200 border-l-[3px] border-l-[#0f63ff] p-2 md:p-4 mb-2">
                        <p className="text-xs text-slate-900 sm:text-sm font-semibold">{u.titulo}</p>
                        <p className="text-xs text-slate-500 sm:text-sm">Desde {u.fechaInicio.toLocaleDateString()} hasta {u.fechaFin.toLocaleDateString()}</p>
                      </Link>
                    ))}
                  </div>
                  <Link 
                    href={`/cursos/${cursoId}/unidades/nueva?planificacionId=${p.id}`}
                    className="button-primary flex justify-end w-full" >
                    Agregar unidad didáctica
                  </Link>
                  <details className="surface-card py-2 px-4 mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">Editar planificación</summary>
                    <PlanificacionForm
                      cursoId={cursoId}
                      planificacion={{
                        id: p.id,
                        anio: p.anio,
                        objetivos: p.objetivos,
                      }}
                    />
                  </details>
                </div>
              );
            })}
            {planificaciones.length === 0 && (
              <>
                <div className="border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Todavía no hay planificaciones creadas para este curso.
                </div>
                <details className="surface-card py-2 px-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">Agregar planificación</summary>
                  <PlanificacionForm cursoId={cursoId} />
                </details>
              </>
            )}
          </div>
        </section>
        <section className="surface-card p-5 sm:p-6 w-full">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Alumnos</h1>
                <p className="text-sm text-slate-500 sm:text-base">
                  Buscá, agregá y gestioná los alumnos de este curso.
                </p>
              </div>
            </div>
            
            <AlumnosSearch alumnos={alumnos} cursoId={cursoId} />
            <AddAlumnoClient cursoId={cursoId} />
          </div>
        </section>
      </div>
    </div>
  );
}
