"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { actualizarAlumno } from "@/lib/actions/curso.actions";
import { alumnoSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import ConfirmActionButton from "@/components/ConfirmActionButton";

export type AlumnoEditable = {
  id: string;
  nombre: string;
  apellido: string;
  contactoEmergencia?: string | null;
};

export default function EditarAlumnoForm({
  alumno,
  cursoId,
  onCerrar,
  onEliminado,
}: {
  alumno: AlumnoEditable;
  cursoId: string;
  onCerrar: () => void;
  onEliminado: () => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(alumnoSchema),
    defaultValues: {
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      contactoEmergencia: alumno.contactoEmergencia ?? "",
    },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => actualizarAlumno(alumno.id, cursoId, datos),
      errorInesperado: "No se pudo actualizar el alumno",
      onExito: () => {
        toast.success("Alumno actualizado");
        onCerrar();
        router.refresh();
      },
    })
  );

  return (
    <div className="surface-card border border-slate-200 bg-slate-50 p-4 mb-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm sm:text-base font-semibold text-slate-900">Editar alumno</p>
          <p className="text-xs sm:text-sm text-slate-500">Edita la información del alumno: <strong className="text-[#0f63ff] font-normal">{alumno.nombre} {alumno.apellido}</strong></p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="grid gap-3">
        <Campo label="Nombre" error={errors.nombre?.message} className="col-span-2 lg:col-span-1">
          <input {...register("nombre")} placeholder="Ej: Juan" className="input-shell w-full" />
        </Campo>
        <Campo label="Apellido" error={errors.apellido?.message} className="col-span-2 lg:col-span-1">
          <input {...register("apellido")} placeholder="Ej: Perez" className="input-shell w-full" />
        </Campo>
        <Campo label="Contacto de emergencia" error={errors.contactoEmergencia?.message} className="col-span-2 lg:col-span-1">
          <input
            {...register("contactoEmergencia")}
            placeholder="Padre, madre o tutor"
            className="input-shell w-full"
          />
        </Campo>

        <ErrorGeneral mensaje={errors.root?.message} />

        <div className="flex flex-wrap gap-2 col-span-2 mt-2 justify-end">
          <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
            Guardar
          </BotonEnviar>
          <ConfirmActionButton
            buttonLabel="Eliminar"
            className="button-delete"
            confirmTitle={`¿Eliminar “${alumno.nombre} ${alumno.apellido}”?`}
            confirmMessage="Esta acción eliminará al alumno y sus datos asociados del curso."
            confirmActionType="delete-alumno"
            hiddenFields={{ alumnoId: alumno.id, cursoId }}
            onSuccess={onEliminado}
            successMessage="Alumno eliminado"
            errorMessage="No se pudo eliminar el alumno"
          />
          <button type="button" className="button-secondary" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
