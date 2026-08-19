import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Envoltura de un campo: etiqueta, control y mensaje de error de React Hook Form.
 * Centraliza el markup para que los 14 formularios se vean igual.
 */
export function Campo({
  label,
  error,
  hint,
  className,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-rose-600">
          <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
}

/** Error general del formulario (`errors.root`): permisos, duplicados, fallas de red. */
export function ErrorGeneral({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-control border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 sm:text-sm"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      {mensaje}
    </p>
  );
}
