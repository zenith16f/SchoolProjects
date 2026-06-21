"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isLoggedIn = !!session?.user;

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className="shrink-0 flex items-center gap-2"
          aria-label="PlayedIt inicio"
        >
          <span className="bg-accent text-surface font-display font-bold text-sm px-2 py-0.5 rounded select-none">
            PI
          </span>
          <span className="font-display font-semibold text-lg tracking-tight logo-glow text-accent">
            PlayedIt
          </span>
        </Link>

        {/* Búsqueda */}
        <div className="flex-1 max-w-lg mx-auto hidden sm:block">
          <form
            action="/explore"
            method="GET"
            role="search"
            className="relative"
          >
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Buscar juegos..."
              aria-label="Buscar juegos"
              className="search-bar w-full bg-surface-2 border border-border text-white placeholder-muted text-sm rounded-lg pl-10 pr-4 py-2 focus:bg-surface-3"
            />
          </form>
        </div>

        {/* Links — desktop */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            href="/explore"
            className="text-sm text-muted hover:text-white px-3 py-2 rounded-md font-medium"
          >
            Explorar
          </Link>

          {isLoading ? (
            <div className="w-20 h-8 bg-surface-2 rounded-lg animate-pulse" />
          ) : isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-muted hover:text-white px-3 py-2 rounded-md font-medium"
              >
                <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-accent text-xs font-display font-semibold">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </span>
                {session.user.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-muted hover:text-red-400 px-3 py-2 rounded-md font-medium cursor-pointer"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted hover:text-white px-3 py-2 rounded-md font-medium"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="ml-2 bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-4 py-2 rounded-lg inline-block"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Botón menú móvil */}
        <button
          className="sm:hidden ml-auto text-muted hover:text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </nav>

      {/* Menú móvil */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="sm:hidden bg-surface-2 border-t border-border px-4 pb-4 pt-2 flex flex-col gap-1"
        >
          <form
            action="/explore"
            method="GET"
            role="search"
            className="mb-2"
          >
            <input
              type="search"
              name="q"
              placeholder="Buscar juegos..."
              aria-label="Buscar juegos"
              className="search-bar w-full bg-surface-3 border border-border text-white placeholder-muted text-sm rounded-lg px-4 py-2"
            />
          </form>
          <Link
            href="/explore"
            className="text-sm text-muted hover:text-white py-2 font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Explorar
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted hover:text-white py-2 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Mi perfil
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="text-sm text-red-400 hover:text-red-300 py-2 font-medium text-left cursor-pointer"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted hover:text-white py-2 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="mt-2 bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm py-2 rounded-lg text-center block"
                onClick={() => setMenuOpen(false)}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
