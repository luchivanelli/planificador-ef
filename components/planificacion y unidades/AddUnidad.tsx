"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus2 } from "lucide-react";
import BackLink from "@/components/BackLink";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import { AYUDA_LISTA } from "@/lib/form/ayudas";
import { unidadDidacticaSchema } from "@/lib/schemas/planificacion.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { crearUnidadDidactica } from "@/lib/actions/unidadDidactica.actions";

type Props = {
  cursoId: string;
  planificacionId: string;
  planificacion: {
    id: string;
    anio: number;
    curso: {
      nombre: string;
    };
  };
};

export default function AddUnidadForm({ planificacionId, cursoId, planificacion }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(unidadDidacticaSchema),
    defaultValues: { titulo: "", objetivo: "", fechaInicio: "", fechaFin: "" },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => crearUnidadDidactica(planificacionId, cursoId, datos),
      onExito: (_data, redirectTo) => router.push(redirectTo ?? `/cursos/${cursoId}`),
    })
  );

  return (
    <div className="mx-auto max-w-xl">
      <section className="surface-card p-5 sm:p-6">
        <BackLink href={`/cursos/${cursoId}`} title="Volver al curso" />
        <div className="mb-4 flex items-start gap-4 sm:items-center">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <FilePlus2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Nueva unidad didáctica</h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Crea una unidad para el curso {planificacion.curso.nombre}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <Campo label="Título" error={errors.titulo?.message}>
            <input
              {...register("titulo")}
              placeholder="Ej. Unidad de deportes de conjunto"
              className="input-shell"
            />
          </Campo>
          <Campo label="Objetivos" error={errors.objetivo?.message} hint={AYUDA_LISTA}>
            <TextareaLista control={control} name="objetivo" className="input-shell min-h-[92px] w-full" />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Fecha de inicio" error={errors.fechaInicio?.message}>
              <input {...register("fechaInicio")} type="date" className="input-shell pl-9" />
            </Campo>
            <Campo label="Fecha de fin" error={errors.fechaFin?.message}>
              <input {...register("fechaFin")} type="date" className="input-shell pl-9" />
            </Campo>
          </div>

          <BotonEnviar enviando={isSubmitting} textoEnviando="Creando..." className="button-primary w-full">
            Crear unidad didáctica
          </BotonEnviar>

          <ErrorGeneral mensaje={errors.root?.message} />
        </form>
      </section>
    </div>
  );
}
