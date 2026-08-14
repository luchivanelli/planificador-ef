import Link from "next/link";
import { notFound } from "next/navigation";
import { ChartNoAxesCombined, ListChecks, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getDocenteActual } from "@/lib/auth";
import RubricaForm from "@/components/RubricaForm";
import EvaluacionAlumno from "@/components/alumno/EvaluacionAlumno";
import IndicadoresClase from "@/components/clase/IndicadoresClase";
import IndicadorForm from "@/components/clase/IndicadorForm";

export default async function EvaluacionPage({
  params,
}: {
  params: Promise<{ cursoId: string; claseId: string }>;
}) {
  const { cursoId, claseId } = await params;
  const docente = await getDocenteActual();

  const curso = await db.curso.findUnique({
    where: { id: cursoId },
    include: { alumnos: { include: { alumno: true } } },
  });
  if (!curso) notFound();

  // La evaluación es por clase, así que se comprueba que la clase cuelgue de
  // este curso antes de mostrar nada.
  const clase = await db.claseDiaria.findFirst({
    where: { id: claseId, unidadDidactica: { planificacion: { cursoId } } },
    select: { id: true, fecha: true, objetivoClase: true },
  });
  if (!clase) notFound();

  const rubricas = await db.rubrica.findMany({
    where: { docenteId: docente!.id, nivel: curso.nivel, ciclo: curso.ciclo },
    include: { criterios: true },
  });

  const alumnos = curso.alumnos.map((ca) => ca.alumno);
  const evaluaciones = await db.evaluacionAlumno.findMany({
    where: { claseId, rubricaId: { in: rubricas.map((rubrica) => rubrica.id) } },
    include: { detalles: true },
  });

  // Hay una evaluación por alumno y rúbrica, así que la clave junta las dos.
  const evalMap = new Map(evaluaciones.map((e) => [`${e.rubricaId}:${e.alumnoId}`, e]));

  // Los indicadores son del docente y se reutilizan en cada clase: se traen
  // todos y se les pega el valor que tengan en ésta.
  const indicadores = await db.indicador.findMany({
    where: { docenteId: docente!.id },
    include: { evaluaciones: { where: { claseId }, select: { valor: true } } },
    orderBy: { titulo: "asc" },
  });
  const indicadoresDeClase = indicadores.map((indicador) => ({
    id: indicador.id,
    titulo: indicador.titulo,
    valor: indicador.evaluaciones[0]?.valor ?? null,
  }));

  return (
    <div className="space-y-4">
      <section className="surface-card p-5 sm:p-6">
        <Link href={`/cursos/${cursoId}/clase/${claseId}`} className="text-sm font-medium text-[#0f63ff]">
          ← Volver a la clase
        </Link>
        <h1 className="page-title mt-2">Evaluación</h1>
        <p className="page-subtitle mt-1">
          {curso.nombre} · Clase del {new Date(clase.fecha).toLocaleDateString("es-AR")}
          {clase.objetivoClase ? ` · ${clase.objetivoClase}` : ""}
        </p>
      </section>

      {rubricas.length === 0 ? (
        <section className="surface-card p-5 sm:p-6">
          <p className="text-sm text-slate-500">
            Todavía no tenés una rúbrica para este nivel y ciclo. Creá una para empezar a evaluar.
          </p>
        </section>
      ) : (
        <div className="space-y-2 surface-card p-4">
          <div className="mb-4 flex items-start sm:items-center gap-4">
            <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
              <ChartNoAxesCombined className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Rúbricas</h2>
              <p className="text-sm sm:text-base text-slate-500">Creá y aplicá rúbricas para evaluar el desempeño de los alumnos</p>
            </div>
          </div>
          {rubricas.map((rubrica) => (
            <details key={rubrica.id} className="py-2 px-4 border border-dashed border-slate-200">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base list-none flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#0f63ff]" />
                {rubrica.nombre}
              </summary>
              {alumnos.length === 0 && (
                <p className="text-sm text-slate-500 my-2">Este curso no tiene alumnos cargados.</p>
              )}
              <div className="space-y-2 py-2 overflow-y-auto max-h-[300px]">
                {alumnos.map((alumno) => (
                  <EvaluacionAlumno
                    key={alumno.id}
                    alumno={alumno}
                    rubricaId={rubrica.id}
                    criterios={rubrica.criterios}
                    cursoId={cursoId}
                    claseId={claseId}
                    evaluacion={evalMap.get(`${rubrica.id}:${alumno.id}`)}
                  />
                ))}
              </div>
            </details>
          ))}
          <details className="surface-card py-2 px-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">
              {rubricas.length === 0 ? "Crear rúbrica" : "Crear otra rúbrica"}
            </summary>
            <RubricaForm cursoId={cursoId} claseId={claseId} />
          </details>
        </div>
      )}

      <section className="surface-card p-4">
        <div className="mb-4 flex items-start sm:items-center gap-4">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <ListChecks className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Indicadores</h2>
            <p className="text-sm sm:text-base text-slate-500">
              Evaluá al grupo entero según cómo se desempeñó en esta clase.
            </p>
          </div>
        </div>

        {/* La `key` remonta el formulario cuando cambia la lista: si no, React
            Hook Form seguiría con los campos del indicador que ya no está. */}
        <IndicadoresClase
          key={indicadoresDeClase.map((indicador) => indicador.id).join("|")}
          cursoId={cursoId}
          claseId={claseId}
          indicadores={indicadoresDeClase}
        />

        <details className="surface-card mt-2 py-2 px-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">
            Crear indicador
          </summary>
          <IndicadorForm cursoId={cursoId} claseId={claseId} />
        </details>
      </section>
    </div>
  );
}
