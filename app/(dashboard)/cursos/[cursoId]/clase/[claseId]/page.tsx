import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, TimerReset } from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { ejesDelCurso, marcarClasesDictadas } from "@/lib/clases/consultas";
import { presentacionClase } from "@/lib/clases/estado";
import ListaAsistencia from "@/components/ListaAsistencia";
import ClaseForm from "@/components/clase/ClaseForm";
import ActividadForm from "@/components/clase/ActividadForm";
import ActividadesLista from "@/components/clase/ActividadesLista";
import type { EstadoAsistencia } from "@prisma/client";
import BackLink from "@/components/BackLink";
import { aValorFecha } from "@/lib/schemas/common";

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

  return (
    <div className="space-y-4">
      <section className="surface-card p-5 sm:p-6">
        <BackLink href={`/cursos/${cursoId}/unidades/${unidadDidacticaId}`} title="Volver a la unidad" />
        <div className="flex items-center gap-4">
          <h1 className="page-title">Clase {curso.nombre}</h1>
          <p className={`rounded-full border px-2.5 py-0.5 sm:py-1 font-medium text-[11px] sm:text-xs ${presentacion.badge}`}>
            {presentacion.etiqueta.toLocaleUpperCase()}
          </p>
        </div>
        <p className="page-subtitle mt-1">{clase.objetivoClase || "Sin objetivo definido"}</p>
        {clase.horaInicio && clase.horaFin && (
          <p className="mt-2 text-sm text-slate-500">Horario: {clase.horaInicio} a {clase.horaFin}</p>
        )}

        <details className="surface-card py-2 px-4 mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">Editar clase</summary>
          <ClaseForm
            clase={{
              id: clase.id,
              fecha: fechaISO,
              horaInicio: clase.horaInicio,
              horaFin: clase.horaFin,
              objetivoClase: clase.objetivoClase,
              ejeNapId: clase.ejeNapId,
              ejeOtro: clase.ejeOtro,
              espacioRequerido: clase.espacioRequerido,
              alternativaClima: clase.alternativaClima,
              estado: clase.estado,
              motivoCancelacion: clase.motivoCancelacion,
              motivoCancelacionOtro: clase.motivoCancelacionOtro,
            }}
            cursoId={cursoId}
            unidadDidacticaId={unidadDidacticaId}
            ejes={ejes}
          />
        </details>
      </section>

      <section className="surface-card p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <TimerReset className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Actividades</h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Armá la secuencia de la clase con tiempos claros. Arrastrá para cambiar el orden.
            </p>
          </div>
        </div>
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

        <ActividadForm
          claseId={claseId}
          cursoId={cursoId}
          unidadDidacticaId={unidadDidacticaId}
          juegos={juegos}
        />
      </section>

      <section id="asistencia" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Asistencia</h1>
              <p className="text-sm text-slate-500 sm:text-base">Registrá la asistencia de forma rápida.</p>
            </div>
          </div>
          {alumnos.length === 0 ? (
            <p className="border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Este curso no tiene alumnos cargados.
            </p>
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
        <div className="surface-card p-5 sm:p-6">
          <div className="mb-4 flex items-start sm:items-center gap-4">
            <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
              <ChartNoAxesCombined className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Evaluación</h2>
              <p className="text-sm sm:text-base text-slate-500">Seguí el desempeño del grupo desde la misma clase.</p>
            </div>
          </div>
          <Link href={`/cursos/${cursoId}/clase/${claseId}/evaluacion`} className="button-primary w-full">
            Ir a evaluar
          </Link>
        </div>
      </section>
    </div>
  );
}
