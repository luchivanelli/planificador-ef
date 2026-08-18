import Link from "next/link";
import { notFound } from "next/navigation";
import { ChartNoAxesCombined, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { aFechaLegible, resumenLista } from "@/lib/schemas/common";
import RubricaForm from "@/components/RubricaForm";
import ConfirmActionButton from "@/components/ConfirmActionButton";
import EvaluacionAlumno from "@/components/alumno/EvaluacionAlumno";

export default async function EvaluacionPage({
  params,
}: {
  params: Promise<{ cursoId: string; claseId: string }>;
}) {
  const { cursoId, claseId } = await params;

  const curso = await db.curso.findUnique({
    where: { id: cursoId },
    include: { alumnos: { include: { alumno: true } } },
  });
  if (!curso) notFound();

  // La evaluación es por clase, así que se comprueba que la clase cuelgue de
  // este curso antes de mostrar nada.
  const clase = await db.claseDiaria.findFirst({
    where: { id: claseId, unidadDidactica: { planificacion: { cursoId } } },
    select: { id: true, fecha: true, temaClase: true },
  });
  if (!clase) notFound();

  // Cada clase arma sus propias rúbricas: no se heredan de otras clases.
  const rubricas = await db.rubrica.findMany({
    where: { claseId },
    include: { indicadores: true },
  });

  const alumnos = curso.alumnos.map((ca) => ca.alumno);
  const evaluaciones = await db.evaluacionAlumno.findMany({
    where: { claseId },
    include: { detalles: true },
  });

  // Hay una evaluación por alumno y rúbrica, así que la clave junta las dos.
  const evalMap = new Map(evaluaciones.map((e) => [`${e.rubricaId}:${e.alumnoId}`, e]));

  return (
    <div className="space-y-4">
      <section className="surface-card p-5 sm:p-6">
        <Link href={`/cursos/${cursoId}/clase/${claseId}`} className="text-sm font-medium text-[#0f63ff]">
          ← Volver a la clase
        </Link>
        <h1 className="page-title mt-2">Evaluación</h1>
        <p className="page-subtitle mt-1">
          {curso.nombre} · Clase del {aFechaLegible(clase.fecha)}
          {resumenLista(clase.temaClase) ? ` · ${resumenLista(clase.temaClase)}` : ""}
        </p>
      </section>

      <div className="space-y-2 surface-card p-4">
        <div className="mb-4 flex items-start sm:items-center gap-4">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <ChartNoAxesCombined className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Rúbricas</h2>
            <p className="text-sm sm:text-base text-slate-500">
              Armá la rúbrica de esta clase y puntuá cada indicador del 1 al 10, alumno por alumno.
            </p>
          </div>
        </div>

        {rubricas.length === 0 && (
          <p className="border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Esta clase todavía no tiene rúbricas. Creá la primera para empezar a evaluar.
          </p>
        )}

        {rubricas.map((rubrica) => (
          <details key={rubrica.id} className="py-2 px-4 border border-dashed border-slate-200">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base list-none flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#0f63ff]" />
              {rubrica.nombre}
              <span className="text-xs font-normal text-slate-500">
                {rubrica.indicadores.length}{" "}
                {rubrica.indicadores.length === 1 ? "indicador" : "indicadores"}
              </span>
            </summary>
            {alumnos.length === 0 && (
              <p className="text-sm text-slate-500 my-2">Este curso no tiene alumnos cargados.</p>
            )}
            <div className="space-y-2 py-2 overflow-y-auto max-h-[300px]">
              {alumnos.map((alumno) => (
                <EvaluacionAlumno
                  key={alumno.id}
                  alumno={alumno}
                  rubricaId={rubrica.id}
                  indicadores={rubrica.indicadores}
                  cursoId={cursoId}
                  claseId={claseId}
                  evaluacion={evalMap.get(`${rubrica.id}:${alumno.id}`)}
                />
              ))}
            </div>
            <div className="flex justify-end pb-2">
              <ConfirmActionButton
                buttonLabel="Eliminar rúbrica"
                className="button-delete"
                confirmTitle={`¿Eliminar “${rubrica.nombre}”?`}
                confirmMessage="Se borrarán sus indicadores y lo que hayas evaluado con ella en esta clase."
                confirmActionType="delete-rubrica"
                hiddenFields={{ rubricaId: rubrica.id, cursoId, claseId }}
                successMessage="Rúbrica eliminada"
                errorMessage="No se pudo eliminar la rúbrica"
              />
            </div>
          </details>
        ))}

        <details className="surface-card py-2 px-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">
            {rubricas.length === 0 ? "Crear rúbrica" : "Crear otra rúbrica"}
          </summary>
          <RubricaForm cursoId={cursoId} claseId={claseId} />
        </details>
      </div>
    </div>
  );
}
