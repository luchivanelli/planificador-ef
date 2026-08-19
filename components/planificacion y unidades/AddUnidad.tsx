"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus2 } from "lucide-react";
import BackLink from "@/components/BackLink";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import TextareaLista from "@/components/form/TextareaLista";
import SectionCard from "@/components/ui/SectionCard";
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
    <div className="mx-auto max-w-2xl">
      <BackLink href={`/cursos/${cursoId}`} title="Volver al curso" />

      <SectionCard
        destacada
        icono={FilePlus2}
        titulo="Nueva unidad didáctica"
        subtitulo={`Curso ${planificacion.curso.nombre} · planificación ${planificacion.anio}`}
      >
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Campo label="Título" error={errors.titulo?.message}>
            <input
              {...register("titulo")}
              placeholder="Ej. Unidad de deportes de conjunto"
              className="input-shell"
            />
          </Campo>

          <Campo label="Objetivos" error={errors.objetivo?.message} hint={AYUDA_LISTA}>
            <TextareaLista control={control} name="objetivo" className="input-shell min-h-24" />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Fecha de inicio" error={errors.fechaInicio?.message}>
              <input {...register("fechaInicio")} type="date" className="input-shell" />
            </Campo>
            <Campo label="Fecha de fin" error={errors.fechaFin?.message}>
              <input {...register("fechaFin")} type="date" className="input-shell" />
            </Campo>
          </div>

          <ErrorGeneral mensaje={errors.root?.message} />

          <div className="flex flex-col-reverse gap-2 border-t border-linea pt-4 sm:flex-row sm:justify-end">
            <Link href={`/cursos/${cursoId}`} className="button-secondary">
              Cancelar
            </Link>
            <BotonEnviar
              enviando={isSubmitting}
              textoEnviando="Creando..."
              className="button-primary"
            >
              <FilePlus2 className="h-4 w-4" />
              Crear unidad didáctica
            </BotonEnviar>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
