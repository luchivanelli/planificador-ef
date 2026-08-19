"use client";

import { Search, X } from "lucide-react";

/**
 * Buscador de las listas que se filtran en memoria (juegos, clases, alumnos).
 * Trae la lupa y el botón para limpiar, que en el celular ahorra borrar a mano.
 */
export default function SearchInput({
  valor,
  onCambio,
  placeholder,
  className = "",
  autoFocus = false,
}: {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        // `appearance-none` saca la cruz nativa del `type="search"`: ya hay una propia.
        className="input-shell appearance-none pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambio("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
