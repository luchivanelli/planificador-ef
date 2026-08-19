import type { PresentacionClase } from "@/lib/clases/estado";

/**
 * Etiqueta de estado de una clase. Los colores los define
 * `presentacionClase`, que es la única fuente de verdad.
 */
export default function ClaseBadge({
  presentacion,
  className = "",
}: {
  presentacion: PresentacionClase;
  className?: string;
}) {
  return (
    <span className={`pill ${presentacion.badge} ${className}`}>
      <span aria-hidden="true">{presentacion.icono}</span>
      {presentacion.etiqueta}
    </span>
  );
}
