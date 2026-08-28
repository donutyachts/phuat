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
- `data/runs.json` — run-level summary stats (one entry per executed pass), drives the dashboard's
  "Run history" section.
- `data/latest-status.json` — latest result per test case ID, drives the dashboard's "Status" column.
- `assets/` — shared CSS/JS for the dashboard.
- `template/report-template.html` — reusable per-run report layout; see comments inside for how
  to start a new run.
- `runs/` — one dated folder per executed test pass, each with its own report page and evidence
  (GIFs/screenshots). See `runs/README.md`.

## Status

Test case library is built and scoped (37 of 96 cases executable against a single Partner
Administrator login). One test run completed so far:

- **2026-08-28** — 44 cases addressed (Teams, Categories, Sub Users, Profiles, Tickets):
  20 pass, 0 fail, 9 partial, 9 cannot verify, 6 N/A. Full detail and evidence in
  [`runs/2026-08-28/index.html`](runs/2026-08-28/index.html). Login used: a single Partner
  Administrator account (BigCorp / A-Team) — cases requiring other roles or a multi-Team
  partner are marked N/A or cannot verify, not failed.

Remaining scope (Administrator/System Administrator and Sub User role logins, multi-Team
partners) still needs additional accounts to exercise.
