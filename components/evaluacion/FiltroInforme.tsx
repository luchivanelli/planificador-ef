"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { Campo } from "@/components/form/Campo";
import {
  PESOS_RUBRICAS,
  busquedaDeInforme,
  type ParametrosInforme,
} from "@/lib/evaluacion/parametros";

/**
 * El período y el criterio con el que se arma la evaluación general.
 *
 * No es un formulario de guardar: todo lo que elige la docente viaja en la URL
 * y el informe se recalcula en el servidor. Por eso navega en vez de mandar una
 * server action, y por eso el link de la pantalla se puede compartir o dejar en
 * favoritos y sigue mostrando el mismo informe.
 */
export default function FiltroInforme({
  cursoId,
  alumnos,
  valores,
}: {
  cursoId: string;
  alumnos: { id: string; nombre: string; apellido: string }[];
  valores: ParametrosInforme;
}) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();

  const [desde, setDesde] = useState(valores.desde);
  const [hasta, setHasta] = useState(valores.hasta);
  const [alumnoId, setAlumnoId] = useState(valores.alumnoId ?? "");
  const [peso, setPeso] = useState(String(valores.pesoRubricas));
  const [detalle, setDetalle] = useState(valores.detalle);

  const rangoInvertido = Boolean(desde && hasta && desde > hasta);
  const esCursoCompleto = alumnoId === "";

  function buscar(evento: React.FormEvent) {
    evento.preventDefault();
    if (rangoInvertido) return;

    const busqueda = busquedaDeInforme({
      desde,
      hasta,
      alumnoId: alumnoId || null,
      pesoRubricas: Number(peso),
      detalle: esCursoCompleto && detalle,
    });

    iniciar(() => router.push(`/evaluacion/${cursoId}?${busqueda}`));
  }

  return (
    <form onSubmit={buscar} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Desde">
          <input
            type="date"
            value={desde}
            max={hasta || undefined}
            onChange={(evento) => setDesde(evento.target.value)}
            required
            className="input-shell"
          />
        </Campo>

        <Campo
          label="Hasta"
          error={rangoInvertido ? "El cierre no puede ser anterior al inicio." : undefined}
        >
          <input
            type="date"
            value={hasta}
            min={desde || undefined}
            onChange={(evento) => setHasta(evento.target.value)}
            required
            className="input-shell"
          />
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          label="Alumno"
          hint="Dejalo en “Curso completo” para evaluar a todos de una vez."
        >
          <select
            value={alumnoId}
            onChange={(evento) => setAlumnoId(evento.target.value)}
            className="input-shell"
          >
            <option value="">Curso completo ({alumnos.length})</option>
            {alumnos.map((alumno) => (
              <option key={alumno.id} value={alumno.id}>
                {alumno.apellido}, {alumno.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Peso de las rúbricas en la nota">
          <select
            value={peso}
            onChange={(evento) => setPeso(evento.target.value)}
            className="input-shell"
          >
            {PESOS_RUBRICAS.map((valor) => (
              <option key={valor} value={valor}>
                {valor}% rúbricas · {100 - valor}% asistencia
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {esCursoCompleto && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-control border border-linea bg-ink-50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={detalle}
            onChange={(evento) => setDetalle(evento.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
          />
          <span className="text-xs text-ink-600 sm:text-sm">
            Incluir en el PDF una hoja por alumno con el detalle de indicadores.
            <span className="mt-0.5 block text-xs text-ink-400">
              Sin esto el PDF del curso trae sólo la tabla con las notas sugeridas.
            </span>
          </span>
        </label>
      )}

      <button type="submit" disabled={enviando || rangoInvertido} className="button-primary w-full sm:w-auto">
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculando...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Ver evaluación del período
          </>
        )}
      </button>
    </form>
  );
}
