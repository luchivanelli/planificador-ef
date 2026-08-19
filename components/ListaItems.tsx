import { itemsDeLista } from "@/lib/schemas/common";

/**
 * Muestra un campo de lista (objetivos, temas, contenidos) separando los ítems
 * que se cargaron en líneas distintas: HTML se come los saltos de línea, así que
 * sin esto los ítems quedan pegados uno atrás del otro.
 *
 * Con un solo ítem no pone viñeta, para que los textos cortos de siempre se sigan
 * viendo como un párrafo suelto.
 */
export default function ListaItems({
  valor,
  vacio,
  className,
}: {
  valor: string | null | undefined;
  vacio?: string;
  className?: string;
}) {
  const items = itemsDeLista(valor);

  if (items.length === 0) return vacio ? <p className={className}>{vacio}</p> : null;
  if (items.length === 1) return <p className={className}>{items[0]}</p>;

  return (
    <ul className={`space-y-1 ${className ?? ""}`}>
      {items.map((item, indice) => (
        <li key={`${indice}-${item}`} className="flex gap-2">
          {/* Punto propio en vez de `list-disc`: se alinea con la primera línea
              incluso cuando el ítem ocupa varias. */}
          <span
            aria-hidden="true"
            className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}
