#!/usr/bin/env node
// audit-lanes: mechanical standing-cleanup and ledger auditor for zone17-builder.
// Run on every Orchestrator pass and at lane/run close. Audits git worktrees
// against the 5-worktree-per-lane budget, detects prunable or already-merged
// leftover worktrees/branches, and validates run-manifest.json weight invariants.
// Zero dependencies. Exit 0 = clean, 1 = violations found, 2 = usage/read error.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function help() {
  return `Usage: node audit-lanes.mjs [--repo <dir>]... [--manifest <run-manifest.json>] [--integration <branch>] [--max-per-lane <5>] [--json] [--strict]

Checks mechanically
  - git worktrees per lane do not exceed --max-per-lane (default: 5)
  - no prunable or missing-directory worktree entries exist
  - when --integration (or manifest.integration_branch) is given, flags open
    worktrees and leftover local branches already merged into the integration branch
  - when --manifest is given:
    - total_weight > 0 and equals sum of task weights
    - done + in_progress + not_started + blocked weights sum to total_weight
    - orchestrator_accepted_weight equals done weight
    - phase_completion_percent matches orchestrator_accepted_weight / total_weight * 100
    - tasks marked "done" hold no live worktrees or unclosed lane_handle

Options
  --repo <dir>          git repository path to inspect (repeatable; defaults to manifest.workspace_root or cwd)
  --manifest <file>     path to run-manifest.json
  --integration <ref>   integration branch to check for uncleaned merged branches/worktrees
  --max-per-lane <n>    worktree budget per lane (default: 5)
  --json                emit JSON output
  --strict              treat warnings as errors

Exit codes: 0 clean, 1 errors found, 2 usage or read error.`;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { console.log(help()); process.exit(0); }

let asJson = false;
let strict = false;
let manifestPath = null;
let integrationBranch = null;
let maxPerLane = 5;
const repos = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--json") asJson = true;
  else if (a === "--strict") strict = true;
  else if (a === "--manifest") manifestPath = args[++i];
  else if (a === "--integration") integrationBranch = args[++i];
  else if (a === "--max-per-lane") maxPerLane = Number(args[++i]);
  else if (a === "--repo") repos.push(args[++i]);
  else { console.error(`audit-lanes: unknown argument "${a}"\n\n${help()}`); process.exit(2); }
}

if (!Number.isInteger(maxPerLane) || maxPerLane < 1) {
  console.error("audit-lanes: --max-per-lane must be a positive integer");
  process.exit(2);
}

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push({ where, msg });
const warn = (where, msg) => warnings.push({ where, msg });

let manifest = null;
if (manifestPath) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, ""));
  } catch (e) {
    console.error(`audit-lanes: cannot parse manifest ${manifestPath}: ${e.message}`);
    process.exit(2);
  }
  if (!integrationBranch && typeof manifest.integration_branch === "string") {
    integrationBranch = manifest.integration_branch;
  }
  if (repos.length === 0 && typeof manifest.workspace_root === "string") {
    repos.push(manifest.workspace_root);
  }
}
if (repos.length === 0 && !manifestPath) repos.push(process.cwd());

function git(repo, gitArgs) {
  return execFileSync("git", ["-C", repo, ...gitArgs], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function inferLaneKey(wt, manifestTasks) {
  const normPath = path.resolve(wt.path).replace(/\\/g, "/").toLowerCase();
  const shortBranch = wt.branch ? wt.branch.replace(/^refs\/heads\//, "") : "";
  for (const t of manifestTasks) {
    if (shortBranch && t.branch && shortBranch === t.branch) return t.task_id;
    if (Array.isArray(t.worktrees)) {
      for (const w of t.worktrees) {
        const p = typeof w === "string" ? w : w?.path;
        if (p && path.resolve(p).replace(/\\/g, "/").toLowerCase() === normPath) return t.task_id;
      }
    }
  }
  if (shortBranch) {
    const m = /^(?:feat|fix|task|lane|cook)[/-]([A-Za-z0-9_-]+)/i.exec(shortBranch);
    return m ? m[1] : shortBranch;
  }
  return path.basename(wt.path).replace(/-(?:stage|worker\d*|fix\d*|r\d+)$/i, "");
}

// 1. Manifest progress ledger audit
let computedCompletion = null;
const manifestTasks = Array.isArray(manifest?.tasks) ? manifest.tasks : [];
if (manifest) {
  const ledger = manifest.progress_ledger ?? manifest;
  const total = ledger.total_weight;
  if (typeof total !== "number" || total <= 0) {
    err("manifest", `total_weight "${total}" must be a positive number`);
  } else {
    const buckets = { done: 0, "in-progress": 0, "not-started": 0, blocked: 0 };
    let taskSum = 0;
    for (const t of manifestTasks) {
      const id = t?.task_id ?? "unknown-task";
      const w = t?.weight;
      if (typeof w !== "number" || w <= 0) { err(id, `invalid weight "${w}"`); continue; }
      taskSum += w;
      const st = String(t?.status ?? "").replace(/_/g, "-").toLowerCase();
      if (!(st in buckets)) err(id, `invalid status "${t?.status}" (expected done | in-progress | not-started | blocked)`);
      else buckets[st] += w;

      if (st === "done") {
        if (Array.isArray(t.worktrees) && t.worktrees.length > 0) {
          err(id, `task is "done" but still lists ${t.worktrees.length} live worktree(s) in manifest`);
        }
        if (t.lane_handle) {
          err(id, `task is "done" but lane_handle "${t.lane_handle}" is not cleared`);
        }
      }
      if (t?.lane_owner_role && !["advisor", "lead"].includes(t.lane_owner_role)) {
        err(id, `lane_owner_role "${t.lane_owner_role}" must be "advisor" or "lead"`);
      }
    }

    if (manifestTasks.length > 0 && Math.abs(taskSum - total) > 1e-9) {
      err("manifest", `task weights sum to ${taskSum}, expected total_weight ${total}`);
    }
    const accepted = ledger.orchestrator_accepted_weight ?? ledger.advisor_accepted_weight;
    if (typeof accepted !== "number") {
      err("manifest", "missing orchestrator_accepted_weight");
    } else {
      if (manifestTasks.length > 0 && Math.abs(accepted - buckets.done) > 1e-9) {
        err("manifest", `orchestrator_accepted_weight (${accepted}) !== sum of done task weights (${buckets.done})`);
      }
      computedCompletion = Number(((accepted / total) * 100).toFixed(2));
      if (typeof ledger.phase_completion_percent === "number" && Math.abs(ledger.phase_completion_percent - computedCompletion) > 0.15) {
        err("manifest", `phase_completion_percent (${ledger.phase_completion_percent}%) drifts from accepted/total (${computedCompletion}%)`);
      }
    }
  }
}

// 2. Git worktree & merged-branch hygiene audit
const repoSummaries = [];
for (const repo of repos) {
  let rawWt;
  try {
    rawWt = git(repo, ["worktree", "list", "--porcelain"]);
  } catch (e) {
    err(repo, `cannot run git worktree list: ${e.message.split("\n")[0]}`);
    continue;
  }

  const worktrees = [];
  let cur = null;
  for (const line of rawWt.replace(/\r\n/g, "\n").split("\n")) {
    if (line.startsWith("worktree ")) {
      if (cur) worktrees.push(cur);
      cur = { path: line.slice(9).trim(), head: null, branch: null, detached: false, prunable: null };
    } else if (cur && line.startsWith("HEAD ")) cur.head = line.slice(5).trim();
    else if (cur && line.startsWith("branch ")) cur.branch = line.slice(7).trim();
    else if (cur && line === "detached") cur.detached = true;
    else if (cur && line.startsWith("prunable ")) cur.prunable = line.slice(9).trim();
  }
  if (cur) worktrees.push(cur);

  let defaultBranches = new Set(["main", "master", "develop", "dev"]);
  if (integrationBranch) defaultBranches.add(integrationBranch);

  let mergedBranches = new Set();
  if (integrationBranch) {
    try {
      const mergedOut = git(repo, ["branch", "--format=%(refname:short)", "--merged", integrationBranch]);
      for (const b of mergedOut.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)) {
        if (!defaultBranches.has(b)) mergedBranches.add(b);
      }
    } catch (e) {
      warn(repo, `could not resolve integration branch "${integrationBranch}" for merged-branch check`);
    }
  }

  const laneCounts = {};
  worktrees.forEach((wt, idx) => {
    if (!fs.existsSync(wt.path)) {
      err(repo, `worktree directory missing on disk (run git worktree prune): ${wt.path}`);
    } else if (wt.prunable) {
      err(repo, `prunable stale worktree "${wt.path}": ${wt.prunable}`);
    }
    if (idx === 0) return; // primary checkout
    const shortBranch = wt.branch ? wt.branch.replace(/^refs\/heads\//, "") : "";
    if (shortBranch && defaultBranches.has(shortBranch)) return;

    const lane = inferLaneKey(wt, manifestTasks);
    laneCounts[lane] = (laneCounts[lane] ?? 0) + 1;

    if (shortBranch && mergedBranches.has(shortBranch)) {
      warn(repo, `worktree "${wt.path}" is on branch "${shortBranch}" already merged into ${integrationBranch}; remove if lane settled`);
    }
  });

  for (const [lane, count] of Object.entries(laneCounts)) {
    if (count > maxPerLane) {
      err(`${repo}#${lane}`, `lane "${lane}" has ${count} worktrees, exceeding Worktree budget max ${maxPerLane}`);
    }
  }

  if (mergedBranches.size > 0) {
    warn(repo, `${mergedBranches.size} local branch(es) already merged into ${integrationBranch}: ${[...mergedBranches].slice(0, 8).join(", ")}${mergedBranches.size > 8 ? "…" : ""}`);
  }

  repoSummaries.push({
    repo,
    total_worktrees: worktrees.length,
    lane_worktree_counts: laneCounts,
    merged_uncleaned_branches: [...mergedBranches],
  });
}

const failed = errors.length > 0 || (strict && warnings.length > 0);
const out = {
  manifest: manifestPath,
  computed_completion_percent: computedCompletion,
  max_per_lane: maxPerLane,
  repos: repoSummaries,
  errors,
  warnings,
  ok: !failed,
};

if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`audit-lanes: ${repos.length} repo(s)${manifestPath ? ` · manifest ${manifestPath}` : ""}`);
  if (computedCompletion !== null) console.log(`ledger completion: ${computedCompletion}%`);
  for (const r of repoSummaries) {
    const lanes = Object.entries(r.lane_worktree_counts).map(([k, v]) => `${k}:${v}`).join(" ") || "none";
    console.log(`repo ${r.repo}: ${r.total_worktrees} total worktree(s) · lane checkouts [${lanes}]`);
  }
  for (const e of errors) console.log(`ERROR [${e.where}] ${e.msg}`);
  for (const w of warnings) console.log(`WARN  [${w.where}] ${w.msg}`);
  console.log(`result: ${errors.length} error(s), ${warnings.length} warning(s)${strict ? " (strict)" : ""}`);
}
process.exit(failed ? 1 : 0);
