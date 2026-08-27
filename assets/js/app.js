/* AL BAIK - menu viewer and table ordering.
   No build step. The cart is priced again by the server before it counts. */
(function () {
  "use strict";

  var CFG = window.ALBAIK_CONFIG || {};
  var MENU = window.ALBAIK_MENU || [];
  var CUR = CFG.currency || "$";

  var $ = function (sel) { return document.querySelector(sel); };


  /* ---------------- opening hours ----------------
     Worked out in the restaurant's own timezone, never the phone's. A customer
     whose phone is set to another zone - travelling, or just wrong - must still
     be told whether the kitchen on Stockton Blvd is open right now. */

  var DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function localNow() {
    var tz = CFG.timezone;
    if (!tz) return new Date();
    try {
      // read the wall clock in tz, then rebuild a Date carrying those numbers
      var p = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var got = {};
      p.forEach(function (x) { got[x.type] = x.value; });
      var hh = parseInt(got.hour, 10) % 24;
      return { day: DAYS.indexOf(got.weekday.toLowerCase().slice(0, 3)), mins: hh * 60 + parseInt(got.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function toMins(hhmm) {
    var b = String(hhmm).split(":");
    return parseInt(b[0], 10) * 60 + parseInt(b[1] || "0", 10);
  }

  function pretty(hhmm) {
    var m = toMins(hhmm), h = Math.floor(m / 60) % 24, mi = m % 60;
    var ap = h >= 12 ? "PM" : "AM", h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (mi ? ":" + (mi < 10 ? "0" : "") + mi : "") + " " + ap;
  }

  /* Returns {open:bool, until:"8 PM"} or {open:false, next:"10 AM", nextDay:"tomorrow"}. */
  function openState() {
    var H = CFG.hours;
    if (!H) return null;
    var now = localNow();
    if (now.day < 0) return null;

    // a shift that started yesterday and runs past midnight still counts as open
    var yest = H[DAYS[(now.day + 6) % 7]];
    if (yest && toMins(yest[1]) <= toMins(yest[0]) && now.mins < toMins(yest[1])) {
      return { open: true, until: pretty(yest[1]) };
    }

    var today = H[DAYS[now.day]];
    if (today) {
      var a = toMins(today[0]), b = toMins(today[1]);
      var end = b <= a ? b + 1440 : b;             // closes after midnight
      if (now.mins >= a && now.mins < end) return { open: true, until: pretty(today[1]) };
      if (now.mins < a) return { open: false, next: pretty(today[0]), nextDay: "today" };
    }

    // find the next day that has hours
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7, hrs = H[DAYS[d]];
      if (hrs) {
        return { open: false, next: pretty(hrs[0]),
                 nextDay: i === 1 ? "tomorrow" : DAY_NAMES[d] };
      }
    }
    return null;
  }

  function renderOpen() {
    var el = $("#openBadge");
    if (!el) return;
    var st = openState();
    if (!st) { el.hidden = true; return; }

    el.hidden = false;
    el.className = "openbadge " + (st.open ? "is-open" : "is-shut");
    el.innerHTML = st.open
      ? '<b>Open now</b><span>until ' + esc(st.until) + "</span>"
      : '<b>Closed</b><span>opens ' + esc(st.next) +
        (st.nextDay === "today" ? "" : " " + esc(st.nextDay)) + "</span>";

    renderCartBar();
  }

  function renderHoursList() {
    var el = $("#hoursList");
    if (!el || !CFG.hours) return;
    var today = localNow().day;
    el.innerHTML = DAYS.map(function (k, i) {
      var h = CFG.hours[k];
      return '<div' + (i === today ? ' class="is-today"' : "") + ">" +
        "<span>" + DAY_NAMES[i] + "</span><span>" +
        (h ? pretty(h[0]) + " - " + pretty(h[1]) : "Closed") + "</span></div>";
    }).join("");
  }

  /* ---------------- helpers ---------------- */

  function money(n) { return CUR + n.toFixed(2); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }


  /* What goes into a dish, as separate things rather than a sentence, so a
     customer can see at a glance what to ask the kitchen to leave out.
     Split on commas only: "gyro lamb & beef" is one ingredient, and splitting
     on "&" would cut it in half. */
  function ingredientsOf(item) {
    if (item.ingredients) return item.ingredients;
    if (!item.desc) return null;
    var parts = item.desc.replace(/\.\s*$/, "").split(/\s*,\s*/)
      .map(function (t) {
        return t.trim()
          .replace(/^(drizzled|garnished|topped|served)\s+with\s+/i, "")
          .replace(/^with\s+/i, "");
      })
      .filter(Boolean);
    return parts.length > 1 ? parts : null;
  }

  function findItem(id) {
    for (var i = 0; i < MENU.length; i++) {
      for (var j = 0; j < MENU[i].items.length; j++) {
        if (MENU[i].items[j].id === id) return { item: MENU[i].items[j], section: MENU[i] };
      }
    }
    return null;
  }

  function unitPrice(item, section, size) {
    if (typeof item.price === "number") return item.price;
    if (!section.sizes) return 0;
    for (var i = 0; i < section.sizes.length; i++) {
      if (section.sizes[i].label === size) return section.sizes[i].price;
    }
    return section.sizes[0].price;
  }


  /* ================= ordering =================
     The whole cart lives in this browser until the customer taps Place order.
     Prices shown here are only a preview: the worker prices the order again
     from the published menu, so a doctored phone gets the real total or a
     rejection, never a bargain. */

  var CART_KEY = "albaik.cart.v1";
  var TICKET_KEY = "albaik.ticket.v1";

  var ORDERING = !!(CFG.ordering && CFG.orderApi && !CFG.orderUrl);
  var accepting = true;          // the kitchen's own on/off switch, read from the server
  var CART = [];
  var DRAFT = null;              // the dish currently being configured in the sheet
  var TICKET = null;
  var ticketTimer = null;

  function store(key, val) {
    try {
      if (val === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { /* private browsing - the cart just won't survive a reload */ }
  }

  function recall(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }

  function api(path, opts) {
    return fetch(CFG.orderApi + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) throw new Error(body.error || "Something went wrong.");
        return body;
      });
    });
  }

  /* Two lines are the same line only if every choice on them matches, so
     "no onions" and "with onions" never quietly merge into one. */
  function lineKey(l) {
    return [l.id, l.size || "", JSON.stringify(l.options || {}),
            (l.leaveOut || []).slice().sort().join("|"), l.note || ""].join("");
  }

  function cartCount() {
    return CART.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function cartTotal() {
    return CART.reduce(function (n, l) {
      var f = findItem(l.id);
      return f ? n + unitPrice(f.item, f.section, l.size) * l.qty : n;
    }, 0);
  }

  function saveCart() { store(CART_KEY, CART); renderCartBar(); }

  function addToCart(line) {
    var key = lineKey(line);
    for (var i = 0; i < CART.length; i++) {
      if (lineKey(CART[i]) === key) {
        CART[i].qty = Math.min(20, CART[i].qty + line.qty);
        saveCart();
        return;
      }
    }
    CART.push(line);
    saveCart();
  }

  /* Can an order be placed right now? Three separate things have to be true,
     and the customer is told which one is not. */
  function orderBlock() {
    if (!ORDERING) return "off";
    if (TICKET) return "has-ticket";
    if (!accepting) return "paused";
    var st = openState();
    if (st && !st.open) return "closed";
    return null;
  }

  function renderCartBar() {
    var bar = $("#cartBar");
    if (!bar) return;
    var block = orderBlock();
    if (block || !CART.length) { bar.hidden = true; document.body.classList.remove("has-cart"); return; }

    bar.hidden = false;
    document.body.classList.add("has-cart");
    var n = cartCount();
    $("#cartCount").textContent = n + (n === 1 ? " item" : " items");
    $("#cartTotal").textContent = money(cartTotal());
  }


  /* ---------------- deals ---------------- */

  function renderDeals() {
    var deals = CFG.deals || [];
    var box = $("#deals");
    if (!deals.length) { box.hidden = true; return; }

    box.hidden = false;
    box.innerHTML = '<div class="deals-wrap">' +
      '<h2 class="deals-head">Deals</h2>' +
      deals.map(function (d) {
        return '<div class="deal reveal">' +
          '<div class="deal-body">' +
            '<span class="deal-name">' + esc(d.name) + "</span>" +
            '<span class="deal-items">' + esc(d.items) + "</span>" +
          "</div>" +
          '<div class="deal-price">' +
            (typeof d.was === "number" ? '<s>' + money(d.was) + "</s>" : "") +
            "<strong>" + money(d.price) + "</strong>" +
          "</div>" +
        "</div>";
      }).join("") +
    "</div>";
  }

  /* ---------------- render menu ---------------- */

  function renderNav() {
    $("#catnav").innerHTML = MENU.map(function (s) {
      return '<button type="button" data-jump="' + s.id + '">' + esc(s.name) +
        (s.soon ? '<span class="nav-soon">soon</span>' : "") + "</button>";
    }).join("");
  }

  var PEPPER = '<svg class="chilli" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="stem" d="M18.6 8.4c1-2.6 3-4.2 5.6-4.6"/><path class="cap" d="M13.6 7.9c2.4-1.1 5-1 7.2.4.8.5.7 1.7-.2 2l-6.3 2.2c-1.1.4-2.1-.7-1.6-1.7z"/><path class="pod" d="M13.9 10.4c-4.3 4.5-5.2 12.3-2 18.6.4.9 1.6 1 2.3.3 5.5-5.3 8.2-12.6 7-19.1-.2-1.3-1.9-1.7-2.8-.8z"/></svg>';

  function renderMenu(filter) {
    var q = (filter || "").trim().toLowerCase();
    var html = "";

    MENU.forEach(function (section) {
      var items = section.items.filter(function (it) {
        if (!q) return true;
        return (it.name + " " + (it.desc || "") + " " + section.name).toLowerCase().indexOf(q) !== -1;
      });
      if (!items.length) return;

      html += '<section class="section' + (section.soon ? " soon" : "") + '" id="sec-' + section.id + '" data-section="' + section.id + '">';
      html += '<div class="banner reveal">' +
        '<img src="assets/img/' + section.id + '.webp" alt="" loading="lazy" decoding="async">' +
        '<div class="banner-txt"><h2>' + esc(section.name) +
          (section.soon ? '<span class="soon-tag">Coming soon</span>' : "") + "</h2>" +
        (section.note ? '<p class="banner-note">' + esc(section.note) + "</p>" : "") +
      "</div></div>";

      if (section.sizes) {
        html += '<div class="sizes">' + section.sizes.map(function (s) {
          return '<div><span class="s-label">' + esc(s.label) + '</span><span class="s-price">' + money(s.price) + "</span></div>";
        }).join("") + "</div>";
      }

      items.forEach(function (it) {
        var priceHtml = typeof it.price === "number"
          ? '<span class="price">' + money(it.price) + "</span>"
          : '<span class="price">' + money(section.sizes[0].price) + '<span class="from">from</span></span>';

        html += '<button class="card reveal' + (it.soldout ? " soldout" : "") +
          '" type="button" data-item="' + it.id + '">' +
          '<span class="dot"></span>' +
          '<span class="body">' +
            '<span class="name">' + esc(it.name) +
              (it.spicy ? '<span class="spicy" title="Spicy" role="img" aria-label="Spicy">' + PEPPER + "</span>" : "") +
              (it.soldout ? '<span class="sold">Sold out</span>' : "") + "</span>" +
            (it.desc ? '<span class="desc">' + esc(it.desc) + "</span>" : "") +
          "</span>" +
          priceHtml +
        "</button>";
      });

      html += "</section>";
    });

    $("#menu").innerHTML = html || '<p class="empty">Nothing matches that search.</p>';
    observeReveal();
    observeSpy();
  }

  /* ---------------- scroll behaviour ---------------- */

  var revealObserver = null, spyObserver = null;

  function observeReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add("in"); });
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        revealObserver.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(els, function (el) { revealObserver.observe(el); });
  }

  function observeSpy() {
    if (!("IntersectionObserver" in window)) return;
    if (spyObserver) spyObserver.disconnect();
    spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActiveNav(e.target.dataset.section);
      });
    }, { rootMargin: "-12% 0px -72% 0px" });
    Array.prototype.forEach.call(document.querySelectorAll(".section"), function (el) { spyObserver.observe(el); });
  }

  function setActiveNav(id) {
    var nav = $("#catnav");
    Array.prototype.forEach.call(nav.querySelectorAll("button"), function (b) {
      var on = b.dataset.jump === id;
      b.classList.toggle("active", on);
      if (on) nav.scrollTo({ left: b.offsetLeft - nav.clientWidth / 2 + b.clientWidth / 2, behavior: "smooth" });
    });
  }

  /* ---------------- dish detail ---------------- */

  function canOrder(item, section) {
    return ORDERING && !orderBlock() && !section.soon && !item.soldout;
  }

  function openItem(id) {
    var found = findItem(id);
    if (!found) return;
    var item = found.item, section = found.section;
    var ordering = canOrder(item, section);

    DRAFT = ordering ? {
      id: item.id,
      size: section.sizes ? section.sizes[0].label : null,
      options: {},
      leaveOut: [],
      note: "",
      qty: 1
    } : null;
    if (DRAFT) (item.options || []).forEach(function (g) { DRAFT.options[g.name] = g.choices[0]; });

    var hero = $("#itemHeroImg");
    hero.src = "assets/img/" + section.id + ".webp";
    hero.alt = section.name;

    $("#itemKicker").textContent = section.name + (section.soon ? "  -  Coming soon" : "");
    $("#itemTitle").textContent = item.name;
    var ing = ingredientsOf(item);
    $("#itemDesc").textContent = ing ? "" : (item.desc || "");
    $("#itemDesc").hidden = !!ing || !item.desc;

    var body = "";

    if (typeof item.price === "number") {
      body += '<div class="pricebox"><span>Price</span><strong>' + money(item.price) + "</strong></div>";
    } else if (section.sizes) {
      body += '<div class="optgroup"><h3>' + (ordering ? "Choose a size" : "Sizes") + "</h3>" +
        (ordering
          ? '<div class="picks" data-pick="size">' + section.sizes.map(function (s, i) {
              return '<button type="button" class="pick' + (i === 0 ? " on" : "") + '" data-val="' + esc(s.label) + '">' +
                "<span>" + esc(s.label) + "</span><b>" + money(s.price) + "</b></button>";
            }).join("") + "</div>"
          : section.sizes.map(function (s) {
              return '<div class="priceline"><span>' + esc(s.label) + "</span><strong>" + money(s.price) + "</strong></div>";
            }).join("")) +
      "</div>";
    }

    (item.options || []).forEach(function (g) {
      body += '<div class="optgroup"><h3>' + esc(g.name) + (ordering ? "" : " options") + "</h3>" +
        (ordering
          ? '<div class="picks" data-pick="opt" data-group="' + esc(g.name) + '">' + g.choices.map(function (c, i) {
              return '<button type="button" class="pick' + (i === 0 ? " on" : "") + '" data-val="' + esc(c) + '">' +
                "<span>" + esc(c) + "</span></button>";
            }).join("") + "</div>"
          : '<div class="chips">' + g.choices.map(function (c) {
              return '<span class="chip">' + esc(c) + "</span>";
            }).join("") + "</div>") +
      "</div>";
    });

    if (ing) {
      body += '<div class="optgroup"><h3>What&rsquo;s in it</h3>' +
        (ordering
          ? '<div class="chips ing" data-leaveout>' + ing.map(function (c) {
              return '<button type="button" class="chip" data-val="' + esc(c) + '">' + esc(c) + "</button>";
            }).join("") + "</div>" +
            '<p class="leaveout">Tap anything you don&rsquo;t want and the kitchen will leave it out.</p>'
          : '<div class="chips ing">' + ing.map(function (c) {
              return '<span class="chip">' + esc(c) + "</span>";
            }).join("") + "</div>" +
            '<p class="leaveout">Don&rsquo;t want something? Ask your server to leave it out.</p>') +
      "</div>";
    }

    if (ordering) {
      body += '<div class="optgroup"><h3>Anything else?</h3>' +
        '<input class="fld" id="itemNote" type="text" maxlength="120" ' +
        'placeholder="e.g. extra crispy, sauce on the side" autocomplete="off"></div>';
    }

    if (item.spicy) body += '<p class="hotline"><span class="spicy">' + PEPPER + "</span> Served spicy.</p>";

    $("#itemBody").innerHTML = body;

    if (ordering) {
      $("#itemFoot").innerHTML =
        '<div class="qty" data-qty>' +
          '<button type="button" data-step="-1" aria-label="One less">&minus;</button>' +
          '<b id="itemQty">1</b>' +
          '<button type="button" data-step="1" aria-label="One more">+</button>' +
        "</div>" +
        '<button type="button" class="primary" id="itemAdd">Add to order &middot; ' +
          '<span id="itemAddPrice">' + money(unitPrice(item, section, DRAFT.size)) + "</span></button>";
    } else {
      var block = orderBlock();
      var why = section.soon ? "Not being served yet"
              : item.soldout ? "Sold out today"
              : block === "closed" ? "The kitchen is closed right now"
              : block === "paused" ? "Ordering is paused - please order at the counter"
              : block === "has-ticket" && TICKET
                ? "Order #" + TICKET.num + " is already with the kitchen"
              : null;

      // A number is out, so the only sensible next step is a second order -
      // saying nothing here just looks like the Add button is broken.
      var extra = block === "has-ticket"
        ? '<button type="button" class="primary" id="startAnother">Start another order</button>'
        : '<button type="button" class="ghost" data-close-item>Close</button>';

      $("#itemFoot").innerHTML =
        (ORDERING && why ? '<p class="footwhy">' + esc(why) + "</p>" : "") + extra;
    }

    $("#itemBackdrop").dataset.item = item.id;
    $("#itemBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function refreshAddPrice() {
    if (!DRAFT) return;
    var f = findItem(DRAFT.id);
    if (!f) return;
    var el = $("#itemAddPrice");
    if (el) el.textContent = money(unitPrice(f.item, f.section, DRAFT.size) * DRAFT.qty);
  }

  function closeItem() {
    $("#itemBackdrop").hidden = true;
    DRAFT = null;
    if ($("#cartBackdrop").hidden && $("#ticketBackdrop").hidden) document.body.style.overflow = "";
  }


  /* ---------------- the order sheet ---------------- */

  function describe(l) {
    var bits = [];
    if (l.size) bits.push(l.size);
    Object.keys(l.options || {}).forEach(function (k) { bits.push(l.options[k]); });
    return bits;
  }

  function renderCart() {
    var box = $("#cartLines");
    if (!CART.length) {
      box.innerHTML = '<p class="empty">Nothing in your order yet.</p>';
      $("#cartSubtotal").textContent = money(0);
      $("#placeBtn").disabled = true;
      return;
    }

    $("#placeBtn").disabled = false;
    box.innerHTML = CART.map(function (l, i) {
      var f = findItem(l.id);
      if (!f) return "";
      var unit = unitPrice(f.item, f.section, l.size);
      var bits = describe(l);
      return '<div class="cline">' +
        '<div class="cline-top">' +
          '<span class="cline-name">' + esc(f.item.name) + "</span>" +
          '<span class="cline-price">' + money(unit * l.qty) + "</span>" +
        "</div>" +
        (bits.length ? '<p class="cline-sub">' + esc(bits.join(" &middot; ").replace(/&middot;/g, "·")) + "</p>" : "") +
        (l.leaveOut.length ? '<p class="cline-no">No ' + esc(l.leaveOut.join(", ")) + "</p>" : "") +
        (l.note ? '<p class="cline-note">&ldquo;' + esc(l.note) + "&rdquo;</p>" : "") +
        '<div class="cline-foot">' +
          '<div class="qty" data-line="' + i + '">' +
            '<button type="button" data-step="-1" aria-label="One less">&minus;</button>' +
            "<b>" + l.qty + "</b>" +
            '<button type="button" data-step="1" aria-label="One more">+</button>' +
          "</div>" +
          '<button type="button" class="link" data-drop="' + i + '">Remove</button>' +
        "</div>" +
      "</div>";
    }).join("");

    $("#cartSubtotal").textContent = money(cartTotal());
  }

  function openCart() {
    renderCart();
    $("#cartMsg").hidden = true;
    $("#cartBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    $("#cartBackdrop").hidden = true;
    if ($("#itemBackdrop").hidden && $("#ticketBackdrop").hidden) document.body.style.overflow = "";
  }

  function kindNow() {
    if (CFG.orderMode === "dinein") return "dinein";
    if (CFG.orderMode === "pickup") return "pickup";
    var on = $("#cartKind") && $("#cartKind").querySelector(".on");
    return on ? on.dataset.val : "dinein";
  }

  function placeOrder() {
    var btn = $("#placeBtn"), msg = $("#cartMsg");
    var block = orderBlock();
    if (block) {
      msg.hidden = false;
      msg.textContent = block === "closed"
        ? "The kitchen is closed right now."
        : "Ordering is paused - please order at the counter.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Sending...";
    msg.hidden = true;

    api("/api/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: kindNow(),
        who: ($("#cartWho").value || "").trim(),
        seat: ($("#cartSeat").value || "").trim(),
        note: ($("#cartNote").value || "").trim(),
        lines: CART.map(function (l) {
          return { id: l.id, size: l.size, qty: l.qty, options: l.options, leaveOut: l.leaveOut, note: l.note };
        })
      })
    }).then(function (res) {
      CART = [];
      saveCart();
      TICKET = { ticket: res.ticket, num: res.num, status: res.status,
                 subtotal: res.subtotal, lines: res.lines, placedAt: res.placedAt };
      store(TICKET_KEY, TICKET);
      closeCart();
      showTicket();
      watchTicket();
    }).catch(function (e) {
      msg.hidden = false;
      msg.textContent = e.message;
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Place order";
    });
  }


  /* ---------------- the number ---------------- */

  var STATUS = {
    "new":       { label: "Order received", note: "Take your number to the register to pay." },
    "preparing": { label: "Being made",     note: "The kitchen has started on it." },
    "ready":     { label: "Ready",          note: "Collect it at the counter." },
    "done":      { label: "Collected",      note: "Enjoy - and thank you." },
    "void":      { label: "Cancelled",      note: "Please speak to someone at the counter." }
  };

  function showTicket() {
    if (!TICKET) return;
    var st = STATUS[TICKET.status] || STATUS["new"];

    $("#ticketNum").textContent = TICKET.num;
    $("#ticketState").textContent = st.label;
    $("#ticketState").className = "tstate is-" + TICKET.status;
    $("#ticketNote").textContent = st.note;

    $("#ticketLines").innerHTML = (TICKET.lines || []).map(function (l) {
      var bits = [];
      if (l.size) bits.push(l.size);
      (l.options || []).forEach(function (o) { bits.push(o.choice); });
      return '<div class="tline">' +
        "<span>" + l.qty + "&times; " + esc(l.name) + "</span>" +
        "<b>" + money(l.unit * l.qty) + "</b>" +
        (bits.length ? '<p>' + esc(bits.join(" · ")) + "</p>" : "") +
        (l.leaveOut && l.leaveOut.length ? '<p class="tno">No ' + esc(l.leaveOut.join(", ")) + "</p>" : "") +
        (l.note ? '<p class="tno">&ldquo;' + esc(l.note) + "&rdquo;</p>" : "") +
      "</div>";
    }).join("");

    $("#ticketTotal").textContent = money(TICKET.subtotal);
    $("#ticketBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function hideTicket() {
    $("#ticketBackdrop").hidden = true;
    if ($("#itemBackdrop").hidden && $("#cartBackdrop").hidden) document.body.style.overflow = "";
  }

  function watchTicket() {
    if (ticketTimer) clearInterval(ticketTimer);
    if (!TICKET) return;
    ticketTimer = setInterval(function () {
      if (!TICKET) return clearInterval(ticketTimer);
      api("/api/order/" + encodeURIComponent(TICKET.ticket)).then(function (r) {
        if (r.status === TICKET.status) return;
        TICKET.status = r.status;
        store(TICKET_KEY, TICKET);
        if (!$("#ticketBackdrop").hidden) showTicket();
        renderTicketPeek();
      }).catch(function () { /* a dropped poll is not worth telling anyone about */ });
    }, 8000);
  }

  /* A slim reminder that sits above the menu once an order is in, so the
     customer can get their number back after wandering off to read the menu. */
  function renderTicketPeek() {
    var bar = $("#ticketBar");
    if (!bar) return;
    if (!TICKET) { bar.hidden = true; document.body.classList.remove("has-ticketbar"); return; }
    bar.hidden = false;
    document.body.classList.add("has-ticketbar");
    var st = STATUS[TICKET.status] || STATUS["new"];
    $("#ticketBarNum").textContent = "#" + TICKET.num;
    $("#ticketBarState").textContent = st.label;
  }

  function forgetTicket() {
    TICKET = null;
    store(TICKET_KEY, null);
    if (ticketTimer) clearInterval(ticketTimer);
    hideTicket();
    renderTicketPeek();
    renderCartBar();
  }


  /* ---------------- events ---------------- */

  document.addEventListener("click", function (e) {
    var t = e.target;

    var jump = t.closest("[data-jump]");
    if (jump) {
      var sec = document.getElementById("sec-" + jump.dataset.jump);
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveNav(jump.dataset.jump);
      return;
    }

    /* --- inside the dish sheet --- */

    var pick = t.closest(".picks .pick");
    if (pick && DRAFT) {
      var group = pick.parentNode;
      Array.prototype.forEach.call(group.children, function (b) { b.classList.toggle("on", b === pick); });
      if (group.dataset.pick === "size") DRAFT.size = pick.dataset.val;
      else DRAFT.options[group.dataset.group] = pick.dataset.val;
      refreshAddPrice();
      return;
    }

    var out = t.closest("[data-leaveout] .chip");
    if (out && DRAFT) {
      var val = out.dataset.val;
      var at = DRAFT.leaveOut.indexOf(val);
      if (at === -1) { DRAFT.leaveOut.push(val); out.classList.add("off"); }
      else { DRAFT.leaveOut.splice(at, 1); out.classList.remove("off"); }
      return;
    }

    var step = t.closest("[data-step]");
    if (step) {
      var d = Number(step.dataset.step);
      var lineBox = step.closest("[data-line]");
      if (lineBox) {
        var i = Number(lineBox.dataset.line);
        CART[i].qty = Math.max(1, Math.min(20, CART[i].qty + d));
        saveCart();
        renderCart();
      } else if (DRAFT) {
        DRAFT.qty = Math.max(1, Math.min(20, DRAFT.qty + d));
        $("#itemQty").textContent = DRAFT.qty;
        refreshAddPrice();
      }
      return;
    }

    if (t.closest("#itemAdd") && DRAFT) {
      var noteEl = $("#itemNote");
      DRAFT.note = noteEl ? noteEl.value.trim().slice(0, 120) : "";
      addToCart(DRAFT);
      closeItem();
      return;
    }

    /* --- the order sheet --- */

    var drop = t.closest("[data-drop]");
    if (drop) {
      CART.splice(Number(drop.dataset.drop), 1);
      saveCart();
      renderCart();
      if (!CART.length) closeCart();
      return;
    }

    var kind = t.closest("#cartKind .pick");
    if (kind) {
      Array.prototype.forEach.call(kind.parentNode.children, function (b) { b.classList.toggle("on", b === kind); });
      $("#seatRow").hidden = kind.dataset.val !== "dinein";
      return;
    }

    if (t.closest("#cartBar")) { openCart(); return; }
    if (t.closest("#placeBtn")) { placeOrder(); return; }
    if (t.closest("[data-close-cart]") || t.id === "cartBackdrop") { closeCart(); return; }

    /* --- the number --- */

    if (t.closest("#ticketBar")) { showTicket(); return; }
    if (t.closest("#ticketDone")) { forgetTicket(); return; }
    if (t.closest("#startAnother")) {
      // clear the old number, then reopen the same dish so the tap that got
      // them here is not wasted
      var again = $("#itemBackdrop").dataset.item;
      forgetTicket();
      if (again) openItem(again);
      return;
    }
    if (t.closest("[data-close-ticket]") || t.id === "ticketBackdrop") { hideTicket(); return; }

    var card = t.closest("[data-item]");
    if (card) { openItem(card.dataset.item); return; }

    if (t.closest("[data-close-item]") || t.id === "itemBackdrop") { closeItem(); return; }
  });

  $("#search").addEventListener("input", function (e) { renderMenu(e.target.value); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("#ticketBackdrop").hidden) hideTicket();
    else if (!$("#cartBackdrop").hidden) closeCart();
    else closeItem();
  });

  /* ---------------- boot ---------------- */

  var call = $("#callBtn");
  if (CFG.phoneDisplay) {
    call.textContent = "Call " + CFG.phoneDisplay;
    call.href = "tel:" + CFG.phoneDisplay.replace(/[^0-9+]/g, "");
  } else {
    call.hidden = true;
  }

  var map = $("#mapBtn");
  if (CFG.address) {
    map.textContent = CFG.address;
    map.href = "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent((CFG.brand ? CFG.brand + " " : "") + CFG.address);
  } else {
    map.hidden = true;
  }

  if (CFG.halal) $("#halalBadge").hidden = false;

  // Toast, when it is live, takes the whole job - cart included.
  if (CFG.orderUrl) {
    $("#orderBtn").href = CFG.orderUrl;
    $("#orderBar").hidden = false;
    document.body.classList.add("has-order");
  }

  if (ORDERING) {
    CART = recall(CART_KEY) || [];
    TICKET = recall(TICKET_KEY);

    // an order from yesterday is not worth showing anyone
    if (TICKET && Date.now() - (TICKET.placedAt || 0) > 6 * 3600 * 1000) {
      TICKET = null;
      store(TICKET_KEY, null);
    }

    if (CFG.orderMode !== "ask") $("#cartKindRow").hidden = true;
    $("#seatRow").hidden = kindNow() !== "dinein";
    $("#taxNote").textContent = CFG.taxNote || "";
    $("#foodNote").innerHTML =
      "Tap a dish, choose what you want, and place your order.<br>" +
      "You&rsquo;ll get a number - pay at the register.";

    renderTicketPeek();
    if (TICKET) watchTicket();

    // the kitchen's own switch wins over everything on this page
    api("/api/health").then(function (h) {
      accepting = !!h.accepting;
      renderCartBar();
    }).catch(function () {
      accepting = false;      // if the order desk is unreachable, do not pretend
      renderCartBar();
    });
  }

  renderDeals();
  renderNav();
  renderMenu("");
  renderOpen();
  renderHoursList();
  renderCartBar();

  // the badge has to stay honest while the page sits open on a table
  setInterval(renderOpen, 60000);
})();
