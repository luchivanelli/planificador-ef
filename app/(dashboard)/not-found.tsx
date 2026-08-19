import Link from "next/link";
import { Compass, House } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

/** 404 dentro del panel: mantiene el menú, así se puede seguir navegando. */
export default function NotFoundDashboard() {
  return (
    <EmptyState
      icono={Compass}
      titulo="No encontramos esta página"
      descripcion="Puede que el curso, la clase o la unidad que buscabas se haya eliminado."
      accion={
        <Link href="/" className="button-primary">
          <House className="h-4 w-4" />
          Ir al inicio
        </Link>
      }
      className="py-16"
    />
  );
}
