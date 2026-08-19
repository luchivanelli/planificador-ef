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
import BackLink from "@/components/BackLink";
import SectionCard from "@/components/ui/SectionCard";

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
    <div className="mx-auto max-w-2xl">
      <BackLink href="/cursos" title="Volver a mis cursos" />

      <SectionCard
        destacada
        icono={BookPlus}
        titulo="Nuevo curso"
        subtitulo="Completá los datos del curso para empezar a trabajar."
      >
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Institución" error={errors.institucion?.message}>
              <input
                {...register("institucion")}
                placeholder="Ej. Escuela N°12"
                className="input-shell"
              />
            </Campo>
            <Campo label="Nombre del curso" error={errors.nombre?.message}>
              <input {...register("nombre")} placeholder="Ej. 5° B" className="input-shell" />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <option value="">
                {nivelSeleccionado ? "Elegí un ciclo..." : "Elegí primero el nivel..."}
              </option>
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
              inputMode="numeric"
              className="input-shell"
            />
          </Campo>

          <ErrorGeneral mensaje={errors.root?.message} />

          <div className="flex flex-col-reverse gap-2 border-t border-linea pt-4 sm:flex-row sm:justify-end">
            <Link href="/cursos" className="button-secondary sm:w-auto">
              Cancelar
            </Link>
            <BotonEnviar
              enviando={isSubmitting}
              textoEnviando="Creando..."
              className="button-primary"
            >
              <BookPlus className="h-4 w-4" />
              Crear curso
            </BotonEnviar>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
