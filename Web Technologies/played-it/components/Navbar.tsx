"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Redirigir a /explore con el query de búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length > 0) {
      router.push(`/explore?q=${encodeURIComponent(q)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
          <span className="bg-accent text-surface font-display font-bold text-sm px-2 py-0.5 rounded select-none">
            PI
          </span>
          <span className="font-display font-semibold text-lg tracking-tight logo-glow text-accent">
            PlayedIt
          </span>
        </Link>

        {/* Barra de búsqueda funcional */}
        <div className="flex-1 max-w-lg mx-auto hidden sm:block">
          <form onSubmit={handleSearch} className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Buscar juegos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar w-full bg-surface-2 border border-border text-white placeholder-muted text-sm rounded-lg pl-10 pr-4 py-2 transition-all duration-200 focus:bg-surface-3"
            />
          </form>
        </div>

        {/* Links — desktop */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            href="/explore"
            className="text-sm text-muted hover:text-white px-3 py-2 rounded-md transition-colors font-medium"
          >
            Explorar
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted hover:text-white px-3 py-2 rounded-md transition-colors font-medium"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="ml-2 bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-150 inline-block"
          >
            Registrarse
          </Link>
        </div>

        {/* Botón menú móvil */}
        <button
          className="sm:hidden ml-auto text-muted hover:text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
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
        <div className="sm:hidden bg-surface-2 border-t border-border px-4 pb-4 pt-2 flex flex-col gap-1">
          {/* Búsqueda móvil */}
          <form onSubmit={handleSearch} className="relative mb-2">
            <input
              type="search"
              placeholder="Buscar juegos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar w-full bg-surface-3 border border-border text-white placeholder-muted text-sm rounded-lg pl-4 pr-4 py-2"
            />
          </form>
          <Link
            href="/explore"
            className="text-sm text-muted hover:text-white py-2 font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Explorar
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted hover:text-white py-2 font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="mt-2 bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm py-2 rounded-lg transition-colors text-center block"
            onClick={() => setMenuOpen(false)}
          >
            Registrarse
          </Link>
        </div>
      )}
    </header>
  );
}
