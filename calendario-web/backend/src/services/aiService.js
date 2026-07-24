const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION =
  'Você transforma pedidos curtos e informais de melhorias ou bugs em tarefas claras para um quadro kanban de um app pessoal de calendário. ' +
  'Gere um título curto (até 60 caracteres) e uma descrição detalhada explicando o problema ou pedido, o contexto provável e o que seria esperado como resultado. ' +
  'Responda sempre em português do Brasil.';

const SYSTEM_INSTRUCTION_SYNOPSIS =
  'Você resume descrições de jogos, originalmente em inglês, para um resumo simples e natural em português do Brasil. ' +
  'Use no máximo 200 caracteres. Não invente informação que não esteja no texto original.';

async function generateTaskDraft(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY não configurada');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: [{ text: `Ideia do usuário: "${rawText}"` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            description: { type: 'STRING' },
          },
          required: ['title', 'description'],
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini respondeu ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Resposta da IA veio vazia');
  }

  const draft = JSON.parse(text);
  if (!draft.title || !draft.description) {
    throw new Error('Resposta da IA sem título ou descrição');
  }

  return { title: draft.title, description: draft.description };
}

async function summarizeGameSynopsis(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY não configurada');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION_SYNOPSIS }] },
      contents: [{ parts: [{ text: `Descrição original: "${rawText}"` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            synopsis: { type: 'STRING' },
          },
          required: ['synopsis'],
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini respondeu ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Resposta da IA veio vazia');
  }

  const draft = JSON.parse(text);
  if (!draft.synopsis) {
    throw new Error('Resposta da IA sem sinopse');
  }

  return draft.synopsis;
}

module.exports = { generateTaskDraft, summarizeGameSynopsis };
