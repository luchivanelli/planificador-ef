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
      {label && <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-500">{label}</label>}
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

/** Error general del formulario (`errors.root`): permisos, duplicados, fallas de red. */
export function ErrorGeneral({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;

  return (
    <p role="alert" className="text-xs text-red-600 sm:text-sm">
      {mensaje}
    </p>
  );
}
