---
name: zone17-builder
description: >-
  Take work from request to final pull request in two gated phases — for new
  features, bug fixes, or codebase anti-slop refactoring (`zone17-builder
  refactor`). Phase 1, documents: audit/spike when needed, write a spec (or
  Refactor Spec), then an implementation plan with domain shapes, a task
  pipeline, per-task external impact and a full test plan; an independent
  reviewer (or multi-model panel) reviews both, unclear points go to the human
  in batches, and the human approves each gate. Phase 2, cook: the Orchestrator
  executes waves of parallel lane teams (each lane led by a coordinate-only
  Advisor or a hands-on Lead, with strict worker engineering principles,
  2-strike fresh-worker recovery, execution-proven review, mechanical evidence,
  LOC/deletion and worktree audits, wave gates and final QA), ending at the
  final pull request. Use for "zone17-builder", "lên spec", "lên plan", "cook
  plan", "refactor dự án", "dọn slop". Project-neutral. Loading this skill alone
  does not start a team or a schedule.
---

# Zone17 Builder

One repeatable engineering workflow from request to the final pull request, in
two phases with explicit human gates and mechanical checks at every boundary.
`zone17-builder` supersedes `zone17-cook-plan` (v1) for all new runs, including
runs that start directly from an existing plan (`zone17-builder cook`).

```text
Phase 1 · Documents (this session is the Author)
  intake (+ empirical spike when needed) -> question batch -> SPEC -> review loop
         -> G1 human approves spec
         -> PLAN (domain shapes, pipeline, impact, test plan) -> plan-lint -> review loop
         -> G2 human approves plan
Phase 2 · Cook (this session becomes the Orchestrator)
  G3 human says start (+ preset roster confirmed)
         -> waves of task lanes: Advisor (coordinate-only) or Lead (hands-on + coordinate)
            runs Worker (with worker-principles) -> Tester -> Reviewer -> verify-evidence
         -> Orchestrator reruns merge checks + audit-lanes -> wave gate on integration branch
         -> final QA task -> G4 final pull request with QA report   <- the run ends here
```

## Scope

The skill covers the request up to opening (or preparing) the final pull
request. Merging that pull request, deploying, releasing and work outside the
approved spec are separate requests the user makes when they want them; never
start them as "the obvious next step". Extra work requested mid-run goes through
[change requests](#change-requests) or stays beside the plan's scope as
outside-plan counts, never silently inflating the scope.

The skill is project-neutral: no stack, tracker, branch model or test command is
hardcoded here. Discover them per run in
[project-profile.md](references/project-profile.md) and never carry values over
from another project.

## Invocation

`zone17-builder [spec | plan | cook | refactor | status | setup] [scope=<paths>] [harness=<name>]`

- No phase word: resume from `builder-state.json` when present; otherwise start
  at `spec` (or `refactor` when the user asks to clean up, deduplicate, deslop
  or restructure existing code without changing behavior).
- `spec`, `plan`, `cook`: enter that phase. Entering `plan` without G1 or `cook`
  without G2 is allowed only when the user supplies an existing document; bring
  it up to standard first via [adopt.md](references/adopt.md).
- `refactor`: enter the **Anti-Slop & Architecture Refactor** workflow
  ([refactor.md](references/refactor.md), `assets/refactor-spec-template.md`) —
  runs static detectors + a 6-category slop audit first, enforces `pin-first`
  characterization tests, zero leftover legacy references (`must_delete`), and
  anti-bloat `loc_delta` checks across Phase 1 and Phase 2.
- `status`: read-only report of gates, open questions, review rounds and, during
  cook, the Orchestrator progress report. Change nothing.
- `setup`: create or update the user's saved default model roster at
  `~/.agents/zone17-roster.json` so future runs confirm models in one step
  ([Roster presets](references/cook.md#roster-presets)).
- `harness=<name>` selects the runtime for cook and external reviewer sessions;
  default `orca`. See [cook.md](references/cook.md#select-the-harness).

## What to read, and when

| When | Read |
| --- | --- |
| Always first, before writing, auditing or cooking | [project-profile.md](references/project-profile.md) |
| Writing or updating a feature/change spec | [spec.md](references/spec.md), `assets/spec-template.md` |
| Auditing AI slop / dead code or refactoring existing code | [refactor.md](references/refactor.md), `assets/refactor-spec-template.md` |
| Writing or updating a plan | [plan.md](references/plan.md), `assets/plan-template.md` (plus [refactor.md](references/refactor.md#phase-1b-cutting-the-refactor-plan) in refactor mode) |
| Adopting an existing spec or plan | [adopt.md](references/adopt.md) |
| Before sending a spec or plan to review | [doc-review.md](references/doc-review.md) |
| Configuring or updating saved role models | [cook.md](references/cook.md#team-roster) |
| The user says start cooking (G3) | [cook.md](references/cook.md), [worker-principles.md](references/worker-principles.md), [qa-qc.md](references/qa-qc.md), and the files `cook.md` names |
| Closing the run | [qa-qc.md](references/qa-qc.md#final-qa-task), `assets/qa-report-template.md` |
| After each gate, accepted task, wave gate and run close | [improvement.md](references/improvement.md) |

Do not load Phase 2 (`cook.md`, `orchestrator-*.md`, `harness/*`) during Phase 1;
guard the context window until teams actually run.

## Gates

A gate passes only on the evidence in its row. Record each pass in
`builder-state.json` with a system-clock timestamp and, for human gates, the
user's own words.

| Gate | Passed when | Who passes it |
| --- | --- | --- |
| G0 intake | Project profile written; sources read; empirical spikes (if any) run; first question batch answered or parked | Author |
| G1 spec | Review loop closed with zero open blocking findings; open questions name what they block; user approves | Human |
| G2 plan | `plan-lint.mjs` exits 0; review loop closed; every AC and impact row has a test; user approves | Human |
| G3 start | User explicitly says start cooking; roster confirmed (from preset or prompt); base branch verified | Human |
| G4 final PR | Final QA task accepted (`verify-evidence.mjs` exits 0); QA report written; lanes audited clean (`audit-lanes.mjs` exits 0); final PR open or reported ready | Orchestrator, then the run stops |

Approval of one gate never implies the next: approving a plan (G2) does not
start cooking (G3). Ask when ambiguous.

## Role summary across phases

- **Phase 1 (Documents):**
  - **Author**: this session; writes the spec and plan, runs empirical spikes
    when needed, resolves review findings, and records decisions.
  - **Document Reviewer**: an independent agent (or a **2-model cross-vendor
    panel** for full rounds when configured) chosen by the user or loaded from
    `~/.agents/zone17-roster.json`. Never self-review on the Author session.
  - **Human**: owns business rules, scope tradeoffs and gates G1–G3.
- **Phase 2 (Cook):**
  - **Orchestrator**: the top-level run coordinator (this session initially, then
    the reused automation session after handover). Owns the parent Run, wave
    dispatch, escalations, merge verification, wave gates, final QA acceptance
    and standing host cleanup.
  - **Advisor** *(lane coordinator)*: owns **one** plan task's lane when the
    lane runs in pure coordination mode — dispatches workers, testers and
    reviewers, merges worker commits, runs `verify-evidence.mjs` and prepares
    the acceptance packet; **edits no product code**.
  - **Lead** *(working lane lead)*: owns **one** plan task's lane when the lane
    combines implementation and coordination — implements its `focus` slice
    itself, dispatches remaining work to workers in parallel, merges commits,
    and **never tests or reviews its own code**.
  - **BE Worker / FE Worker**: implement scoped code and fixes under
    [worker-principles.md](references/worker-principles.md).
  - **BE Reviewer / FE Reviewer**: run execution-grounded reviews
    ([review-method.md](references/review-method.md)); `high` risk tasks can use
    a cross-vendor reviewer panel.
  - **Tester / Tester cloud / Tester visual / Bridge lead**: independent test
    execution, remote runner driving, deterministic visual diffs, and remote
    host relay ([cook.md](references/cook.md#team-roster)).
- **In-process subagents (both phases):** human locks the allowed pool via 4
  tiers in `zone17-roster.json` (`fast` [`Luna`/`Haiku`/`Hydrogen`] →
  `standard` [`Terra`/`Sonnet`/`Argon`] → `deep` [`Sol`/`Opus`/`Neon`] →
  `professor` [`Astra`/`Fable`/`Carbon`]), and the parent agent routes each
  subagent to the tier matching the job; `professor` never fans out subagents on
  `professor` ([Subagent model tiers](references/cook.md#subagent-model-tiers-fast--standard--deep--professor)).

## Asking the human (and settling empirical forks yourself)

- **Code and experiments before questions.** Check the codebase, git/PR history
  and project docs first; cite what you found. When a technical, performance or
  layout fork can be settled by a quick throwaway spike/prototype, run the spike
  and bring measured facts instead of asking the human to guess
  ([spec.md](references/spec.md#empirical-spikes)).
- **Ask only what belongs to the human:** business rules, scope, priorities,
  irreversible tradeoffs, and domain data only stakeholders hold.
- **Batch questions** at natural boundaries (after intake, after a review round),
  stating what you found, options, costs, and a concrete recommendation.
- **Never invent business facts.** Park unanswered questions in Open Questions
  with their owner and blocked IDs; continue unblocked work.
- **Persist decisions immediately** in the run's decision record (user's words,
  timestamp, superseded ID) and write them back into the spec/plan.

## Builder state

Persist `builder-state.json` in the run folder
([project-profile.md](references/project-profile.md#run-folder)): request
summary, skill version (`CHANGELOG.md` top version + commit when known),
document paths/versions, roster preset or custom role profiles, review rounds and
report paths, open questions, gate receipts, and during Phase 2 a pointer to the
cook `run-manifest.json`. Always recover from `builder-state.json` before
creating anything. Never store secrets there.

## Change requests

Any requirement change after G1 follows four steps:

1. Write a spec addendum (or bumped version) naming what changed and what it
   supersedes; batch any unclear business questions.
2. Update affected plan tasks, domain shapes, impact rows, tests, pipeline waves
   and weights. Run `node <skill-root>/scripts/plan-lint.mjs <plan.md>`.
3. Run delta [document review](references/doc-review.md) on the changed sections.
4. Obtain human approval, bump `scope_version`, notify affected live `Advisor` /
   `Lead` lanes, and report the updated denominator explicitly.

## Continuous skill improvement

During every run, record process friction in `skill-notes.md` and sort lessons
at run close via [improvement.md](references/improvement.md), prioritizing
structural fixes (architecture, types, mechanical scripts in `scripts/`, tests)
before adding prose rules. Edit only in the source repository after human
approval, record in `CHANGELOG.md`, and sync installed copies.

## Bundled resources

- `scripts/plan-lint.mjs`: mechanical DAG, wave, weight, AC-to-test, domain
  shape and impact checker for Markdown plans.
- `scripts/verify-evidence.mjs`: mechanical QC validator for task/QA evidence
  packets (AC coverage, SHA match, exit codes, log files, base-vs-head test
  counts, regression checks, red-first failure proofs, review verdict).
- `scripts/audit-lanes.mjs`: mechanical worktree-budget (max 5/lane), uncleaned
  merged-branch, and manifest weight-ledger auditor for every Orchestrator pass.
- `scripts/word_metrics.py`: exact section word counts for editorial lenses.
- `assets/`: `spec-template.md`, `plan-template.md`, `qa-report-template.md`.
- `references/worker-principles.md`: mandatory code-craft & anti-slop rules for
  every `Lead`, `Advisor` and `Worker`.
- `references/lenses/`: self-contained review lenses for documents and code.
- `harness/`: runtime adapters (`orca` default, `_template` for new runtimes).
