import Footer from "@/components/Footer";
import GameGrid from "@/components/GameGrid";
import Navbar from "@/components/Navbar";
import { exploreGames, getGenres } from "@/lib/rawg";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explorar juegos",
  description:
    "Descubre los juegos mejor calificados, busca por nombre o filtra por género en PlayedIt.",
};

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    page?: string;
    order?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const genre = params.genre ?? "";
  const page = parseInt(params.page ?? "1", 10);
  const ordering = params.order ?? "-rating";

  // Fetch de datos en paralelo
  const [gamesData, genres] = await Promise.all([
    exploreGames({ query, genre, page, pageSize: 24, ordering }).catch(() => ({
      results: [],
      count: 0,
      next: null,
    })),
    getGenres().catch(() => []),
  ]);

  const totalPages = Math.ceil(gamesData.count / 24);

  // Construir URL para paginación manteniendo los filtros actuales
  function buildUrl(overrides: Record<string, string>) {
    const base: Record<string, string> = {};
    if (query) base.q = query;
    if (genre) base.genre = genre;
    if (ordering !== "-rating") base.order = ordering;
    const merged = { ...base, ...overrides };
    const qs = new URLSearchParams(merged).toString();
    return `/explore${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="flex-1"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-white mb-2">
              Explorar juegos
            </h1>
            <p className="text-muted text-sm">
              {query
                ? `Resultados para "${query}"`
                : genre
                  ? `Filtrando por género`
                  : "Descubre los juegos mejor calificados"}
              {" — "}
              <span className="text-white">
                {gamesData.count.toLocaleString()}
              </span>{" "}
              juegos encontrados
            </p>
          </div>

          {/* Barra de búsqueda dedicada */}
          <form
            action="/explore"
            method="GET"
            className="mb-6"
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
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
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar por nombre..."
                  className="search-bar w-full bg-surface-2 border border-border text-white placeholder-muted text-sm rounded-xl pl-10 pr-4 py-3 transition-all duration-200 focus:bg-surface-3"
                />
              </div>
              <button
                type="submit"
                className="bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Buscar
              </button>
            </div>
            {/* Mantener filtros en la búsqueda */}
            {genre && (
              <input
                type="hidden"
                name="genre"
                value={genre}
              />
            )}
          </form>

          {/* Filtros por género */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/explore"
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                !genre
                  ? "bg-accent text-surface"
                  : "bg-surface-2 text-muted border border-border hover:text-white hover:border-muted"
              }`}
            >
              Todos
            </Link>
            {genres.slice(0, 15).map((g) => (
              <Link
                key={g.id}
                href={buildUrl({ genre: g.slug, page: "1" })}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  genre === g.slug
                    ? "bg-accent text-surface"
                    : "bg-surface-2 text-muted border border-border hover:text-white hover:border-muted"
                }`}
              >
                {g.name}
              </Link>
            ))}
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-muted text-xs">Ordenar por:</span>
            {[
              { value: "-rating", label: "Mejor calificados" },
              { value: "-released", label: "Más recientes" },
              { value: "-added", label: "Más populares" },
              { value: "name", label: "A – Z" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ order: opt.value, page: "1" })}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  ordering === opt.value
                    ? "bg-surface-3 text-white border border-border"
                    : "text-muted hover:text-white"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {/* Grid de juegos */}
          {gamesData.results.length > 0 ? (
            <GameGrid games={gamesData.results} />
          ) : (
            <div className="text-center py-20">
              <p className="text-muted text-lg mb-2">
                No se encontraron juegos
              </p>
              <p className="text-muted/60 text-sm">
                Intenta con otro término de búsqueda o cambia los filtros
              </p>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              {/* Anterior */}
              {page > 1 ? (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="text-sm text-muted hover:text-white bg-surface-2 border border-border px-4 py-2 rounded-lg transition-colors"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="text-sm text-muted/30 bg-surface-2 border border-border/50 px-4 py-2 rounded-lg">
                  ← Anterior
                </span>
              )}

              {/* Info de página */}
              <span className="text-sm text-muted px-4">
                Página{" "}
                <span className="text-white font-display font-semibold">
                  {page}
                </span>{" "}
                de{" "}
                <span className="text-white font-display font-semibold">
                  {Math.min(totalPages, 500)}
                </span>
              </span>

              {/* Siguiente */}
              {gamesData.next ? (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="text-sm text-muted hover:text-white bg-surface-2 border border-border px-4 py-2 rounded-lg transition-colors"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="text-sm text-muted/30 bg-surface-2 border border-border/50 px-4 py-2 rounded-lg">
                  Siguiente →
                </span>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
