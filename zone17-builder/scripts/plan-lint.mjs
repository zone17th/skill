#!/usr/bin/env node
// plan-lint: mechanical checks for a zone17-builder plan.
// Reads the pipeline table and the task sections of one Markdown plan and
// reports what a script can prove wrong. It does not judge whether tasks are
// well cut or an impact list is complete; that is the reviewer's job.
// No dependencies. Exit 0 = no errors, 1 = errors found, 2 = usage or read error.

import fs from "node:fs";

const COLUMNS = {
  task: ["task", "id", "task id", "mã", "mã task"],
  hard: ["hard deps", "hard dependencies", "depends on", "dependencies", "phụ thuộc cứng", "phụ thuộc"],
  soft: ["soft deps", "soft dependencies", "phụ thuộc mềm"],
  wave: ["wave", "sóng"],
  weight: ["weight", "points", "trọng số", "điểm"],
  risk: ["risk", "risk tier", "rủi ro", "mức rủi ro"],
  status: ["status", "state", "trạng thái"],
};
const DONE = ["done", "merged", "accepted", "xong", "đã xong", "đã merge", "hoàn thành"];

const FIELDS = {
  spec: ["spec", "đặc tả"],
  deliverables: ["deliverables", "sản phẩm"],
  paths: ["owned paths", "phạm vi sửa", "đường dẫn sở hữu"],
  acceptance: ["acceptance", "nghiệm thu", "tiêu chí chấp nhận"],
  impact: ["impact outside the task", "impact", "ảnh hưởng ngoài task", "ảnh hưởng"],
  tests: ["test plan", "tests", "kiểm thử", "kế hoạch kiểm thử"],
};
const OPTIONAL_FIELDS = {
  owner: ["lane owner", "lane role", "chủ lane", "vai trò lane"],
  shape: ["domain shape", "data shape", "domain / data shape", "cấu trúc dữ liệu", "mô hình miền"],
  out: ["out of scope", "ngoài phạm vi"],
  design: ["design / references", "design", "references", "thiết kế", "tham chiếu"],
};

const RISK = {
  standard: ["standard", "normal", "thường", "bình thường", "chuẩn"],
  high: ["high", "cao"],
};
const LANE_OWNERS = ["advisor", "lead"];
const TOTAL_LABELS = ["total weight", "tổng trọng số", "tổng điểm"];
const GATE_HEADERS = ["gate", "gate id", "cổng", "cổng chặn"];
const NONE_WORDS = ["none", "no impact", "không có", "không"];
const EMPTY_CELL = new Set(["", "-", "—", "–", "none", "không", "n/a"]);

function help() {
  const list = (o) => Object.entries(o).map(([k, v]) => `    ${k.padEnd(13)} ${v.join(" | ")}`).join("\n");
  return `Usage: node plan-lint.mjs <plan.md> [--json] [--strict] [--labels <file.json>]

Checks
  - the pipeline table exists and has Task, Hard deps, Wave, Weight and Risk columns
  - task IDs are unique; dependencies exist (a task, or a gate ID from a table
    whose first column header is "Gate") and are not circular
  - Wave = 1 without hard dependencies, else 1 + the latest wave among them
  - weights are positive and add up to the declared "Total weight: N", when declared
  - every task in the table has a section whose heading starts with its ID
  - every section has the required fields, none of them empty
  - non-QA tasks declare a Domain shape (warning when omitted; error with --strict)
  - optional Lane owner field starts with "advisor" or "lead"
  - every AC-n under Acceptance appears in the Test plan
  - every impact row names a check ("→ check"), or "none" explains what was searched
  - one closing task in the last wave depends on every other task (warning)
  - a task whose optional Status column says done (${DONE.join(", ")}) keeps
    its table checks and skips the section checks: it was merged before adoption

Options
  --json     print the result as JSON
  --strict   treat warnings as errors
  --labels   JSON file adding aliases: {"columns": {"wave": ["..."]}, "fields": {"impact": ["..."]}}

Accepted column headers (case-insensitive)
${list(COLUMNS)}

Required task fields, written as a bold label at the start of a line, e.g. **Test plan:**
${list(FIELDS)}

Optional task fields
${list(OPTIONAL_FIELDS)}

Risk values
${list(RISK)}

Exit codes: 0 no errors, 1 errors found, 2 usage or read error.`;
}

// ---------------------------------------------------------------- arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { console.log(help()); process.exit(0); }
const asJson = args.includes("--json");
const strict = args.includes("--strict");
let labelsFile = null;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--labels") { labelsFile = args[++i]; continue; }
  if (args[i].startsWith("--")) continue;
  files.push(args[i]);
}
if (files.length !== 1) { console.error(help()); process.exit(2); }

if (labelsFile) {
  try {
    const extra = JSON.parse(fs.readFileSync(labelsFile, "utf8").replace(/^\uFEFF/, ""));
    for (const [k, v] of Object.entries(extra.columns ?? {})) if (COLUMNS[k]) COLUMNS[k].push(...v.map(norm));
    for (const [k, v] of Object.entries(extra.fields ?? {})) {
      if (FIELDS[k]) FIELDS[k].push(...v.map(norm));
      else if (OPTIONAL_FIELDS[k]) OPTIONAL_FIELDS[k].push(...v.map(norm));
    }
  } catch (e) { console.error(`plan-lint: cannot read labels file: ${e.message}`); process.exit(2); }
}

let text;
try { text = fs.readFileSync(files[0], "utf8").replace(/^\uFEFF/, ""); }
catch (e) { console.error(`plan-lint: cannot read ${files[0]}: ${e.message}`); process.exit(2); }

// ------------------------------------------------------------------ helpers
function norm(s) {
  return String(s).normalize("NFC").replace(/[*`_]/g, "").replace(/\s+/g, " ").trim().replace(/[:：]$/, "").trim().toLowerCase();
}
function clean(s) { return String(s).replace(/[*`]/g, "").trim(); }
function cells(line) {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map((c) => c.trim());
}
const isRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l) => isRow(l) && cells(l).every((c) => /^:?-{2,}:?$/.test(c));
function keyOf(table, label) {
  const n = norm(label);
  for (const [k, aliases] of Object.entries(table)) if (aliases.includes(n)) return k;
  return null;
}
function ids(cell) {
  const t = clean(cell).replace(/\([^)]*\)/g, " ");
  if (EMPTY_CELL.has(t.trim().toLowerCase())) return [];
  return t.split(/[,;\s]+/).map((x) => x.trim()).filter((x) => x && !EMPTY_CELL.has(x.toLowerCase()));
}
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const lines = text.replace(/\r\n/g, "\n").split("\n");
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push({ where, msg });
const warn = (where, msg) => warnings.push({ where, msg });

const fenced = new Array(lines.length).fill(false);
{
  let open = null;
  lines.forEach((l, i) => {
    const m = /^ {0,3}(`{3,}|~{3,})/.exec(l);
    if (open) {
      fenced[i] = true;
      if (m && m[1][0] === open.ch && m[1].length >= open.len) open = null;
    } else if (m) {
      fenced[i] = true;
      open = { ch: m[1][0], len: m[1].length };
    }
  });
}

// ------------------------------------------------------------ pipeline table
let table = null;
for (let i = 0; i < lines.length - 1 && !table; i++) {
  if (fenced[i] || !isRow(lines[i]) || !isSeparator(lines[i + 1])) continue;
  const header = cells(lines[i]);
  const map = {};
  header.forEach((h, idx) => { const k = keyOf(COLUMNS, h); if (k && !(k in map)) map[k] = idx; });
  if (!("task" in map) || !("wave" in map)) continue;
  const rows = [];
  let j = i + 2;
  for (; j < lines.length && isRow(lines[j]); j++) rows.push({ line: j + 1, c: cells(lines[j]) });
  table = { line: i + 1, end: j, map, rows };
}

const tasks = new Map();
if (!table) {
  err("pipeline", "no pipeline table found: need a table with at least Task and Wave columns (see --help for accepted headers)");
} else {
  for (const col of ["hard", "weight", "risk"]) {
    if (!(col in table.map)) err(`pipeline, line ${table.line}`, `the table has no "${COLUMNS[col][0]}" column`);
  }
  const get = (row, col) => (col in table.map ? row.c[table.map[col]] ?? "" : "");
  for (const row of table.rows) {
    const id = clean(get(row, "task"));
    if (!id) continue;
    if (tasks.has(id)) { err(id, `listed twice in the pipeline table (lines ${tasks.get(id).line} and ${row.line})`); continue; }
    const waveRaw = clean(get(row, "wave"));
    const weightRaw = clean(get(row, "weight")).replace(",", ".");
    const riskRaw = norm(get(row, "risk"));
    const risk = Object.keys(RISK).find((k) => RISK[k].includes(riskRaw)) ?? null;
    const t = {
      id, line: row.line,
      hard: ids(get(row, "hard")), soft: ids(get(row, "soft")),
      wave: /^\d+$/.test(waveRaw) ? Number(waveRaw) : null,
      weight: weightRaw !== "" && !Number.isNaN(Number(weightRaw)) ? Number(weightRaw) : null,
      risk,
      done: DONE.includes(norm(get(row, "status"))),
    };
    if (t.wave === null || t.wave < 1) err(id, `wave "${waveRaw}" is not a whole number from 1`);
    if ("weight" in table.map && (t.weight === null || t.weight <= 0)) err(id, `weight "${weightRaw}" is not a positive number`);
    if ("risk" in table.map && !risk) err(id, `risk "${clean(get(row, "risk"))}" is not one of: ${Object.keys(RISK).join(", ")}`);
    tasks.set(id, t);
  }
  if (tasks.size === 0) err("pipeline", "the pipeline table has no task rows");
}

// -------------------------------------------------------------------- gates
const gates = new Set();
for (let i = 0; i < lines.length - 1; i++) {
  if (fenced[i] || !isRow(lines[i]) || !isSeparator(lines[i + 1])) continue;
  if (!GATE_HEADERS.includes(norm(cells(lines[i])[0]))) continue;
  for (let j = i + 2; j < lines.length && isRow(lines[j]); j++) {
    const id = clean(cells(lines[j])[0]).split(/\s+/)[0];
    if (id) gates.add(id);
  }
}

// ------------------------------------------------------------- dependencies
for (const t of tasks.values()) {
  for (const kind of ["hard", "soft"]) {
    for (const d of t[kind]) {
      if (d === t.id) err(t.id, `depends on itself (${kind})`);
      else if (!tasks.has(d) && !gates.has(d)) err(t.id, `${kind} dependency "${d}" is neither a task in the pipeline table nor a gate in a Gate table`);
    }
  }
  const both = t.hard.filter((d) => t.soft.includes(d));
  if (both.length) warn(t.id, `listed as both hard and soft dependency: ${both.join(", ")}`);
}

let cyclic = false;
{
  const state = new Map();
  const stack = [];
  const visit = (id) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      const loop = stack.slice(stack.indexOf(id)).concat(id);
      err(id, `circular hard dependency: ${loop.join(" → ")}`);
      cyclic = true;
      return;
    }
    state.set(id, 1); stack.push(id);
    for (const d of tasks.get(id).hard) if (tasks.has(d) && d !== id) visit(d);
    stack.pop(); state.set(id, 2);
  };
  for (const id of tasks.keys()) visit(id);
}

let criticalPath = [];
const waveSizes = {};
const closingIds = new Set();
if (!cyclic) {
  for (const t of tasks.values()) {
    if (t.wave === null) continue;
    waveSizes[t.wave] = (waveSizes[t.wave] ?? 0) + 1;
    const depWaves = t.hard.filter((d) => tasks.has(d) && d !== t.id).map((d) => tasks.get(d).wave).filter((w) => w !== null);
    const expected = depWaves.length ? Math.max(...depWaves) + 1 : 1;
    if (t.wave < expected) err(t.id, `wave ${t.wave} is earlier than its hard dependencies allow (expected ${expected})`);
    else if (t.wave > expected) warn(t.id, `wave ${t.wave} is later than its hard dependencies require (${expected}); say why, or move it`);
    for (const d of t.soft) {
      const s = tasks.get(d);
      if (s && s.wave !== null && s.wave > t.wave) warn(t.id, `soft dependency ${d} is in a later wave (${s.wave}); the task cannot be submitted until then`);
    }
  }
  const memo = new Map();
  const longest = (id) => {
    if (memo.has(id)) return memo.get(id);
    let best = { len: 0, weight: 0, path: [] };
    for (const d of tasks.get(id).hard) {
      if (!tasks.has(d) || d === id) continue;
      const c = longest(d);
      if (c.len > best.len || (c.len === best.len && c.weight > best.weight)) best = c;
    }
    const r = { len: best.len + 1, weight: best.weight + (tasks.get(id).weight ?? 0), path: [...best.path, id] };
    memo.set(id, r);
    return r;
  };
  let top = { len: 0, weight: 0, path: [] };
  for (const id of tasks.keys()) {
    const c = longest(id);
    if (c.len > top.len || (c.len === top.len && c.weight > top.weight)) top = c;
  }
  criticalPath = top.path;

  if (tasks.size > 1) {
    const lastWave = Math.max(0, ...[...tasks.values()].map((t) => t.wave ?? 0));
    const reach = (id, seen = new Set()) => {
      for (const d of tasks.get(id).hard) if (tasks.has(d) && !seen.has(d)) { seen.add(d); reach(d, seen); }
      return seen;
    };
    const closing = [...tasks.values()].filter((t) => t.wave === lastWave && reach(t.id).size === tasks.size - 1);
    closing.forEach((c) => closingIds.add(c.id));
    if (closing.length === 0) warn("pipeline", "no closing task in the last wave depends on every other task; a plan ends with one QA task");
  }
}

// ------------------------------------------------------------------ weights
const totalWeight = [...tasks.values()].reduce((s, t) => s + (t.weight ?? 0), 0);
let declaredTotal = null;
for (let i = 0; i < lines.length && declaredTotal === null; i++) {
  if (fenced[i]) continue;
  const m = /^\s*(?:[-*>]\s+)?(.+?)\s*[:：]\s*\**\s*(\d+(?:[.,]\d+)?)\b/.exec(lines[i].replace(/\*\*/g, ""));
  if (m && TOTAL_LABELS.includes(norm(m[1]))) declaredTotal = Number(m[2].replace(",", "."));
}
if (declaredTotal !== null && Math.abs(declaredTotal - totalWeight) > 1e-9) {
  err("pipeline", `weights add up to ${totalWeight}, but the plan declares a total of ${declaredTotal}`);
}
if (declaredTotal === null && tasks.size) warn("pipeline", `no declared total ("Total weight: N"); the weights add up to ${totalWeight}`);

// ------------------------------------------------------------ task sections
const headings = [];
lines.forEach((l, i) => {
  if (fenced[i]) return;
  const m = /^(#{1,6})\s+(\S.*)$/.exec(l);
  if (m) headings.push({ line: i, level: m[1].length, text: clean(m[2]) });
});
const ALL_FIELDS = { ...FIELDS, ...OPTIONAL_FIELDS };
const fieldLabel = (line) => {
  const m = /^\s*(?:[-*]\s+)?\*\*(.+?)\*\*\s*[:：]?\s*(.*)$/.exec(line);
  if (!m) return null;
  const key = keyOf(ALL_FIELDS, m[1]);
  return key ? { key, rest: m[2] } : null;
};

for (const t of tasks.values()) {
  if (t.done) continue;
  const re = new RegExp(`^${escRe(t.id)}(?![A-Za-z0-9_])(?![.\\-][A-Za-z0-9])`);
  const matches = headings.filter((h) => re.test(h.text));
  const after = table ? matches.filter((h) => h.line >= table.end) : matches;
  const head = (after.length ? after : matches)[0];
  if (!head) { err(t.id, `no section found: need a heading that starts with "${t.id}"`); continue; }
  if ((after.length ? after : matches).length > 1) warn(t.id, `more than one heading starts with "${t.id}"; using line ${head.line + 1}`);
  const next = headings.find((h) => h.line > head.line && h.level <= head.level);
  const body = lines.slice(head.line + 1, next ? next.line : lines.length);
  const bodyFenced = fenced.slice(head.line + 1, next ? next.line : lines.length);

  const fields = {};
  let current = null;
  body.forEach((l, i) => {
    const f = bodyFenced[i] ? null : fieldLabel(l);
    if (f) { current = f.key; fields[current] = fields[current] ?? []; if (f.rest.trim()) fields[current].push(f.rest); return; }
    if (current) fields[current].push(l);
  });
  const textOf = (k) => (fields[k] ?? []).join("\n").trim();
  const placeholder = (s) => /^<[^>]*>$/.test(s.trim());

  for (const k of Object.keys(FIELDS)) {
    if (!(k in fields)) err(t.id, `missing field "${FIELDS[k][0]}"`);
    else if (!textOf(k) || placeholder(textOf(k))) err(t.id, `field "${FIELDS[k][0]}" is empty`);
  }

  // Domain shape check on non-QA tasks.
  const isQaTask = closingIds.has(t.id) || /^(qa|final[-_ ]?qa)\b/i.test(t.id);
  if (!isQaTask && (!textOf("shape") || placeholder(textOf("shape")))) {
    warn(t.id, 'missing "Domain shape" field; state core types, state machine or boundary signature before coding');
  }

  // Optional Lane owner validation ("advisor" or "lead").
  if (textOf("owner") && !placeholder(textOf("owner"))) {
    const ownerWord = norm(textOf("owner")).split(/[\s,;:(\-]/)[0];
    if (ownerWord && !EMPTY_CELL.has(ownerWord) && !LANE_OWNERS.includes(ownerWord)) {
      err(t.id, `Lane owner "${textOf("owner").split("\n")[0]}" must start with "advisor" (coordinate-only) or "lead" (hands-on + coordinate)`);
    }
  }

  // Acceptance criteria and their tests.
  const acIn = (s) => [...new Set((s.match(/\bAC-\d+[a-z]?\b/g) ?? []))];
  if (textOf("acceptance")) {
    const acs = acIn(textOf("acceptance"));
    if (acs.length === 0) err(t.id, "Acceptance has no criterion IDs (AC-1, AC-2, …)");
    if (textOf("tests")) {
      const tested = acIn(textOf("tests"));
      const missing = acs.filter((a) => !tested.includes(a));
      if (missing.length) err(t.id, `no test in the Test plan for: ${missing.join(", ")}`);
      const unknown = tested.filter((a) => !acs.includes(a));
      if (unknown.length) warn(t.id, `the Test plan names criteria that Acceptance does not define: ${unknown.join(", ")}`);
    }
  }

  // Impact rows.
  const impact = textOf("impact");
  if (impact && !placeholder(impact)) {
    const flat = impact.replace(/^\s*[-*]\s+/, "");
    const noneWord = NONE_WORDS.find((w) => new RegExp(`^${escRe(w)}(?![\\p{L}\\p{N}])`, "iu").test(flat));
    if (noneWord) {
      if (flat.slice(noneWord.length).replace(/[\s:.,;—–-]/g, "").length < 20) {
        err(t.id, 'Impact says "none" without saying what was searched and where');
      }
    } else {
      const impactLines = fields.impact;
      const bullets = impactLines.filter((l) => /^ {0,3}[-*]\s+\S/.test(l));
      const rows = impactLines.filter((l) => isRow(l) && !isSeparator(l));
      const hasCheck = (l) => /→|->|=>/.test(l);
      if (bullets.length === 0 && rows.length < 2) {
        err(t.id, "Impact has no rows: write one bullet per affected thing, \"- what (where) → check\"");
      }
      bullets.forEach((b) => {
        if (!hasCheck(b)) err(t.id, `impact row without a check ("→ check"): ${b.trim().slice(0, 70)}`);
      });
      rows.slice(1).forEach((r) => {
        if (cells(r).filter((c) => c && !EMPTY_CELL.has(c.toLowerCase())).length < 3) {
          err(t.id, `impact table row needs what, where and check: ${r.trim().slice(0, 70)}`);
        }
      });
    }
  }

  if (t.risk === "high" && textOf("tests") && !/red[- ]first|đỏ trước/i.test(textOf("tests"))) {
    warn(t.id, "high-risk task without a red-first mark in its Test plan");
  }
}

// ------------------------------------------------------------------- output
const failed = errors.length > 0 || (strict && warnings.length > 0);
const summary = {
  file: files[0],
  tasks: tasks.size,
  waves: Object.keys(waveSizes).length,
  wave_sizes: waveSizes,
  total_weight: totalWeight,
  declared_total: declaredTotal,
  critical_path: criticalPath,
  errors, warnings,
  ok: !failed,
};

if (asJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`plan-lint: ${files[0]}`);
  console.log(`tasks ${summary.tasks} · waves ${summary.waves} · total weight ${totalWeight}${declaredTotal !== null ? ` (declared ${declaredTotal})` : ""}`);
  if (criticalPath.length) console.log(`critical path (${criticalPath.length}): ${criticalPath.join(" → ")}`);
  const sizes = Object.entries(waveSizes).sort((a, b) => a[0] - b[0]).map(([w, n]) => `${w}:${n}`).join("  ");
  if (sizes) console.log(`tasks per wave: ${sizes}`);
  for (const e of errors) console.log(`ERROR [${e.where}] ${e.msg}`);
  for (const w of warnings) console.log(`WARN  [${w.where}] ${w.msg}`);
  console.log(`result: ${errors.length} error(s), ${warnings.length} warning(s)${strict ? " (strict)" : ""}`);
}
process.exit(failed ? 1 : 0);
