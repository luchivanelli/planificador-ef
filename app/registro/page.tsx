"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Volleyball } from "lucide-react";
import { registrarDocente } from "@/lib/actions/auth.actions";
import { registroSchema } from "@/lib/schemas/auth.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";

export default function RegistroPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registroSchema),
    defaultValues: { nombre: "", apellido: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => registrarDocente(datos),
      onExito: (_data, redirectTo) => {
        router.replace(redirectTo ?? "/");
        router.refresh();
      },
    })
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f63ff]/10 text-[#0f63ff]">
            <Volleyball className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Planificador para docentes de Educación Física</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="surface-card space-y-3 p-6">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nombre" error={errors.nombre?.message}>
              <input {...register("nombre")} autoComplete="given-name" className="input-shell pl-9" />
            </Campo>
            <Campo label="Apellido" error={errors.apellido?.message}>
              <input {...register("apellido")} autoComplete="family-name" className="input-shell pl-9" />
            </Campo>
          </div>
          <Campo label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" autoComplete="email" className="input-shell pl-9" />
          </Campo>
          <Campo
            label="Contraseña"
            error={errors.password?.message}
            hint="Al menos 6 caracteres."
          >
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              className="input-shell pl-9"
            />
          </Campo>

          <ErrorGeneral mensaje={errors.root?.message} />

          <BotonEnviar
            enviando={isSubmitting}
            textoEnviando="Creando cuenta..."
            className="button-primary w-full"
          >
            Crear cuenta
          </BotonEnviar>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-[#0f63ff]">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
