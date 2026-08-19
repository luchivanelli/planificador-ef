import { notFound } from "next/navigation";
import { CalendarPlus, CalendarRange, CheckCircle2, ClipboardList, Pencil, Target } from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { ejesDelCurso, marcarClasesDictadas } from "@/lib/clases/consultas";
import { presentacionClase } from "@/lib/clases/estado";
import { GenericToast } from "@/components/GenericToast";
import AddClaseForm from "@/components/clase/AddClaseForm";
import ClasesFiltradas from "@/components/clase/ClasesFiltradas";
import UnidadForm from "@/components/planificacion y unidades/UnidadForm";
import ListaItems from "@/components/ListaItems";
import Disclosure from "@/components/ui/Disclosure";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/ui/StatTile";
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

  const dictadas = clases.filter((c) => c.presentacion.etiqueta === "Dictada").length;
  const sinCerrar = clases.filter((c) => c.presentacion.requiereAtencion).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <GenericToast visible={created === "true"} message="Planificación creada correctamente" />
      <GenericToast visible={updated === "true"} message="Planificación actualizada correctamente" />
      <GenericToast visible={deletedClase === "true"} message="Clase eliminada correctamente" />

      <PageHeader
        volverA={`/cursos/${cursoId}`}
        volverTitulo={`Volver a ${curso.nombre}`}
        titulo={unidad.titulo}
        etiquetas={
          <>
            <span className="pill pill-brand">
              <CalendarRange className="h-3.5 w-3.5" />
              {aFechaLegible(unidad.fechaInicio)} — {aFechaLegible(unidad.fechaFin)}
            </span>
            <span className="pill">{curso.nombre}</span>
          </>
        }
      >
        {unidad.objetivo && (
          <div className="mt-4 rounded-control border border-dashed border-ink-200 bg-ink-50/70 p-3.5">
            <p className="section-title flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-brand-500" />
              Objetivos de la unidad
            </p>
            <ListaItems valor={unidad.objetivo} className="mt-1.5 text-sm text-ink-700 sm:text-base" />
          </div>
        )}

        <Disclosure titulo="Editar unidad" icono={Pencil} className="mt-3">
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
        </Disclosure>
      </PageHeader>

      <section className="grid grid-cols-3 gap-3">
        <StatTile icono={CalendarRange} valor={clases.length} etiqueta="Clases" tono="brand" />
        <StatTile icono={CheckCircle2} valor={dictadas} etiqueta="Dictadas" tono="esmeralda" />
        <StatTile
          icono={ClipboardList}
          valor={sinCerrar}
          etiqueta="Sin cerrar"
          tono={sinCerrar > 0 ? "ambar" : "cielo"}
        />
      </section>

      <ClasesFiltradas clases={clases} cursoId={cursoId} />

      <Disclosure titulo="Agregar clase a esta unidad" icono={CalendarPlus} tono="accion">
        <AddClaseForm unidadId={unidadId} cursoId={cursoId} ejes={ejes} />
      </Disclosure>
    </div>
  );
}
