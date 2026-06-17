import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getGameById, getGameScreenshots } from "@/lib/rawg";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  const gameId = parseInt(id, 10);

  if (isNaN(gameId)) notFound();

  let game;
  let screenshots: { id: number; image: string }[] = [];

  try {
    [game, screenshots] = await Promise.all([
      getGameById(gameId),
      getGameScreenshots(gameId),
    ]);
  } catch {
    notFound();
  }

  const year = game.released ? game.released.split("-")[0] : "TBA";

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero con imagen de fondo */}
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          {game.background_image && (
            <Image
              src={game.background_image}
              alt={game.name}
              fill
              className="object-cover"
              priority
            />
          )}
          {/* Gradiente oscuro sobre la imagen */}
          <div className="absolute inset-0 bg-lienar-to-t from-surface via-surface/80 to-transparent" />

          {/* Botón de regreso */}
          <Link
            href="/"
            className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-surface/70 backdrop-blur-sm border border-border text-white text-sm px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors flex items-center gap-1.5"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver
          </Link>
        </div>

        {/* Contenido principal */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Columna izquierda: info */}
            <div className="flex-1">
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
                {game.name}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Calificación */}
                <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
                  <span className="text-accent font-bold">★</span>
                  <span className="text-white text-sm font-display font-semibold">
                    {game.rating.toFixed(1)}
                  </span>
                  <span className="text-muted text-xs">
                    ({game.ratings_count.toLocaleString()})
                  </span>
                </div>

                {/* Año */}
                <span className="text-muted text-sm">{year}</span>

                {/* Metacritic */}
                {game.metacritic && (
                  <span className="bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-md">
                    MC {game.metacritic}
                  </span>
                )}

                {/* ESRB */}
                {game.esrb_rating && (
                  <span className="text-muted text-xs border border-border px-2 py-1 rounded-md">
                    {game.esrb_rating.name}
                  </span>
                )}
              </div>

              {/* Géneros */}
              <div className="flex flex-wrap gap-2 mb-6">
                {game.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="bg-surface-3 border border-border text-muted text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Plataformas */}
              <div className="flex flex-wrap gap-2 mb-8">
                {game.platforms?.map((p) => (
                  <span
                    key={p.platform.id}
                    className="text-muted text-xs bg-surface-2 px-2 py-1 rounded"
                  >
                    {p.platform.name}
                  </span>
                ))}
              </div>

              {/* Botones de acción (modo visitante) */}
              <div className="flex flex-wrap gap-3 mb-10">
                <button className="bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors cursor-pointer">
                  ✏️ Escribir reseña
                </button>
                <button className="border border-border hover:border-muted text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors bg-surface-2 hover:bg-surface-3 cursor-pointer">
                  📋 Marcar como jugado
                </button>
                <button className="border border-border hover:border-muted text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors bg-surface-2 hover:bg-surface-3 cursor-pointer">
                  🔖 Guardar en lista
                </button>
              </div>

              {/* Descripción */}
              <div className="mb-10">
                <h2 className="font-display font-semibold text-lg text-white mb-3">
                  Acerca del juego
                </h2>
                <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
                  {game.description_raw || "Sin descripción disponible."}
                </p>
              </div>

              {/* Info adicional */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {game.developers?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">
                      Desarrollador
                    </p>
                    <p className="text-white text-sm font-medium">
                      {game.developers.map((d) => d.name).join(", ")}
                    </p>
                  </div>
                )}
                {game.publishers?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">
                      Publisher
                    </p>
                    <p className="text-white text-sm font-medium">
                      {game.publishers.map((p) => p.name).join(", ")}
                    </p>
                  </div>
                )}
                {game.playtime > 0 && (
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">
                      Tiempo promedio
                    </p>
                    <p className="text-white text-sm font-medium">
                      {game.playtime} horas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha: screenshots */}
            <div className="lg:w-80 shrink-0">
              <h3 className="font-display font-semibold text-sm text-white mb-3 uppercase tracking-wider">
                Screenshots
              </h3>
              <div className="flex flex-col gap-3">
                {screenshots.slice(0, 4).map((ss) => (
                  <div
                    key={ss.id}
                    className="rounded-lg overflow-hidden border border-border"
                  >
                    <Image
                      src={ss.image}
                      alt={`Screenshot de ${game.name}`}
                      width={320}
                      height={180}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sección de reseñas (placeholder para el CRUD) */}
          <div className="mt-16 border-t border-border pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-white">
                Reseñas de la comunidad
              </h2>
              <button className="bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-5 py-2 rounded-lg transition-colors cursor-pointer">
                Escribir reseña
              </button>
            </div>
            <div className="bg-surface-2 border border-border rounded-xl p-8 text-center">
              <p className="text-muted text-sm">
                Aún no hay reseñas para este juego. ¡Sé el primero en opinar!
              </p>
              <p className="text-muted/60 text-xs mt-2">
                🔒 El CRUD de reseñas se conectará a la base de datos.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
