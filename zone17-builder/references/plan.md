# Phase 1b: Plan

The plan turns an approved spec into bounded tasks that parallel lane teams
execute in Phase 2. Every task section becomes one lane owner's (`Advisor` or
`Lead`) contract, so write for an engineer on another machine who has only the
plan, the spec, `project-profile.md` and the repository.

Write from `assets/plan-template.md` at the project's plan path and in its
document language. Keep the template's column headers and bold field labels (or
aliases in `plan-lint.mjs --help`).

## Parts of a plan

| Part | Holds | Why it exists |
| --- | --- | --- |
| A. Run setup | Branches/base SHA, gates, run permissions, tracking, environment, common QC rules | Lanes follow identical rules without asking |
| B. Conventions | Up-front shared types/contracts, migration rules, shared files and exclusive edit order | Parallel lanes do not collide |
| C. Pipeline | Dependency table, waves, diagram, critical path, spec coverage table | The `Orchestrator` schedules waves deterministically |
| D. Task contracts | One self-contained section per task | Each becomes one `Advisor` or `Lead` lane contract |
| E. Risks | Failure modes, signs and concrete fallback actions | Lanes escalate cleanly instead of improvising |
| Review log | Review rounds, models, fixed and rejected findings | Preserves architectural rationale |

## Cutting tasks & architectural spikes

- **One task = one independently testable unit** owned by one lane (`Advisor` or
  `Lead`): focused enough for a single lane, complete enough to prove behavior.
- **Pull foundational shapes into Wave 1.** Shared schemas, domain types, API
  contracts or UI primitives consumed by multiple tasks become early Wave 1
  tasks so later waves fan out without merge collisions
  ([worker-principles.md](worker-principles.md#1-shape-the-data-before-writing-logic)).
- **Prototype contested architectures first.** If two module shapes or
  migration strategies compete, run a quick throwaway spike (or 2-runner
  bakeoff) on detached scratch checkouts to verify ergonomics/performance before
  locking Part B and Part D.
- **Do not over-shard** tightly coupled edits merely to inflate parallelism; one
  `Lead` lane with internal sub-slices beats two colliding lanes.
- **Closing QA task.** Every multi-task plan ends with a `QA` task in the final
  wave depending on all prior tasks ([qa-qc.md](qa-qc.md#final-qa-task)).
- **100% spec coverage.** Map every `R-n` and `AC-n` to at least one task in
  Part C4.

## Pipeline table (Part C)

```markdown
| Task | Hard deps | Soft deps | Wave | Weight | Risk |
| --- | --- | --- | --- | --- | --- |
```

- **Hard deps:** must merge into the integration branch before this task starts.
- **Soft deps:** this task may start against an agreed contract, but cannot
  submit `worker_done` until the soft dep lands.
- **Gates:** non-task blockers (`G-design`, `G-creds`) defined in Part A2 may
  appear in `Hard deps`; `Orchestrator` holds the task until the gate clears.
- **Wave:** `1` with no hard task deps, else `1 + max(wave of hard task deps)`.
- **Weight:** positive number fixed at G2; splitting a task later subdivides its
  existing weight without changing `Total weight`.
- **Risk:** `standard` or `high` per `project-profile.md`.

## Task contract fields (Part D)

Every non-done task section carries these fields:

- **Spec:** `R-n`, `AC-n`, `D-n` IDs implemented here.
- **Lane owner** *(optional)*: `advisor` (coordinate-only lane) or `lead`
  (hands-on coding + coordination, with optional `focus`); defaults to the
  roster's `default_lane_owner` when omitted.
- **Domain shape:** 1–4 lines naming the core types, state machine, discriminated
  union, schema or boundary signature this task introduces or consumes
  (`plan-lint.mjs` warns if missing on non-QA tasks). Settling shape here
  prevents Worker slop downstream.
- **Deliverables:** concrete endpoints, screens, migrations, jobs or scripts.
- **Owned paths:** files/folders this lane may edit; all others are read-only.
- **Out of scope:** nearby work explicitly excluded.
- **Acceptance:** local `AC-1`, `AC-2`, … with observable behavior and required
  evidence (command, assertion, browser scenario), including negative cases.
- **Impact outside the task:** derived by searching the codebase (callers,
  importers, API/event/DB consumers, shared UI screens, seeds, permissions,
  concurrent tasks):
  `- <what is affected> (<path or symbol>) → <check that proves it works> [owner: this task | <Task ID>]`
  If nothing is affected, write `none: searched <symbols/paths and where>` (a
  bare `none` fails `plan-lint.mjs`). These rows become `regression_scope` in
  Phase 2.
- **Test plan:**
  1. Every `AC-n` mapped to at least one named test, level and exact `<command>`
     at the lowest level that genuinely observes the behavior (mocked DBs never
     prove DB constraints; screenshots never prove saves/permissions).
  2. Negative/refusal tests for invalid inputs, missing permissions and limits.
  3. Every impact row's regression check.
  4. For `high` risk tasks and all bug fixes: explicit **`red-first`** criteria
     (new test proven to fail on `base_sha` before the fix), plus concurrency,
     idempotency/replay, permission matrix and production-shaped migration data
     checks as applicable.
  5. Test data & parallel-lane isolation strategy.
  6. Honest `Not tested` exclusions with reasons.
- **Design / references:** links or `none`.

## Lint, review and Gate G2

Run the mechanical linter before every review round and after every edit:

```bash
node <skill-root>/scripts/plan-lint.mjs <plan.md>
```

Exit code `0` is mandatory for G2. Then run [doc-review.md](doc-review.md) with
the approved spec as source.

At **Gate G2**, report task/wave counts, total weight, critical path, `high`
risk tasks and their `red-first` checks, open questions/gates, `plan-lint`
status and review summary. Record human approval with the plan version/SHA,
create tracker tickets if the project requires them after G2, and wait for an
explicit **G3** instruction before starting Phase 2.
