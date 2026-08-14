"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { renombrarIndicador } from "@/lib/actions/indicador.actions";

/**
 * El título se edita en el lugar. Vive dentro del formulario de valores, así
 * que no puede ser otro `<form>`: guarda llamando a la acción y frena el Enter
 * para que no envíe el formulario que lo contiene.
 */
export default function IndicadorTitulo({
  indicadorId,
  titulo,
  cursoId,
  claseId,
}: {
  indicadorId: string;
  titulo: string;
  cursoId: string;
  claseId: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardando, iniciarGuardado] = useTransition();
  // Al salir con Enter el input se desmonta y el navegador dispara `blur`:
  // sin esta marca, el título se guardaría dos veces.
  const yaCerrado = useRef(false);

  function guardar(nuevo: string) {
    const limpio = nuevo.trim();

    if (!limpio) {
      toast.error("El indicador no puede quedar vacío");
      return;
    }
    if (limpio === titulo) return;

    iniciarGuardado(async () => {
      try {
        const resultado = await renombrarIndicador(indicadorId, cursoId, claseId, {
          titulo: limpio,
        });

        if (!resultado.ok) {
          toast.error(resultado.error);
          return;
        }

        toast.success("Indicador actualizado");
        router.refresh();
      } catch (error) {
        // Deja pasar los errores de control de Next (redirect, notFound).
        unstable_rethrow(error);
        toast.error("No se pudo actualizar el indicador");
      }
    });
  }

  /** `valor` sin definir cierra sin guardar (Escape). */
  function cerrar(valor?: string) {
    if (yaCerrado.current) return;
    yaCerrado.current = true;
    setEditando(false);
    if (valor !== undefined) guardar(valor);
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => {
          yaCerrado.current = false;
          setEditando(true);
        }}
        disabled={guardando}
        title="Editar el nombre del indicador"
        className="group flex items-center gap-2 text-left disabled:opacity-60"
      >
        <span className="text-sm font-medium text-slate-900 sm:text-base">{titulo}</span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-[#0f63ff]" />
      </button>
    );
  }

  return (
    <input
      autoFocus
      defaultValue={titulo}
      aria-label="Nombre del indicador"
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => cerrar(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          cerrar(e.currentTarget.value);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cerrar();
        }
      }}
      className="input-shell w-full sm:w-auto"
    />
  );
}
