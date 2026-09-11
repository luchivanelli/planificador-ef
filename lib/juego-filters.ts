import type { CategoriaJuego, EstrategiaJuego, RangoEtario } from "@prisma/client";
import { CATEGORIAS, ESTRATEGIAS, RANGOS } from "@/lib/types";

// Los filtros del banco de juegos llegan por query string, así que son texto
// libre: si se pasan a Prisma tal cual, un valor que no existe en el enum
// rompe la consulta y se cae toda la página. Igual que en `curso-filters`, acá
// se descarta lo que no sea un valor válido y el filtro simplemente no se
// aplica.

const VALID_RANGOS = RANGOS.map((r) => r.value);
const VALID_CATEGORIAS = CATEGORIAS.map((c) => c.value);
const VALID_ESTRATEGIAS = ESTRATEGIAS.map((e) => e.value);

export type JuegoFilterValues = {
  edad?: RangoEtario;
  categoria?: CategoriaJuego;
  estrategia?: EstrategiaJuego;
};

export function normalizeJuegoFilterValue<T extends string>(
  value: string | undefined,
  validValues: readonly T[]
): T | undefined {
  if (!value) {
    return undefined;
  }

  return validValues.includes(value as T) ? (value as T) : undefined;
}

export function getJuegoFilterValues(searchParams: {
  edad?: string;
  categoria?: string;
  estrategia?: string;
}): JuegoFilterValues {
  return {
    edad: normalizeJuegoFilterValue(searchParams.edad, VALID_RANGOS),
    categoria: normalizeJuegoFilterValue(searchParams.categoria, VALID_CATEGORIAS),
    estrategia: normalizeJuegoFilterValue(searchParams.estrategia, VALID_ESTRATEGIAS),
  };
}
