"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
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
    <div className="animar-entrada rounded-control border border-brand-200 bg-brand-50/50 p-4">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
          <Pencil className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900">Editar alumno</p>
          <p className="text-xs text-ink-500 sm:text-sm">
            Datos de{" "}
            <span className="font-semibold text-brand-700">
              {alumno.nombre} {alumno.apellido}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="grid gap-3 sm:grid-cols-2">
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

        <div className="sm:col-span-2">
          <ErrorGeneral mensaje={errors.root?.message} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
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
