"use client";
import { useMemo, useState, type ReactNode } from "react";
import JuegoItem, { type JuegoListado } from "@/components/juego/JuegoItem";

/**
 * `filtros` llega ya renderizado desde el servidor: sólo el buscador necesita
 * estado, y así comparte tarjeta con las píldoras sin que éstas dejen de ser
 * links.
 */
export default function JuegosLista({
  juegos,
  filtros,
}: {
  juegos: JuegoListado[];
  filtros: ReactNode;
}) {
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    const busqueda = q.trim().toLowerCase();
    if (!busqueda) return juegos;

    return juegos.filter(
      (juego) =>
        juego.nombre.toLowerCase().includes(busqueda) ||
        (juego.descripcion?.toLowerCase().includes(busqueda) ?? false)
    );
  }, [juegos, q]);

  return (
    <div className="space-y-4">
      <section className="surface-card p-5 sm:p-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar juego por nombre o descripción"
          className="input-shell mb-3 w-full"
        />
        <details className="surface-card py-2 px-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">Filtros</summary>
          {filtros}
        </details>
      </section>

      <section className="space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        {filtrados.map((juego) => (
          <JuegoItem key={juego.id} juego={juego} />
        ))}
        {filtrados.length === 0 && (
          <div className="surface-card p-5 text-center text-sm sm:text-base text-slate-500">
            No hay juegos con estos filtros.
          </div>
        )}
      </section>
    </div>
  );
}
