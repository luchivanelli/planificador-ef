import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  Clock,
  ListChecks,
  Pencil,
  PlusCircle,
  Target,
  TimerReset,
} from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { ejesDelCurso, marcarClasesDictadas } from "@/lib/clases/consultas";
import { presentacionClase } from "@/lib/clases/estado";
import ListaAsistencia from "@/components/ListaAsistencia";
import ClaseForm from "@/components/clase/ClaseForm";
import ActividadForm from "@/components/clase/ActividadForm";
import ActividadesLista from "@/components/clase/ActividadesLista";
import ClaseBadge from "@/components/clase/ClaseBadge";
import type { EstadoAsistencia } from "@prisma/client";
import ListaItems from "@/components/ListaItems";
import Disclosure from "@/components/ui/Disclosure";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { aFechaLegible, aValorFecha } from "@/lib/schemas/common";

export default async function ClaseEnCursoPage({
  params,
}: {
  params: Promise<{ cursoId: string; claseId: string }>;
}) {
  const { cursoId, claseId } = await params;

  // Antes de leer el estado: cierra las clases cuyo horario ya pasó.
  const docente = await requerirDocente();
  await marcarClasesDictadas(docente.id);

  const clase = await db.claseDiaria.findUnique({
    where: { id: claseId },
    include: {
      unidadDidactica: {
        include: {
          planificacion: {
            include: { curso: { include: { alumnos: { include: { alumno: true } } } } },
          },
        },
      },
      actividades: { include: { juego: true }, orderBy: { orden: "asc" } },
    },
  });
  if (!clase) notFound();

  const curso = clase.unidadDidactica.planificacion.curso;
  const unidadDidacticaId = clase.unidadDidacticaId;

  const ejes = await ejesDelCurso(curso.nivel, curso.ciclo);

  // El banco entero viaja a la página: el buscador de juegos filtra en memoria,
  // así responde sin ida y vuelta al servidor mientras la docente escribe.
  const juegos = await db.juego.findMany({
    select: { id: true, nombre: true, rangoEtario: true, categoria: true, estrategia: true },
    orderBy: { nombre: "asc" },
  });

  // La fecha se guarda como medianoche UTC: se formatea igual para no correrse un día.
  const fechaISO = aValorFecha(clase.fecha);

  const asistenciaClase = await db.asistencia.findMany({
    where: { claseDiariaId: claseId, cursoId },
  });
  const estadosIniciales: Record<string, EstadoAsistencia> = Object.fromEntries(
    asistenciaClase.map((a) => [a.alumnoId, a.estado])
  );
  const alumnos = curso.alumnos.map((ca) => ca.alumno);
  const presentacion = presentacionClase({
    ...clase,
    tieneAsistencia: asistenciaClase.length > 0,
  });

  const minutosTotales = clase.actividades.reduce((total, act) => total + act.duracionMinutos, 0);

  /** Los tres campos de texto de la clase se muestran con la misma forma. */
  const bloquesDeContenido = [
    { titulo: "Temas", valor: clase.temaClase, icono: ListChecks },
    { titulo: "Objetivos", valor: clase.objetivoClase, icono: Target },
    { titulo: "Contenidos", valor: clase.contenidosClase, icono: BookOpen },
  ].filter((bloque) => Boolean(bloque.valor));

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        volverA={`/cursos/${cursoId}/unidades/${unidadDidacticaId}`}
        volverTitulo="Volver a la unidad"
        titulo={`Clase de ${curso.nombre}`}
        etiquetas={
          <>
            <ClaseBadge presentacion={presentacion} />
            <span className="pill">
              <CalendarClock className="h-3.5 w-3.5" />
              {aFechaLegible(clase.fecha)}
            </span>
            {clase.horaInicio && clase.horaFin && (
              <span className="pill pill-brand">
                <Clock className="h-3.5 w-3.5" />
                {clase.horaInicio} – {clase.horaFin}
              </span>
            )}
          </>
        }
        acciones={
          <Link href={`/cursos/${cursoId}/clase/${claseId}/evaluacion`} className="button-primary">
            <ChartNoAxesCombined className="h-4 w-4" />
            Evaluar
          </Link>
        }
      >
        {bloquesDeContenido.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bloquesDeContenido.map(({ titulo, valor, icono: Icono }) => (
              <div
                key={titulo}
                className="rounded-control border border-dashed border-ink-200 bg-ink-50/70 p-3.5"
              >
                <p className="section-title flex items-center gap-1.5">
                  <Icono className="h-3.5 w-3.5 text-brand-500" />
                  {titulo}
                </p>
                <ListaItems valor={valor} className="mt-1.5 text-sm text-ink-800" />
              </div>
            ))}
          </div>
        )}

        <Disclosure titulo="Editar clase" icono={Pencil} className="mt-3">
          <ClaseForm
            clase={{
              id: clase.id,
              fecha: fechaISO,
              horaInicio: clase.horaInicio,
              horaFin: clase.horaFin,
              objetivoClase: clase.objetivoClase,
              temaClase: clase.temaClase,
              contenidosClase: clase.contenidosClase,
              ejeNapId: clase.ejeNapId,
              ejeOtro: clase.ejeOtro,
              espacioRequerido: clase.espacioRequerido,
              estado: clase.estado,
              motivoCancelacion: clase.motivoCancelacion,
              motivoCancelacionOtro: clase.motivoCancelacionOtro,
            }}
            cursoId={cursoId}
            unidadDidacticaId={unidadDidacticaId}
            ejes={ejes}
          />
        </Disclosure>
      </PageHeader>

      <SectionCard
        icono={TimerReset}
        titulo="Secuencia de la clase"
        subtitulo="Arrastrá para cambiar el orden. Cada bloque tiene su cronómetro."
        accion={
          minutosTotales > 0 ? (
            <span className="pill pill-brand">
              <Clock className="h-3.5 w-3.5" />
              {minutosTotales} min en total
            </span>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <ActividadesLista
            claseId={claseId}
            cursoId={cursoId}
            unidadDidacticaId={unidadDidacticaId}
            juegos={juegos}
            actividades={clase.actividades.map((act) => ({
              id: act.id,
              tipoBloque: act.tipoBloque,
              juegoId: act.juegoId,
              duracionMinutos: act.duracionMinutos,
              nombreJuego: act.juego?.nombre ?? null,
            }))}
          />

          <Disclosure titulo="Agregar actividad" icono={PlusCircle} tono="accion">
            <ActividadForm
              claseId={claseId}
              cursoId={cursoId}
              unidadDidacticaId={unidadDidacticaId}
              juegos={juegos}
            />
          </Disclosure>
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          icono={ClipboardCheck}
          titulo="Asistencia"
          subtitulo="Tocá el estado de cada alumno: se guarda solo."
          className="scroll-mt-24"
        >
          <div id="asistencia">
            {alumnos.length === 0 ? (
              <EmptyState
                icono={ClipboardCheck}
                titulo="Este curso no tiene alumnos cargados"
                descripcion="Agregá alumnos desde la ficha del curso para poder tomar asistencia."
                accion={
                  <Link href={`/cursos/${cursoId}`} className="button-secondary">
                    Ir al curso
                  </Link>
                }
              />
            ) : (
              <ListaAsistencia
                cursoId={cursoId}
                fecha={fechaISO}
                claseDiariaId={claseId}
                alumnos={alumnos}
                estadosIniciales={estadosIniciales}
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          icono={ChartNoAxesCombined}
          titulo="Evaluación"
          subtitulo="Seguí el desempeño del grupo desde la misma clase."
        >
          <div className="space-y-3">
            <p className="rounded-control border border-dashed border-ink-200 bg-ink-50/70 p-3.5 text-sm text-ink-600">
              Armá rúbricas con los indicadores que te importan y puntuá del 1 al 10, alumno por
              alumno. Todo queda guardado en esta clase.
            </p>
            <Link
              href={`/cursos/${cursoId}/clase/${claseId}/evaluacion`}
              className="button-primary w-full"
            >
              <ChartNoAxesCombined className="h-4 w-4" />
              Ir a evaluar
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
