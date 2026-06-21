"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function VisitorBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: session, status } = useSession();

  // No mostrar si está logueado, si lo cerró, o mientras carga
  if (status === "loading" || session || dismissed) return null;

  return (
    <div className="bg-surface-2 border-b border-border px-4 py-2.5 flex items-center justify-between gap-2">
      <p className="text-xs text-muted text-center w-full">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/70 inline-block" />
          Estás en modo visitante — puedes explorar todo, pero para reseñar y
          guardar necesitas una cuenta.
          <Link
            href="/register"
            className="text-accent hover:text-white underline underline-offset-2 font-medium"
          >
            Crear cuenta
          </Link>
        </span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-muted hover:text-white"
        aria-label="Cerrar banner"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
