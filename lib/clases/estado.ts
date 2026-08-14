import type { EstadoClase } from "@prisma/client";
import { rangoDelDia } from "@/lib/schemas/common";

// ==========================================
// EL MOMENTO: dónde está la clase en el reloj
// ==========================================

/**
 * Se deriva siempre de `fecha` + horarios, nunca se guarda: si estuviera en la
 * base haría falta un proceso que la prenda y la apague sola cada día.
 */
export type FaseHoraria = "por_venir" | "en_curso" | "terminada";

export type ClaseConHorario = {
  fecha: Date;
  horaInicio: string | null;
  horaFin: string | null;
};

/** "HH:MM" a minutos desde medianoche. `null` si no hay hora o no es válida. */
function enMinutos(hora: string | null) {
  if (!hora) return null;
  const [h, m] = hora.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
}

/**
 * `fecha` se guarda a medianoche UTC (ver `aFecha`) y los horarios son hora de
 * reloj local: por eso el día se compara en UTC y la hora contra la local.
 * Sin horarios cargados una clase de hoy nunca llega a "terminada": no hay
 * forma de saberlo, y recién pasa a estarlo cuando cambia el día.
 */
export function faseHoraria(clase: ClaseConHorario, ahora: Date = new Date()): FaseHoraria {
  const { inicio: hoyInicio } = rangoDelDia(ahora);
  const dia = clase.fecha.getTime();

  if (dia < hoyInicio.getTime()) return "terminada";
  if (dia > hoyInicio.getTime()) return "por_venir";

  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const fin = enMinutos(clase.horaFin);
  const inicio = enMinutos(clase.horaInicio);

  if (fin !== null && minutosAhora > fin) return "terminada";
  if (inicio !== null && minutosAhora >= inicio) return "en_curso";
  return "por_venir";
}

// ==========================================
// LA PRESENTACIÓN: el hecho + el momento, juntos
// ==========================================

export type PresentacionClase = {
  etiqueta: string;
  icono: string;
  /** Clases para un badge completo (borde + fondo + texto). */
  badge: string;
  /** Sólo el color, para pintar el ícono suelto en un listado. */
  colorTexto: string;
  /** La clase terminó sin asistencia cargada: la docente tiene que cerrarla. */
  requiereAtencion: boolean;
};

const PALETA = {
  emerald: {
    badge: "border-emerald-500 bg-emerald-50 text-emerald-700",
    colorTexto: "text-emerald-600",
  },
  azul: {
    badge: "border-[#0f63ff] bg-[#0f63ff]/10 text-[#0f63ff]",
    colorTexto: "text-[#0f63ff]",
  },
  ambar: {
    badge: "border-amber-500 bg-amber-50 text-amber-700",
    colorTexto: "text-amber-600",
  },
  rosa: {
    badge: "border-rose-500 bg-rose-50 text-rose-700",
    colorTexto: "text-rose-500",
  },
  violeta: {
    badge: "border-violet-500 bg-violet-50 text-violet-700",
    colorTexto: "text-violet-600",
  },
  gris: {
    badge: "border-slate-300 bg-slate-100 text-slate-600",
    colorTexto: "text-slate-400",
  },
} as const;

/** Los estados que no dependen del reloj: lo que pasó, ya pasó. */
const POR_ESTADO: Partial<Record<EstadoClase, { etiqueta: string; icono: string; paleta: keyof typeof PALETA }>> = {
  dictada: { etiqueta: "Dictada", icono: "✓", paleta: "emerald" },
  suspendida: { etiqueta: "Suspendida", icono: "⊘", paleta: "gris" },
  cancelada: { etiqueta: "Cancelada", icono: "✕", paleta: "rosa" },
  reprogramada: { etiqueta: "Reprogramada", icono: "↻", paleta: "violeta" },
};

/**
 * Única fuente de verdad de cómo se muestra una clase. Combina el hecho
 * (`estado`, lo que la docente registró) con el momento (derivado del reloj),
 * que sólo importa mientras la clase sigue en `planificada`.
 *
 * `tieneAsistencia` distingue el caso que motivó todo esto: una clase cuyo
 * horario ya pasó pero que nadie cerró todavía.
 */
export function presentacionClase(
  clase: ClaseConHorario & { estado: EstadoClase; tieneAsistencia?: boolean },
  ahora: Date = new Date()
): PresentacionClase {
  const resuelto = POR_ESTADO[clase.estado];
  if (resuelto) {
    return {
      etiqueta: resuelto.etiqueta,
      icono: resuelto.icono,
      ...PALETA[resuelto.paleta],
      requiereAtencion: false,
    };
  }

  // Sigue en `planificada`: acá sí manda el reloj.
  switch (faseHoraria(clase, ahora)) {
    case "en_curso":
      return { etiqueta: "En curso", icono: "●", ...PALETA.azul, requiereAtencion: false };

    case "terminada":
      // Con asistencia cargada la barrida ya la habrá pasado a `dictada`; esto
      // cubre el instante entre que se carga y que se vuelve a barrer.
      if (clase.tieneAsistencia) {
        return { etiqueta: "Dictada", icono: "✓", ...PALETA.emerald, requiereAtencion: false };
      }
      return { etiqueta: "Falta asistencia", icono: "!", ...PALETA.ambar, requiereAtencion: true };

    default:
      return { etiqueta: "Programada", icono: "◔", ...PALETA.gris, requiereAtencion: false };
  }
}
