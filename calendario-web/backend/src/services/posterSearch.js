const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

async function searchTmdb(mediaType, query) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.results || []).slice(0, 6).map((result) => ({
    id: result.id,
    title: result.title || result.name,
    subtitle: (result.release_date || result.first_air_date || '').slice(0, 4),
    posterUrl: result.poster_path ? `${TMDB_IMAGE_BASE}${result.poster_path}` : '',
  }));
}

async function searchRawg(query) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=6`;
  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.results || []).map((result) => ({
    id: result.id,
    title: result.name,
    subtitle: (result.released || '').slice(0, 4),
    posterUrl: result.background_image || '',
  }));
}

const SEARCHERS = {
  filme: (query) => searchTmdb('movie', query),
  serie: (query) => searchTmdb('tv', query),
  jogo: (query) => searchRawg(query),
};

// Busca de capa é um recurso auxiliar (não bloqueia criar/editar item), então
// qualquer falha externa vira lista vazia em vez de erro pro usuário.
async function searchPoster(type, query) {
  const searcher = SEARCHERS[type];
  if (!searcher || !query) return [];

  try {
    return await searcher(query);
  } catch (err) {
    console.error('Falha ao buscar capa externa:', err.message);
    return [];
  }
}

module.exports = { searchPoster };
