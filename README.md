# Partner Hub QA

Spec-based functional test tracking site for Partner Hub. This is functional/UI testing,
not a security audit — see `HANDOFF.md` context (not committed here) for full background.

Deployed as a plain static site (no build step) via Cloudflare Pages.

## Structure

- `index.html` — dashboard: summary stats, run history, filterable test case library.
- `data/test-cases.csv` — source of truth test case library (96 cases, 11 modules). Edit this,
  then regenerate the JSON consumed by the site:
  ```
  node scripts/build-data.mjs
  ```
- `data/test-cases.json` — generated from the CSV, do not hand-edit.
- `assets/` — shared CSS/JS for the dashboard.
- `template/report-template.html` — reusable per-run report layout; see comments inside for how
  to start a new run.
- `runs/` — one dated folder per executed test pass, each with its own report page and evidence
  (GIFs/screenshots). See `runs/README.md`.

## Status

Test case library is built and scoped (37 of 96 cases executable this run against a single
Partner Administrator login). No test runs have been executed yet — that requires an active,
manually-authenticated Partner Hub session (magic-link auth), which happens outside this repo.
