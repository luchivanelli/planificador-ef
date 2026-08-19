"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { registrarDocente } from "@/lib/actions/auth.actions";
import { registroSchema } from "@/lib/schemas/auth.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import AuthShell from "@/components/ui/AuthShell";

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
    <AuthShell
      titulo="Crear cuenta"
      subtitulo="Planificador para docentes de Educación Física."
      pie={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-800">
            Iniciá sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="card space-y-4 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nombre" error={errors.nombre?.message}>
            <input {...register("nombre")} autoComplete="given-name" className="input-shell" />
          </Campo>
          <Campo label="Apellido" error={errors.apellido?.message}>
            <input {...register("apellido")} autoComplete="family-name" className="input-shell" />
          </Campo>
        </div>
        <Campo label="Email" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="input-shell"
          />
        </Campo>
        <Campo label="Contraseña" error={errors.password?.message} hint="Al menos 6 caracteres.">
          <input
            {...register("password")}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input-shell"
          />
        </Campo>

        <ErrorGeneral mensaje={errors.root?.message} />

        <BotonEnviar
          enviando={isSubmitting}
          textoEnviando="Creando cuenta..."
          className="button-primary w-full"
        >
          <UserPlus className="h-4 w-4" />
          Crear cuenta
        </BotonEnviar>
      </form>
    </AuthShell>
  );
}
