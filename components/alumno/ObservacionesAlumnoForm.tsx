"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { guardarObservacionesAlumno } from "@/lib/actions/curso.actions";
import { observacionesAlumnoSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import { AYUDA_LISTA } from "@/lib/form/ayudas";

export default function ObservacionesAlumnoForm({
  alumno,
  cursoId,
  onCerrar,
}: {
  alumno: { id: string; nombre: string; apellido: string; observaciones?: string | null };
  cursoId: string;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const {
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(observacionesAlumnoSchema),
    defaultValues: { observaciones: alumno.observaciones ?? "" },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => guardarObservacionesAlumno(alumno.id, cursoId, datos),
      errorInesperado: "No se pudieron guardar las observaciones",
      onExito: () => {
        toast.success("Observaciones guardadas");
        onCerrar();
        router.refresh();
      },
    })
  );

  return (
    <div className="animar-entrada rounded-control border border-brand-200 bg-brand-50/50 p-4">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900">Seguimiento y observaciones</p>
          <p className="text-xs text-ink-500 sm:text-sm">
            Anotá lo que quieras tener presente de{" "}
            <span className="font-semibold text-brand-700">
              {alumno.nombre} {alumno.apellido}
            </span>
            : desempeño, participación, salud, lo que haga falta.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="grid gap-3">
        <Campo error={errors.observaciones?.message} hint={AYUDA_LISTA}>
          <TextareaLista
            control={control}
            name="observaciones"
            rows={3}
            className="input-shell min-h-28"
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
