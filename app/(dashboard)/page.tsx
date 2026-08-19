import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  Clock,
  GraduationCap,
  Plus,
  School,
  Sun,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { marcarClasesDictadas, clasesPendientesDeAsistencia } from "@/lib/clases/consultas";
import { presentacionClase } from "@/lib/clases/estado";
import { cambiarEstadoClase } from "@/lib/actions/clases.actions";
import { ZONA_HORARIA, aFechaLegible, rangoDelDia, resumenLista } from "@/lib/schemas/common";
import FormSubmit from "@/components/FormSubmit";
import ListaItems from "@/components/ListaItems";
import ClaseBadge from "@/components/clase/ClaseBadge";
import CursoCard from "@/components/curso/CursoCard";
import EmptyState from "@/components/ui/EmptyState";
import SectionCard from "@/components/ui/SectionCard";
import StatTile from "@/components/ui/StatTile";
import { NIVELES } from "@/lib/types";

/** "lunes 5 de agosto" → "Lunes 5 de agosto". */
function conMayusculaInicial(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function DashboardPage() {
  // `requerirDocente` redirige al login: sin esto, un pedido sin sesión revienta
  // acá antes de que el layout alcance a redirigir.
  const docente = await requerirDocente();

  // Antes de leer los estados: cierra las clases que ya terminaron.
  await marcarClasesDictadas(docente.id);

  const cursos = await db.curso.findMany({
    where: { docenteId: docente.id },
    include: { alumnos: true, institucion: true },
    orderBy: { nombre: "asc" },
  });

  const ahora = new Date();
  const { inicio: hoyInicio, fin: hoyFin } = rangoDelDia(ahora);

  const clasesHoy = await db.claseDiaria.findMany({
    where: {
      fecha: { gte: hoyInicio, lt: hoyFin },
      unidadDidactica: { planificacion: { cursoId: { in: cursos.map((c) => c.id) } } },
    },
    include: {
      unidadDidactica: { include: { planificacion: { include: { curso: true } } } },
      // Es la señal de que la clase realmente se dio.
      _count: { select: { asistencias: true } },
    },
    orderBy: { fecha: "asc" },
  });

  const pendientes = await clasesPendientesDeAsistencia(docente.id);

  // Un mismo alumno puede estar en varios cursos: se cuenta una sola vez.
  const totalAlumnos = new Set(cursos.flatMap((c) => c.alumnos.map((ca) => ca.alumnoId))).size;

  const fechaDeHoy = conMayusculaInicial(
    ahora.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      // El servidor corre en UTC: sin esto, de noche muestra el día siguiente.
      timeZone: ZONA_HORARIA,
    })
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">
            Hola, Prof. {docente.nombre} {docente.apellido}
          </h1>
          <p className="page-subtitle mt-1 flex items-center gap-1.5">
            <Sun className="h-4 w-4 text-amber-500" />
            {fechaDeHoy}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icono={CalendarDays} valor={clasesHoy.length} etiqueta="Clases hoy" tono="brand" />
        <StatTile
          icono={ClipboardList}
          valor={pendientes.length}
          etiqueta="Sin cerrar"
          tono={pendientes.length > 0 ? "ambar" : "esmeralda"}
        />
        <StatTile
          icono={School}
          valor={cursos.length}
          etiqueta={cursos.length === 1 ? "Curso" : "Cursos"}
          tono="cielo"
          // href="/cursos"
        />
        <StatTile icono={Users} valor={totalAlumnos} etiqueta="Alumnos" tono="esmeralda" />
      </section>

      <SectionCard
        destacada
        icono={CalendarDays}
        titulo="Clases de hoy"
        subtitulo={
          clasesHoy.length === 0
            ? "No tenés clases programadas para hoy."
            : `${clasesHoy.length} ${clasesHoy.length === 1 ? "clase programada" : "clases programadas"}.`
        }
      >
        {clasesHoy.length === 0 ? (
          <EmptyState
            icono={CalendarDays}
            titulo="Día libre por acá"
            descripcion="Cuando cargues clases para hoy en alguna unidad didáctica, te van a aparecer en este lugar."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {clasesHoy.map((clase) => {
              const presentacion = presentacionClase(
                { ...clase, tieneAsistencia: clase._count.asistencias > 0 },
                ahora
              );
              const cursoDeLaClase = clase.unidadDidactica.planificacion.curso;
              const nivel = NIVELES.find((n) => n.value === cursoDeLaClase.nivel)?.label;

              return (
                <Link
                  key={clase.id}
                  href={`/cursos/${cursoDeLaClase.id}/clase/${clase.id}`}
                  className="card card-hover flex flex-col gap-3 border-l-[3px] border-l-brand-500 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <ClaseBadge presentacion={presentacion} />
                    {clase.horaInicio && clase.horaFin && (
                      <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-brand-700">
                        <Clock className="h-4 w-4 text-brand-400" />
                        {clase.horaInicio} – {clase.horaFin}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold leading-tight text-ink-900">
                    {cursoDeLaClase.nombre}
                    <span className="ml-1.5 text-sm font-medium text-ink-500">{nivel}</span>
                  </h3>

                  <div className="rounded-control border border-dashed border-ink-200 bg-ink-50/70 p-3">
                    <p className="section-title">Tema del día</p>
                    <ListaItems
                      valor={clase.temaClase}
                      vacio="Sin tema definido"
                      className="mt-1 text-sm font-semibold text-ink-900 sm:text-base"
                    />
                    <p className="mt-1.5 truncate text-xs text-ink-500">
                      Unidad: {clase.unidadDidactica.titulo}
                    </p>
                  </div>

                  {presentacion.requiereAtencion && (
                    <p className="flex items-start gap-2 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                      <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
                      Ya terminó y no cargaste la asistencia. Tocá para cerrarla.
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>

      {pendientes.length > 0 && (
        <section className="card overflow-hidden border-amber-200 p-4 sm:p-6">
          <header className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 sm:h-11 sm:w-11">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h2 className="card-title">Clases pendientes de asistencia</h2>
              <p className="card-subtitle mt-0.5">
                {pendientes.length === 1
                  ? "Quedó 1 clase de días anteriores sin cerrar."
                  : `Quedaron ${pendientes.length} clases de días anteriores sin cerrar.`}{" "}
                Cargá la asistencia para darla por dictada, o marcala como suspendida.
              </p>
            </div>
          </header>

          <div className="mt-4 space-y-2">
            {pendientes.map((clase) => {
              const cursoDeLaClase = clase.unidadDidactica.planificacion.curso;
              const suspender = cambiarEstadoClase.bind(
                null,
                clase.id,
                cursoDeLaClase.id,
                "suspendida",
                undefined
              );

              return (
                <div
                  key={clase.id}
                  className="flex flex-col gap-3 rounded-control border border-amber-200 bg-amber-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink-900 sm:text-base">
                      {cursoDeLaClase.nombre}
                      <span className="ml-1.5 font-medium text-ink-500">
                        {aFechaLegible(clase.fecha)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500 sm:text-sm">
                      {resumenLista(clase.objetivoClase) || "Sin objetivo definido"} · Unidad:{" "}
                      {clase.unidadDidactica.titulo}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/cursos/${cursoDeLaClase.id}/clase/${clase.id}`}
                      className="button-primary flex-1 sm:flex-none"
                    >
                      Cargar asistencia
                    </Link>
                    <form action={suspender} className="flex-1 sm:flex-none">
                      <FormSubmit className="button-secondary w-full">Suspendida</FormSubmit>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <SectionCard
        icono={GraduationCap}
        titulo="Mis cursos"
        subtitulo="Accedé rápido a cada curso y a su planificación."
        accion={
          <Link href="/cursos" className="button-secondary">
            Ver todos
          </Link>
        }
      >
        {cursos.length === 0 ? (
          <EmptyState
            icono={School}
            titulo="Todavía no creaste ningún curso"
            descripcion="Creá tu primer curso para empezar a armar la planificación anual, las unidades y las clases."
            accion={
              <Link href="/cursos/nuevo" className="button-primary">
                <Plus className="h-4 w-4" />
                Crear mi primer curso
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {cursos.map((curso) => (
              <CursoCard
                key={curso.id}
                curso={{
                  id: curso.id,
                  nombre: curso.nombre,
                  nivel: curso.nivel,
                  turno: curso.turno,
                  institucion: curso.institucion.nombre,
                  cantidadAlumnos: curso.alumnos.length,
                }}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
