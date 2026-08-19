"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { iniciarSesion } from "@/lib/actions/auth.actions";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";
import AuthShell from "@/components/ui/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((datos) =>
    enviarFormulario({
      setError,
      accion: () => iniciarSesion(datos),
      onExito: (_data, redirectTo) => {
        router.replace(redirectTo ?? "/");
        router.refresh();
      },
    })
  );

  return (
    <AuthShell
      titulo="Iniciá sesión"
      subtitulo="Entrá con tu cuenta para seguir planificando."
      pie={
        <>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-600 hover:text-brand-800">
            Registrate
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="card space-y-4 p-5 sm:p-6">
        <Campo label="Email" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="input-shell"
          />
        </Campo>
        <Campo label="Contraseña" error={errors.password?.message}>
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="input-shell"
          />
        </Campo>

        <ErrorGeneral mensaje={errors.root?.message} />

        <BotonEnviar
          enviando={isSubmitting}
          textoEnviando="Ingresando..."
          className="button-primary w-full"
        >
          <LogIn className="h-4 w-4" />
          Ingresar
        </BotonEnviar>
      </form>
    </AuthShell>
  );
}
