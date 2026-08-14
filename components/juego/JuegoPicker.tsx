"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { CategoriaJuego, EstrategiaJuego, RangoEtario } from "@prisma/client";
import { CATEGORIAS, ESTRATEGIAS, RANGOS } from "@/lib/types";

export type JuegoOpcion = {
  id: string;
  nombre: string;
  rangoEtario: RangoEtario;
  categoria: CategoriaJuego;
  estrategia: EstrategiaJuego;
};

const SIN_JUEGO = "Sin juego específico";

function etiquetaDe(juego: JuegoOpcion) {
  const rango = RANGOS.find((r) => r.value === juego.rangoEtario)?.label;
  const categoria = CATEGORIAS.find((c) => c.value === juego.categoria)?.label;
  return [rango, categoria].filter(Boolean).join(" · ");
}

/**
 * Reemplaza al `<select>` de juegos: con un banco grande, encontrar uno por
 * nombre en una lista desplegable es impracticable. El filtrado es en memoria
 * porque el banco entero llega con la página; si algún día crece de más, habría
 * que pasar la búsqueda al servidor.
 */
export default function JuegoPicker({
  juegos,
  valor,
  onCambio,
}: {
  juegos: JuegoOpcion[];
  valor: string;
  onCambio: (juegoId: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [edad, setEdad] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estrategia, setEstrategia] = useState("");

  const seleccionado = juegos.find((juego) => juego.id === valor) ?? null;

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return juegos.filter(
      (juego) =>
        (!texto || juego.nombre.toLowerCase().includes(texto)) &&
        (!edad || juego.rangoEtario === edad) &&
        (!categoria || juego.categoria === categoria) &&
        (!estrategia || juego.estrategia === estrategia)
    );
  }, [juegos, busqueda, edad, categoria, estrategia]);

  function elegir(juegoId: string) {
    onCambio(juegoId);
    setAbierto(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((estaAbierto) => !estaAbierto)}
        aria-expanded={abierto}
        className="input-shell flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={seleccionado ? "truncate" : "truncate text-slate-900"}>
          {seleccionado?.nombre ?? SIN_JUEGO}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-900 ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="mt-1 border border-slate-200 bg-white p-2">
          <div className="relative">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar juego por nombre"
              className="input-shell w-full pl-8"
              autoFocus
            />
          </div>

          <div className="mt-2 grid gap-1 sm:grid-cols-3">
            <select value={edad} onChange={(e) => setEdad(e.target.value)} className="input-shell w-full">
              <option value="">Todas las edades</option>
              {RANGOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="input-shell w-full"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={estrategia}
              onChange={(e) => setEstrategia(e.target.value)}
              className="input-shell w-full"
            >
              <option value="">Todas las estrategias</option>
              {ESTRATEGIAS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          <ul className="mt-2 max-h-[200px] overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => elegir("")}
                className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
              >
                {SIN_JUEGO}
                {!seleccionado && <Check className="h-4 w-4 shrink-0 text-[#0f63ff]" />}
              </button>
            </li>
            {filtrados.map((juego) => (
              <li key={juego.id}>
                <button
                  type="button"
                  onClick={() => elegir(juego.id)}
                  className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{juego.nombre}</span>
                    <span className="block truncate text-xs text-slate-500">{etiquetaDe(juego)}</span>
                  </span>
                  {juego.id === valor && <Check className="h-4 w-4 shrink-0 text-[#0f63ff]" />}
                </button>
              </li>
            ))}
          </ul>

          {filtrados.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-slate-500">
              Ningún juego coincide con la búsqueda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
