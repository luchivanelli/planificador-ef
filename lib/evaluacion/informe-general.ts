import { db } from "@/lib/db";
import { aFecha, aFechaLegible, itemsDeLista, resumenLista } from "@/lib/schemas/common";
import { CICLOS, NIVELES, TURNOS } from "@/lib/types";
import type { ParametrosInforme } from "./parametros";

/**
 * La evaluación general de un período: qué nota le daría el sistema a cada
 * alumno mirando todo lo que ya está cargado entre dos fechas.
 *
 * No guarda nada. La nota sugerida se recalcula cada vez a partir de las
 * rúbricas de las clases del período y de la asistencia, así que si la docente
 * corrige un puntaje o marca una falta, el informe siguiente ya lo refleja. Es
 * una referencia para decidir, no la nota: la nota la pone la docente.
 *
 * La pantalla (`app/(dashboard)/evaluacion/[cursoId]`) y el PDF
 * (`app/(impresion)/evaluacion/[cursoId]/pdf`) sólo acomodan lo que sale de
 * acá: ninguno de los dos vuelve a la base ni rehace una cuenta.
 */

/** Por debajo de este porcentaje de asistencia el informe lo avisa. */
export const ASISTENCIA_MINIMA = 75;

/** Nota desde la cual la sugerencia se considera aprobada. */
export const NOTA_APROBACION = 6;

/** La escala de las rúbricas: `EvaluacionDetalle.valor` va del 1 al 10. */
const NOTA_MAXIMA = 10;
const NOTA_MINIMA = 1;

/** La etiqueta en castellano de un enum, a partir de las listas de `types`. */
const etiqueta = <T extends string>(
  opciones: readonly { value: T; label: string }[],
  valor: T | null | undefined
) => (valor ? opciones.find((opcion) => opcion.value === valor)?.label ?? null : null);

const promedio = (valores: number[]) =>
  valores.length === 0 ? null : valores.reduce((total, valor) => total + valor, 0) / valores.length;

/** Redondeo a una cifra: las notas y los porcentajes se muestran así en todos lados. */
export const redondear = (valor: number, decimales = 1) => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};

const redondearONull = (valor: number | null) => (valor === null ? null : redondear(valor));

/** Las notas se escriben con coma, igual que en pantalla. */
const conComa = (valor: number) => String(valor).replace(".", ",");

export type IndicadorDelInforme = {
  /** El nombre con el que se cargó la primera vez en el período. */
  nombre: string;
  /** Cuántas veces se puntuó este indicador en el período. */
  veces: number;
  promedio: number;
};

export type ClaseEvaluadaDelInforme = {
  claseId: string;
  fecha: Date;
  fechaTexto: string;
  tema: string;
  rubrica: string;
  indicadores: { nombre: string; valor: number }[];
  promedio: number;
  observacion: string | null;
};

export type AsistenciaDelInforme = {
  registros: number;
  presentes: number;
  tardes: number;
  ausentes: number;
  saf: number;
  /** `null` cuando no hay ni un registro en el período. */
  porcentaje: number | null;
};

export type NotaDelInforme = {
  /** La nota sugerida, del 1 al 10 con un decimal. `null` si no hay con qué. */
  valor: number | null;
  /** La misma nota en entero, que es como se vuelca en la libreta. */
  redondeada: number | null;
  notaRubricas: number | null;
  notaAsistencia: number | null;
  /** Los pesos con los que salió esta nota, que no siempre son los pedidos. */
  pesoRubricas: number;
  pesoAsistencia: number;
  /** Por qué la nota salió con otros pesos, o por qué no salió. */
  aclaracion: string | null;
};

export type AlumnoDelInforme = {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  /** Clases del período en las que tiene al menos un indicador puntuado. */
  clasesEvaluadas: number;
  /** Cuántos puntajes de indicador entraron en el promedio. */
  puntajes: number;
  promedioRubricas: number | null;
  indicadores: IndicadorDelInforme[];
  clases: ClaseEvaluadaDelInforme[];
  asistencia: AsistenciaDelInforme;
  nota: NotaDelInforme;
  /**
   * El seguimiento general del alumno (`Alumno.observaciones`), tal como se
   * carga desde la ficha del curso. Es contexto para leer la nota, no una parte
   * de ella: no entra en ninguna cuenta.
   */
  seguimiento: string[];
  /**
   * Lo que la docente anotó al evaluar cada clase, junto en un solo lugar.
   * También es contexto: no afecta la nota.
   */
  observacionesDeClase: { fechaTexto: string; rubrica: string; texto: string }[];
  /** Lo que conviene mirar antes de cerrar la nota. */
  alertas: string[];
};

export type InformeGeneral = {
  curso: {
    id: string;
    nombre: string;
    nivel: string | null;
    ciclo: string | null;
    turno: string | null;
    anioLectivo: number;
  };
  institucion: string;
  docente: string;
  periodo: { desde: string; hasta: string; desdeTexto: string; hastaTexto: string };
  clases: {
    /** Clases del curso con fecha dentro del período. */
    total: number;
    dictadas: number;
    /** De esas, cuántas tienen al menos una rúbrica armada. */
    conRubrica: number;
  };
  alumnos: AlumnoDelInforme[];
  /** Promedios del curso, sobre los alumnos que tienen el dato. */
  promedios: {
    rubricas: number | null;
    asistencia: number | null;
    nota: number | null;
    /** Cuántos alumnos quedarían por debajo de la nota de aprobación. */
    porDebajo: number;
  };
  pesoRubricas: number;
  /** El informe de un solo alumno trae uno; el del curso, todos. */
  esIndividual: boolean;
};

/**
 * La nota sugerida: el promedio de las rúbricas y la asistencia, combinados con
 * el peso que eligió la docente.
 *
 * Si falta una de las dos patas la nota sale igual con la que haya, pero lo
 * aclara: un 10 porque el alumno nunca faltó y nunca fue evaluado no le sirve a
 * nadie si no dice de dónde salió.
 */
function calcularNota(
  promedioRubricas: number | null,
  porcentajeAsistencia: number | null,
  pesoPedido: number
): NotaDelInforme {
  // La asistencia se lleva a la misma escala que las rúbricas: 100% es un 10.
  const notaAsistencia =
    porcentajeAsistencia === null ? null : redondear((porcentajeAsistencia / 100) * NOTA_MAXIMA, 2);
  const notaRubricas = promedioRubricas === null ? null : redondear(promedioRubricas, 2);

  if (notaRubricas === null && notaAsistencia === null) {
    return {
      valor: null,
      redondeada: null,
      notaRubricas,
      notaAsistencia,
      pesoRubricas: pesoPedido,
      pesoAsistencia: 100 - pesoPedido,
      aclaracion: "No hay evaluaciones ni asistencia cargadas en el período.",
    };
  }

  let pesoRubricas = pesoPedido;
  let aclaracion: string | null = null;

  if (notaRubricas === null) {
    pesoRubricas = 0;
    aclaracion = "Sin rúbricas evaluadas en el período: la nota sale sólo de la asistencia.";
  } else if (notaAsistencia === null) {
    pesoRubricas = 100;
    aclaracion = "Sin asistencia registrada en el período: la nota sale sólo de las rúbricas.";
  } else if (pesoPedido === 100) {
    aclaracion = "La asistencia no entra en la nota: se muestra sólo como referencia.";
  }

  const pesoAsistencia = 100 - pesoRubricas;
  const bruta = ((notaRubricas ?? 0) * pesoRubricas + (notaAsistencia ?? 0) * pesoAsistencia) / 100;

  // Nunca menos de 1 ni más de 10: con 0% de asistencia la cuenta da 0, que no
  // es una nota de la escala.
  const valor = redondear(Math.min(NOTA_MAXIMA, Math.max(NOTA_MINIMA, bruta)));

  return {
    valor,
    redondeada: Math.round(valor),
    notaRubricas,
    notaAsistencia,
    pesoRubricas,
    pesoAsistencia,
    aclaracion,
  };
}

/**
 * Arma el informe del período, acotado al docente de la sesión: un curso ajeno
 * devuelve `null` y la pantalla hace 404.
 */
export async function informeGeneral(
  cursoId: string,
  docenteId: string,
  parametros: ParametrosInforme
): Promise<InformeGeneral | null> {
  const desde = aFecha(parametros.desde);
  const hasta = aFecha(parametros.hasta);

  // Las fechas de clase y de asistencia se guardan a medianoche UTC (ver
  // `aFecha`), así que `lte: hasta` ya incluye el último día. `fechaAlta`, en
  // cambio, es un timestamp completo: para ése va el día siguiente exclusivo.
  const finExclusivo = new Date(hasta);
  finExclusivo.setUTCDate(finExclusivo.getUTCDate() + 1);

  // Las tres consultas del informe son independientes entre sí y salen juntas:
  // encadenadas eran tres viajes a la base, y es la pantalla más pesada de la
  // app. Las clases ya vienen acotadas al docente por su propio `where`, y si
  // el curso no es suyo la función devuelve `null` sin usar nada de lo demás.
  const [curso, clases, asistencias] = await Promise.all([
    db.curso.findFirst({
      where: { id: cursoId, docenteId },
      include: {
        institucion: { select: { nombre: true } },
        docente: { select: { nombre: true, apellido: true } },
        alumnos: {
          // Los que estuvieron en el curso en algún momento del período: quien se
          // dio de baja después del cierre igual tiene que salir en el informe.
          where: {
            fechaAlta: { lt: finExclusivo },
            OR: [{ fechaBaja: null }, { fechaBaja: { gte: desde } }],
            ...(parametros.alumnoId ? { alumnoId: parametros.alumnoId } : {}),
          },
          include: {
            alumno: {
              select: { id: true, nombre: true, apellido: true, observaciones: true },
            },
          },
        },
      },
    }),

    db.claseDiaria.findMany({
      where: {
        unidadDidactica: { planificacion: { cursoId, docenteId } },
        fecha: { gte: desde, lte: hasta },
      },
      select: {
        id: true,
        fecha: true,
        estado: true,
        temaClase: true,
        rubricas: {
          select: { id: true, nombre: true, indicadores: { select: { id: true, nombre: true } } },
          orderBy: { nombre: "asc" },
        },
        evaluaciones: {
          // El informe de un alumno no necesita traerse el curso entero.
          where: parametros.alumnoId ? { alumnoId: parametros.alumnoId } : undefined,
          select: {
            alumnoId: true,
            rubricaId: true,
            observacionDocente: true,
            detalles: { select: { indicadorId: true, valor: true } },
          },
        },
      },
      orderBy: { fecha: "asc" },
    }),

    db.asistencia.findMany({
      where: {
        cursoId,
        fecha: { gte: desde, lte: hasta },
        ...(parametros.alumnoId ? { alumnoId: parametros.alumnoId } : {}),
      },
      select: { alumnoId: true, estado: true },
    }),
  ]);
  if (!curso) return null;

  // La asistencia se cuenta de una sola pasada, para no recorrerla por alumno.
  const asistenciaPorAlumno = new Map<string, AsistenciaDelInforme>();
  for (const registro of asistencias) {
    const actual = asistenciaPorAlumno.get(registro.alumnoId) ?? {
      registros: 0,
      presentes: 0,
      tardes: 0,
      ausentes: 0,
      saf: 0,
      porcentaje: null,
    };

    actual.registros += 1;
    if (registro.estado === "presente") actual.presentes += 1;
    else if (registro.estado === "tarde") actual.tardes += 1;
    else if (registro.estado === "SAF") actual.saf += 1;
    else actual.ausentes += 1;

    asistenciaPorAlumno.set(registro.alumnoId, actual);
  }

  // Un mismo indicador se carga de nuevo en cada clase ("Trabajo en equipo"
  // aparece en seis rúbricas distintas), así que para el resumen del período se
  // agrupan por nombre, que es lo que la docente quiere seguir a lo largo del
  // tiempo. La clave ignora mayúsculas y espacios de más; se muestra el nombre
  // tal como se escribió la primera vez.
  const claveIndicador = (nombre: string) => nombre.trim().toLocaleLowerCase("es");

  // Los índices se arman una sola vez, antes de recorrer los alumnos.
  //
  // Buscar la evaluación de un alumno era recorrer todas las evaluaciones de la
  // clase, y buscar el puntaje de un indicador era recorrer todos los detalles
  // de esa evaluación; las dos búsquedas se repetían por alumno, por clase y
  // por rúbrica. Un curso de treinta alumnos con cuarenta clases evaluadas daba
  // decenas de miles de recorridas para armar un informe. Con los índices cada
  // búsqueda es directa y el informe sale del mismo dato, sin cambiar ninguna
  // cuenta: hay una sola evaluación por alumno y rúbrica, y un solo detalle por
  // indicador (lo garantizan las claves de `EvaluacionAlumno` y `EvaluacionDetalle`).
  const indicePorClase = clases.map((clase) => {
    const porAlumnoYRubrica = new Map<
      string,
      { observacionDocente: string | null; valores: Map<string, number> }
    >();

    for (const evaluacion of clase.evaluaciones) {
      porAlumnoYRubrica.set(`${evaluacion.alumnoId}:${evaluacion.rubricaId}`, {
        observacionDocente: evaluacion.observacionDocente,
        valores: new Map(evaluacion.detalles.map((d) => [d.indicadorId, d.valor])),
      });
    }

    return porAlumnoYRubrica;
  });

  const alumnos: AlumnoDelInforme[] = curso.alumnos
    .map(({ alumno }) => {
      const clasesEvaluadas: ClaseEvaluadaDelInforme[] = [];
      const acumulado = new Map<string, { nombre: string; valores: number[] }>();
      const todosLosPuntajes: number[] = [];

      for (const [indice, clase] of clases.entries()) {
        for (const rubrica of clase.rubricas) {
          const evaluacion = indicePorClase[indice].get(`${alumno.id}:${rubrica.id}`);
          if (!evaluacion) continue;

          // Sólo los indicadores que siguen en la rúbrica y tienen puntaje: si
          // se agregó uno después de evaluar, este alumno no lo tiene cargado y
          // no puede bajarle el promedio (la misma regla que usa la pantalla de
          // evaluación de la clase para decidir si está completa).
          const puntuados = rubrica.indicadores
            .map((indicador) => ({
              nombre: indicador.nombre,
              valor: evaluacion.valores.get(indicador.id),
            }))
            .filter((item): item is { nombre: string; valor: number } => item.valor !== undefined);

          if (puntuados.length === 0) continue;

          for (const { nombre, valor } of puntuados) {
            const clave = claveIndicador(nombre);
            const entrada = acumulado.get(clave) ?? { nombre, valores: [] };
            entrada.valores.push(valor);
            acumulado.set(clave, entrada);
            todosLosPuntajes.push(valor);
          }

          clasesEvaluadas.push({
            claseId: clase.id,
            fecha: clase.fecha,
            fechaTexto: aFechaLegible(clase.fecha),
            tema: resumenLista(clase.temaClase),
            rubrica: rubrica.nombre,
            indicadores: puntuados,
            promedio: redondear(promedio(puntuados.map((p) => p.valor)) ?? 0, 2),
            observacion: evaluacion.observacionDocente,
          });
        }
      }

      const indicadores: IndicadorDelInforme[] = [...acumulado.values()]
        .map((entrada) => ({
          nombre: entrada.nombre,
          veces: entrada.valores.length,
          promedio: redondear(promedio(entrada.valores) ?? 0, 2),
        }))
        // Lo más flojo primero: es lo que hay que mirar antes de poner la nota.
        .sort((a, b) => a.promedio - b.promedio || a.nombre.localeCompare(b.nombre, "es"));

      const asistencia = asistenciaPorAlumno.get(alumno.id) ?? {
        registros: 0,
        presentes: 0,
        tardes: 0,
        ausentes: 0,
        saf: 0,
        porcentaje: null,
      };
      // Cuenta como asistida toda clase en la que el alumno no estuvo ausente:
      // llegar tarde o estar con SAF (sin actividad física) es haber ido.
      asistencia.porcentaje =
        asistencia.registros === 0
          ? null
          : redondear(
              ((asistencia.presentes + asistencia.tardes + asistencia.saf) / asistencia.registros) *
                100
            );

      const promedioRubricas = promedio(todosLosPuntajes);
      const nota = calcularNota(promedioRubricas, asistencia.porcentaje, parametros.pesoRubricas);

      const alertas: string[] = [];
      if (todosLosPuntajes.length === 0) alertas.push("Sin rúbricas evaluadas en el período");
      if (asistencia.registros === 0) alertas.push("Sin asistencia registrada en el período");
      if (asistencia.porcentaje !== null && asistencia.porcentaje < ASISTENCIA_MINIMA) {
        alertas.push(`Asistencia por debajo del ${ASISTENCIA_MINIMA}%`);
      }
      if (asistencia.saf > 0) {
        alertas.push(
          `${asistencia.saf} ${asistencia.saf === 1 ? "clase" : "clases"} con SAF (sin actividad física)`
        );
      }
      // Lo que cuenta para aprobar es la nota redondeada, que es la que va a la
      // libreta: un 5,5 redondea a 6 y no es lo mismo que un 5,4. El caso del
      // medio igual se avisa, porque es el que conviene mirar dos veces.
      if (nota.redondeada !== null && nota.redondeada < NOTA_APROBACION) {
        alertas.push("La nota sugerida no llega a la aprobación");
      } else if (nota.valor !== null && nota.valor < NOTA_APROBACION) {
        alertas.push(`La nota sugerida queda al límite: ${conComa(nota.valor)} redondea a ${nota.redondeada}`);
      }

      return {
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        nombreCompleto: `${alumno.apellido}, ${alumno.nombre}`,
        clasesEvaluadas: clasesEvaluadas.length,
        puntajes: todosLosPuntajes.length,
        promedioRubricas: promedioRubricas === null ? null : redondear(promedioRubricas, 2),
        indicadores,
        clases: clasesEvaluadas,
        asistencia,
        nota,
        // Observaciones y seguimiento: se juntan acá para mostrarlos, pero no
        // pasaron por `calcularNota` ni por ningún promedio. Son el contexto
        // que explica una nota, no un componente de la nota.
        seguimiento: itemsDeLista(alumno.observaciones),
        observacionesDeClase: clasesEvaluadas
          .filter((clase) => clase.observacion)
          .map((clase) => ({
            fechaTexto: clase.fechaTexto,
            rubrica: clase.rubrica,
            texto: clase.observacion!,
          })),
        alertas,
      };
    })
    .sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto, "es", { sensitivity: "base" })
    );

  const notas = alumnos.map((a) => a.nota.valor).filter((valor): valor is number => valor !== null);
  // Se cuentan los que no aprueban con la nota ya redondeada: es la que se
  // vuelca en la libreta, y es la misma regla que usan las alertas de arriba.
  const noAprueban = alumnos.filter(
    (a) => a.nota.redondeada !== null && a.nota.redondeada < NOTA_APROBACION
  ).length;

  return {
    curso: {
      id: curso.id,
      nombre: curso.nombre,
      nivel: etiqueta(NIVELES, curso.nivel),
      ciclo: CICLOS.find((c) => c.value === curso.ciclo)?.label ?? null,
      turno: etiqueta(TURNOS, curso.turno),
      anioLectivo: curso.anioLectivo,
    },
    institucion: curso.institucion.nombre,
    docente: `${curso.docente.nombre} ${curso.docente.apellido}`.trim(),
    periodo: {
      desde: parametros.desde,
      hasta: parametros.hasta,
      desdeTexto: aFechaLegible(desde),
      hastaTexto: aFechaLegible(hasta),
    },
    clases: {
      total: clases.length,
      dictadas: clases.filter((clase) => clase.estado === "dictada").length,
      conRubrica: clases.filter((clase) => clase.rubricas.length > 0).length,
    },
    alumnos,
    promedios: {
      rubricas: redondearONull(
        promedio(alumnos.map((a) => a.promedioRubricas).filter((v): v is number => v !== null))
      ),
      asistencia: redondearONull(
        promedio(alumnos.map((a) => a.asistencia.porcentaje).filter((v): v is number => v !== null))
      ),
      nota: redondearONull(promedio(notas)),
      porDebajo: noAprueban,
    },
    pesoRubricas: parametros.pesoRubricas,
    esIndividual: parametros.alumnoId !== null,
  };
}
