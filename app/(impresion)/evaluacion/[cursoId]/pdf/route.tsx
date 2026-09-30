import { renderToBuffer } from "@react-pdf/renderer";
import { requerirDocente } from "@/lib/auth";
import { aFecha, aFechaLegible, diaEnZona } from "@/lib/schemas/common";
import { informeGeneral, NOTA_APROBACION } from "@/lib/evaluacion/informe-general";
import { leerParametros, type BusquedaInforme } from "@/lib/evaluacion/parametros";
import { cabeceraDeDescarga, nombreDeArchivo } from "@/lib/pdf/descarga";
import InformeGeneralPdf from "@/components/evaluacion/InformeGeneralPdf";

/**
 * La evaluación general del período como archivo PDF ya armado.
 *
 * Lee exactamente los mismos parámetros de la URL que la pantalla
 * (`app/(dashboard)/evaluacion/[cursoId]`) y arma el informe con la misma
 * función, así que lo que se descarga es siempre lo que se está mirando.
 *
 * Va con `Content-Disposition: attachment` para que el navegador lo baje
 * directo a la carpeta de descargas, sin abrir el diálogo de impresión.
 */

// `@react-pdf/renderer` arma el PDF con APIs de Node: no corre en el runtime edge.
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cursoId: string }> }
) {
  const { cursoId } = await params;

  const docente = await requerirDocente();

  const busqueda = Object.fromEntries(
    new URL(request.url).searchParams
  ) as BusquedaInforme;

  const lectura = leerParametros(busqueda);
  if (lectura.estado !== "ok") {
    return new Response("Elegí un período válido para generar el informe", { status: 400 });
  }

  const informe = await informeGeneral(cursoId, docente.id, lectura.parametros);
  if (!informe) return new Response("Curso no encontrado", { status: 404 });

  const alumno = informe.esIndividual ? informe.alumnos[0] : null;
  if (informe.esIndividual && !alumno) {
    return new Response("El alumno no está en el curso en ese período", { status: 404 });
  }

  const pdf = await renderToBuffer(
    <InformeGeneralPdf
      informe={informe}
      generadoEl={aFechaLegible(aFecha(diaEnZona()))}
      aprobacion={NOTA_APROBACION}
      conDetalle={lectura.parametros.detalle}
    />
  );

  const rango = `${informe.periodo.desdeTexto} al ${informe.periodo.hastaTexto}`.replace(
    /\//g,
    "-"
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": cabeceraDeDescarga(
        nombreDeArchivo([
          "Evaluacion general",
          alumno ? alumno.nombreCompleto : informe.curso.nombre,
          rango,
        ])
      ),
      // El informe se rehace con cada cambio de rúbrica o de asistencia: nunca
      // se cachea.
      "Cache-Control": "no-store",
    },
  });
}
