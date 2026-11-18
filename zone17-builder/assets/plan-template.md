# Plan: <title>

> Status: draft | in review | approved <date> · Version: <n> · Spec: <path and version>
> Tracking: <parent issue, when the project requires one>

Write in the project's document language. Keep the pipeline table's column
headers and the bold field labels of part D (or the aliases listed by
`plan-lint --help`): the lint and the cook phase read them. Delete this note.

# Part A: Run setup

## A1. Repository and branches

- Repository, default branch, and the target branch of the final pull request: <…>
- Integration branch for this run and the commit it starts from: <…>
- Task branch naming: <…>

## A2. Gates

| Gate | Condition | State |
| --- | --- | --- |
| G1 | Spec approved | |
| G2 | Plan approved | |
| <ID> | <design ready, access granted, a decision the user owes, …> | |

A task that waits on a gate lists the gate's ID among its hard dependencies.

## A3. What the run may do

<From the project profile and the user: commit, push task branches, open task
pull requests, merge them into the integration branch, change tracker status.
Anything not listed needs asking. The final pull request is opened and not
merged.>

## A4. Tracking

<Tracker items per task and how evidence is recorded, or "none required".>

## A5. Environment

<Commands for each check, toolchain versions, test services and how parallel
lanes stay isolated, remote runner, hosts and their limits. Point to the
project profile instead of copying it where possible.>

## A6. Acceptance common to every task

<What every task must show besides its own criteria: the project's definition
of done and the QC checks of the builder (planned tests ran, regression scope,
counts against base, reviewed test changes).>

# Part B: Conventions for this run

## B1. Contracts decided first

<API shapes, schemas, shared types or components fixed before parallel work.>

## B2. Shared files and conflict zones

| File or area | Owner task | Others may |
| --- | --- | --- |

## B3. <migrations, generated code, naming, other rules for this run>

# Part C: Pipeline

## C1. Dependency table

Total weight: <N>

| Task | Hard deps | Soft deps | Wave | Weight | Risk |
| --- | --- | --- | --- | --- | --- |
| T1 | - | - | 1 | <n> | standard |
| T2 | T1 | - | 2 | <n> | high |
| QA | T1, T2 | - | 3 | <n> | standard |

Hard: cannot start before the other is merged. Soft: can start, cannot be
submitted before the other lands. Wave: 1 without hard dependencies, otherwise
one more than the latest wave among them.

## C2. Diagram

```text
Wave 1 ─ T1
Wave 2 ─ T2 ◄─ T1
Wave 3 ─ QA ◄─ all
```

## C3. Critical path and priorities

- Critical path: <from `plan-lint`>
- Start first: <tasks others wait on>
- Most lanes at once: <n>; when the host is full, hold back: <…>

## C4. Spec coverage

| Spec ID | Task(s) |
| --- | --- |
| R-1 / AC-1 | T1 |

# Part D: Task contracts

## T1 · <title>

**Spec:** <R-n, AC-n, D-n this task implements>

**Deliverables:**

- <what exists when the task is done>

**Owned paths:** <files and folders this task may edit>

**Out of scope:** <what is not included>

**Acceptance:**

- AC-1: <observable condition> — evidence: <command, assertion or scenario>
- AC-2: <the refusal or limit> — evidence: <…>

**Impact outside the task:**

- <what is affected> (<path or symbol>) → <check that proves it still works> [owner: this task]
- <what is affected> (<path or symbol>) → <check> [owner: T2]

**Test plan:**

- AC-1: <test name>, <level>, `<command>`
- AC-2: <test name>, <level>, `<command>`
- Regression: <each impact row's check and its command>
- Risk tests: <for a high-risk task: permissions, replay, concurrency, migration on existing data, boundaries; red-first: AC-n>
- Test data: <what, from where, how lanes stay isolated>
- Not tested: <what and why, or "nothing left out">

**Design / references:** <files, or "none">

## T2 · <title>

<same fields>

## QA · Run acceptance

**Spec:** all

**Deliverables:**

- QA report; follow-up, unstable-test and decision ledgers closed; final pull request ready.

**Owned paths:** <test and document paths only>

**Out of scope:** new features.

**Acceptance:**

- AC-1: every spec criterion has evidence on the final integration SHA — evidence: the QA report's acceptance table
- AC-2: all project checks pass on the final integration SHA — evidence: <commands>
- AC-3: every impact row of every task passes on the final integration SHA — evidence: <commands>

**Impact outside the task:**

- none: this task changes tests and documents only; searched <what and where>.

**Test plan:**

- AC-1: spec walk, review of evidence, QA report
- AC-2: full suite and end-to-end, `<commands>`
- AC-3: regression checks of all tasks, `<commands>`
- Not tested: <…>

# Part E: Risks and what to do when stuck

| Risk | Sign | What to do |
| --- | --- | --- |

# Review log

| Round | Date | Reviewer | Blocking | Should fix | Minor | Rejected, with reasons | Report |
| --- | --- | --- | --- | --- | --- | --- | --- |
