"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Gamepad2, SlidersHorizontal } from "lucide-react";
import JuegoItem, { type JuegoListado } from "@/components/juego/JuegoItem";
import Disclosure from "@/components/ui/Disclosure";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";

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
      <section className="card space-y-3 p-4 sm:p-5">
        <SearchInput
          valor={q}
          onCambio={setQ}
          placeholder="Buscar juego por nombre o descripción"
        />
        <Disclosure titulo="Filtrar por edad, categoría y estrategia" icono={SlidersHorizontal}>
          {filtros}
        </Disclosure>
      </section>

      <section className="space-y-3">
        <p className="section-title">
          {filtrados.length} {filtrados.length === 1 ? "juego" : "juegos"}
        </p>

        {filtrados.length === 0 ? (
          <EmptyState
            icono={Gamepad2}
            titulo="No hay juegos con estos filtros"
            descripcion="Probá con otra búsqueda, o cargá un juego nuevo al banco."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtrados.map((juego) => (
              <JuegoItem key={juego.id} juego={juego} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
