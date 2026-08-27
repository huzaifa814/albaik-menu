-- AL BAIK order board. One table for orders, one row for the kill switch.

CREATE TABLE IF NOT EXISTS orders (
  id         TEXT PRIMARY KEY,          -- uuid, used by staff
  ticket     TEXT NOT NULL UNIQUE,      -- random, the only thing the customer's phone holds
  num        INTEGER NOT NULL,          -- 101, 102 ... the number called out
  day        TEXT NOT NULL,             -- YYYY-MM-DD in the restaurant's timezone
  kind       TEXT NOT NULL,             -- 'dinein' or 'pickup'
  who        TEXT,                      -- customer name, optional
  seat       TEXT,                      -- table number, optional
  note       TEXT,
  lines      TEXT NOT NULL,             -- JSON, priced by the server
  subtotal   REAL NOT NULL,
  status     TEXT NOT NULL,             -- new | preparing | ready | done | void
  ip         TEXT,                      -- hashed, for rate limiting only
  placed_at  INTEGER NOT NULL,
  changed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_day  ON orders (day, num);
CREATE INDEX IF NOT EXISTS orders_feed ON orders (changed_at);
CREATE INDEX IF NOT EXISTS orders_rate ON orders (ip, placed_at);

CREATE TABLE IF NOT EXISTS settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (k, v) VALUES ('accepting', '1');
