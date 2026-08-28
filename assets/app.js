const TYPES = {
  functional: {
    label: "Functional",
    source: "data/test-cases.json",
    hasHeuristic: false,
  },
  usability: {
    label: "Usability",
    source: "data/usability-cases.json",
    hasHeuristic: true,
  },
};

const state = {
  activeType: "functional",
  data: {},
  latestStatus: {},
};

async function loadJson(path, fallback) {
  try {
    const res = await fetch(path);
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    return fallback;
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

function typeBadge(type) {
  const cls = type === "usability" ? "type-usability" : "type-functional";
  const label = TYPES[type]?.label ?? type;
  return `<span class="badge type-badge ${cls}">${label}</span>`;
}

function executableBadge(value) {
  const v = (value || "").trim();
  if (v.startsWith("Yes")) return badge("Executable", "pass");
  if (v.startsWith("Partial")) return badge("Partial", "partial");
  if (v.startsWith("No")) return badge("Not executable", "fail");
  return badge("N/A", "na");
}

function statusBadge(id) {
  const entry = state.latestStatus[id];
  if (!entry) return badge("Not yet run", "pending");
  return badge(entry.label, entry.result);
}

function renderStats(runs) {
  const grid = document.getElementById("stat-grid");
  grid.innerHTML = "";
  const functional = state.data.functional || [];
  const usability = state.data.usability || [];
  const modules = new Set([...functional, ...usability].map((c) => c.Module)).size;

  grid.append(
    statCard(functional.length, "Functional checks"),
    statCard(usability.length, "Usability checks"),
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
        <div>${typeBadge(r.type || "functional")} <a href="${r.path}">${r.date}</a> &middot; ${r.executed} addressed</div>
        ${counts}
      </li>`;
    })
    .join("");

  section.innerHTML = `<ul class="run-history-list">${items}</ul>`;
}

function currentCases() {
  return state.data[state.activeType] || [];
}

function renderTabs() {
  document.querySelectorAll("#check-tabs .tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === state.activeType);
  });
  document.getElementById("tab-count-functional").textContent = `(${(state.data.functional || []).length})`;
  document.getElementById("tab-count-usability").textContent = `(${(state.data.usability || []).length})`;
  document.getElementById("filter-heuristic-wrap").classList.toggle("hidden", !TYPES[state.activeType].hasHeuristic);
  document.getElementById("library-subtitle").textContent =
    state.activeType === "usability" ? "Usability library — Nielsen heuristics + WCAG 2.1 AA" : "Functional test case library";
}

function renderFilterOptions() {
  const cases = currentCases();

  const moduleSel = document.getElementById("filter-module");
  const currentModule = moduleSel.value;
  moduleSel.innerHTML = `<option value="">All modules</option>`;
  [...new Set(cases.map((c) => c.Module))].forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    moduleSel.appendChild(opt);
  });
  if ([...moduleSel.options].some((o) => o.value === currentModule)) moduleSel.value = currentModule;

  const heuristicSel = document.getElementById("filter-heuristic");
  heuristicSel.innerHTML = `<option value="">All heuristics</option>`;
  if (TYPES[state.activeType].hasHeuristic) {
    [...new Set(cases.map((c) => c.Heuristic))].forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      heuristicSel.appendChild(opt);
    });
  }
}

function matchesFilters(c) {
  const module = document.getElementById("filter-module").value;
  const heuristic = document.getElementById("filter-heuristic").value;
  const scope = document.getElementById("filter-scope").value;
  const exec = document.getElementById("filter-exec").value;
  const search = document.getElementById("filter-search").value.trim().toLowerCase();

  if (module && c.Module !== module) return false;
  if (TYPES[state.activeType].hasHeuristic && heuristic && c.Heuristic !== heuristic) return false;
  if (scope && c["In Scope (Current Run)"] !== scope) return false;
  if (exec && !(c["Executable (Partner Admin Login)"] || "").startsWith(exec)) return false;
  if (search) {
    const hay = `${c.ID} ${c["Feature/Action"]}`.toLowerCase();
    if (!hay.includes(search)) return false;
  }
  return true;
}

function renderTableHead() {
  const thead = document.getElementById("case-head");
  const heuristicCol = TYPES[state.activeType].hasHeuristic ? "<th>Heuristic</th>" : "";
  thead.innerHTML = `<tr>
    <th>ID</th>
    <th>Module</th>
    ${heuristicCol}
    <th>Feature / Action</th>
    <th>Required Role</th>
    <th>Executable</th>
    <th>Status</th>
  </tr>`;
}

function renderTable() {
  const cases = currentCases();
  const tbody = document.getElementById("case-body");
  tbody.innerHTML = "";
  const filtered = cases.filter(matchesFilters);
  document.getElementById("case-count").textContent = `${filtered.length} of ${cases.length} checks`;

  const hasHeuristic = TYPES[state.activeType].hasHeuristic;
  for (const c of filtered) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="id-cell">${c.ID}</td>
      <td>${c.Module}</td>
      ${hasHeuristic ? `<td>${c.Heuristic}</td>` : ""}
      <td>${c["Feature/Action"]}</td>
      <td>${c["Required Role"]}</td>
      <td>${executableBadge(c["Executable (Partner Admin Login)"])}</td>
      <td>${statusBadge(c.ID)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderLibrary() {
  renderTabs();
  renderFilterOptions();
  renderTableHead();
  renderTable();
}

function setActiveType(type) {
  state.activeType = type;
  renderLibrary();
}

async function init() {
  const [functional, usability, runs, latestStatus] = await Promise.all([
    loadJson("data/test-cases.json", []),
    loadJson("data/usability-cases.json", []),
    loadJson("data/runs.json", []),
    loadJson("data/latest-status.json", {}),
  ]);

  state.data.functional = functional;
  state.data.usability = usability;
  state.latestStatus = latestStatus;

  renderStats(runs);
  renderRunHistory(runs);
  renderLibrary();

  document.querySelectorAll("#check-tabs .tab").forEach((btn) => {
    btn.addEventListener("click", () => setActiveType(btn.dataset.type));
  });

  ["filter-module", "filter-heuristic", "filter-scope", "filter-exec", "filter-search"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderTable);
  });
}

init();
