import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Botón de envío para formularios de React Hook Form.
 * A diferencia de `FormSubmit`, no depende de `useFormStatus` (que sólo funciona
 * cuando el `<form>` recibe una server action directo): acá el estado lo da
 * `formState.isSubmitting`.
 */
export default function BotonEnviar({
  enviando,
  children,
  className,
  title,
  form,
  textoEnviando = "Procesando...",
}: {
  enviando: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
  /** Id del `<form>` al que pertenece, si el botón queda fuera del formulario. */
  form?: string;
  textoEnviando?: string;
}) {
  return (
    <button
      type="submit"
      disabled={enviando}
      title={title}
      form={form}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {enviando ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          {textoEnviando}
        </>
      ) : (
        children
      )}
    </button>
  );
}
