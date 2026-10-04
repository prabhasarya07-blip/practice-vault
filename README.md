# Practice Vault

A static study site for fresher coding assessments: 146 problems across five topics, each
with its pattern, technique, numbered algorithm steps, traps, edge cases and target cost.

Deliberately **no answers and no code** — the site stops where the thinking begins, so the
recall stays with you. No build step, no bundler, no dependencies, no accounts.

## Run it locally

The site is plain HTML/CSS/JS, so any static server works. From the repo root:

```bash
python -m http.server 8000
# or
npx serve -l 8000
```

Then open <http://127.0.0.1:8000/index.html>.

> Opening `index.html` directly off the filesystem also works, but serving it is better —
> the pages share relative asset paths and read filter state from `location.search`, which
> behaves inconsistently under `file://`.

## Validate it

Two Node scripts guard the content. They need no `npm install` — plain Node, no dependencies.

```bash
node tools/validate.js   # content + cross-reference checks, exits 1 on any error
node tools/smoke.js      # runs every page renderer against a stub DOM, exits 1 on any error
```

**`validate.js`** loads the six data files in a VM sandbox and fails if a problem is missing a
required field, carries an invalid `difficulty`/`freq`, has duplicate ids, or points `related`
and `starterIds` at problems that do not exist. It prints a per-topic table and exits non-zero
on errors. Missing optional fields (`io`, `traps`, `variants`) are warnings, not failures.

**`smoke.js`** stubs just enough DOM to execute `initIndex`, `initTopics`, `initPractice`,
`initReference` and `initQuestion`, then renders all 146 question detail pages and asserts each
one actually emitted its title. This catches missing nodes, typos and bad data access without a
browser.

Run both after editing anything under `assets/js/data/`.

There is also `tools/clean_related.js`, a one-off repair script that strips `related` ids
pointing at problems that no longer exist. You rarely need it; `validate.js` will tell you when.

## Layout

```
index.html          home
topics.html         filterable question bank
question.html       one problem, driven by ?id=
practice.html       random drill sheet
reference.html      technique index and round formats
about.html          how to use the vault
_m.html             scratch/working page

assets/css/style.css
assets/js/app.js            all page renderers, shared by every page
assets/js/data/topics.js    topic metadata + per-topic stats
assets/js/data/*.js         the question bank, one file per topic
assets/fonts/*.woff2        self-hosted, no external font CDN
tools/                      validate.js, smoke.js, clean_related.js
```

## How the data is shaped

Each topic file adds problems to `window.DSA.bank[<topicId>]`. A problem looks like:

```js
{
  id: "arr-two-sum",        // unique across the whole bank
  title: "Two Sum",
  difficulty: "Easy",       // Easy | Medium | Hard
  freq: "Very High",        // Very High | High | Medium
  companies: ["TCS", "Infosys"],
  statement: "…",
  io: "…",                  // input/output example (optional, warned on)
  pattern: "Hashing",
  technique: "Frequency map",
  algo: ["step 1", "step 2", "…"],   // at least 4
  complexity: "O(n) time, O(n) space",
  edges: ["…"],
  traps: ["…"],
  variants: ["…"],
  related: ["arr-sum"]                // cross-links, all ids must resolve
}
```

## Topics

Number programs (34) · Pattern programming (30) · Arrays & matrix (34) ·
Strings (26) · Sorting & searching (22) — sequenced so each builds on the last.

## License / attribution

Company names appear only to indicate where a question style has been reported; they imply no
affiliation or endorsement. Assessment formats change between hiring drives — confirm details
on the official careers page of any company you are applying to.