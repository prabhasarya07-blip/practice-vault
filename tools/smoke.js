/* ============================================================
   tools/smoke.js — runs every page renderer against a stub DOM
   to catch runtime errors (missing nodes, typos, bad data access)
   without a browser. Usage: node tools/smoke.js
   ============================================================ */
var path = require("path");
var fs = require("fs");

var failures = [];
var currentPath = "/";

function makeEl(label) {
  var el = {
    _label: label,
    _html: "",
    _text: "",
    value: "",
    checked: false,
    style: {},
    className: "",
    _attrs: {},
    listeners: {},
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    setAttribute: function (k, v) { this._attrs[k] = String(v); },
    getAttribute: function (k) { return this._attrs[k] != null ? this._attrs[k] : null; },
    addEventListener: function (t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    removeEventListener: function () {},
    insertAdjacentHTML: function (pos, html) { this._html += html; },
    querySelector: function (sel) { return makeEl(label + " " + sel); },
    querySelectorAll: function () { return []; },
    focus: function () {},
    click: function () {}
  };
  return el;
}

var elCache = {};

/* ---------------- globals the app expects ---------------- */
global.localStorage = {
  _store: {},
  getItem: function (k) { return this._store[k] != null ? this._store[k] : null; },
  setItem: function (k, v) { this._store[k] = String(v); },
  removeItem: function (k) { delete this._store[k]; }
};

global.window = {
  DSA: {},
  location: { search: "", pathname: "/", href: "/" },
  history: { replaceState: function () {}, pushState: function () {} },
  print: function () {}
};

global.document = {
  documentElement: { setAttribute: function () {}, getAttribute: function () { return null; } },
  body: { getAttribute: function () { return "smoke"; }, setAttribute: function () {} },
  title: "",
  addEventListener: function () {},
  createElement: function (tag) { return makeEl("<" + tag + ">"); },
  querySelector: function (sel) {
    if (!elCache[sel]) elCache[sel] = makeEl(sel);
    return elCache[sel];
  },
  querySelectorAll: function () { return []; }
};

/* ---------------- load the app ---------------- */
function load(rel) {
  var p = path.join(__dirname, "..", rel);
  var code = fs.readFileSync(p, "utf8");
  /* eslint-disable no-eval */
  (0, eval)(code + "\n//# sourceURL=" + rel.replace(/\\/g, "/"));
}

["assets/js/data/topics.js",
 "assets/js/data/numbers.js",
 "assets/js/data/patterns.js",
 "assets/js/data/arrays.js",
 "assets/js/data/strings.js",
 "assets/js/data/sortsearch.js",
 "assets/js/app.js"].forEach(load);

var D = global.window.DSA;
if (!D || !D.allQuestions) {
  console.error("app failed to load");
  process.exit(1);
}

function step(name, fn) {
  try {
    fn();
    console.log("  ok   " + name);
  } catch (e) {
    failures.push(name + " — " + e.message);
    console.log("  FAIL " + name + " — " + e.message);
  }
}

console.log("smoke test — page renderers");

step("home (initIndex)", function () { D.initIndex(); });
step("bank (initTopics, no filters)", function () { D.initTopics(); });
step("bank (initTopics, filtered URL)", function () {
  global.window.location.search = "?topic=arrays&freq=Very%20High&sort=difficulty&q=palindrome";
  D.initTopics();
});
step("practice (initPractice)", function () { D.initPractice(); });
step("reference (initReference)", function () { D.initReference(); });

console.log("smoke test — every question detail page");
var all = D.allQuestions();
all.forEach(function (item) {
  step("question " + item.id, function () {
    global.window.location.search = "?id=" + encodeURIComponent(item.id);
    D.initQuestion();
    var root = document.querySelector("#detailRoot");
    var expected = D.esc(item.title);
    if (!root.innerHTML || root.innerHTML.indexOf(expected) === -1) {
      throw new Error("detail root did not render the title");
    }
  });
});

console.log("");
if (failures.length) {
  console.log(failures.length + " failure(s):");
  failures.forEach(function (f) { console.log("  - " + f); });
  process.exit(1);
} else {
  console.log("all renderers ran clean (" + all.length + " question pages).");
}
