import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { db } from "@/lib/db";
import JuegoForm from "@/components/juego/JuegoForm";
import JuegosLista from "@/components/juego/JuegosLista";
import { GenericToast } from "@/components/GenericToast";
import type { RangoEtario, CategoriaJuego, EstrategiaJuego } from "@prisma/client";
import { RANGOS, CATEGORIAS, ESTRATEGIAS } from "@/lib/types";


export default async function JuegosPage({
  searchParams,
}: {
  searchParams: Promise<{ edad?: string; categoria?: string; estrategia?: string; created?: string }>;
}) {
  const { edad, categoria, estrategia, created } = await searchParams;

  const juegos = await db.juego.findMany({
    where: {
      rangoEtario: edad ? (edad as RangoEtario) : undefined,
      categoria: categoria ? (categoria as CategoriaJuego) : undefined,
      estrategia: estrategia ? (estrategia as EstrategiaJuego) : undefined,
    },
    orderBy: { nombre: "asc" },
  });

  /**
   * Arma el href conservando los filtros actuales: sólo se cambia lo que viene
   * en `overrides` (`null` para quitar ese filtro).
   */
  function hrefFiltro(
    overrides: {
      edad?: string | null;
      categoria?: string | null;
      estrategia?: string | null;
    } = {}
  ) {
    const valores = {
      edad: overrides.edad !== undefined ? overrides.edad : edad,
      categoria: overrides.categoria !== undefined ? overrides.categoria : categoria,
      estrategia: overrides.estrategia !== undefined ? overrides.estrategia : estrategia,
    };

    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(valores)) {
      if (valor) params.set(clave, valor);
    }

    const qs = params.toString();
    return qs ? `/juegos?${qs}` : "/juegos";
  }

  const listado = juegos.map((juego) => ({
    id: juego.id,
    nombre: juego.nombre,
    descripcion: juego.descripcion,
    rangoEtario: juego.rangoEtario,
    categoria: juego.categoria,
    estrategia: juego.estrategia,
    materiales: juego.materiales,
    etiqueta: `${RANGOS.find((r) => r.value === juego.rangoEtario)?.label} · ${CATEGORIAS.find((c) => c.value === juego.categoria)?.label}`,
  }));

  return (
    <div className="space-y-4">
      <GenericToast visible={created === "true"} message="Juego agregado correctamente" />
      <section className="surface-card p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Banco de juegos</h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Filtrá por edad y categoría para encontrar ideas rápidas.
            </p>
          </div>
        </div>
      </section>

      <JuegosLista
        juegos={listado}
        filtros={
          <div className="py-2">
            <div className="flex flex-wrap gap-1.5 pb-2">
              <Link
                href={hrefFiltro({ edad: null })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${!edad ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
              >
                Todas las edades
              </Link>
              {RANGOS.map((r) => (
                <Link
                  key={r.value}
                  href={hrefFiltro({ edad: r.value })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${edad === r.value ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
                >
                  {r.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pb-2">
              <Link
                href={hrefFiltro({ categoria: null })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${!categoria ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
              >
                Todas las categorías
              </Link>
              {CATEGORIAS.map((c) => (
                <Link
                  key={c.value}
                  href={hrefFiltro({ categoria: c.value })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${categoria === c.value ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={hrefFiltro({ estrategia: null })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${!estrategia ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
              >
                Todas las estrategias
              </Link>
              {ESTRATEGIAS.map((e) => (
                <Link
                  key={e.value}
                  href={hrefFiltro({ estrategia: e.value })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm ${estrategia === e.value ? "border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff]" : "border-slate-200 text-slate-600"}`}
                >
                  {e.label}
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <details className="surface-card p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">Agregar juego</summary>
        <JuegoForm />
      </details>
    </div>
  );
}
