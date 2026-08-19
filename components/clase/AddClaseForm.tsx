"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import { AYUDA_LISTA } from "@/lib/form/ayudas";
import { claseSchema, type ClaseFormValues } from "@/lib/schemas/clase.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { crearClase } from "@/lib/actions/clases.actions";
import { EJE_OTRO, type OpcionEje } from "@/lib/types";

const VALORES_INICIALES: ClaseFormValues = {
  fecha: "",
  horaInicio: "",
  horaFin: "",
  ejeNapId: "",
  ejeOtro: "",
  objetivoClase: "",
  temaClase: "",
  contenidosClase: "",
};

export default function AddClaseForm({
  unidadId,
  cursoId,
  ejes,
}: {
  unidadId: string;
  cursoId: string;
  ejes: OpcionEje[];
}) {
  const router = useRouter();
  const formId = `agregar-clase-form-${unidadId}`;
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(claseSchema),
    defaultValues: VALORES_INICIALES,
  });

  // `useWatch` en vez de `watch()`: re-renderiza sólo por este campo y no hace
  // que el compilador de React se saltee la memoización del componente.
  const ejePropio = useWatch({ control, name: "ejeNapId" }) === EJE_OTRO;

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => crearClase(unidadId, cursoId, datos),
      errorInesperado: "No se pudo agregar la clase",
      onExito: () => {
        toast.success("Clase agregada");
        reset(VALORES_INICIALES);
        cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4 pt-1">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Campo label="Fecha" error={errors.fecha?.message} className="col-span-2">
          <input {...register("fecha")} type="date" className="input-shell" />
        </Campo>
        <Campo label="Hora inicio" error={errors.horaInicio?.message}>
          <input {...register("horaInicio")} type="time" className="input-shell" />
        </Campo>
        <Campo label="Hora fin" error={errors.horaFin?.message}>
          <input {...register("horaFin")} type="time" className="input-shell" />
        </Campo>
      </div>

      <Campo label="Eje NAP" error={errors.ejeNapId?.message}>
        <div className="grid gap-1.5">
          {ejes.map((eje) => (
            <label key={eje.id} className="option-shell">
              <input {...register("ejeNapId")} type="radio" value={eje.id} />
              <span>{eje.nombre}</span>
            </label>
          ))}
          <label className="option-shell">
            <input {...register("ejeNapId")} type="radio" value={EJE_OTRO} />
            <span>Otro</span>
          </label>
        </div>
      </Campo>

      {ejePropio && (
        <Campo label="Nombre del eje" error={errors.ejeOtro?.message}>
          <input
            {...register("ejeOtro")}
            type="text"
            placeholder="Ej. Prácticas corporales expresivas"
            className="input-shell"
          />
        </Campo>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Campo label="Tema" error={errors.temaClase?.message} hint={AYUDA_LISTA}>
          <TextareaLista control={control} name="temaClase" />
        </Campo>
        <Campo label="Objetivo" error={errors.objetivoClase?.message} hint={AYUDA_LISTA}>
          <TextareaLista control={control} name="objetivoClase" />
        </Campo>
        <Campo label="Contenidos" error={errors.contenidosClase?.message} hint={AYUDA_LISTA}>
          <TextareaLista control={control} name="contenidosClase" />
        </Campo>
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex justify-end border-t border-linea pt-3">
        <BotonEnviar
          enviando={isSubmitting}
          textoEnviando="Agregando..."
          className="button-primary w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          Agregar clase
        </BotonEnviar>
      </div>
    </form>
  );
}
