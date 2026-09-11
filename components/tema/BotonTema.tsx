"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { MODOS, type ModoTema } from "@/lib/tema";
import { useTema } from "./useTema";

const INFO: Record<ModoTema, { icono: typeof Sun; etiqueta: string }> = {
  sistema: { icono: Monitor, etiqueta: "Automático" },
  claro: { icono: Sun, etiqueta: "Claro" },
  oscuro: { icono: Moon, etiqueta: "Oscuro" },
};

/**
 * Un solo botón que va rotando entre los tres modos: automático (lo que diga
 * el celular o la compu), claro y oscuro. Se prefirió el ciclo a un menú
 * desplegable porque en el celular vive en la barra de arriba, donde no sobra
 * espacio, y porque son sólo tres opciones.
 *
 * - `variante="icono"`: cuadradito para la barra superior del celular.
 * - `variante="fila"`: fila con etiqueta para el menú lateral de escritorio.
 */
export default function BotonTema({ variante = "icono" }: { variante?: "icono" | "fila" }) {
  const { modo, cambiarModo } = useTema();

  const siguiente = MODOS[(MODOS.indexOf(modo) + 1) % MODOS.length];
  const { icono: Icono, etiqueta } = INFO[modo];
  const titulo = `Tema: ${etiqueta}. Tocá para pasar a ${INFO[siguiente].etiqueta.toLowerCase()}.`;

  if (variante === "fila") {
    return (
      <button
        type="button"
        onClick={() => cambiarModo(siguiente)}
        title={titulo}
        aria-label={titulo}
        className="group flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
      >
        <Icono className="h-5 w-5 text-ink-400 transition group-hover:text-brand-600" />
        Tema
        <span className="ml-auto text-xs font-semibold text-ink-400 group-hover:text-brand-600">
          {etiqueta}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => cambiarModo(siguiente)}
      title={titulo}
      aria-label={titulo}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-linea bg-superficie text-ink-600 transition active:bg-ink-100"
    >
      <Icono className="h-4 w-4" />
    </button>
  );
}
