import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  FileText,
  ListChecks,
  TriangleAlert,
} from "lucide-react";
import type { AlumnoDelInforme, InformeGeneral } from "@/lib/evaluacion/informe-general";
import Disclosure from "@/components/ui/Disclosure";
import ListaScroll from "@/components/ui/ListaScroll";
import SectionCard from "@/components/ui/SectionCard";
import { conComa, tonoDeNota } from "./nota-visual";

/**
 * El informe de un alumno: de dónde sale la nota que el sistema sugiere.
 *
 * El orden es el del razonamiento de la docente: primero la nota y cómo se
 * compuso, después el promedio de cada indicador a lo largo del período (lo que
 * dice en qué está flojo), después la asistencia y al final, plegado, el
 * puntaje clase por clase para ir a mirar una en particular.
 */
export default function ResumenAlumno({
  alumno,
  informe,
}: {
  alumno: AlumnoDelInforme;
  informe: InformeGeneral;
}) {
  const { nota, asistencia } = alumno;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Sin nombre ni período en el subtítulo: los dice el encabezado del
          informe, que es la tarjeta justo de arriba. */}
      <SectionCard destacada icono={ClipboardList} titulo="Nota sugerida">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={`flex flex-col items-center justify-center rounded-card border px-6 py-4 ${tonoDeNota(
              nota.valor
            )}`}
          >
            <span className="text-4xl font-bold tabular-nums leading-none">
              {conComa(nota.valor)}
            </span>
            {nota.redondeada !== null && (
              <span className="mt-1.5 text-xs font-semibold">
                Redondeada: {nota.redondeada}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <Aporte
              etiqueta="Rúbricas"
              nota={nota.notaRubricas}
              peso={nota.pesoRubricas}
              detalle={`${alumno.puntajes} ${
                alumno.puntajes === 1 ? "puntaje" : "puntajes"
              } en ${alumno.clasesEvaluadas} ${
                alumno.clasesEvaluadas === 1 ? "clase" : "clases"
              }`}
            />
            <Aporte
              etiqueta="Asistencia"
              nota={nota.notaAsistencia}
              peso={nota.pesoAsistencia}
              detalle={
                asistencia.registros === 0
                  ? "Sin registros"
                  : `${conComa(asistencia.porcentaje)}% de ${asistencia.registros} ${
                      asistencia.registros === 1 ? "clase" : "clases"
                    }`
              }
            />
          </div>
        </div>

        {nota.aclaracion && (
          <p className="mt-4 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
            {nota.aclaracion}
          </p>
        )}

        <p className="mt-3 text-xs text-ink-400">
          Es una referencia calculada con lo cargado entre el {informe.periodo.desdeTexto} y el{" "}
          {informe.periodo.hastaTexto}. La nota final la ponés vos.
        </p>

        {alumno.alertas.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {alumno.alertas.map((alerta) => (
              <li key={alerta} className="flex items-start gap-1.5 text-xs text-amber-700 sm:text-sm">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {alerta}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        icono={ListChecks}
        titulo="Indicadores del período"
        subtitulo="El promedio de cada indicador, sumando todas las rúbricas en las que apareció."
        accion={
          <span className="pill pill-brand">
            {alumno.indicadores.length}{" "}
            {alumno.indicadores.length === 1 ? "indicador" : "indicadores"}
          </span>
        }
      >
        {alumno.indicadores.length === 0 ? (
          <p className="text-sm text-ink-500">
            Este alumno no tiene ningún indicador puntuado en el período.
          </p>
        ) : (
          <ListaScroll alto="chica" etiqueta="Indicadores evaluados en el período">
            <ul className="space-y-2">
              {alumno.indicadores.map((indicador) => (
                <li
                  key={indicador.nombre}
                  className="flex items-center gap-3 rounded-control border border-linea bg-ink-50/60 px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-800">
                      {indicador.nombre}
                    </span>
                    <span className="text-xs text-ink-500">
                      Evaluado {indicador.veces} {indicador.veces === 1 ? "vez" : "veces"}
                    </span>
                  </span>
                  {/* La barra hace comparables los indicadores entre sí de un
                      vistazo, que es más rápido que leer diez números. */}
                  <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-ink-200 sm:block">
                    <span
                      className="block h-full rounded-full bg-brand-500"
                      style={{ width: `${indicador.promedio * 10}%` }}
                    />
                  </span>
                  <span
                    className={`inline-flex min-w-12 items-center justify-center rounded-control border px-2 py-0.5 text-sm font-bold tabular-nums ${tonoDeNota(
                      indicador.promedio
                    )}`}
                  >
                    {conComa(indicador.promedio)}
                  </span>
                </li>
              ))}
            </ul>
          </ListaScroll>
        )}
      </SectionCard>

      <SectionCard
        icono={CalendarCheck}
        titulo="Asistencia del período"
        subtitulo="Cuenta como asistida toda clase en la que el alumno no estuvo ausente."
      >
        {asistencia.registros === 0 ? (
          <p className="text-sm text-ink-500">
            No hay asistencia registrada para este alumno entre esas fechas.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Contador etiqueta="Presentes" valor={asistencia.presentes} />
            <Contador etiqueta="Tarde" valor={asistencia.tardes} />
            <Contador etiqueta="SAF" valor={asistencia.saf} />
            <Contador etiqueta="Ausentes" valor={asistencia.ausentes} />
            <Contador
              etiqueta="Asistencia"
              valor={`${conComa(asistencia.porcentaje)}%`}
              destacado
            />
          </div>
        )}
      </SectionCard>

      <SectionCard
        icono={FileText}
        titulo="Observaciones y seguimiento"
        subtitulo="Contexto para leer la nota. Nada de esto entra en el cálculo."
        accion={<span className="pill">No afecta la nota</span>}
      >
        <div className="space-y-4">
          <div>
            <p className="section-title mb-2">Seguimiento del alumno</p>
            {alumno.seguimiento.length === 0 ? (
              <p className="text-sm text-ink-500">
                Sin seguimiento cargado.{" "}
                <Link
                  href={`/cursos/${informe.curso.id}`}
                  className="link-brand text-sm align-baseline"
                >
                  Cargalo desde la ficha del curso
                </Link>
                .
              </p>
            ) : (
              <ListaScroll alto="chica" etiqueta="Seguimiento general del alumno">
                <ul className="space-y-1.5">
                  {alumno.seguimiento.map((item, indice) => (
                    <li
                      key={`${indice}-${item}`}
                      className="flex items-start gap-2 break-words rounded-control border border-linea bg-ink-50/60 px-3 py-2 text-sm text-ink-700"
                    >
                      <span aria-hidden="true" className="mt-0.5 text-brand-500">
                        •
                      </span>
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </ListaScroll>
            )}
          </div>

          <div>
            <p className="section-title mb-2">
              Observaciones al evaluar ({alumno.observacionesDeClase.length})
            </p>
            {alumno.observacionesDeClase.length === 0 ? (
              <p className="text-sm text-ink-500">
                No anotaste observaciones al evaluar las clases de este período.
              </p>
            ) : (
              <ListaScroll alto="chica" etiqueta="Observaciones anotadas al evaluar cada clase">
                <ul className="space-y-2">
                  {alumno.observacionesDeClase.map((observacion, indice) => (
                    <li
                      key={`${indice}-${observacion.fechaTexto}`}
                      className="rounded-control border border-linea bg-ink-50/60 px-3 py-2"
                    >
                      <p className="text-xs font-semibold text-ink-500">
                        {observacion.fechaTexto} · {observacion.rubrica}
                      </p>
                      <p className="mt-0.5 break-words text-sm text-ink-700">
                        {observacion.texto}
                      </p>
                    </li>
                  ))}
                </ul>
              </ListaScroll>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icono={ClipboardList}
        titulo="Clase por clase"
        subtitulo="El puntaje que sacó en cada rúbrica del período."
      >
        {alumno.clases.length === 0 ? (
          <p className="text-sm text-ink-500">
            No hay ninguna rúbrica evaluada para este alumno en el período.
          </p>
        ) : (
          <ListaScroll
            alto="media"
            etiqueta="Clases evaluadas del período"
            className="space-y-2"
          >
            {alumno.clases.map((clase) => (
              <Disclosure
                key={`${clase.claseId}-${clase.rubrica}`}
                titulo={
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    {/* El tema de la clase puede ser largo: se recorta en el
                        resumen plegado y se lee entero al abrirlo. */}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {clase.fechaTexto} · {clase.rubrica}
                      </span>
                      {clase.tema && (
                        <span className="block truncate text-xs font-normal text-ink-500">
                          {clase.tema}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-control border px-2 py-0.5 text-xs font-bold tabular-nums ${tonoDeNota(
                        clase.promedio
                      )}`}
                    >
                      {conComa(clase.promedio)}
                    </span>
                  </span>
                }
              >
                {clase.tema && (
                  <p className="mb-3 text-xs break-words text-ink-500">
                    <span className="font-semibold text-ink-600">Tema: </span>
                    {clase.tema}
                  </p>
                )}

                <ul className="space-y-1.5">
                  {clase.indicadores.map((indicador) => (
                    <li
                      key={indicador.nombre}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-ink-700">{indicador.nombre}</span>
                      <span className="shrink-0 font-bold tabular-nums text-ink-900">
                        {indicador.valor}
                      </span>
                    </li>
                  ))}
                </ul>

                {clase.observacion && (
                  <p className="mt-3 break-words rounded-control border border-linea bg-ink-50 px-3 py-2 text-xs text-ink-600">
                    {clase.observacion}
                  </p>
                )}

                <Link
                  href={`/cursos/${informe.curso.id}/clase/${clase.claseId}/evaluacion`}
                  className="link-brand mt-3 inline-block text-xs"
                >
                  Ir a la evaluación de esa clase
                </Link>
              </Disclosure>
            ))}
          </ListaScroll>
        )}
      </SectionCard>
    </div>
  );
}

/** Una de las dos patas de la nota, con el peso que le tocó. */
function Aporte({
  etiqueta,
  nota,
  peso,
  detalle,
}: {
  etiqueta: string;
  nota: number | null;
  peso: number;
  detalle: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-control border border-linea bg-ink-50/60 px-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-800">
          {etiqueta}
          <span className="ml-1.5 text-xs font-medium text-ink-500">{peso}% de la nota</span>
        </span>
        <span className="block truncate text-xs text-ink-500">{detalle}</span>
      </span>
      <span className="shrink-0 text-lg font-bold tabular-nums text-ink-900">
        {conComa(nota)}
      </span>
    </div>
  );
}

function Contador({
  etiqueta,
  valor,
  destacado = false,
}: {
  etiqueta: string;
  valor: number | string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-control border px-3 py-2 text-center 
        ${destacado ? "border-brand-200 bg-brand-50" : "border-linea bg-ink-50/60"}
        ${etiqueta === "Asistencia" ? "col-span-2 sm:col-span-1" : ""}
      `}
    >
      <p
        className={`text-lg font-bold tabular-nums ${
          destacado ? "text-brand-700" : "text-ink-900"
        }`}
      >
        {valor}
      </p>
      <p className="text-xs text-ink-500">{etiqueta}</p>
    </div>
  );
}
