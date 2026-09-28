import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ActividadDelPlan, PlanDeClase } from "@/lib/clases/plan-clase";
import { FUENTE, FUENTE_CURSIVA, FUENTE_NEGRITA } from "@/lib/pdf/tipografia";

/**
 * El plan de clase como PDF de verdad: se arma en el servidor y el navegador lo
 * descarga como archivo, sin pasar por el diálogo de impresión.
 *
 * Es el mismo documento que muestra la vista previa en HTML, pero escrito con
 * las primitivas de `@react-pdf/renderer`, que no entiende CSS: acá todo es
 * flexbox, medidas en puntos y anchos en porcentaje. Cuando se cambie algo de
 * la hoja hay que tocar los dos lados.
 *
 * La tipografía es Helvetica, la que el PDF ya trae: así el archivo no depende
 * de ninguna fuente que haya que descargar y las tildes y la ñ salen bien. Lo
 * que esa codificación NO tiene es la raya de diálogo (—): sale en blanco, sin
 * aviso. Donde la vista previa en HTML usa una raya, acá va un punto medio (·)
 * o un guión común, que sí existen.
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
};

/** Los anchos de las cuatro columnas de la secuencia, en un solo lugar. */
const COLUMNAS = { actividad: "47%", estrategia: "17%", recursos: "23%", duracion: "13%" } as const;

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

  aviso: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#f3c2c2",
    borderLeftWidth: 2.5,
    borderLeftColor: "#b91c1c",
    backgroundColor: "#fdf2f2",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 8.5,
    fontFamily: FUENTE_NEGRITA,
    color: "#b91c1c",
  },

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
  columnas: { flexDirection: "row", gap: 8 },
  caja: { flex: 1, borderWidth: 1, borderColor: C.linea, paddingVertical: 6, paddingHorizontal: 8 },

  item: { flexDirection: "row", marginTop: 2 },
  vineta: { width: 8, color: C.marca, fontFamily: FUENTE_NEGRITA },
  itemTexto: { flex: 1 },
  vacio: { color: C.vacio, fontFamily: FUENTE_CURSIVA },

  // --- Tabla de la secuencia ---
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
  filaParte: { flexDirection: "row", backgroundColor: C.marcaFondo },
  parteNombre: { fontSize: 8.2, fontFamily: FUENTE_NEGRITA, color: C.marca, letterSpacing: 0.3 },
  parteBloque: { fontSize: 7.5, color: C.suave },
  fila: { flexDirection: "row", borderTopWidth: 0.75, borderTopColor: C.linea },
  celda: {
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRightWidth: 0.75,
    borderRightColor: C.linea,
  },
  actividadNombre: { fontFamily: FUENTE_NEGRITA, color: C.tinta },
  orden: { color: C.suave },
  duracion: { textAlign: "center", fontFamily: FUENTE_NEGRITA, color: C.tinta },
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
    textAlign: "right",
  },

  // --- Observaciones y pie ---
  renglon: { borderBottomWidth: 0.75, borderBottomColor: C.lineaSuave, height: 19 },
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

/** Lista con viñetas. Con un solo ítem va como párrafo suelto, igual que en la app. */
function Lista({ items, vacio }: { items: string[]; vacio: string }) {
  if (items.length === 0) return <Text style={s.vacio}>{vacio}</Text>;
  if (items.length === 1) return <Text>{items[0]}</Text>;

  return (
    <>
      {items.map((item, indice) => (
        <View key={`${indice}-${item}`} style={s.item}>
          <Text style={s.vineta}>•</Text>
          <Text style={s.itemTexto}>{item}</Text>
        </View>
      ))}
    </>
  );
}

function Caja({ titulo, items, vacio }: { titulo: string; items: string[]; vacio: string }) {
  return (
    <View style={s.caja}>
      <Text style={s.seccionTitulo}>{titulo.toUpperCase()}</Text>
      <Lista items={items} vacio={vacio} />
    </View>
  );
}

/** Una actividad: nombre, descripción, estrategia, recursos y minutos en una fila. */
function FilaActividad({ actividad, numero }: { actividad: ActividadDelPlan; numero: number }) {
  return (
    <View style={s.fila} wrap={false}>
      <View style={[s.celda, { width: COLUMNAS.actividad }]}>
        <Text>
          <Text style={s.orden}>{numero}. </Text>
          <Text style={s.actividadNombre}>{actividad.nombre}</Text>
        </Text>
        {actividad.descripcion.length > 0 && (
          <View style={{ marginTop: 2 }}>
            <Lista items={actividad.descripcion} vacio="" />
          </View>
        )}
      </View>
      <View style={[s.celda, { width: COLUMNAS.estrategia }]}>
        <Text style={actividad.estrategia ? {} : s.vacio}>{actividad.estrategia ?? "-"}</Text>
      </View>
      <View style={[s.celda, { width: COLUMNAS.recursos }]}>
        <Text style={actividad.materiales.length > 0 ? {} : s.vacio}>
          {actividad.materiales.length > 0 ? actividad.materiales.join(", ") : "Sin materiales"}
        </Text>
      </View>
      <View style={[s.celda, { width: COLUMNAS.duracion, borderRightWidth: 0 }]}>
        <Text style={s.duracion}>{actividad.duracionMinutos} min</Text>
      </View>
    </View>
  );
}

export default function PlanClasePdf({
  plan,
  generadoEl,
  fecha,
}: {
  plan: PlanDeClase;
  /** Ya formateada afuera: acá no se toca el huso horario. */
  generadoEl: string;
  /** La fecha de la clase, en sus dos formas: con día de la semana y corta. */
  fecha: { conDia: string; corta: string };
}) {
  const { clase, unidad, curso, institucion, partes, materiales, indicadores } = plan;

  const avisos: Record<string, string> = {
    suspendida: "Clase suspendida: no se dictó",
    cancelada: "Clase cancelada",
    reprogramada: "Clase reprogramada",
  };
  const aviso = avisos[clase.estado];

  return (
    <Document
      title={`Plan de clase - ${curso.nombre} - ${fecha.corta}`}
      author={`Prof. ${plan.docente}`}
      subject={unidad.titulo ? `Unidad ${unidad.numero}: ${unidad.titulo}` : "Plan de clase"}
    >
      <Page size="A4" style={s.pagina}>
        <View style={s.encabezado}>
          <View>
            <Text style={s.titulo}>Plan de clase</Text>
            <Text style={s.bajada}>
              {curso.nombre}
              {unidad.titulo && ` · Unidad didáctica N° ${unidad.numero}: ${unidad.titulo}`}
            </Text>
          </View>
          <View style={s.institucion}>
            <Text style={s.institucionNombre}>{institucion.nombre}</Text>
            <Text style={s.institucionDato}>Año lectivo {curso.anioLectivo}</Text>
          </View>
        </View>

        {aviso && (
          <Text style={s.aviso}>
            {aviso}
            {clase.motivoCancelacion && ` · ${clase.motivoCancelacion}`}
          </Text>
        )}

        <View style={s.ficha}>
          <View style={[s.fichaFila, { borderBottomWidth: 0.75, borderBottomColor: C.lineaSuave }]}>
            <Dato etiqueta="Docente" valor={`Prof. ${plan.docente}`} ancho="50%" />
            <Dato etiqueta="Fecha" valor={fecha.conDia} ancho="25%" />
            <Dato
              etiqueta="Horario"
              valor={
                clase.horaInicio && clase.horaFin ? `${clase.horaInicio} a ${clase.horaFin}` : null
              }
              ancho="25%"
              ultimo
            />
          </View>
          <View style={[s.fichaFila, { borderBottomWidth: 0.75, borderBottomColor: C.lineaSuave }]}>
            <Dato etiqueta="Curso" valor={curso.nombre} ancho="25%" />
            <Dato
              etiqueta="Nivel y ciclo"
              valor={[curso.nivel, curso.ciclo].filter(Boolean).join(" · ")}
              ancho="25%"
            />
            <Dato etiqueta="Turno" valor={curso.turno} ancho="25%" />
            <Dato
              etiqueta="Cantidad de alumnos"
              valor={String(curso.cantidadAlumnos)}
              ancho="25%"
              ultimo
            />
          </View>
          <View style={s.fichaFila}>
            <Dato etiqueta="Eje / NAP" valor={clase.eje} ancho="75%" />
            <Dato
              etiqueta="Duración total"
              valor={plan.minutosTotales > 0 ? `${plan.minutosTotales} min` : null}
              ancho="25%"
              ultimo
            />
          </View>
        </View>

        <View style={[s.seccion, s.columnas]}>
          <Caja titulo="Tema general" items={clase.tema} vacio="Sin cargar." />
          <Caja titulo="Objetivos específicos" items={clase.objetivos} vacio="Sin cargar." />
          <Caja titulo="Contenidos" items={clase.contenidos} vacio="Sin cargar." />
        </View>

        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>DESARROLLO DE LA CLASE</Text>
          <View style={s.tabla}>
            {/* `fixed` repite el encabezado arriba de cada hoja si la secuencia
                no entra en una sola. */}
            <View style={s.filaEncabezado} fixed>
              <Text style={[s.celdaEncabezado, { width: COLUMNAS.actividad }]}>ACTIVIDADES</Text>
              <Text style={[s.celdaEncabezado, { width: COLUMNAS.estrategia }]}>
                ESTRATEGIA METODOLÓGICA
              </Text>
              <Text style={[s.celdaEncabezado, { width: COLUMNAS.recursos }]}>RECURSOS</Text>
              <Text
                style={[
                  s.celdaEncabezado,
                  { width: COLUMNAS.duracion, borderRightWidth: 0, textAlign: "center" },
                ]}
              >
                DURACIÓN
              </Text>
            </View>

            {partes.length === 0 && (
              <View style={s.fila}>
                <Text style={[s.celda, s.vacio, { width: "100%", borderRightWidth: 0 }]}>
                  Esta clase todavía no tiene actividades cargadas.
                </Text>
              </View>
            )}

            {partes.map((parte) => (
              <View key={parte.tipo}>
                <View style={[s.filaParte, s.fila]} wrap={false}>
                  <View
                    style={[
                      s.celda,
                      { width: "87%", paddingVertical: 4, borderRightWidth: 0 },
                    ]}
                  >
                    <Text>
                      <Text style={s.parteNombre}>{parte.parte.toUpperCase()}</Text>
                      <Text style={s.parteBloque}> · {parte.bloque}</Text>
                    </Text>
                  </View>
                  <View style={[s.celda, { width: COLUMNAS.duracion, paddingVertical: 4 }]}>
                    <Text style={s.duracion}>{parte.minutos} min</Text>
                  </View>
                </View>
                {parte.actividades.map((actividad, indice) => (
                  <FilaActividad key={actividad.id} actividad={actividad} numero={indice + 1} />
                ))}
              </View>
            ))}

            <View style={s.filaTotal} wrap={false}>
              <Text style={[s.celda, s.totalEtiqueta, { width: "87%", borderRightWidth: 0 }]}>
                DURACIÓN TOTAL DE LA CLASE
              </Text>
              <Text style={[s.celda, s.duracion, { width: COLUMNAS.duracion }]}>
                {plan.minutosTotales} min
              </Text>
            </View>
          </View>
        </View>

        <View style={[s.seccion, s.columnas]}>
          <View style={[s.caja, { flex: 1.4 }]}>
            <Text style={s.seccionTitulo}>EVALUACIÓN DE LA CLASE · INDICADORES</Text>
            <Lista
              items={indicadores.map((indicador) =>
                indicador.rubrica ? `${indicador.rubrica}: ${indicador.nombre}` : indicador.nombre
              )}
              vacio="Sin indicadores cargados para esta clase."
            />
          </View>
          <Caja titulo="Recursos materiales" items={materiales} vacio="Sin materiales cargados." />
        </View>

        <View style={s.seccion} wrap={false}>
          <Text style={s.seccionTitulo}>OBSERVACIONES</Text>
          {/* Renglones para completar a mano después de la clase. */}
          {[0, 1, 2, 3].map((renglon) => (
            <View key={renglon} style={s.renglon} />
          ))}
        </View>

        <View style={s.pie} fixed>
          <Text>Planificador EF · Generado el {generadoEl}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${institucion.nombre} · ${curso.nombre} · ${fecha.corta}${
                totalPages > 1 ? `  ·  ${pageNumber}/${totalPages}` : ""
              }`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
