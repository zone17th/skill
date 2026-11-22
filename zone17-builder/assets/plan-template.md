# Plan: <title>

> Status: draft | in review | approved <date> · Version: <n> · Spec: <path and version>
> Tracking: <parent issue, when the project requires one>

Write in the project's document language. Keep the pipeline table's column
headers and the bold field labels of Part D (or the aliases listed by
`plan-lint.mjs --help`): the lint and Phase 2 read them. Delete this note.

# Part A: Run setup

## A1. Repository and branches

- Repository, default branch, and target branch of the final pull request: <…>
- Integration branch for this run and base commit SHA: <…>
- Task branch naming: <…>

## A2. Gates

| Gate | Condition | State |
| --- | --- | --- |
| G1 | Spec approved | |
| G2 | Plan approved | |
| <ID> | <design ready, access granted, a decision the user owes, …> | |

A task that waits on a gate lists the gate's ID among its hard dependencies.

## A3. What the run may do

<From `project-profile.md` and the user: commit, push task branches, open task
pull requests, merge them into the integration branch, update tracker status.
Anything unlisted requires asking. The final pull request is opened and never
merged by this skill.>

## A4. Tracking

<Tracker items per task and how evidence is recorded, or "none required".>

## A5. Environment

<Commands for each check, pinned toolchain versions, test services and how
parallel lanes stay isolated, remote runner, hosts and concurrency caps. Point
to `project-profile.md` instead of duplicating where possible.>

## A6. Acceptance common to every task

<Project definition of done plus builder QC (`worker-principles.md` clean pass,
`verify-evidence.mjs` exit 0: planned tests ran on `tested_sha`, regression
scope green, base-vs-head counts checked, post-review test edits audited).>

# Part B: Conventions for this run

## B1. Foundational contracts decided first

<Shared domain types, state machines, API schemas or UI primitives built in
Wave 1 before parallel consumers start.>

## B2. Shared files and conflict zones

| File or area | Owner task | Others may |
| --- | --- | --- |

## B3. Migrations, generated code and run-wide rules

<…>

# Part C: Pipeline

## C1. Dependency table

Total weight: <N>

| Task | Hard deps | Soft deps | Wave | Weight | Risk |
| --- | --- | --- | --- | --- | --- |
| T1 | - | - | 1 | <n> | standard |
| T2 | T1 | - | 2 | <n> | high |
| QA | T1, T2 | - | 3 | <n> | standard |

Hard: cannot start until merged into the integration branch. Soft: can start,
cannot submit `worker_done` until merged. Wave: `1` without hard task deps, else
`1 + max(hard dep waves)`.

## C2. Diagram

```text
Wave 1 ─ T1
Wave 2 ─ T2 ◄─ T1
Wave 3 ─ QA ◄─ all
```

## C3. Critical path and priorities

- Critical path: <from `plan-lint.mjs`>
- Start first: <tasks blocking the most downstream weight>
- Max concurrent lanes: <n>; hold back when host is full: <…>

## C4. Spec coverage

| Spec ID | Task(s) |
| --- | --- |
| R-1 / AC-1 | T1 |

# Part D: Task contracts

## T1 · <title>

**Spec:** <R-n, AC-n, D-n implemented here>

**Lane owner:** <lead | advisor (optional; defaults to roster default)>

**Domain shape:**

- <Core types, discriminated union, state machine, or boundary signature settled before logic>

**Deliverables:**

- <Concrete endpoints, screens, migrations, jobs, scripts>

**Owned paths:** <files and folders this lane may edit>

**Out of scope:** <what is excluded>

**Acceptance:**

- AC-1: <observable condition> — evidence: <command, assertion or browser scenario>
- AC-2: <refusal or boundary condition> — evidence: <…>

**Impact outside the task:**

- <what is affected> (<path or symbol>) → <check proving it still works> [owner: this task]
- <what is affected> (<path or symbol>) → <check> [owner: T2]

**Test plan:**

- AC-1: <test name>, <level>, `<command>`
- AC-2: <test name>, <level>, `<command>`
- Regression: <each impact row's check and exact command>
- Risk tests: <for `high` risk or bug fixes: permissions, replay/idempotency, concurrency, migration on realistic data, boundaries; red-first: AC-n>
- Test data: <source and parallel-lane isolation>
- Not tested: <what and why, or "nothing left out">

**Design / references:** <paths/links, or "none">

## T2 · <title>

<same fields>

## QA · Run acceptance

**Spec:** all

**Lane owner:** advisor

**Deliverables:**

- QA report (`qa-report.md`); follow-up, unstable-test and decision ledgers closed; `verify-evidence.mjs` and `audit-lanes.mjs` passing; final pull request ready.

**Owned paths:** <test and document paths only>

**Out of scope:** new product features.

**Acceptance:**

- AC-1: every spec criterion has passing evidence on the final integration SHA — evidence: QA report acceptance table
- AC-2: all project checks pass on the final integration SHA — evidence: `<commands>`
- AC-3: every impact row of every task passes on the final integration SHA — evidence: `<commands>`

**Impact outside the task:**

- none: verifies tests and documents only; searched <what and where>.

**Test plan:**

- AC-1: spec walk and `verify-evidence.mjs` check on QA packet
- AC-2: full suite, build and end-to-end, `<commands>`
- AC-3: all cross-task regression checks, `<commands>`
- Not tested: <…>

# Part E: Risks and escalation triggers

| Risk | Sign | Action (lane Advisor/Lead or Orchestrator) |
| --- | --- | --- |

# Review log

| Round | Date | Reviewer / Panel | Blocking | Should fix | Minor | Rejected (with reason) | Report |
| --- | --- | --- | --- | --- | --- | --- | --- |
