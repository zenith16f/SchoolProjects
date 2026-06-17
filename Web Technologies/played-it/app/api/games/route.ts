import { NextRequest, NextResponse } from "next/server";
import { searchGames, getTrendingGames } from "@/lib/rawg";

// GET /api/games?q=elden+ring
// Si no hay query, devuelve trending
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const pageSize = parseInt(searchParams.get("limit") ?? "12", 10);

    let games;

    if (query && query.length > 0) {
      games = await searchGames(query, pageSize);
    } else {
      games = await getTrendingGames(pageSize);
    }

    // Respuesta simplificada (nuestra API propia)
    const simplified = games.map((game) => ({
      id: game.id,
      name: game.name,
      slug: game.slug,
      image: game.background_image,
      rating: game.rating,
      ratings_count: game.ratings_count,
      released: game.released,
      genres: game.genres.map((g) => g.name),
    }));

    return NextResponse.json({
      count: simplified.length,
      results: simplified,
    });
  } catch (error) {
    console.error("Error en /api/games:", error);
    return NextResponse.json(
      { error: "Error al obtener juegos" },
      { status: 500 }
    );
  }
}
