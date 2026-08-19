"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function FormSubmit({
  children,
  className,
  title,
  onClick,
  /** Texto mientras se envía. Vacío deja sólo el spinner (botones de ícono). */
  textoPendiente = "Procesando...",
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  textoPendiente?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
      title={title}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          {textoPendiente && <span>{textoPendiente}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
