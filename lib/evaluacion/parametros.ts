/**
 * Los parámetros del informe de evaluación general viajan en la URL y no en la
 * base: el informe se recalcula cada vez a partir de lo que ya hay cargado
 * (rúbricas y asistencia), así que la pantalla, el PDF y el link que la docente
 * comparte tienen que leerlos exactamente igual. Por eso viven acá y no en cada
 * archivo.
 *
 * Este módulo no toca la base ni Prisma a propósito: también lo importa el
 * formulario de filtros, que es un componente cliente.
 */

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Cuánto pesan las rúbricas en la nota sugerida; el resto lo pone la asistencia.
 * Son porcentajes redondos porque es un `<select>`: la docente elige el criterio
 * con el que evalúa, no afina un número.
 */
export const PESOS_RUBRICAS = [50, 60, 70, 80, 90, 100] as const;

export const PESO_RUBRICAS_POR_DEFECTO = 70;

export type ParametrosInforme = {
  desde: string;
  hasta: string;
  /** `null` es el informe del curso completo. */
  alumnoId: string | null;
  pesoRubricas: number;
  /** Sólo en el PDF del curso: suma el detalle de indicadores de cada alumno. */
  detalle: boolean;
};

export type BusquedaInforme = {
  desde?: string;
  hasta?: string;
  alumnoId?: string;
  peso?: string;
  detalle?: string;
};

export type LecturaParametros =
  /** Todavía no se pidió ningún informe: la pantalla muestra sólo el formulario. */
  | { estado: "sin-rango" }
  | { estado: "invalido"; mensaje: string }
  | { estado: "ok"; parametros: ParametrosInforme };

/**
 * Valida el rango que llega por la URL. Es la única puerta de entrada: lo que
 * sale de acá ya se puede usar para armar fechas y consultar.
 */
export function leerParametros(busqueda: BusquedaInforme): LecturaParametros {
  const desde = busqueda.desde?.trim() ?? "";
  const hasta = busqueda.hasta?.trim() ?? "";

  if (!desde && !hasta) return { estado: "sin-rango" };

  if (!FORMATO_FECHA.test(desde) || !FORMATO_FECHA.test(hasta)) {
    return { estado: "invalido", mensaje: "Elegí las dos fechas del período para ver el informe." };
  }

  // Comparar las cadenas alcanza: "AAAA-MM-DD" se ordena igual que la fecha.
  if (desde > hasta) {
    return {
      estado: "invalido",
      mensaje: "La fecha de inicio del período es posterior a la de cierre.",
    };
  }

  const peso = Number(busqueda.peso);
  const pesoRubricas = (PESOS_RUBRICAS as readonly number[]).includes(peso)
    ? peso
    : PESO_RUBRICAS_POR_DEFECTO;

  const alumnoId = busqueda.alumnoId?.trim();

  return {
    estado: "ok",
    parametros: {
      desde,
      hasta,
      alumnoId: alumnoId ? alumnoId : null,
      pesoRubricas,
      detalle: busqueda.detalle === "1",
    },
  };
}

/**
 * El id de la sección del informe en la pantalla.
 *
 * Los links que van del curso a un alumno (y el que vuelve) terminan en
 * `#informe` para que la navegación deje el informe a la vista: sin eso cada
 * ida y vuelta arrancaba arriba de todo y lo primero que se veía era el
 * formulario de filtros, con lo que se estaba mirando fuera de pantalla.
 */
export const ANCLA_INFORME = "informe";

/** La misma consulta de vuelta a cadena, para los links y el botón del PDF. */
export function busquedaDeInforme(
  parametros: ParametrosInforme,
  cambios: Partial<ParametrosInforme> = {}
) {
  const { desde, hasta, alumnoId, pesoRubricas, detalle } = { ...parametros, ...cambios };

  const params = new URLSearchParams({ desde, hasta, peso: String(pesoRubricas) });
  if (alumnoId) params.set("alumnoId", alumnoId);
  if (detalle) params.set("detalle", "1");

  return params.toString();
}

/**
 * El link a un informe, ya apuntando a la sección: es el que usan la tabla del
 * curso y el botón de volver al curso, que viven a media pantalla.
 *
 * El "volver" del encabezado no usa éste: está arriba de todo, y ahí lo que
 * corresponde es quedarse arriba.
 */
export function hrefInforme(
  cursoId: string,
  parametros: ParametrosInforme,
  cambios: Partial<ParametrosInforme> = {}
) {
  return `/evaluacion/${cursoId}?${busquedaDeInforme(parametros, cambios)}#${ANCLA_INFORME}`;
}

/**
 * El período con el que arranca el formulario: del inicio del ciclo lectivo
 * (marzo) a hoy. Es el rango que más se pide y siempre se puede cambiar.
 */
export function periodoPorDefecto(hoy: string) {
  return { desde: `${hoy.slice(0, 4)}-03-01`, hasta: hoy };
}
