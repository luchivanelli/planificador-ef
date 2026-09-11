"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
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
import { CATEGORIAS, ESTRATEGIAS, JUEGO_NUEVO, RANGOS, TIPOS_BLOQUE } from "@/lib/types";

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

  /**
   * El bloque de juego nuevo viaja siempre, aunque esté oculto: así los campos
   * tienen valor desde el arranque y no hace falta montarlos para poder guardar.
   * Sólo se usa si el juego elegido es `JUEGO_NUEVO` (lo decide el esquema).
   */
  const juegoNuevoVacio = {
    nombre: "",
    descripcion: "",
    rangoEtario: RANGOS[0].value,
    categoria: CATEGORIAS[0].value,
    estrategia: ESTRATEGIAS[0].value,
    materiales: "",
    guardarEnBanco: false,
  };

  const valoresIniciales: ActividadFormValues = actividad
    ? {
        tipoBloque: actividad.tipoBloque,
        juegoId: actividad.juegoId ?? "",
        juegoNuevo: juegoNuevoVacio,
        duracionMinutos: actividad.duracionMinutos,
      }
    : {
        tipoBloque: "desarrollo" as const,
        juegoId: "",
        juegoNuevo: juegoNuevoVacio,
        duracionMinutos: 10,
      };

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

  // Los mismos campos que el formulario del banco (`JuegoForm`): la docente
  // carga el juego sin salir de la clase y decide si lo guarda para reutilizarlo.
  const camposJuegoNuevo = juegoElegido === JUEGO_NUEVO && (
    <div className="space-y-3 rounded-control border border-brand-200 bg-brand-50/50 p-3">
      <Campo label="Nombre del juego" error={errors.juegoNuevo?.nombre?.message}>
        <input
          {...register("juegoNuevo.nombre")}
          placeholder="Ej. Los diez pases"
          className="input-shell"
        />
      </Campo>
      <Campo label="Descripción" error={errors.juegoNuevo?.descripcion?.message}>
        <textarea
          {...register("juegoNuevo.descripcion")}
          placeholder="Cómo se juega, cuántos participan, variantes..."
          rows={3}
          className="input-shell"
        />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Rango etario" error={errors.juegoNuevo?.rangoEtario?.message}>
          <select {...register("juegoNuevo.rangoEtario")} className="input-shell">
            {RANGOS.map((rango) => (
              <option key={rango.value} value={rango.value}>
                {rango.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Categoría" error={errors.juegoNuevo?.categoria?.message}>
          <select {...register("juegoNuevo.categoria")} className="input-shell">
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Estrategia" error={errors.juegoNuevo?.estrategia?.message}>
          <select {...register("juegoNuevo.estrategia")} className="input-shell">
            {ESTRATEGIAS.map((estrategia) => (
              <option key={estrategia.value} value={estrategia.value}>
                {estrategia.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          label="Materiales"
          error={errors.juegoNuevo?.materiales?.message}
          hint="Separalos con comas: conos, pelotas, aros."
        >
          <input
            {...register("juegoNuevo.materiales")}
            placeholder="Conos, pelotas"
            className="input-shell"
          />
        </Campo>
      </div>
      <label className="option-shell">
        <input type="checkbox" {...register("juegoNuevo.guardarEnBanco")} />
        <span>
          Guardar este juego en el banco
          <span className="block text-xs font-normal text-ink-500">
            Sin tildar, el juego queda sólo en esta clase.
          </span>
        </span>
      </label>
    </div>
  );

  const selectTipoBloque = (
    <select {...register("tipoBloque")} className="input-shell">
      {TIPOS_BLOQUE.map((tipo) => (
        <option key={tipo.value} value={tipo.value}>
          {tipo.label}
        </option>
      ))}
    </select>
  );

  /** El "min" va adentro del campo: antes era otra caja al lado y confundía. */
  const campoDuracion = (
    <div className="relative">
      <input
        {...register("duracionMinutos", { valueAsNumber: true })}
        type="number"
        min={1}
        inputMode="numeric"
        className="input-shell pr-12"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400">
        min
      </span>
    </div>
  );

  // Se compara contra `actividad` (y no `esEdicion`) para que TypeScript
  // sepa que el id existe al armar el botón de eliminar.
  if (actividad) {
    return (
      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3 border-t border-linea pt-4">
        {/* El buscador ocupa toda la fila: el panel de filtros necesita el ancho. */}
        <Campo label="Juego" error={errors.juegoId?.message}>
          {buscadorJuego}
        </Campo>
        {camposJuegoNuevo}
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Momento de la clase" error={errors.tipoBloque?.message}>
            {selectTipoBloque}
          </Campo>
          <Campo label="Duración" error={errors.duracionMinutos?.message}>
            {campoDuracion}
          </Campo>
        </div>

        <ErrorGeneral mensaje={errors.root?.message} />

        <div className="flex flex-wrap justify-end gap-2">
          <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
            Guardar cambios
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
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3 pt-1">
      {/* El buscador ocupa toda la fila: el panel de filtros necesita el ancho. */}
      <Campo label="Juego" error={errors.juegoId?.message}>
        {buscadorJuego}
      </Campo>
      {camposJuegoNuevo}
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Momento de la clase" error={errors.tipoBloque?.message}>
          {selectTipoBloque}
        </Campo>
        <Campo label="Duración" error={errors.duracionMinutos?.message}>
          {campoDuracion}
        </Campo>
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />

      <BotonEnviar
        enviando={isSubmitting}
        textoEnviando="Agregando..."
        className="button-primary w-full sm:w-auto"
      >
        <PlusCircle className="h-4 w-4" />
        Agregar actividad
      </BotonEnviar>
    </form>
  );
}
