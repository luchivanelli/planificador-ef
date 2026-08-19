"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import { juegoSchema, type JuegoInput } from "@/lib/schemas/juego.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { actualizarJuego, crearJuego } from "@/lib/actions/juego.actions";
import { CATEGORIAS, ESTRATEGIAS, RANGOS } from "@/lib/types";
import ConfirmActionButton from "@/components/ConfirmActionButton";

export type JuegoEditable = {
  id: string;
  nombre: string;
  descripcion: string | null;
  rangoEtario: JuegoInput["rangoEtario"];
  categoria: JuegoInput["categoria"];
  estrategia: JuegoInput["estrategia"];
  materiales: string[];
};

const VALORES_NUEVOS = {
  nombre: "",
  descripcion: "",
  rangoEtario: RANGOS[0].value,
  categoria: CATEGORIAS[0].value,
  estrategia: ESTRATEGIAS[0].value,
  materiales: "",
};

export default function JuegoForm({
  juego,
  onGuardado,
  onCancelar,
}: {
  juego?: JuegoEditable;
  /** Avisa que se guardó, para que quien lo envuelva pueda cerrar el panel. */
  onGuardado?: () => void;
  onCancelar?: () => void;
}) {
  const router = useRouter();
  const esEdicion = Boolean(juego);
  const formId = `juego-form-${juego?.id ?? "nuevo"}`;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(juegoSchema),
    defaultValues: juego
      ? {
          nombre: juego.nombre,
          descripcion: juego.descripcion ?? "",
          rangoEtario: juego.rangoEtario,
          categoria: juego.categoria,
          estrategia: juego.estrategia,
          materiales: juego.materiales.join(", "),
        }
      : VALORES_NUEVOS,
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => (juego ? actualizarJuego(juego.id, datos) : crearJuego(datos)),
      errorInesperado: "No se pudo guardar el juego",
      onExito: (_data, redirectTo) => {
        if (esEdicion) toast.success("Juego actualizado");
        else reset(VALORES_NUEVOS);
        if (redirectTo) router.push(redirectTo);
        // Al editar, el panel lo controla quien envuelve al form (`JuegoItem` lo
        // cierra con estado de React). Al crear, el `<details>` es del server
        // component y sólo se puede cerrar por DOM.
        if (onGuardado) onGuardado();
        else cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4 pt-1">
      <Campo label="Nombre del juego" error={errors.nombre?.message}>
        <input {...register("nombre")} placeholder="Ej. Los diez pases" className="input-shell" />
      </Campo>
      <Campo label="Descripción" error={errors.descripcion?.message}>
        <textarea
          {...register("descripcion")}
          placeholder="Cómo se juega, cuántos participan, variantes..."
          rows={4}
          className="input-shell"
        />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Rango etario" error={errors.rangoEtario?.message}>
          <select {...register("rangoEtario")} className="input-shell">
            {RANGOS.map((rango) => (
              <option key={rango.value} value={rango.value}>
                {rango.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Categoría" error={errors.categoria?.message}>
          <select {...register("categoria")} className="input-shell">
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Estrategia" error={errors.estrategia?.message}>
          <select {...register("estrategia")} className="input-shell">
            {ESTRATEGIAS.map((estrategia) => (
              <option key={estrategia.value} value={estrategia.value}>
                {estrategia.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          label="Materiales"
          error={errors.materiales?.message}
          hint="Separalos con comas: conos, pelotas, aros."
        >
          <input {...register("materiales")} placeholder="Conos, pelotas" className="input-shell" />
        </Campo>
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex flex-wrap justify-end gap-2 border-t border-linea pt-3">
        <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
          {esEdicion ? (
            "Guardar"
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Guardar juego
            </>
          )}
        </BotonEnviar>
        {/* Sólo al editar: un juego que todavía no existe no se puede eliminar.
            `type="button"`, así que vive dentro del form sin enviarlo. */}
        {juego && (
          <ConfirmActionButton
            buttonLabel="Eliminar"
            className="button-delete"
            confirmTitle={`¿Eliminar “${juego.nombre}”?`}
            confirmMessage="Esta acción quitará el juego del banco y se eliminará de las actividades que lo usen."
            confirmActionType="delete-juego"
            hiddenFields={{ juegoId: juego.id }}
            successMessage="Juego eliminado"
            errorMessage="No se pudo eliminar el juego"
          />
        )}
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="button-secondary">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
