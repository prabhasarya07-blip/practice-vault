/* ============================================================
   tools/validate.js — content checks for the question bank.
   Run with:  node tools/validate.js
   Loads the browser data files in a sandbox, then verifies that
   every problem is complete and every cross-reference resolves.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DATA_DIR = path.join(__dirname, "..", "assets", "js", "data");
const FILES = ["topics.js", "numbers.js", "patterns.js", "arrays.js", "strings.js", "sortsearch.js"];

const sandbox = { window: {} };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
for (const f of FILES) {
  const code = fs.readFileSync(path.join(DATA_DIR, f), "utf8");
  vm.runInContext(code, sandbox, { filename: f });
}

const D = sandbox.window.DSA || {};
const topics = D.topics || [];
const bank = D.bank || {};

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const FREQS = ["Very High", "High", "Medium"];
const REQUIRED = ["id", "title", "difficulty", "freq", "companies", "statement", "pattern", "technique", "algo", "complexity", "edges"];

const problems = [];
const errors = [];
const warnings = [];

topics.forEach(function (t) {
  ["tile", "name", "short", "blurb", "focus", "why", "howAsked", "orderNote", "starterIds"].forEach(function (k) {
    if (!t[k]) errors.push("topic " + t.id + " is missing " + k);
  });
  const items = bank[t.id];
  if (!Array.isArray(items) || !items.length) errors.push("topic " + t.id + " has no problems");
  (items || []).forEach(function (q) {
    problems.push(q);
    const where = t.id + "/" + (q.id || "(no id)");
    REQUIRED.forEach(function (k) {
      const v = q[k];
      if (v == null || (Array.isArray(v) && !v.length) || v === "") errors.push(where + " is missing " + k);
    });
    if (DIFFICULTIES.indexOf(q.difficulty) === -1) errors.push(where + " has an invalid difficulty: " + q.difficulty);
    if (FREQS.indexOf(q.freq) === -1) errors.push(where + " has an invalid freq: " + q.freq);
    if (!Array.isArray(q.companies) || !q.companies.length) errors.push(where + " has no company tags");
    if (!Array.isArray(q.algo) || q.algo.length < 4) errors.push(where + " needs at least 4 algorithm steps");
    if (t.id === "patterns" && !q.art) errors.push(where + " is a pattern problem without an `art` shape");
    if (!q.io) warnings.push(where + " has no input/output example");
    if (!q.traps || !q.traps.length) warnings.push(where + " lists no traps");
    if (!q.variants || !q.variants.length) warnings.push(where + " lists no follow-up variations");
  });
});

const ids = {};
problems.forEach(function (q) { ids[q.id] = (ids[q.id] || 0) + 1; });
Object.keys(ids).forEach(function (id) {
  if (id === "undefined") errors.push("a problem is missing its id");
  else if (ids[id] > 1) errors.push("duplicate problem id: " + id + " (" + ids[id] + " times)");
});

problems.forEach(function (q) {
  (q.related || []).forEach(function (r) {
    if (!ids[r]) warnings.push(q.id + " links to a missing related problem: " + r);
  });
});

topics.forEach(function (t) {
  (t.starterIds || []).forEach(function (id) {
    if (!ids[id]) errors.push("topic " + t.id + " has a starter id that does not exist: " + id);
  });
});

const byTopic = topics.map(function (t) {
  const items = bank[t.id] || [];
  return {
    topic: t.name,
    problems: items.length,
    veryHigh: items.filter(function (q) { return q.freq === "Very High"; }).length,
    easy: items.filter(function (q) { return q.difficulty === "Easy"; }).length,
    medium: items.filter(function (q) { return q.difficulty === "Medium"; }).length,
    hard: items.filter(function (q) { return q.difficulty === "Hard"; }).length
  };
});

console.log("practice vault — content validation\n");
console.table ? console.table(byTopic) : console.log(byTopic);
console.log("total problems: " + problems.length);
console.log("techniques used: " + Object.keys(problems.reduce(function (a, q) { a[q.technique] = 1; return a; }, {})).length);

if (warnings.length) {
  console.log("\nwarnings (" + warnings.length + "):");
  warnings.slice(0, 40).forEach(function (w) { console.log("  - " + w); });
  if (warnings.length > 40) console.log("  ... and " + (warnings.length - 40) + " more");
}
if (errors.length) {
  console.log("\nERRORS (" + errors.length + "):");
  errors.forEach(function (e) { console.log("  x " + e); });
  process.exitCode = 1;
} else {
  console.log("\nno errors: every problem is complete and every cross-reference resolves.");
}
