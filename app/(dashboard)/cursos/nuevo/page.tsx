"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookPlus } from "lucide-react";
import { crearCurso } from "@/lib/actions/curso.actions";
import { cursoSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { CICLOS_POR_NIVEL, NIVELES, TURNOS } from "@/lib/types";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";

export default function NuevoCursoPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      institucion: "",
      nombre: "",
      nivel: undefined,
      ciclo: undefined,
      turno: "manana" as const,
      anioLectivo: new Date().getFullYear(),
    },
  });

  // `useWatch` en vez de `watch()`: es compatible con el React Compiler.
  const nivelSeleccionado = useWatch({ control, name: "nivel" });
  const ciclosDisponibles = nivelSeleccionado ? CICLOS_POR_NIVEL[nivelSeleccionado] : [];

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => crearCurso(datos),
      onExito: (_data, redirectTo) => router.push(redirectTo ?? "/cursos"),
    })
  );

  return (
    <div className="mx-auto max-w-xl">
      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-4 sm:items-center">
          <div className="bg-[#0f63ff]/10 p-2.5 text-[#0f63ff]">
            <BookPlus className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Nuevo curso</h1>
            <p className="text-sm text-slate-500 sm:text-base">Completá los datos del curso para empezar a trabajar.</p>
          </div>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <Campo label="Institución" error={errors.institucion?.message}>
            <input {...register("institucion")} placeholder="Ej. Escuela N°12" className="input-shell pl-9" />
          </Campo>
          <Campo label="Nombre del curso" error={errors.nombre?.message}>
            <input {...register("nombre")} placeholder="Ej. 5° B" className="input-shell pl-9" />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Nivel" error={errors.nivel?.message}>
              <select
                {...register("nivel", {
                  // Al cambiar de nivel, el ciclo elegido puede dejar de ser válido.
                  onChange: () => resetField("ciclo"),
                })}
                className="input-shell"
              >
                <option value="">Elegir...</option>
                {NIVELES.map((nivel) => (
                  <option key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Turno" error={errors.turno?.message}>
              <select {...register("turno")} className="input-shell">
                {TURNOS.map((turno) => (
                  <option key={turno.value} value={turno.value}>
                    {turno.label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <Campo
            label="Ciclo"
            error={errors.ciclo?.message}
            hint="Elegí el ciclo que corresponda al nivel seleccionado."
          >
            <select {...register("ciclo")} disabled={!nivelSeleccionado} className="input-shell">
              <option value="">{nivelSeleccionado ? "Elegí un ciclo..." : "Elegí primero el nivel..."}</option>
              {ciclosDisponibles.map((ciclo) => (
                <option key={ciclo.value} value={ciclo.value}>
                  {ciclo.label}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Año lectivo" error={errors.anioLectivo?.message}>
            <input
              {...register("anioLectivo", { valueAsNumber: true })}
              type="number"
              className="input-shell pl-9"
            />
          </Campo>

          <ErrorGeneral mensaje={errors.root?.message} />

          <div className="flex gap-2 pt-3">
            <Link href="/cursos" className="button-secondary w-full">
              Cancelar
            </Link>
            <BotonEnviar
              enviando={isSubmitting}
              textoEnviando="Creando..."
              className="button-primary w-full cursor-pointer"
            >
              Crear curso
            </BotonEnviar>
          </div>
        </form>
      </section>
    </div>
  );
}
