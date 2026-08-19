"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import Avatar from "@/components/ui/Avatar";
import { evaluacionSchema } from "@/lib/schemas/evaluacion.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { guardarEvaluacion } from "@/lib/actions/evaluacion.actions";
import { NIVELES_LOGRO, type NivelDeLogro } from "@/lib/types";

type Indicador = { id: string; nombre: string };

/** La escala 1 a 10 se lee de un vistazo por color: rojo, ámbar y verde. */
function clasePorNivel(nivel: NivelDeLogro) {
  if (nivel <= 4)
    return "peer-checked:border-rose-500 peer-checked:bg-rose-500 peer-checked:text-white";
  if (nivel <= 7)
    return "peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-checked:text-white";
  return "peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white";
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
      className={`overflow-hidden rounded-control border bg-white ${
        evaluado ? "border-emerald-200" : "border-amber-200"
      }`}
    >
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className={`flex w-full items-center gap-2.5 p-2.5 text-left transition ${
          evaluado ? "bg-emerald-50/70 hover:bg-emerald-50" : "bg-amber-50/70 hover:bg-amber-50"
        }`}
      >
        <Avatar nombre={`${alumno.nombre} ${alumno.apellido}`} tamanio="sm" />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-800">
            {alumno.apellido}, {alumno.nombre}
          </span>
          <span
            className={`text-xs font-semibold ${evaluado ? "text-emerald-700" : "text-amber-700"}`}
          >
            {evaluado ? "Evaluado" : "Sin evaluar"}
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-400 transition ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <form
          onSubmit={onSubmit}
          noValidate
          className="animar-entrada space-y-4 border-t border-linea px-3 pb-3.5 pt-3"
        >
          {indicadores.map((indicador) => (
            <div key={indicador.id}>
              <p className="mb-2 text-xs font-bold text-ink-700">{indicador.nombre}</p>
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                {NIVELES_LOGRO.map((nivel) => (
                  <label key={nivel} className="cursor-pointer">
                    <input
                      {...register(`valores.${indicador.id}`)}
                      type="radio"
                      value={nivel}
                      className="peer sr-only"
                    />
                    <span
                      className={`block rounded-lg border border-ink-200 bg-white py-2 text-center text-sm font-bold text-ink-500 transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 hover:border-brand-300 ${clasePorNivel(nivel)}`}
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
