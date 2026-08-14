"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import ActividadItem, { type ActividadListada } from "@/components/clase/ActividadItem";
import type { JuegoOpcion } from "@/components/clase/ActividadForm";
import { reordenarActividades } from "@/lib/actions/clases.actions";

/**
 * La secuencia de la clase se arma arrastrando: al soltar se guarda el orden
 * 1..n completo, así nunca hay que pasar por un número intermedio libre.
 */
export default function ActividadesLista({
  claseId,
  cursoId,
  unidadDidacticaId,
  juegos,
  actividades,
}: {
  claseId: string;
  cursoId: string;
  unidadDidacticaId: string;
  juegos: JuegoOpcion[];
  actividades: ActividadListada[];
}) {
  const router = useRouter();
  const [, iniciarGuardado] = useTransition();
  const [items, setItems] = useState(actividades);

  // El orden se mueve en el cliente antes de que responda el servidor, así que
  // hay que volver a tomar la lista cuando el servidor manda una distinta
  // (se agregó, se eliminó o se editó una actividad).
  const claveServidor = actividades.map((a) => a.id).join("|");
  const [claveVista, setClaveVista] = useState(claveServidor);
  if (claveServidor !== claveVista) {
    setClaveVista(claveServidor);
    setItems(actividades);
  }

  const sensores = useSensors(
    // Sin la distancia mínima, un toque para abrir el formulario se
    // interpretaría como el inicio de un arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const desde = items.findIndex((a) => a.id === active.id);
    const hasta = items.findIndex((a) => a.id === over.id);
    if (desde === -1 || hasta === -1) return;

    const previos = items;
    const reordenados = arrayMove(items, desde, hasta);
    setItems(reordenados);

    iniciarGuardado(async () => {
      try {
        const resultado = await reordenarActividades(
          claseId,
          cursoId,
          reordenados.map((a) => a.id)
        );

        if (!resultado.ok) {
          setItems(previos);
          toast.error(resultado.error);
          return;
        }

        router.refresh();
      } catch (error) {
        unstable_rethrow(error);
        setItems(previos);
        toast.error("No se pudo guardar el nuevo orden");
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Todavía no hay actividades cargadas.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={alSoltar}
    >
      <SortableContext items={items.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((actividad, indice) => (
            <ActividadItem
              key={actividad.id}
              posicion={indice + 1}
              claseId={claseId}
              cursoId={cursoId}
              unidadDidacticaId={unidadDidacticaId}
              juegos={juegos}
              actividad={actividad}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
