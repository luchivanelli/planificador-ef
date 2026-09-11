import AddUnidadForm from "@/components/planificacion y unidades/AddUnidad";
import { obtenerPlanificacion } from "@/lib/actions/planificacion.actions";
import { requerirDocente } from "@/lib/auth";
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

  // Antes de tocar la base: sin sesión no se llega a consultar nada, así el
  // curso no viaja en la respuesta que redirige al login.
  const docente = await requerirDocente();

  // La planificación viene por query param en vez de segmento de ruta,
  // para no anidar /planificaciones/[planificacionId] en la URL.
  if (!planificacionId) {
    notFound();
  }

  const planificacion = await obtenerPlanificacion(planificacionId);

  // Tiene que ser de este curso y del docente de la sesión: los dos ids llegan
  // de la URL, así que ninguno alcanza por sí solo.
  if (
    !planificacion ||
    planificacion.cursoId !== cursoId ||
    planificacion.docenteId !== docente.id
  ) {
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
