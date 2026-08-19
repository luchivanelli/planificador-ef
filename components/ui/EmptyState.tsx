import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Recuadro punteado para cuando una lista todavía no tiene nada. */
export default function EmptyState({
  icono: Icono,
  titulo,
  descripcion,
  accion,
  className = "",
}: {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`vacio flex flex-col items-center gap-2 px-4 py-8 ${className}`}>
      {Icono && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <Icono className="h-5 w-5" />
        </span>
      )}
      <p className="text-sm font-semibold text-ink-700 sm:text-base">{titulo}</p>
      {descripcion && <p className="max-w-md text-xs text-ink-500 sm:text-sm">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
