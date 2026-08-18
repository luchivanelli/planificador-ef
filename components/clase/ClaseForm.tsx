"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import { AYUDA_LISTA } from "@/lib/form/ayudas";
import { claseSchema } from "@/lib/schemas/clase.schema";
import { aValorFecha } from "@/lib/schemas/common";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { actualizarClase, eliminarClase } from "@/lib/actions/clases.actions";
import { EJE_OTRO, ESTADOS_CLASE, type OpcionEje } from "@/lib/types";
import type { ClaseInput } from "@/lib/schemas/clase.schema";
import FormSubmit from "@/components/FormSubmit";


export type ClaseEditable = {
  id: string;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  objetivoClase: string | null;
  temaClase: string | null;
  contenidosClase: string | null;
  ejeNapId: string | null;
  ejeOtro: string | null;
  espacioRequerido: ClaseInput["espacioRequerido"] | null;
  estado: ClaseInput["estado"];
  // Sin campo propio en el formulario, pero viajan igual: `claseSchema` los
  // define con `default("")` y `datosDeClase` los reescribe con lo que reciba.
  // Si no llegaran, guardar una clase cancelada le pisaría el motivo con "otro".
  motivoCancelacion: ClaseInput["motivoCancelacion"] | null;
  motivoCancelacionOtro: string | null;
};

export default function ClaseForm({
  clase,
  cursoId,
  unidadDidacticaId,
  ejes,
}: {
  clase: ClaseEditable;
  cursoId: string;
  unidadDidacticaId: string;
  ejes: OpcionEje[];
}) {
  const router = useRouter();
  const formId = `clase-form-${clase.id}`;
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(claseSchema),
    defaultValues: {
      fecha: aValorFecha(clase.fecha),
      estado: clase.estado,
      horaInicio: clase.horaInicio ?? "",
      horaFin: clase.horaFin ?? "",
      objetivoClase: clase.objetivoClase ?? "",
      temaClase: clase.temaClase ?? "",
      contenidosClase: clase.contenidosClase ?? "",
      // Una clase con eje escrito a mano no tiene `ejeNapId`: el select vuelve
      // a mostrar "Otro" y el texto guardado queda en el input.
      ejeNapId: clase.ejeNapId ?? (clase.ejeOtro ? EJE_OTRO : ""),
      ejeOtro: clase.ejeOtro ?? "",
      espacioRequerido: clase.espacioRequerido ?? "",
      motivoCancelacion: clase.motivoCancelacion ?? "",
      motivoCancelacionOtro: clase.motivoCancelacionOtro ?? "",
    },
  });

  const ejePropio = useWatch({ control, name: "ejeNapId" }) === EJE_OTRO;

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => actualizarClase(clase.id, cursoId, unidadDidacticaId, datos),
      errorInesperado: "No se pudieron guardar los cambios",
      onExito: () => {
        toast.success("Clase actualizada");
        cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  const eliminarClaseConIds = eliminarClase.bind(null, clase.id, cursoId, unidadDidacticaId);

  return (
    <div className="mt-4 grid gap-3">
      {/* El form de eliminar no puede anidarse dentro del de edición (HTML
          inválido: el navegador lo descarta y el botón termina guardando).
          Queda como hermano y "Guardar" apunta al form por id. */}
      <form id={formId} onSubmit={onSubmit} noValidate className="grid gap-2">
        <div className="grid gap-2 md:grid-cols-2">
          <Campo label="Fecha" error={errors.fecha?.message}>
            <input {...register("fecha")} type="date" className="input-shell w-full" />
          </Campo>
          <Campo label="Estado" error={errors.estado?.message}>
            <select {...register("estado")} className="input-shell w-full">
              {ESTADOS_CLASE.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
              {/* `reprogramada` no se elige a mano, pero si la clase ya está así
                  hay que poder verlo y guardar el resto de los campos. */}
              {!ESTADOS_CLASE.some((e) => e.value === clase.estado) && (
                <option value={clase.estado} disabled>
                  Reprogramada
                </option>
              )}
            </select>
          </Campo>
        </div>
        <div className="grid gap-2 grid-cols-2">
          <Campo label="Hora inicio" error={errors.horaInicio?.message}>
            <input {...register("horaInicio")} type="time" className="input-shell w-full" />
          </Campo>
          <Campo label="Hora fin" error={errors.horaFin?.message}>
            <input {...register("horaFin")} type="time" className="input-shell w-full" />
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
            <input {...register("ejeOtro")} type="text" className="input-shell w-full" />
          </Campo>
        )}
        <div className="grid md:grid-cols-2 gap-x-2">
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
      </form>

      <div className="flex flex-wrap gap-2 justify-end">
        <BotonEnviar
          form={formId}
          enviando={isSubmitting}
          textoEnviando="Guardando..."
          className="button-primary"
        >
          Guardar
        </BotonEnviar>
        <form action={eliminarClaseConIds}>
          <FormSubmit className="button-delete">Eliminar</FormSubmit>
        </form>
      </div>
    </div>
  );
}
