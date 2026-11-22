# Project profile

`zone17-builder` is project-neutral, so every run starts by discovering this
repository's facts and writing `project-profile.md` in the run folder. Pass its
path in every contract (`Document Reviewer`, lane `Advisor`, lane `Lead`,
`Worker`, `Tester`, `Reviewer`) because external sessions inherit nothing from
this conversation.

## Profile rules

- Cite every fact (`file:line`, command + output, or user quote + timestamp).
- Mark missing facts `unknown` with who can answer; ask the user only for items
  blocking the current phase. Never guess or copy values from another project.
- Stricter project rules always override this skill's defaults.
- Re-verify when switching hosts/checkouts or when repo rule files change.

## What to discover

Read `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README` and linked docs
first, then build/CI configs, then module layout:

| Area | Discover |
| --- | --- |
| Rules | Rule precedence, forbidden actions, protected paths |
| Authorization | Allowed without asking: commit, push, task PR, merge to integration, tracker updates. Default when silent: ask first |
| Tracking | Issue tracker requirements, status transitions, evidence comment rules (`none` if unstated) |
| Branches | Default branch, integration branch, branch naming, final PR target, merge method and merge owner |
| Documents | Spec/plan paths, naming, document language, user chat language, doc style rules |
| Architecture | Stack, module boundaries, layering invariants, generated files, high-contention shared files |
| Commands | Exact install, lint, typecheck, unit, integration, contract, E2E, build and perf commands + cwd + pinned runtime versions |
| Test isolation | DBs, services, ports, env vars, seed strategy, parallel-lane isolation, CI workflows |
| Remote runner | Availability, launch/run/close commands, quotas/limits |
| UI | Design sources, token/design-system rules, viewports, themes, i18n, a11y standards |
| Risk areas | Project-specific `high` risk domains (augmenting defaults below) |
| Hosts | Available local/remote machines, max concurrent lanes per host, shared services never to kill |
| Done | Project definition of done for tasks and pull requests |

## Risk tiers (`standard` vs `high`)

Task risk reflects the **cost of a defect**, independent of model strength. A
task is `high` risk when touching:

- money, billing, pricing, refunds, balances, entitlements;
- authentication, authorization, permissions, sessions, secrets;
- production data shape: migrations, backfills, destructive deletes;
- core trusted calculations (scoring, grading, ranking, quotas, scheduling);
- concurrency, locking, retries or idempotency of repeatable actions;
- personal, regulated or tenant-isolated data;
- external/public contracts consumed by other teams or clients.

All other tasks are `standard`.

## Run folder & decision record

Store run state in one durable folder outside the repository and outside
disposable worktrees (using the project's convention when present, else
confirming once with the user; zero secrets):

- Phase 1: `builder-state.json`, `project-profile.md`, `decisions.md`, snapshots,
  review reports, `skill-notes.md`.
- Phase 2: `run-manifest.json`, task contracts, `<task>-evidence.json` packets,
  raw test logs, unstable-test/follow-up ledgers, `qa-report.md`.
- Versioned specs and plans live inside the repository at the project's document
  path, not in the run folder.

`decisions.md` is append-only: decision ID (`D-n`), system timestamp, question,
user's exact words, superseded ID, and updated spec/plan sections.
