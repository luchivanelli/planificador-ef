"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import { AYUDA_LISTA } from "@/lib/form/ayudas";
import { unidadDidacticaSchema } from "@/lib/schemas/planificacion.schema";
import { aValorFecha } from "@/lib/schemas/common";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { actualizarUnidadDidactica } from "@/lib/actions/unidadDidactica.actions";

export type UnidadEditable = {
  id: string;
  titulo: string;
  objetivo: string | null;
  /** Fechas ya en formato `YYYY-MM-DD`, listas para el input. */
  fechaInicio: string;
  fechaFin: string;
};

/** Edita una unidad existente. El alta vive en `AddUnidad`, que es página propia. */
export default function UnidadForm({
  unidad,
  cursoId,
  planificacionId,
}: {
  unidad: UnidadEditable;
  cursoId: string;
  planificacionId: string;
}) {
  const router = useRouter();
  const formId = `unidad-form-${unidad.id}`;
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(unidadDidacticaSchema),
    defaultValues: {
      titulo: unidad.titulo,
      objetivo: unidad.objetivo ?? "",
      fechaInicio: aValorFecha(unidad.fechaInicio),
      fechaFin: aValorFecha(unidad.fechaFin),
    },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => actualizarUnidadDidactica(unidad.id, cursoId, planificacionId, datos),
      errorInesperado: "No se pudieron guardar los cambios",
      onExito: () => {
        toast.success("Unidad actualizada");
        cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="mt-3 space-y-3">
      <Campo label="Título" error={errors.titulo?.message}>
        <input {...register("titulo")} className="input-shell w-full" />
      </Campo>
      <Campo label="Objetivos" error={errors.objetivo?.message} hint={AYUDA_LISTA}>
        <TextareaLista control={control} name="objetivo" className="input-shell min-h-[92px] w-full" />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Fecha de inicio" error={errors.fechaInicio?.message}>
          <input {...register("fechaInicio")} type="date" className="input-shell w-full" />
        </Campo>
        <Campo label="Fecha de fin" error={errors.fechaFin?.message}>
          <input {...register("fechaFin")} type="date" className="input-shell w-full" />
        </Campo>
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex justify-end">
        <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
          Guardar cambios
        </BotonEnviar>
      </div>
    </form>
  );
}
