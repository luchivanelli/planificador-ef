import Link from "next/link";
import { ChevronRight, TriangleAlert, Users } from "lucide-react";
import type { InformeGeneral } from "@/lib/evaluacion/informe-general";
import { hrefInforme, type ParametrosInforme } from "@/lib/evaluacion/parametros";
import EmptyState from "@/components/ui/EmptyState";
import ListaScroll from "@/components/ui/ListaScroll";
import { conComa, tonoDeNota } from "./nota-visual";

/**
 * El curso entero de un vistazo: una fila por alumno con su promedio de
 * rúbricas, su asistencia y la nota que sugiere el sistema.
 *
 * Es la pantalla que evita abrir alumno por alumno. Cada fila lleva al informe
 * individual, que es el mismo período con el detalle de cada indicador.
 *
 * La grilla tiene una sola forma de markup para las dos pantallas: en el
 * celular el nombre va arriba y los números abajo; desde `sm` las cuatro
 * columnas se alinean con el encabezado.
 */

const COLUMNAS = "sm:grid-cols-[minmax(0,1fr)_5.5rem_6rem_7rem]";

export default function TablaCurso({
  informe,
  parametros,
}: {
  informe: InformeGeneral;
  parametros: ParametrosInforme;
}) {
  if (informe.alumnos.length === 0) {
    return (
      <EmptyState
        icono={Users}
        titulo="Este curso no tiene alumnos en el período"
        descripcion="Cargá alumnos en el curso, o revisá que el período elegido sea el correcto."
      />
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`hidden gap-3 px-3 pb-1 sm:grid ${COLUMNAS} items-center`}
        aria-hidden="true"
      >
        <span className="section-title">Alumno</span>
        <span className="section-title text-center">Rúbricas</span>
        <span className="section-title text-center">Asistencia</span>
        <span className="section-title text-center">Nota sugerida</span>
      </div>

      <ListaScroll alto="grande" etiqueta="Alumnos del curso con su nota sugerida">
        <ul className="space-y-2">
          {informe.alumnos.map((alumno) => {
            // Con el ancla: al abrir un alumno la pantalla queda en el informe
            // y no arriba de todo, mostrando el formulario de filtros.
            const href = hrefInforme(informe.curso.id, parametros, {
              alumnoId: alumno.id,
              detalle: false,
            });

            return (
              <li key={alumno.id}>
                <Link
                  href={href}
                  className={`card card-hover grid gap-3 p-3 ${COLUMNAS} sm:items-center`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-ink-900">
                        {alumno.nombreCompleto}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 sm:hidden" />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">
                      {alumno.clasesEvaluadas === 0
                        ? "Sin clases evaluadas"
                        : `${alumno.clasesEvaluadas} ${
                            alumno.clasesEvaluadas === 1 ? "clase evaluada" : "clases evaluadas"
                          } · ${alumno.puntajes} ${alumno.puntajes === 1 ? "puntaje" : "puntajes"}`}
                    </span>
                    {alumno.alertas.length > 0 && (
                      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                        <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{alumno.alertas[0]}</span>
                        {alumno.alertas.length > 1 && (
                          <span className="text-ink-400">+{alumno.alertas.length - 1}</span>
                        )}
                      </span>
                    )}
                  </span>

                  <Celda etiqueta="Rúbricas" valor={conComa(alumno.promedioRubricas)} />
                  <Celda
                    etiqueta="Asistencia"
                    valor={
                      alumno.asistencia.porcentaje === null
                        ? "—"
                        : `${conComa(alumno.asistencia.porcentaje)}%`
                    }
                  />

                  <span className="flex items-center gap-2 sm:justify-center">
                    <span className="text-xs font-semibold text-ink-400 sm:hidden">
                      Nota sugerida
                    </span>
                    <span
                      className={`inline-flex min-w-14 items-center justify-center rounded-control border px-2.5 py-1 text-base font-bold tabular-nums ${tonoDeNota(
                        alumno.nota.valor
                      )}`}
                    >
                      {conComa(alumno.nota.valor)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </ListaScroll>
    </div>
  );
}

/**
 * Un número de la fila. En el celular lleva su etiqueta al lado, porque ahí no
 * está el encabezado de columnas que lo explica.
 */
function Celda({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <span className="flex items-center gap-2 sm:justify-center">
      <span className="text-xs font-semibold text-ink-400 sm:hidden">{etiqueta}</span>
      <span className="text-sm font-bold tabular-nums text-ink-800">{valor}</span>
    </span>
  );
}
