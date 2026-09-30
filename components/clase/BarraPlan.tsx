import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BotonDescargarPdf from "@/components/ui/BotonDescargarPdf";

/**
 * Barra de la vista previa del plan: no sale en el papel (la apaga `@media print`).
 *
 * "Guardar PDF" pide el archivo al route handler que lo arma en el servidor.
 * Mientras tanto el botón queda en "generando" y al terminar avisa que se
 * guardó: el PDF tarda lo suyo en armarse y sin eso no pasaba nada visible al
 * tocarlo (ver `BotonDescargarPdf`).
 */
export default function BarraPlan({
  volverA,
  descargarEn,
}: {
  volverA: string;
  descargarEn: string;
}) {
  return (
    <div className="plan-barra">
      <p>Así se va a ver el plan impreso. Revisalo y guardalo.</p>
      <div className="plan-barra-acciones">
        <Link href={volverA} className="plan-boton-suave">
          <ArrowLeft className="h-4 w-4" />
          Volver a la clase
        </Link>
        <BotonDescargarPdf
          href={descargarEn}
          className="plan-boton"
          descripcion="Es el plan de esta clase, tal como se ve en la hoja."
        />
      </div>
    </div>
  );
}
