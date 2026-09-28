"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { ListOrdered } from "lucide-react";
import ActividadItem, { type ActividadListada } from "@/components/clase/ActividadItem";
import EmptyState from "@/components/ui/EmptyState";
import type { JuegoOpcion } from "@/components/clase/ActividadForm";
import { reordenarActividades } from "@/lib/actions/clases.actions";

/**
 * La secuencia de la clase se arma arrastrando: al soltar se guarda el orden
 * 1..n completo, así nunca hay que pasar por un número intermedio libre.
 *
 * En pantallas chicas arrastrar con el dedo un asa de 28 px es incómodo, así
 * que ahí la tarjeta muestra flechas de subir/bajar que hacen el mismo
 * movimiento de a un lugar.
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
  const [guardando, iniciarGuardado] = useTransition();
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
    // El táctil necesita su propio sensor: el arrastre arranca con una
    // pulsación sostenida, para que deslizar el dedo siga scrolleando la
    // página en vez de mover la actividad sin querer.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function mover(desde: number, hasta: number) {
    if (desde === hasta || desde < 0 || hasta < 0 || hasta >= items.length) return;

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

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    mover(
      items.findIndex((a) => a.id === active.id),
      items.findIndex((a) => a.id === over.id)
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icono={ListOrdered}
        titulo="Todavía no hay actividades"
        descripcion="Armá la secuencia de la clase: entrada en calor, desarrollo y vuelta a la calma."
      />
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
        <div className="space-y-2.5">
          {items.map((actividad, indice) => (
            <ActividadItem
              key={actividad.id}
              posicion={indice + 1}
              total={items.length}
              claseId={claseId}
              cursoId={cursoId}
              unidadDidacticaId={unidadDidacticaId}
              juegos={juegos}
              actividad={actividad}
              // Mientras viaja un orden al servidor no se acepta otro: dos
              // guardados en paralelo podrían llegar al revés.
              reordenando={guardando}
              onSubir={() => mover(indice, indice - 1)}
              onBajar={() => mover(indice, indice + 1)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
