"use client";

import Link from "next/link";
<<<<<<< HEAD
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { register } from "@/lib/actions/auth";
=======
import { useState, useTransition } from "react";
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
<<<<<<< HEAD
  const router = useRouter();
=======

  // Validación frontend básica
  function validate(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    const errs: Record<string, string> = {};
    if (data.username.length < 3)
      errs.username = "Mínimo 3 caracteres";
    if (!/^[a-zA-Z0-9_]+$/.test(data.username))
      errs.username = "Solo letras, números y guion bajo";
    if (!data.email.includes("@"))
      errs.email = "Email inválido";
    if (data.password.length < 6)
      errs.password = "Mínimo 6 caracteres";
    if (data.password !== data.confirmPassword)
      errs.confirmPassword = "Las contraseñas no coinciden";
    return errs;
  }
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
<<<<<<< HEAD

    startTransition(async () => {
      const result = await register(formData);

      if (result.success) {
        // Redirigir al login después de registro exitoso
        router.push("/login?registered=true");
      } else if (result.errors) {
        // Errores de validación por campo
        const fieldErrors: Record<string, string> = {};
        Object.entries(result.errors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            fieldErrors[field] = messages[0];
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: result.error || "Error al crear la cuenta" });
      }
=======
    const data = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    // Validar en frontend
    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    startTransition(async () => {
      // TODO: Conectar con Server Action en fase backend
      // const result = await register(formData);
      console.log("[AUTH] Register attempt:", {
        username: data.username,
        email: data.email,
      });

      // Placeholder
      setErrors({
        form: "Funcionalidad disponible próximamente. Conectar con backend.",
      });
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
    });
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface-2 border border-border rounded-2xl p-8">
<<<<<<< HEAD
=======
        {/* Header */}
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-2xl text-white mb-2">
            Crea tu cuenta
          </h1>
          <p className="text-muted text-sm">
            Únete a la comunidad y empieza tu bitácora gamer
          </p>
        </div>

<<<<<<< HEAD
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm text-muted font-medium">
=======
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm text-muted font-medium"
            >
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
              Nombre de usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="gamer_pro"
              required
              disabled={isPending}
              className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
            />
            {errors.username && (
              <p className="text-red-400 text-xs">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-muted font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              required
              disabled={isPending}
              className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
            />
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
<<<<<<< HEAD
            <label htmlFor="password" className="text-sm text-muted font-medium">
=======
            <label
              htmlFor="password"
              className="text-sm text-muted font-medium"
            >
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={isPending}
                className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 pr-10 transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              >
<<<<<<< HEAD
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d={showPassword
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
=======
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={
                      showPassword
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
                    }
                  />
                </svg>
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs">{errors.password}</p>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-1.5">
<<<<<<< HEAD
            <label htmlFor="confirmPassword" className="text-sm text-muted font-medium">
=======
            <label
              htmlFor="confirmPassword"
              className="text-sm text-muted font-medium"
            >
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              required
              disabled={isPending}
              className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Error general */}
          {errors.form && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {errors.form}
            </p>
          )}

<<<<<<< HEAD
=======
          {/* Submit */}
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

<<<<<<< HEAD
=======
        {/* Link a login */}
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
        <div className="mt-6 text-center">
          <div className="w-full h-px bg-border mb-4" />
          <p className="text-muted text-xs">
            ¿Ya tienes cuenta?{" "}
<<<<<<< HEAD
            <Link href="/login" className="text-accent hover:text-white font-medium transition-colors">
=======
            <Link
              href="/login"
              className="text-accent hover:text-white font-medium transition-colors"
            >
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
