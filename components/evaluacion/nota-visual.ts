import { NOTA_APROBACION } from "@/lib/evaluacion/informe-general";

/**
 * Cómo se pinta una nota sugerida en pantalla. Lo usan la tabla del curso y el
 * detalle del alumno, así que el mismo 5,8 tiene el mismo color en los dos
 * lados. El PDF tiene su propia paleta (ver `InformeGeneralPdf`).
 */
export function tonoDeNota(valor: number | null) {
  if (valor === null) return "border-ink-200 bg-ink-50 text-ink-500";
  // Rojo según la nota redondeada, que es la que termina en la libreta: un 5,5
  // redondea a 6 y no es lo mismo que un 5,4.
  if (Math.round(valor) < NOTA_APROBACION) return "border-rose-200 bg-rose-50 text-rose-700";
  // Aprobado, pero justo: conviene mirarlo antes de cerrarlo.
  if (valor < NOTA_APROBACION + 1) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

/** Las notas y los promedios se muestran con coma, como se escriben acá. */
export const conComa = (valor: number | null, vacio = "—") =>
  valor === null ? vacio : String(valor).replace(".", ",");
