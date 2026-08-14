import AddUnidadForm from "@/components/planificacion y unidades/AddUnidad";
import { obtenerPlanificacion } from "@/lib/actions/planificacion.actions";
import { notFound } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ cursoId: string }>;
  searchParams: Promise<{ planificacionId?: string }>;
}) {
  const { cursoId } = await params;
  const { planificacionId } = await searchParams;

  // La planificación viene por query param en vez de segmento de ruta,
  // para no anidar /planificaciones/[planificacionId] en la URL.
  if (!planificacionId) {
    notFound();
  }

  const planificacion = await obtenerPlanificacion(planificacionId);

  if (!planificacion || planificacion.cursoId !== cursoId) {
    notFound();
  }

  return (
    <AddUnidadForm
      cursoId={cursoId}
      planificacionId={planificacionId}
      planificacion={planificacion}
    />
  );
}
