// Minimal in-memory Supabase stand-in (auth + PostgREST subset) for local UI testing only.
// Never touches the real project. See docs/REDESIGN.md ("Como repetir o teste local").
// Run: node scripts/mock-supabase.mjs  — log in with EMAIL / PASSWORD below.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT) || 54321;
const USER_ID = '00000000-0000-4000-8000-000000000001';
const EMAIL = 'teste@venceja.test';
const PASSWORD = 'teste-local-123';

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const ACCESS = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: USER_ID, email: EMAIL, role: 'authenticated', aud: 'authenticated', exp, iat: exp - 86400 })}.c2ln`;

const user = {
  id: USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: EMAIL,
  email_confirmed_at: new Date().toISOString(),
  user_metadata: { name: 'Kadu Teste' },
  app_metadata: { provider: 'email', providers: ['email'] },
  created_at: new Date().toISOString(),
};

const session = () => ({ access_token: ACCESS, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'mock-refresh', user });

const SERVICE_KEY = process.env.MOCK_SERVICE_KEY || 'local-placeholder';

// Local calendar day: toISOString would jump to tomorrow during the Brazilian evening.
const day = (o) => {
  const d = new Date();
  d.setDate(d.getDate() + o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const db = {
  profiles: [{ id: USER_ID, email: EMAIL, plano: process.env.PLANO || 'free', is_admin: false, created_at: new Date().toISOString(), subscription_status: null, subscription_ends_at: null }],
  clients: [
    { id: 'cl-1', user_id: USER_ID, nome: 'Carla Mendes', telefone: '5511987654321', email: null, score: 80, total_pago: 360, total_atrasado: 0, created_at: day(-90) },
    { id: 'cl-2', user_id: USER_ID, nome: 'Oficina do Beto', telefone: '5511976543210', email: null, score: 55, total_pago: 480, total_atrasado: 650, created_at: day(-60) },
  ],
  charges: [],
  payments: [],
};

const ch = (id, client_id, valor, venc, descricao, pago) => ({
  id,
  user_id: USER_ID,
  client_id,
  valor,
  valor_pago: pago !== undefined ? valor : 0,
  data_vencimento: day(venc),
  status: pago !== undefined ? 'pago' : 'pendente',
  data_pagamento: pago !== undefined ? day(pago) : null,
  dias_atraso: pago !== undefined ? Math.max(0, pago - venc) : 0,
  descricao,
  recorrente: false,
  periodicidade: null,
  charge_original_id: null,
  created_at: new Date(Date.now() + (Math.min(venc, pago ?? venc, 0) - 15) * 86400000).toISOString(),
});

const cl = (id, nome, telefone, created) => ({ id, user_id: USER_ID, nome, telefone, email: null, score: 70, total_pago: 0, total_atrasado: 0, created_at: day(created) });

// Deterministic seeds so screens can be compared across runs.
const seeds = {
  vazio() {
    db.clients = [];
    db.charges = [];
  },
  basico() {
    db.clients = [cl('cl-1', 'Carla Mendes', '5511987654321', -90), cl('cl-2', 'Oficina do Beto', '5511976543210', -60)];
    db.charges = [
      ch('ch-1', 'cl-2', 650, -4, 'Manutenção do portão'),
      ch('ch-2', 'cl-1', 180, 0, 'Mensalidade · Pilates'),
      ch('ch-3', 'cl-1', 180, -30, 'Mensalidade · Pilates', -30),
      ch('ch-4', 'cl-1', 180, -60, 'Mensalidade · Pilates', -58),
      ch('ch-5', 'cl-2', 480, -40, 'Troca de fechadura', -33),
      ch('ch-6', 'cl-1', 180, 30, 'Mensalidade · Pilates'),
    ];
  },
  limite() {
    seeds.basico();
    db.clients.push(cl('cl-3', 'Lucas Prado', '5521998765432', -30));
    for (let i = 7; i <= 10; i++) db.charges.push(ch(`ch-${i}`, 'cl-3', 120, i * 3, `Aula particular ${i}`));
  },
  cheio() {
    db.clients = [
      cl('cl-1', 'Carla Mendes', '5511987654321', -420),
      cl('cl-2', 'Oficina do Beto', '5511976543210', -400),
      cl('cl-3', 'Lucas Prado', '5521998765432', -380),
      cl('cl-4', 'Studio Aurora', '5531991234567', -300),
      cl('cl-5', 'Rafael Lima', '5541996543210', -240),
      cl('cl-6', 'Padaria Bom Dia', '5551993456789', -200),
      cl('cl-7', 'Clínica Sorriso', '5511955554444', -150),
      cl('cl-8', 'Marina Tavares', null, -5),
    ];
    db.charges = [];
    let n = 0;
    const id = () => `ch-${++n}`;
    for (let m = 13; m >= 1; m--) {
      db.charges.push(ch(id(), 'cl-1', 180, -m * 30 + 2, 'Mensalidade · Pilates', -m * 30 + 2));
      if (m % 2 === 0) db.charges.push(ch(id(), 'cl-3', 240, -m * 30 - 6, 'Aulas particulares', -m * 30 - 6 + (m % 4)));
      if (m % 3 === 0 && m > 0) db.charges.push(ch(id(), 'cl-2', 480 + m * 20, -m * 30, 'Serviço na oficina', -m * 30 + 9));
    }
    for (let i = 1; i <= 6; i++) {
      const venc = -150 + i * 30;
      db.charges.push(i <= 5 ? ch(id(), 'cl-4', 420, venc, `Parcela ${i}/6`, venc + (i === 3 ? 4 : 0)) : ch(id(), 'cl-4', 420, venc, `Parcela ${i}/6`));
    }
    db.charges.push(
      ch(id(), 'cl-2', 650, -4, 'Manutenção do portão'),
      ch(id(), 'cl-5', 380, -12, 'Instalação elétrica'),
      ch(id(), 'cl-5', 220, -47, 'Visita técnica'),
      ch(id(), 'cl-5', 300, -90, 'Troca de disjuntores', -70),
      ch(id(), 'cl-1', 180, 0, 'Mensalidade · Pilates'),
      ch(id(), 'cl-3', 240, 2, 'Aulas particulares'),
      ch(id(), 'cl-6', 950, 9, 'Cardápio e fotos'),
      ch(id(), 'cl-6', 700, -18, 'Logo e identidade', -18),
      ch(id(), 'cl-7', 1200, 16, 'Site institucional'),
      ch(id(), 'cl-7', 1200, 46, 'Site institucional, 2ª parte'),
      ch(id(), 'cl-8', 300, 21, 'Consultoria inicial')
    );
  },
  mil() {
    seeds.cheio();
    for (let i = 0; i < 40; i++) db.clients.push(cl(`cx-${i}`, `Cliente ${i + 1}`, null, -300));
    for (let i = 0; i < 1000; i++) {
      const venc = -360 + (i % 400);
      db.charges.push(ch(`cx-c-${i}`, `cx-${i % 40}`, 50 + (i % 37) * 10, venc, `Serviço ${i}`, venc < -5 && i % 5 !== 0 ? venc + (i % 6) : undefined));
    }
  },
  dificil() {
    db.clients = [
      cl('cl-1', 'Fernanda Albuquerque de Vasconcelos Cavalcanti, Filha; "Dra." Ltda', '5511987654321', -90),
      cl('cl-2', '=HYPERLINK("x")', null, -60),
    ];
    db.charges = [
      ch('ch-1', 'cl-1', 1000000, -4, 'Reforma completa da sede, com "projeto"; parte 1\ne acabamento'),
      ch('ch-2', 'cl-2', 0.01, -1, '+55 ligar'),
      ch('ch-3', 'cl-1', 999999.99, 20, 'Parcela final', undefined),
      ch('ch-4', 'cl-1', 123456.78, -30, 'Paga', -29),
    ];
  },
};

seeds[process.env.MOCK_SEED || 'cheio']();

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        resolve(null);
      }
    });
  });

function matches(row, params) {
  for (const [key, raw] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(key)) continue;
    const dot = raw.indexOf('.');
    const op = raw.slice(0, dot);
    const val = raw.slice(dot + 1);
    const cell = row[key];
    const str = cell === null || cell === undefined ? null : String(cell);
    if (op === 'eq' && str !== val) return false;
    if (op === 'neq' && str === val) return false;
    if (op === 'gte' && !(str !== null && str >= val)) return false;
    if (op === 'lte' && !(str !== null && str <= val)) return false;
    if (op === 'is' && !(val === 'null' ? cell == null : String(cell) === val)) return false;
    if (op === 'in') {
      const list = val.replace(/^\(|\)$/g, '').split(',').map((v) => v.replace(/^"|"$/g, ''));
      if (!list.includes(str)) return false;
    }
    if (op === 'ilike' || op === 'like') {
      const re = new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[%*]/g, '.*') + '$', op === 'ilike' ? 'i' : '');
      if (!re.test(str || '')) return false;
    }
  }
  return true;
}

function embed(table, rows, select) {
  if (table === 'charges' && select && select.includes('client:clients')) {
    return rows.map((r) => ({ ...r, client: db.clients.find((c) => c.id === r.client_id) || null }));
  }
  return rows;
}

function order(rows, orderParam) {
  if (!orderParam) return rows;
  const [col, dir] = orderParam.split('.');
  return [...rows].sort((a, b) => {
    const x = a[col];
    const y = b[col];
    const c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y));
    return dir === 'desc' ? -c : c;
  });
}

let settingsTable = true;

const defaults = {
  charges: { valor_pago: 0, dias_atraso: 0, data_pagamento: null, charge_original_id: null, recorrente: false, periodicidade: null, status: 'pendente', descricao: null },
  clients: { email: null, score: 70, total_pago: 0, total_atrasado: 0 },
  payments: { comprovante_url: null },
  notification_settings: { daily_email: true, last_sent_on: null },
};

http
  .createServer(async (req, res) => {
    cors(req, res);
    if (req.method === 'OPTIONS') return send(res, 204);
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const path = url.pathname;
    const auth = req.headers.authorization || '';
    const service = auth === `Bearer ${SERVICE_KEY}`;
    const authed = service || auth === `Bearer ${ACCESS}`;
    console.log(req.method, path + url.search);

    // ---- mock controls
    if (path === '/__mock/plan') {
      db.profiles[0].plano = url.searchParams.get('plano') || 'free';
      db.profiles[0].subscription_status = db.profiles[0].plano === 'pro' ? 'active' : null;
      db.profiles[0].subscription_ends_at = db.profiles[0].plano === 'pro' ? new Date(Date.now() + 25 * 86400000).toISOString() : null;
      return send(res, 200, db.profiles[0]);
    }

    if (path === '/__mock/seed') {
      const perfil = url.searchParams.get('perfil') || 'cheio';
      if (!seeds[perfil]) return send(res, 400, { message: 'seed desconhecida' });
      seeds[perfil]();
      return send(res, 200, { clients: db.clients.length, charges: db.charges.length });
    }
    if (path === '/__mock/settings-table') {
      settingsTable = url.searchParams.get('on') !== '0';
      return send(res, 200, { settingsTable });
    }

    // ---- auth
    if (path === '/auth/v1/token') {
      const body = await readBody(req);
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password' && (body?.email !== EMAIL || body?.password !== PASSWORD)) {
        return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials', message: 'Invalid login credentials' });
      }
      return send(res, 200, session());
    }
    if (path === '/auth/v1/user') {
      if (!authed) return send(res, 401, { code: 401, message: 'invalid JWT' });
      if (req.method === 'PUT') {
        const body = await readBody(req);
        if (body?.data) user.user_metadata = { ...user.user_metadata, ...body.data };
      }
      return send(res, 200, user);
    }
    if (path === '/auth/v1/logout') return send(res, 204);

    // ---- rest
    const m = path.match(/^\/rest\/v1\/(\w+)$/);
    if (m) {
      if (!authed) return send(res, 401, { message: 'JWT required' });
      const table = m[1];
      if (table === 'notification_settings' && !settingsTable) {
        return send(res, 404, { code: 'PGRST205', message: 'Could not find the table public.notification_settings in the schema cache' });
      }
      if (!db[table]) db[table] = [];
      const params = [...url.searchParams.entries()];
      const select = url.searchParams.get('select');
      const accept = req.headers.accept || '';
      const prefer = req.headers.prefer || '';
      const single = accept.includes('vnd.pgrst.object+json');
      const wantsRep = prefer.includes('return=representation');

      const reply = (rows, status = 200) => {
        const out = embed(table, rows, select);
        const range = rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0';
        if (single) {
          if (out.length !== 1) return send(res, 406, { code: 'PGRST116', details: `The result contains ${out.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
          return send(res, status, out[0], { 'Content-Range': range });
        }
        if (req.method === 'HEAD') return send(res, 200, undefined, { 'Content-Range': range });
        return send(res, status, out, { 'Content-Range': range });
      };

      if (req.method === 'GET' || req.method === 'HEAD') {
        // PostgREST paging: offset/limit from .range(), applied after filter and order, as the real server does.
        const todas = order(db[table].filter((r) => matches(r, params)), url.searchParams.get('order'));
        const offset = Number(url.searchParams.get('offset')) || 0;
        const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : Infinity;
        return reply(todas.slice(offset, offset + limit));
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        const items = (Array.isArray(body) ? body : [body]).map((r) => ({ id: randomUUID(), created_at: new Date().toISOString(), ...(defaults[table] || {}), ...r }));
        const conflict = url.searchParams.get('on_conflict');
        if (conflict && prefer.includes('merge-duplicates')) {
          const merged = items.map((item) => {
            const found = db[table].find((r) => r[conflict] === item[conflict]);
            if (found) return Object.assign(found, item);
            db[table].push(item);
            return item;
          });
          return wantsRep ? reply(merged, 201) : send(res, 201);
        }
        const limit = { clients: 3, charges: 10 }[table];
        if (limit && !service && db.profiles[0].plano !== 'pro') {
          if (db[table].length + items.length > limit) return send(res, 400, { code: 'P0001', message: 'plan_limit', details: null, hint: null });
        }
        db[table].push(...items);
        return wantsRep ? reply(items, 201) : send(res, 201);
      }
      if (req.method === 'PATCH') {
        const body = await readBody(req);
        const rows = db[table].filter((r) => matches(r, params));
        rows.forEach((r) => Object.assign(r, body));
        return wantsRep ? reply(rows) : send(res, 204);
      }
      if (req.method === 'DELETE') {
        const rows = db[table].filter((r) => matches(r, params));
        db[table] = db[table].filter((r) => !rows.includes(r));
        return wantsRep ? reply(rows) : send(res, 204);
      }
    }

    send(res, 404, { message: 'not mocked' });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`mock supabase on http://127.0.0.1:${PORT}  user=${EMAIL}`));
