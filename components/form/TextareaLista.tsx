"use client";

import { useLayoutEffect, useRef } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent, SyntheticEvent } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { normalizarLista } from "@/lib/schemas/common";

/**
 * Textarea para los campos que son una lista (objetivos, temas, contenidos).
 *
 * La viñeta es sólo presentación: en el formulario y en la base viaja una línea
 * por ítem, sin ningún marcador. Se agrega al pintar y se saca al leer, así el
 * texto guardado sigue siendo el mismo de siempre y las vistas viejas no se
 * rompen.
 */
const VINETA = "• ";
const VINETA_INICIAL = /^[ \t]*•[ \t]?/;

/** Lo guardado, a partir de lo que se ve. */
function sinVinetas(visible: string) {
  return visible
    .split("\n")
    .map((linea) => linea.replace(VINETA_INICIAL, ""))
    .join("\n");
}

/** Lo que se ve, a partir de lo guardado. Vacío muestra igual una viñeta suelta. */
function conVinetas(valor: string) {
  const lineas = valor === "" ? [""] : valor.split("\n");
  return lineas.map((linea) => VINETA + linea).join("\n");
}

export default function TextareaLista<T extends FieldValues>({
  control,
  name,
  rows = 2,
  className = "input-shell w-full",
}: {
  control: Control<T>;
  name: FieldPath<T>;
  rows?: number;
  className?: string;
}) {
  const { field } = useController({ control, name });
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  // Cuando el handler reescribe el texto, el cursor hay que reubicarlo recién
  // después de que React pinte el valor nuevo.
  const cursorPendiente = useRef<number | null>(null);

  const valor = typeof field.value === "string" ? field.value : "";
  const visible = conVinetas(valor);

  useLayoutEffect(() => {
    if (cursorPendiente.current === null) return;
    textarea.current?.setSelectionRange(cursorPendiente.current, cursorPendiente.current);
    cursorPendiente.current = null;
  });

  const aplicar = (nuevoVisible: string, cursor: number) => {
    cursorPendiente.current = cursor;
    field.onChange(sinVinetas(nuevoVisible));
  };

  const alEscribir = (evento: ChangeEvent<HTMLTextAreaElement>) => {
    const bruto = evento.currentTarget.value;
    const guardado = sinVinetas(bruto);
    // Si lo que se va a repintar no coincide con lo tipeado (por ejemplo se
    // borró todo y la viñeta vuelve sola) el cursor se corre otro tanto.
    const desplazamiento = conVinetas(guardado).length - bruto.length;
    if (desplazamiento !== 0) {
      cursorPendiente.current = (evento.currentTarget.selectionStart ?? 0) + desplazamiento;
    }
    field.onChange(guardado);
  };

  const alTeclear = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd, value } = evento.currentTarget;

    // Enter cierra el ítem y abre el siguiente ya con su viñeta.
    if (evento.key === "Enter") {
      evento.preventDefault();
      aplicar(
        value.slice(0, selectionStart) + "\n" + VINETA + value.slice(selectionEnd),
        selectionStart + 1 + VINETA.length
      );
      return;
    }

    // La viñeta no se borra letra por letra: Backspace sobre ella junta el ítem
    // con el de arriba, como en cualquier editor de listas.
    if (evento.key === "Backspace" && selectionStart === selectionEnd) {
      const inicioLinea = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const sobreLaVineta =
        selectionStart > inicioLinea && selectionStart <= inicioLinea + VINETA.length;
      if (!sobreLaVineta) return;

      evento.preventDefault();
      // El primer ítem no tiene con qué juntarse: su viñeta queda fija.
      if (inicioLinea === 0) return;
      aplicar(
        value.slice(0, inicioLinea - 1) + value.slice(inicioLinea + VINETA.length),
        inicioLinea - 1
      );
    }
  };

  /** Pegar una lista entera reparte cada línea como un ítem. */
  const alPegar = (evento: ClipboardEvent<HTMLTextAreaElement>) => {
    const pegado = evento.clipboardData.getData("text");
    // De una sola línea se encarga el navegador.
    if (!/[\r\n]/.test(pegado)) return;

    evento.preventDefault();
    const { selectionStart, selectionEnd, value } = evento.currentTarget;
    const items = normalizarLista(pegado.replace(/\r\n?/g, "\n")).split("\n").join("\n" + VINETA);
    aplicar(
      value.slice(0, selectionStart) + items + value.slice(selectionEnd),
      selectionStart + items.length
    );
  };

  /**
   * El cursor nunca queda dentro de la viñeta: se corre al arranque del texto
   * del ítem. Si no, escribir ahí intercala una viñeta en medio de la línea.
   */
  const alMoverCursor = (evento: SyntheticEvent<HTMLTextAreaElement>) => {
    const el = evento.currentTarget;
    if (el.selectionStart !== el.selectionEnd) return;

    const inicioLinea = el.value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const minimo = inicioLinea + VINETA.length;
    if (el.selectionStart < minimo) el.setSelectionRange(minimo, minimo);
  };

  /** Al salir se descartan los ítems que quedaron vacíos. */
  const alSalir = () => {
    const limpio = normalizarLista(valor);
    if (limpio !== valor) field.onChange(limpio);
    field.onBlur();
  };

  return (
    <textarea
      ref={(elemento) => {
        textarea.current = elemento;
        field.ref(elemento);
      }}
      name={field.name}
      value={visible}
      // Crece con la lista: `input-shell` no deja redimensionar a mano.
      rows={Math.max(rows, visible.split("\n").length)}
      className={className}
      onChange={alEscribir}
      onKeyDown={alTeclear}
      onPaste={alPegar}
      onSelect={alMoverCursor}
      onBlur={alSalir}
    />
  );
}
