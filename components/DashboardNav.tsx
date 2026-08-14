"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, House, BookOpen } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/juegos", label: "Juegos", icon: Gamepad2 },
  { href: "/cursos", label: "Cursos", icon: BookOpen },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border border-slate-200 bg-slate-50 text-xs sm:text-sm">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-2.5 transition ${
              isActive
                ? "text-[#0f63ff] border-b-2"
                : "text-slate-600 hover:bg-white hover:text-[#0f63ff]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
