"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import { rubricaSchema } from "@/lib/schemas/evaluacion.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { crearRubrica } from "@/lib/actions/evaluacion.actions";

const VALORES_INICIALES = { nombre: "", indicadores: [{ nombre: "" }] };

export default function RubricaForm({ cursoId, claseId }: { cursoId: string; claseId: string }) {
  const router = useRouter();
  const formId = `rubrica-form-${claseId}`;
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(rubricaSchema),
    defaultValues: VALORES_INICIALES,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "indicadores" });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => crearRubrica(cursoId, claseId, datos),
      errorInesperado: "No se pudo crear la rúbrica",
      onExito: () => {
        toast.success("Rúbrica creada");
        reset(VALORES_INICIALES);
        cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      noValidate
      className="bg-whit space-y-2 py-2"
    >
      <Campo label="Nombre" error={errors.nombre?.message}>
        <input
          {...register("nombre")}
          placeholder="Ej. Deportes de conjunto"
          className="input-shell"
        />
      </Campo>

      <div className="space-y-2">
        <label className="mb-1 block text-xs font-medium text-slate-500">Indicadores</label>
        {fields.map((field, i) => (
          <Campo key={field.id} error={errors.indicadores?.[i]?.nombre?.message}>
            <div className="flex items-center gap-2">
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
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Campo>
        ))}
        <ErrorGeneral mensaje={errors.indicadores?.root?.message} />
      </div>
      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex w-full gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={() => append({ nombre: "" })}
          className="button-secondary"
        >
          + Agregar indicador
        </button>
        <BotonEnviar
          enviando={isSubmitting}
          textoEnviando="Creando..."
          className="button-primary"
        >
          Crear rúbrica
        </BotonEnviar>
      </div>
    </form>
  );
}
