import { NextRequest, NextResponse } from "next/server";
import { getGameById } from "@/lib/rawg";

// GET /api/games/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = parseInt(id, 10);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const game = await getGameById(gameId);

    return NextResponse.json({
      id: game.id,
      name: game.name,
      slug: game.slug,
      image: game.background_image,
      rating: game.rating,
      ratings_count: game.ratings_count,
      released: game.released,
      metacritic: game.metacritic,
      description: game.description_raw,
      genres: game.genres.map((g) => g.name),
      platforms: game.platforms?.map((p) => p.platform.name) ?? [],
      developers: game.developers?.map((d) => d.name) ?? [],
      publishers: game.publishers?.map((p) => p.name) ?? [],
      playtime: game.playtime,
      website: game.website,
      esrb: game.esrb_rating?.name ?? null,
    });
  } catch (error) {
    console.error("Error en /api/games/[id]:", error);
    return NextResponse.json(
      { error: "Juego no encontrado" },
      { status: 404 }
    );
  }
}
