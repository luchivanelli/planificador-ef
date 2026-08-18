"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ConfirmActionButton from "@/components/ConfirmActionButton";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import { AYUDA_LISTA } from "@/lib/form/ayudas";
import { planificacionSchema } from "@/lib/schemas/planificacion.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { actualizarPlanificacion, crearPlanificacion } from "@/lib/actions/planificacion.actions";

export type PlanificacionEditable = {
  id: string;
  anio: number;
  objetivos: string | null;
};

export default function PlanificacionForm({
  cursoId,
  planificacion,
}: {
  cursoId: string;
  planificacion?: PlanificacionEditable;
}) {
  const router = useRouter();
  // Hay un formulario por planificación en la misma página: el id no puede ser fijo.
  const formId = `planificacion-form-${planificacion?.id ?? "nueva"}`;
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(planificacionSchema),
    defaultValues: {
      anio: planificacion?.anio ?? new Date().getFullYear(),
      objetivos: planificacion?.objetivos ?? "",
    },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () =>
        planificacion
          ? actualizarPlanificacion(planificacion.id, datos)
          : crearPlanificacion(cursoId, datos),
      onExito: (_data, redirectTo) => {
        if (redirectTo) router.push(redirectTo);
        cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="mt-3 space-y-3">
      <div className="grid gap-3">
        <Campo label="Año" error={errors.anio?.message}>
          {/* Sólo lectura (no editable) pero se envía y valida igual que el resto. */}
          <input
            {...register("anio", { valueAsNumber: true })}
            type="number"
            readOnly
            aria-readonly="true"
            className="input-shell"
          />
        </Campo>
      </div>

      <Campo label="Objetivos" error={errors.objetivos?.message} hint={AYUDA_LISTA}>
        <TextareaLista
          control={control}
          name="objetivos"
          rows={3}
          className="input-shell min-h-[92px] w-full"
        />
      </Campo>

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex flex-wrap gap-2">
        <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary flex-1">
          {planificacion ? "Guardar cambios" : "Crear planificación"}
        </BotonEnviar>

        {planificacion && (
          <ConfirmActionButton
            buttonLabel="Eliminar"
            className="button-delete"
            confirmActionType="delete-planificacion"
            hiddenFields={{ planificacionId: planificacion.id, cursoId }}
            confirmTitle={`¿Eliminar la planificación ${planificacion.anio}?`}
            confirmMessage="Se eliminarán también sus unidades didácticas. Esta acción no se puede deshacer."
            successMessage="Planificación eliminada"
            errorMessage="No se pudo eliminar la planificación"
          />
        )}
      </div>
    </form>
  );
}
