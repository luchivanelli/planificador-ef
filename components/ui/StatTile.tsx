import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Tono = "brand" | "esmeralda" | "ambar" | "cielo";

const TONOS: Record<Tono, { fondo: string; texto: string }> = {
  brand: { fondo: "bg-brand-50", texto: "text-brand-600" },
  esmeralda: { fondo: "bg-emerald-50", texto: "text-emerald-600" },
  ambar: { fondo: "bg-amber-50", texto: "text-amber-600" },
  cielo: { fondo: "bg-sky-50", texto: "text-sky-600" },
};

/**
 * Dato suelto del panel (cursos, alumnos, clases de hoy...). Si recibe `href`
 * se vuelve un acceso rápido a esa sección.
 */
export default function StatTile({
  icono: Icono,
  valor,
  etiqueta,
  tono = "brand",
  href,
}: {
  icono: LucideIcon;
  valor: number | string;
  etiqueta: string;
  tono?: Tono;
  href?: string;
}) {
  const { fondo, texto } = TONOS[tono];

  const contenido = (
    <>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${fondo} ${texto}`}>
        <Icono className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="numero-grande block">{valor}</span>
        <span className="mt-0.5 block truncate text-xs font-medium text-ink-500 sm:text-sm">
          {etiqueta}
        </span>
      </span>
    </>
  );

  const clases = "card flex items-center gap-3 p-3 sm:p-4";

  if (href) {
    return (
      <Link href={href} className={`${clases} card-hover`}>
        {contenido}
      </Link>
    );
  }

  return <div className={clases}>{contenido}</div>;
}
