# Practice Vault

**Live site: https://practice-vault.vercel.app/**

A curated study resource for fresher coding assessments — **146 problems across 5 topics**, each with
its pattern, technique, numbered algorithm steps, traps, edge cases and target complexity.

Deliberately **no answers and no code.** The site stops exactly where the thinking begins, so the
recall stays with you rather than dissolving into a copied solution.

[![Live site](https://img.shields.io/badge/live-practice--vault.vercel.app-000000?style=flat-square&logo=vercel)](https://practice-vault.vercel.app/)

---

## Table of contents

- [What it is](#what-it-is)
- [Tech stack](#tech-stack)
- [System architecture](#system-architecture)
- [Features](#features)
- [Project structure](#project-structure)
- [Running locally](#running-locally)
- [Validating](#validating)
- [Data model](#data-model)
- [Deployment](#deployment)
- [Design decisions](#design-decisions)
- [Legal](#legal)

---

## What it is

A static, offline-capable web app that turns a question bank into a **reading-and-writing loop**
rather than a solution library:

1. Read only the statement — input shape, output shape, constraints.
2. Guess the pattern before looking at anything.
3. Write numbered plain-language steps, *then* code.
4. Come back, compare against the listed algorithm and traps, and mark it practised.

146 problems, 126 distinct techniques, sequenced into five topics so each one builds on the last.

| # | Topic | Problems | Very-high frequency | Purpose |
|---|-------|---------:|--------------------:|---------|
| 1 | Number programs & number logic | 34 | 22 | Loop control, digit manipulation, maths |
| 2 | Pattern programming | 30 | 12 | Loop bounds and nesting discipline |
| 3 | Arrays & matrix traversal | 34 | 22 | Index discipline, traversal shapes |
| 4 | Strings & character handling | 26 | 15 | Classification, normalisation, counting |
| 5 | Sorting & searching | 22 | 15 | The tools applied everywhere else |

---

## Tech stack

Deliberately minimal — the whole thing is three layers of plain text served as files.

| Layer | Choice | Why |
|-------|--------|-----|
| Markup | **HTML5** | Six static pages, semantic elements, ARIA where it matters |
| Styling | **Vanilla CSS** | One hand-written stylesheet, custom properties for theming |
| Behaviour | **Vanilla ES5-compatible JS** | Runs in any browser, no transpile step |
| Data | **Plain JS objects** | Question bank shipped as script files, not fetched JSON |
| Fonts | **Self-hosted woff2** | Atkinson Hyperlegible, Bricolage Grotesque, JetBrains Mono — no external CDN, no render-blocking third party |
| Hosting | **Vercel** | Static CDN with automatic deploys from `main` |
| Tooling | **Node.js** | Two dependency-free validation scripts |
| Dependencies | **None** | No `package.json`, no `node_modules`, no framework, no lockfile |

There is no build step. What is in the repository is exactly what the browser receives — which is
also exactly what Vercel serves.

---

## System architecture

Three tiers, all static. No server, no API, no database, no authentication.

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. STATIC PAGES                        (6 × .html)       │  │
│  │     index · topics · question · practice · reference ·    │  │
│  │     about                                                 │  │
│  │     Each carries <body data-page="…"> naming its renderer │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │ <script> tags, in order          │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  2. DATA LAYER                          (6 × data/*.js)   │  │
│  │     Each file does `window.DSA = window.DSA || {}` then   │  │
│  │     pushes problems onto DSA.bank[topicId]. Load order     │  │
│  │     is irrelevant — they all merge into one namespace.    │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  3. RENDERER LAYER                        (app.js)        │  │
│  │     IIFE over window.DSA. Reads body[data-page] and      │  │
│  │     dispatches to exactly one init function.              │  │
│  │                                                           │  │
│  │     initIndex · initTopics · initQuestion ·              │  │
│  │     initPractice · initReference                          │  │
│  │                                                           │  │
│  │     URL is the state: location.search ⇄ filter state      │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│         ┌────────────────────┴────────────────────┐             │
│         │                                         │             │
│  ┌──────▼───────────────┐              ┌──────────▼─────────┐  │
│  │ localStorage         │              │ CSS custom props   │  │
│  │ pv.practised → []    │              │ light / dark       │  │
│  │ pv.theme    → str    │              │ data-theme on <html>│  │
│  └──────────────────────┘              └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│  VERCEL EDGE CDN                                                │
│  Serves the files verbatim. No transformation, no SSR, no API. │
└─────────────────────────────────────────────────────────────────┘
```

### How a page actually renders

There is no framework and no virtual DOM. Each page follows the same three steps:

1. **`app.js` reads `document.body[data-page]`** and dispatches to one renderer.
2. **The renderer builds an HTML string** and assigns it to a container's `innerHTML`.
3. **Delegated listeners are bound** to the freshly rendered nodes.

```
<body data-page="bank">
        │
        └─► app.js: page === "bank" ──► D.initTopics()
                                              │
                    ┌─────────────────────────┴────────────────────┐
                    │                                              │
            reads location.search                      builds qList innerHTML
            ?topic=arrays&freq=Very High                   │
                    │                                     └─► D.markNav()
                    └─────────► history.replaceState ◄──────────┘
                              so filters are shareable/bookmarkable
```

### Why the data is script tags, not fetched JSON

The bank ships as `<script src>` files rather than a `fetch()` of a JSON blob. That means the page
renders with **zero network round-trips after the HTML**, works from a cold cache, and keeps working
under `file://` — while still being plain, readable, diffable source.

### State model

There is no server state. Everything lives in three places:

| State | Lives in | Example |
|-------|----------|---------|
| **Navigation / filters** | the URL query string | `topics.html?topic=arrays&freq=Very%20High&sort=difficulty&q=palindrome` |
| **Progress** (what you've practised) | `localStorage["pv.practised"]` | JSON array of problem ids |
| **Theme** | `localStorage["pv.theme"]` | `"light"` or `"dark"` |

Putting filters in the address bar is deliberate: any shortlist becomes a shareable or bookmarkable
URL, and the browser Back button undoes a filter change for free.

### Why `question.html` renders every problem

All 146 questions are served by **one** page, selected by `?id=`. Rather than 146 near-identical
HTML files that would drift apart, the content stays in one data layer and the URL stays shareable.

---

## Features

- **Filterable bank** — combine topic, difficulty, frequency, company, free-text search and sort;
  the result set is encoded in the URL, so any view can be bookmarked or shared.
- **146 problem pages** — statement, input/output example, pattern, technique, numbered algorithm
  steps, edge cases, traps, follow-up variations, related problems and target complexity.
- **Search** — matches problem name, pattern, technique and company, across all topics at once.
- **Drill-sheet generator** — assemble a randomised, printable sheet of problems.
- **Technique index** — a cross-topic index of all 126 techniques, plus round formats and what each
  hiring assessment emphasises.
- **Progress tracking** — mark problems practised; they persist locally and can be hidden.
- **Dark mode** — system-aware toggle, persisted, no flash on reload.
- **Fully responsive** — single-column on phones, full nav on desktop.
- **Accessible** — semantic landmarks, labelled form controls, `aria-current` on the active nav item,
  visible focus states.

---

## Project structure

```
.
├── index.html            home — hero, stats, topic grid, very-high-frequency picks
├── topics.html           filterable question bank
├── question.html         one problem, selected by ?id=
├── practice.html         drill-sheet generator
├── reference.html        technique index, round formats, complexity cheat-sheet
├── about.html            how to use the vault
│
├── assets/
│   ├── css/style.css     entire stylesheet, custom-property theming
│   ├── favicon.svg       inline SVG mark
│   ├── fonts/*.woff2     Atkinson Hyperlegible · Bricolage Grotesque · JetBrains Mono
│   └── js/
│       ├── app.js        all renderers + shared helpers (IIFE over window.DSA)
│       └── data/
│           ├── topics.js     topic metadata, ordering, per-topic stats
│           ├── numbers.js    ┐
│           ├── patterns.js   │
│           ├── arrays.js     ├ the question bank, one file per topic
│           ├── strings.js    │
│           └── sortsearch.js ┘
│
└── tools/
    ├── validate.js       content + cross-reference validation
    ├── smoke.js          headless render check for every page
    └── clean_related.js  one-off repair for dangling related-ids
```

---

## Running locally

The site is plain files, so any static server works. From the repo root:

```bash
python -m http.server 8000
# or
npx serve -l 8000
```

Then open <http://127.0.0.1:8000/index.html>.

> Serving is preferable to opening `index.html` directly: the pages read filter state from
> `location.search`, which behaves inconsistently under `file://`.

---

## Validating

Two dependency-free Node scripts guard the content. No `npm install` — plain Node, nothing else.

```bash
node tools/validate.js   # content + cross-reference checks; exits 1 on any error
node tools/smoke.js      # runs every page renderer headlessly; exits 1 on any error
```

**`validate.js`** loads the six data files in a `vm` sandbox and fails if any problem is missing a
required field, carries an invalid `difficulty`/`freq`, has a duplicate id, or points `related` /
`starterIds` at problems that don't exist. Prints a per-topic table. Optional fields (`io`, `traps`,
`variants`) are warnings, not failures.

**`smoke.js`** stubs just enough DOM to execute all five renderers, then renders **all 146 question
detail pages** and asserts each one actually emitted its title. Catches missing nodes, typos and bad
data access — no browser required.

Run both after editing anything under `assets/js/data/`.

`tools/clean_related.js` is a one-off repair that strips `related` ids pointing at removed problems.
Rarely needed; `validate.js` will tell you when.

---

## Data model

Each topic file appends problems to `window.DSA.bank[topicId]`.

```js
window.DSA = window.DSA || {};   // every file merges into one namespace

window.DSA.bank.numbers = [
  {
    id: "num-prime-check",              // unique across the entire bank
    title: "Prime Number Check",
    difficulty: "Easy",                 // Easy | Medium | Hard
    freq: "Very High",                  // Very High | High | Medium
    companies: ["TCS", "Infosys", "…"], // where the style has been reported

    statement: "…",                     // the problem, cold
    io: "…",                            // input/output example      (optional)
    pattern: "Number logic",            // classification bucket
    technique: "Trial division",        // the idea to reach for
    algo: [                             // numbered steps, ≥ 4 required
      "Start at 2.",
      "…",
    ],
    complexity: "O(√n) time, O(1) space",
    edges:  ["…"],                      // edge cases
    traps:  ["…"],                      // where candidates lose marks
    variants: ["…"],                    // follow-up variations
    related: ["num-…"],                 // cross-links — every id must resolve
  },
];
```

Adding a problem means appending one object to the right topic file. No index to update, no
manifest, no registration step — `validate.js` and `smoke.js` will tell you immediately if it is
malformed or unreachable.

---

## Deployment

Hosted on **Vercel**, deployed from the `main` branch.

- **No build command.** Vercel serves the repository contents verbatim.
- **Output directory:** the repository root (`./`).
- **Framework preset:** none / "Other" — this is not a framework project.
- Adding a commit to `main` triggers a fresh deploy.

```bash
git push origin main      # that's the whole deploy
```

Because there is no build step, there is also no build to break — the deployed files are
byte-identical to the committed files.

---

## Design decisions

- **No answers, no code.** Stated plainly on every page. Reading a finished solution feels productive
  and builds nothing; recalling a solution you already wrote builds everything.
- **No accounts, no tracking, no cookies.** Progress lives in the visitor's own `localStorage`.
  There is nothing to sign into and nothing to leak.
- **Filters live in the URL.** Every view is a link. Back button, bookmark and share all work
  without a line of code.
- **One question page, not 146.** Content stays in the data layer where it is easy to keep correct.
- **Self-hosted fonts.** No third-party request, no privacy leak, no render-blocking CDN.
- **Data as script tags.** Renders with zero fetch round-trips and stays readable in a diff.
- **Hand-written validation instead of a framework.** Two small scripts that run anywhere with a bare
  Node install beat a dependency tree nobody can read.

---

## Legal

Practice Vault is an independent study resource and is not affiliated with, endorsed by, or
associated with any company.

Company names appear **only** to indicate that a question style has been reported there. They imply
no affiliation or endorsement.

Assessment formats change between hiring drives. Always confirm the current pattern, question count
and cut-off on the **official careers page** of the company you are applying to.