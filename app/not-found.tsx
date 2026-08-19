import Link from "next/link";
import { Compass, House } from "lucide-react";

/**
 * 404 propia: la de fábrica está en inglés y sin la piel de la app.
 * La usan también los `notFound()` de las páginas de curso, clase y unidad.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass className="h-7 w-7" />
        </span>
        <h1 className="page-title mt-4">No encontramos esta página</h1>
        <p className="page-subtitle mt-2">
          Puede que el curso, la clase o la unidad que buscás se haya eliminado, o que el enlace esté
          mal escrito.
        </p>
        <Link href="/" className="button-primary mt-6 w-full">
          <House className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
