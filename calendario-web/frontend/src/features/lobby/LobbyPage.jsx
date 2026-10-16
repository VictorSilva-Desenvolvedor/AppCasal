import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconButton } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { APP_MODULES } from '../../constants/appModules.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { api } from '../../services/api.js';
import { personColorFor, personTextColorFor, nextOccurrenceDate, toDateKey } from '../calendar/calendarUtils.js';
import { formatCurrency, paymentStatus, currentMonthYear } from '../financeiro/financeUtils.js';
import { CouplePairing } from './CouplePairing.jsx';

// Módulos que são a vida do casal ficam na "casa"; os de manutenção vão para a
// linha discreta de baixo (o critique apontou 14 destinos com o mesmo peso).
const UTILITY_ROUTES = new Set(['/app/atividades', '/app/convites', '/app/atualizacoes', '/app/configuracoes']);

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function daysUntil(date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - start) / 86400000);
}

function inDaysLabel(days) {
  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  return `em ${days} dias`;
}

function idOf(ref) {
  return ref?._id ?? ref;
}

// Mês "bordado": para cada dia, quem fez pelo menos um check-in de hábito.
function stitchMonth(checkins, me, partner) {
  const byDay = new Map();
  for (const c of checkins) {
    const who = String(idOf(c.user));
    if (!byDay.has(c.day)) byDay.set(c.day, new Set());
    byDay.get(c.day).add(who);
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const total = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= total; d += 1) {
    const key = toDateKey(new Date(year, month, d));
    const who = byDay.get(key) ?? new Set();
    cells.push({
      day: d,
      key,
      me: me ? who.has(String(me)) : false,
      partner: partner ? who.has(String(partner)) : false,
      isToday: d === now.getDate(),
    });
  }
  return cells;
}

// Dias seguidos (até ontem ou hoje) em que alguém do casal bordou.
function currentStreak(cells) {
  const today = cells.find((c) => c?.isToday);
  if (!today) return 0;
  let i = cells.indexOf(today);
  if (!today.me && !today.partner) i -= 1;
  let streak = 0;
  for (; i >= 0 && cells[i]; i -= 1) {
    if (cells[i].me || cells[i].partner) streak += 1;
    else break;
  }
  return streak;
}

export function LobbyPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [events, setEvents] = useState([]);
  const [entries, setEntries] = useState([]);

  const todayKey = toDateKey(new Date());

  useEffect(() => {
    const { month, year } = currentMonthYear();
    // Cada bloco carrega sozinho: se um falhar, o resto do lobby continua útil.
    api
      .getUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setUsersLoaded(true));
    api.getHabitCheckins().then(setCheckins).catch(() => {});
    api.getEmotionEntries({ day: todayKey }).then(setEmotions).catch(() => {});
    api.getEvents().then(setEvents).catch(() => {});
    api.getFinanceEntries({ month, year, type: 'despesa' }).then(setEntries).catch(() => {});
  }, [todayKey]);

  const meId = user?.id ?? user?._id;
  const me = users.find((u) => String(u._id) === String(meId)) ?? (user ? { _id: meId, name: user.name } : null);
  const partner = users.find((u) => String(u._id) !== String(meId)) ?? null;

  const cells = useMemo(() => stitchMonth(checkins, me?._id, partner?._id), [checkins, me?._id, partner?._id]);
  const streak = currentStreak(cells);
  const todayBoth = Boolean(partner) && cells.some((c) => c?.isToday && c.me && c.partner);

  const nextEvent = useMemo(() => {
    let best = null;
    for (const event of events) {
      const date = nextOccurrenceDate(event);
      if (!date) continue;
      const days = daysUntil(date);
      if (days < 0 || days > 60) continue;
      if (!best || days < best.days) best = { event, days };
    }
    return best;
  }, [events]);

  // Data do namoro: vem do evento anual "Aniversário de namoro" que o casal já
  // tem no calendário (decisão de 2026-10-16), sem campo novo no backend.
  const anniversary = useMemo(() => {
    const event = events.find((e) => /namoro/i.test(e.title || ''));
    if (!event) return null;
    const start = new Date(`${String(event.date).slice(0, 10)}T00:00`);
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months -= 1;
    const next = nextOccurrenceDate(event);
    const heartDay = next && next.getMonth() === now.getMonth() && next.getFullYear() === now.getFullYear() ? next.getDate() : null;
    return { months: Math.max(0, months), heartDay };
  }, [events]);

  function togetherLabel(months) {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
    if (rest) parts.push(`${rest} ${rest === 1 ? 'mês' : 'meses'}`);
    return `${parts.join(' e ')} juntos`;
  }

  const nextBill = useMemo(() => {
    const pending = entries
      .filter((e) => paymentStatus(e) !== 'pago')
      // `date` é meia-noite UTC do vencimento: lido como data local para não
      // cair no dia anterior no fuso de Brasília.
      .map((e) => ({ entry: e, days: daysUntil(`${String(e.date).slice(0, 10)}T00:00`) }))
      .filter((x) => x.days >= 0)
      .sort((a, b) => a.days - b.days);
    return pending[0] ?? null;
  }, [entries]);

  function emotionOf(person) {
    if (!person) return null;
    const mine = emotions.filter((e) => String(idOf(e.user)) === String(person._id));
    const last = mine[mine.length - 1];
    return last ? EMOTIONS[last.emotion] : null;
  }

  const now = new Date();
  const weekday = capitalize(now.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0]);
  const monthName = capitalize(now.toLocaleDateString('pt-BR', { month: 'long' }));

  const homeModules = APP_MODULES.filter((m) => !UTILITY_ROUTES.has(m.to));
  const utilityModules = APP_MODULES.filter((m) => UTILITY_ROUTES.has(m.to));

  const meColor = me ? personColorFor(users, me._id) : 'var(--color-primary)';
  const partnerColor = partner ? personColorFor(users, partner._id) : 'var(--color-border-strong)';

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div className="lobby-couple">
          <span className="lobby-avatars" aria-hidden="true">
            <span className="lobby-avatar" style={{ '--person': meColor, '--person-ink': me ? personTextColorFor(users, me._id) : '#fff' }}>
              {me?.name?.[0]?.toUpperCase()}
            </span>
            {partner ? (
              <span className="lobby-avatar" style={{ '--person': partnerColor, '--person-ink': personTextColorFor(users, partner._id) }}>
                {partner.name[0].toUpperCase()}
              </span>
            ) : (
              <span className="lobby-avatar is-empty">
                <Icon name="plus" />
              </span>
            )}
          </span>
          <span className="lobby-couple-names">
            {partner ? `${me?.name ?? ''} & ${partner.name}` : (me?.name ?? '')}
            {partner && anniversary?.months > 0 && <span className="lobby-together">{togetherLabel(anniversary.months)}</span>}
          </span>
        </div>
        <div className="lobby-header-actions">
          <IconButton
            title={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
            aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
            onClick={toggleTheme}
          >
            <Icon name={isDark ? 'sun' : 'moon'} />
          </IconButton>
          <button type="button" className="lobby-logout" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {/* Primeiro uso (conta sozinha): boas-vindas e o passo que faz o app ser
          "de casal" — juntar os dois no mesmo espaço. */}
      {usersLoaded && !partner && (
        <section className="lobby-welcome card card-stitched" aria-labelledby="lobby-welcome-title">
          <h2 id="lobby-welcome-title">Bem-vindos ao AppCasal</h2>
          <p>
            Aqui vocês organizam a vida a dois: agenda, contas, hábitos e o dia de cada um. O primeiro passo é
            trazer seu par para o mesmo espaço.
          </p>
          <div className="lobby-welcome-actions">
            <button type="button" className="btn btn-primary" onClick={() => setPairingOpen(true)}>
              Convidar seu par
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setPairingOpen(true)}>
              Tenho um código
            </button>
          </div>
        </section>
      )}

      <section className="lobby-hero" aria-labelledby="lobby-today-title">
        <h1 id="lobby-today-title" className="lobby-date">
          {weekday}, {now.getDate()}
        </h1>
        <p className="lobby-streak">
          {todayBoth
            ? 'Os dois fizeram o check-in hoje. Que dupla.'
            : streak > 0
              ? `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'} de check-in${partner ? ' do casal' : ''}.`
              : 'Faça o check-in de hoje para começar a sequência.'}
        </p>

        <figure className="lobby-hoop">
          <div className="lobby-hoop-cloth">
            <figcaption className="lobby-hoop-month">{monthName}</figcaption>
            <div className="lobby-hoop-grid" role="img" aria-label={`Mês de ${monthName}: ${cells.filter((c) => c && (c.me || c.partner)).length} ${cells.filter((c) => c && (c.me || c.partner)).length === 1 ? 'dia' : 'dias'} com check-in`}>
              {WEEKDAYS.map((w, i) => (
                <span key={`w${i}`} className="lobby-hoop-weekday" aria-hidden="true">
                  {w}
                </span>
              ))}
              {cells.map((c, i) =>
                c ? (
                  <span
                    key={c.key}
                    className={[
                      'lobby-stitch',
                      c.me || c.partner ? 'stitch-anim' : '',
                      c.me && c.partner ? 'is-both' : c.me ? 'is-me' : c.partner ? 'is-partner' : '',
                      c.isToday ? 'is-today' : '',
                      anniversary?.heartDay === c.day ? 'is-anniversary' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ '--me': meColor, '--partner': partnerColor, '--stitch-delay': `${(c.day % 31) * 0.03}s` }}
                    aria-hidden="true"
                  >
                    <span className="lobby-stitch-day">{c.day}</span>
                  </span>
                ) : (
                  <span key={`e${i}`} aria-hidden="true" />
                )
              )}
            </div>
            <div className="lobby-hoop-legend" aria-hidden="true">
              <span style={{ '--person': meColor }}>{me?.name}</span>
              {partner && <span style={{ '--person': partnerColor }}>{partner.name}</span>}
              {anniversary?.heartDay && <span className="lobby-legend-heart">♥ namoro</span>}
            </div>
          </div>
        </figure>
      </section>

      <CouplePairing open={pairingOpen} onClose={() => setPairingOpen(false)} />

      <section className="lobby-section" aria-labelledby="lobby-hoje">
        <h2 id="lobby-hoje" className="lobby-section-title">
          Hoje
        </h2>
        <ul className="lobby-today card card-stitched">
          {[me, partner].filter(Boolean).map((person) => {
            const emotion = emotionOf(person);
            return (
              <li key={person._id}>
                <span
                  className="lobby-person-tag"
                  style={{ '--person': personColorFor(users, person._id), '--person-ink': personTextColorFor(users, person._id) }}
                >
                  {person.name}
                </span>
                {emotion ? (
                  <span>
                    se sente <strong>{emotion.label.toLowerCase()}</strong> {emotion.emoji}
                  </span>
                ) : String(person._id) === String(me?._id) ? (
                  <Link to="/app/emocoes">Conte como você está</Link>
                ) : (
                  <span className="lobby-muted">ainda não contou como está</span>
                )}
              </li>
            );
          })}
          <li>
            <Icon name="calendar" />
            {nextEvent ? (
              <Link to="/app/calendario">
                <strong>{nextEvent.event.title}</strong> {inDaysLabel(nextEvent.days)}
                {nextEvent.event.time ? ` às ${nextEvent.event.time}` : ''}
              </Link>
            ) : (
              <Link to="/app/calendario">Nada marcado nos próximos dias</Link>
            )}
          </li>
          <li>
            <Icon name="wallet" />
            {nextBill ? (
              <Link to="/app/financeiro">
                {nextBill.entry.description} <strong className="tabular">{formatCurrency(nextBill.entry.amount)}</strong> vence{' '}
                {inDaysLabel(nextBill.days)}
              </Link>
            ) : (
              <Link to="/app/financeiro">Nenhuma conta pendente este mês</Link>
            )}
          </li>
        </ul>
      </section>

      <section className="lobby-section" aria-labelledby="lobby-acoes">
        <h2 id="lobby-acoes" className="lobby-section-title">
          Ações rápidas
        </h2>
        <div className="lobby-actions">
          <Link to="/app/habitos" className="lobby-action is-primary">
            <Icon name="habit-check" />
            Check-in
          </Link>
          <Link to="/app/financeiro" className="lobby-action">
            <Icon name="plus" />
            Lançar conta
          </Link>
          <Link to="/app/emocoes" className="lobby-action">
            <Icon name="smile" />
            Como estou
          </Link>
        </div>
      </section>

      <nav className="lobby-section" aria-labelledby="lobby-casa">
        <h2 id="lobby-casa" className="lobby-section-title">
          A casa
        </h2>
        <ul className="lobby-modules">
          {homeModules.map((app) => (
            <li key={app.to}>
              <Link to={app.to} className="lobby-module">
                <span className="lobby-module-icon">
                  <Icon name={app.icon} />
                </span>
                {app.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="lobby-utilities">
          {utilityModules.map((app) => (
            <li key={app.to}>
              <Link to={app.to} className="lobby-utility">
                <Icon name={app.icon} />
                {app.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
