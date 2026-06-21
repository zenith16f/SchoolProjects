"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Email o contraseña incorrectos");
        } else {
          router.push("/");
          router.refresh();
        }
      } catch {
        setError("Error al iniciar sesión");
      }
    });
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface-2 border border-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-2xl text-white mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-muted text-sm">
            Inicia sesión para continuar tu recorrido gamer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-muted font-medium">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                disabled={isPending}
                className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 pr-10 transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d={showPassword
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <div className="w-full h-px bg-border" />
          <p className="text-muted text-xs">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-accent hover:text-white font-medium transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
