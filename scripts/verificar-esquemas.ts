import assert from "node:assert";
import { loginSchema, registroSchema } from "../lib/schemas/auth.schema";
import { alumnoSchema, cursoSchema } from "../lib/schemas/curso.schema";
import { planificacionSchema, unidadDidacticaSchema } from "../lib/schemas/planificacion.schema";
import { claseSchema, actividadSchema } from "../lib/schemas/clase.schema";
import { juegoSchema, separarMateriales } from "../lib/schemas/juego.schema";
import { rubricaSchema, evaluacionSchema } from "../lib/schemas/evaluacion.schema";
import { aFecha, aFechaLegible, aValorFecha } from "../lib/schemas/common";
import { validarPayload } from "../lib/form/action-result";

let pasadas = 0;
function caso(nombre: string, fn: () => void) {
  fn();
  pasadas++;
  console.log(`  ok  ${nombre}`);
}

function errorDe(schema: Parameters<typeof validarPayload>[0], input: unknown, campo: string) {
  const r = validarPayload(schema, input);
  assert.equal(r.ok, false, `esperaba que fallara: ${JSON.stringify(input)}`);
  if (r.ok) throw new Error("unreachable");
  return r.erroresPorCampo[campo];
}

console.log("auth");
caso("email inválido", () => {
  assert.match(errorDe(loginSchema, { email: "no-es-mail", password: "x" }, "email"), /email válido/);
});
caso("email se normaliza a minúsculas y sin espacios", () => {
  const r = validarPayload(loginSchema, { email: "  Docente@Escuela.COM ", password: "x" });
  assert.deepEqual(r.ok && r.data.email, "docente@escuela.com");
});
caso("contraseña corta", () => {
  assert.match(
    errorDe(registroSchema, { nombre: "A", apellido: "B", email: "a@b.co", password: "12345" }, "password"),
    /al menos 6/
  );
});

console.log("curso");
caso("ciclo que no corresponde al nivel", () => {
  assert.match(
    errorDe(
      cursoSchema,
      { institucion: "E1", nombre: "5B", nivel: "primaria", ciclo: "ciclo_basico", turno: "manana", anioLectivo: 2026 },
      "ciclo"
    ),
    /no corresponde al nivel/
  );
});
caso("combinación válida de nivel y ciclo", () => {
  const r = validarPayload(cursoSchema, {
    institucion: " Escuela 12 ",
    nombre: "5° B",
    nivel: "primaria",
    ciclo: "segundo_ciclo",
    turno: "tarde",
    anioLectivo: 2026,
  });
  assert.ok(r.ok);
  assert.equal(r.ok && r.data.institucion, "Escuela 12");
});
caso("año lectivo no numérico", () => {
  assert.match(
    errorDe(
      cursoSchema,
      { institucion: "E", nombre: "N", nivel: "primaria", ciclo: "primer_ciclo", turno: "manana", anioLectivo: NaN },
      "anioLectivo"
    ),
    /debe ser un número/
  );
});

console.log("alumno");
caso("el nombre es obligatorio", () => {
  assert.match(errorDe(alumnoSchema, { nombre: "   ", apellido: "B" }, "nombre"), /es obligatorio/);
});
caso("el apellido es obligatorio", () => {
  assert.match(errorDe(alumnoSchema, { nombre: "A", apellido: "" }, "apellido"), /es obligatorio/);
});
caso("nombre y apellido alcanzan: el contacto es opcional", () => {
  const r = validarPayload(alumnoSchema, { nombre: " Ana ", apellido: " Gómez " });
  assert.ok(r.ok);
  assert.equal(r.ok && r.data.nombre, "Ana");
  assert.equal(r.ok && r.data.contactoEmergencia, "");
});

console.log("planificación y unidad");
caso("fecha de fin anterior a la de inicio", () => {
  assert.match(
    errorDe(unidadDidacticaSchema, { titulo: "U1", fechaInicio: "2026-05-10", fechaFin: "2026-05-01" }, "fechaFin"),
    /no puede ser anterior/
  );
});
caso("mismo día es válido", () => {
  assert.ok(
    validarPayload(unidadDidacticaSchema, { titulo: "U1", fechaInicio: "2026-05-10", fechaFin: "2026-05-10" }).ok
  );
});
caso("objetivos opcionales en planificación", () => {
  const r = validarPayload(planificacionSchema, { anio: 2026 });
  assert.ok(r.ok);
  assert.equal(r.ok && r.data.objetivos, "");
});

console.log("clase y actividad");
const EJE = "cmeje000000000000000000001";
caso("hora de fin anterior a la de inicio", () => {
  assert.match(
    errorDe(
      claseSchema,
      { fecha: "2026-05-10", ejeNapId: EJE, horaInicio: "10:00", horaFin: "09:00" },
      "horaFin"
    ),
    /posterior a la de inicio/
  );
});
caso("horas vacías son válidas", () => {
  const r = validarPayload(claseSchema, { fecha: "2026-05-10", ejeNapId: EJE });
  assert.ok(r.ok);
  assert.equal(r.ok && r.data.estado, "planificada");
  assert.equal(r.ok && r.data.espacioRequerido, "");
});
caso("hora mal formada", () => {
  assert.match(
    errorDe(claseSchema, { fecha: "2026-05-10", ejeNapId: EJE, horaInicio: "25:99" }, "horaInicio"),
    /HH:MM/
  );
});
caso("el eje es obligatorio", () => {
  assert.match(errorDe(claseSchema, { fecha: "2026-05-10", ejeNapId: "  " }, "ejeNapId"), /es obligatorio/);
});
caso('eje "otro" sin nombre escrito', () => {
  assert.match(
    errorDe(claseSchema, { fecha: "2026-05-10", ejeNapId: "otro", ejeOtro: "   " }, "ejeOtro"),
    /Escribí el nombre del eje/
  );
});
caso('eje "otro" con nombre propio', () => {
  const r = validarPayload(claseSchema, {
    fecha: "2026-05-10",
    ejeNapId: "otro",
    ejeOtro: " Prácticas circenses ",
  });
  assert.ok(r.ok);
  assert.equal(r.ok && r.data.ejeOtro, "Prácticas circenses");
});
caso("duración fuera de rango", () => {
  assert.match(
    errorDe(actividadSchema, { tipoBloque: "desarrollo", duracionMinutos: 0 }, "duracionMinutos"),
    /no puede ser menor a 1/
  );
});

console.log("juego");
caso("nombre obligatorio", () => {
  assert.match(
    errorDe(
      juegoSchema,
      { nombre: "   ", rangoEtario: "de_6_a_8", categoria: "deportivo", estrategia: "mando_directo" },
      "nombre"
    ),
    /es obligatorio/
  );
});
caso("materiales se separan por coma", () => {
  assert.deepEqual(separarMateriales(" pelotas , conos ,, sogas "), ["pelotas", "conos", "sogas"]);
});

console.log("evaluación");
caso("rúbrica sin indicadores", () => {
  assert.match(
    errorDe(rubricaSchema, { nombre: "R", indicadores: [] }, "indicadores"),
    /al menos un indicador/
  );
});
caso("indicador vacío se marca por índice", () => {
  assert.match(
    errorDe(
      rubricaSchema,
      { nombre: "R", indicadores: [{ nombre: "ok" }, { nombre: "" }] },
      "indicadores.1.nombre"
    ),
    /es obligatorio/
  );
});
caso("indicador sin responder", () => {
  assert.match(
    errorDe(evaluacionSchema, { valores: { ind1: "9", ind2: "" } }, "valores.ind2"),
    /nivel de logro/
  );
});
caso("puntaje fuera de la escala del 1 al 10", () => {
  assert.match(
    errorDe(evaluacionSchema, { valores: { ind1: "11" } }, "valores.ind1"),
    /nivel de logro/
  );
});
caso("evaluación completa", () => {
  const resultado = validarPayload(evaluacionSchema, { valores: { ind1: "9", ind2: "4" } });
  assert.ok(resultado.ok);
  // Los radios mandan texto: se guarda como número.
  assert.deepEqual(resultado.data.valores, { ind1: 9, ind2: 4 });
});

console.log("fechas");
caso("ida y vuelta sin corrimiento de día", () => {
  assert.equal(aValorFecha(aFecha("2026-05-01")), "2026-05-01");
  assert.equal(aFecha("2026-05-01").toISOString(), "2026-05-01T00:00:00.000Z");
});
caso("se muestra siempre como DD/MM/AAAA", () => {
  // Día y mes de un dígito: `es-AR` sin opciones daría "8/5/2026".
  assert.equal(aFechaLegible(aFecha("2026-05-08")), "08/05/2026");
  assert.equal(aFechaLegible(aFecha("2026-12-31")), "31/12/2026");
});
caso("no se corre un día por el huso horario", () => {
  // Guardadas como medianoche UTC: en UTC-3 sin `timeZone` mostrarían el día anterior.
  assert.equal(aFechaLegible("2026-01-01T00:00:00.000Z"), "01/01/2026");
  assert.equal(aFechaLegible(new Date("2026-03-01T00:00:00.000Z")), "01/03/2026");
});

console.log(`\n${pasadas} verificaciones OK`);
