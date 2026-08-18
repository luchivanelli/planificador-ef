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
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-2 mt-4">
      <div className="flex flex-wrap gap-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 w-full gap-2">
          <Campo label="Fecha" error={errors.fecha?.message} className="w-full col-span-2 sm:col-span-1">
            <input {...register("fecha")} type="date" className="input-shell w-full" />
          </Campo>
          <Campo label="Hora inicio" error={errors.horaInicio?.message} className="w-full sm:w-auto">
            <input {...register("horaInicio")} type="time" className="input-shell w-full" />
          </Campo>
          <Campo label="Hora fin" error={errors.horaFin?.message} className="w-full sm:w-auto">
            <input {...register("horaFin")} type="time" className="input-shell w-full" />
          </Campo>
        </div>
        <Campo label="Eje NAP" error={errors.ejeNapId?.message} className="w-full">
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
          <Campo error={errors.ejeOtro?.message} className="w-full">
            <input
              {...register("ejeOtro")}
              type="text"
              placeholder="Nombre del eje"
              className="input-shell w-full"
            />
          </Campo>
        )}
        <Campo label="Tema" error={errors.temaClase?.message} hint={AYUDA_LISTA} className="w-full">
          <TextareaLista control={control} name="temaClase" />
        </Campo>
        <Campo
          label="Objetivo"
          error={errors.objetivoClase?.message}
          hint={AYUDA_LISTA}
          className="w-full"
        >
          <TextareaLista control={control} name="objetivoClase" />
        </Campo>
        <Campo
          label="Contenidos"
          error={errors.contenidosClase?.message}
          hint={AYUDA_LISTA}
          className="w-full"
        >
          <TextareaLista control={control} name="contenidosClase" />
        </Campo>
        <BotonEnviar enviando={isSubmitting} textoEnviando="Agregando..." className="button-primary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar
        </BotonEnviar>
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />
    </form>
  );
}
