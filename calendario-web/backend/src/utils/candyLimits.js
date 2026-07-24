// Teto do "segurar o botão" em ms. O frontend mantém sua própria cópia deste
// valor (src/features/doces/candyConfig.js) pois não há código compartilhado
// entre backend e frontend neste repo.
const MAX_HOLD_MS = 30000; // 30s

module.exports = { MAX_HOLD_MS };
