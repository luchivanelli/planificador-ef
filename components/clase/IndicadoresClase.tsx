"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { ValorIndicador } from "@prisma/client";
import { ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import ConfirmActionButton from "@/components/ConfirmActionButton";
import IndicadorTitulo from "@/components/clase/IndicadorTitulo";
import { indicadoresClaseSchema } from "@/lib/schemas/indicador.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { guardarIndicadoresDeClase } from "@/lib/actions/indicador.actions";
import { VALORES_INDICADOR } from "@/lib/types";

export type IndicadorDeClase = {
  id: string;
  titulo: string;
  /** Valor en esta clase; `null` si todavía no se respondió. */
  valor: ValorIndicador | null;
};

/** La cadena vacía es una opción más: así se puede dejar sin responder. */
const OPCIONES = [{ value: "", label: "Sin evaluar" }, ...VALORES_INDICADOR];

const CLASES_POR_VALOR: Record<string, string> = {
  "": "peer-checked:bg-slate-200 peer-checked:text-slate-700 peer-checked:border-slate-300",
  SI: "peer-checked:bg-emerald-50 peer-checked:text-emerald-700 peer-checked:border-emerald-300",
  A_VECES: "peer-checked:bg-amber-50 peer-checked:text-amber-700 peer-checked:border-amber-300",
  NO: "peer-checked:bg-rose-50 peer-checked:text-rose-700 peer-checked:border-rose-300",
};

/**
 * Los indicadores son del docente y se reutilizan clase a clase; lo que se
 * guarda acá es el valor que tuvieron en esta.
 */
export default function IndicadoresClase({
  cursoId,
  claseId,
  indicadores,
}: {
  cursoId: string;
  claseId: string;
  indicadores: IndicadorDeClase[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(indicadoresClaseSchema),
    defaultValues: {
      // `Object.fromEntries` ensancha a `string`: el cast le devuelve el tipo
      // que el esquema espera.
      valores: Object.fromEntries(
        indicadores.map((indicador) => [indicador.id, indicador.valor ?? ""])
      ) as Record<string, ValorIndicador | "">,
    },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => guardarIndicadoresDeClase(cursoId, claseId, datos),
      errorInesperado: "No se pudieron guardar los indicadores",
      onExito: () => {
        toast.success("Indicadores guardados");
        router.refresh();
      },
    })
  );

  if (indicadores.length === 0) {
    return (
      <p className="border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Todavía no cargaste indicadores. Creá el primero para evaluar al grupo.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      {indicadores.map((indicador) => (
        <div
          key={indicador.id}
          className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 p-3"
        >
          <IndicadorTitulo
            indicadorId={indicador.id}
            titulo={indicador.titulo}
            cursoId={cursoId}
            claseId={claseId}
          />

          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
            <div className="grid grid-cols-[auto_auto_auto_auto] gap-1">
              {OPCIONES.map((opcion) => (
                <label key={opcion.value} className="cursor-pointer">
                  <input
                    {...register(`valores.${indicador.id}`)}
                    type="radio"
                    value={opcion.value}
                    className="peer sr-only"
                  />
                  <span
                    className={`block border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs font-medium text-slate-600 ${CLASES_POR_VALOR[opcion.value]}`}
                  >
                    {opcion.label}
                  </span>
                </label>
              ))}
            </div>

            {/* `type="button"`: vive dentro del form pero no lo envía. */}
            <ConfirmActionButton
              buttonLabel="Eliminar"
              className="block border border-[#fecaca] bg-[#fee2e2] px-2.5 py-1.5 text-center text-xs font-medium text-[#dc2626]"
              confirmTitle={`¿Eliminar “${indicador.titulo}”?`}
              confirmMessage="Se borrará el indicador y lo que hayas evaluado con él en todas las clases."
              confirmActionType="delete-indicador"
              hiddenFields={{ indicadorId: indicador.id, cursoId, claseId }}
              successMessage="Indicador eliminado"
              errorMessage="No se pudo eliminar el indicador"
            />
          </div>

          <ErrorGeneral mensaje={errors.valores?.[indicador.id]?.message} />
        </div>
      ))}

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex justify-end">
        <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
          Guardar indicadores
        </BotonEnviar>
      </div>
    </form>
  );
}
