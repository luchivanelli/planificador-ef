import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { ejesDelCurso, marcarClasesDictadas } from "@/lib/clases/consultas";
import { presentacionClase } from "@/lib/clases/estado";
import BackLink from "@/components/BackLink";
import { GenericToast } from "@/components/GenericToast";
import AddClaseForm from "@/components/clase/AddClaseForm";
import ClasesFiltradas from "@/components/clase/ClasesFiltradas";
import UnidadForm from "@/components/planificacion y unidades/UnidadForm";
import ListaItems from "@/components/ListaItems";
import { aFechaLegible, aValorFecha, resumenLista } from "@/lib/schemas/common";

export default async function UnidadDidacticaPage({
  params,
  searchParams,
}: {
  params: Promise<{ cursoId: string; unidadId: string }>;
  searchParams: Promise<{ created?: string; updated?: string; deletedClase?: string }>;
}) {
  const { cursoId, unidadId } = await params;
  const { created, updated, deletedClase } = await searchParams;

  // Antes de leer los estados: cierra las clases cuyo horario ya pasó.
  const docente = await requerirDocente();
  await marcarClasesDictadas(docente.id);

  const unidad = await db.unidadDidactica.findUnique({
    where: { id: unidadId },
    include: {
      planificacion: { include: { curso: true } },
      clases: {
        orderBy: { fecha: "desc" },
        include: { _count: { select: { asistencias: true } } },
      },
    },
  });
  if (!unidad) notFound();

  const curso = unidad.planificacion.curso;
  const ejes = await ejesDelCurso(curso.nivel, curso.ciclo);
  const ahora = new Date();

  const clases = unidad.clases.map((clase) => ({
    id: clase.id,
    // El listado es de una línea por clase: los objetivos van separados por " · ".
    titulo: resumenLista(clase.temaClase) || "Clase sin tema definido",
    fecha: aFechaLegible(clase.fecha),
    horario: clase.horaInicio && clase.horaFin ? ` · ${clase.horaInicio} a ${clase.horaFin}` : "",
    estado: clase.estado,
    presentacion: presentacionClase(
      { ...clase, tieneAsistencia: clase._count.asistencias > 0 },
      ahora
    ),
  }));

  return (
    <div className="space-y-4">
      <GenericToast visible={created === "true"} message="Planificación creada correctamente" />
      <GenericToast visible={updated === "true"} message="Planificación actualizada correctamente" />
      <GenericToast visible={deletedClase === "true"} message="Clase eliminada correctamente" />
      <section className="surface-card p-5 sm:p-6">
        <BackLink href={`/cursos/${cursoId}`} title={`Volver a ${unidad.planificacion.curso.nombre}`}/>
        <h1 className="page-title">{unidad.titulo}</h1>
        <ListaItems valor={unidad.objetivo} className="text-sm text-slate-500 sm:text-base" />
        <p className="mt-2 text-sm text-slate-500">
          Del {aFechaLegible(unidad.fechaInicio)} al {aFechaLegible(unidad.fechaFin)}
        </p>

        <details className="surface-card py-2 px-4 mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">
            Editar unidad
          </summary>
          <UnidadForm
            unidad={{
              id: unidad.id,
              titulo: unidad.titulo,
              objetivo: unidad.objetivo,
              fechaInicio: aValorFecha(unidad.fechaInicio),
              fechaFin: aValorFecha(unidad.fechaFin),
            }}
            cursoId={cursoId}
            planificacionId={unidad.planificacionId}
          />
        </details>
      </section>

      <ClasesFiltradas clases={clases} cursoId={cursoId} />

      <details className="surface-card p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">Agregar clase</summary>
        <AddClaseForm unidadId={unidadId} cursoId={cursoId} ejes={ejes} />
      </details>
    </div>
  );
}
