const { summarizeGameSynopsis } = require('./aiService');

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

function formatRuntime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// A RAWG não tem parâmetro de idioma (ao contrário do TMDB, que já busca
// filme/série em pt-BR) — aqui usamos o Gemini pra resumir/traduzir a
// descrição em inglês. Se a IA falhar por qualquer motivo, cai pro texto
// bruto cortado em vez de quebrar o enriquecimento do item inteiro.
async function translateSynopsis(rawText) {
  if (!rawText) return '';

  try {
    return await summarizeGameSynopsis(rawText);
  } catch (err) {
    console.error('Falha ao traduzir sinopse com IA:', err.message);
    return truncate(rawText, 200);
  }
}

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

async function movieDetails(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=pt-BR&append_to_response=credits`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const director = (data.credits?.crew || [])
    .filter((person) => person.job === 'Director')
    .map((person) => person.name)
    .join(', ');

  return {
    genres: (data.genres || []).map((g) => g.name),
    director,
    duration: formatRuntime(data.runtime),
    rating: data.vote_average ? Number(data.vote_average.toFixed(1)) : null,
    synopsis: truncate(data.overview, 500),
  };
}

async function tvDetails(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=pt-BR`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const seasons = data.number_of_seasons;
  const avgRuntime = data.episode_run_time?.length
    ? Math.round(data.episode_run_time.reduce((a, b) => a + b, 0) / data.episode_run_time.length)
    : 0;

  const durationParts = [];
  if (seasons) durationParts.push(`${seasons} temporada${seasons > 1 ? 's' : ''}`);
  if (avgRuntime) durationParts.push(`~${avgRuntime}min/ep`);

  return {
    genres: (data.genres || []).map((g) => g.name),
    director: (data.created_by || []).map((person) => person.name).join(', '),
    duration: durationParts.join(' • '),
    rating: data.vote_average ? Number(data.vote_average.toFixed(1)) : null,
    synopsis: truncate(data.overview, 500),
  };
}

async function gameDetails(id) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.rawg.io/api/games/${id}?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();

  return {
    genres: (data.genres || []).map((g) => g.name),
    director: (data.developers || []).map((dev) => dev.name).join(', '),
    duration: data.playtime ? `~${data.playtime}h para zerar` : '',
    rating: data.rating ? Number(data.rating.toFixed(1)) : null,
    synopsis: await translateSynopsis(data.description_raw),
  };
}

const DETAIL_FETCHERS = {
  filme: movieDetails,
  serie: tvDetails,
  jogo: gameDetails,
};

// Mesma filosofia do searchPoster: detalhe é enriquecimento opcional, nunca
// deve impedir o usuário de salvar o item se a API externa falhar.
async function getDetails(type, id) {
  const fetcher = DETAIL_FETCHERS[type];
  if (!fetcher || !id) return null;

  try {
    return await fetcher(id);
  } catch (err) {
    console.error('Falha ao buscar detalhes externos:', err.message);
    return null;
  }
}

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

module.exports = { searchPoster, getDetails };
