import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarRange,
  ClipboardList,
  Download,
  GraduationCap,
  ListChecks,
  MapPin,
  Percent,
  SlidersHorizontal,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { diaEnZona } from "@/lib/schemas/common";
import { informeGeneral } from "@/lib/evaluacion/informe-general";
import {
  ANCLA_INFORME,
  busquedaDeInforme,
  leerParametros,
  periodoPorDefecto,
  PESO_RUBRICAS_POR_DEFECTO,
  type BusquedaInforme,
} from "@/lib/evaluacion/parametros";
import FiltroInforme from "@/components/evaluacion/FiltroInforme";
import ResumenAlumno from "@/components/evaluacion/ResumenAlumno";
import TablaCurso from "@/components/evaluacion/TablaCurso";
import { conComa } from "@/components/evaluacion/nota-visual";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import StatTile from "@/components/ui/StatTile";

/**
 * La evaluación general de un curso en un período.
 *
 * Todo lo que elige la docente (las fechas, el alumno, el peso de las rúbricas)
 * vive en la URL y el informe se recalcula acá: no hay nada guardado que pueda
 * quedar viejo, y el link se puede compartir. Las cuentas están en
 * `lib/evaluacion/informe-general`; esta pantalla sólo las acomoda.
 */
export default async function EvaluacionCursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ cursoId: string }>;
  searchParams: Promise<BusquedaInforme>;
}) {
  const { cursoId } = await params;
  const busqueda = await searchParams;

  // Antes de tocar la base: sin sesión no se llega a consultar nada, así los
  // alumnos no viajan en la respuesta que redirige al login.
  const docente = await requerirDocente();

  // Acotado al docente: un curso ajeno tiene que dar 404, no mostrarse.
  const curso = await db.curso.findFirst({
    where: { id: cursoId, docenteId: docente.id },
    select: {
      id: true,
      nombre: true,
      anioLectivo: true,
      institucion: { select: { nombre: true } },
      alumnos: {
        where: { fechaBaja: null },
        select: { alumno: { select: { id: true, nombre: true, apellido: true } } },
      },
    },
  });
  if (!curso) notFound();

  const alumnos = curso.alumnos
    .map((ca) => ca.alumno)
    .sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, "es", {
        sensitivity: "base",
      })
    );

  const lectura = leerParametros(busqueda);
  const porDefecto = periodoPorDefecto(diaEnZona());

  // El formulario arranca con lo que se pidió; si todavía no se pidió nada, con
  // el ciclo lectivo en curso.
  const valoresDelFiltro =
    lectura.estado === "ok"
      ? lectura.parametros
      : {
          desde: busqueda.desde?.trim() || porDefecto.desde,
          hasta: busqueda.hasta?.trim() || porDefecto.hasta,
          alumnoId: busqueda.alumnoId?.trim() || null,
          pesoRubricas: PESO_RUBRICAS_POR_DEFECTO,
          detalle: busqueda.detalle === "1",
        };

  const informe =
    lectura.estado === "ok"
      ? await informeGeneral(cursoId, docente.id, lectura.parametros)
      : null;

  const alumno = informe?.esIndividual ? informe.alumnos[0] : null;

  /**
   * Mirando a un alumno, "volver" es el informe del curso con el mismo período,
   * no la pantalla de elegir curso: se entró desde ahí y es a donde se quiere
   * seguir. Con el curso completo a la vista sí se vuelve a elegir curso.
   *
   * Son dos links al mismo lado y se diferencian sólo en el ancla, según dónde
   * está parado quien los toca: el del encabezado está arriba de todo y deja la
   * pantalla arriba; el que va junto al informe vuelve al informe.
   */
  const volverAlCurso = informe?.esIndividual
    ? `/evaluacion/${cursoId}?${busquedaDeInforme(valoresDelFiltro, { alumnoId: null })}`
    : null;
  const volverAlCursoEnSeccion = volverAlCurso ? `${volverAlCurso}#${ANCLA_INFORME}` : null;

  // Qué va dentro de la tarjeta que encabeza el informe. En el del curso
  // siempre está la tabla; en el de un alumno, sólo los avisos que haya.
  const sinClasesEnElPeriodo = informe?.clases.total === 0;
  const hayDesaprobados = Boolean(
    informe && !informe.esIndividual && informe.promedios.porDebajo > 0
  );
  const faltaElAlumno = Boolean(informe?.esIndividual && !alumno);
  const hayCuerpoDelInforme =
    Boolean(informe && !informe.esIndividual) ||
    sinClasesEnElPeriodo ||
    hayDesaprobados ||
    faltaElAlumno;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        volverA={volverAlCurso ?? "/evaluacion"}
        volverTitulo={
          volverAlCurso ? "Volver a la evaluación del curso" : "Volver a elegir curso"
        }
        titulo="Evaluación general"
        subtitulo={curso.nombre}
        etiquetas={
          <>
            <span className="pill">
              <MapPin className="h-3.5 w-3.5" />
              {curso.institucion.nombre}
            </span>
            <span className="pill">
              <Users className="h-3.5 w-3.5" />
              {alumnos.length} {alumnos.length === 1 ? "alumno" : "alumnos"}
            </span>
            <span className="pill">Año {curso.anioLectivo}</span>
          </>
        }
      />

      <SectionCard
        icono={SlidersHorizontal}
        titulo="Período a evaluar"
        subtitulo="El informe toma las rúbricas de las clases de esas fechas y la asistencia del mismo rango."
      >
        <FiltroInforme cursoId={cursoId} alumnos={alumnos} valores={valoresDelFiltro} />
      </SectionCard>

      {lectura.estado === "invalido" && (
        <EmptyState icono={CalendarRange} titulo="Revisá el período" descripcion={lectura.mensaje} />
      )}

      {lectura.estado === "sin-rango" && (
        <EmptyState
          icono={CalendarRange}
          titulo="Elegí un período para empezar"
          descripcion="Marcá desde y hasta cuándo querés evaluar. Podés hacerlo del curso completo o de un alumno en particular."
        />
      )}

      {informe && (
        /**
         * El ancla a la que apuntan los links que van del curso a un alumno y
         * vuelven: sin esto cada navegación arrancaba arriba de todo y lo
         * primero que se veía era el formulario de filtros, con el informe
         * fuera de pantalla. `scroll-mt` deja aire para la barra superior, que
         * en el celular es fija.
         */
        <div id={ANCLA_INFORME} className="scroll-mt-20 space-y-4 sm:space-y-5 lg:scroll-mt-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icono={CalendarRange}
              valor={informe.clases.total}
              etiqueta="Clases del período"
              tono="cielo"
            />
            <StatTile
              icono={ListChecks}
              valor={informe.clases.conRubrica}
              etiqueta="Con rúbrica"
              tono="brand"
            />
            <StatTile
              icono={Percent}
              valor={
                informe.promedios.asistencia === null
                  ? "—"
                  : `${conComa(informe.promedios.asistencia)}%`
              }
              etiqueta={informe.esIndividual ? "Asistencia" : "Asistencia promedio"}
              tono="esmeralda"
            />
            <StatTile
              icono={GraduationCap}
              valor={conComa(informe.promedios.nota)}
              etiqueta={informe.esIndividual ? "Nota sugerida" : "Nota promedio"}
              tono="ambar"
            />
          </section>

          {/* El encabezado del informe: quién, qué período y con qué criterio.
              En el informe del curso la tabla va adentro de esta misma tarjeta,
              porque es una sola lista. En el de un alumno no: sus secciones son
              tarjetas por derecho propio y meterlas acá adentro las dejaba como
              tarjetas dentro de otra tarjeta. */}
          <SectionCard
            icono={informe.esIndividual ? UserRound : Users}
            titulo={
              informe.esIndividual
                ? alumno?.nombreCompleto ?? "Alumno"
                : `Curso completo · ${informe.alumnos.length} ${
                    informe.alumnos.length === 1 ? "alumno" : "alumnos"
                  }`
            }
            subtitulo={`Del ${informe.periodo.desdeTexto} al ${informe.periodo.hastaTexto} · ${informe.pesoRubricas}% rúbricas y ${
              100 - informe.pesoRubricas
            }% asistencia`}
            accionBloque
            // `accionBloque` es lo que los apila a lo ancho en el celular: no
            // hace falta envolverlos acá en otro flex, y de hecho conviene no
            // hacerlo, porque dos contenedores que cambian de dirección en
            // puntos distintos se pelean en los tamaños del medio.
            accion={
              <>
                {volverAlCursoEnSeccion && (
                  <Link href={volverAlCursoEnSeccion} className="button-secondary">
                    <Users className="h-4 w-4" />
                    Ver curso completo
                  </Link>
                )}
                {/* Es un `<a>` y no un `Link` a propósito: descarga un archivo
                    en vez de navegar a otra pantalla (igual que el plan de
                    clase). */}
                <a
                  href={`/evaluacion/${cursoId}/pdf?${busquedaDeInforme(valoresDelFiltro)}`}
                  download
                  className="button-primary"
                >
                  <Download className="h-4 w-4" />
                  Guardar PDF
                </a>
              </>
            }
          >
            {/* Una sola expresión: cuando no hay ni avisos ni tabla (el informe
                de un alumno sin novedades) el cuerpo es `undefined` y la
                tarjeta queda como puro encabezado, sin espacio muerto abajo. */}
            {hayCuerpoDelInforme ? (
              <>
                {sinClasesEnElPeriodo && (
                  <p className="mb-4 flex items-start gap-2 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    No hay ninguna clase de este curso entre esas fechas: lo que se ve sale sólo
                    de la asistencia cargada.
                  </p>
                )}

                {hayDesaprobados && (
                  <p className="mb-4 flex items-start gap-2 rounded-control border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:text-sm">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {informe.promedios.porDebajo}{" "}
                    {informe.promedios.porDebajo === 1
                      ? "alumno queda por debajo"
                      : "alumnos quedan por debajo"}{" "}
                    de la nota de aprobación con este criterio.
                  </p>
                )}

                {faltaElAlumno && (
                  <EmptyState
                    icono={UserRound}
                    titulo="Ese alumno no está en el curso en este período"
                    descripcion="Puede que se haya dado de baja antes de la fecha de inicio. Probá con el curso completo."
                    accion={
                      <Link
                        href={volverAlCursoEnSeccion ?? "/evaluacion"}
                        className="button-secondary"
                      >
                        <Users className="h-4 w-4" />
                        Ver el curso completo
                      </Link>
                    }
                  />
                )}

                {!informe.esIndividual && (
                  <TablaCurso informe={informe} parametros={valoresDelFiltro} />
                )}
              </>
            ) : undefined}
          </SectionCard>

          {alumno && <ResumenAlumno alumno={alumno} informe={informe} />}

          <p className="flex items-start gap-2 px-1 text-xs text-ink-400">
            <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            La nota sugerida es una referencia calculada con lo que está cargado: el promedio de
            los indicadores de las rúbricas y el porcentaje de asistencia, combinados con el peso
            que elegiste. Cuenta como asistida toda clase en la que el alumno no estuvo ausente
            (presente, tarde o SAF). La nota final la ponés vos.
          </p>
        </div>
      )}
    </div>
  );
}
