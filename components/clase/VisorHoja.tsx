"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * El visor de la hoja del plan: muestra la A4 entera, con las mismas
 * proporciones que va a tener el archivo, achicada hasta que entre en la
 * pantalla.
 *
 * Antes la hoja se reacomodaba en el celular (la ficha a dos columnas, las
 * cajas una debajo de otra) y la tabla del desarrollo de la clase, que tiene
 * cuatro columnas fijas, quedaba ilegible. Escalar en vez de reacomodar hace
 * que la vista previa se parezca a lo que sale impreso, que es para lo que
 * está. Como el achique es `zoom` sobre el DOM y no una imagen, el texto sigue
 * siendo vectorial: al agrandar con los dedos se ve nítido.
 *
 * El botón flotante alterna entre "entra toda la hoja" y tamaño real (con
 * desplazamiento horizontal), y sólo aparece cuando la hoja no entra sola.
 */

/** Ancho de una A4 en píxeles CSS: el milímetro siempre vale 96/25.4 px. */
const ANCHO_A4 = (210 * 96) / 25.4;

export default function VisorHoja({ children }: { children: ReactNode }) {
  const visor = useRef<HTMLDivElement>(null);
  // `null` hasta medir: mientras tanto manda el valor aproximado que pone
  // `plan.css` por media query, así el servidor no manda una hoja desbordada.
  const [ajuste, setAjuste] = useState<number | null>(null);
  const [tamanoReal, setTamanoReal] = useState(false);

  useLayoutEffect(() => {
    const elemento = visor.current;
    if (!elemento) return;

    // Nunca agranda la hoja: como mucho la deja en su tamaño real.
    const medir = () => setAjuste(Math.min(1, elemento.clientWidth / ANCHO_A4));

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const zoom = tamanoReal ? 1 : ajuste;
  const noEntra = ajuste !== null && ajuste < 1;

  return (
    <div
      ref={visor}
      className="plan-visor"
      style={zoom === null ? undefined : ({ "--plan-zoom": zoom } as CSSProperties)}
    >
      {children}

      {noEntra && (
        <button
          type="button"
          className="plan-zoom no-imprimir"
          onClick={() => setTamanoReal((actual) => !actual)}
          aria-pressed={tamanoReal}
        >
          {tamanoReal ? (
            <>
              <Minimize2 className="h-4 w-4" />
              Ver hoja entera
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              Ver en tamaño real
            </>
          )}
        </button>
      )}
    </div>
  );
}
