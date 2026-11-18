# Project profile

The builder works in any project, so it starts by learning this one. Write what
you learn to `project-profile.md` in the run folder and give its path to every
reviewer, lead, worker and tester. They run in other sessions and other
checkouts and inherit nothing from this conversation.

## Rules for the profile

- Every fact carries its source: a file and line, a command you ran with its
  output, or the user's words with a timestamp.
- A fact you could not find is written as `unknown`, with who can answer. Ask
  the user for the ones that block the current phase. Never guess, and never
  reuse a value from another project because it "is usually like that".
- The project's own rules win over this skill wherever they are stricter.
  Where they say nothing, this skill's defaults apply.
- Re-check the profile when the run moves to another host or checkout, and when
  the project's rule files change.

## What to discover

Read the project's agent and contributor instructions first (`AGENTS.md`,
`CLAUDE.md`, `CONTRIBUTING.md`, `README`, and every file they point to), then
the build and CI configuration, then the code layout.

| Area | Find out |
| --- | --- |
| Rules | Rule files and their order of precedence; things agents must never do; files only certain people or roles may edit |
| Authorization | What the agent may do without asking: commit, push, open a PR, merge, change tracker status. Default when unstated: ask before each |
| Tracking | Tracker and its rules, if any: whether work needs an issue first, status flow, where evidence is recorded. No tracker rule means none is required |
| Branches | Default branch, integration or release branches, naming, the merge target for this work, merge method, who merges |
| Documents | Where specs and plans live, naming, language of documents, language the user speaks, documentation style rules |
| Architecture | Stack, modules and their boundaries, layering rules, generated code that must not be hand-edited, shared files many tasks touch |
| Commands | Install, lint, typecheck, unit, integration, end-to-end, build, performance and any other check, each with its working directory and toolchain version |
| Test environment | Databases, services and ports tests need; how to isolate parallel runs; test data and seeds; what CI runs and on which branches |
| Remote test runner | Whether one exists, its commands, cost and limits, how to close it |
| UI | Design sources, design-system rules, supported viewports, themes, languages, accessibility requirements |
| Risk areas | Domains this project treats as high risk (see below), plus any the user names |
| Hosts | Machines available, their capacity limits, shared services that must not be stopped |
| Done | The project's own definition of done for a task and for a pull request |

## Risk tiers

The plan gives each task a tier, and the tier decides which extra checks run in
phase 2. Start from this default and adjust it to the project; record the
project's list in the profile so authors, reviewers and testers use the same one.

A task is `high` when it changes any of:

- money: prices, payments, refunds, balances, entitlements;
- authentication, authorization, sessions, secrets;
- existing data: schema or data migrations, deletes, backfills;
- a core business calculation the product is trusted for (scoring, billing,
  ranking, quotas, scheduling);
- concurrency or idempotency of an operation that can be sent twice;
- personal or regulated data;
- a contract other teams or systems consume.

Everything else is `standard`. A tier is about the cost of being wrong, not
about how hard the task is or how good the model doing it is.

## Run folder

One durable folder holds the run's state: `builder-state.json`, the profile,
the decision record, review reports, snapshots, and in phase 2 the cook
manifest, contracts, reports and evidence.

- Use the project's convention when it has one, including where earlier runs
  of this skill put theirs.
- Otherwise propose a folder outside the repository and outside any disposable
  worktree, and confirm it with the user once.
- Never put credentials, tokens, cookies or keys in it.
- Documents the project versions (specs, plans) live in the repository at the
  project's document location, not in the run folder.

## Decision record

One file in the run folder, append-only. Each entry: an ID, the system time,
the question, the user's answer in their own words, what it supersedes, and the
document sections it changed. A decision that changes a gate already passed
needs the user's confirmation first.
