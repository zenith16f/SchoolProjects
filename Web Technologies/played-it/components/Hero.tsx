import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero-grid relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 pb-24">
      {/* Glow de fondo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Etiqueta superior */}
        <span className="inline-flex items-center gap-2 text-accent text-xs font-medium tracking-widest uppercase mb-6 border border-accent/20 bg-accent/5 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Comunidad gamer
        </span>

        {/* Título principal */}
        <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight mb-5">
          Tu bitácora
          <br />
          <span className="text-accent">de juegos</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-muted text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
          Registra lo que jugaste, califica tus experiencias y descubre qué
          jugar después gracias a la comunidad.
        </p>

        {/* Botones CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-accent hover:bg-accent-dim text-surface font-display font-semibold px-7 py-3 rounded-xl transition-colors text-sm text-center"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto border border-border hover:border-muted text-white font-display font-medium px-7 py-3 rounded-xl transition-colors text-sm bg-surface-2 hover:bg-surface-3 text-center"
          >
            Explorar juegos
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="mt-14 flex items-center justify-center gap-8 sm:gap-12">
          <div className="text-center">
            <p className="font-display font-bold text-2xl text-white">12K+</p>
            <p className="text-muted text-xs mt-0.5">Juegos registrados</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="font-display font-bold text-2xl text-white">3.4K</p>
            <p className="text-muted text-xs mt-0.5">Reseñas esta semana</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="font-display font-bold text-2xl text-white">8.1K</p>
            <p className="text-muted text-xs mt-0.5">Gamers activos</p>
          </div>
        </div>
      </div>
    </section>
  );
}
