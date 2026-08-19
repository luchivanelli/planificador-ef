import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Tarjeta de sección: el bloque con el que está armada casi toda la app.
 *
 * Antes cada página repetía a mano el cuadradito con el ícono, el título y el
 * subtítulo (y cada copia se iba desviando un poco). Acá vive una sola vez, así
 * todas las secciones respiran igual en celular y en escritorio.
 */
export default function SectionCard({
  icono: Icono,
  titulo,
  subtitulo,
  accion,
  destacada = false,
  className = "",
  cuerpoClassName = "",
  children,
}: {
  icono?: LucideIcon;
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  /** Botón o link alineado a la derecha del encabezado. */
  accion?: ReactNode;
  /** Suma la barra de color superior, para la sección principal de la página. */
  destacada?: boolean;
  className?: string;
  cuerpoClassName?: string;
  children?: ReactNode;
}) {
  const tieneEncabezado = Boolean(Icono || titulo || subtitulo || accion);

  return (
    <section
      className={`${destacada ? "card-destacada" : "card"} p-4 sm:p-6 ${className}`}
    >
      {tieneEncabezado && (
        <header className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap sm:items-center">
          <div className="flex min-w-0 items-start gap-3">
            {Icono && (
              <span className="icono-seccion">
                <Icono className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              {titulo && <h2 className="card-title">{titulo}</h2>}
              {subtitulo && <p className="card-subtitle mt-0.5">{subtitulo}</p>}
            </div>
          </div>
          {accion && <div className="flex shrink-0 items-center gap-2">{accion}</div>}
        </header>
      )}
      <div className={`${tieneEncabezado ? "mt-4 sm:mt-5" : ""} ${cuerpoClassName}`}>{children}</div>
    </section>
  );
}
