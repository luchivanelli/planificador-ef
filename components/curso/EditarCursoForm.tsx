"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { actualizarCurso } from "@/lib/actions/curso.actions";
import { cursoSchema } from "@/lib/schemas/curso.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { cerrarDetails } from "@/lib/form/cerrar-details";
import { CICLOS_POR_NIVEL, NIVELES, TURNOS } from "@/lib/types";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import type { Ciclo, Nivel, Turno } from "@prisma/client";

export type CursoEditable = {
  id: string;
  nombre: string;
  nivel: Nivel;
  ciclo: Ciclo;
  turno: Turno;
  anioLectivo: number;
  institucion: string;
};

export default function EditarCursoForm({ curso }: { curso: CursoEditable }) {
  const router = useRouter();
  const formId = `curso-form-${curso.id}`;
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      institucion: curso.institucion,
      nombre: curso.nombre,
      nivel: curso.nivel,
      ciclo: curso.ciclo,
      turno: curso.turno,
      // El año lectivo no se edita (no tiene campo en el formulario), pero va en
      // el payload porque `cursoSchema` lo pide. `actualizarCurso` lo ignora.
      anioLectivo: curso.anioLectivo,
    },
  });

  // `useWatch` en vez de `watch()`: es compatible con el React Compiler.
  const nivelSeleccionado = useWatch({ control, name: "nivel" });
  const ciclosDisponibles = nivelSeleccionado ? CICLOS_POR_NIVEL[nivelSeleccionado] : [];

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => actualizarCurso(curso.id, datos),
      errorInesperado: "No se pudo actualizar el curso",
      onExito: () => {
        toast.success("Curso actualizado");
        cerrarDetails(formId);
        router.refresh();
      },
    })
  );

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4 pt-1">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Institución" error={errors.institucion?.message}>
          <input {...register("institucion")} placeholder="Ej. Escuela N°12" className="input-shell" />
        </Campo>
        <Campo label="Nombre del curso" error={errors.nombre?.message}>
          <input {...register("nombre")} placeholder="Ej. 5° B" className="input-shell" />
        </Campo>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo label="Nivel" error={errors.nivel?.message}>
          <select
            {...register("nivel", {
              // Al cambiar de nivel, el ciclo guardado deja de ser válido (las dos
              // listas son disjuntas), así que se limpia para volver a elegirlo.
              // `resetField` no sirve acá: volvería al ciclo que ya tiene el curso.
              onChange: () => setValue("ciclo", "" as unknown as Ciclo),
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
      </div>

      <ErrorGeneral mensaje={errors.root?.message} />

      <div className="flex justify-end border-t border-linea pt-3">
        <BotonEnviar enviando={isSubmitting} textoEnviando="Guardando..." className="button-primary">
          Guardar cambios
        </BotonEnviar>
      </div>
    </form>
  );
}
