/* AL BAIK - menu viewer. No cart, no ordering: the waiter takes the order at the table.
   No backend, no build step. */
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

  /* ---------------- dish detail (read only) ---------------- */

  function openItem(id) {
    var found = findItem(id);
    if (!found) return;
    var item = found.item, section = found.section;

    var hero = $("#itemHeroImg");
    hero.src = "assets/img/" + section.id + ".webp";
    hero.alt = section.name;

    $("#itemKicker").textContent = section.name + (section.soon ? "  -  Coming soon" : "");
    $("#itemTitle").textContent = item.name;
    var asChips = !!ingredientsOf(item);
    $("#itemDesc").textContent = asChips ? "" : (item.desc || "");
    $("#itemDesc").hidden = asChips || !item.desc;

    var body = "";

    if (typeof item.price === "number") {
      body += '<div class="pricebox"><span>Price</span><strong>' + money(item.price) + "</strong></div>";
    } else if (section.sizes) {
      body += '<div class="optgroup"><h3>Sizes</h3>' + section.sizes.map(function (s) {
        return '<div class="priceline"><span>' + esc(s.label) + "</span><strong>" + money(s.price) + "</strong></div>";
      }).join("") + "</div>";
    }

    var ing = ingredientsOf(item);
    if (ing) {
      body += '<div class="optgroup"><h3>What&rsquo;s in it</h3><div class="chips ing">' +
        ing.map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join("") +
      "</div>" +
      '<p class="leaveout">Don&rsquo;t want something? Ask your server to leave it out.</p>' +
      "</div>";
    }

    (item.options || []).forEach(function (g) {
      body += '<div class="optgroup"><h3>' + esc(g.name) + " options</h3><div class=\"chips\">" +
        g.choices.map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join("") +
      "</div></div>";
    });

    if (item.spicy) body += '<p class="hotline"><span class="spicy">' + PEPPER + "</span> Served spicy.</p>";

    $("#itemBody").innerHTML = body;

    $("#itemBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeItem() {
    $("#itemBackdrop").hidden = true;
    document.body.style.overflow = "";
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

    var card = t.closest("[data-item]");
    if (card) { openItem(card.dataset.item); return; }

    if (t.closest("[data-close-item]") || t.id === "itemBackdrop") { closeItem(); return; }
  });

  $("#search").addEventListener("input", function (e) { renderMenu(e.target.value); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeItem();
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

  renderDeals();
  renderNav();
  renderMenu("");
  renderOpen();
  renderHoursList();

  // the badge has to stay honest while the page sits open on a table
  setInterval(renderOpen, 60000);
})();
