import { renderToBuffer } from "@react-pdf/renderer";
import { requerirDocente } from "@/lib/auth";
import { planillaDeAsistencia } from "@/lib/asistencia/planilla";
import { aFecha, aFechaLegible, diaEnZona } from "@/lib/schemas/common";
import { cabeceraDeDescarga, nombreDeArchivo } from "@/lib/pdf/descarga";
import PlanillaAsistenciaPdf from "@/components/asistencia/PlanillaAsistenciaPdf";

/**
 * La planilla de asistencia del curso como archivo PDF ya armado: todas las
 * clases con lista pasada, todos los alumnos.
 *
 * Va con `Content-Disposition: attachment` para que el navegador lo baje
 * directo a la carpeta de descargas, sin abrir el diálogo de impresión. Del
 * otro lado lo pide `BotonDescargarPdf`, que es el que muestra el "generando"
 * mientras el servidor arma el archivo.
 */

// `@react-pdf/renderer` arma el PDF con APIs de Node: no corre en el runtime edge.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cursoId: string }> }
) {
  const { cursoId } = await params;

  const docente = await requerirDocente();

  const planilla = await planillaDeAsistencia(cursoId, docente.id);
  if (!planilla) return new Response("Curso no encontrado", { status: 404 });

  const pdf = await renderToBuffer(
    <PlanillaAsistenciaPdf
      planilla={planilla}
      generadoEl={aFechaLegible(aFecha(diaEnZona()))}
    />
  );

  // Las fechas llevan barra y `nombreDeArchivo` la borra por ser separador de
  // carpetas: sin este reemplazo "11/09/2026" quedaría como "11092026".
  const rango = planilla.periodo
    ? `${planilla.periodo.desdeTexto} al ${planilla.periodo.hastaTexto}`.replace(/\//g, "-")
    : String(planilla.curso.anioLectivo);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": cabeceraDeDescarga(
        nombreDeArchivo(["Asistencia", planilla.curso.nombre, rango])
      ),
      // La planilla cambia cada vez que se pasa lista: nunca se cachea.
      "Cache-Control": "no-store",
    },
  });
}
