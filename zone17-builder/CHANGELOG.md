# Changelog

Changes to this skill, newest first. Each entry says what changed, why, and
where the reason came from (a run, a user decision). A run records the version
it started with and keeps it until it ends; see
[Improving this skill](references/improvement.md).

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

Origin: user request and design decisions of 2026-11-18. Not yet exercised on a
real run.
