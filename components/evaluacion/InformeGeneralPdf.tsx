import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AlumnoDelInforme, InformeGeneral } from "@/lib/evaluacion/informe-general";
import { FUENTE, FUENTE_CURSIVA, FUENTE_NEGRITA } from "@/lib/pdf/tipografia";

/**
 * La evaluación general del período como PDF: la misma información que muestra
 * la pantalla, ordenada para el papel y para archivar.
 *
 * Trae dos documentos en uno, según lo que se haya pedido:
 * - el de un alumno, con el promedio de cada indicador del período;
 * - el del curso, con la tabla de todos y su nota sugerida, y opcionalmente una
 *   hoja por alumno con el mismo detalle (el parámetro `detalle` de la URL).
 *
 * Vale lo mismo que en `PlanClasePdf`: `@react-pdf/renderer` no entiende CSS,
 * acá todo es flexbox, puntos y porcentajes. Y la tipografía es Helvetica, que
 * no tiene la raya de diálogo (—): sale en blanco sin avisar, así que donde la
 * pantalla usa una raya, acá va un punto medio (·) o un guión común.
 */

const C = {
  tinta: "#111827",
  texto: "#333d4e",
  suave: "#6b7280",
  marca: "#4338ca",
  marcaFondo: "#eef2ff",
  linea: "#c8cedb",
  lineaSuave: "#e5e8ef",
  fondoSuave: "#f6f7fb",
  vacio: "#9aa1ae",
  bien: "#047857",
  bienFondo: "#ecfdf5",
  atencion: "#b45309",
  atencionFondo: "#fffbeb",
  mal: "#b91c1c",
  malFondo: "#fef2f2",
};

/** Las columnas de la tabla del curso, en un solo lugar. */
const COLUMNAS = {
  alumno: "34%",
  clases: "12%",
  rubricas: "14%",
  asistencia: "14%",
  nota: "13%",
  libreta: "13%",
} as const;

/** Las columnas del detalle de indicadores de un alumno. */
const INDICADOR = { nombre: "66%", veces: "17%", promedio: "17%" } as const;


const s = StyleSheet.create({
  pagina: {
    paddingTop: 34,
    paddingBottom: 44,
    paddingHorizontal: 31,
    fontSize: 8.5,
    lineHeight: 1.45,
    color: C.texto,
    fontFamily: FUENTE,
  },

  // --- Encabezado ---
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: C.marca,
    paddingBottom: 8,
  },
  titulo: { fontSize: 17, fontFamily: FUENTE_NEGRITA, color: C.tinta, paddingBottom: 4 },
  bajada: { fontSize: 8.5, color: C.suave, marginTop: 3 },
  institucion: { maxWidth: 200, textAlign: "right" },
  institucionNombre: { fontSize: 9.5, fontFamily: FUENTE_NEGRITA, color: C.tinta },
  institucionDato: { fontSize: 7.5, color: C.suave },

  // --- Ficha de datos ---
  ficha: { marginTop: 11, borderWidth: 1, borderColor: C.linea },
  fichaFila: { flexDirection: "row" },
  dato: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRightWidth: 0.75,
    borderRightColor: C.lineaSuave,
  },
  etiqueta: { fontSize: 5.8, fontFamily: FUENTE_NEGRITA, color: C.suave, letterSpacing: 0.7 },
  valor: { fontSize: 8.5, fontFamily: FUENTE_NEGRITA, color: C.tinta, marginTop: 1 },

  // --- Secciones ---
  seccion: { marginTop: 11 },
  seccionTitulo: {
    fontSize: 6.6,
    fontFamily: FUENTE_NEGRITA,
    color: C.marca,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  // Sin `flex`: la caja va suelta en una columna, y con `flex: 1` yoga le fija
  // una altura que no crece con el texto, así que el párrafo se salía del
  // recuadro. Sin eso se estira sola hasta cubrir todo lo que tiene adentro.
  caja: {
    borderWidth: 1,
    borderColor: C.linea,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  vacio: { color: C.vacio, fontFamily: FUENTE_CURSIVA },

  // --- Listas con viñeta ---
  item: { flexDirection: "row", marginTop: 3 },
  vineta: { width: 9, color: C.marca, fontFamily: FUENTE_NEGRITA },
  itemTexto: { flex: 1 },
  subtitulo: {
    fontSize: 6.2,
    fontFamily: FUENTE_NEGRITA,
    color: C.suave,
    letterSpacing: 0.6,
    marginBottom: 1,
  },

  // --- Tablas ---
  tabla: { borderWidth: 1, borderColor: C.linea },
  filaEncabezado: { flexDirection: "row", backgroundColor: C.fondoSuave },
  celdaEncabezado: {
    fontSize: 6,
    fontFamily: FUENTE_NEGRITA,
    color: C.suave,
    letterSpacing: 0.6,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
  },
  fila: { flexDirection: "row", borderTopWidth: 0.75, borderTopColor: C.linea },
  celda: {
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
  },
  centrada: { textAlign: "center", fontFamily: FUENTE_NEGRITA, color: C.tinta },
  nombre: { fontFamily: FUENTE_NEGRITA, color: C.tinta },
  filaTotal: {
    flexDirection: "row",
    backgroundColor: C.fondoSuave,
    borderTopWidth: 0.75,
    borderTopColor: C.linea,
  },
  totalEtiqueta: {
    fontSize: 6.6,
    fontFamily: FUENTE_NEGRITA,
    color: C.suave,
    letterSpacing: 0.6,
  },

  // --- La nota sugerida del alumno ---
  notaBloque: { flexDirection: "row", gap: 8, marginTop: 11 },
  notaCaja: {
    width: "26%",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  notaValor: { fontSize: 30, fontFamily: FUENTE_NEGRITA, lineHeight: 1 },
  notaPie: { fontSize: 7, fontFamily: FUENTE_NEGRITA, marginTop: 4 },
  aporte: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.linea,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  aporteNota: { fontSize: 12, fontFamily: FUENTE_NEGRITA, color: C.tinta },

  aclaracion: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#fcd9a4",
    borderLeftWidth: 2.5,
    borderLeftColor: C.atencion,
    backgroundColor: C.atencionFondo,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 7.8,
    color: C.atencion,
  },

  // --- Cierre y pie ---
  firma: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  firmaCaja: { flex: 1, borderWidth: 1, borderColor: C.linea, padding: 8 },
  firmaRenglon: { borderBottomWidth: 0.75, borderBottomColor: C.linea, height: 22 },
  pie: {
    position: "absolute",
    bottom: 22,
    left: 31,
    right: 31,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.75,
    borderTopColor: C.lineaSuave,
    paddingTop: 5,
    fontSize: 6.6,
    color: C.suave,
  },
});

/** Las notas se escriben con coma, igual que en pantalla. */
const conComa = (valor: number | null, vacio = "-") =>
  valor === null ? vacio : String(valor).replace(".", ",");

const porcentaje = (valor: number | null) => (valor === null ? "-" : `${conComa(valor)}%`);

/**
 * El color de una nota en el papel. Sigue la misma regla que `tonoDeNota` en
 * pantalla: por debajo de la aprobación en rojo, justo por encima en ámbar.
 */
function colorDeNota(valor: number | null, aprobacion: number) {
  if (valor === null) return { color: C.suave, borderColor: C.linea, backgroundColor: C.fondoSuave };
  if (Math.round(valor) < aprobacion) {
    return { color: C.mal, borderColor: "#f3c2c2", backgroundColor: C.malFondo };
  }
  if (valor < aprobacion + 1) {
    return { color: C.atencion, borderColor: "#fcd9a4", backgroundColor: C.atencionFondo };
  }
  return { color: C.bien, borderColor: "#a7e3c8", backgroundColor: C.bienFondo };
}

/** Un casillero de la ficha. El último de cada fila no lleva línea a la derecha. */
function Dato({
  etiqueta,
  valor,
  ancho,
  ultimo = false,
}: {
  etiqueta: string;
  valor: string | null;
  ancho: string;
  ultimo?: boolean;
}) {
  return (
    <View style={[s.dato, { width: ancho }, ultimo ? { borderRightWidth: 0 } : {}]}>
      <Text style={s.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <Text style={valor ? s.valor : [s.valor, s.vacio]}>{valor || "-"}</Text>
    </View>
  );
}

/** El encabezado y la ficha de datos: iguales en las dos formas del informe. */
function Portada({ informe }: { informe: InformeGeneral }) {
  const { curso, periodo } = informe;

  return (
    <>
      <View style={s.encabezado}>
        <View>
          <Text style={s.titulo}>Evaluación general</Text>
          <Text style={s.bajada}>
            {curso.nombre} · Del {periodo.desdeTexto} al {periodo.hastaTexto}
          </Text>
        </View>
        <View style={s.institucion}>
          <Text style={s.institucionNombre}>{informe.institucion}</Text>
          <Text style={s.institucionDato}>Año lectivo {curso.anioLectivo}</Text>
        </View>
      </View>

      <View style={s.ficha}>
        {/* Los anchos están repartidos según lo que mide cada valor: "Nivel y
            ciclo" y "Criterio de la nota" son los textos largos de la ficha y
            necesitan lugar para entrar en un renglón. */}
        <View style={[s.fichaFila, { borderBottomWidth: 0.75, borderBottomColor: C.lineaSuave }]}>
          <Dato etiqueta="Docente" valor={`Prof. ${informe.docente}`} ancho="32%" />
          <Dato etiqueta="Curso" valor={curso.nombre} ancho="20%" />
          <Dato
            etiqueta="Nivel y ciclo"
            valor={[curso.nivel, curso.ciclo].filter(Boolean).join(" · ") || null}
            ancho="30%"
          />
          <Dato etiqueta="Turno" valor={curso.turno} ancho="18%" ultimo />
        </View>
        <View style={s.fichaFila}>
          <Dato
            etiqueta="Período evaluado"
            valor={`${periodo.desdeTexto} al ${periodo.hastaTexto}`}
            ancho="30%"
          />
          <Dato
            etiqueta="Clases del período"
            valor={`${informe.clases.total} (${informe.clases.conRubrica} con rúbrica)`}
            ancho="22%"
          />
          <Dato
            etiqueta="Criterio de la nota"
            valor={`${informe.pesoRubricas}% rúbricas · ${100 - informe.pesoRubricas}% asistencia`}
            ancho="33%"
          />
          <Dato etiqueta="Alumnos" valor={String(informe.alumnos.length)} ancho="15%" ultimo />
        </View>
      </View>
    </>
  );
}

/** La tabla con todo el curso: una fila por alumno y los promedios abajo. */
function TablaDelCurso({ informe, aprobacion }: { informe: InformeGeneral; aprobacion: number }) {
  return (
    <View style={s.seccion}>
      <Text style={s.seccionTitulo}>NOTA SUGERIDA POR ALUMNO</Text>

      <View style={s.tabla}>
        {/* `fixed` repite el encabezado arriba de cada hoja si el curso no entra
            en una sola. */}
        <View style={s.filaEncabezado} fixed>
          <Text style={[s.celdaEncabezado, { width: COLUMNAS.alumno }]}>ALUMNO</Text>
          <Text style={[s.celdaEncabezado, { width: COLUMNAS.clases, textAlign: "center" }]}>
            CLASES EVAL.
          </Text>
          <Text style={[s.celdaEncabezado, { width: COLUMNAS.rubricas, textAlign: "center" }]}>
            PROM. RÚBRICAS
          </Text>
          <Text style={[s.celdaEncabezado, { width: COLUMNAS.asistencia, textAlign: "center" }]}>
            ASISTENCIA
          </Text>
          <Text style={[s.celdaEncabezado, { width: COLUMNAS.nota, textAlign: "center" }]}>
            NOTA SUGERIDA
          </Text>
          <Text
            style={[
              s.celdaEncabezado,
              { width: COLUMNAS.libreta, textAlign: "center", borderRightWidth: 0 },
            ]}
          >
            NOTA FINAL
          </Text>
        </View>

        {informe.alumnos.length === 0 && (
          <View style={s.fila}>
            <Text style={[s.celda, s.vacio, { width: "100%", borderRightWidth: 0 }]}>
              Este curso no tiene alumnos en el período elegido.
            </Text>
          </View>
        )}

        {informe.alumnos.map((alumno) => {
          const tono = colorDeNota(alumno.nota.valor, aprobacion);

          return (
            <View key={alumno.id} style={s.fila} wrap={false}>
              <View style={[s.celda, { width: COLUMNAS.alumno }]}>
                <Text style={s.nombre}>{alumno.nombreCompleto}</Text>
                {alumno.alertas.length > 0 && (
                  <Text style={{ fontSize: 6.8, color: C.atencion, marginTop: 1 }}>
                    {alumno.alertas.join(" · ")}
                  </Text>
                )}
              </View>
              <Text style={[s.celda, s.centrada, { width: COLUMNAS.clases }]}>
                {alumno.clasesEvaluadas}
              </Text>
              <Text style={[s.celda, s.centrada, { width: COLUMNAS.rubricas }]}>
                {conComa(alumno.promedioRubricas)}
              </Text>
              <Text style={[s.celda, s.centrada, { width: COLUMNAS.asistencia }]}>
                {porcentaje(alumno.asistencia.porcentaje)}
              </Text>
              <View
                style={[
                  s.celda,
                  { width: COLUMNAS.nota, backgroundColor: tono.backgroundColor },
                ]}
              >
                <Text style={[s.centrada, { color: tono.color, fontSize: 10 }]}>
                  {conComa(alumno.nota.valor)}
                </Text>
              </View>
              {/* Queda en blanco a propósito: es donde la docente escribe la
                  nota que finalmente pone. */}
              <Text style={[s.celda, { width: COLUMNAS.libreta, borderRightWidth: 0 }]}> </Text>
            </View>
          );
        })}

        <View style={s.filaTotal} wrap={false}>
          <Text style={[s.celda, s.totalEtiqueta, { width: COLUMNAS.alumno }]}>
            PROMEDIO DEL CURSO
          </Text>
          <Text style={[s.celda, s.centrada, { width: COLUMNAS.clases }]}> </Text>
          <Text style={[s.celda, s.centrada, { width: COLUMNAS.rubricas }]}>
            {conComa(informe.promedios.rubricas)}
          </Text>
          <Text style={[s.celda, s.centrada, { width: COLUMNAS.asistencia }]}>
            {porcentaje(informe.promedios.asistencia)}
          </Text>
          <Text style={[s.celda, s.centrada, { width: COLUMNAS.nota, fontSize: 10 }]}>
            {conComa(informe.promedios.nota)}
          </Text>
          <Text style={[s.celda, { width: COLUMNAS.libreta, borderRightWidth: 0 }]}> </Text>
        </View>
      </View>

      {informe.promedios.porDebajo > 0 && (
        <Text style={s.aclaracion}>
          {informe.promedios.porDebajo}{" "}
          {informe.promedios.porDebajo === 1
            ? "alumno queda por debajo"
            : "alumnos quedan por debajo"}{" "}
          de {aprobacion} con este criterio.
        </Text>
      )}
    </View>
  );
}

/** El bloque de la nota de un alumno: el número grande y de dónde sale. */
function NotaDelAlumno({ alumno, aprobacion }: { alumno: AlumnoDelInforme; aprobacion: number }) {
  const { nota, asistencia } = alumno;
  const tono = colorDeNota(nota.valor, aprobacion);

  return (
    <>
      <View style={s.notaBloque}>
        <View style={[s.notaCaja, { borderColor: tono.borderColor, backgroundColor: tono.backgroundColor }]}>
          <Text style={[s.notaValor, { color: tono.color }]}>{conComa(nota.valor)}</Text>
          <Text style={[s.notaPie, { color: tono.color }]}>
            {nota.redondeada === null ? "SIN NOTA" : `REDONDEADA: ${nota.redondeada}`}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={s.aporte}>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>
                Rúbricas
                <Text style={{ color: C.suave, fontFamily: FUENTE }}>
                  {"  "}
                  {nota.pesoRubricas}% de la nota
                </Text>
              </Text>
              <Text style={{ fontSize: 7.5, color: C.suave }}>
                {alumno.puntajes} {alumno.puntajes === 1 ? "puntaje" : "puntajes"} en{" "}
                {alumno.clasesEvaluadas}{" "}
                {alumno.clasesEvaluadas === 1 ? "clase evaluada" : "clases evaluadas"}
              </Text>
            </View>
            <Text style={s.aporteNota}>{conComa(nota.notaRubricas)}</Text>
          </View>

          <View style={[s.aporte, { marginBottom: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>
                Asistencia
                <Text style={{ color: C.suave, fontFamily: FUENTE }}>
                  {"  "}
                  {nota.pesoAsistencia}% de la nota
                </Text>
              </Text>
              <Text style={{ fontSize: 7.5, color: C.suave }}>
                {asistencia.registros === 0
                  ? "Sin registros de asistencia"
                  : `${asistencia.presentes} presentes · ${asistencia.tardes} tarde · ${asistencia.saf} SAF · ${asistencia.ausentes} ausentes (${porcentaje(asistencia.porcentaje)})`}
              </Text>
            </View>
            <Text style={s.aporteNota}>{conComa(nota.notaAsistencia)}</Text>
          </View>
        </View>
      </View>

      {nota.aclaracion && <Text style={s.aclaracion}>{nota.aclaracion}</Text>}
    </>
  );
}

/**
 * El detalle de un alumno: el promedio de cada indicador a lo largo del
 * período, las observaciones y lo que conviene mirar antes de cerrar la nota.
 *
 * El puntaje clase por clase queda sólo en la pantalla, que es donde se puede
 * desplegar la clase que interesa e ir a su evaluación: en el papel eran varias
 * tablas repetidas que alargaban el informe sin agregar nada que el promedio
 * por indicador no diga ya.
 */
function DetalleDelAlumno({
  alumno,
  aprobacion,
  conTitulo = false,
}: {
  alumno: AlumnoDelInforme;
  aprobacion: number;
  /** En el PDF del curso cada hoja necesita decir de quién es. */
  conTitulo?: boolean;
}) {
  return (
    <>
      {conTitulo && (
        <View
          style={{
            marginTop: 11,
            backgroundColor: C.marcaFondo,
            paddingVertical: 5,
            paddingHorizontal: 8,
          }}
        >
          <Text style={{ fontSize: 11, fontFamily: FUENTE_NEGRITA, color: C.marca }}>
            {alumno.nombreCompleto}
          </Text>
        </View>
      )}

      <NotaDelAlumno alumno={alumno} aprobacion={aprobacion} />

      <View style={s.seccion}>
        <Text style={s.seccionTitulo}>INDICADORES DEL PERÍODO</Text>
        <View style={s.tabla}>
          <View style={s.filaEncabezado}>
            <Text style={[s.celdaEncabezado, { width: INDICADOR.nombre }]}>INDICADOR</Text>
            <Text style={[s.celdaEncabezado, { width: INDICADOR.veces, textAlign: "center" }]}>
              VECES EVALUADO
            </Text>
            <Text
              style={[
                s.celdaEncabezado,
                { width: INDICADOR.promedio, textAlign: "center", borderRightWidth: 0 },
              ]}
            >
              PROMEDIO
            </Text>
          </View>

          {alumno.indicadores.length === 0 && (
            <View style={s.fila}>
              <Text style={[s.celda, s.vacio, { width: "100%", borderRightWidth: 0 }]}>
                Este alumno no tiene ningún indicador puntuado en el período.
              </Text>
            </View>
          )}

          {alumno.indicadores.map((indicador) => (
            <View key={indicador.nombre} style={s.fila} wrap={false}>
              <Text style={[s.celda, { width: INDICADOR.nombre }]}>{indicador.nombre}</Text>
              <Text style={[s.celda, s.centrada, { width: INDICADOR.veces }]}>
                {indicador.veces}
              </Text>
              <Text
                style={[
                  s.celda,
                  s.centrada,
                  {
                    width: INDICADOR.promedio,
                    borderRightWidth: 0,
                    color: colorDeNota(indicador.promedio, aprobacion).color,
                  },
                ]}
              >
                {conComa(indicador.promedio)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sólo si hay algo cargado: un recuadro que dice "no hay nada" ocupa
          media hoja para no aportar nada. */}
      {alumno.seguimiento.length > 0 && (
        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>SEGUIMIENTO Y OBSERVACIONES · NO AFECTAN LA NOTA</Text>
          <View style={s.caja}>
            {alumno.seguimiento.map((item, indice) => (
              <View key={`${indice}-${item}`} style={[s.item, indice === 0 ? { marginTop: 0 } : {}]}>
                <Text style={s.vineta}>•</Text>
                <Text style={s.itemTexto}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {alumno.alertas.length > 0 && (
        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>PARA MIRAR ANTES DE CERRAR LA NOTA</Text>
          <View style={s.caja}>
            {/* Cada aviso en su propia fila, con la viñeta en una columna fija:
                como párrafos sueltos se pegaban entre sí y no se distinguía
                dónde terminaba uno y empezaba el siguiente. */}
            {alumno.alertas.map((alerta, indice) => (
              <View key={alerta} style={[s.item, indice === 0 ? { marginTop: 0 } : {}]}>
                <Text style={s.vineta}>•</Text>
                <Text style={s.itemTexto}>{alerta}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

/** El pie de todas las hojas, con la aclaración de qué es esta nota. */
function Pie({ informe, generadoEl }: { informe: InformeGeneral; generadoEl: string }) {
  return (
    <View style={s.pie} fixed>
      <Text>Planificador EF · Generado el {generadoEl}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${informe.curso.nombre} · ${informe.periodo.desdeTexto} al ${informe.periodo.hastaTexto} · Hoja ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

export default function InformeGeneralPdf({
  informe,
  generadoEl,
  aprobacion,
  conDetalle,
}: {
  informe: InformeGeneral;
  /** Ya formateada afuera: acá no se toca el huso horario. */
  generadoEl: string;
  aprobacion: number;
  /** Suma una hoja por alumno con su detalle. Sólo aplica al informe del curso. */
  conDetalle: boolean;
}) {
  const alumno = informe.esIndividual ? informe.alumnos[0] : null;
  const titulo = alumno
    ? `Evaluación general - ${alumno.nombreCompleto} - ${informe.periodo.desdeTexto} al ${informe.periodo.hastaTexto}`
    : `Evaluación general - ${informe.curso.nombre} - ${informe.periodo.desdeTexto} al ${informe.periodo.hastaTexto}`;

  return (
    <Document title={titulo} author={`Prof. ${informe.docente}`} subject="Evaluación general del período">
      <Page size="A4" style={s.pagina}>
        <Portada informe={informe} />

        {alumno ? (
          <DetalleDelAlumno alumno={alumno} aprobacion={aprobacion} />
        ) : (
          <TablaDelCurso informe={informe} aprobacion={aprobacion} />
        )}

        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>CÓMO SE CALCULA LA NOTA SUGERIDA</Text>
          <View style={s.caja}>
            <Text>
              Es una referencia, no la nota: sale del promedio de los indicadores de las rúbricas
              del período ({informe.pesoRubricas}%) y del porcentaje de asistencia (
              {100 - informe.pesoRubricas}%), en escala del 1 al 10. Cuenta como asistida toda
              clase en la que el alumno no estuvo ausente: presente, tarde o SAF (sin actividad
              física). La nota final la decide el docente.
            </Text>
          </View>
        </View>

        {alumno && (
          <View style={s.firma}>
            <View style={s.firmaCaja}>
              <Text style={s.etiqueta}>NOTA FINAL</Text>
              <View style={s.firmaRenglon} />
            </View>
            <View style={[s.firmaCaja, { flex: 2 }]}>
              <Text style={s.etiqueta}>OBSERVACIONES DEL DOCENTE</Text>
              <View style={s.firmaRenglon} />
            </View>
          </View>
        )}

        <Pie informe={informe} generadoEl={generadoEl} />
      </Page>

      {/* El detalle de cada alumno, una hoja por cabeza: es lo que evita
          generar treinta PDF sueltos cuando se cierra el trimestre. */}
      {!alumno &&
        conDetalle &&
        informe.alumnos.map((cadaAlumno) => (
          <Page key={cadaAlumno.id} size="A4" style={s.pagina}>
            <View style={s.encabezado}>
              <View>
                <Text style={s.titulo}>Detalle del alumno</Text>
                <Text style={s.bajada}>
                  {informe.curso.nombre} · Del {informe.periodo.desdeTexto} al{" "}
                  {informe.periodo.hastaTexto}
                </Text>
              </View>
              <View style={s.institucion}>
                <Text style={s.institucionNombre}>{informe.institucion}</Text>
                <Text style={s.institucionDato}>Prof. {informe.docente}</Text>
              </View>
            </View>

            <DetalleDelAlumno alumno={cadaAlumno} aprobacion={aprobacion} conTitulo />

            <View style={s.firma}>
              <View style={s.firmaCaja}>
                <Text style={s.etiqueta}>NOTA FINAL</Text>
                <View style={s.firmaRenglon} />
              </View>
              <View style={[s.firmaCaja, { flex: 2 }]}>
                <Text style={s.etiqueta}>OBSERVACIONES DEL DOCENTE</Text>
                <View style={s.firmaRenglon} />
              </View>
            </View>

            <Pie informe={informe} generadoEl={generadoEl} />
          </Page>
        ))}
    </Document>
  );
}
