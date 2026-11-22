# QA and QC

Phase 2 quality gates ensuring that "tests passed" means the behavior actually
works on the real artifact, and that independently built tasks work together.
QC checks every individual task; QA checks the integrated whole.

Contents: [QC per task](#qc-per-task) · [Wave gate](#wave-gate) ·
[Final QA task](#final-qa-task) · [Final pull request](#final-pull-request) ·
[Follow-ups and lessons](#follow-ups-and-lessons)

## QC per task (enforced mechanically by `verify-evidence.mjs`)

The lane `Advisor` or `Lead` embeds `test_plan`, `regression_scope`, `risk_tier`
and `red_first` into Tester/Reviewer briefs, assembles `<task>-evidence.json`,
and runs:

```bash
node <skill-root>/scripts/verify-evidence.mjs <task>-evidence.json
```

Both the lane owner (before `worker_done`) and the `Orchestrator` (before
acceptance) require exit code `0`.

### 1. Planned tests exist and ran on `tested_sha`
Every `AC-n` has its named test, exact command, `exit_code: 0`, matching
`tested_sha`, and a readable non-empty `log_path`. If a planned test turned out
wrong-leveled, the lane owner documents the replacement explicitly rather than
dropping the criterion.

### 2. Regression scope (`impact outside the task`)
`Tester` executes every check in `regression_scope` on `tested_sha`. Any new
external impact discovered mid-task is added to the packet and reported to the
`Orchestrator` to record in the plan.

### 3. Red-first proof (bug fixes & `high` risk criteria)
A test that never fails proves nothing. On the lane's detached read-only stage
checkout (never mutating the lane branch):
1. Restore production paths to `base_sha` (`git checkout <base_sha> -- <prod-paths>`)
   while keeping the new test.
2. Run the test: it must fail (`exit_code != 0`) for the behavioral reason
   described by the criterion — **compile/import/syntax errors do not count**
   (`verify-evidence.mjs` flags compile-error signatures).
3. Save the raw failing log, record both SHAs in `red_first_proofs`, and reset
   the stage checkout clean.

### 4. Post-review test & fixture delta audit
Any commit touching tests or fixtures after `reviewed_sha` requires a Reviewer
delta pass checking for weakened assertions, added skips, widened tolerances, or
mocks replacing real code (`uncovered_delta_kind: "docs"` is the only delta
allowed without re-review).

### 5. Suite counts against `base_sha`
Per suite, record `executed`, `passed`, `failed`, `skipped` alongside
`base_executed` and `base_skipped`. Any drop in `executed` or increase in
`skipped` fails `verify-evidence.mjs` unless `count_delta_reason` justifies why
those tests retired.

### 6. Unstable tests
Never pre-label failures as "known flaky" in Tester briefs:
- `Tester` must rerun a suspected flake alone $\ge 3$ times and point to a
  concrete mechanism (shared state, clock/timer, ordering, port contention).
- In `high` risk areas, intermittent failures are treated as real concurrency
  bugs, never quarantined away.
- Only the `Orchestrator` may quarantine an unstable test, recording an owner
  and tracker ticket in the unstable-test ledger and Final QA report.

### 7. Orchestrator merge rerun
After `verify-evidence.mjs` passes, the `Orchestrator` merges into the
integration branch and reruns affected checks + repo contract suites on the
merged SHA itself, inspecting verbose output to reject silent DB/service `SKIP`s.

## Wave gate

When the last task of a wave merges into the integration branch (and daily on
long waves), the `Orchestrator` verifies on the integration head:

1. Full non-visual project checks (via remote test runner when configured);
2. End-to-end suite (when configured);
3. Cross-task `regression_scope` rows where caller and callee belonged to
   different tasks;
4. Host/worktree hygiene via `scripts/audit-lanes.mjs`.

Next-wave lanes may **start** before the wave gate finishes so workers do not
idle, but tasks depending on a broken wave-gate area are **not accepted** until
a dedicated integration lane (`Advisor` or `Lead`) fixes the regression.

## Final QA task

The plan's closing task runs in its own lane (`Advisor` or `Lead`) against the
final integration SHA — verifying, never adding features:

1. **Spec walk:** verify every spec `AC-n` has passing evidence on the final
   integration SHA.
2. **Full suite & build:** static checks, unit/integration/contract/E2E, build,
   and planned performance checks (with `benchmark-checklist` rigor: explain the
   limiter and compare against baseline counts).
3. **Whole-run regression & cross-task user flows** (including failure paths).
4. **Visual sweep** across required viewports, themes and languages when UI
   changed.
5. **Doc sync & closed ledgers:** spec/plan reflect approved `D-n` deviations;
   every deferred finding, follow-up and unstable test has a fix, tracker item,
   or recorded human decision; `verify-evidence.mjs` and `audit-lanes.mjs` both
   exit `0`.
6. **QA report** written from `assets/qa-report-template.md`.

The `Orchestrator` accepts Final QA by checking the packet and rerunning key
integration gates on the final SHA.

## Final pull request (Gate G4)

Open the PR from the integration branch to the target branch (or report ready if
human-only PR opening applies). Keep the PR body scannable ($\le 50$ lines, link
to the full QA report for tables/logs):
- Why & what was built (mapped to spec `R-n`) and any deferred scope;
- Final SHA check counts vs base and link to `qa-report.md`;
- Known follow-ups / unstable tests with tracker IDs;
- Manual spot-checks and deploy/migration rollback notes for whoever releases.

Disable the run's schedule, run a final `audit-lanes.mjs` sweep, and stop.

## Follow-ups and lessons

Maintain the follow-up ledger, per-task fix-round metrics (especially defects
that escaped task QC into Wave gates or Final QA), and append process friction
to `skill-notes.md` for end-of-run sorting via [improvement.md](improvement.md).
