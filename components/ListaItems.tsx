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
    <ul className={`list-disc space-y-0.5 pl-5 ${className ?? ""}`}>
      {items.map((item, indice) => (
        <li key={`${indice}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}
