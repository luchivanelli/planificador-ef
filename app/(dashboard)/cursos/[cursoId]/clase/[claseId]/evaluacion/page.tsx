import { notFound } from "next/navigation";
import { ChartNoAxesCombined, ChevronDown, Pencil, Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { aFechaLegible, resumenLista } from "@/lib/schemas/common";
import RubricaForm from "@/components/RubricaForm";
import EditarRubricaForm from "@/components/EditarRubricaForm";
import ConfirmActionButton from "@/components/ConfirmActionButton";
import EvaluacionAlumno from "@/components/alumno/EvaluacionAlumno";
import Disclosure from "@/components/ui/Disclosure";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

export default async function EvaluacionPage({
  params,
}: {
  params: Promise<{ cursoId: string; claseId: string }>;
}) {
  const { cursoId, claseId } = await params;

  // Antes de tocar la base: sin sesión no se llega a consultar nada, así los
  // alumnos no viajan en la respuesta que redirige al login.
  const docente = await requerirDocente();

  // Las dos comprobaciones de pertenencia salen juntas: son independientes
  // entre sí y encadenarlas era un viaje a la base de más.
  const [curso, clase] = await Promise.all([
    // Acotado al docente: un curso ajeno tiene que dar 404, no mostrarse.
    db.curso.findFirst({
      where: { id: cursoId, docenteId: docente.id },
      include: { alumnos: { include: { alumno: true } } },
    }),

    // La evaluación es por clase, así que se comprueba que la clase cuelgue de
    // este curso antes de mostrar nada.
    db.claseDiaria.findFirst({
      where: { id: claseId, unidadDidactica: { planificacion: { cursoId } } },
      select: { id: true, fecha: true, temaClase: true },
    }),
  ]);
  if (!curso || !clase) notFound();

  // Recién con la clase comprobada se leen las rúbricas y lo ya evaluado; las
  // dos dependen sólo de la clase, así que también van juntas.
  const [rubricas, evaluaciones] = await Promise.all([
    // Cada clase arma sus propias rúbricas: no se heredan de otras clases.
    db.rubrica.findMany({ where: { claseId }, include: { indicadores: true } }),
    db.evaluacionAlumno.findMany({ where: { claseId }, include: { detalles: true } }),
  ]);

  const alumnos = curso.alumnos.map((ca) => ca.alumno);

  // Hay una evaluación por alumno y rúbrica, así que la clave junta las dos.
  const evalMap = new Map(evaluaciones.map((e) => [`${e.rubricaId}:${e.alumnoId}`, e]));

  /**
   * Un alumno cuenta como evaluado sólo si tiene puntaje en todos los
   * indicadores: si a la rúbrica le agregaron uno después, vuelve a estar
   * incompleto (la misma regla que usa `EvaluacionAlumno`).
   */
  function evaluados(rubricaId: string, indicadores: { id: string }[]) {
    if (indicadores.length === 0) return 0;

    return alumnos.filter((alumno) => {
      const evaluacion = evalMap.get(`${rubricaId}:${alumno.id}`);
      if (!evaluacion) return false;
      // Un conjunto por evaluación en vez de recorrer los detalles una vez por
      // indicador: con una rúbrica de seis indicadores y treinta alumnos eran
      // cientos de recorridas para contar un número del encabezado.
      const puntuados = new Set(evaluacion.detalles.map((detalle) => detalle.indicadorId));
      return indicadores.every((indicador) => puntuados.has(indicador.id));
    }).length;
  }

  const tema = resumenLista(clase.temaClase);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        volverA={`/cursos/${cursoId}/clase/${claseId}`}
        volverTitulo="Volver a la clase"
        titulo="Evaluación"
        subtitulo={`${curso.nombre} · Clase del ${aFechaLegible(clase.fecha)}${tema ? ` · ${tema}` : ""}`}
      />

      <SectionCard
        icono={ChartNoAxesCombined}
        titulo="Rúbricas de la clase"
        subtitulo="Armá la rúbrica y puntuá cada indicador del 1 al 10, alumno por alumno."
        accion={
          <span className="pill pill-brand">
            {rubricas.length} {rubricas.length === 1 ? "rúbrica" : "rúbricas"}
          </span>
        }
      >
        <div className="space-y-3">
          {rubricas.length === 0 && (
            <EmptyState
              icono={Sparkles}
              titulo="Esta clase todavía no tiene rúbricas"
              descripcion="Creá la primera para empezar a evaluar: ponele un nombre y cargá los indicadores que querés mirar."
            />
          )}

          {rubricas.map((rubrica) => {
            const completos = evaluados(rubrica.id, rubrica.indicadores);
            const todoListo = alumnos.length > 0 && completos === alumnos.length;

            return (
              <details key={rubrica.id} className="card overflow-hidden">
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Sparkles className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink-900 sm:text-base">
                      {rubrica.nombre}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="pill">
                        {rubrica.indicadores.length}{" "}
                        {rubrica.indicadores.length === 1 ? "indicador" : "indicadores"}
                      </span>
                      <span
                        className={`pill ${
                          todoListo
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {completos}/{alumnos.length} evaluados
                      </span>
                    </span>
                  </span>

                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
                </summary>

                <div className="space-y-3 border-t border-linea bg-ink-50/60 p-4">
                  {alumnos.length === 0 ? (
                    <p className="text-sm text-ink-500">Este curso no tiene alumnos cargados.</p>
                  ) : (
                    <div className="space-y-2">
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
                  )}

                  <Disclosure titulo="Editar rúbrica" icono={Pencil}>
                    <EditarRubricaForm rubrica={rubrica} cursoId={cursoId} claseId={claseId} />
                  </Disclosure>

                  <div className="flex justify-end">
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
                </div>
              </details>
            );
          })}

          <Disclosure
            titulo={rubricas.length === 0 ? "Crear rúbrica" : "Crear otra rúbrica"}
            icono={Plus}
            tono="accion"
          >
            <RubricaForm cursoId={cursoId} claseId={claseId} />
          </Disclosure>
        </div>
      </SectionCard>
    </div>
  );
}
