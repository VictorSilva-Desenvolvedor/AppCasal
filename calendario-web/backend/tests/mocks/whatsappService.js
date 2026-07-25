// @whiskeysockets/baileys é publicado como ESM puro (usa `import`), o que o
// Jest (CommonJS) não consegue parsear. Como os testes não exercitam
// WhatsApp de verdade, mockamos este módulo inteiro via moduleNameMapper
// (ver jest.config.js) para nunca chegar a `require('@whiskeysockets/baileys')`.
module.exports = {
  startWhatsapp: jest.fn().mockResolvedValue(undefined),
  isWhatsappReady: jest.fn(() => false),
  getWhatsappQr: jest.fn(() => null),
  sendWhatsappMessage: jest.fn().mockResolvedValue(false),
};
