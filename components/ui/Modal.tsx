"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * El diálogo de la app: el recuadro centrado con el fondo oscurecido.
 *
 * Va por portal a `document.body` para que quede centrado en la pantalla y no
 * lo recorte ninguna tarjeta con `transform` u `overflow`. Se cierra con
 * Escape, tocando el fondo, o desde los botones que ponga quien lo usa: el
 * contenido es suyo, acá sólo está la caja y el comportamiento.
 *
 * Quien lo usa decide cuándo existe: se monta sólo mientras está abierto.
 */
export default function Modal({
  etiqueta,
  onCerrar,
  children,
}: {
  /** Qué es este diálogo, para quien lo escucha con un lector de pantalla. */
  etiqueta: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  // El callback se guarda en una ref para que el efecto de abajo corra una sola
  // vez: si dependiera de `onCerrar` y quien lo usa pasa una función nueva en
  // cada render, se volvería a ejecutar y guardaría "hidden" como el overflow
  // previo, dejando la página sin scroll para siempre al cerrar.
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });

  const foco = useRef<HTMLElement | null>(null);

  useEffect(() => {
    foco.current = document.activeElement as HTMLElement | null;

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrar.current();
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", alTeclear);

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", alTeclear);
      // Al cerrar, el foco vuelve al botón que lo abrió: si no queda suelto en
      // el `<body>` y con el teclado hay que recorrer la página de nuevo.
      foco.current?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={etiqueta}
      // `no-imprimir` es por la vista previa del plan de clase: el diálogo
      // cuelga del `<body>`, fuera de la barra que `@media print` apaga, y sin
      // esto saldría encima de la hoja si alguien imprime con él abierto.
      className="no-imprimir fixed inset-0 z-100 flex items-end justify-center bg-ink-900/50 p-4 backdrop-blur-sm dark:bg-black/65 sm:items-center"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) cerrar.current();
      }}
    >
      <div className="animar-entrada card w-full max-w-md overflow-hidden p-5 shadow-pop">
        {children}
      </div>
    </div>,
    document.body
  );
}
