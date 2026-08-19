import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { db } from "@/lib/db";
import JuegoForm from "@/components/juego/JuegoForm";
import JuegosLista from "@/components/juego/JuegosLista";
import { GenericToast } from "@/components/GenericToast";
import Disclosure from "@/components/ui/Disclosure";
import PageHeader from "@/components/ui/PageHeader";
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

  const hayFiltros = Boolean(edad || categoria || estrategia);

  /** Una fila de píldoras: la primera limpia ese filtro, el resto lo fijan. */
  function grupoDeFiltros(
    etiqueta: string,
    todos: string,
    opciones: { value: string; label: string }[],
    activo: string | undefined,
    href: (valor: string | null) => string
  ) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-500">{etiqueta}</p>
        <div className="flex flex-wrap gap-2">
          <Link href={href(null)} className={`chip ${!activo ? "chip-activo" : ""}`}>
            {todos}
          </Link>
          {opciones.map((opcion) => (
            <Link
              key={opcion.value}
              href={href(opcion.value)}
              className={`chip ${activo === opcion.value ? "chip-activo" : ""}`}
            >
              {opcion.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <GenericToast visible={created === "true"} message="Juego agregado correctamente" />

      <PageHeader
        titulo="Banco de juegos"
        subtitulo="Buscá por nombre, filtrá por edad y categoría, y tené las ideas listas para armar la clase."
        etiquetas={
          <>
            <span className="pill pill-brand">
              {juegos.length} {juegos.length === 1 ? "juego" : "juegos"}
            </span>
            {hayFiltros && (
              <Link href="/juegos" className="link-brand text-xs">
                Quitar filtros
              </Link>
            )}
          </>
        }
      />

      <JuegosLista
        juegos={listado}
        filtros={
          <div className="space-y-3 pt-1">
            {grupoDeFiltros("Edad", "Todas", RANGOS, edad, (edad) => hrefFiltro({ edad }))}
            {grupoDeFiltros("Categoría", "Todas", CATEGORIAS, categoria, (categoria) =>
              hrefFiltro({ categoria })
            )}
            {grupoDeFiltros("Estrategia", "Todas", ESTRATEGIAS, estrategia, (estrategia) =>
              hrefFiltro({ estrategia })
            )}
          </div>
        }
      />

      <Disclosure titulo="Agregar un juego al banco" icono={PlusCircle} tono="accion">
        <JuegoForm />
      </Disclosure>
    </div>
  );
}
