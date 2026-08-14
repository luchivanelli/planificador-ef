"use client";

import { useEffect, useRef, useState } from "react";

export default function Cronometro({ duracionMinutos, titulo }: { duracionMinutos: number; titulo: string }) {
  const [segundos, setSegundos] = useState(duracionMinutos * 60);
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

  return (
    <div className="rounded-xl bg-teal-50 p-4 border border-teal-100">
      <p className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-1">Cronómetro</p>
      <p className="text-sm font-medium text-gray-800 mb-3">{titulo}</p>
      <div className="flex items-center justify-between">
        <span className={`text-3xl font-semibold tabular-nums ${terminado ? "text-red-500" : "text-gray-900"}`}>
          {minutos}:{segs.toString().padStart(2, "0")}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCorriendo((c) => !c)}
            disabled={terminado}
            className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center disabled:opacity-40"
          >
            {corriendo ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCorriendo(false);
              setSegundos(duracionMinutos * 60);
            }}
            className="w-10 h-10 rounded-full bg-white border border-teal-200 text-teal-700 flex items-center justify-center"
          >
            ↺
          </button>
        </div>
      </div>
      {terminado && <p className="text-xs text-red-500 mt-2">Tiempo cumplido</p>}
    </div>
  );
}
