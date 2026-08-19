"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import { rubricaEdicionSchema } from "@/lib/schemas/evaluacion.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { actualizarRubrica } from "@/lib/actions/evaluacion.actions";

export type RubricaEditable = {
  id: string;
  nombre: string;
  indicadores: { id: string; nombre: string }[];
};

export default function EditarRubricaForm({
  rubrica,
  cursoId,
  claseId,
}: {
  rubrica: RubricaEditable;
  cursoId: string;
  claseId: string;
}) {
  const router = useRouter();
  const formId = `editar-rubrica-form-${rubrica.id}`;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(rubricaEdicionSchema),
    defaultValues: {
      nombre: rubrica.nombre,
      // Los indicadores que ya existen viajan con su `id`: así la acción los
      // actualiza en vez de borrarlos y volverlos a crear.
      indicadores: rubrica.indicadores.map((indicador) => ({
        id: indicador.id,
        nombre: indicador.nombre,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "indicadores" });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => actualizarRubrica(rubrica.id, cursoId, claseId, datos),
      errorInesperado: "No se pudo actualizar la rúbrica",
      onExito: () => {
        toast.success("Rúbrica actualizada");
        cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4 pt-1">
      <Campo label="Nombre de la rúbrica" error={errors.nombre?.message}>
        <input
          {...register("nombre")}
          placeholder="Ej. Deportes de conjunto"
          className="input-shell"
        />
      </Campo>

      <div className="space-y-2">
        <p className="field-label">Indicadores</p>
        <p className="-mt-1 mb-1 text-xs text-ink-400">
          Si quitás un indicador, se borran los puntajes que ya cargaste en él.
        </p>
        {fields.map((field, i) => (
          <Campo key={field.id} error={errors.indicadores?.[i]?.nombre?.message}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">
                {i + 1}
              </span>
              <input
                {...register(`indicadores.${i}.nombre`)}
                placeholder={`Indicador ${i + 1}`}
                className="input-shell"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
                aria-label={`Quitar indicador ${i + 1}`}
                title="Quitar indicador"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 text-ink-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Campo>
        ))}
        <button
          type="button"
          onClick={() => append({ nombre: "" })}
          className="button-secondary w-full"
        >
          <Plus className="h-4 w-4" />
          Agregar indicador
        </button>
        <ErrorGeneral mensaje={errors.indicadores?.root?.message} />
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex justify-end border-t border-linea pt-3">
        <BotonEnviar
          enviando={isSubmitting}
          textoEnviando="Guardando..."
          className="button-primary w-full sm:w-auto"
        >
          Guardar cambios
        </BotonEnviar>
      </div>
    </form>
  );
}
