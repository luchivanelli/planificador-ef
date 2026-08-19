"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import { AYUDA_LISTA } from "@/lib/form/ayudas";
import { diagnosticoGrupalSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { guardarDiagnosticoGrupal } from "@/lib/actions/curso.actions";

export default function DiagnosticoGrupalForm({
  cursoId,
  diagnosticoGrupal,
}: {
  cursoId: string;
  diagnosticoGrupal: string | null;
}) {
  const router = useRouter();
  const {
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(diagnosticoGrupalSchema),
    defaultValues: { diagnosticoGrupal: diagnosticoGrupal ?? "" },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => guardarDiagnosticoGrupal(cursoId, datos),
      errorInesperado: "No se pudo guardar el diagnóstico",
      onExito: () => {
        toast.success("Diagnóstico guardado");
        router.refresh();
      },
    })
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-3">
      <Campo error={errors.diagnosticoGrupal?.message} hint={AYUDA_LISTA}>
        <TextareaLista
          control={control}
          name="diagnosticoGrupal"
          rows={3}
          className="input-shell min-h-28"
        />
      </Campo>

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex justify-end border-t border-linea pt-3">
        <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
          Guardar
        </BotonEnviar>
      </div>
    </form>
  );
}
