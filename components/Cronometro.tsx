"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

/**
 * Cuenta hacia atrás la duración de un bloque de la clase. Vive dentro de cada
 * actividad: durante la clase, la docente arranca el bloque y ve el tiempo que
 * queda sin salir de la pantalla.
 */
export default function Cronometro({
  duracionMinutos,
  titulo,
}: {
  duracionMinutos: number;
  titulo: string;
}) {
  const totalSegundos = Math.max(1, duracionMinutos * 60);
  const [segundos, setSegundos] = useState(totalSegundos);
  const [corriendo, setCorriendo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (corriendo) {
      intervalRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s <= 1) {
            setCorriendo(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [corriendo]);

  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  const terminado = segundos === 0;
  const progreso = Math.round(((totalSegundos - segundos) / totalSegundos) * 100);

  return (
    <div
      className={`rounded-control border p-3 ${
        terminado ? "border-rose-200 bg-rose-50" : "border-brand-100 bg-brand-50/70"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="section-title">Cronómetro</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-ink-700">{titulo}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-2xl font-bold tabular-nums ${
              terminado ? "text-rose-600" : "text-ink-900"
            }`}
          >
            {minutos}:{segs.toString().padStart(2, "0")}
          </span>

          <button
            type="button"
            onClick={() => setCorriendo((c) => !c)}
            disabled={terminado}
            aria-label={corriendo ? "Pausar" : "Iniciar"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_8px_18px_-10px_rgba(79,70,229,0.9)] transition hover:bg-brand-700 disabled:opacity-40"
          >
            {corriendo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setCorriendo(false);
              setSegundos(totalSegundos);
            }}
            aria-label="Reiniciar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            terminado ? "bg-rose-500" : "bg-brand-500"
          }`}
          style={{ width: `${progreso}%` }}
        />
      </div>

      {terminado && <p className="mt-2 text-xs font-semibold text-rose-600">¡Tiempo cumplido!</p>}
    </div>
  );
}
