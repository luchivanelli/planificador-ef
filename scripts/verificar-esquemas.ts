import assert from "node:assert";
import { loginSchema, registroSchema } from "../lib/schemas/auth.schema";
import { alumnoSchema, cursoSchema } from "../lib/schemas/curso.schema";
import { planificacionSchema, unidadDidacticaSchema } from "../lib/schemas/planificacion.schema";
import { claseSchema, actividadSchema } from "../lib/schemas/clase.schema";
import { juegoSchema, separarMateriales } from "../lib/schemas/juego.schema";
import { rubricaSchema, evaluacionSchema } from "../lib/schemas/evaluacion.schema";
import { indicadorSchema, indicadoresClaseSchema } from "../lib/schemas/indicador.schema";
import { aFecha, aValorFecha } from "../lib/schemas/common";
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
caso("fecha de nacimiento futura", () => {
  assert.match(
    errorDe(alumnoSchema, { nombre: "A", apellido: "B", fechaNacimiento: "2099-01-01" }, "fechaNacimiento"),
    /no puede ser futura/
  );
});
caso("DNI con puntos", () => {
  assert.match(
    errorDe(alumnoSchema, { nombre: "A", apellido: "B", fechaNacimiento: "2015-03-02", dni: "12.345.678" }, "dni"),
    /entre 7 y 9 números/
  );
});
caso("DNI vacío es obligatorio", () => {
  assert.match(
    errorDe(alumnoSchema, { nombre: "A", apellido: "B", fechaNacimiento: "2015-03-02", dni: "  " }, "dni"),
    /es obligatorio/
  );
});
caso("contacto vacío es válido y el DNI se limpia", () => {
  const r = validarPayload(alumnoSchema, {
    nombre: "A",
    apellido: "B",
    fechaNacimiento: "2015-03-02",
    dni: " 12345678 ",
  });
  assert.ok(r.ok);
  assert.equal(r.ok && r.data.dni, "12345678");
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
caso("rúbrica sin criterios", () => {
  assert.match(errorDe(rubricaSchema, { nombre: "R", criterios: [] }, "criterios"), /al menos un criterio/);
});
caso("criterio vacío se marca por índice", () => {
  assert.match(
    errorDe(rubricaSchema, { nombre: "R", criterios: [{ nombre: "ok" }, { nombre: "" }] }, "criterios.1.nombre"),
    /es obligatorio/
  );
});
caso("criterio sin responder", () => {
  assert.match(
    errorDe(evaluacionSchema, { valores: { crit1: "9", crit2: "" } }, "valores.crit2"),
    /nivel de logro/
  );
});
caso("nivel fuera de la escala", () => {
  assert.match(
    errorDe(evaluacionSchema, { valores: { crit1: "11" } }, "valores.crit1"),
    /nivel de logro/
  );
});
caso("evaluación completa", () => {
  const resultado = validarPayload(evaluacionSchema, { valores: { crit1: "9", crit2: "4" } });
  assert.ok(resultado.ok);
  // Los radios mandan texto: se guarda como número.
  assert.deepEqual(resultado.data.valores, { crit1: 9, crit2: 4 });
});

console.log("indicadores");
caso("el título es obligatorio", () => {
  assert.match(errorDe(indicadorSchema, { titulo: "   " }, "titulo"), /es obligatorio/);
});
caso("valor fuera de la escala", () => {
  assert.match(errorDe(indicadoresClaseSchema, { valores: { ind1: "TAL_VEZ" } }, "valores.ind1"), /Elegí un valor/);
});
caso("se puede dejar un indicador sin responder", () => {
  const resultado = validarPayload(indicadoresClaseSchema, { valores: { ind1: "SI", ind2: "" } });
  assert.ok(resultado.ok);
  assert.deepEqual(resultado.data.valores, { ind1: "SI", ind2: "" });
});

console.log("fechas");
caso("ida y vuelta sin corrimiento de día", () => {
  assert.equal(aValorFecha(aFecha("2026-05-01")), "2026-05-01");
  assert.equal(aFecha("2026-05-01").toISOString(), "2026-05-01T00:00:00.000Z");
});

console.log(`\n${pasadas} verificaciones OK`);
