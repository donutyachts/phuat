# Runs

One folder per test pass, named by date (`YYYY-MM-DD/`, or `YYYY-MM-DD-usability/` if a functional
and a usability run land on the same date), each containing:

- `index.html` — cloned from `../../template/report-template.html`, one evidence card per executed
  test case. Set the `type-functional` / `type-usability` badge in the page's `<h1>` to match.
- `evidence/` — GIF (required) and optional screenshot per test case, named by test case ID
  (e.g. `SUBU-01.gif`, `UX-TICK-01.gif`).

After publishing a run:
1. Add an entry to `../data/runs.json` (include `"type": "functional"` or `"usability"`).
2. Add each executed test case's outcome to `../data/latest-status.json`, keyed by ID.

Both files drive the dashboard's stats, run history, and per-check "Status" column at
`../index.html` — no HTML changes needed there.
