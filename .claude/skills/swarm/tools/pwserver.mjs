// Servidor de navegador para os agentes do swarm: um contexto isolado por agente.
// Cada POST em http://localhost:4777 é um passo: {agent, op, ...}
//   ops: open{device}, goto{url}, click{text|selector|role,name|label|placeholder},
//        fill{label|placeholder|selector,value}, select{...,value}, press{key},
//        scroll{dy}, back, wait{ms}, snapshot, screenshot{path}, abandon, done, close
// A resposta traz url, árvore de acessibilidade e "errors" (console, pageerror e
// HTTP >= 400 desde o passo anterior).
//
// Requer o pacote `playwright` resolvível (ver README desta pasta) e o Chromium
// baixado com `npx playwright install chromium`. CHROME_PATH sobrescreve o executável.
import http from 'node:http';
import { chromium } from 'playwright';

const BASE = process.env.APP_URL || 'http://localhost:5500';
const VIEW = { desktop: [1366, 768], mobile_web: [390, 844], tablet: [820, 1180] };
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const agents = {};

async function snap(a) {
  const p = a.page;
  await p.waitForTimeout(400);
  const tree = await p.locator('body').ariaSnapshot().catch((e) => 'snapshot error: ' + e.message);
  const errs = a.errors.splice(0);
  return {
    url: p.url().replace(BASE, ''),
    title: await p.title(),
    errors: errs,
    snapshot: tree.length > 9000 ? tree.slice(0, 9000) + '\n...(truncado)' : tree,
  };
}

async function loc(p, b) {
  if (b.selector) return p.locator(b.selector).first();
  if (b.role) return p.getByRole(b.role, b.name ? { name: b.name } : {}).first();
  if (b.label) return p.getByLabel(b.label, { exact: true }).first();
  if (b.placeholder) return p.getByPlaceholder(b.placeholder).first();
  // Texto exato e visível primeiro: o parcial pegava subtítulos ("...lançamentos...")
  // e itens da barra lateral fechada antes do botão/aba que o agente queria.
  const exact = p.getByText(b.text, { exact: true }).filter({ visible: true });
  if (await exact.count()) return exact.first();
  return p.getByText(b.text, { exact: false }).filter({ visible: true }).first();
}

async function handle(b) {
  if (b.op === 'open') {
    const [w, h] = VIEW[b.device] || VIEW.desktop;
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      isMobile: b.device === 'mobile_web',
      hasTouch: b.device !== 'desktop',
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });
    const page = await ctx.newPage();
    const a = (agents[b.agent] = { ctx, page, errors: [] });
    page.on('console', (m) => m.type() === 'error' && a.errors.push('console: ' + m.text().slice(0, 300)));
    page.on('pageerror', (e) => a.errors.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('response', (r) => r.status() >= 400 && a.errors.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`));
    await page.goto(BASE + (b.url || '/'));
    return snap(a);
  }
  const a = agents[b.agent];
  if (!a) throw new Error('agente não aberto; use op=open');
  const p = a.page;
  switch (b.op) {
    case 'goto': await p.goto(b.url.startsWith('http') ? b.url : BASE + b.url); break;
    case 'click': await (await loc(p, b)).click({ timeout: 5000 }); break;
    case 'fill': await (await loc(p, b)).fill(String(b.value), { timeout: 5000 }); break;
    case 'select': await (await loc(p, b)).selectOption(b.value, { timeout: 5000 }); break;
    case 'press': await p.keyboard.press(b.key); break;
    case 'scroll': await p.mouse.wheel(0, b.dy || 600); break;
    case 'back': await p.goBack(); break;
    case 'wait': await p.waitForTimeout(Math.min(b.ms || 1500, 5000)); break;
    case 'snapshot': break;
    case 'screenshot': await p.screenshot({ path: b.path }); return { saved: b.path };
    case 'abandon':
    case 'done':
    case 'close':
      await a.ctx.close();
      delete agents[b.agent];
      return { closed: true, outcome: b.op };
    default: throw new Error('op desconhecida ' + b.op);
  }
  return snap(a);
}

http
  .createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      let out;
      try {
        out = await handle(JSON.parse(body));
      } catch (e) {
        const a = agents[JSON.parse(body || '{}').agent];
        out = { error: e.message.split('\n')[0], ...(a ? await snap(a).catch(() => ({})) : {}) };
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(out, null, 1));
    });
  })
  .listen(4777, () => console.log('PW READY 4777'));
