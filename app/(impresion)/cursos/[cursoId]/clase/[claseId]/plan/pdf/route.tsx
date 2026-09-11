import { renderToBuffer } from "@react-pdf/renderer";
import { requerirDocente } from "@/lib/auth";
import { fechaConDia, planDeClase } from "@/lib/clases/plan-clase";
import { aFecha, aFechaLegible, diaEnZona } from "@/lib/schemas/common";
import PlanClasePdf from "@/components/clase/PlanClasePdf";

/**
 * Devuelve el plan de clase como archivo PDF ya armado.
 *
 * Va con `Content-Disposition: attachment` para que el navegador lo baje
 * directo a la carpeta de descargas, sin abrir el diálogo de impresión ni
 * pedirle nada a la docente.
 */

// `@react-pdf/renderer` arma el PDF con APIs de Node: no corre en el runtime edge.
export const runtime = "nodejs";

/** Un nombre de archivo que no rompa en ningún sistema: sin barras ni comillas. */
function nombreDeArchivo(curso: string, fecha: string) {
  const limpio = curso
    .replace(/["'\\/:*?<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `Plan de clase - ${limpio} - ${fecha.replace(/\//g, "-")}.pdf`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cursoId: string; claseId: string }> }
) {
  const { cursoId, claseId } = await params;

  const docente = await requerirDocente();
  const plan = await planDeClase(claseId, cursoId, docente.id);
  if (!plan) return new Response("Clase no encontrada", { status: 404 });

  const fechaCorta = aFechaLegible(plan.clase.fecha);
  const pdf = await renderToBuffer(
    <PlanClasePdf
      plan={plan}
      generadoEl={aFechaLegible(aFecha(diaEnZona()))}
      fecha={{ conDia: fechaConDia(plan.clase.fecha), corta: fechaCorta }}
    />
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // Entre comillas porque el nombre lleva espacios.
      "Content-Disposition": `attachment; filename="${nombreDeArchivo(plan.curso.nombre, fechaCorta)}"`,
      // El plan cambia cada vez que se toca la clase: nunca se cachea.
      "Cache-Control": "no-store",
    },
  });
}
