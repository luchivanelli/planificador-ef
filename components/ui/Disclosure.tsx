import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Panel desplegable con la piel de la app.
 *
 * Sigue siendo un `<details>` nativo: los formularios que se cierran solos con
 * `cerrarDetails(formId)` lo hacen buscando el `<details>` más cercano al form,
 * así que cambiar esto por un panel con estado de React los rompería.
 *
 * Se puede usar tal cual desde un server component; `open`/`onToggle` sólo tienen
 * sentido cuando quien lo usa es un componente cliente.
 */
export default function Disclosure({
  titulo,
  icono: Icono,
  open,
  defaultOpen,
  onToggle,
  className = "",
  cuerpoClassName = "",
  tono = "neutro",
  children,
}: {
  titulo: ReactNode;
  icono?: LucideIcon;
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (evento: React.SyntheticEvent<HTMLDetailsElement>) => void;
  className?: string;
  cuerpoClassName?: string;
  /** `accion` lo pinta con el color de marca: sirve para los "Agregar ...". */
  tono?: "neutro" | "accion";
  children: ReactNode;
}) {
  return (
    <details
      // `<details>` maneja su estado en el DOM: si no lo controla nadie, esto es
      // sólo el valor con el que arranca.
      open={open ?? defaultOpen}
      onToggle={onToggle}
      className={`disclosure ${className}`}
    >
      <summary>
        {Icono && (
          <Icono
            className={`h-4 w-4 shrink-0 ${tono === "accion" ? "text-brand-600" : "text-ink-400"}`}
          />
        )}
        <span className={tono === "accion" ? "text-brand-700" : undefined}>{titulo}</span>
        <ChevronDown className="disclosure-chevron h-4 w-4" />
      </summary>
      <div className={`disclosure-cuerpo ${cuerpoClassName}`}>{children}</div>
    </details>
  );
}
