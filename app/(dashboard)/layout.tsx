import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Volleyball } from "lucide-react";
import { getDocenteActual } from "@/lib/auth";
import { cerrarSesion } from "@/lib/actions/auth.actions";
import FormSubmit from "@/components/FormSubmit";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const docente = await getDocenteActual();
  if (!docente) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="text-white p-2.5 bg-[#0f63ff]">
              <Volleyball className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <Link href="/" className="text-base sm:text-xl font-semibold text-slate-900">
                Planificador <b className="text-[#0f63ff]">EF</b>
              </Link>
              <p className="text-xs sm:text-sm text-slate-500">Gestión de clases y evaluación</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DashboardNav />
            <div className="flex items-center gap-2 border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm">
              <form action={cerrarSesion}>
                <FormSubmit className="flex items-center gap-1 text-xs sm:text-sm font-medium transition text-rose-700 cursor-pointer">
                  <LogOut className="h-4 w-4 text-rose-700"/>
                  <span>Salir</span>
                </FormSubmit>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
