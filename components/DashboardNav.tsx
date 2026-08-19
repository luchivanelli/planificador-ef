"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, House, BookOpen } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/juegos", label: "Juegos", icon: Gamepad2 },
  { href: "/cursos", label: "Cursos", icon: BookOpen },
];

/**
 * La misma navegación en sus dos formas: columna en el menú lateral (escritorio)
 * y barra fija abajo en el celular, que es donde llega el pulgar.
 */
export default function DashboardNav({ variante = "lateral" }: { variante?: "lateral" | "barra" }) {
  const pathname = usePathname();

  const esActivo = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  if (variante === "barra") {
    return (
      <nav
        aria-label="Navegación principal"
        className="grid grid-cols-3 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const activo = esActivo(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold transition ${
                activo ? "text-brand-700" : "text-ink-500 active:bg-ink-100"
              }`}
            >
              <span
                className={`flex h-8 w-full max-w-14 items-center justify-center rounded-full transition ${
                  activo ? "bg-brand-100" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const activo = esActivo(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold transition ${
              activo
                ? "bg-brand-600 text-white shadow-[0_10px_20px_-12px_rgba(79,70,229,0.9)]"
                : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            <Icon className={`h-5 w-5 ${activo ? "text-white" : "text-ink-400 group-hover:text-brand-600"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
