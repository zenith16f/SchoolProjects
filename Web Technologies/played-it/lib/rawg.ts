// =====================================================
// lib/rawg.ts — Funciones para consumir la API de RAWG.io
// Docs: https://rawg.io/apidocs
// =====================================================

const BASE_URL = "https://api.rawg.io/api";

function getApiKey(): string {
  const key = process.env.RAWG_API_KEY;
  if (!key) {
    throw new Error("RAWG_API_KEY no está configurada en .env.local");
  }
  return key;
}

// --- Tipos ---

export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  rating: number;
  ratings_count: number;
  released: string | null;
  metacritic: number | null;
  genres: { id: number; name: string; slug: string }[];
  platforms: {
    platform: { id: number; name: string; slug: string };
  }[];
  short_screenshots: { id: number; image: string }[];
}

export interface RawgGameDetail extends RawgGame {
  description_raw: string;
  developers: { id: number; name: string }[];
  publishers: { id: number; name: string }[];
  esrb_rating: { id: number; name: string } | null;
  website: string;
  playtime: number;
  tags: { id: number; name: string; slug: string }[];
}

export interface RawgResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- Funciones de fetch ---

// Obtener juegos populares / tendencias
export async function getTrendingGames(
  pageSize: number = 12
): Promise<RawgGame[]> {
  const key = getApiKey();
  const url = `${BASE_URL}/games?key=${key}&ordering=-rating&page_size=${pageSize}&metacritic=80,100`;

  const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hora
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

  const data: RawgResponse<RawgGame> = await res.json();
  return data.results;
}

// Buscar juegos por texto
export async function searchGames(
  query: string,
  pageSize: number = 12
): Promise<RawgGame[]> {
  const key = getApiKey();
  const url = `${BASE_URL}/games?key=${key}&search=${encodeURIComponent(query)}&page_size=${pageSize}`;

  const res = await fetch(url, { next: { revalidate: 600 } }); // Cache 10 min
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

  const data: RawgResponse<RawgGame> = await res.json();
  return data.results;
}

// Obtener detalle de un juego por ID
export async function getGameById(id: number): Promise<RawgGameDetail> {
  const key = getApiKey();
  const url = `${BASE_URL}/games/${id}?key=${key}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

  return res.json();
}

// Obtener screenshots de un juego
export async function getGameScreenshots(
  id: number
): Promise<{ image: string; id: number }[]> {
  const key = getApiKey();
  const url = `${BASE_URL}/games/${id}/screenshots?key=${key}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

  const data = await res.json();
  return data.results;
}

// Obtener juegos por género
export async function getGamesByGenre(
  genreSlug: string,
  pageSize: number = 12
): Promise<RawgGame[]> {
  const key = getApiKey();
  const url = `${BASE_URL}/games?key=${key}&genres=${genreSlug}&ordering=-rating&page_size=${pageSize}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

  const data: RawgResponse<RawgGame> = await res.json();
  return data.results;
}

// Obtener lista de géneros disponibles
export interface RawgGenre {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
}

export async function getGenres(): Promise<RawgGenre[]> {
  const key = getApiKey();
  const url = `${BASE_URL}/genres?key=${key}`;

  const res = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24h
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

  const data: RawgResponse<RawgGenre> = await res.json();
  return data.results;
}

// Explorar juegos con paginación, búsqueda y filtro por género
export async function exploreGames(options: {
  query?: string;
  genre?: string;
  page?: number;
  pageSize?: number;
  ordering?: string;
}): Promise<{ results: RawgGame[]; count: number; next: string | null }> {
  const key = getApiKey();
  const { query, genre, page = 1, pageSize = 20, ordering = "-rating" } = options;

  const params = new URLSearchParams({
    key,
    page: String(page),
    page_size: String(pageSize),
    ordering,
  });

  if (query) params.set("search", query);
  if (genre) params.set("genres", genre);

  const url = `${BASE_URL}/games?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);

  const data: RawgResponse<RawgGame> = await res.json();
  return { results: data.results, count: data.count, next: data.next };
}
