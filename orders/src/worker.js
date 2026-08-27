/* AL BAIK order board.
 *
 * The customer's phone sends WHAT they want. It never sends what it costs -
 * this worker prices every line itself from the live menu, so a tampered
 * phone cannot put "12pc Bucket ... $0.01" on the cashier's screen.
 *
 * There is no card handling anywhere in here. The customer gets a number,
 * walks to the register, and the till takes the money. That is deliberate:
 * taking cards would drag PCI scope into a static menu site.
 */

const MENU_URL = "https://albaik.dpdns.org/assets/data/menu.json";
const TZ = "America/Los_Angeles";

const ALLOWED = [
  "https://albaik.dpdns.org",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
];

/* Orders are a kitchen ticket, not a record. A week is plenty to settle an
   argument about last Friday, and nothing here is worth keeping longer. */
const KEEP_DAYS = 7;

const LIMITS = {
  lines: 40,        // distinct dishes in one order
  qty: 20,          // of any one dish
  leaveOut: 12,
  lineNote: 120,
  note: 200,
  name: 40,
  seat: 10,
  perIp: 6,         // orders from one phone...
  perIpWindow: 300  // ...in five minutes
};

/* ---------------- small helpers ---------------- */

const json = (data, status, origin) =>
  new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...cors(origin)
    }
  });

function cors(origin) {
  const ok = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    "access-control-allow-origin": ok,
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "vary": "origin"
  };
}

const enc = new TextEncoder();

function b64url(buf) {
  let s = "";
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function rand(bytes) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

async function sha(msg) {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(msg)));
}

/* Constant-time compare, so a wrong PIN cannot be found one character at a
   time by watching how long the answer takes. */
function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function clean(s, max) {
  if (typeof s !== "string") return "";
  // flatten control characters - they do nothing useful on a kitchen ticket
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/* Today's date where the restaurant is, not where the customer is. Order
   numbers have to roll over when the kitchen closes, not at UTC midnight. */
function today(when) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date(when));
  const g = {};
  p.forEach(x => { g[x.type] = x.value; });
  return `${g.year}-${g.month}-${g.day}`;
}

/* ---------------- tokens ---------------- */

async function mint(secret, role) {
  const body = `${role}.${Date.now() + 14 * 3600 * 1000}`;
  return `${body}.${await hmac(secret, body)}`;
}

async function whom(secret, header) {
  const raw = (header || "").replace(/^Bearer\s+/i, "");
  const bits = raw.split(".");
  if (bits.length !== 3) return null;
  const [role, exp, sig] = bits;
  if (!await hmac(secret, `${role}.${exp}`).then(s => same(s, sig))) return null;
  if (Number(exp) < Date.now()) return null;
  return role;
}

/* ---------------- the menu, as the server sees it ---------------- */

let cachedMenu = null;
let cachedAt = 0;

async function menu() {
  if (cachedMenu && Date.now() - cachedAt < 120000) return cachedMenu;

  /* GitHub Pages serves this with max-age=600, which would leave the worker
     charging yesterday's prices for ten minutes after a change. Rotating the
     query once a minute gives the edge cache a new key, so a price the manager
     publishes is the price being charged within about a minute. */
  const res = await fetch(`${MENU_URL}?t=${Math.floor(Date.now() / 60000)}`, { cf: { cacheTtl: 60 } });
  if (!res.ok) throw new Error("menu unavailable");
  const sections = await res.json();

  const byId = new Map();
  for (const sec of sections) {
    for (const it of sec.items || []) {
      byId.set(it.id, { item: it, section: sec });
    }
  }
  cachedMenu = { sections, byId };
  cachedAt = Date.now();
  return cachedMenu;
}

/* Same rule the menu page uses, so "leave out" can only ever name something
   that is actually in the dish. */
function ingredientsOf(item) {
  if (item.ingredients) return item.ingredients;
  if (!item.desc) return [];
  const parts = item.desc.replace(/\.\s*$/, "").split(/\s*,\s*/)
    .map(t => t.trim()
      .replace(/^(drizzled|garnished|topped|served)\s+with\s+/i, "")
      .replace(/^with\s+/i, ""))
    .filter(Boolean);
  return parts.length > 1 ? parts : [];
}

/* Rebuilds the order from scratch. Anything the phone sent that is not a
   dish id, a size on that dish, a listed option or a listed ingredient is
   dropped on the floor. Returns priced lines or throws a plain message. */
async function priceUp(rawLines) {
  const { byId } = await menu();
  if (!Array.isArray(rawLines) || !rawLines.length) throw new Error("Your order is empty.");
  if (rawLines.length > LIMITS.lines) throw new Error("That is too many different dishes for one order.");

  const out = [];
  let subtotal = 0;

  for (const raw of rawLines) {
    const found = byId.get(raw && raw.id);
    if (!found) throw new Error("Something on that order is no longer on the menu.");
    const { item, section } = found;

    if (section.soon) throw new Error(`${section.name} is not being served yet.`);
    if (item.soldout) throw new Error(`${item.name} is sold out.`);

    const qty = Math.floor(Number(raw.qty));
    if (!(qty >= 1 && qty <= LIMITS.qty)) throw new Error("Check the quantities on your order.");

    let unit, size = null;
    if (typeof item.price === "number") {
      unit = item.price;
    } else if (section.sizes) {
      const pick = section.sizes.find(s => s.label === raw.size);
      if (!pick) throw new Error(`Pick a size for ${item.name}.`);
      unit = pick.price;
      size = pick.label;
    } else {
      throw new Error(`${item.name} cannot be ordered here.`);
    }

    // every option group the dish defines must be answered, from its own list
    const options = [];
    for (const g of item.options || []) {
      const chose = raw.options && raw.options[g.name];
      if (!g.choices.includes(chose)) throw new Error(`Choose a ${g.name.toLowerCase()} for ${item.name}.`);
      options.push({ name: g.name, choice: chose });
    }

    const canLeave = ingredientsOf(item);
    const leaveOut = (Array.isArray(raw.leaveOut) ? raw.leaveOut : [])
      .filter(x => canLeave.includes(x))
      .slice(0, LIMITS.leaveOut);

    out.push({
      id: item.id,
      name: item.name,
      section: section.name,
      size,
      qty,
      unit,
      options,
      leaveOut,
      note: clean(raw.note, LIMITS.lineNote)
    });
    subtotal += unit * qty;
  }

  return { lines: out, subtotal: Math.round(subtotal * 100) / 100 };
}

/* ---------------- routes ---------------- */

async function setting(env, k) {
  const row = await env.DB.prepare("SELECT v FROM settings WHERE k = ?").bind(k).first();
  return row ? row.v : null;
}

async function placeOrder(req, env, origin) {
  if (await setting(env, "accepting") !== "1") {
    return json({ error: "The kitchen has paused online orders. Please order at the counter." }, 503, origin);
  }

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400, origin); }

  const ip = await sha((req.headers.get("cf-connecting-ip") || "?") + "|" + env.AUTH_SECRET);
  const since = Date.now() - LIMITS.perIpWindow * 1000;
  const recent = await env.DB
    .prepare("SELECT COUNT(*) AS n FROM orders WHERE ip = ? AND placed_at > ?")
    .bind(ip, since).first();
  if (recent && recent.n >= LIMITS.perIp) {
    return json({ error: "That is a lot of orders in a few minutes. Give it a moment." }, 429, origin);
  }

  let priced;
  try { priced = await priceUp(body.lines); }
  catch (e) { return json({ error: e.message }, 400, origin); }

  const now = Date.now();
  const day = today(now);
  const id = crypto.randomUUID();
  const ticket = rand(12);
  const kind = body.kind === "pickup" ? "pickup" : "dinein";

  /* One statement, so two phones tapping "Place order" together cannot be
     handed the same number. SQLite settles the MAX inside the insert. */
  await env.DB.prepare(
    `INSERT INTO orders (id, ticket, num, day, kind, who, seat, note, lines, subtotal, status, ip, placed_at, changed_at)
     SELECT ?, ?, COALESCE(MAX(num), 100) + 1, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?
     FROM orders WHERE day = ?`
  ).bind(
    id, ticket, day, kind,
    clean(body.who, LIMITS.name),
    kind === "dinein" ? clean(body.seat, LIMITS.seat) : "",
    clean(body.note, LIMITS.note),
    JSON.stringify(priced.lines), priced.subtotal,
    ip, now, now, day
  ).run();

  const row = await env.DB.prepare("SELECT num FROM orders WHERE id = ?").bind(id).first();

  // opportunistic tidy-up; a kitchen ticket is not a record to keep
  await env.DB.prepare("DELETE FROM orders WHERE placed_at < ?")
    .bind(now - KEEP_DAYS * 86400000).run();

  return json({
    ticket, num: row.num, status: "new",
    subtotal: priced.subtotal, lines: priced.lines, placedAt: now
  }, 200, origin);
}

async function trackOrder(ticket, env, origin) {
  const row = await env.DB
    .prepare("SELECT num, status, placed_at, subtotal FROM orders WHERE ticket = ?")
    .bind(ticket).first();
  if (!row) return json({ error: "not found" }, 404, origin);
  return json({ num: row.num, status: row.status, placedAt: row.placed_at, subtotal: row.subtotal }, 200, origin);
}

async function board(url, env, origin) {
  const since = Number(url.searchParams.get("since") || 0);
  const day = today(Date.now());
  const { results } = await env.DB.prepare(
    `SELECT id, num, kind, who, seat, note, lines, subtotal, status, placed_at, changed_at
     FROM orders WHERE day = ? AND changed_at > ? ORDER BY num ASC`
  ).bind(day, since).all();

  return json({
    now: Date.now(),
    accepting: await setting(env, "accepting") === "1",
    orders: (results || []).map(r => ({
      id: r.id, num: r.num, kind: r.kind, who: r.who, seat: r.seat, note: r.note,
      lines: JSON.parse(r.lines), subtotal: r.subtotal, status: r.status,
      placedAt: r.placed_at, changedAt: r.changed_at
    }))
  }, 200, origin);
}

const FLOW = ["new", "preparing", "ready", "done"];

async function setStatus(req, env, role, origin) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400, origin); }
  const { id, status } = body;

  if (status === "void" && role !== "admin") {
    return json({ error: "Only the manager can void an order." }, 403, origin);
  }
  if (!FLOW.includes(status) && status !== "void") {
    return json({ error: "Unknown status." }, 400, origin);
  }

  const res = await env.DB
    .prepare("UPDATE orders SET status = ?, changed_at = ? WHERE id = ?")
    .bind(status, Date.now(), id).run();
  if (!res.meta.changes) return json({ error: "not found" }, 404, origin);
  return json({ ok: true }, 200, origin);
}

async function report(env, origin) {
  const day = today(Date.now());
  const { results } = await env.DB.prepare(
    `SELECT status, COUNT(*) AS n, SUM(subtotal) AS total
     FROM orders WHERE day = ? GROUP BY status`
  ).bind(day).all();

  let orders = 0, money = 0;
  for (const r of results || []) {
    if (r.status === "void") continue;
    orders += r.n;
    money += r.total || 0;
  }
  return json({
    day, orders,
    subtotal: Math.round(money * 100) / 100,
    byStatus: results || []
  }, 200, origin);
}

/* ---------------- entry ---------------- */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "";
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });

    try {
      if (path === "/api/health") {
        return json({ ok: true, accepting: await setting(env, "accepting") === "1" }, 200, origin);
      }

      if (path === "/api/order" && req.method === "POST") return placeOrder(req, env, origin);

      if (path.startsWith("/api/order/") && req.method === "GET") {
        return trackOrder(decodeURIComponent(path.slice("/api/order/".length)), env, origin);
      }

      if (path === "/api/login" && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const pin = String(body.pin || "");
        let role = null;
        if (env.ADMIN_PIN && same(pin, env.ADMIN_PIN)) role = "admin";
        else if (env.STAFF_PIN && same(pin, env.STAFF_PIN)) role = "staff";
        if (!role) {
          // a slow "no" is worth more than a fast one against PIN guessing
          await new Promise(r => setTimeout(r, 700));
          return json({ error: "That code is not right." }, 401, origin);
        }
        return json({ token: await mint(env.AUTH_SECRET, role), role }, 200, origin);
      }

      /* everything past here is staff only */
      const role = await whom(env.AUTH_SECRET, req.headers.get("authorization"));
      if (!role) return json({ error: "Sign in again." }, 401, origin);

      if (path === "/api/board" && req.method === "GET") return board(url, env, origin);
      if (path === "/api/status" && req.method === "POST") return setStatus(req, env, role, origin);

      if (path === "/api/accepting" && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        await env.DB.prepare("INSERT INTO settings (k, v) VALUES ('accepting', ?) " +
          "ON CONFLICT(k) DO UPDATE SET v = excluded.v")
          .bind(body.accepting ? "1" : "0").run();
        return json({ accepting: !!body.accepting }, 200, origin);
      }

      if (path === "/api/report" && req.method === "GET") {
        if (role !== "admin") return json({ error: "Manager only." }, 403, origin);
        return report(env, origin);
      }

      return json({ error: "Not found." }, 404, origin);
    } catch (e) {
      return json({ error: "Something broke at our end. Order at the counter." }, 500, origin);
    }
  }
};
