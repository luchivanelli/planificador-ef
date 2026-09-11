import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

/**
 * Barra de la vista previa del plan: no sale en el papel (la apaga `@media print`).
 *
 * "Guardar PDF" apunta al route handler que arma el archivo en el servidor, que
 * lo devuelve con `Content-Disposition: attachment`: el navegador lo baja solo,
 * sin diálogo de impresión de por medio. Es un `<a>` y no un `Link` a propósito,
 * porque descarga un archivo en vez de navegar a otra pantalla.
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
        <a href={descargarEn} download className="plan-boton">
          <Download className="h-4 w-4" />
          Guardar PDF
        </a>
      </div>
    </div>
  );
}
