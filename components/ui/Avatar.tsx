/**
 * Iniciales sobre un color. El color sale del propio texto, así el mismo curso
 * o el mismo alumno se ve siempre igual sin guardar nada en la base.
 */
const PALETA = [
  "bg-brand-100 text-brand-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

const TAMANIOS = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

function iniciales(texto: string) {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "?";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

function colorDe(texto: string) {
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma = (suma + texto.charCodeAt(i)) % 9973;
  return PALETA[suma % PALETA.length];
}

export default function Avatar({
  nombre,
  tamanio = "md",
  className = "",
}: {
  nombre: string;
  tamanio?: keyof typeof TAMANIOS;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-bold ${TAMANIOS[tamanio]} ${colorDe(nombre)} ${className}`}
    >
      {iniciales(nombre)}
    </span>
  );
}
