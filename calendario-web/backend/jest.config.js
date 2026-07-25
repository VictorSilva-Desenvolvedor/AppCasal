module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 30000,
  clearMocks: true,
  // @whiskeysockets/baileys (dependência transitiva de whatsappService.js) é
  // ESM puro e quebra o parser do Jest — mockamos o módulo inteiro.
  moduleNameMapper: {
    'whatsappService$': '<rootDir>/tests/mocks/whatsappService.js',
  },
};
