import Link from "next/link";
import Navbar from "@/components/Navbar";
import VisitorBanner from "@/components/VisitorBanner";
import Hero from "@/components/Hero";
import GameGrid from "@/components/GameGrid";
import JoinSection from "@/components/JoinSection";
import Footer from "@/components/Footer";
<<<<<<< HEAD
import { getTrendingGames, getGamesByGenre, exploreGames } from "@/lib/rawg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Componente reutilizable para headers de sección
function SectionHeader({
  label,
  title,
  href,
}: {
  label: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <p className="text-accent text-xs font-medium tracking-widest uppercase mb-1">
          {label}
        </p>
        <h2 className="font-display font-bold text-xl text-white">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm text-muted hover:text-white font-medium flex items-center gap-1"
        >
          Ver todo
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  // Fetch de juegos trending (siempre)
  let trending = [];
  try {
    trending = await getTrendingGames(12);
  } catch (error) {
    console.error("Error al obtener trending:", error);
  }

  // Si está logueado, traer más categorías en paralelo
  let newReleases: typeof trending = [];
  let rpgGames: typeof trending = [];
  let indieGames: typeof trending = [];
  let actionGames: typeof trending = [];

  if (isLoggedIn) {
    try {
      const [newData, rpg, indie, action] = await Promise.all([
        exploreGames({ ordering: "-released", pageSize: 6 }),
        getGamesByGenre("role-playing-games-rpg", 6),
        getGamesByGenre("indie", 6),
        getGamesByGenre("action", 6),
      ]);
      newReleases = newData.results;
      rpgGames = rpg;
      indieGames = indie;
      actionGames = action;
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
=======
import { getTrendingGames } from "@/lib/rawg";

export default async function Home() {
  // Fetch de juegos en el servidor (Server Component)
  let games = [];
  try {
    games = await getTrendingGames(12);
  } catch (error) {
    console.error("Error al obtener juegos de RAWG:", error);
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
  }

  return (
    <>
      <Navbar />
<<<<<<< HEAD
      {!isLoggedIn && <VisitorBanner />}

      <main id="main-content" className="flex-1">
        {/* === VISITANTE: Hero + CTA === */}
        {!isLoggedIn && <Hero />}

        {/* === LOGUEADO: Bienvenida === */}
        {isLoggedIn && (
          <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm mb-1">
                  Bienvenido de vuelta,
                </p>
                <h1 className="font-display font-bold text-2xl text-white">
                  {session.user.name} 👋
                </h1>
              </div>
              <Link
                href="/explore"
                className="bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-5 py-2 rounded-lg"
              >
                Explorar todo
              </Link>
            </div>
          </section>
        )}

        {/* === Tendencias (siempre visible) === */}
        <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
          <SectionHeader
            label="Tendencias"
            title="Lo más jugado ahora"
            href="/explore"
          />
          {trending.length > 0 ? (
            <GameGrid games={trending} />
=======
      <VisitorBanner />

      <main className="flex-1">
        <Hero />

        {/* Sección de juegos populares */}
        <section
          id="explorar"
          className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-accent text-xs font-medium tracking-widest uppercase mb-1">
                Tendencias
              </p>
              <h2 className="font-display font-bold text-xl text-white">
                Lo más jugado ahora
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-sm text-muted hover:text-white transition-colors font-medium flex items-center gap-1"
            >
              Ver todo
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {games.length > 0 ? (
            <GameGrid games={games} />
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
          ) : (
            <div className="text-center py-12">
              <p className="text-muted text-sm">
                No se pudieron cargar los juegos. Verifica tu API key en{" "}
                <code className="text-accent">.env.local</code>
              </p>
            </div>
          )}
        </section>

<<<<<<< HEAD
        {/* === LOGUEADO: Secciones adicionales === */}
        {isLoggedIn && (
          <>
            {/* Lanzamientos recientes */}
            {newReleases.length > 0 && (
              <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
                <SectionHeader
                  label="Nuevos"
                  title="Lanzamientos recientes"
                  href="/explore?order=-released"
                />
                <GameGrid games={newReleases} />
              </section>
            )}

            {/* RPG */}
            {rpgGames.length > 0 && (
              <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
                <SectionHeader
                  label="Género"
                  title="RPG"
                  href="/explore?genre=role-playing-games-rpg"
                />
                <GameGrid games={rpgGames} />
              </section>
            )}

            {/* Indie */}
            {indieGames.length > 0 && (
              <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
                <SectionHeader
                  label="Género"
                  title="Indie"
                  href="/explore?genre=indie"
                />
                <GameGrid games={indieGames} />
              </section>
            )}

            {/* Acción */}
            {actionGames.length > 0 && (
              <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
                <SectionHeader
                  label="Género"
                  title="Acción"
                  href="/explore?genre=action"
                />
                <GameGrid games={actionGames} />
              </section>
            )}
          </>
        )}

        {/* === VISITANTE: CTA de registro === */}
        {!isLoggedIn && <JoinSection />}
=======
        <JoinSection />
>>>>>>> 30257b0bbc266734be5d6a539933f17b83680492
      </main>

      <Footer />
    </>
  );
}
