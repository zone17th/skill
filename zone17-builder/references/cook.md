# Phase 2: Cook

Read this file when entering Phase 2 (gate G3 in [SKILL.md](../SKILL.md)).
Entry requires an approved plan (gate G2), the user's explicit go-ahead, and
[project-profile.md](project-profile.md). Run
`node <skill-root>/scripts/plan-lint.mjs <plan.md>` once more before first
dispatch: if the plan changed after G2, send the diff through
[doc-review.md](doc-review.md) first.

Turn the plan into small, independently verified deliverables. The invoking
session starts as the **Orchestrator**; by default the first scheduled
automation session takes over that role via verified handover and subsequent
ticks reuse it (`--reuse-session`). Keep work moving in parallel task lanes; the
Orchestrator never babysits terminal streams or micromanages routine stage
handoffs inside a lane.

## Select the harness

The harness starts sessions, manages checkouts, routes messages and schedules
wakes. Read `harness=<harness>` from the invocation (`zone17-builder cook
harness=<harness>`); omitted means `orca`.

Load `../harness/<harness>/HARNESS.md` before step 2 below. If that folder does
not exist, stop and tell the user — never fall back to another harness silently.
Record the harness in `run-manifest.json`; one run uses one harness. New
harnesses copy `../harness/_template/`.

## Start or resume

1. Read the approved plan, spec, [project-profile.md](project-profile.md) (write
   it now if adopting an external plan), and current repository/host rules
   (`AGENTS.md`, `CLAUDE.md`, referenced guides). Verify the integration branch,
   base SHA, completion gates and merge permissions.
2. Load the harness's required tools and version-matched guides (Orca:
   `orchestration` and `orca-cli`). Use the harness's runs, tasks, dispatches
   and messages as real coordination primitives (in-process subagents inside a
   lane are allowed when noted in the roster, obeying the same path and stage
   rules).
3. Recover an existing run from `run-manifest.json` before creating anything.
   Store durable state in the run folder outside disposable worktrees; never
   store credentials there.
4. Load or confirm the [Team roster](#team-roster), using
   [Roster presets](#roster-presets) (`~/.agents/zone17-roster.json`) when
   available so the user confirms in one step. While waiting on any missing
   role choice, prepare task contracts from the plan; never launch with an
   invented model.
5. Verify required tools, runtimes and tracker/approval rules on every execution
   host before dispatch. Pass host-accessible rule and skill paths in contracts.
6. Read the harness execution guide (Orca:
   [execution.md](../harness/orca/execution.md)),
   [orchestrator-checkpoint.md](orchestrator-checkpoint.md), and
   [schedule-verification.md](schedule-verification.md) before going dormant.
   Verify both immediate `worker_done` wake and the 15-minute recovery watchdog
   on the actual host; never report an untested schedule as `verified`.
7. Read [orchestrator-operations.md](orchestrator-operations.md) and
   [qa-qc.md](qa-qc.md) before writing the first task contract or accepting work.

## Team roster

Role profiles are reusable templates instantiated across as many parallel lanes
as host capacity and file isolation allow. Reviewers and Testers are always
separate agent instances from the code's author.

| Role | Scope & Responsibility | Selection |
| --- | --- | --- |
| **Orchestrator** | Top-level run coordinator: wave dispatch, immediate `worker_done` & escalation handling, merge-result re-verification, `audit-lanes.mjs`, wave gates, final QA acceptance, recovery and temporary fallback | Initial session, then reused automation session after handover; preserve confirmed provider/model |
| **Advisor** *(lane coordinator)* | Owns **one** plan task's lane in pure coordination mode: dispatches Workers, Testers and Reviewers, merges worker commits, runs `verify-evidence.mjs`, submits the acceptance packet; **edits no product code** | From preset or ask |
| **Lead** *(working lane lead)* | Owns **one** plan task's lane in hands-on + coordination mode: implements its `focus` slice itself, dispatches remaining work to Workers in parallel, merges commits, runs `verify-evidence.mjs`; **never tests or reviews its own code** | From preset or ask (with optional default `focus`) |
| **BE Worker** | Backend implementation and fixes assigned by a lane `Advisor`, `Lead` or `Orchestrator` | From preset or ask |
| **FE Worker** | Frontend implementation and fixes assigned by a lane `Advisor`, `Lead` or `Orchestrator` | From preset or ask |
| **BE Reviewer** | Execution-grounded backend review via [review-method.md](review-method.md) (single profile on `standard` tasks; optional 2-model panel on `high` risk tasks) | From preset or ask |
| **FE Reviewer** | Execution-grounded frontend/UX/a11y review via [review-method.md](review-method.md) | From preset or ask |
| **Tester** | Runs planned tests, regression scope, base-vs-head counts and `red_first` proofs | From preset or ask |
| **Tester cloud** | Fresh session per round driving the project's remote test runner; edits nothing | Optional; unset means `Tester` |
| **Tester visual** | Browser, desktop-window, screenshot and deterministic visual-diff stages | Optional; unset means `Tester` |
| **Bridge lead** | Local relay for a lane whose `Advisor` or `Lead` runs on a remote host; edits nothing | Optional; only with remote hosts. Unset means `Orchestrator` relays |

Write each role's profile as a comma-separated fallback chain of
`<agent> <model> [effort]`, primary first (for example:
`claude claude-opus-5-5 xhigh, codex gpt-6-astra high`). For `high` risk
review panels (`BE Reviewer` / `FE Reviewer` / `Document Reviewer`), an optional
`panel` list may name 2–3 models from different families that run in parallel.

### Roster presets

To avoid repeating model questions every run, store defaults in
`~/.agents/zone17-roster.json`:

```json
{
  "version": 1,
  "default_lane_owner": "lead",
  "default_lead_focus": "hard tasks first",
  "roles": {
    "orchestrator": "claude claude-opus-5-5 high",
    "advisor": "claude claude-sonnet-5-5 high",
    "lead": "claude claude-opus-5-5 xhigh",
    "worker_be": "codex gpt-6-astra high, claude claude-sonnet-5-5 high",
    "worker_fe": "claude claude-sonnet-5-5 high",
    "reviewer_be": "codex gpt-6-astra high",
    "reviewer_fe": "claude claude-sonnet-5-5 high",
    "tester": "claude claude-sonnet-5-5 medium",
    "doc_reviewer": "codex gpt-6-astra high"
  },
  "high_risk_panel": ["claude claude-opus-5-5 high", "codex gpt-6-astra high"]
}
```

- **When `~/.agents/zone17-roster.json` exists:** display the active table in a
  compact block at G1/G3 and ask once whether to proceed with the preset or
  override specific roles for this run.
- **When absent (or on `zone17-builder setup`):** ask for required roles once in
  the user's language, offer to save `~/.agents/zone17-roster.json` as the
  default preset, and record the confirmed roster in `run-manifest.json`.
- Provider runtime notes stated mid-run (quotas, peak windows, host caps) are
  appended verbatim to the run's team rules, never asked up front.

### Choosing `Advisor` vs `Lead` per lane

Each plan task's contract sets `lane_owner_role: advisor | lead` (defaulting to
`default_lane_owner` from the roster when the plan task does not specify one):

- Choose **`advisor`** when a task spans several disjoint sub-slices (e.g. BE +
  FE + migration) best executed by parallel Workers while a lightweight
  coordinator triages, merges and drives QA/QC without touching product code.
  Above the project's large-failure threshold, the lane `Advisor` sends a
  compact triage plan to the `Orchestrator` before mass dispatch.
- Choose **`lead`** when a task is deep or tightly coupled in code: the `Lead`
  implements its `lead_focus` slice directly (default: the sub-piece that blocks
  the most work), dispatches disjoint slices to Workers in parallel, and still
  hands all testing and code review to separate `Tester` and `Reviewer`
  instances.

Name every session `<role>-<lane_slug> (<issue>)` (adding ` rN` for round/retry
`N`), where `<role>` is `orchestrator`, `advisor`, `lead`, `worker`,
`reviewer_be`, `reviewer_fe`, `tester`, `tester_cloud`, `tester_visual` or
`bridge`. Re-apply the terminal title if an agent overwrites it.

On proven launch/quota failure (not transient 429/5xx — see
[orchestrator-operations.md](orchestrator-operations.md#transient-provider-errors)),
advance to the next fallback entry. If a role's list is exhausted, the
`Orchestrator` temporarily covers it on its own profile while preserving
author/reviewer separation (using a separate instance when `Orchestrator` wrote
code) and hands back at a safe boundary once the primary recovers.

## One lane owner (`Advisor` or `Lead`) per plan task

- **Unit.** Exactly one `Advisor` or `Lead` owns one plan task (e.g. `T3` or
  `UNI-2468`), an integration/wave-fix task, or the closing `QA` task. Tiny
  tasks share a lane only when the approved plan already groups them as one row.
- **Kickoff non-negotiable.** Every `Advisor`, `Lead`, `BE Worker` and
  `FE Worker` kickoff begins with:
  `Read <path>/worker-principles.md before reading or writing code.`
  (copying `worker-principles.md` into the run folder if a remote host lacks
  the global skill path).
- **Lifetime & no reuse.** The lane owner starts on dispatch, drives the
  `worker -> tester ∥ reviewer -> fix -> verify-evidence` loop, sends the
  acceptance packet, and closes once the `Orchestrator` accepts or reassigns
  the task. Closing releases child sessions, removes lane sub-worktrees/DBs,
  keeps the task branch until merged, and writes final `STATUS`. Never reuse a
  finished lane owner for another plan task; carry cross-task context in the
  next task's contract, not in stale agent memory.
- **Orchestrator ledger.** Maintain one live row per active lane: task ID,
  `advisor` or `lead` handle, host, branch/base SHA, stage, and wake channel.
  Sweep closed lanes every pass via `scripts/audit-lanes.mjs`.

## Divide for parallel progress & Worktree budget

Launch the entire ready wave in parallel, constrained only by hard dependencies,
shared-file rules in Part B of the plan, environment isolation, and host/quota
caps. Pull shared contracts/types into Wave 1 tasks so downstream consumers fan
out cleanly.

### Worktree budget (max 5 per lane)

Every new checkout or session must state `worktree_reason` in its contract
(`lane head`, `standing stage checkout`, `parallel editor`, or `remote host`);
"new test/review round" is never a valid reason.

- **Lane head (1):** owned by the lane's `Advisor` or `Lead`. Sequential workers
  (or disjoint-path workers that never commit concurrently) edit here directly.
- **Standing read-only stage checkout (at most 1):** Testers and Reviewers run
  in the lane head while editing pauses, or share **one** detached checkout
  re-pointed each round via `git checkout --detach <sha>` (with isolated DB
  names/ports per parallel reader).
- **Parallel editors (removed on merge):** spawned only when two workers must
  edit concurrently; merged and deleted immediately by the lane owner.
- **Hard cap:** at most **5 worktrees per lane**. `Orchestrator` runs
  `node <skill-root>/scripts/audit-lanes.mjs` every pass and removes merged
  extras immediately.

### Session reuse vs 2-strike fresh worker

- Reuse an idle stage session slot only after releasing the prior completed
  stage cleanly.
- **2-strike fresh-worker rule:** If a `Worker` fails **two consecutive fix
  rounds** on the same test or review trigger, do **not** send a third fix round
  to that same polluted session. Release/close that Worker session and spawn a
  **fresh Worker session on the same checkout**, giving it: the original
  contract, exact failing output, a 5-line summary of the two failed attempts,
  and an explicit instruction to apply *Attack the Premise*
  ([worker-principles.md](worker-principles.md#3-fix-root-causes-never-symptom-guards)).
  If the fresh worker also fails (strike 3), pause only that lane and send a
  decision packet to the `Orchestrator`.

## Autonomous lane loop

```text
Orchestrator dispatches ready task contract (domain_shape, test_plan, regression_scope, risk_tier)
  -> Lane Advisor (coordinating) or Lead (coding focus + coordinating) starts
  -> Workers / Lead implement under worker-principles.md + run pre-handoff deslop/no-comments pass
  -> Tester runs planned tests, regression_scope, base-vs-head counts & red_first proofs
     ∥ Reviewer runs execution-proven review (lenses + stage-checkout repros; panel if high risk)
  -> Fix rounds (fresh Worker session on strike 2; review fixes always re-run affected tests)
  -> Lane owner runs `node <skill-root>/scripts/verify-evidence.mjs <packet.json>` (must exit 0)
  -> Orchestrator verifies packet, reruns merge checks on integration branch, runs `audit-lanes.mjs`
  -> Wave gate on integration head when wave finishes -> Final QA task -> Final PR (run ends)
```

- Small mechanical findings that need no full round are fixed immediately via an
  in-process subagent under the
  [small findings](orchestrator-operations.md#small-findings) rule.
- Every `worker_done` (stage or lane) triggers immediate handling. Child-stage
  completions are routed immediately by the lane `Advisor`/`Lead` (with a
  compact `completion_notice` relayed to `Orchestrator`); lane completions wake
  `Orchestrator` immediately without waiting for the 15-minute watchdog.
- Verify message enqueue and recipient `turn_started` as separate facts per the
  harness execution guide (Orca:
  [execution.md](../harness/orca/execution.md#prove-delivery-and-turn-start)).
- Visual/browser stages use the harness browser (Orca CLI) and follow
  [visual testing](orchestrator-operations.md#visual-testing): deterministic
  pixel/DOM diff first, model classification second; screenshots never prove DB
  writes, permissions or isolation.

## Orchestrator acceptance, reporting and completion

1. **Mechanical gate first:** run `verify-evidence.mjs` on the lane's packet.
   Reject incomplete packets back to the lane owner immediately.
2. **Independent merge verification:** merge into the integration branch (when
   authorized), ensure test DBs/migrations, and rerun affected checks +
   repository contract checks on the merge result itself. Inspect uncovered
   post-review deltas (any test/fixture edit requires a Reviewer delta pass for
   weakened assertions).
3. **Standing hygiene:** settle Dispatches, close child/cloud-runner sessions,
   remove the merged lane's clean worktrees, and run `audit-lanes.mjs`.
4. **Dispatch next ready work** immediately when dependencies clear and host
   slots open.
5. **Catch-up reporting (`/ketchup` style) vs quiet watchdog:**
   - On every pass that **changed state** (task accepted, wave dispatched,
     failure recovered, gate reached, or human decision needed) and on `status`:
     emit a concise catch-up report leading with **what changed since the last
     report** and **every item waiting on the human** (with options and
     recommendation self-contained in the reply), followed by the inventory
     table (`done`, `in progress`, `not started`, `blocked`) and ledger
     completion (`plan X.X% (accepted_w/total_w) · outside plan a/b`).
   - On a **15-minute watchdog tick with zero state change** and all active
     lanes healthy: update `last_orchestrator_active_at`, rearm the timer, and
     emit a one-line quiet heartbeat instead of repeating an unchanged full
     table. See [orchestrator-checkpoint.md](orchestrator-checkpoint.md).

## Where the run ends

The run ends at Gate G4 when the final pull request from the integration branch
to the target branch is open with the QA report attached (or reported ready when
human-only PR creation applies), all schedules are disabled, and
`audit-lanes.mjs` passes clean. Merging that final PR, deploying, and releasing
are separate user requests outside this run.
