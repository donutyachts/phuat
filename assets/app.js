async function loadTestCases() {
  const res = await fetch("data/test-cases.json");
  return res.json();
}

async function loadRuns() {
  try {
    const res = await fetch("data/runs.json");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function loadLatestStatus() {
  try {
    const res = await fetch("data/latest-status.json");
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

function statCard(value, label) {
  const el = document.createElement("div");
  el.className = "stat-card";
  el.innerHTML = `<div class="value">${value}</div><div class="label">${label}</div>`;
  return el;
}

function badge(text, cls) {
  return `<span class="badge ${cls}">${text}</span>`;
}

function executableBadge(value) {
  const v = (value || "").trim();
  if (v.startsWith("Yes")) return badge("Executable", "pass");
  if (v.startsWith("Partial")) return badge("Partial", "partial");
  if (v.startsWith("No")) return badge("Not executable", "fail");
  return badge("N/A", "na");
}

function statusBadge(latestStatus, id) {
  const entry = latestStatus[id];
  if (!entry) return badge("Not yet run", "pending");
  return badge(entry.label, entry.result);
}

function renderStats(cases, runs) {
  const grid = document.getElementById("stat-grid");
  const total = cases.length;
  const inScope = cases.filter((c) => c["In Scope (Current Run)"] === "Yes").length;
  const execYes = cases.filter((c) => c["Executable (Partner Admin Login)"] === "Yes").length;
  const execPartial = cases.filter((c) => c["Executable (Partner Admin Login)"] === "Partial").length;
  const modules = new Set(cases.map((c) => c.Module)).size;

  grid.append(
    statCard(total, "Total test cases"),
    statCard(inScope, "In scope this run"),
    statCard(execYes + execPartial, "Executable this run"),
    statCard(modules, "Modules covered"),
    statCard(runs.length, "Runs completed")
  );
}

function renderRunHistory(runs) {
  const section = document.getElementById("run-history");
  if (!runs.length) {
    section.innerHTML = `<div class="empty-state">
      No runs completed yet. Once a test pass is executed, each run will get its own dated page
      linked here, and this section will show a test case &times; run-date matrix so regressions
      (passed last time, fails now) are visible at a glance.
    </div>`;
    return;
  }

  const items = runs
    .slice()
    .reverse()
    .map((r) => {
      const counts = `
        <span class="run-counts">
          ${badge(`${r.pass} pass`, "pass")}
          ${r.partial ? badge(`${r.partial} partial`, "partial") : ""}
          ${r.fail ? badge(`${r.fail} fail`, "fail") : ""}
          ${r.cannot_verify ? badge(`${r.cannot_verify} cannot verify`, "cannot-verify") : ""}
          ${r.na ? badge(`${r.na} n/a`, "na") : ""}
        </span>`;
      return `<li>
        <div><a href="${r.path}">${r.date}</a> &middot; ${r.executed} addressed</div>
        ${counts}
      </li>`;
    })
    .join("");

  section.innerHTML = `<ul class="run-history-list">${items}</ul>`;
}

function renderFilters(cases) {
  const moduleSel = document.getElementById("filter-module");
  const modules = [...new Set(cases.map((c) => c.Module))];
  modules.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    moduleSel.appendChild(opt);
  });
}

function matchesFilters(c) {
  const module = document.getElementById("filter-module").value;
  const scope = document.getElementById("filter-scope").value;
  const exec = document.getElementById("filter-exec").value;
  const search = document.getElementById("filter-search").value.trim().toLowerCase();

  if (module && c.Module !== module) return false;
  if (scope && c["In Scope (Current Run)"] !== scope) return false;
  if (exec && !(c["Executable (Partner Admin Login)"] || "").startsWith(exec)) return false;
  if (search) {
    const hay = `${c.ID} ${c["Feature/Action"]}`.toLowerCase();
    if (!hay.includes(search)) return false;
  }
  return true;
}

function renderTable(cases, latestStatus) {
  const tbody = document.getElementById("case-body");
  tbody.innerHTML = "";
  const filtered = cases.filter(matchesFilters);
  document.getElementById("case-count").textContent = `${filtered.length} of ${cases.length} test cases`;

  for (const c of filtered) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="id-cell">${c.ID}</td>
      <td>${c.Module}</td>
      <td>${c["Feature/Action"]}</td>
      <td>${c["Required Role"]}</td>
      <td>${executableBadge(c["Executable (Partner Admin Login)"])}</td>
      <td>${statusBadge(latestStatus, c.ID)}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function init() {
  const [cases, runs, latestStatus] = await Promise.all([
    loadTestCases(),
    loadRuns(),
    loadLatestStatus(),
  ]);

  renderStats(cases, runs);
  renderRunHistory(runs);
  renderFilters(cases);
  renderTable(cases, latestStatus);

  ["filter-module", "filter-scope", "filter-exec", "filter-search"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => renderTable(cases, latestStatus));
  });
}

init();
