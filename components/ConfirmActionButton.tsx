"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminarAlumno } from "@/lib/actions/curso.actions";
import { eliminarJuego } from "@/lib/actions/juego.actions";
import { eliminarPlanificacion } from "@/lib/actions/planificacion.actions";
import { eliminarActividad } from "@/lib/actions/clases.actions";
import { eliminarRubrica } from "@/lib/actions/evaluacion.actions";

type ConfirmActionButtonProps = {
  buttonLabel: string;
  buttonIcon?: ReactNode;
  className?: string;
  confirmTitle: string;
  confirmMessage: string;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  confirmActionType?:
    | "delete-alumno"
    | "delete-juego"
    | "delete-planificacion"
    | "delete-actividad"
    | "delete-rubrica";
  hiddenFields?: Record<string, string>;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
  refreshAfterConfirm?: boolean;
};

export default function ConfirmActionButton({
  buttonLabel,
  buttonIcon,
  className,
  confirmTitle,
  confirmMessage,
  confirmButtonLabel = "Eliminar",
  cancelButtonLabel = "Cancelar",
  confirmActionType,
  hiddenFields,
  onSuccess,
  successMessage,
  errorMessage = "Ocurrió un error al realizar la acción",
  refreshAfterConfirm = true,
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    toast.custom(
      (id) => (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="text-xs sm:text-sm font-semibold text-slate-900">{confirmTitle}</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">{confirmMessage}</p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.dismiss(id)}
              className="button-secondary"
            >
              {cancelButtonLabel}
            </button>

            <button
              type="button"
              onClick={() => {
                toast.dismiss(id);
                startTransition(async () => {
                  try {
                    if (!confirmActionType) {
                      throw new Error("No action provided");
                    }

                    const campos = hiddenFields ?? {};

                    switch (confirmActionType) {
                      case "delete-alumno":
                        if (!campos.alumnoId || !campos.cursoId) {
                          throw new Error("Faltan datos del alumno");
                        }
                        await eliminarAlumno(campos.alumnoId, campos.cursoId);
                        break;
                      case "delete-juego":
                        if (!campos.juegoId) {
                          throw new Error("Falta el id del juego");
                        }
                        await eliminarJuego(campos.juegoId);
                        break;
                      case "delete-planificacion":
                        if (!campos.planificacionId || !campos.cursoId) {
                          throw new Error("Faltan datos de la planificación");
                        }
                        await eliminarPlanificacion(campos.planificacionId, campos.cursoId);
                        break;
                      case "delete-actividad":
                        if (!campos.actividadId || !campos.claseDiariaId || !campos.cursoId) {
                          throw new Error("Faltan datos de la actividad");
                        }
                        await eliminarActividad(campos.actividadId, campos.claseDiariaId, campos.cursoId);
                        break;
                      case "delete-rubrica":
                        if (!campos.rubricaId || !campos.cursoId || !campos.claseId) {
                          throw new Error("Faltan datos de la rúbrica");
                        }
                        await eliminarRubrica(campos.rubricaId, campos.cursoId, campos.claseId);
                        break;
                      default:
                        throw new Error("No action provided");
                    }

                    onSuccess?.();

                    if (refreshAfterConfirm) {
                      router.refresh();
                    }

                    if (successMessage) {
                      toast.success(successMessage);
                    }
                  } catch (error) {
                    // Deja pasar los errores de control de Next (redirect, notFound):
                    // si no, se muestran como un toast rojo con "NEXT_REDIRECT".
                    unstable_rethrow(error);

                    toast.error(
                      error instanceof Error ? error.message : errorMessage,
                    );
                  }
                });
              }}
              className="button-delete"
            >
              {confirmButtonLabel}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "bottom-right",
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {buttonIcon}
      {buttonLabel}
    </button>
  );
}
