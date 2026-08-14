"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import ConfirmActionButton from "@/components/ConfirmActionButton";
import JuegoPicker, { type JuegoOpcion } from "@/components/juego/JuegoPicker";
import {
  actividadSchema,
  type ActividadFormValues,
  type ActividadInput,
} from "@/lib/schemas/clase.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { actualizarActividad, agregarActividad } from "@/lib/actions/clases.actions";
import { TIPOS_BLOQUE } from "@/lib/types";

export type { JuegoOpcion };

/** El orden no se edita acá: se define arrastrando las actividades en la lista. */
export type ActividadEditable = {
  id: string;
  tipoBloque: ActividadInput["tipoBloque"];
  juegoId: string | null;
  duracionMinutos: number;
};

/**
 * Sirve para editar una actividad existente (`actividad` presente) y para
 * agregar una nueva: los campos y la validación son los mismos.
 */
export default function ActividadForm({
  claseId,
  cursoId,
  unidadDidacticaId,
  juegos,
  actividad,
  onGuardado,
}: {
  claseId: string;
  cursoId: string;
  unidadDidacticaId: string;
  juegos: JuegoOpcion[];
  actividad?: ActividadEditable;
  /** Avisa que se guardó, para que quien lo envuelva pueda cerrar el panel. */
  onGuardado?: () => void;
}) {
  const router = useRouter();
  const esEdicion = Boolean(actividad);

  const valoresIniciales: ActividadFormValues = actividad
    ? {
        tipoBloque: actividad.tipoBloque,
        juegoId: actividad.juegoId ?? "",
        duracionMinutos: actividad.duracionMinutos,
      }
    : { tipoBloque: "desarrollo" as const, juegoId: "", duracionMinutos: 10 };

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(actividadSchema),
    defaultValues: valoresIniciales,
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () =>
        actividad
          ? actualizarActividad(actividad.id, claseId, cursoId, datos)
          : agregarActividad(claseId, cursoId, unidadDidacticaId, datos),
      errorInesperado: "No se pudo guardar la actividad",
      onExito: () => {
        toast.success(esEdicion ? "Actividad actualizada" : "Actividad agregada");
        if (!esEdicion) reset(valoresIniciales);
        onGuardado?.();
        router.refresh();
      },
    })
  );

  // El picker no es un control nativo, así que el valor se lee y se escribe a
  // mano en vez de con `register`.
  const juegoElegido = useWatch({ control, name: "juegoId" }) ?? "";

  const buscadorJuego = (
    <JuegoPicker
      juegos={juegos}
      valor={juegoElegido}
      onCambio={(juegoId) => setValue("juegoId", juegoId, { shouldDirty: true })}
    />
  );

  const selectTipoBloque = (
    <select {...register("tipoBloque")} className="input-shell w-full">
      {TIPOS_BLOQUE.map((tipo) => (
        <option key={tipo.value} value={tipo.value}>
          {tipo.label}
        </option>
      ))}
    </select>
  );

  // Se compara contra `actividad` (y no `esEdicion`) para que TypeScript
  // sepa que el id existe al armar el botón de eliminar.
  if (actividad) {
    return (
      <form onSubmit={onSubmit} noValidate className="mt-3 grid gap-2 md:grid-cols-3">
        {/* El buscador ocupa toda la fila: el panel de filtros necesita el ancho. */}
        <Campo error={errors.juegoId?.message} className="md:col-span-3">
          {buscadorJuego}
        </Campo>
        <Campo error={errors.tipoBloque?.message}>{selectTipoBloque}</Campo>
        <Campo error={errors.duracionMinutos?.message} className="flex items-center">
          <input
            {...register("duracionMinutos", { valueAsNumber: true })}
            type="number"
            className="input-shell w-full"
          />
          <span className="input-shell flex-1">min</span>
        </Campo>
        <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary md:col-start-2">
          Guardar
        </BotonEnviar>
        {/* type="button": vive dentro del form pero no lo envía. */}
        <ConfirmActionButton
          buttonLabel="Eliminar"
          className="button-delete"
          confirmTitle="¿Eliminar esta actividad?"
          confirmMessage="Se quitará de la secuencia de la clase."
          confirmActionType="delete-actividad"
          hiddenFields={{ actividadId: actividad.id, claseDiariaId: claseId, cursoId }}
          successMessage="Actividad eliminada"
          errorMessage="No se pudo eliminar la actividad"
        />
        <ErrorGeneral mensaje={errors.root?.message} />
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-4 space-y-2 border border-slate-200 bg-slate-50 p-3"
    >
      <p className="text-sm font-semibold text-slate-900 sm:text-base">Agregar actividad</p>
      {/* El buscador ocupa toda la fila: el panel de filtros necesita el ancho. */}
      <Campo error={errors.juegoId?.message}>{buscadorJuego}</Campo>
      <div className="flex flex-wrap justify-end gap-2">
        <Campo error={errors.tipoBloque?.message} className="w-full sm:w-auto">
          {selectTipoBloque}
        </Campo>
        <Campo error={errors.duracionMinutos?.message} className="w-30 flex items-center">
          <input
            {...register("duracionMinutos", { valueAsNumber: true })}
            type="number"
            className="input-shell w-full"
          />
          <span className="input-shell flex-1">min</span>
        </Campo>
        <BotonEnviar enviando={isSubmitting} textoEnviando="Agregando..." className="button-primary flex-1 md:flex-0">
          Agregar
        </BotonEnviar>
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />
    </form>
  );
}
