"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import { evaluacionSchema } from "@/lib/schemas/evaluacion.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { guardarEvaluacion } from "@/lib/actions/evaluacion.actions";
import { NIVELES_LOGRO, type NivelDeLogro } from "@/lib/types";

type Indicador = { id: string; nombre: string };

/** La escala 1 a 10 se lee de un vistazo por color: rojo, ámbar y verde. */
function clasePorNivel(nivel: NivelDeLogro) {
  if (nivel <= 4) return "peer-checked:bg-rose-50 peer-checked:text-rose-700 peer-checked:border-rose-300";
  if (nivel <= 7) return "peer-checked:bg-amber-50 peer-checked:text-amber-700 peer-checked:border-amber-300";
  return "peer-checked:bg-emerald-50 peer-checked:text-emerald-700 peer-checked:border-emerald-300";
}

export default function EvaluacionAlumno({
  alumno,
  rubricaId,
  indicadores,
  cursoId,
  claseId,
  evaluacion,
}: {
  alumno: { id: string; nombre: string; apellido: string };
  rubricaId: string;
  indicadores: Indicador[];
  cursoId: string;
  claseId: string;
  evaluacion?: {
    id: string;
    observacionDocente?: string | null;
    detalles: { indicadorId: string; valor: number }[];
  } | null;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  // No alcanza con que exista la evaluación: si a la rúbrica le agregaron un
  // indicador después de guardarla, al alumno le falta responder ese.
  const evaluado =
    indicadores.length > 0 &&
    indicadores.every((indicador) =>
      evaluacion?.detalles.some((detalle) => detalle.indicadorId === indicador.id)
    );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(evaluacionSchema),
    defaultValues: {
      observacionDocente: evaluacion?.observacionDocente ?? "",
      // Los puntajes se manejan como texto, igual que los devuelven los radios;
      // el esquema los convierte a número. La cadena vacía significa "sin
      // responder": el esquema la rechaza y marca el indicador que falta.
      valores: Object.fromEntries(
        indicadores.map((indicador) => {
          const nivel = evaluacion?.detalles.find(
            (detalle) => detalle.indicadorId === indicador.id
          )?.valor;
          return [indicador.id, nivel === undefined ? "" : String(nivel)];
        })
      ) as Record<string, string>,
    },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () =>
        guardarEvaluacion(cursoId, claseId, alumno.id, rubricaId, evaluacion?.id ?? null, datos),
      errorInesperado: "No se pudo guardar la evaluación",
      onExito: () => {
        toast.success("Evaluación guardada");
        setAbierto(false);
        router.refresh();
      },
    })
  );

  return (
    <div
      className={`border bg-white shadow-sm mr-1 ${evaluado ? "border-emerald-200" : "border-amber-200"}`}
    >
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className={`flex w-full items-center justify-between gap-2 p-2 sm:p-3 text-left ${
          evaluado ? "bg-emerald-50" : "bg-amber-50"
        }`}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            {alumno.apellido}, {alumno.nombre}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              evaluado
                ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                : "border-amber-300 bg-amber-100 text-amber-700"
            }`}
          >
            {evaluado ? "Evaluado" : "Sin evaluar"}
          </span>
        </span>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          {abierto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {abierto && (
        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-4 border-t border-slate-100 bg-white px-4 pb-4 pt-3"
        >
          {indicadores.map((indicador) => (
            <div key={indicador.id}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                {indicador.nombre}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {NIVELES_LOGRO.map((nivel) => (
                  <label key={nivel} className="cursor-pointer">
                    <input
                      {...register(`valores.${indicador.id}`)}
                      type="radio"
                      value={nivel}
                      className="peer sr-only"
                    />
                    <span
                      className={`block min-w-9 border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center text-xs font-medium text-slate-600 ${clasePorNivel(nivel)}`}
                    >
                      {nivel}
                    </span>
                  </label>
                ))}
              </div>
              <ErrorGeneral mensaje={errors.valores?.[indicador.id]?.message} />
            </div>
          ))}

          <ErrorGeneral mensaje={errors.root?.message} />

          <div className="flex justify-end">
            <BotonEnviar
              enviando={isSubmitting}
              textoEnviando="Guardando..."
              className="button-primary w-full sm:w-auto"
            >
              Guardar evaluación
            </BotonEnviar>
          </div>
        </form>
      )}
    </div>
  );
}
