"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Volleyball } from "lucide-react";
import { iniciarSesion } from "@/lib/actions/auth.actions";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { enviarFormulario } from "@/lib/form/enviar-formulario";
import { Campo, ErrorGeneral } from "@/components/form/Campo";
import BotonEnviar from "@/components/form/BotonEnviar";

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
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f63ff]/10 text-[#0f63ff]">
            <Volleyball className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Planificador EF</h1>
          <p className="mt-1 text-sm text-slate-500">Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="surface-card space-y-3 p-6">
          <Campo label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" autoComplete="email" className="input-shell pl-9" />
          </Campo>
          <Campo label="Contraseña" error={errors.password?.message}>
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              className="input-shell pl-9"
            />
          </Campo>

          <ErrorGeneral mensaje={errors.root?.message} />

          <BotonEnviar enviando={isSubmitting} textoEnviando="Ingresando..." className="button-primary w-full">
            Ingresar
          </BotonEnviar>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-semibold text-[#0f63ff]">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
