import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

type Ciclo = "primer_ciclo" | "segundo_ciclo" | "septimo_anio" | "ciclo_basico" | "ciclo_orientado";

const NIVELES_CICLOS: { nivel: "primaria" | "secundaria"; ciclo: Ciclo }[] = [
  { nivel: "primaria", ciclo: "primer_ciclo" },
  { nivel: "primaria", ciclo: "segundo_ciclo" },
  { nivel: "primaria", ciclo: "septimo_anio" },
  { nivel: "secundaria", ciclo: "ciclo_basico" },
  { nivel: "secundaria", ciclo: "ciclo_orientado" },
];

export const EJES = {
  primaria: [
    {
      nombre: "Prácticas corporales motrices y ludomotrices referidas al conocimiento y a la disponibilidad de uno mismo",
      descripcion:
        "Construcción de la corporeidad, desarrollo de habilidades motrices, percepción corporal, autonomía y cuidado de la salud.",
    },
    {
      nombre: "Prácticas corporales motrices y ludomotrices en interacción con otras personas",
      descripcion:
        "Juegos, deportes, cooperación, oposición, comunicación, convivencia y construcción de vínculos.",
    },
    {
      nombre: "Prácticas corporales motrices y ludomotrices referidas a la interacción con el ambiente",
      descripcion:
        "Actividades en la naturaleza, exploración del entorno, orientación y cuidado del ambiente.",
    },
  ],

  secundaria: [
      {
        nombre: "Prácticas deportivas",
        descripcion:
          "Deportes individuales y colectivos, estrategias, reglamentos y participación.",
      },
      {
        nombre: "Prácticas gimnásticas",
        descripcion:
          "Desarrollo de capacidades motoras, condición física, conciencia corporal y salud.",
      },
      {
        nombre: "Prácticas ludomotrices",
        descripcion:
          "Juegos motores, recreación, cooperación y resolución de situaciones motrices.",
      },
      {
        nombre: "Prácticas expresivas",
        descripcion:
          "Expresión corporal, comunicación mediante el movimiento y producción creativa.",
      },
      {
        nombre: "Prácticas corporales en relación con la naturaleza",
        descripcion:
          "Vida en la naturaleza, campamentos, orientación y educación ambiental.",
      },
  ]
};

async function main() {
  for (const { nivel, ciclo } of NIVELES_CICLOS) {
    for (const eje of EJES[nivel]) {
      const existente = await db.ejeNap.findFirst({ where: { nivel, ciclo, nombre: eje.nombre } });
      if (!existente) {
        await db.ejeNap.create({ data: { nivel, ciclo, ...eje } });
      }
    }
  }
  console.log("Ejes NAP cargados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
