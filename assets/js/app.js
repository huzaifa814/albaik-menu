/* AL BAIK - menu, cart and order handoff. No backend, no build step. */
(function () {
  "use strict";

  var CFG = window.ALBAIK_CONFIG || {};
  var MENU = window.ALBAIK_MENU || [];
  var CUR = CFG.currency || "$";
  var STORE_CART = "albaik.cart.v1";
  var STORE_TABLE = "albaik.table.v1";

  var $ = function (sel) { return document.querySelector(sel); };
  var cart = load(STORE_CART, []);
  var table = getTable();
  var draft = null; // item being configured in the sheet

  /* ---------------- helpers ---------------- */

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function money(n) { return CUR + n.toFixed(2); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function getTable() {
    var q = new URLSearchParams(location.search);
    var t = q.get("t") || q.get("table");
    if (t) { t = t.replace(/[^0-9A-Za-z-]/g, "").slice(0, 6); save(STORE_TABLE, t); return t; }
    return load(STORE_TABLE, "");
  }
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 1800);
  }
  function sectionOf(item) {
    for (var i = 0; i < MENU.length; i++) {
      if (MENU[i].items.indexOf(item) !== -1) return MENU[i];
    }
    return null;
  }
  function findItem(id) {
    for (var i = 0; i < MENU.length; i++) {
      for (var j = 0; j < MENU[i].items.length; j++) {
        if (MENU[i].items[j].id === id) return { item: MENU[i].items[j], section: MENU[i] };
      }
    }
    return null;
  }
  function basePrice(section, item) {
    if (typeof item.price === "number") return item.price;
    if (section.sizes && section.sizes.length) return section.sizes[0].price;
    return 0;
  }

  /* ---------------- render menu ---------------- */

  function renderNav() {
    var nav = $("#catnav");
    nav.innerHTML = MENU.map(function (s) {
      return '<button type="button" data-jump="' + s.id + '">' + esc(s.name) + "</button>";
    }).join("");
  }

  function renderMenu(filter) {
    var q = (filter || "").trim().toLowerCase();
    var html = "";

    MENU.forEach(function (section) {
      var items = section.items.filter(function (it) {
        if (!q) return true;
        return (it.name + " " + (it.desc || "") + " " + section.name).toLowerCase().indexOf(q) !== -1;
      });
      if (!items.length) return;

      html += '<section class="section" id="sec-' + section.id + '">';
      html += '<div class="section-head">' + esc(section.name) + "</div>";
      if (section.note) html += '<p class="section-note">' + esc(section.note) + "</p>";

      if (section.sizes) {
        html += '<div class="sizes">' + section.sizes.map(function (s) {
          return '<div><div class="s-label">' + esc(s.label) + '</div><div class="s-price">' + money(s.price) + "</div></div>";
        }).join("") + "</div>";
      }

      items.forEach(function (it) {
        var priceHtml;
        if (typeof it.price === "number") {
          priceHtml = '<span class="price">' + money(it.price) + "</span>";
        } else {
          priceHtml = '<span class="price">' + money(section.sizes[0].price) +
            '<span class="from">from</span></span>';
        }
        html += '<button class="card" type="button" data-item="' + it.id + '">' +
          '<span class="dot"></span>' +
          '<span class="body">' +
            '<span class="name">' + esc(it.name) + (it.spicy ? '<span class="spicy">HOT</span>' : "") + "</span>" +
            (it.desc ? '<span class="desc">' + esc(it.desc) + "</span>" : "") +
          "</span>" +
          priceHtml +
          '<span class="plus">+</span>' +
        "</button>";
      });

      html += "</section>";
    });

    $("#menu").innerHTML = html || '<p class="empty">Nothing matches that search.</p>';
  }

  /* ---------------- item sheet ---------------- */

  function openItem(id) {
    var found = findItem(id);
    if (!found) return;
    var item = found.item, section = found.section;

    draft = { id: id, qty: 1, size: null, opts: {}, notes: "" };
    if (section.sizes) draft.size = section.sizes[0].label;

    $("#itemTitle").textContent = item.name;
    $("#itemDesc").textContent = item.desc || "";
    $("#itemDesc").hidden = !item.desc;
    $("#qtyVal").textContent = "1";
    $("#itemNotes").value = "";

    var groups = "";
    if (section.sizes) {
      groups += '<div class="optgroup" data-group="__size"><h3>Size</h3><div class="chips">' +
        section.sizes.map(function (s, i) {
          return '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-val="' +
            esc(s.label) + '">' + esc(s.label) + " &middot; " + money(s.price) + "</button>";
        }).join("") + "</div></div>";
    }
    (item.options || []).forEach(function (g) {
      draft.opts[g.name] = g.choices[0];
      groups += '<div class="optgroup" data-group="' + esc(g.name) + '"><h3>' + esc(g.name) + '</h3><div class="chips">' +
        g.choices.map(function (c, i) {
          return '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-val="' + esc(c) + '">' + esc(c) + "</button>";
        }).join("") + "</div></div>";
    });
    $("#itemOptions").innerHTML = groups;

    $("#itemBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeItem() {
    $("#itemBackdrop").hidden = true;
    document.body.style.overflow = "";
    draft = null;
  }

  function addDraftToCart() {
    if (!draft) return;
    var found = findItem(draft.id);
    if (!found) return;
    var item = found.item, section = found.section;

    var unit;
    if (draft.size && section.sizes) {
      unit = section.sizes.filter(function (s) { return s.label === draft.size; })[0].price;
    } else {
      unit = basePrice(section, item);
    }

    draft.notes = $("#itemNotes").value.trim();

    var line = {
      id: draft.id,
      name: item.name,
      size: draft.size,
      opts: draft.opts,
      notes: draft.notes,
      unit: unit,
      qty: draft.qty
    };

    var key = lineKey(line);
    var existing = cart.filter(function (l) { return lineKey(l) === key; })[0];
    if (existing) existing.qty += line.qty;
    else cart.push(line);

    save(STORE_CART, cart);
    renderCartBar();
    closeItem();
    toast(line.qty + " x " + item.name + " added");
  }

  function lineKey(l) {
    return [l.id, l.size || "", JSON.stringify(l.opts || {}), l.notes || ""].join("|");
  }

  /* ---------------- cart ---------------- */

  function cartCount() {
    return cart.reduce(function (a, l) { return a + l.qty; }, 0);
  }
  function cartTotal() {
    return cart.reduce(function (a, l) { return a + l.qty * l.unit; }, 0);
  }
  function renderCartBar() {
    var bar = $("#cartbar");
    if (!cart.length) { bar.hidden = true; return; }
    bar.hidden = false;
    $("#cartCount").textContent = cartCount();
    $("#cartTotal").textContent = money(cartTotal());
  }

  function optsText(l) {
    var bits = [];
    if (l.size) bits.push(l.size);
    Object.keys(l.opts || {}).forEach(function (k) { bits.push(l.opts[k]); });
    if (l.notes) bits.push('"' + l.notes + '"');
    return bits.join(" · ");
  }

  function renderOrder() {
    var box = $("#orderLines");
    if (!cart.length) {
      box.innerHTML = '<p class="empty">Your order is empty.</p>';
    } else {
      box.innerHTML = cart.map(function (l, i) {
        var sub = optsText(l);
        return '<div class="line">' +
          '<div class="lname"><b>' + esc(l.name) + "</b>" +
            (sub ? '<span class="lopts">' + esc(sub) + "</span>" : "") +
            '<span class="lqty">' +
              '<button type="button" data-dec="' + i + '">-</button>' +
              "<span>" + l.qty + "</span>" +
              '<button type="button" data-inc="' + i + '">+</button>' +
              '<button type="button" data-del="' + i + '" aria-label="Remove">&times;</button>' +
            "</span>" +
          "</div>" +
          '<div class="lprice">' + money(l.qty * l.unit) + "</div>" +
        "</div>";
      }).join("");
    }
    $("#orderTotal").textContent = money(cartTotal());
    $("#tableInput").value = table || "";
  }

  function openOrder() {
    renderOrder();
    $("#orderBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeOrder() {
    $("#orderBackdrop").hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------------- order handoff ---------------- */

  function readTableInput() {
    var v = $("#tableInput").value.replace(/[^0-9A-Za-z-]/g, "").slice(0, 6);
    table = v;
    save(STORE_TABLE, v);
    renderTableChip();
    return v;
  }

  function orderText() {
    var lines = cart.map(function (l) {
      var sub = optsText(l);
      return "- " + l.qty + " x " + l.name + (sub ? " (" + sub + ")" : "") + "  " + money(l.qty * l.unit);
    });
    return "*AL BAIK - New order*\n" +
      (table ? "Table: " + table + "\n" : "") +
      "\n" + lines.join("\n") +
      "\n\n*Total: " + money(cartTotal()) + "*";
  }

  function sendWhatsApp() {
    if (!cart.length) { toast("Add something first"); return; }
    readTableInput();
    if (!table) { toast("Enter your table number"); $("#tableInput").focus(); return; }
    var num = (CFG.whatsapp || "").replace(/[^0-9]/g, "");
    if (!num) { toast("WhatsApp number not set up yet"); return; }
    window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(orderText()), "_blank");
  }

  function showTicket() {
    if (!cart.length) { toast("Add something first"); return; }
    readTableInput();
    $("#ticketTable").textContent = table ? "Table " + table : "";
    $("#ticketLines").innerHTML = cart.map(function (l) {
      var sub = optsText(l);
      return '<div class="line">' +
        '<div class="lname"><b>' + l.qty + " &times; " + esc(l.name) + "</b>" +
          (sub ? '<span class="lopts">' + esc(sub) + "</span>" : "") +
        "</div>" +
        '<div class="lprice">' + money(l.qty * l.unit) + "</div>" +
      "</div>";
    }).join("");
    $("#ticketTotal").textContent = money(cartTotal());
    $("#ticketBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function renderTableChip() {
    var chip = $("#tableChip");
    if (table) { chip.textContent = "Table " + table; chip.hidden = false; }
    else chip.hidden = true;
  }

  /* ---------------- events ---------------- */

  document.addEventListener("click", function (e) {
    var t = e.target;

    var jump = t.closest("[data-jump]");
    if (jump) {
      var sec = document.getElementById("sec-" + jump.dataset.jump);
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      Array.prototype.forEach.call(document.querySelectorAll("#catnav button"), function (b) {
        b.classList.toggle("active", b === jump);
      });
      return;
    }

    var card = t.closest("[data-item]");
    if (card) { openItem(card.dataset.item); return; }

    if (t.closest("[data-close-item]") || t.id === "itemBackdrop") { closeItem(); return; }
    if (t.closest("[data-close-order]") || t.id === "orderBackdrop") { closeOrder(); return; }
    if (t.closest("[data-close-ticket]") || t.id === "ticketBackdrop") {
      $("#ticketBackdrop").hidden = true; document.body.style.overflow = ""; return;
    }

    var chip = t.closest(".chip");
    if (chip && draft) {
      var group = chip.closest(".optgroup");
      Array.prototype.forEach.call(group.querySelectorAll(".chip"), function (c) { c.classList.remove("on"); });
      chip.classList.add("on");
      var g = group.dataset.group;
      if (g === "__size") draft.size = chip.dataset.val;
      else draft.opts[g] = chip.dataset.val;
      return;
    }

    if (t.id === "qtyPlus" && draft) { draft.qty = Math.min(99, draft.qty + 1); $("#qtyVal").textContent = draft.qty; return; }
    if (t.id === "qtyMinus" && draft) { draft.qty = Math.max(1, draft.qty - 1); $("#qtyVal").textContent = draft.qty; return; }
    if (t.id === "addToOrder") { addDraftToCart(); return; }

    if (t.id === "cartbar" || t.closest("#cartbar")) { openOrder(); return; }

    if (t.dataset && t.dataset.inc !== undefined) { cart[+t.dataset.inc].qty++; afterCartEdit(); return; }
    if (t.dataset && t.dataset.dec !== undefined) {
      var i = +t.dataset.dec;
      cart[i].qty--; if (cart[i].qty < 1) cart.splice(i, 1);
      afterCartEdit(); return;
    }
    if (t.dataset && t.dataset.del !== undefined) { cart.splice(+t.dataset.del, 1); afterCartEdit(); return; }

    if (t.id === "sendWhatsApp") { sendWhatsApp(); return; }
    if (t.id === "showWaiter") { showTicket(); return; }
    if (t.id === "clearOrder") {
      if (cart.length && confirm("Clear the whole order?")) { cart = []; afterCartEdit(); }
      return;
    }
  });

  function afterCartEdit() {
    save(STORE_CART, cart);
    renderOrder();
    renderCartBar();
    if (!cart.length) closeOrder();
  }

  $("#search").addEventListener("input", function (e) { renderMenu(e.target.value); });
  $("#tableInput").addEventListener("change", readTableInput);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeItem(); closeOrder(); $("#ticketBackdrop").hidden = true; document.body.style.overflow = ""; }
  });

  /* ---------------- boot ---------------- */

  document.title = (CFG.brand || "AL BAIK") + " - Menu";
  var call = $("#callBtn");
  if (CFG.phoneDisplay) {
    call.textContent = "Call " + CFG.phoneDisplay;
    call.href = "tel:" + (CFG.phoneDisplay || "").replace(/[^0-9+]/g, "");
  } else {
    call.hidden = true;
  }

  renderNav();
  renderMenu("");
  renderCartBar();
  renderTableChip();
})();
