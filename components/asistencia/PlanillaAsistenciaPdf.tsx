import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { EstadoAsistencia } from "@prisma/client";
import type {
  ConteoDeAsistencia,
  JornadaDeLaPlanilla,
  PlanillaDeAsistencia,
} from "@/lib/asistencia/planilla";
import { FUENTE, FUENTE_CURSIVA, FUENTE_NEGRITA } from "@/lib/pdf/tipografia";

/**
 * La planilla de asistencia del curso como PDF: todas las clases, todos los
 * alumnos.
 *
 * Trae tres vistas del mismo dato, porque en la escuela se usan para cosas
 * distintas:
 * - el resumen por alumno, que es lo que se mira para las faltas de uno;
 * - la grilla clase por clase, que es la planilla de siempre;
 * - el detalle de cada clase, que es donde se lee el tema y cuántos fueron.
 *
 * Va apaisado: la grilla tiene una columna por clase y en vertical entran la
 * mitad. Aun así un año no cabe a lo ancho de una hoja, así que las clases se
 * parten en tramos de `JORNADAS_POR_BLOQUE` columnas y cada tramo repite la
 * columna de nombres: es como se arman las planillas en papel.
 *
 * Vale lo mismo que en `InformeGeneralPdf`: `@react-pdf/renderer` no entiende
 * CSS, acá todo es flexbox, puntos y porcentajes. Y la tipografía es Helvetica,
 * que no tiene la raya de diálogo (—): sale en blanco sin avisar, así que donde
 * la pantalla usa una raya, acá va un punto medio (·) o un guión común.
 */

const C = {
  tinta: "#111827",
  texto: "#333d4e",
  suave: "#6b7280",
  marca: "#4338ca",
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
  neutro: "#4b5563",
  neutroFondo: "#f0f1f5",
};

/** Por debajo de este porcentaje la planilla lo marca, igual que el informe. */
const ASISTENCIA_MINIMA = 75;

/**
 * Cómo se ve cada estado en el papel: la letra del casillero, el nombre
 * completo para la referencia, y el color, que sigue al de la pantalla
 * (`ListaAsistencia`).
 */
const ESTADOS: Record<
  EstadoAsistencia,
  { letra: string; nombre: string; color: string; fondo: string }
> = {
  presente: { letra: "P", nombre: "Presente", color: C.bien, fondo: C.bienFondo },
  ausente: { letra: "A", nombre: "Ausente", color: C.mal, fondo: C.malFondo },
  tarde: { letra: "T", nombre: "Tarde", color: C.atencion, fondo: C.atencionFondo },
  SAF: { letra: "S", nombre: "SAF (sin actividad física)", color: C.neutro, fondo: C.neutroFondo },
};

/** El orden en que se leen los estados, en la referencia y en las tablas. */
const ORDEN_ESTADOS: EstadoAsistencia[] = ["presente", "ausente", "tarde", "SAF"];

// --- La grilla ---
// A4 apaisada mide 841,89 pt de ancho; con los márgenes quedan 785,89 útiles.
// La columna de nombres se lleva lo que necesita un "Apellido, Nombre" largo y
// el resto se reparte en casilleros iguales, que es lo que fija cuántas clases
// entran por tramo: 150 + 22 × 28,7 + 2 de borde = 783,4, justo adentro.
const ANCHO_NOMBRE = 150;
const ANCHO_CASILLERO = 28.7;
const JORNADAS_POR_BLOQUE = 22;

/** Las columnas del resumen por alumno. */
const RESUMEN = {
  alumno: "30%",
  estado: "10%",
  registros: "12%",
  porcentaje: "18%",
} as const;

/** Las columnas del detalle de cada clase. */
const DETALLE = {
  fecha: "9%",
  horario: "10%",
  tema: "33%",
  estado: "12%",
  conteo: "6%",
  porcentaje: "12%",
} as const;

const s = StyleSheet.create({
  pagina: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 28,
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
  institucion: { maxWidth: 220, textAlign: "right" },
  institucionNombre: { fontSize: 9.5, fontFamily: FUENTE_NEGRITA, color: C.tinta },
  institucionDato: { fontSize: 7.5, color: C.suave },

  // --- Ficha de datos ---
  ficha: { marginTop: 10, borderWidth: 1, borderColor: C.linea, flexDirection: "row" },
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
  caja: { borderWidth: 1, borderColor: C.linea, paddingVertical: 6, paddingHorizontal: 8 },
  vacio: { color: C.vacio, fontFamily: FUENTE_CURSIVA },

  // --- Referencia de los estados ---
  referencia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  referenciaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  referenciaTexto: { fontSize: 7, color: C.suave },

  // --- Tablas ---
  tabla: { borderWidth: 1, borderColor: C.linea },
  filaEncabezado: { flexDirection: "row", backgroundColor: C.fondoSuave },
  celdaEncabezado: {
    fontSize: 6,
    fontFamily: FUENTE_NEGRITA,
    color: C.suave,
    letterSpacing: 0.6,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
  },
  fila: { flexDirection: "row", borderTopWidth: 0.75, borderTopColor: C.linea },
  celda: {
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
  },
  centrada: { textAlign: "center" },
  nombre: { fontFamily: FUENTE_NEGRITA, color: C.tinta },
  filaTotal: {
    flexDirection: "row",
    backgroundColor: C.fondoSuave,
    borderTopWidth: 0.75,
    borderTopColor: C.linea,
  },
  totalEtiqueta: { fontSize: 6.6, fontFamily: FUENTE_NEGRITA, color: C.suave, letterSpacing: 0.6 },

  // --- La grilla clase por clase ---
  bloque: { borderWidth: 1, borderColor: C.linea, marginTop: 8 },
  bloqueTitulo: { fontSize: 7, color: C.suave, marginTop: 9 },
  celdaFecha: {
    width: ANCHO_CASILLERO,
    paddingVertical: 3,
    paddingHorizontal: 1,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
    textAlign: "center",
    lineHeight: 1.15,
  },
  fechaTexto: { fontSize: 5.6, fontFamily: FUENTE_NEGRITA, color: C.suave },
  fechaOrden: { fontSize: 4.8, color: C.vacio },
  // Los renglones de la grilla van más apretados que los de las otras tablas:
  // acá cada fila es una letra sola, y de lo que se gana en alto depende que un
  // curso numeroso entre en una hoja en vez de partirse en dos. Lo que más pesa
  // no es el relleno sino el nombre: si no entra en `ANCHO_NOMBRE` pasa a dos
  // renglones y esa fila vale por dos.
  casillero: {
    width: ANCHO_CASILLERO,
    paddingVertical: 3,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
    textAlign: "center",
    fontFamily: FUENTE_NEGRITA,
    fontSize: 8,
    lineHeight: 1.2,
  },
  celdaNombre: {
    width: ANCHO_NOMBRE,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
    fontFamily: FUENTE_NEGRITA,
    color: C.tinta,
    fontSize: 7.5,
    lineHeight: 1.2,
  },

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
  firma: { marginTop: 14, flexDirection: "row", gap: 12 },
  firmaCaja: { flex: 1, borderWidth: 1, borderColor: C.linea, padding: 8 },
  firmaRenglon: { borderBottomWidth: 0.75, borderBottomColor: C.linea, height: 22 },
  pie: {
    position: "absolute",
    bottom: 20,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.75,
    borderTopColor: C.lineaSuave,
    paddingTop: 5,
    fontSize: 6.6,
    color: C.suave,
  },
});

/** Los porcentajes se escriben con coma, igual que en pantalla. */
const porcentaje = (valor: number | null) =>
  valor === null ? "-" : `${String(valor).replace(".", ",")}%`;

/** El color de un porcentaje: por debajo del mínimo en rojo, justo encima en ámbar. */
function colorDeAsistencia(valor: number | null) {
  if (valor === null) return { color: C.suave, backgroundColor: C.fondoSuave };
  if (valor < ASISTENCIA_MINIMA) return { color: C.mal, backgroundColor: C.malFondo };
  if (valor < ASISTENCIA_MINIMA + 10) return { color: C.atencion, backgroundColor: C.atencionFondo };
  return { color: C.bien, backgroundColor: C.bienFondo };
}

/** Cuántas veces salió cada estado, en el orden de la referencia. */
const porEstado = (conteo: ConteoDeAsistencia): Record<EstadoAsistencia, number> => ({
  presente: conteo.presentes,
  ausente: conteo.ausentes,
  tarde: conteo.tardes,
  SAF: conteo.saf,
});

/** Un casillero de la ficha. El último de la fila no lleva línea a la derecha. */
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

/** El encabezado y la ficha del curso. */
function Portada({ planilla }: { planilla: PlanillaDeAsistencia }) {
  const { curso, periodo } = planilla;

  return (
    <>
      <View style={s.encabezado}>
        <View>
          <Text style={s.titulo}>Planilla de asistencia</Text>
          <Text style={s.bajada}>
            {curso.nombre} ·{" "}
            {periodo
              ? `Del ${periodo.desdeTexto} al ${periodo.hastaTexto}`
              : "Sin asistencia registrada"}
          </Text>
        </View>
        <View style={s.institucion}>
          <Text style={s.institucionNombre}>{planilla.institucion}</Text>
          <Text style={s.institucionDato}>Año lectivo {curso.anioLectivo}</Text>
        </View>
      </View>

      <View style={s.ficha}>
        <Dato etiqueta="Docente" valor={`Prof. ${planilla.docente}`} ancho="24%" />
        <Dato
          etiqueta="Nivel y ciclo"
          valor={[curso.nivel, curso.ciclo].filter(Boolean).join(" · ") || null}
          ancho="24%"
        />
        <Dato etiqueta="Turno" valor={curso.turno} ancho="12%" />
        <Dato etiqueta="Alumnos" valor={String(planilla.alumnos.length)} ancho="10%" />
        <Dato etiqueta="Clases con lista" valor={String(planilla.jornadas.length)} ancho="14%" />
        <Dato
          etiqueta="Asistencia del curso"
          valor={porcentaje(planilla.total.porcentaje)}
          ancho="16%"
          ultimo
        />
      </View>
    </>
  );
}

/** Qué quiere decir cada letra de la grilla. */
function Referencia() {
  return (
    <View style={s.referencia}>
      {ORDEN_ESTADOS.map((estado) => {
        const tono = ESTADOS[estado];
        return (
          <View key={estado} style={s.referenciaItem}>
            <Text
              style={{
                width: 13,
                paddingVertical: 1,
                textAlign: "center",
                fontSize: 7,
                fontFamily: FUENTE_NEGRITA,
                color: tono.color,
                backgroundColor: tono.fondo,
                borderWidth: 0.75,
                borderColor: tono.color,
              }}
            >
              {tono.letra}
            </Text>
            <Text style={s.referenciaTexto}>{tono.nombre}</Text>
          </View>
        );
      })}
      <View style={s.referenciaItem}>
        <Text style={[s.referenciaTexto, { width: 13, textAlign: "center" }]}>-</Text>
        <Text style={s.referenciaTexto}>Sin cargar</Text>
      </View>
    </View>
  );
}

/** El resumen del curso: una fila por alumno con sus totales. */
function ResumenPorAlumno({ planilla }: { planilla: PlanillaDeAsistencia }) {
  const totales = porEstado(planilla.total);
  const porDebajo = planilla.alumnos.filter(
    (alumno) => alumno.conteo.porcentaje !== null && alumno.conteo.porcentaje < ASISTENCIA_MINIMA
  ).length;

  return (
    <View style={s.seccion}>
      <Text style={s.seccionTitulo}>RESUMEN POR ALUMNO</Text>

      <View style={s.tabla}>
        {/* `fixed` repite el encabezado arriba de cada hoja si el curso no entra
            en una sola. */}
        <View style={s.filaEncabezado} fixed>
          <Text style={[s.celdaEncabezado, { width: RESUMEN.alumno }]}>ALUMNO</Text>
          {ORDEN_ESTADOS.map((estado) => (
            <Text key={estado} style={[s.celdaEncabezado, s.centrada, { width: RESUMEN.estado }]}>
              {ESTADOS[estado].letra} ·{" "}
              {estado === "SAF" ? "SAF" : ESTADOS[estado].nombre.toUpperCase()}
            </Text>
          ))}
          <Text style={[s.celdaEncabezado, s.centrada, { width: RESUMEN.registros }]}>
            CLASES CARGADAS
          </Text>
          <Text
            style={[
              s.celdaEncabezado,
              s.centrada,
              { width: RESUMEN.porcentaje, borderRightWidth: 0 },
            ]}
          >
            ASISTENCIA
          </Text>
        </View>

        {planilla.alumnos.length === 0 && (
          <View style={s.fila}>
            <Text style={[s.celda, s.vacio, { width: "100%", borderRightWidth: 0 }]}>
              Este curso todavía no tiene alumnos cargados.
            </Text>
          </View>
        )}

        {planilla.alumnos.map((alumno) => {
          const cuenta = porEstado(alumno.conteo);
          const tono = colorDeAsistencia(alumno.conteo.porcentaje);

          return (
            <View key={alumno.id} style={s.fila} wrap={false}>
              <Text style={[s.celda, s.nombre, { width: RESUMEN.alumno }]}>
                {alumno.nombreCompleto}
              </Text>
              {ORDEN_ESTADOS.map((estado) => (
                <Text
                  key={estado}
                  style={[
                    s.celda,
                    s.centrada,
                    {
                      width: RESUMEN.estado,
                      fontFamily: FUENTE_NEGRITA,
                      color: cuenta[estado] === 0 ? C.vacio : ESTADOS[estado].color,
                    },
                  ]}
                >
                  {cuenta[estado]}
                </Text>
              ))}
              <Text style={[s.celda, s.centrada, { width: RESUMEN.registros, color: C.tinta }]}>
                {alumno.conteo.registros === 0
                  ? "Sin registros"
                  : `${alumno.conteo.registros} de ${planilla.jornadas.length}`}
              </Text>
              <View
                style={[
                  s.celda,
                  {
                    width: RESUMEN.porcentaje,
                    borderRightWidth: 0,
                    backgroundColor: tono.backgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    s.centrada,
                    { fontFamily: FUENTE_NEGRITA, fontSize: 10, color: tono.color },
                  ]}
                >
                  {porcentaje(alumno.conteo.porcentaje)}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={s.filaTotal} wrap={false}>
          <Text style={[s.celda, s.totalEtiqueta, { width: RESUMEN.alumno }]}>TOTAL DEL CURSO</Text>
          {ORDEN_ESTADOS.map((estado) => (
            <Text
              key={estado}
              style={[
                s.celda,
                s.centrada,
                { width: RESUMEN.estado, fontFamily: FUENTE_NEGRITA, color: C.tinta },
              ]}
            >
              {totales[estado]}
            </Text>
          ))}
          <Text
            style={[
              s.celda,
              s.centrada,
              { width: RESUMEN.registros, fontFamily: FUENTE_NEGRITA, color: C.tinta },
            ]}
          >
            {planilla.total.registros}
          </Text>
          <Text
            style={[
              s.celda,
              s.centrada,
              {
                width: RESUMEN.porcentaje,
                borderRightWidth: 0,
                fontFamily: FUENTE_NEGRITA,
                fontSize: 10,
                color: C.tinta,
              },
            ]}
          >
            {porcentaje(planilla.total.porcentaje)}
          </Text>
        </View>
      </View>

      {porDebajo > 0 && (
        <Text style={s.aclaracion}>
          {porDebajo} {porDebajo === 1 ? "alumno queda" : "alumnos quedan"} por debajo del{" "}
          {ASISTENCIA_MINIMA}% de asistencia.
        </Text>
      )}
    </View>
  );
}

/**
 * Un tramo de la grilla: todos los alumnos contra las clases que entran a lo
 * ancho de una hoja.
 *
 * Va siempre solo en su `Page`, y de eso depende que el encabezado de fechas
 * pueda llevar `fixed`: si un curso numeroso no entra en una hoja, las filas que
 * sobran siguen en la siguiente debajo de las mismas fechas. Con los tramos
 * compartiendo una `Page` no se podría, porque `fixed` alcanza a todas las hojas
 * de su `Page` y cada tramo repetiría el encabezado de los demás.
 */
function BloqueDeLaGrilla({
  planilla,
  desde,
  jornadas,
}: {
  planilla: PlanillaDeAsistencia;
  /** Posición de la primera jornada del tramo dentro de `planilla.jornadas`. */
  desde: number;
  jornadas: JornadaDeLaPlanilla[];
}) {
  const hasta = desde + jornadas.length;
  const partida = planilla.jornadas.length > jornadas.length;

  return (
    <>
      <Text style={s.seccionTitulo}>ASISTENCIA CLASE POR CLASE</Text>
      <Referencia />

      {/* El rótulo del tramo sólo aparece si la grilla se partió: con una sola
          hoja de clases, "Clases 1 a 12 de 12" no le dice nada a nadie. */}
      {partida && (
        <Text style={s.bloqueTitulo}>
          Clases {desde + 1} a {hasta} de {planilla.jornadas.length} · {jornadas[0].fechaTexto} al{" "}
          {jornadas[jornadas.length - 1].fechaTexto}
        </Text>
      )}

      <View style={s.bloque}>
        <View style={s.filaEncabezado} fixed>
          <Text style={[s.celdaNombre, { color: C.suave, fontSize: 6, letterSpacing: 0.6 }]}>
            ALUMNO
          </Text>
          {jornadas.map((jornada) => (
            <View key={jornada.clave} style={s.celdaFecha}>
              <Text style={s.fechaTexto}>{jornada.fechaCorta}</Text>
              {/* Sólo cuando ese día hubo más de una toma: si no, la fecha ya
                  alcanza para saber de qué clase se trata. */}
              {jornada.orden !== null && <Text style={s.fechaOrden}>({jornada.orden})</Text>}
            </View>
          ))}
        </View>

        {planilla.alumnos.map((alumno) => (
          <View key={alumno.id} style={s.fila} wrap={false}>
            <Text style={s.celdaNombre}>{alumno.nombreCompleto}</Text>
            {jornadas.map((jornada, indice) => {
              const estado = alumno.estados[desde + indice];
              const tono = estado ? ESTADOS[estado] : null;

              return (
                <Text
                  key={jornada.clave}
                  style={[
                    s.casillero,
                    tono
                      ? { color: tono.color, backgroundColor: tono.fondo }
                      : { color: C.vacio, fontFamily: FUENTE },
                  ]}
                >
                  {tono ? tono.letra : "-"}
                </Text>
              );
            })}
          </View>
        ))}

        {/* Cuántos fueron ese día: es lo que se mira para saber si faltó medio
            curso o si la clase se dio con normalidad. */}
        <View style={s.filaTotal} wrap={false}>
          <Text style={[s.celdaNombre, s.totalEtiqueta, { fontFamily: FUENTE_NEGRITA }]}>
            ASISTIERON
          </Text>
          {jornadas.map((jornada) => (
            <Text key={jornada.clave} style={[s.casillero, { fontSize: 6.4, color: C.suave }]}>
              {jornada.conteo.registros - jornada.conteo.ausentes}/{jornada.conteo.registros}
            </Text>
          ))}
        </View>
      </View>
    </>
  );
}

/** Las clases cortadas en tramos que entren a lo ancho de la hoja. */
function tramosDeJornadas(jornadas: JornadaDeLaPlanilla[]) {
  const tramos: { desde: number; jornadas: JornadaDeLaPlanilla[] }[] = [];
  for (let desde = 0; desde < jornadas.length; desde += JORNADAS_POR_BLOQUE) {
    tramos.push({ desde, jornadas: jornadas.slice(desde, desde + JORNADAS_POR_BLOQUE) });
  }
  return tramos;
}

/** Una fila por clase: qué se dio ese día y cuántos fueron. */
function DetallePorClase({ planilla }: { planilla: PlanillaDeAsistencia }) {
  return (
    <>
      <Text style={s.seccionTitulo}>DETALLE DE CADA CLASE</Text>

      <View style={s.tabla}>
        <View style={s.filaEncabezado} fixed>
          <Text style={[s.celdaEncabezado, { width: DETALLE.fecha }]}>FECHA</Text>
          <Text style={[s.celdaEncabezado, { width: DETALLE.horario }]}>HORARIO</Text>
          <Text style={[s.celdaEncabezado, { width: DETALLE.tema }]}>TEMA DE LA CLASE</Text>
          <Text style={[s.celdaEncabezado, { width: DETALLE.estado }]}>ESTADO</Text>
          {ORDEN_ESTADOS.map((estado) => (
            <Text key={estado} style={[s.celdaEncabezado, s.centrada, { width: DETALLE.conteo }]}>
              {ESTADOS[estado].letra}
            </Text>
          ))}
          <Text
            style={[
              s.celdaEncabezado,
              s.centrada,
              { width: DETALLE.porcentaje, borderRightWidth: 0 },
            ]}
          >
            ASISTENCIA
          </Text>
        </View>

        {planilla.jornadas.map((jornada) => {
          const cuenta = porEstado(jornada.conteo);
          const tono = colorDeAsistencia(jornada.conteo.porcentaje);

          return (
            <View key={jornada.clave} style={s.fila} wrap={false}>
              <View style={[s.celda, { width: DETALLE.fecha }]}>
                <Text style={s.nombre}>{jornada.fechaTexto}</Text>
                {jornada.orden !== null && (
                  <Text style={{ fontSize: 6.4, color: C.suave }}>
                    Clase {jornada.orden} del día
                  </Text>
                )}
              </View>
              <Text style={[s.celda, { width: DETALLE.horario }, jornada.horario ? {} : s.vacio]}>
                {jornada.horario ?? "-"}
              </Text>
              <Text style={[s.celda, { width: DETALLE.tema }, jornada.tema ? {} : s.vacio]}>
                {/* Sin clase asociada la lista se pasó suelta: conviene que el
                    papel lo diga, y no que parezca una clase sin tema. */}
                {jornada.tema ??
                  (jornada.estadoClase ? "Sin tema cargado" : "Lista sin clase asociada")}
              </Text>
              <Text
                style={[s.celda, { width: DETALLE.estado }, jornada.estadoClase ? {} : s.vacio]}
              >
                {jornada.estadoClase ?? "-"}
              </Text>
              {ORDEN_ESTADOS.map((estado) => (
                <Text
                  key={estado}
                  style={[
                    s.celda,
                    s.centrada,
                    {
                      width: DETALLE.conteo,
                      fontFamily: FUENTE_NEGRITA,
                      color: cuenta[estado] === 0 ? C.vacio : ESTADOS[estado].color,
                    },
                  ]}
                >
                  {cuenta[estado]}
                </Text>
              ))}
              <View
                style={[
                  s.celda,
                  {
                    width: DETALLE.porcentaje,
                    borderRightWidth: 0,
                    backgroundColor: tono.backgroundColor,
                  },
                ]}
              >
                <Text style={[s.centrada, { fontFamily: FUENTE_NEGRITA, color: tono.color }]}>
                  {porcentaje(jornada.conteo.porcentaje)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

/** Los renglones para firmar y anotar a mano, al final del documento. */
function Firma() {
  return (
    <View style={s.firma}>
      <View style={s.firmaCaja}>
        <Text style={s.etiqueta}>FIRMA DEL DOCENTE</Text>
        <View style={s.firmaRenglon} />
      </View>
      <View style={[s.firmaCaja, { flex: 2 }]}>
        <Text style={s.etiqueta}>OBSERVACIONES</Text>
        <View style={s.firmaRenglon} />
      </View>
    </View>
  );
}

/** El pie de todas las hojas. */
function Pie({ planilla, generadoEl }: { planilla: PlanillaDeAsistencia; generadoEl: string }) {
  return (
    <View style={s.pie} fixed>
      <Text>Planificador EF · Generado el {generadoEl}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${planilla.curso.nombre} · Asistencia · Hoja ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

export default function PlanillaAsistenciaPdf({
  planilla,
  generadoEl,
}: {
  planilla: PlanillaDeAsistencia;
  /** Ya formateada afuera: acá no se toca el huso horario. */
  generadoEl: string;
}) {
  const hayRegistros = planilla.jornadas.length > 0;

  return (
    <Document
      title={`Asistencia - ${planilla.curso.nombre}`}
      author={`Prof. ${planilla.docente}`}
      subject="Planilla de asistencia del curso"
    >
      {/* Cada vista va en su propia `Page` y no en secciones con `break` de una
          sola: los encabezados de tabla se repiten hoja a hoja con `fixed`, y
          `fixed` alcanza a TODAS las hojas de la `Page` que lo contiene. Con las
          tres juntas, el encabezado del resumen reaparecía sobre la grilla y
          sobre el detalle. */}
      <Page size="A4" orientation="landscape" style={s.pagina}>
        <Portada planilla={planilla} />

        {hayRegistros ? (
          <ResumenPorAlumno planilla={planilla} />
        ) : (
          <View style={s.seccion}>
            <View style={s.caja}>
              <Text style={s.vacio}>
                Todavía no hay asistencia cargada en este curso. Pasá lista desde una clase y el
                detalle aparece acá.
              </Text>
            </View>
          </View>
        )}

        {!hayRegistros && <Firma />}
        <Pie planilla={planilla} generadoEl={generadoEl} />
      </Page>

      {tramosDeJornadas(planilla.jornadas).map((tramo) => (
        <Page key={tramo.desde} size="A4" orientation="landscape" style={s.pagina}>
          <BloqueDeLaGrilla planilla={planilla} desde={tramo.desde} jornadas={tramo.jornadas} />
          <Pie planilla={planilla} generadoEl={generadoEl} />
        </Page>
      ))}

      {hayRegistros && (
        <Page size="A4" orientation="landscape" style={s.pagina}>
          <DetallePorClase planilla={planilla} />
          <Firma />
          <Pie planilla={planilla} generadoEl={generadoEl} />
        </Page>
      )}
    </Document>
  );
}
