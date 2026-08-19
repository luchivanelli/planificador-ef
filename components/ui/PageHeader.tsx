import type { ReactNode } from "react";
import BackLink from "@/components/BackLink";

/**
 * Encabezado de página: link para volver, título, subtítulo y acciones.
 * Todas las pantallas arrancan igual, así la docente siempre encuentra el
 * "volver" y el título en el mismo lugar.
 */
export default function PageHeader({
  titulo,
  subtitulo,
  volverA,
  volverTitulo,
  etiquetas,
  acciones,
  children,
  className = "",
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  volverA?: string;
  volverTitulo?: string;
  /** Píldoras informativas debajo del título (nivel, turno, horario...). */
  etiquetas?: ReactNode;
  acciones?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-destacada p-4 sm:p-6 ${className}`}>
      {volverA && <BackLink href={volverA} title={volverTitulo ?? "Volver"} />}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="page-title">{titulo}</h1>
          {subtitulo && <p className="page-subtitle">{subtitulo}</p>}
          {etiquetas && <div className="flex flex-wrap items-center gap-2 pt-0.5">{etiquetas}</div>}
        </div>
        {acciones && (
          <div className="flex flex-wrap items-center gap-2 md:justify-end">{acciones}</div>
        )}
      </div>
      {children}
    </section>
  );
}
