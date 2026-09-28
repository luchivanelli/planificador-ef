import type { ReactNode } from "react";

/**
 * Lista larga con tope de altura y scroll propio.
 *
 * Un curso de treinta alumnos, o un período con veinte clases evaluadas, hacía
 * una pantalla larguísima en la que había que bajar y bajar para llegar a la
 * sección siguiente. Con esto cada lista ocupa lo suyo y se recorre por dentro.
 *
 * El alto se mide contra la pantalla además de en `rem`: en un celular apaisado
 * un tope de 26rem es más alto que la ventana y no serviría de nada.
 */

const ALTURAS = {
  chica: "max-h-[min(20rem,55vh)]",
  media: "max-h-[min(26rem,60vh)]",
  grande: "max-h-[min(32rem,65vh)]",
} as const;

export default function ListaScroll({
  alto = "media",
  etiqueta,
  className = "",
  children,
}: {
  alto?: keyof typeof ALTURAS;
  /** Para qué es la lista: lo lee el lector de pantalla al entrar al recuadro. */
  etiqueta: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      // Un recuadro con scroll tiene que poder recibir foco: sin esto, con el
      // teclado no hay forma de recorrer una lista cuyos ítems no son links.
      tabIndex={0}
      role="group"
      aria-label={etiqueta}
      // `-mx-1 px-1` deja aire a los costados para que el recorte del scroll no
      // coma la sombra de las tarjetas; `overscroll-contain` evita que al llegar
      // al final se empiece a mover la página de atrás.
      className={`${ALTURAS[alto]} -mx-1 overflow-y-auto overscroll-contain rounded-control px-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${className}`}
    >
      {children}
    </div>
  );
}
