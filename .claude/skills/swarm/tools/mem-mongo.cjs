// MongoDB em memória para rodar o swarm sem tocar no Atlas de produção.
// Uso (a partir da raiz do repo): node .claude/skills/swarm/tools/mem-mongo.cjs
// Fica no ar em mongodb://127.0.0.1:27999 até o processo ser encerrado.
const path = require('path');

const backend = path.resolve(__dirname, '../../../../calendario-web/backend');
const { MongoMemoryServer } = require(path.join(backend, 'node_modules/mongodb-memory-server'));

(async () => {
  const server = await MongoMemoryServer.create({ instance: { port: 27999 } });
  console.log('READY', server.getUri());
  setInterval(() => {}, 1 << 30);
})();
