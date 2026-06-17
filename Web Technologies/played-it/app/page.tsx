import Footer from "@/components/Footer";
import GameGrid from "@/components/GameGrid";
import Hero from "@/components/Hero";
import JoinSection from "@/components/JoinSection";
import Navbar from "@/components/Navbar";
import VisitorBanner from "@/components/VisitorBanner";
import { getTrendingGames } from "@/lib/rawg";

export default async function Home() {
  // Fetch de juegos en el servidor (Server Component)
  let games = [];
  try {
    games = await getTrendingGames(12);
  } catch (error) {
    console.error("Error al obtener juegos de RAWG:", error);
  }

  return (
    <>
      <Navbar />
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
            <button className="text-sm text-muted hover:text-white transition-colors font-medium flex items-center gap-1 cursor-pointer">
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
            </button>
          </div>

          {games.length > 0 ? (
            <GameGrid games={games} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted text-sm">
                No se pudieron cargar los juegos. Verifica tu API key en{" "}
                <code className="text-accent">.env.local</code>
              </p>
            </div>
          )}
        </section>

        <JoinSection />
      </main>

      <Footer />
    </>
  );
}
