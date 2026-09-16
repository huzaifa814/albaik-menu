/* Builds the two demo marketing sites in demo/a and demo/b from demo/src/*.html.
   The menu comes straight from assets/js/menu-data.js so the demos can never show a
   price the QR menu does not.   Run:  node tools/build_demos.js                        */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/menu-data.js"), "utf8"), sandbox);
const MENU = sandbox.window.ALBAIK_MENU;

const ORDER_URL = "https://albaikpizzaca.com";
const REVIEW_URL = "https://g.page/r/Cdc7o9kfFrf2EBM/review";

// Photo for each item id, else the section photo.
const ITEM_IMG = {
  p1: "pz-beef-supreme", p2: "pz-pepperoni", p5: "pz-meat-lovers", p6: "pz-beef-combo", p7: "pz-hawaiian",
  p8: "pz-veggie", p9: "pz-gyro-lamb", p11: "pz-chicken-supreme", p12: "pz-bbq", p13: "pz-buffalo",
  p14: "pz-triple-chicken", p15: "pz-achari", p17: "pz-tikka", p18: "pz-butter-chicken", cp1: "pz-cheezy",
  b1: "bs-chicken", b2: "bs-garlic", b3: "bs-gyro", b4: "bs-beef",
  bg1: "zinger", bg2: "nashville-zinger", bg3: "beef-burger", bg4: "double-beef-burger",
  k10: "kabab-chicken", k11: "kabab-beef",
  wr1: "wrap-beef", wr2: "wrap-tandoori", wr3: "wrap-tikka", wr4: "wrap-gyro", wr5: "wrap-haryali"
};
const SECTION_IMG = {
  "fried-chicken": "fried-chicken", wings: "wings", "kids-meal": "kids", fries: "fries", salads: "salads",
  roast: "roast", bbq: "bbq", pizza: "pz-tikka", "cheezy-pizza": "pz-cheezy", "byo-pizza": "pz-veggie",
  breadsticks: "bs-garlic", burgers: "zinger", kabob: "kabab-chicken", wraps: "wrap-gyro"
};

// How the 14 menu sections fold into 8 tabs on a marketing page.
const GROUPS = [
  { id: "chicken", name: "Fried Chicken", sections: ["fried-chicken"] },
  { id: "wings", name: "Wings", sections: ["wings"] },
  { id: "pizza", name: "Pizza", sections: ["pizza", "cheezy-pizza", "byo-pizza"] },
  { id: "breadsticks", name: "Breadsticks", sections: ["breadsticks"] },
  { id: "burgers", name: "Burgers", sections: ["burgers"] },
  { id: "kabab", name: "Kabab & Wraps", sections: ["kabob", "wraps"] },
  { id: "sides", name: "Sides & Kids", sections: ["fries", "salads", "kids-meal"] },
  { id: "soon", name: "Coming Soon", sections: ["roast", "bbq"] }
];

// Build Your Own Pizza, structured (same content as the info string in menu-data.js).
const BYO = {
  crust: "Regular or thin crust",
  cheese: ["Mozzarella", 2.5],
  sauces: [1.5, ["Tomato", "Garlic", "Tandoori", "Tikka", "Burger"]],
  protein: [2.5, ["Beef pepperoni", "Gyro lamb", "Beef salami", "Beef bacon bits", "Garlic chicken", "Grilled chicken", "Crispy fried chicken bites", "Chicken tandoori", "Chicken tikka"]],
  veg: [1.5, ["Red onion", "White onion", "Bell peppers", "Olives", "Green onion", "Pineapple bits", "Tomatoes", "Jalapenos", "Green chillies", "Red chilli flakes", "Dill pickles", "Sumac onion"]]
};

// The four coupons the owners published on their current site (Sept 2026).
const DEALS = [
  { n: 1, title: "2 Large Pizzas", plus: "+ 2L soda", price: 34.99, img: "deal1" },
  { n: 2, title: "2 x 8pc Crispy Chicken Buckets", plus: "+ 2L soda", price: 39.99, img: "deal2" },
  { n: 3, title: "15% off", plus: "your order", price: null, img: "deal3" },
  { n: 4, title: "2 X-Large 1-Topping Pizzas", plus: "+ 2L soda", price: 49.99, img: "deal4" }
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = n => "$" + n.toFixed(2);
const splitName = name => {
  const m = /^(.*?)\s+(with .*)$/i.exec(name);
  return m ? { main: m[1], sub: m[2] } : { main: name, sub: "" };
};
const img = (key, alt) => `<img src="../img/${key}.webp" width="800" height="800" loading="lazy" decoding="async" alt="${esc(alt || "")}">`;

function itemCard(sec, it) {
  const { main, sub } = splitName(it.name);
  const key = ITEM_IMG[it.id] || SECTION_IMG[sec.id];
  let price = "";
  if (sec.sizes) price = `<span class="from">from</span> ${money(sec.sizes[0].price)}`;
  else if (typeof it.price === "number") price = money(it.price);
  let ladder = "";
  if (sec.sizes && sec.items.length === 1) {
    ladder = `<ul class="ladder">` + sec.sizes.map(s => `<li><span>${esc(s.label)}</span><b>${money(s.price)}</b></li>`).join("") + `</ul>`;
    price = "";
  }
  const opts = (it.options || []).filter(o => /style|flavor/i.test(o.name)).map(o => o.choices.join(" · "));
  const wide = sec.sizes && sec.items.length === 1;
  return `<article class="card${it.spicy ? " spicy" : ""}${sec.soon ? " soon" : ""}${wide ? " wide" : ""}">
  <div class="ph">${img(key, it.name)}${it.spicy ? `<span class="chip-spicy" title="Spicy">Spicy</span>` : ""}${sec.soon ? `<span class="stamp">Coming soon</span>` : ""}</div>
  <div class="cb">
    <h4>${esc(main)}${sub ? ` <small>${esc(sub)}</small>` : ""}</h4>
    ${it.desc ? `<p class="d">${esc(it.desc)}</p>` : ""}
    ${opts.length && !it.desc ? `<p class="d opt">${esc(opts[0])}</p>` : ""}
    ${ladder}
    ${price ? `<div class="pr">${price}</div>` : ""}
  </div>
</article>`;
}

function byoBlock() {
  const list = (arr) => arr.map(x => `<li>${esc(x)}</li>`).join("");
  return `<article class="card byo">
  <div class="ph">${img(SECTION_IMG["byo-pizza"], "Build your own pizza")}</div>
  <div class="cb">
    <h4>Build Your Own Pizza <small>${esc(BYO.crust)}</small></h4>
    <div class="byo-cols">
      <div><h5>Cheese</h5><ul><li>${esc(BYO.cheese[0])} <b>${money(BYO.cheese[1])}</b></li></ul>
           <h5>Sauces <b>${money(BYO.sauces[0])} each</b></h5><ul>${list(BYO.sauces[1])}</ul></div>
      <div><h5>Protein <b>${money(BYO.protein[0])} each</b></h5><ul>${list(BYO.protein[1])}</ul></div>
      <div><h5>Veggies <b>${money(BYO.veg[0])} each</b></h5><ul class="two">${list(BYO.veg[1])}</ul></div>
    </div>
    <p class="d">Ask at the counter and we will price it up for you.</p>
  </div>
</article>`;
}

function sectionBlock(sec, showTitle, groupName) {
  let html = "";
  // a single-section group already printed the note in its header; a section named
  // like its group (Pizza inside Pizza) only needs its note
  if (showTitle && sec.name === groupName) { if (sec.note) html += `<p class="note">${esc(sec.note)}</p>`; }
  else if (showTitle) html += `<h3 class="sub-h">${esc(sec.name)}${sec.note ? ` <span class="note">${esc(sec.note)}</span>` : ""}</h3>`;
  if (sec.sizes && sec.items.length > 1) {
    html += `<ul class="sizebar">` + sec.sizes.map(s => `<li><span>${esc(s.label)}</span><b>${money(s.price)}</b></li>`).join("") + `</ul>`;
  }
  if (sec.id === "byo-pizza") return html + `<div class="cards one">${byoBlock()}</div>`;
  if (!sec.items.length && sec.soon) {
    return html + `<div class="cards one"><article class="card soon wide"><div class="ph">${img(SECTION_IMG[sec.id], sec.name)}<span class="stamp">Coming soon</span></div><div class="cb"><h4>${esc(sec.name)}</h4><p class="d">Watch this space.</p></div></article></div>`;
  }
  const cls = (sec.sizes && sec.items.length === 1) ? "cards one" : sec.items.length <= 2 ? "cards two-up" : "cards";
  return html + `<div class="${cls}">` + sec.items.map(it => itemCard(sec, it)).join("\n") + `</div>`;
}

function menuHTML() {
  const byId = Object.fromEntries(MENU.map(s => [s.id, s]));
  return GROUPS.map(g => {
    const secs = g.sections.map(id => byId[id]).filter(Boolean);
    const multi = secs.length > 1;
    const first = secs[0];
    let head = `<header class="cat-head"><h3>${esc(g.name)}</h3>`;
    if (!multi && first.note) head += `<p class="note">${esc(first.note)}</p>`;
    head += `</header>`;
    const body = secs.map(s => sectionBlock(s, multi, g.name)).join("\n");
    return `<section class="cat" id="m-${g.id}">${head}${body}</section>`;
  }).join("\n");
}

function catsHTML() {
  return GROUPS.map(g => `<a href="#m-${g.id}">${esc(g.name)}</a>`).join("");
}

function dealsHTML() {
  return DEALS.map(d => `<article class="deal">
  <div class="deal-img"><img src="../img/${d.img}.webp" width="900" height="900" loading="lazy" decoding="async" alt="Coupon ${d.n}: ${esc(d.title)} ${esc(d.plus)}"></div>
  <div class="deal-b">
    <span class="deal-n">Coupon ${d.n}</span>
    <h3>${esc(d.title)}</h3>
    <p>${esc(d.plus)}</p>
    ${d.price ? `<div class="deal-p">${money(d.price)}</div>` : `<div class="deal-p pct">Show this coupon</div>`}
  </div>
</article>`).join("\n");
}

// Four hero dishes for the "favourites" strip - photo, name and a line taken from the menu data only.
const FAVS = ["fc2", "p17", "wr4", "bg2"];
function favHTML() {
  const found = [];
  MENU.forEach(sec => sec.items.forEach(it => { if (FAVS.includes(it.id)) found.push({ sec, it }); }));
  found.sort((a, b) => FAVS.indexOf(a.it.id) - FAVS.indexOf(b.it.id));
  return found.map(({ sec, it }) => {
    const { main, sub } = splitName(it.name);
    const line = it.desc || sec.note || "";
    const price = sec.sizes ? `from ${money(sec.sizes[0].price)}` : money(it.price);
    return `<a class="fav" href="#m-${GROUPS.find(g => g.sections.includes(sec.id)).id}">
  <div class="ph">${img(ITEM_IMG[it.id] || SECTION_IMG[sec.id], it.name)}</div>
  <div class="fb"><span class="fav-cat">${esc(sec.name)}</span><h3>${esc(main)}${sub ? ` <small>${esc(sub)}</small>` : ""}</h3><p>${esc(line)}</p><span class="pr">${price}</span></div>
</a>`;
  }).join("\n");
}

const stats = { sections: MENU.length, items: MENU.reduce((n, s) => n + s.items.length, 0) };

function render(name) {
  const tpl = fs.readFileSync(path.join(root, "demo/src", name + ".html"), "utf8");
  const out = tpl
    .replace("{{MENU}}", menuHTML())
    .replace("{{CATS}}", catsHTML())
    .replace("{{DEALS}}", dealsHTML())
    .replace("{{FAVS}}", favHTML())
    .replace(/{{ORDER_URL}}/g, ORDER_URL)
    .replace(/{{REVIEW_URL}}/g, REVIEW_URL);
  const dir = path.join(root, "demo", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), out);
  console.log("wrote demo/" + name + "/index.html", (out.length / 1024).toFixed(0) + " KB");
}

["a", "b"].forEach(render);
console.log("menu:", stats.sections, "sections,", stats.items, "items from menu-data.js");
