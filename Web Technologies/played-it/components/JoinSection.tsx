import Link from "next/link";

export default function JoinSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto bg-surface-2 border border-border rounded-2xl px-8 py-12 text-center relative overflow-hidden">
        {/* Glows decorativos */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-2xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative">
          <span className="text-2xl mb-4 block select-none">🎮</span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-3 text-white">
            Empieza a registrar tu
            <br />
            recorrido gamer
          </h2>
          <p className="text-muted text-sm sm:text-base mb-8 max-w-md mx-auto">
            Únete a miles de gamers que ya llevan su bitácora, comparten reseñas
            y encuentran su próximo juego favorito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-accent hover:bg-accent-dim text-surface font-display font-semibold px-8 py-3 rounded-xl transition-colors text-sm text-center inline-block"
            >
              Unirse
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
