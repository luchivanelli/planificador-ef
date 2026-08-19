"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { unstable_rethrow, useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
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
  const [abierto, setAbierto] = useState(false);


  // Escape cierra, y mientras está abierto la página de atrás no scrollea.
  useEffect(() => {
    if (!abierto) return;

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", alTeclear);

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  const confirmar = () => {
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

        setAbierto(false);
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

        setAbierto(false);
        toast.error(error instanceof Error ? error.message : errorMessage);
      }
    });
  };

  /**
   * El diálogo va por portal a `document.body`: así queda centrado en la
   * pantalla y no lo recorta ninguna tarjeta con `transform` u `overflow`.
   * Antes esto era un toast en una esquina, fácil de perder de vista.
   */
  const dialogo = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={confirmTitle}
      className="fixed inset-0 z-100 flex items-end justify-center bg-ink-900/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) setAbierto(false);
      }}
    >
      <div className="animar-entrada card w-full max-w-md overflow-hidden p-5 shadow-pop">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink-900">{confirmTitle}</p>
            <p className="mt-1 text-sm text-ink-500">{confirmMessage}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setAbierto(false)}
            disabled={isPending}
            className="button-secondary"
          >
            {cancelButtonLabel}
          </button>
          <button type="button" onClick={confirmar} disabled={isPending} className="button-delete">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              confirmButtonLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={isPending}
        className={className}
      >
        {buttonIcon}
        {buttonLabel}
      </button>

      {/* `abierto` sólo se prende desde un click, así que acá ya estamos en el cliente. */}
      {abierto && createPortal(dialogo, document.body)}
    </>
  );
}
