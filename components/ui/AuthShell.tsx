import { CalendarCheck, ClipboardList, Gamepad2, Volleyball } from "lucide-react";
import type { ReactNode } from "react";

const VENTAJAS = [
  { icono: CalendarCheck, texto: "Planificación anual, unidades y clases en un solo lugar." },
  { icono: ClipboardList, texto: "Asistencia y rúbricas de evaluación en dos toques." },
  { icono: Gamepad2, texto: "Tu banco de juegos, siempre a mano para armar la clase." },
];

/**
 * Marco de las pantallas de sesión. En escritorio muestra el panel de marca al
 * costado; en el celular queda sólo el formulario, que es lo que importa.
 */
export default function AuthShell({
  titulo,
  subtitulo,
  children,
  pie,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  pie: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Círculos difusos: dan profundidad sin cargar el panel de imágenes. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Volleyball className="h-6 w-6" />
          </span>
          <p className="text-lg font-bold tracking-tight">Planificador EF</p>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Toda tu materia, ordenada y lista para dar clase.
          </h2>
          <ul className="mt-7 space-y-4">
            {VENTAJAS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-start gap-3 text-sm text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icono className="h-4 w-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          Hecho para docentes de Educación Física.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:text-left">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_12px_24px_-12px_rgba(79,70,229,0.9)] lg:hidden">
              <Volleyball className="h-6 w-6" />
            </span>
            <h1 className="page-title">{titulo}</h1>
            <p className="page-subtitle mt-1">{subtitulo}</p>
          </div>

          {children}

          <p className="mt-5 text-center text-sm text-ink-500">{pie}</p>
        </div>
      </main>
    </div>
  );
}
