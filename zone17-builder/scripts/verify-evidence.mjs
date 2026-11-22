#!/usr/bin/env node
// verify-evidence: mechanical QC gate for zone17-builder task & QA packets.
// Validates that every acceptance criterion, regression check, suite count delta,
// red-first failure proof, and review state in <packet.json> has real evidence
// before a lane Advisor/Lead emits worker_done or the Orchestrator accepts.
// Zero dependencies. Exit 0 = valid, 1 = QC gaps found, 2 = usage/read error.

import fs from "node:fs";
import path from "node:path";

function help() {
  return `Usage: node verify-evidence.mjs <evidence-packet.json> [--json] [--no-log-check] [--strict]

Checks mechanically
  - feature_id, base_sha, tested_sha and reviewed_sha exist and are non-placeholder SHAs
  - review_verdict is "clear" with 0 open_blocking_findings
  - if reviewed_sha !== tested_sha, uncovered_delta_kind must be "docs" with a note
    (post-review code or test/fixture edits require a Reviewer delta pass)
  - every AC in required_acs (and at least one criterion) has command, exit_code 0,
    sha === tested_sha, and an existing non-empty log_path
  - every regression_scope item passes on tested_sha with a log_path (or
    no_regression_reason explains what was searched when regression_scope is empty)
  - suites[] is non-empty, failed === 0, executed > 0, and any drop in executed or
    increase in skipped vs base_executed / base_skipped has count_delta_reason
  - when is_bug_fix is true or red_first_required is non-empty, red_first_proofs
    prove behavioral failure (exit_code !== 0, not a compile/import error) on base_sha
  - when mode === "refactor" (or pin_first_required / must_delete / loc_delta are set):
    - pin_first_proofs prove characterization tests PASS (exit_code === 0) on base_sha
    - must_delete entries confirm 0 remaining_refs (and deleted files no longer exist)
    - loc_delta rejects net production LOC growth unless loc_increase_reason is given

Options
  --json          emit JSON output
  --no-log-check  skip filesystem existence/size check on log_path (for dry-run tests)
  --strict        treat warnings as errors

Exit codes: 0 valid packet, 1 QC errors found, 2 usage or JSON parse error.`;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { console.log(help()); process.exit(0); }
const asJson = args.includes("--json");
const skipLogs = args.includes("--no-log-check");
const strict = args.includes("--strict");
const files = args.filter((a) => !a.startsWith("--"));
if (files.length !== 1) { console.error(help()); process.exit(2); }

let packet;
try {
  packet = JSON.parse(fs.readFileSync(files[0], "utf8").replace(/^\uFEFF/, ""));
} catch (e) {
  console.error(`verify-evidence: cannot parse ${files[0]}: ${e.message}`);
  process.exit(2);
}

const baseDir = path.dirname(path.resolve(files[0]));
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push({ where, msg });
const warn = (where, msg) => warnings.push({ where, msg });

const isSha = (s) => typeof s === "string" && /^[0-9a-f]{7,40}$/i.test(s.trim());
const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0 && !/^<[^>]*>$/.test(s.trim());

function checkLogFile(where, logPath, expectPass = true) {
  if (!nonEmpty(logPath)) { err(where, "missing log_path"); return; }
  if (skipLogs) return;
  const resolved = path.isAbsolute(logPath) ? logPath : path.resolve(baseDir, logPath);
  if (!fs.existsSync(resolved)) { err(where, `log_path does not exist on disk: ${resolved}`); return; }
  const stat = fs.statSync(resolved);
  if (!stat.isFile() || stat.size === 0) { err(where, `log_path is empty: ${resolved}`); return; }
  if (expectPass && stat.size < 65536) {
    const content = fs.readFileSync(resolved, "utf8");
    if (/\b0 passed\b/i.test(content) && /\bskipped\b/i.test(content)) {
      err(where, `log shows 0 passed tests (all skipped): ${resolved}`);
    }
  }
}

// 1. Metadata & SHAs
if (!nonEmpty(packet.feature_id)) err("packet", "missing feature_id");
if (!isSha(packet.base_sha)) err("packet", `invalid base_sha "${packet.base_sha ?? ""}" (need 7-40 hex chars)`);
if (!isSha(packet.tested_sha)) err("packet", `invalid tested_sha "${packet.tested_sha ?? ""}" (need 7-40 hex chars)`);
if (isSha(packet.base_sha) && isSha(packet.tested_sha) && packet.base_sha === packet.tested_sha) {
  warn("packet", "tested_sha equals base_sha; verify commits exist on the lane branch");
}

// 2. Review state & uncovered post-review delta
if (packet.review_verdict !== "clear") {
  err("review", `review_verdict is "${packet.review_verdict ?? "missing"}", expected "clear"`);
}
if ((packet.open_blocking_findings ?? 0) !== 0) {
  err("review", `open_blocking_findings is ${packet.open_blocking_findings}, expected 0`);
}
if (!isSha(packet.reviewed_sha)) {
  err("review", `invalid reviewed_sha "${packet.reviewed_sha ?? ""}"`);
} else if (isSha(packet.tested_sha) && packet.reviewed_sha !== packet.tested_sha) {
  if (packet.uncovered_delta_kind !== "docs" || !nonEmpty(packet.uncovered_delta_note)) {
    err(
      "review",
      `reviewed_sha (${packet.reviewed_sha}) !== tested_sha (${packet.tested_sha}); post-review code or test/fixture edits require a Reviewer delta round (only uncovered_delta_kind="docs" with uncovered_delta_note may pass)`
    );
  }
}

// 3. Acceptance criteria checks
const criteria = Array.isArray(packet.criteria) ? packet.criteria : [];
if (criteria.length === 0) err("criteria", "criteria[] is empty; every task needs at least one verified AC");
const seenAcs = new Set();
for (const c of criteria) {
  const id = c?.id ?? "unknown-AC";
  seenAcs.add(id);
  if (!nonEmpty(c?.command)) err(id, "missing command");
  if (c?.exit_code !== 0) err(id, `exit_code is ${c?.exit_code}, expected 0`);
  if (c?.sha !== packet.tested_sha) err(id, `sha "${c?.sha ?? ""}" does not match tested_sha "${packet.tested_sha ?? ""}"`);
  checkLogFile(id, c?.log_path, true);
}
if (Array.isArray(packet.required_acs)) {
  const missing = packet.required_acs.filter((ac) => !seenAcs.has(ac));
  if (missing.length) err("criteria", `missing evidence for required_acs: ${missing.join(", ")}`);
}

// 4. Regression scope
const regressions = Array.isArray(packet.regression_scope) ? packet.regression_scope : [];
if (regressions.length === 0) {
  if (!nonEmpty(packet.no_regression_reason) || packet.no_regression_reason.trim().length < 15) {
    warn("regression_scope", "regression_scope is empty without a detailed no_regression_reason (what was searched and where)");
  }
} else {
  for (const r of regressions) {
    const id = r?.id ?? r?.target ?? "regression-row";
    if (!nonEmpty(r?.command)) err(id, "missing regression command");
    if (r?.exit_code !== 0) err(id, `regression check failed with exit_code ${r?.exit_code}`);
    if (r?.sha !== packet.tested_sha) err(id, `regression sha "${r?.sha ?? ""}" !== tested_sha "${packet.tested_sha ?? ""}"`);
    checkLogFile(id, r?.log_path, true);
  }
}

// 5. Suite counts against base_sha
const suites = Array.isArray(packet.suites) ? packet.suites : [];
if (suites.length === 0) {
  err("suites", "suites[] is empty; report executed/passed/failed/skipped counts vs base_sha");
} else {
  for (const s of suites) {
    const label = `suite:${s?.name ?? "unnamed"}`;
    for (const k of ["executed", "passed", "failed", "skipped"]) {
      if (typeof s?.[k] !== "number" || s[k] < 0) err(label, `field "${k}" must be a non-negative number`);
    }
    if ((s?.failed ?? 0) > 0) err(label, `${s.failed} failed test(s)`);
    if (s?.executed === 0 && !nonEmpty(s?.count_delta_reason)) {
      err(label, "0 executed tests without count_delta_reason (silent skip is not evidence)");
    }
    if (typeof s?.base_executed === "number" && s.executed < s.base_executed && !nonEmpty(s?.count_delta_reason)) {
      err(label, `executed tests dropped from ${s.base_executed} to ${s.executed} without count_delta_reason`);
    }
    if (typeof s?.base_skipped === "number" && s.skipped > s.base_skipped && !nonEmpty(s?.count_delta_reason)) {
      err(label, `skipped tests increased from ${s.base_skipped} to ${s.skipped} without count_delta_reason`);
    }
  }
}

// 6. Red-first proofs (mandatory for bug fixes and red_first_required IDs)
const redRequired = Array.isArray(packet.red_first_required) ? [...packet.red_first_required] : [];
const proofs = Array.isArray(packet.red_first_proofs) ? packet.red_first_proofs : [];
if (packet.is_bug_fix === true && redRequired.length === 0 && proofs.length === 0) {
  err("red_first", "is_bug_fix is true, but red_first_proofs[] is empty (bug fixes require a red-first test failing on base_sha)");
}
if (packet.risk_tier === "high" && redRequired.length === 0 && proofs.length === 0) {
  warn("red_first", "risk_tier is high with no red_first_required or red_first_proofs entries");
}
const provenRed = new Set();
const COMPILE_ERR_RE = /\b(SyntaxError|Cannot find module|ERR_MODULE_NOT_FOUND|TS\d{4}:|ReferenceError: .* is not defined|compilation failed)\b/i;
for (const p of proofs) {
  const id = `red_first:${p?.id ?? "proof"}`;
  if (p?.id) provenRed.add(p.id);
  if (!nonEmpty(p?.command)) err(id, "missing command");
  if (typeof p?.exit_code !== "number" || p.exit_code === 0) {
    err(id, `exit_code is ${p?.exit_code}; red-first test must FAIL (exit_code !== 0) on base_sha without the production change`);
  }
  if (isSha(packet.base_sha) && p?.base_sha !== packet.base_sha) {
    err(id, `proof base_sha "${p?.base_sha ?? ""}" does not match packet base_sha "${packet.base_sha}"`);
  }
  if (!nonEmpty(p?.failure_summary)) {
    err(id, "missing failure_summary explaining the behavioral failure on base_sha");
  } else if (COMPILE_ERR_RE.test(p.failure_summary)) {
    err(id, `failure_summary looks like a compile/import error rather than a behavioral failure: "${p.failure_summary}"`);
  }
  checkLogFile(id, p?.log_path, false);
}
const missingRed = redRequired.filter((id) => !provenRed.has(id));
if (missingRed.length) err("red_first", `missing red_first_proofs for: ${missingRed.join(", ")}`);

// 7. Refactor-mode gates: pin_first_proofs, must_delete (0 legacy refs), and anti-bloat loc_delta
const isRefactor = packet.mode === "refactor";
const pinRequired = Array.isArray(packet.pin_first_required) ? [...packet.pin_first_required] : [];
const pinProofs = Array.isArray(packet.pin_first_proofs) ? packet.pin_first_proofs : [];
const provenPins = new Set();
for (const p of pinProofs) {
  const id = `pin_first:${p?.id ?? "pin"}`;
  if (p?.id) provenPins.add(p.id);
  if (!nonEmpty(p?.command)) err(id, "missing pinning test command");
  if (p?.exit_code !== 0) {
    err(id, `exit_code is ${p?.exit_code}; characterization/pinning test must PASS (exit_code === 0) on base_sha before structural edits`);
  }
  if (isSha(packet.base_sha) && p?.base_sha !== packet.base_sha) {
    err(id, `pin base_sha "${p?.base_sha ?? ""}" does not match packet base_sha "${packet.base_sha}"`);
  }
  checkLogFile(id, p?.log_path, true);
}
const missingPins = pinRequired.filter((id) => !provenPins.has(id));
if (missingPins.length) err("pin_first", `missing pin_first_proofs on base_sha for: ${missingPins.join(", ")}`);

const mustDelete = Array.isArray(packet.must_delete) ? packet.must_delete : [];
if (isRefactor && mustDelete.length === 0 && !nonEmpty(packet.no_delete_reason)) {
  warn("must_delete", 'mode is "refactor" with empty must_delete[]; list legacy symbols/files removed or set no_delete_reason');
}
for (const d of mustDelete) {
  const label = `must_delete:${d?.target ?? "item"}`;
  if (!nonEmpty(d?.target)) { err(label, "missing target name/path"); continue; }
  if (typeof d?.remaining_refs !== "number" || d.remaining_refs !== 0) {
    err(label, `remaining_refs is ${d?.remaining_refs ?? "missing"}, expected 0 (legacy references still exist)`);
  }
  if (!nonEmpty(d?.search_command)) {
    err(label, "missing search_command proving 0 remaining references on tested_sha");
  }
  if (d?.kind === "file" && nonEmpty(d?.repo_root) && !skipLogs) {
    const candidate = path.resolve(d.repo_root, d.target);
    if (fs.existsSync(candidate)) {
      err(label, `file scheduled for deletion still exists on disk: ${candidate}`);
    }
  }
}

if (isRefactor) {
  const loc = packet.loc_delta;
  if (!loc || typeof loc.prod_added !== "number" || typeof loc.prod_deleted !== "number") {
    err("loc_delta", 'mode is "refactor", so loc_delta: { prod_added, prod_deleted } is required');
  } else if (loc.prod_added > loc.prod_deleted && !nonEmpty(loc.loc_increase_reason)) {
    err(
      "loc_delta",
      `refactor task increased production LOC (+${loc.prod_added} / -${loc.prod_deleted}) without loc_increase_reason; anti-slop refactors should shrink or hold code size`
    );
  }
}

// Output
const failed = errors.length > 0 || (strict && warnings.length > 0);
const result = {
  file: files[0],
  feature_id: packet.feature_id ?? null,
  tested_sha: packet.tested_sha ?? null,
  criteria_checked: criteria.length,
  regressions_checked: regressions.length,
  suites_checked: suites.length,
  red_first_checked: proofs.length,
  errors,
  warnings,
  ok: !failed,
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`verify-evidence: ${files[0]} (${result.feature_id ?? "unknown"} @ ${result.tested_sha ?? "?"})`);
  console.log(`checked: ${criteria.length} AC(s) · ${regressions.length} regression(s) · ${suites.length} suite(s) · ${proofs.length} red-first proof(s)`);
  for (const e of errors) console.log(`ERROR [${e.where}] ${e.msg}`);
  for (const w of warnings) console.log(`WARN  [${w.where}] ${w.msg}`);
  console.log(`result: ${errors.length} error(s), ${warnings.length} warning(s)${strict ? " (strict)" : ""}`);
}
process.exit(failed ? 1 : 0);
