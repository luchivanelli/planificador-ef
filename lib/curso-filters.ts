import type { Nivel, Turno } from "@prisma/client";

const VALID_NIVELES: Nivel[] = ["primaria", "secundaria"];
const VALID_TURNOS: Turno[] = ["manana", "tarde"];

export type CursoFilterValues = {
  nivel?: Nivel;
  turno?: Turno;
};

export function normalizeCursoFilterValue<T extends string>(
  value: string | undefined,
  validValues: readonly T[],
): T | undefined {
  if (!value) {
    return undefined;
  }

  return validValues.includes(value as T) ? (value as T) : undefined;
}

export function getCursoFilterValues(searchParams: {
  nivel?: string;
  turno?: string;
}): CursoFilterValues {
  return {
    nivel: normalizeCursoFilterValue(searchParams.nivel, VALID_NIVELES),
    turno: normalizeCursoFilterValue(searchParams.turno, VALID_TURNOS),
  };
}

export function buildCursosHref(
  currentFilters: CursoFilterValues,
  overrides: { nivel?: string | null; turno?: string | null } = {},
): string {
  const params = new URLSearchParams();

  const nextNivel = overrides.nivel === undefined ? currentFilters.nivel : overrides.nivel;
  const nextTurno = overrides.turno === undefined ? currentFilters.turno : overrides.turno;

  if (nextNivel !== undefined && nextNivel !== null) {
    params.set("nivel", nextNivel);
  } else {
    params.delete("nivel");
  }

  if (nextTurno !== undefined && nextTurno !== null) {
    params.set("turno", nextTurno);
  } else {
    params.delete("turno");
  }

  const queryString = params.toString();
  return queryString ? `/cursos?${queryString}` : "/cursos";
}
