import type { RawgGame } from "@/lib/rawg";
import Image from "next/image";
import Link from "next/link";

interface GameCardProps {
  game: RawgGame;
}

export default function GameCard({ game }: GameCardProps) {
  // Extraer el año del release
  const year = game.released ? game.released.split("-")[0] : "TBA";

  // Primer género como etiqueta
  const genre = game.genres?.[0]?.name ?? "Juego";

  return (
    <Link
      href={`/game/${game.id}`}
      className="game-card cursor-pointer group"
    >
      {/* Portada */}
      <div className="aspect-[3/4] rounded-lg bg-surface-3 border border-border overflow-hidden mb-2 relative">
        {game.background_image ? (
          <Image
            src={game.background_image}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover opacity-80 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">
            Sin imagen
          </div>
        )}

        {/* Badge de calificación */}
        <div className="absolute bottom-2 left-2 bg-surface/80 rounded-md px-1.5 py-0.5 flex items-center gap-1">
          <span className="text-accent text-xs font-bold">★</span>
          <span className="text-white text-xs font-medium">
            {game.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Nombre y metadata */}
      <p className="text-white text-xs font-medium truncate">{game.name}</p>
      <p className="text-muted text-xs">
        {year} · {genre}
      </p>
    </Link>
  );
}
