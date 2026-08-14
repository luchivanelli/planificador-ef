"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { guardarObservacionesMedicas } from "@/lib/actions/curso.actions";
import { observacionesMedicasSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";

export default function ObservacionMedicaForm({
  alumno,
  cursoId,
  onCerrar,
}: {
  alumno: { id: string; nombre: string; apellido: string; observacionesMedicas?: string | null };
  cursoId: string;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(observacionesMedicasSchema),
    defaultValues: { observacionesMedicas: alumno.observacionesMedicas ?? "" },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => guardarObservacionesMedicas(alumno.id, cursoId, datos),
      errorInesperado: "No se pudo guardar la observación",
      onExito: () => {
        toast.success("Observación guardada");
        onCerrar();
        router.refresh();
      },
    })
  );

  return (
    <div className="surface-card border border-slate-200 bg-slate-50 p-4 mb-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm sm:text-base font-semibold text-slate-900">Observación médica</p>
          <p className="text-xs sm:text-sm text-slate-500">
            Agrega o actualiza una observación para este alumno:{" "}
            <span className="text-[#0f63ff]">
              {alumno.nombre} {alumno.apellido}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="grid gap-3">
        <Campo error={errors.observacionesMedicas?.message}>
          <textarea
            {...register("observacionesMedicas")}
            placeholder="Escribí una observación médica"
            className="input-shell min-h-[100px] resize-vertical w-full"
          />
        </Campo>

        <ErrorGeneral mensaje={errors.root?.message} />

        <div className="flex flex-wrap gap-2 justify-end">
          <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
            Guardar
          </BotonEnviar>
          <button type="button" className="button-secondary" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
