# Partner Hub QA

Test tracking site for Partner Hub, covering two check types:

- **Functional** — spec-based functional/UI testing. Not a security audit — see `HANDOFF.md`
  context (not committed here) for full background.
- **Usability** — heuristic evaluation against [Nielsen's 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
  plus WCAG 2.1 AA, scoped to the modules already exercised functionally (Teams, Sub Users,
  Categories, Profiles, Tickets).

Deployed as a plain static site (no build step) via Cloudflare Pages.

## Structure

- `index.html` — dashboard: summary stats, unified run history (both check types), and a
  filterable test case library with a Functional / Usability tab switch.
- `data/test-cases.csv` — functional test case library (96 cases, 11 modules).
- `data/usability-cases.csv` — usability check library (28 checks: global/cross-cutting,
  accessibility/WCAG, and per-module heuristic checks).
- Edit either CSV, then regenerate both JSON files the site consumes:
  ```
  node scripts/build-data.mjs
  ```
- `data/test-cases.json` / `data/usability-cases.json` — generated from the CSVs above, do not
  hand-edit.
- `data/runs.json` — one entry per executed pass (either type, tagged `"type"`), drives the
  dashboard's "Run history" section.
- `data/latest-status.json` — latest result per check ID (functional and usability IDs share
  this file — prefixes don't collide), drives the dashboard's "Status" column.
- `assets/` — shared CSS/JS for the dashboard.
- `template/report-template.html` — reusable per-run report layout, usable for either check
  type; see comments inside for how to start a new run.
- `runs/` — one dated folder per executed test pass, each with its own report page and evidence
  (GIFs/screenshots). See `runs/README.md`.

## Status

- **Functional**: 37 of 96 cases executable against a single Partner Administrator login. One
  run completed — **2026-08-28**, 44 cases addressed (Teams, Categories, Sub Users, Profiles,
  Tickets): 20 pass, 0 fail, 9 partial, 9 cannot verify, 6 N/A. Full detail and evidence in
  [`runs/2026-08-28/index.html`](runs/2026-08-28/index.html). Login used: a single Partner
  Administrator account (BigCorp / A-Team) — cases requiring other roles or a multi-Team partner
  are marked N/A or cannot verify, not failed. Remaining scope (Administrator/System
  Administrator and Sub User role logins, multi-Team partners) still needs additional accounts.
- **Usability**: 28 checks defined. One run completed — **2026-08-28**, all 28 checks addressed (Global/cross-cutting, Accessibility/WCAG, Teams, Sub Users, Categories, Profiles, Tickets): 16 pass, 3 fail, 5 partial, 4 cannot verify, 0 N/A. Full detail and evidence in [`runs/2026-08-28-usability/index.html`](runs/2026-08-28-usability/index.html). Same single Partner Administrator login (BigCorp / A-Team) as the functional run, so checks needing a second role, a multi-Team partner, or a support-agent reply are marked cannot verify, not failed. Notable findings: a keyboard-only user cannot enter a ticket Description via Tab navigation (UX-A11Y-01); read-only Team fields give no indication they're locked (UX-TEAM-02); an in-progress ticket reply can be silently lost with no warning and no draft recovery (UX-TICK-02).
