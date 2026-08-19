"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { agregarAlumno } from "@/lib/actions/curso.actions";
import { alumnoSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import Disclosure from "@/components/ui/Disclosure";

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
    <Disclosure
      titulo="Agregar alumno"
      icono={UserPlus}
      tono="accion"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="mt-3"
    >
      {open && (
        <form onSubmit={onSubmit} noValidate className="grid gap-3 pt-1 sm:grid-cols-2">
          <Campo label="Nombre" error={errors.nombre?.message}>
            <input {...register("nombre")} placeholder="Ej: Juan" className="input-shell" />
          </Campo>
          <Campo label="Apellido" error={errors.apellido?.message}>
            <input {...register("apellido")} placeholder="Ej: Perez" className="input-shell" />
          </Campo>
          <Campo
            label="Contacto de emergencia"
            error={errors.contactoEmergencia?.message}
            className="sm:col-span-2"
          >
            <input
              {...register("contactoEmergencia")}
              placeholder="Padre, madre o tutor"
              className="input-shell"
            />
          </Campo>

          <div className="space-y-2 sm:col-span-2">
            <ErrorGeneral mensaje={errors.root?.message} />
            <BotonEnviar
              enviando={isSubmitting}
              textoEnviando="Agregando..."
              className="button-primary w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              Agregar alumno
            </BotonEnviar>
          </div>
        </form>
      )}
    </Disclosure>
  );
}
