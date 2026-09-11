import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import {
  fechaConDia,
  planDeClase,
  type ActividadDelPlan,
  type PlanDeClase,
} from "@/lib/clases/plan-clase";
import { aFecha, aFechaLegible, diaEnZona } from "@/lib/schemas/common";
import BarraPlan from "@/components/clase/BarraPlan";
import VisorHoja from "@/components/clase/VisorHoja";

/**
 * La vista previa del plan de clase: la misma hoja A4 que sale en el PDF, para
 * revisarla antes de guardarla.
 *
 * Es la información de la pantalla de la clase ordenada con el formato que
 * piden los institutos: la ficha de datos arriba, la secuencia en columnas
 * (actividades, estrategias, recursos y duración) y abajo la evaluación y un
 * espacio en blanco para las observaciones. El archivo que se descarga lo arma
 * `plan/pdf/route.tsx`, que tiene que seguir mostrando lo mismo que esta hoja.
 */

const ESTADOS_A_AVISAR: Record<string, string> = {
  suspendida: "Clase suspendida: no se dictó",
  cancelada: "Clase cancelada",
  reprogramada: "Clase reprogramada",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cursoId: string; claseId: string }>;
}) {
  const { cursoId, claseId } = await params;

  // El navegador propone el `<title>` como nombre del archivo PDF, así que vale
  // la pena que diga de qué clase es. Se consulta sólo lo que entra en el nombre.
  const clase = await db.claseDiaria.findFirst({
    where: { id: claseId, unidadDidactica: { planificacion: { cursoId } } },
    select: {
      fecha: true,
      unidadDidactica: { select: { planificacion: { select: { curso: { select: { nombre: true } } } } } },
    },
  });
  if (!clase) return { title: "Plan de clase" };

  const curso = clase.unidadDidactica.planificacion.curso.nombre;
  // Sin barras: son separadores de carpeta en el nombre del archivo.
  return { title: `Plan de clase - ${curso} - ${aFechaLegible(clase.fecha).replace(/\//g, "-")}` };
}

export default async function PlanDeClasePage({
  params,
}: {
  params: Promise<{ cursoId: string; claseId: string }>;
}) {
  const { cursoId, claseId } = await params;

  const docente = await requerirDocente();
  const plan = await planDeClase(claseId, cursoId, docente.id);
  if (!plan) notFound();

  const { clase, unidad, curso, institucion, partes, materiales, indicadores } = plan;
  const aviso = ESTADOS_A_AVISAR[clase.estado];

  return (
    <div className="plan-lienzo">
      <BarraPlan
        volverA={`/cursos/${cursoId}/clase/${claseId}`}
        descargarEn={`/cursos/${cursoId}/clase/${claseId}/plan/pdf`}
      />

      <VisorHoja>
        <article className="plan-hoja">
          <header className="plan-encabezado">
            <div>
              <h1 className="plan-titulo">Plan de clase</h1>
              <p className="plan-bajada">
                {curso.nombre}
                {unidad.titulo && ` · Unidad didáctica N° ${unidad.numero}: ${unidad.titulo}`}
              </p>
            </div>
            <div className="plan-institucion">
              <strong>{institucion.nombre}</strong>
              <span>Año lectivo {curso.anioLectivo}</span>
            </div>
          </header>

          {aviso && (
            <p className="plan-aviso">
              {aviso}
              {clase.motivoCancelacion && ` — ${clase.motivoCancelacion}`}
            </p>
          )}

          <section className="plan-ficha">
            <Dato etiqueta="Docente" valor={`Prof. ${plan.docente}`} columnas={2} />
            <Dato etiqueta="Fecha" valor={fechaConDia(clase.fecha)} />
            <Dato
              etiqueta="Horario"
              valor={
                clase.horaInicio && clase.horaFin ? `${clase.horaInicio} a ${clase.horaFin}` : null
              }
            />
            <Dato etiqueta="Curso" valor={curso.nombre} />
            <Dato
              etiqueta="Nivel y ciclo"
              valor={[curso.nivel, curso.ciclo].filter(Boolean).join(" · ")}
            />
            <Dato etiqueta="Turno" valor={curso.turno} />
            <Dato etiqueta="Cantidad de alumnos" valor={String(curso.cantidadAlumnos)} />
            <Dato etiqueta="Eje / NAP" valor={clase.eje} columnas={3} />
            <Dato
              etiqueta="Duración total"
              valor={plan.minutosTotales > 0 ? `${plan.minutosTotales} min` : null}
            />
          </section>

          <section className="plan-columnas plan-seccion">
            <Caja titulo="Tema general" items={clase.tema} />
            <Caja titulo="Objetivos específicos" items={clase.objetivos} />
            <Caja titulo="Contenidos" items={clase.contenidos} />
          </section>

          <section className="plan-seccion">
            <h2 className="plan-seccion-titulo">Desarrollo de la clase</h2>
            <TablaSecuencia partes={partes} minutosTotales={plan.minutosTotales} />
          </section>

          <section className="plan-columnas-2 plan-seccion">
            <Caja
              titulo="Evaluación de la clase · indicadores"
              items={indicadores.map((indicador) =>
                indicador.rubrica ? `${indicador.rubrica}: ${indicador.nombre}` : indicador.nombre
              )}
              vacio="Sin indicadores cargados para esta clase."
            />
            <Caja
              titulo="Recursos materiales"
              items={materiales}
              vacio="Sin materiales cargados."
            />
          </section>

          <section className="plan-seccion">
            <h2 className="plan-seccion-titulo">Observaciones</h2>
            <p className="plan-vacio no-imprimir">
              Espacio para anotar a mano lo que pasó en la clase.
            </p>
            <div className="plan-renglones" />
          </section>

          <footer className="plan-pie">
            <span>Planificador EF · Generado el {aFechaLegible(aFecha(diaEnZona()))}</span>
            <span>
              {institucion.nombre} · {curso.nombre} · {aFechaLegible(clase.fecha)}
            </span>
          </footer>
        </article>
      </VisorHoja>
    </div>
  );
}

/**
 * Un casillero de la ficha de datos. Los campos sin cargar quedan en blanco.
 * `columnas` es cuántas de las cuatro de la grilla ocupa: los valores largos
 * (el docente, el eje) piden más de una para no partirse en varias líneas.
 */
function Dato({
  etiqueta,
  valor,
  columnas = 1,
}: {
  etiqueta: string;
  valor: string | null;
  columnas?: 1 | 2 | 3;
}) {
  return (
    <div className={`plan-dato${columnas > 1 ? ` plan-dato-${columnas}` : ""}`}>
      <span className="plan-etiqueta">{etiqueta}</span>
      <span className="plan-valor">{valor || <span className="plan-vacio">—</span>}</span>
    </div>
  );
}

/** Caja con título y lista de ítems: tema, objetivos, contenidos, indicadores. */
function Caja({ titulo, items, vacio }: { titulo: string; items: string[]; vacio?: string }) {
  return (
    <div className="plan-caja">
      <h2 className="plan-seccion-titulo">{titulo}</h2>
      {items.length === 0 ? (
        <p className="plan-vacio">{vacio ?? "Sin cargar."}</p>
      ) : (
        <ul className="plan-lista">
          {items.map((item, indice) => (
            <li key={`${indice}-${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * La secuencia de la clase: una franja por parte (inicial, principal y final) y
 * debajo sus actividades, cada una con su estrategia, sus recursos y su
 * duración en la misma fila. En el plan de papel esas tres columnas van sueltas
 * al costado de todas las actividades juntas y no se sabe cuál corresponde a
 * cuál: acá quedan alineadas con la actividad que les toca.
 */
function TablaSecuencia({
  partes,
  minutosTotales,
}: {
  partes: PlanDeClase["partes"];
  minutosTotales: number;
}) {
  return (
    <table className="plan-tabla">
      <colgroup>
        <col style={{ width: "47%" }} />
        <col style={{ width: "17%" }} />
        <col style={{ width: "23%" }} />
        <col style={{ width: "13%" }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Actividades</th>
          <th scope="col">Estrategia metodológica</th>
          <th scope="col">Recursos</th>
          <th scope="col" className="plan-duracion">
            Duración
          </th>
        </tr>
      </thead>
      <tbody>
        {partes.length === 0 && (
          <tr>
            <td colSpan={4} className="plan-vacio">
              Esta clase todavía no tiene actividades cargadas.
            </td>
          </tr>
        )}

        {partes.map((parte) => (
          <Fragmento key={parte.tipo} parte={parte} />
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} className="plan-total-etiqueta">
            Duración total de la clase
          </td>
          <td className="plan-duracion">{minutosTotales} min</td>
        </tr>
      </tfoot>
    </table>
  );
}

/** La franja de una parte y las filas de sus actividades. */
function Fragmento({ parte }: { parte: PlanDeClase["partes"][number] }) {
  return (
    <>
      <tr className="plan-parte">
        <td colSpan={3}>
          <span className="plan-parte-nombre">
            {parte.parte} <span className="plan-parte-bloque">· {parte.bloque}</span>
          </span>
        </td>
        <td className="plan-duracion">{parte.minutos} min</td>
      </tr>
      {parte.actividades.map((actividad, indice) => (
        <FilaActividad key={actividad.id} actividad={actividad} numero={indice + 1} />
      ))}
    </>
  );
}

function FilaActividad({ actividad, numero }: { actividad: ActividadDelPlan; numero: number }) {
  return (
    <tr>
      <td>
        <span className="plan-orden">{numero}. </span>
        <span className="plan-actividad-nombre">{actividad.nombre}</span>
        {actividad.descripcion.length > 0 && (
          <div className="plan-actividad-detalle">
            {actividad.descripcion.length === 1 ? (
              actividad.descripcion[0]
            ) : (
              <ul className="plan-lista">
                {actividad.descripcion.map((linea, indice) => (
                  <li key={`${indice}-${linea}`}>{linea}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </td>
      <td>{actividad.estrategia ?? <span className="plan-vacio">—</span>}</td>
      <td className="plan-recursos">
        {actividad.materiales.length > 0 ? (
          actividad.materiales.join(", ")
        ) : (
          <span className="plan-vacio">Sin materiales</span>
        )}
      </td>
      <td className="plan-duracion">{actividad.duracionMinutos} min</td>
    </tr>
  );
}
