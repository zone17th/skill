# Changelog

Changes to this skill, newest first. Each entry says what changed, why, and
where the reason came from (a run, a user decision, or an engineering audit). A
run records the version it started with and keeps it until it ends; see
[Improving this skill](references/improvement.md).

## 0.2.0 · 2026-11-22

Major architecture, role, review, and mechanical-verification upgrade inspired
by production lessons and `cursor/plugins/pstack`:

- **Primary workflow consolidation:** `zone17-builder` is now the flagship skill
  superseding `zone17-cook-plan` (v1) for all new work, including cooking an
  existing plan (`zone17-builder cook`).
- **Clear three-tier coordination naming:**
  - Top-level run coordinator renamed from `Advisor` to **`Orchestrator`**
    (`references/orchestrator-checkpoint.md`,
    `references/orchestrator-operations.md`).
  - Lane-level task owner split explicitly by role: **`Advisor`** when purely
    coordinating a lane (edits no product code), and **`Lead`** when combining
    implementation (`focus`) with lane coordination (never tests or reviews own
    code). All other roles (`BE/FE Worker`, `BE/FE Reviewer`, `Tester`,
    `Tester cloud`, `Tester visual`, `Bridge lead`) remain unchanged.
- **Removed Jev (`typesafe-ai`) dependency:** dropped `jev-decisions.md`,
  `TYPESAFE_API_KEY` requirements and Jev call/cache accounting overhead.
  Deterministic rules move to Node CLI scripts; semantic routing and acceptance
  judgments stay directly with the reasoning agents.
- **Worker engineering & anti-slop discipline (`references/worker-principles.md`):**
  every `Lead`, `Advisor`, `BE Worker` and `FE Worker` kickoff reads
  `worker-principles.md` first (domain/data shape before logic, boundary
  discipline, subtract-before-you-add, root-cause fixes without symptom guards,
  2-strike *Attack the Premise*, behavior-focused tests, and a mandatory
  deslop/no-redundant-comments pass before handoff). Added `Domain shape` to
  plan task contracts (`plan.md`, `assets/plan-template.md`, `plan-lint.mjs`).
- **Execution-proven review & multi-model panels:** removed the artificial
  "at least 10 findings" floor from `lens-adversarial.md` and `review-method.md`
  so clean artifacts can return `[]` without invented filler; code reviewers
  probe suspected defects with commands/repros on the read-only stage checkout;
  added optional cross-vendor **Review Panels** (2+ model families) for G1/G2
  document full rounds and `high` risk tasks.
- **Fresh worker on 2-strike failure:** while preserving the 5-worktree-per-lane
  budget, a worker that fails two consecutive fix rounds on the same trigger is
  replaced by a **fresh worker session** on the same checkout with prior attempt
  summaries and an *Attack the Premise* directive.
- **Mechanical enforcement scripts (`encode-lessons-in-structure`):** added
  `scripts/verify-evidence.mjs` (validates AC logs, SHAs, exit codes, test count
  regressions, `red_first` proofs and review state) and
  `scripts/audit-lanes.mjs` (audits the 5-worktree cap, merged leftover branches
  and `run-manifest.json` weight invariants). Upgraded `improvement.md` with the
  4-level `/correct` enforcement hierarchy (architecture → script/lint → test →
  prose last).
- **Operational ergonomics:** added saved **Roster Presets**
  (`~/.agents/zone17-roster.json`, `zone17-builder setup`), Phase 1 **Empirical
  Spikes** before freezing G1/G2, and **quiet watchdog heartbeats** on no-change
  ticks paired with `/ketchup`-style catch-up reports when state changes.

Origin: user direction and `pstack` comparative architecture review, 2026-11-22.

## 0.1.0 · 2026-11-18

First version.

- Two phases with human gates: documents (spec, then plan), then cook, ending
  at the final pull request.
- Phase 1: independent document reviewer on a model the user chooses, bundled
  review lenses (five copied from BMAD-METHOD's review skill, plus
  `traceability` and `test-impact`), bounded review rounds, questions to the
  human in batches, a decision record.
- Plans carry a pipeline table, per-task impact outside the task and a test
  plan; `scripts/plan-lint.mjs` checks them mechanically.
- Phase 2: the zone17-cook-plan workflow as of 2026-11-05, with QC per task
  (planned tests, regression scope, red-first proof, reviewed test changes,
  counts against the base, unstable-test rules), a wave gate, a final QA task
  and a QA report.
- Project-neutral: commands, rules, tracking and risk areas come from a project
  profile written for each run.
- Adoption of existing specs and plans; a loop for improving the skill from
  run notes with the human's approval.

Origin: user request and design decisions of 2026-11-18.
