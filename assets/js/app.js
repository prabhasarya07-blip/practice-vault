/* ============================================================
   Practice Vault — app.js
   Renders every page from the question bank in assets/js/data/*.
   Works from file:// as well as any static host (no build step).
   ============================================================ */
window.DSA = window.DSA || {};
(function (D) {
  "use strict";

  D.bank = D.bank || {};   /* topicId -> [question]  (filled by data files) */
  D.topics = D.topics || []; /* ordered topic metadata (filled by topics.js) */

  /* ---------------- small helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  D.esc = esc;

  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  D.q = q; D.qa = qa;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  D.el = el;

  D.topicById = function (id) {
    for (var i = 0; i < D.topics.length; i++) if (D.topics[i].id === id) return D.topics[i];
    return null;
  };

  D.allQuestions = function () {
    var out = [];
    D.topics.forEach(function (t) {
      (D.bank[t.id] || []).forEach(function (item) {
        var copy = {};
        for (var k in item) if (Object.prototype.hasOwnProperty.call(item, k)) copy[k] = item[k];
        copy.topicId = t.id;
        copy.topicName = t.name;
        copy.topicShort = t.short || t.name;
        out.push(copy);
      });
    });
    return out;
  };

  D.byId = function (id) {
    var list = D.allQuestions();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };

  /* index of each question inside its own topic (used for numbering + prev/next) */
  D.topicQuestions = function (topicId) { return D.allQuestions().filter(function (x) { return x.topicId === topicId; }); };

  /* ---------------- badges ---------------- */
  var FREQ_CLASS = { "Very High": "badge-freq-vh", "High": "badge-freq-h", "Medium": "badge-freq-m" };
  var DIFF_CLASS = { "Easy": "badge-easy", "Medium": "badge-medium", "Hard": "badge-hard" };

  D.diffBadge = function (level) {
    return '<span class="badge ' + (DIFF_CLASS[level] || "badge-neutral") + '">' + esc(level) + "</span>";
  };
  D.freqBadge = function (freq) {
    return '<span class="badge ' + (FREQ_CLASS[freq] || "badge-neutral") + '">' + esc(freq) + " asked</span>";
  };
  D.companyChips = function (list) {
    if (!list || !list.length) return "";
    return '<span class="chips">' + list.map(function (c) {
      return '<a class="chip chip-company" href="topics.html?company=' + encodeURIComponent(c) + '">' + esc(c) + "</a>";
    }).join("") + "</span>";
  };

  /* ---------------- progress (browser-local only) ---------------- */
  var DONE_KEY = "pv.practised.v1";
  var THEME_KEY = "pv.theme.v1";

  function readDone() {
    try {
      var raw = localStorage.getItem(DONE_KEY);
      if (raw == null && localStorage.getItem("pv.practised") != null) {
        /* one-time migration from an earlier single-key build */
        raw = localStorage.getItem("pv.practised");
        try { localStorage.setItem(DONE_KEY, raw); } catch (e2) {}
      }
      return JSON.parse(raw || "{}") || {};
    } catch (e) { return {}; }
  }
  D.isDone = function (id) { return !!readDone()[id]; };
  D.toggleDone = function (id) {
    var map = readDone();
    if (map[id]) delete map[id]; else map[id] = 1;
    try { localStorage.setItem(DONE_KEY, JSON.stringify(map)); } catch (e) {}
    return !!map[id];
  };
  D.doneCount = function (ids) {
    var map = readDone(), n = 0;
    (ids || Object.keys(map)).forEach(function (id) { if (map[id]) n++; });
    return n;
  };

  /* ---------------- theme ---------------- */
  D.theme = {
    get: function () {
      try {
        if (localStorage.getItem(THEME_KEY) == null && localStorage.getItem("pv.theme") != null) {
          return localStorage.getItem("pv.theme");
        }
        return localStorage.getItem(THEME_KEY) || "light";
      } catch (e) { return "light"; }
    },
    set: function (v) { try { localStorage.setItem(THEME_KEY, v); } catch (e) {} D.theme.apply(v); },
    toggle: function () { D.theme.set(D.theme.get() === "dark" ? "light" : "dark"); },
    apply: function (v) {
      document.documentElement.setAttribute("data-theme", v);
      qa("[data-theme-toggle]").forEach(function (b) {
        b.textContent = v === "dark" ? "Light mode" : "Dark mode";
        b.setAttribute("aria-label", "Switch to " + (v === "dark" ? "light" : "dark") + " theme");
      });
    }
  };
  D.theme.apply(D.theme.get());

  /* ---------------- search text ---------------- */
  var searchCache = null;
  D.searchText = function (item) {
    if (!searchCache) searchCache = {};
    if (searchCache[item.id] != null) return searchCache[item.id];
    var parts = [item.title, item.statement, item.pattern, item.technique, item.complexity,
      (item.companies || []).join(" "), item.topicShort, (item.algo || []).join(" "),
      (item.tags || []).join(" "), item.round];
    var s = parts.join(" ").toLowerCase();
    searchCache[item.id] = s;
    return s;
  };
  D.matches = function (item, term) {
    if (!term) return true;
    term = term.toLowerCase().trim();
    return term.split(/\s+/).every(function (w) { return D.searchText(item).indexOf(w) !== -1; });
  };

  /* ---------------- navigation state ---------------- */
  D.markNav = function () {
    var page = document.body.getAttribute("data-page") || "";
    qa(".nav a[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) a.setAttribute("aria-current", "page");
    });
  };
  D.pageTitle = function (t) { document.title = t + " \u00b7 Practice Vault"; };

  /* ---------------- renderers ---------------- */
  D.topicCard = function (t) {
    var items = D.bank[t.id] || [];
    var vh = items.filter(function (x) { return x.freq === "Very High"; }).length;
    return '<a class="topic-card" href="topics.html?topic=' + esc(t.id) + '">' +
      '<div class="topic-head"><span class="icon" aria-hidden="true">' + esc(t.tile) + "</span>" +
      "<h3>" + esc(t.name) + "</h3></div>" +
      '<p class="topic-line">' + esc(t.line || t.blurb) + "</p>" +
      '<div class="foot"><span>' + items.length + " problems</span><span>/</span><span>" + vh + " very-high" +
      '</span><span class="arrow">Open &rarr;</span></div></a>';
  };

  /* One-line-per-problem contract: title on line 1, a single mono meta line
     (technique / cost / companies), badges on the right. The full statement
     lives on the problem page, so browsing stays scannable. */
  D.listItem = function (item, i) {
    var done = D.isDone(item.id);
    var co = item.companies || [];
    var coTxt = co.slice(0, 2).join(", ") + (co.length > 2 ? " +" + (co.length - 2) : "");
    var cost = String(item.complexity || "").split(/[,;]/)[0].replace(/\s+for\s+.*$/i, "").trim();
    return '<article class="q-item">' +
      '<a class="q-row" href="question.html?id=' + esc(item.id) + '">' +
        '<span class="idx">' + (i + 1) + "</span>" +
        '<span class="q-body">' +
          '<span class="q-title">' + esc(item.title) + "</span>" +
          '<span class="q-meta">' + esc(item.technique) + " &middot; " + esc(cost) +
            (coTxt ? ' &middot; <span class="q-co">' + esc(coTxt) + "</span>" : "") + "</span>" +
        "</span>" +
        '<span class="q-tags">' + D.diffBadge(item.difficulty) + D.freqBadge(item.freq) +
          (done ? '<span class="done-flag" title="Marked practised">&#10003;</span>' : "") + "</span>" +
        '<span class="q-arrow" aria-hidden="true">&rarr;</span>' +
      "</a></article>";
  };

  D.renderDetail = function (root, item) {
    var t = D.topicById(item.topicId);
    var siblings = D.topicQuestions(item.topicId);
    var pos = 0;
    siblings.forEach(function (s, i) { if (s.id === item.id) pos = i; });
    var prev = siblings[pos - 1], next = siblings[pos + 1];
    var done = D.isDone(item.id);

    var rel = (item.related || []).map(function (id) {
      var r = D.byId(id);
      if (!r) return "";
      return '<a href="question.html?id=' + esc(r.id) + '">' + esc(r.title) +
        ' <span class="muted">(' + esc(r.topicShort) + ")</span></a>";
    }).filter(Boolean).join("");

    root.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb">' +
        '<a href="index.html">Home</a><span class="sep">/</span>' +
        '<a href="topics.html?topic=' + esc(item.topicId) + '">' + esc(t ? t.name : item.topicName) + "</a>" +
        '<span class="sep">/</span><span>' + esc(item.title) + "</span></nav>" +
      '<div class="detail has-rail">' +
        "<div>" +
          '<div class="panel">' +
            '<div class="tag-line">' + D.diffBadge(item.difficulty) + D.freqBadge(item.freq) +
              '<span class="badge badge-accent">' + esc(item.round || "Coding round") + "</span></div>" +
            "<h1>" + esc(item.title) + (item.freq === "Very High" ? ' <span class="hot" title="Very high frequency" aria-label="Very high frequency">&#9679;</span>' : "") + "</h1>" +
            '<p class="lead">' + esc(item.statement) + "</p>" +
            (item.art ? '<h3>The exact output shape to reproduce</h3><pre class="code-art">' + esc(item.art) + "</pre>" : "") +
            (item.io ? '<h3>Input / output structure</h3><div class="io-pair">' +
              '<div class="io-box"><div class="k">Input</div><code>' + esc(item.io.input) + "</code></div>" +
              '<div class="io-box"><div class="k">Expected output</div><code>' + esc(item.io.output) + "</code></div>" +
              (item.io.note ? '<div class="io-box"><div class="k">Also try</div><code>' + esc(item.io.note) + "</code></div>" : "") +
              "</div>" : "") +
            '<h3>Companies that keep asking it</h3><div class="tag-line">' + D.companyChips(item.companies) +
              '<span class="muted small">Reported across recent drives &mdash; read it as a style indicator, not a guarantee.</span></div>' +
          "</div>" +

          '<div class="panel"><h2>Pattern &amp; technique</h2><div class="kv">' +
            '<div><div class="k">Pattern</div><div>' + esc(item.pattern) + "</div></div>" +
            '<div><div class="k">Technique used</div><div>' + esc(item.technique) + "</div></div>" +
            '<div><div class="k">Complexity target</div><div><code>' + esc(item.complexity) + "</code></div></div>" +
            (item.memory ? '<div><div class="k">Remember</div><div>' + esc(item.memory) + "</div></div>" : "") +
          "</div></div>" +
        "</div>" +
        '<aside class="rail"></aside>' +
      "</div>";

    var main = q(".detail > div", root);
    main.insertAdjacentHTML("beforeend",
      '<div class="panel"><h2>Algorithm &mdash; steps only, no code</h2><ol class="algo-list">' +
        (item.algo || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") +
      "</ol></div>" +
      '<div class="panel"><h2>Edge cases the evaluator will try</h2><ul class="bullet-list">' +
        (item.edges || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") +
      "</ul>" +
      (item.traps && item.traps.length
        ? '<h2 style="margin-top:20px">Where candidates lose marks</h2><ul class="bullet-list">' +
          item.traps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" : "") +
      "</div>" +
      (item.variants && item.variants.length
        ? '<div class="panel"><h2>Follow-up variations asked in interviews</h2><ul class="bullet-list">' +
          item.variants.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>" : "") +
      (rel ? '<div class="panel"><h2>Practise next</h2><div class="mini-nav">' + rel + "</div></div>" : ""));

    q(".rail", root).innerHTML =
      '<div class="panel"><h2>Your status</h2>' +
        '<p class="muted small">Progress is stored in this browser only. No account, nothing uploaded.</p>' +
        '<button class="btn btn-ghost btn-sm" data-detail-done="' + esc(item.id) + '">' +
        (done ? "&#10003; Marked as practised" : "Mark as practised") + "</button>" +
      "</div>" +
      '<div class="panel"><h2>At a glance</h2><div class="mini-nav">' +
        "<span>Pattern: " + esc(item.pattern) + "</span>" +
        "<span>Technique: " + esc(item.technique) + "</span>" +
        "<span>Cost: <code>" + esc(item.complexity) + "</code></span>" +
      "</div></div>" +
      '<div class="panel"><h2>Move around</h2><div class="mini-nav">' +
        '<a href="topics.html?topic=' + esc(item.topicId) + '">All ' + esc(t ? t.name : item.topicName) + " problems</a>" +
        (prev ? '<a href="question.html?id=' + esc(prev.id) + '">&larr; ' + esc(prev.title) + "</a>" : "") +
        (next ? '<a href="question.html?id=' + esc(next.id) + '">' + esc(next.title) + " &rarr;</a>" : "") +
      "</div></div>" +
      '<div class="panel"><h2>Print / revise</h2>' +
        '<p class="muted small">Write the algorithm on paper from memory, then open this page again.</p>' +
        '<button class="btn btn-ghost btn-sm no-print" onclick="window.print()">Print this page</button>' +
      "</div>";

    var btn = q("[data-detail-done]", root);
    if (btn) {
      btn.addEventListener("click", function () {
        var now = D.toggleDone(item.id);
        btn.innerHTML = now ? "&#10003; Marked as practised" : "Mark as practised";
      });
    }
    return { done: done, rel: rel, prev: prev, next: next };
  };

  /* ---------------- url params ---------------- */
  function params() {
    var out = {};
    var s = window.location.search.replace(/^\?/, "");
    if (!s) return out;
    s.split("&").forEach(function (pair) {
      var bits = pair.split("=");
      if (bits[0]) out[decodeURIComponent(bits[0])] = decodeURIComponent((bits[1] || "").replace(/\+/g, " "));
    });
    return out;
  }
  D.params = params;

  function setParams(obj) {
    var bits = [];
    Object.keys(obj).forEach(function (k) {
      if (obj[k] != null && obj[k] !== "") bits.push(encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]));
    });
    var url = window.location.pathname + (bits.length ? "?" + bits.join("&") : "");
    window.history.replaceState(null, "", url);
  }
  D.setParams = setParams;

  function fillSelect(sel, options, value, allLabel) {
    if (!sel) return;
    sel.innerHTML = (allLabel ? '<option value="">' + allLabel + "</option>" : "") +
      options.map(function (o) {
        var v = typeof o === "string" ? o : o.value;
        var l = typeof o === "string" ? o : o.label;
        return '<option value="' + esc(v) + '"' + (v === value ? " selected" : "") + ">" + esc(l) + "</option>";
      }).join("");
  }
  D.fillSelect = fillSelect;

  D.companies = function () {
    var seen = {};
    D.allQuestions().forEach(function (item) {
      (item.companies || []).forEach(function (c) { seen[c] = (seen[c] || 0) + 1; });
    });
    return Object.keys(seen).sort(function (a, b) { return seen[b] - seen[a] || a.localeCompare(b); });
  };

  /* ---------------- index page ---------------- */
  D.initIndex = function () {
    var all = D.allQuestions();
    var vh = all.filter(function (x) { return x.freq === "Very High"; }).length;

    var grid = q("#topicGrid");
    if (grid) grid.innerHTML = D.topics.map(D.topicCard).join("");

    function stat(id, val) { var n = q(id); if (n) n.textContent = val; }
    stat("#statTotal", all.length);
    stat("#statVH", vh);
    stat("#statCompanies", D.companies().length);

    var feat = q("#featuredList");
    if (feat) {
      var picks = all.filter(function (x) { return x.freq === "Very High"; }).slice(0, 6);
      feat.innerHTML = picks.map(function (item, i) { return D.listItem(item, i); }).join("");
    }

    var form = q("#heroSearch");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = q("input", form).value.trim();
        window.location.href = "topics.html" + (v ? "?q=" + encodeURIComponent(v) : "");
      });
    }
  };

  /* ---------------- question bank page ---------------- */
  var DIFF_ORDER = { "Easy": 1, "Medium": 2, "Hard": 3 };
  var FREQ_ORDER = { "Very High": 1, "High": 2, "Medium": 3 };
  var SORT_OPTIONS = [
    { value: "recommended", label: "Curated learning order" },
    { value: "difficulty", label: "Easiest first" },
    { value: "frequency", label: "Most frequently asked" },
    { value: "az", label: "A to Z by title" }
  ];

  function sortQuestions(list, mode) {
    var copy = list.slice();
    if (mode === "difficulty") {
      copy.sort(function (a, b) {
        return (DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]) || (FREQ_ORDER[a.freq] - FREQ_ORDER[b.freq]);
      });
    } else if (mode === "frequency") {
      copy.sort(function (a, b) {
        return (FREQ_ORDER[a.freq] - FREQ_ORDER[b.freq]) || (DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
      });
    } else if (mode === "az") {
      copy.sort(function (a, b) { return a.title.localeCompare(b.title); });
    }
    return copy;
  }
  D.sortQuestions = sortQuestions;

  D.initTopics = function () {
    var p = params();
    var state = {
      topic: p.topic || "", q: p.q || "", diff: p.diff || "",
      freq: p.freq || "", company: p.company || "",
      sort: p.sort || "recommended", unseen: p.unseen === "1"
    };

    var pills = q("#topicPills");
    var searchInput = q("#searchInput");
    var diffSel = q("#diffSelect");
    var freqSel = q("#freqSelect");
    var compSel = q("#companySelect");
    var sortSel = q("#sortSelect");
    var unseenBox = q("#unseenOnly");
    var listEl = q("#qList");
    var countEl = q("#listCount");
    var headName = q("#topicHeading");
    var headBlurb = q("#topicBlurb");

    if (searchInput) searchInput.value = state.q;
    fillSelect(diffSel, ["Easy", "Medium", "Hard"], state.diff, "Any difficulty");
    fillSelect(freqSel, ["Very High", "High", "Medium"], state.freq, "Any frequency");
    fillSelect(compSel, D.companies(), state.company, "Any company");
    fillSelect(sortSel, SORT_OPTIONS, state.sort);
    if (unseenBox) unseenBox.checked = state.unseen;

    function renderPills() {
      if (!pills) return;
      pills.innerHTML = '<button type="button" data-topic="" aria-pressed="' + (!state.topic) + '">All topics</button>' +
        D.topics.map(function (t) {
          var n = (D.bank[t.id] || []).length;
          return '<button type="button" data-topic="' + esc(t.id) + '" aria-pressed="' +
            (state.topic === t.id) + '">' + esc(t.short || t.name) + ' <span class="muted">' + n + "</span></button>";
        }).join("");
      qa("button", pills).forEach(function (b) {
        b.addEventListener("click", function () {
          state.topic = b.getAttribute("data-topic");
          state.sort = sortSel ? sortSel.value : state.sort;
          sync();
        });
      });
    }

    function render() {
      var list = D.allQuestions();
      if (state.topic) list = list.filter(function (x) { return x.topicId === state.topic; });
      if (state.diff) list = list.filter(function (x) { return x.difficulty === state.diff; });
      if (state.freq) list = list.filter(function (x) { return x.freq === state.freq; });
      if (state.company) list = list.filter(function (x) { return (x.companies || []).indexOf(state.company) !== -1; });
      if (state.q) list = list.filter(function (x) { return D.matches(x, state.q); });
      if (state.unseen) list = list.filter(function (x) { return !D.isDone(x.id); });
      list = sortQuestions(list, state.sort);

      var t = state.topic ? D.topicById(state.topic) : null;
      if (headName) headName.textContent = t ? t.name : "Every problem, in learning order";
      if (headBlurb) {
        headBlurb.textContent = t ? t.blurb :
          "Filter the whole bank \u2014 combine filters to find your fastest wins first.";
      }
      var brief = q("#topicBrief");
      if (brief) {
        if (!t) {
          brief.style.display = "none";
          brief.innerHTML = "";
        } else {
          brief.style.display = "";
          var starters = (t.starterIds || []).map(function (id) {
            var s = D.byId(id);
            return s ? '<a href="question.html?id=' + esc(s.id) + '">' + esc(s.title) + "</a>" : "";
          }).join("");

          var conceptsHtml = "";
          if (t.coreConcepts && t.coreConcepts.length) {
            conceptsHtml = '<h2 style="margin-top:20px">Key principles &amp; loop invariants</h2><ul class="bullet-list">' +
              t.coreConcepts.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>";
          }

          var patternsHtml = "";
          if (t.examPatterns && t.examPatterns.length) {
            patternsHtml = '<h2 style="margin-top:20px">High-frequency placement patterns</h2>' +
              '<div class="topic-grid" style="margin-top:10px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">' +
              t.examPatterns.map(function (p) {
                return '<div class="mini-card">' +
                  '<h3>' + esc(p.name) + '</h3>' +
                  '<p>' + esc(p.detail) + '</p></div>';
              }).join("") + '</div>';
          }

          brief.innerHTML = "<h2>Why this topic matters</h2><p>" + esc(t.why) + "</p>" +
            conceptsHtml +
            patternsHtml +
            '<h2 style="margin-top:20px">How it appears in the rounds</h2><ul class="bullet-list">' +
            (t.howAsked || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
            '<div class="callout" style="margin-top:18px"><span class="ico">&rarr;</span><span>' + esc(t.orderNote) + "</span></div>" +
            (starters ? '<h2 style="margin-top:20px">Start with these four</h2><div class="mini-nav">' + starters + "</div>" : "");
        }
      }

      if (countEl) {
        countEl.textContent = list.length + " shown" + (state.topic ? "" : " of " + D.allQuestions().length) +
          (D.doneCount() ? "  \u00b7  " + D.doneCount() + " marked practised" : "");
      }
      if (listEl) {
        listEl.innerHTML = list.length
          ? list.map(function (item, i) { return D.listItem(item, i); }).join("")
          : '<div class="empty"><p><b>No problem matches that combination.</b></p>' +
            '<p class="small">Clear the search box, widen the difficulty filter, or switch the topic pill back to &ldquo;All topics&rdquo;.</p></div>';
      }
    }

    function sync() {
      if (diffSel) state.diff = diffSel.value;
      if (freqSel) state.freq = freqSel.value;
      if (compSel) state.company = compSel.value;
      if (sortSel) state.sort = sortSel.value || "recommended";
      setParams({
        topic: state.topic, q: state.q, diff: state.diff, freq: state.freq,
        company: state.company, sort: state.sort === "recommended" ? "" : state.sort,
        unseen: state.unseen ? "1" : ""
      });
      renderPills();
      render();
    }
    D.refreshTopics = sync;

    if (searchInput) {
      var tmr = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(tmr);
        tmr = setTimeout(function () { state.q = searchInput.value.trim(); sync(); }, 140);
      });
    }
    [diffSel, freqSel, compSel, sortSel].forEach(function (sel) {
      if (sel) sel.addEventListener("change", sync);
    });
    if (unseenBox) {
      unseenBox.addEventListener("change", function () { state.unseen = unseenBox.checked; sync(); });
    }
    var resetBtn = q("#resetFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state.topic = ""; state.q = ""; state.diff = ""; state.freq = "";
        state.company = ""; state.sort = "recommended"; state.unseen = false;
        if (searchInput) searchInput.value = "";
        fillSelect(diffSel, ["Easy", "Medium", "Hard"], "", "Any difficulty");
        fillSelect(freqSel, ["Very High", "High", "Medium"], "", "Any frequency");
        fillSelect(compSel, D.companies(), "", "Any company");
        fillSelect(sortSel, SORT_OPTIONS, "recommended");
        if (unseenBox) unseenBox.checked = false;
        sync();
      });
    }

    sync();
  };

  /* ---------------- single question page ---------------- */
  D.initQuestion = function () {
    var root = q("#detailRoot");
    var id = params().id || "";
    var item = D.byId(id);
    if (!item) {
      if (root) {
        root.innerHTML =
          '<div class="crumbs"><a href="index.html">Home</a><span class="sep">/</span><span>Not found</span></div>' +
          '<div class="panel" style="margin-top:22px"><h1>That problem is not in the bank</h1>' +
          '<p class="muted">The link may be outdated. Every problem lives inside one of the five topics.</p>' +
          '<div class="mini-nav">' + D.topics.map(function (t) {
            return '<a href="topics.html?topic=' + esc(t.id) + '">' + esc(t.name) + "</a>";
          }).join("") + "</div></div>";
      }
      D.pageTitle("Not found");
      return;
    }
    D.pageTitle(item.title);
    if (root) D.renderDetail(root, item);
  };

  /* ---------------- practice sheet generator ---------------- */
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  D.initPractice = function () {
    var topicSel = q("#pTopic");
    var diffSel = q("#pDiff");
    var freqSel = q("#pFreq");
    var countSel = q("#pCount");
    var sheet = q("#sheet");
    var meta = q("#sheetMeta");
    var genBtn = q("#generateBtn");
    var printBtn = q("#printBtn");
    var rerollBtn = q("#rerollBtn");
    var hideHints = q("#hideHints");

    fillSelect(topicSel, D.topics.map(function (t) {
      return { value: t.id, label: t.name + " (" + (D.bank[t.id] || []).length + ")" };
    }), D.topics.length ? D.topics[0].id : "", "");
    fillSelect(diffSel, ["Mixed", "Easy", "Medium", "Hard"], "Mixed");
    fillSelect(freqSel, ["Any", "Very High", "High", "Medium"], "Any");
    fillSelect(countSel, [
      { value: "5", label: "5 problems" }, { value: "8", label: "8 problems" },
      { value: "10", label: "10 problems" }, { value: "15", label: "15 problems" }
    ], "8");

    function build() {
      var topic = topicSel.value;
      var diff = diffSel.value;
      var freq = freqSel.value;
      var n = parseInt(countSel.value, 10) || 8;

      var pool = D.allQuestions().filter(function (x) { return x.topicId === topic; });
      var filtered = pool.filter(function (x) {
        return (diff === "Mixed" || x.difficulty === diff) && (freq === "Any" || x.freq === freq);
      });
      var usedFallback = false;
      if (filtered.length < 3) { filtered = pool; usedFallback = true; }

      var picked = shuffle(filtered).slice(0, n);
      var t = D.topicById(topic);

      if (meta) {
        meta.innerHTML = "<b>" + picked.length + " problems</b> &middot; " + esc(t ? t.name : "") +
          " &middot; " + esc(diff) + " difficulty" + (freq !== "Any" ? " &middot; " + esc(freq) + " frequency" : "") +
          (usedFallback ? ' &middot; <span class="muted">filters too narrow, used the full topic instead</span>' : "");
      }
      if (!sheet) return;
      sheet.innerHTML = picked.map(function (item, i) {
        return '<article class="sheet-item">' +
          '<div class="num"><b>Q' + (i + 1) + "</b> &middot; " + esc(item.difficulty) + " &middot; " + esc(item.freq) + " frequency</div>" +
          "<h3>" + esc(item.title) + "</h3>" +
          "<p>" + esc(item.statement) + "</p>" +
          (item.art ? '<pre class="code-art">' + esc(item.art) + "</pre>" : "") +
          '<p class="hint" data-hint="1"><b>Pattern to use:</b> ' + esc(item.pattern) +
            " &nbsp;|&nbsp; <b>Technique:</b> " + esc(item.technique) +
            " &nbsp;|&nbsp; <b>Target:</b> " + esc(item.complexity) + "</p>" +
          '<p class="hint"><a href="question.html?id=' + esc(item.id) + '">Check the algorithm steps &rarr;</a></p>' +
          "</article>";
      }).join("");
    }

    if (genBtn) genBtn.addEventListener("click", build);
    if (rerollBtn) rerollBtn.addEventListener("click", build);
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
    if (hideHints) {
      hideHints.addEventListener("change", function () {
        qa("[data-hint]", sheet).forEach(function (n) { n.style.display = hideHints.checked ? "none" : ""; });
      });
    }
    build();
  };

  /* ---------------- reference page ---------------- */
  function groupBy(list, keyFn) {
    var map = {};
    list.forEach(function (item) {
      var keys = keyFn(item);
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) {
        if (!k) return;
        if (!map[k]) map[k] = [];
        map[k].push(item);
      });
    });
    return map;
  }

  function indexRows(map, sortedKeys, total) {
    var max = 1;
    sortedKeys.forEach(function (key) { if (map[key].length > max) max = map[key].length; });
    return sortedKeys.map(function (key) {
      var items = map[key];
      var topics = {};
      items.forEach(function (i) { topics[i.topicShort] = 1; });
      var sample = items.slice(0, 3).map(function (i) {
        return '<a href="question.html?id=' + esc(i.id) + '">' + esc(i.title) + "</a>";
      }).join(", ");
      return "<tr><td><b>" + esc(key) + "</b></td>" +
        '<td><span class="count-bar" aria-hidden="true"><i style="width:' + Math.round((items.length / max) * 100) + '%"></i></span> <b>' + items.length + "</b>" +
        (total ? ' <span class="muted small">/ ' + total + "</span>" : "") + "</td>" +
        "<td>" + esc(Object.keys(topics).join(", ")) + "</td><td>" + sample +
        (items.length > 3 ? ' <span class="muted">+' + (items.length - 3) + " more</span>" : "") + "</td></tr>";
    }).join("");
  }

  D.initReference = function () {
    var all = D.allQuestions();

    var body = q("#refBody");
    if (body) {
      var t1 = q("#refTotal"), t2 = q("#refVH"), t3 = q("#refEasy"), t4 = q("#refMedium"), t5 = q("#refHard");
      if (t1) t1.textContent = all.length;
      if (t2) t2.textContent = all.filter(function (x) { return x.freq === "Very High"; }).length;
      if (t3) t3.textContent = all.filter(function (x) { return x.difficulty === "Easy"; }).length;
      if (t4) t4.textContent = all.filter(function (x) { return x.difficulty === "Medium"; }).length;
      if (t5) t5.textContent = all.filter(function (x) { return x.difficulty === "Hard"; }).length;
    }

    var techMap = groupBy(all, function (i) { return i.technique; });
    var techKeys = Object.keys(techMap).sort(function (a, b) {
      return techMap[b].length - techMap[a].length || a.localeCompare(b);
    });
    var techRows = q("#techRows");
    if (techRows) techRows.innerHTML = indexRows(techMap, techKeys, all.length);

    var patMap = groupBy(all, function (i) { return i.pattern; });
    var patKeys = Object.keys(patMap).sort(function (a, b) {
      return patMap[b].length - patMap[a].length || a.localeCompare(b);
    });
    var patRows = q("#patRows");
    if (patRows) patRows.innerHTML = indexRows(patMap, patKeys, all.length);

    var topicRows = q("#topicRows");
    if (topicRows) {
      topicRows.innerHTML = D.topics.map(function (t) {
        var items = D.bank[t.id] || [];
        var vh = items.filter(function (x) { return x.freq === "Very High"; }).length;
        var co = {};
        items.forEach(function (i) { (i.companies || []).forEach(function (c) { co[c] = (co[c] || 0) + 1; }); });
        var top = Object.keys(co).sort(function (a, b) { return co[b] - co[a]; }).slice(0, 5);
        return "<tr><td><b>" + esc(t.name) + "</b></td><td>" + items.length + "</td><td>" + vh + "</td><td>" +
          esc(top.join(", ")) + "</td><td>" + esc((t.focus || []).join(", ")) + "</td></tr>";
      }).join("");
    }

    var progressHost = q("#refProgress");
    if (progressHost) {
      var ids = all.map(function (x) { return x.id; });
      var done = D.doneCount(ids);
      var pct = all.length ? Math.round((done / all.length) * 100) : 0;
      progressHost.innerHTML = '<div class="kv"><div><div class="k">Marked practised</div><div>' +
        done + " of " + all.length + " (" + pct + "%)</div></div>" +
        '<div><div class="k">Remaining</div><div>' + (all.length - done) + "</div></div></div>" +
        '<div class="progress-bar" style="margin-top:12px" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
        '<p class="muted small" style="margin-top:12px">Counted from this browser only &mdash; no sign-in, no tracking.</p>';
    }
  };

  /* ---------------- boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    D.markNav();
    var navToggle = q(".nav-toggle");
    var nav = q(".nav");
    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var open = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", open ? "false" : "true");
        nav.className = (nav.className || "").replace(/\s*\bopen\b/g, "") + (open ? "" : " open");
      });
    }
    /* highlight the active topic inside the nav dropdown */
    var curTopic = params().topic;
    qa(".nav-drop-menu a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var idx = href.indexOf("topic=");
      var t = idx >= 0 ? decodeURIComponent(href.slice(idx + 6).split("&")[0]) : "";
      if (t && t === curTopic) a.setAttribute("data-topic-current", "1");
    });
    qa("[data-theme-toggle]").forEach(function (b) { b.addEventListener("click", D.theme.toggle); });
    qa("[data-header-search]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = q("input", form).value.trim();
        window.location.href = "topics.html" + (v ? "?q=" + encodeURIComponent(v) : "");
      });
    });

    var page = document.body.getAttribute("data-page");
    if (page === "home") D.initIndex();
    else if (page === "bank") D.initTopics();
    else if (page === "question") D.initQuestion();
    else if (page === "practice") D.initPractice();
    else if (page === "reference") D.initReference();
  });
})(window.DSA);
