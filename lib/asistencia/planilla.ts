import { db } from "@/lib/db";
import { aFechaLegible, resumenLista } from "@/lib/schemas/common";
import { CICLOS, ESTADOS_CLASE, NIVELES, TURNOS } from "@/lib/types";
import type { EstadoAsistencia } from "@prisma/client";

/**
 * La planilla de asistencia de un curso: qué se marcó para cada alumno en cada
 * clase, desde que el curso existe y sin recorte de fechas.
 *
 * Es la foto que la escuela pide en papel y la que la docente necesita cuando
 * alguien pregunta por las faltas de un alumno. La evaluación general
 * (`lib/evaluacion/informe-general`) también mira la asistencia, pero la mira
 * resumida y acotada a un período, porque ahí es un insumo de la nota: acá es
 * el documento mismo, clase por clase.
 *
 * No guarda nada ni decide nada: junta lo cargado y lo ordena. El PDF
 * (`components/asistencia/PlanillaAsistenciaPdf`) sólo acomoda lo que sale de
 * acá, no vuelve a la base ni rehace una cuenta.
 */

/** Redondeo a una cifra, igual que en el resto de la app. */
const redondear = (valor: number) => Math.round(valor * 10) / 10;

export type ConteoDeAsistencia = {
  registros: number;
  presentes: number;
  ausentes: number;
  tardes: number;
  saf: number;
  /** `null` cuando no hay ni un registro que contar. */
  porcentaje: number | null;
};

/**
 * Una toma de asistencia: un día y, si la lista se pasó desde una clase, esa
 * clase.
 *
 * La unidad no es la clase sino el par (fecha, clase) porque `Asistencia` deja
 * `claseDiariaId` en `null` cuando la lista se pasó suelta, y su clave única
 * está armada sobre ese par. Agrupar por clase perdería justamente esas tomas.
 */
export type JornadaDeLaPlanilla = {
  clave: string;
  fecha: Date;
  /** `DD/MM/AAAA`, para las tablas donde entra completa. */
  fechaTexto: string;
  /** `DD/MM`, para el encabezado angosto de la grilla. */
  fechaCorta: string;
  /** Cuando ese día hubo más de una toma: 1, 2... Si hubo una sola, `null`. */
  orden: number | null;
  horario: string | null;
  tema: string | null;
  /** El estado de la clase, ya en castellano. `null` si la lista fue suelta. */
  estadoClase: string | null;
  conteo: ConteoDeAsistencia;
};

export type AlumnoDeLaPlanilla = {
  id: string;
  nombreCompleto: string;
  /** Un casillero por jornada, en el mismo orden que `jornadas`. `null` = sin cargar. */
  estados: (EstadoAsistencia | null)[];
  conteo: ConteoDeAsistencia;
};

export type PlanillaDeAsistencia = {
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
  jornadas: JornadaDeLaPlanilla[];
  alumnos: AlumnoDeLaPlanilla[];
  /** El curso entero sumado: es la fila de totales de las tablas. */
  total: ConteoDeAsistencia;
  /** Promedio de los porcentajes de los alumnos que tienen registros. */
  promedioAsistencia: number | null;
  /** Desde la primera toma hasta la última. `null` si no hay ninguna. */
  periodo: { desdeTexto: string; hastaTexto: string } | null;
};

const conteoVacio = (): ConteoDeAsistencia => ({
  registros: 0,
  presentes: 0,
  ausentes: 0,
  tardes: 0,
  saf: 0,
  porcentaje: null,
});

function sumar(conteo: ConteoDeAsistencia, estado: EstadoAsistencia) {
  conteo.registros += 1;
  if (estado === "presente") conteo.presentes += 1;
  else if (estado === "tarde") conteo.tardes += 1;
  else if (estado === "SAF") conteo.saf += 1;
  else conteo.ausentes += 1;
}

/**
 * El porcentaje, una vez que ya están todos los registros.
 *
 * Cuenta como asistida toda clase en la que el alumno no estuvo ausente: llegar
 * tarde o estar con SAF (sin actividad física) es haber ido. Es la misma regla
 * que usa la evaluación general, y tiene que seguir siéndolo: si acá diera otro
 * número, la planilla y el informe del mismo curso se contradirían.
 */
function cerrar(conteo: ConteoDeAsistencia) {
  const asistidas = conteo.presentes + conteo.tardes + conteo.saf;
  conteo.porcentaje =
    conteo.registros === 0 ? null : redondear((asistidas / conteo.registros) * 100);
  return conteo;
}

/** La etiqueta en castellano de un enum, a partir de las listas de `types`. */
const etiqueta = <T extends string>(
  opciones: readonly { value: T; label: string }[],
  valor: T | null | undefined
) => (valor ? opciones.find((opcion) => opcion.value === valor)?.label ?? null : null);

/** `ESTADOS_CLASE` no trae "reprogramada": la pone `reprogramarClase`, no el formulario. */
const estadoDeClase = (valor: string) =>
  valor === "reprogramada"
    ? "Reprogramada"
    : ESTADOS_CLASE.find((opcion) => opcion.value === valor)?.label ?? null;

/**
 * Arma la planilla, acotada al docente de la sesión: un curso ajeno devuelve
 * `null` y la ruta hace 404.
 */
export async function planillaDeAsistencia(
  cursoId: string,
  docenteId: string
): Promise<PlanillaDeAsistencia | null> {
  // Las tres consultas son independientes y salen juntas: encadenadas eran tres
  // viajes a la base. Las clases ya vienen acotadas al docente por su propio
  // `where`, y si el curso no es suyo la función corta sin usar nada de lo demás.
  const [curso, clases, asistencias] = await Promise.all([
    db.curso.findFirst({
      where: { id: cursoId, docenteId },
      include: {
        institucion: { select: { nombre: true } },
        docente: { select: { nombre: true, apellido: true } },
        alumnos: { include: { alumno: { select: { id: true, nombre: true, apellido: true } } } },
      },
    }),

    db.claseDiaria.findMany({
      where: { unidadDidactica: { planificacion: { cursoId, docenteId } } },
      select: {
        id: true,
        horaInicio: true,
        horaFin: true,
        temaClase: true,
        estado: true,
      },
    }),

    db.asistencia.findMany({
      where: { cursoId },
      select: { alumnoId: true, fecha: true, estado: true, claseDiariaId: true },
    }),
  ]);
  if (!curso) return null;

  const clasePorId = new Map(clases.map((clase) => [clase.id, clase]));

  // Las jornadas salen de la asistencia y no de las clases: una clase sin lista
  // pasada no tiene nada que mostrar (sería una columna entera vacía), y una
  // lista pasada suelta, sin clase, no aparecería si se partiera de las clases.
  const jornadas = new Map<string, JornadaDeLaPlanilla>();
  const porAlumno = new Map<string, Map<string, EstadoAsistencia>>();
  const total = conteoVacio();

  for (const registro of asistencias) {
    const clave = `${registro.fecha.getTime()}|${registro.claseDiariaId ?? ""}`;

    let jornada = jornadas.get(clave);
    if (!jornada) {
      const clase = registro.claseDiariaId ? clasePorId.get(registro.claseDiariaId) : undefined;
      const fechaTexto = aFechaLegible(registro.fecha);

      jornada = {
        clave,
        fecha: registro.fecha,
        fechaTexto,
        // El `DD/MM` se recorta del texto ya formateado en vez de volver a leer
        // la fecha: `fecha` es medianoche UTC y en UTC-3 `getDate()` daría el
        // día anterior (ver `aFechaLegible`).
        fechaCorta: fechaTexto.slice(0, 5),
        orden: null,
        horario:
          clase?.horaInicio && clase.horaFin
            ? `${clase.horaInicio} a ${clase.horaFin}`
            : clase?.horaInicio ?? null,
        tema: clase ? resumenLista(clase.temaClase) || null : null,
        estadoClase: clase ? estadoDeClase(clase.estado) : null,
        conteo: conteoVacio(),
      };
      jornadas.set(clave, jornada);
    }

    sumar(jornada.conteo, registro.estado);
    sumar(total, registro.estado);

    const casilleros = porAlumno.get(registro.alumnoId) ?? new Map<string, EstadoAsistencia>();
    casilleros.set(clave, registro.estado);
    porAlumno.set(registro.alumnoId, casilleros);
  }

  const ordenadas = [...jornadas.values()].sort(
    (a, b) =>
      a.fecha.getTime() - b.fecha.getTime() ||
      // Sin hora cargada la jornada va al final del día; la clave desempata para
      // que dos corridas del mismo PDF den siempre el mismo orden.
      (a.horario ?? "99:99").localeCompare(b.horario ?? "99:99") ||
      a.clave.localeCompare(b.clave)
  );

  // El número de toma sólo se muestra donde hace falta distinguir: si ese día
  // hubo una sola, la fecha ya la identifica.
  const porDia = new Map<number, JornadaDeLaPlanilla[]>();
  for (const jornada of ordenadas) {
    const delDia = porDia.get(jornada.fecha.getTime()) ?? [];
    delDia.push(jornada);
    porDia.set(jornada.fecha.getTime(), delDia);
  }
  for (const delDia of porDia.values()) {
    if (delDia.length < 2) continue;
    delDia.forEach((jornada, indice) => {
      jornada.orden = indice + 1;
    });
  }

  for (const jornada of ordenadas) cerrar(jornada.conteo);
  cerrar(total);

  const alumnos: AlumnoDeLaPlanilla[] = curso.alumnos
    .map(({ alumno }) => {
      const casilleros = porAlumno.get(alumno.id);
      const conteo = conteoVacio();
      const estados = ordenadas.map((jornada) => {
        const estado = casilleros?.get(jornada.clave) ?? null;
        if (estado) sumar(conteo, estado);
        return estado;
      });

      return {
        id: alumno.id,
        nombreCompleto: `${alumno.apellido}, ${alumno.nombre}`,
        estados,
        conteo: cerrar(conteo),
      };
    })
    .sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto, "es", { sensitivity: "base" })
    );

  const porcentajes = alumnos
    .map((alumno) => alumno.conteo.porcentaje)
    .filter((valor): valor is number => valor !== null);

  return {
    curso: {
      id: curso.id,
      nombre: curso.nombre,
      nivel: etiqueta(NIVELES, curso.nivel),
      ciclo: CICLOS.find((ciclo) => ciclo.value === curso.ciclo)?.label ?? null,
      turno: etiqueta(TURNOS, curso.turno),
      anioLectivo: curso.anioLectivo,
    },
    institucion: curso.institucion.nombre,
    docente: `${curso.docente.nombre} ${curso.docente.apellido}`.trim(),
    jornadas: ordenadas,
    alumnos,
    total,
    promedioAsistencia:
      porcentajes.length === 0
        ? null
        : redondear(porcentajes.reduce((suma, valor) => suma + valor, 0) / porcentajes.length),
    periodo:
      ordenadas.length === 0
        ? null
        : {
            desdeTexto: ordenadas[0].fechaTexto,
            hastaTexto: ordenadas[ordenadas.length - 1].fechaTexto,
          },
  };
}
