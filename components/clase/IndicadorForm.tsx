"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import { indicadorSchema } from "@/lib/schemas/indicador.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { crearIndicador } from "@/lib/actions/indicador.actions";

const VALORES_INICIALES = { titulo: "" };

export default function IndicadorForm({ cursoId, claseId }: { cursoId: string; claseId: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(indicadorSchema),
    defaultValues: VALORES_INICIALES,
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => crearIndicador(cursoId, claseId, datos),
      errorInesperado: "No se pudo crear el indicador",
      onExito: () => {
        toast.success("Indicador creado");
        reset(VALORES_INICIALES);
        router.refresh();
      },
    })
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2 py-2">
      <Campo error={errors.titulo?.message}>
        <input
          {...register("titulo")}
          placeholder="Ej. Respetaron las reglas del juego"
          className="input-shell w-full"
        />
      </Campo>
      <ErrorGeneral mensaje={errors.root?.message} />
      <div className="flex justify-end">
        <BotonEnviar enviando={isSubmitting} textoEnviando="Creando..." className="button-primary">
          Crear indicador
        </BotonEnviar>
      </div>
    </form>
  );
}
