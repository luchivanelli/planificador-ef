import Link from "next/link";
import { ClipboardList, MapPin, Plus, User, Bell, School } from "lucide-react";
import { db } from "@/lib/db";
import { requerirDocente } from "@/lib/auth";
import { marcarClasesDictadas, clasesPendientesDeAsistencia } from "@/lib/clases/consultas";
import { presentacionClase } from "@/lib/clases/estado";
import { cambiarEstadoClase } from "@/lib/actions/clases.actions";
import { ZONA_HORARIA, aFechaLegible, rangoDelDia, resumenLista } from "@/lib/schemas/common";
import FormSubmit from "@/components/FormSubmit";
import ListaItems from "@/components/ListaItems";
import type { Nivel, Turno } from "@prisma/client";

const NIVELES: { value: Nivel; label: string }[] = [
  { value: "primaria", label: "Primaria" },
  { value: "secundaria", label: "Secundaria" },
];

const TURNOS: { value: Turno; label: string }[] = [
  { value: "manana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
];

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

  return (
    <div className="space-y-4">
      <section>
        <h1 className="page-title">Hola, Prof. {docente?.nombre} {docente?.apellido}</h1>
        <p className="page-subtitle">Hoy es {ahora.toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            // El servidor corre en UTC: sin esto, de noche muestra el día siguiente.
            timeZone: ZONA_HORARIA,
          })}
        </p>
      </section>

      <section className="primary-card p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-4 sm:items-center">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Clases de hoy</h1>
            <p className="text-sm sm:text-base text-slate-500">
              {clasesHoy.length === 0 ? "No tenés clases programadas para hoy" : `${clasesHoy.length} clase(s) programada(s)`}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {clasesHoy.map((clase) => {
            const presentacion = presentacionClase(
              { ...clase, tieneAsistencia: clase._count.asistencias > 0 },
              ahora
            );
            const cursoDeLaClase = clase.unidadDidactica.planificacion.curso;

            return (
              <Link
                key={clase.id}
                href={`/cursos/${cursoDeLaClase.id}/clase/${clase.id}`}
                className="flex flex-1 flex-col gap-2 border border-slate-200 bg-slate-50/80 px-4 py-3 transition hover:border-[#0f63ff]/40"
              >
                <div className="flex justify-between items-center w-full">
                  <p className={`rounded-full border px-2.5 py-0.5 font-medium text-[11px] sm:text-xs ${presentacion.badge}`}>
                    {presentacion.etiqueta}
                  </p>
                  <p className="text-xs sm:text-sm p-1.5 text-[#0f63ff]">{clase.horaInicio} - {clase.horaFin}</p>
                </div>
              <h2 className="text-lg font-bold text-slate-900">{cursoDeLaClase.nombre} {cursoDeLaClase.nivel == "primaria" ? "Primaria" : "Secundaria"}</h2>
                <div className="p-4 border-1 border-dashed border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500">TEMA DEL DIA</h3>
                  <ListaItems
                    valor={clase.temaClase}
                    vacio="Sin tema definido"
                    className="text-sm sm:text-base text-slate-900 font-semibold mt-1"
                  />
                  <p className="text-xs text-slate-500">Unidad: {clase.unidadDidactica.titulo}</p>
                </div>
                {presentacion.requiereAtencion && (
                  <p className="flex items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 sm:text-sm">
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    Ya terminó y no cargaste la asistencia. Tocá para cerrarla.
                  </p>
                )}
              </Link>
            );
          })}
          {clasesHoy.length === 0 && (
            <div className="w-full border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm sm:text-base text-slate-500">
              Aún no hay clases cargadas para este día.
            </div>
          )}
        </div>
      </section>

      {pendientes.length > 0 && (
        <section className="primary-card border-amber-300 p-5 sm:p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="bg-amber-100 p-2.5 text-amber-700">
              <ClipboardList className="h-5 w-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-5 mb-1">
                Clases pendientes de asistencia
              </h2>
              <p className="text-sm sm:text-base text-slate-500">
                {pendientes.length === 1
                  ? "Quedó 1 clase de días anteriores sin cerrar."
                  : `Quedaron ${pendientes.length} clases de días anteriores sin cerrar.`}{" "}
                Cargá la asistencia para darla por dictada, o marcala como suspendida.
              </p>
            </div>
          </div>
          <div className="space-y-2">
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
                  className="flex flex-wrap items-center justify-between gap-3 border border-amber-200 bg-amber-50/60 px-4 py-3"
                >
                  <div className="min-w-[220px]">
                    <p className="text-sm font-semibold text-slate-900 sm:text-base">
                      {cursoDeLaClase.nombre} · {aFechaLegible(clase.fecha)}
                    </p>
                    <p className="text-xs text-slate-500 sm:text-sm">
                      {resumenLista(clase.objetivoClase) || "Sin objetivo definido"} · Unidad:{" "}
                      {clase.unidadDidactica.titulo}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/cursos/${cursoDeLaClase.id}/clase/${clase.id}`}
                      className="button-primary text-xs sm:text-sm"
                    >
                      Cargar asistencia
                    </Link>
                    <form action={suspender}>
                      <FormSubmit className="button-secondary text-xs sm:text-sm">
                        Marcar como suspendida
                      </FormSubmit>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="primary-card p-5 sm:p-6">
        <div className="mb-4 flex items-start sm:items-center gap-4">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <School className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Mis cursos</h2>
            <p className="text-sm sm:text-base text-slate-500">Accedé rápido a cada curso y a su planificación.</p>
          </div>
        </div>
        
        <div className="grid gap-3 md:grid-cols-2">
          {cursos.map((curso) => (
          <Link key={curso.id} href={`/cursos/${curso.id}`} className="border border-slate-200 bg-slate-50/80 hover:border-[#0f63ff]/40 p-4 sm:flex sm:items-start sm:justify-between sm:gap-4 cursor-pointer">
            <div className="space-y-2 w-full">
              <div className="flex flex-wrap justify-between items-center gap-1">
                <p className="text-sm pr-2 font-semibold text-slate-900 sm:text-lg">{curso.nombre}</p>
                <span className="border-1 border-[#0f63ff]/20 bg-[#0f63ff]/10 text-[#0f63ff] text-[11px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full">
                  {NIVELES.find((n) => n.value === curso.nivel)?.label} · {TURNOS.find((t) => t.value === curso.turno)?.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-[#0f63ff]"/>
                <p className="text-xs text-slate-500 sm:text-sm">{curso.institucion.nombre}</p>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 sm:h-4 w-3 sm:w-4 text-[#0f63ff]"/>
                <p className="text-xs text-slate-500 sm:text-sm">{curso.alumnos.length} alumnos</p>
              </div>
            </div>
          </Link>
        ))}
          {cursos.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm sm:text-base text-slate-500 sm:col-span-2">
              Todavía no creaste ningún curso.
            </div>
          )}
        </div>
        <Link href="/cursos/nuevo" className="button-secondary mt-2 w-full sm:text-sm">
          <Plus className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
          Nuevo curso
        </Link>
      </section>
    </div>
  );
}
