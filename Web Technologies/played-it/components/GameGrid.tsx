import type { RawgGame } from "@/lib/rawg";
import GameCard from "./GameCard";

interface GameGridProps {
  games: RawgGame[];
}

export default function GameGrid({ games }: GameGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
