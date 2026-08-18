"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { agregarAlumno } from "@/lib/actions/curso.actions";
import { alumnoSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";

const VALORES_INICIALES = {
  nombre: "",
  apellido: "",
  contactoEmergencia: "",
};

export default function AddAlumnoClient({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(alumnoSchema),
    defaultValues: VALORES_INICIALES,
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => agregarAlumno(cursoId, datos),
      errorInesperado: "Error al agregar alumno",
      onExito: () => {
        toast.success("Alumno agregado");
        reset(VALORES_INICIALES);
        setOpen(false);
        router.refresh();
      },
    })
  );

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="surface-card py-2 px-4"
    >
      <summary className="text-sm sm:text-base font-semibold cursor-pointer text-slate-900">Agregar alumno</summary>
      {open && (
        <form onSubmit={onSubmit} noValidate className="grid gap-2 sm:grid-cols-2 pt-4">
          <Campo label="Nombre" error={errors.nombre?.message} className="col-span-2 lg:col-span-1">
            <input {...register("nombre")} placeholder="Ej: Juan" className="input-shell w-full" />
          </Campo>
          <Campo label="Apellido" error={errors.apellido?.message} className="col-span-2 lg:col-span-1">
            <input {...register("apellido")} placeholder="Ej: Perez" className="input-shell w-full" />
          </Campo>
          <Campo label="Contacto de emergencia" error={errors.contactoEmergencia?.message} className="col-span-2">
            <input
              {...register("contactoEmergencia")}
              placeholder="Padre, madre o tutor"
              className="input-shell w-full"
            />
          </Campo>

          <div className="col-span-2 space-y-2 mt-2">
            <ErrorGeneral mensaje={errors.root?.message} />
            <BotonEnviar enviando={isSubmitting} textoEnviando="Agregando..." className="button-primary w-full">
              Agregar alumno
            </BotonEnviar>
          </div>
        </form>
      )}
    </details>
  );
}
