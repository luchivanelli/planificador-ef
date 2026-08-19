import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getDocenteActual } from "@/lib/auth";
import { cerrarSesion } from "@/lib/actions/auth.actions";
import FormSubmit from "@/components/FormSubmit";
import DashboardNav from "@/components/DashboardNav";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const docente = await getDocenteActual();
  if (!docente) redirect("/login");

  const nombreCompleto = `${docente.nombre} ${docente.apellido}`.trim();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      {/* Escritorio: menú lateral fijo. Deja todo el ancho útil al contenido. */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-linea bg-white/70 px-4 py-6 backdrop-blur-xl lg:flex">
        <Logo href="/" conBajada className="px-1" />

        <div className="mt-8 flex-1">
          <p className="section-title px-3 pb-2">Menú</p>
          <DashboardNav />
        </div>

        <div className="rounded-card border border-linea bg-ink-50 p-3">
          <div className="flex items-center gap-2.5">
            {/* <Avatar nombre={nombreCompleto} tamanio="sm" /> */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">Prof. {docente.nombre}</p>
              <p className="truncate text-xs text-ink-500">{docente.email}</p>
            </div>
          </div>
          <form action={cerrarSesion} className="mt-3">
            <FormSubmit className="button-secondary w-full text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </FormSubmit>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        {/* Celular y tablet: barra superior compacta. */}
        <header className="sticky top-0 z-40 border-b border-linea bg-white/85 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Logo href="/" />
            <div className="flex items-center gap-2">
              {/* <Avatar nombre={nombreCompleto} tamanio="sm" /> */}
              <form action={cerrarSesion}>
                <FormSubmit
                  title="Cerrar sesión"
                  textoPendiente=""
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition active:bg-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Salir</span>
                </FormSubmit>
              </form>
            </div>
          </div>
        </header>

        {/* El padding de abajo se declara solo con `pb-*`, nunca con `py-*`: la
            barra de navegación del celular es fija y necesita ese espacio libre
            hasta `lg`, donde recién pasa a menú lateral. */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Celular: navegación abajo, al alcance del pulgar. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-white/95 backdrop-blur-xl lg:hidden">
        <DashboardNav variante="barra" />
      </div>
    </div>
  );
}
