/* Emit assets/data/menu.json from assets/js/menu-data.js.
 *
 * menu-data.js stays the one place a price is written - the site loads it with a
 * plain <script> tag and the admin dashboard rewrites it. But the order worker
 * runs on Cloudflare, where dynamic code evaluation is blocked, so it cannot
 * load a .js file. It reads this JSON copy instead and prices every order from
 * it, which is what stops a customer's phone from naming its own total.
 *
 * Run it through tools/stamp_version.py, which calls this first. If the two
 * files ever drift, the worker starts refusing orders for dishes the site is
 * still showing - so they are generated together, never by hand.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.dirname(__dirname);
const src = path.join(root, "assets", "js", "menu-data.js");
const outDir = path.join(root, "assets", "data");
const out = path.join(outDir, "menu.json");

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(src, "utf8"), sandbox, { filename: "menu-data.js" });

const menu = sandbox.window.ALBAIK_MENU;
if (!Array.isArray(menu) || !menu.length) {
  console.error("menu-data.js did not define window.ALBAIK_MENU");
  process.exit(1);
}

let items = 0;
for (const s of menu) {
  if (!s.id || !s.name || !Array.isArray(s.items)) {
    console.error("section is missing id/name/items:", JSON.stringify(s).slice(0, 80));
    process.exit(1);
  }
  for (const it of s.items) {
    // a dish must be priceable one way or the other, or the worker will reject it
    if (typeof it.price !== "number" && !s.sizes) {
      console.error(`"${it.name}" has no price and its section has no sizes`);
      process.exit(1);
    }
    items++;
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(out, JSON.stringify(menu, null, 2) + "\n", "utf8");
console.log(`menu.json   ${menu.length} sections, ${items} items`);
