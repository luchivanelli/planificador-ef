import Link from "next/link";
import { Volleyball } from "lucide-react";

/** Marca de la app. Con `href` funciona como acceso al inicio. */
export default function Logo({
  href,
  conBajada = false,
  className = "",
}: {
  href?: string;
  conBajada?: boolean;
  className?: string;
}) {
  const contenido = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_10px_20px_-10px_rgba(79,70,229,0.9)]">
        <Volleyball className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold leading-tight tracking-tight text-ink-900">
          Planificador <span className="text-brand-600">EF</span>
        </span>
        {conBajada && (
          <span className="block truncate text-xs text-ink-500">Gestión de clases y evaluación</span>
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`flex items-center gap-3 ${className}`}>
        {contenido}
      </Link>
    );
  }

  return <div className={`flex items-center gap-3 ${className}`}>{contenido}</div>;
}
