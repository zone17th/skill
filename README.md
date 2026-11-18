# Zone17 Skills

Reusable agent skills for multiple providers. Skills live in their own folders
with a `SKILL.md` entrypoint and supporting references.

## Available skills

### [zone17-builder](zone17-builder/SKILL.md)

Take a piece of work from request to final pull request in two phases, with a
human gate before each step that commits the team to something. It works in any
project: commands, rules, tracking and risk areas are read from the current
project into a profile for each run.

- **Phase 1, documents.** The current session writes a spec, then an
  implementation plan. An independent reviewer on a model you choose reviews
  each with bundled lenses and bounded rounds; unclear points come back to you
  as questions with a recommendation; you approve the spec, then the plan.
- **Plans are built to be executed and tested.** One pipeline table (hard and
  soft dependencies, waves, weights, risk), and per task the impact outside the
  task with a check for each affected thing, and a test plan covering every
  acceptance criterion. `scripts/plan-lint.mjs` checks this mechanically.
- **Phase 2, cook.** The `zone17-cook-plan` workflow, plus QC on every task
  (planned tests ran, regression scope, tests shown failing before the change,
  reviewed test changes, test counts against the base, rules for unstable
  tests), a gate on the integration branch after each wave, and a final QA
  task with a QA report.
- **It stops at the final pull request.** Merging it, deploying and releasing
  are separate requests.
- **Existing documents** can be adopted instead of rewritten
  ([adopt](zone17-builder/references/adopt.md)).
- **It improves with use.** The Advisor keeps notes on the process during a
  run, sorts them at the end and proposes changes; approved ones land here with
  a [changelog](zone17-builder/CHANGELOG.md) entry
  ([how](zone17-builder/references/improvement.md)).

The review lenses under `zone17-builder/references/lenses/` include files
copied from [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) under
its MIT licence (notice in `LICENSE-BMAD.txt` there), so neither the project nor
the host needs BMAD installed. `zone17-builder` carries its own copy of the cook
workflow and does not need `zone17-cook-plan` installed; the two can be
installed side by side.

Invoke it as `zone17-builder [spec | plan | cook | status] [harness=<name>]`.
It needs Node.js for the plan lint, and for the cook phase the same tools as
`zone17-cook-plan` below.

### [zone17-cook-plan](zone17-cook-plan/SKILL.md)

Execute a phased implementation plan with parallel teams in isolated
worktrees, on Orca by default or another harness. Choose providers and models per role when starting the plan: lead,
backend/frontend workers, independent reviewers and testers, plus optional
cloud tester, visual tester and bridge lead. Each role is a comma-separated
list, primary first and fallbacks after it. Leads run in `coordinator` mode
(triage and dispatch only) or `working` mode (implement too, with an optional
focus such as "hard tasks" or "FE tasks"). When a list is exhausted, Advisor
handles the role temporarily, preserving independent review and handing back
at a safe stage boundary. Provider conditions such as peak hours or quotas are
added as notes when they come up, not asked at startup.

- Advisor decomposes work, resolves escalations, accepts features and controls
  authorized integration. Independent teams run their own test/fix/review loops.
- Completion events request immediate Advisor handling. Newly eligible tasks
  can start while other teams continue; there is no batch completion barrier.
- A watchdog runs after roughly 15 minutes of Advisor inactivity to recover
  interrupted supervision, missed events and stalled handoffs, and dispatch
  eligible work.
- Scheduled turns reuse the automation's own Advisor session by default
  (`--reuse-session`). The initial session hands over once; an unavailable
  automation session is replaced through checkpoint recovery on the same Run.
- Before every Advisor sleep/yield, report completed and active work, blockers,
  dispatch decisions and the verified next wake, including passes with no change.
- Handoffs verify recipient execution separately from message delivery. Prompts
  left unsubmitted are recovered without blindly resending or pressing Enter.
- Jev handles classification, screening, routing and quick typed judgments by
  default in task dispatch, test/review handoffs, browser work and acceptance.
  Record outcomes, valid cache reuse or explicit omission reasons, and summarize
  actual usage before Advisor sleep. Real evidence and Advisor acceptance remain required.
- The Advisor reruns affected checks on every merge result itself. It rejects
  Tester reports that lack command, exit code, log and SHA, and withholds
  acceptance while any criterion was never executed. Field-tested operating
  rules are in [Advisor operations](zone17-cook-plan/references/advisor-operations.md):
  - lease discipline and coordinator drift
  - fresh-worktree launch races and `ask` timeouts
  - nudge-not-fallback for transient provider errors
  - host resource limits
  - pause/resume and the decision record
- Reviewers follow the [review method](zone17-cook-plan/references/review-method.md):
  parallel lenses (BMAD's `bmad-review` lenses when installed, plus an FE
  quality lens), their own verify-and-grade triage, a full first round and
  delta rounds after fixes. Interactive BMAD workflows never run inside a lane.
- An optional Tester visual profile takes browser, desktop-window, screenshot
  and visual-diff stages; an optional Tester cloud profile takes rounds on the
  project's remote test runner. A deterministic diff comes first and the model only
  classifies it. When the profile is unset, the Tester runs every test stage.
  Tracking and completion requirements come from the current project's rules.

### Harnesses

The skill core is harness-neutral; each runtime lives in
`zone17-cook-plan/harness/<name>/` with a `HARNESS.md` capability map and an
execution guide. Select one with `zone17-cook-plan:<name>` (or
`zone17-cook-plan :<name>` where the agent does not accept a colon in the skill
name). No suffix means `orca`, the only harness today. An unknown harness stops
the run instead of falling back. Add a new one by copying
`harness/_template/`.

## Install globally

With the Skills CLI, select the agents that should receive the skill:

```sh
npx skills add zone17th/skill --skill zone17-cook-plan --global
npx skills add zone17th/skill --skill zone17-builder --global
```

For a manual installation, clone this repository and copy the skill's folder
(`zone17-cook-plan/`, `zone17-builder/`) into `~/.agents/skills/`. Providers that do not discover that shared directory
need a link or copy in their own supported global skills directory. Restart or
reload the provider session if needed. `agents/openai.yaml` is optional Codex
interface metadata; the skill instructions do not depend on it.

## Requirements and use

Install Orca and make its CLI available. The execution environment must also
provide the `orca-cli`, `orchestration` and `typesafe-ai` skills; these external
dependencies are not bundled here. Follow their current version-matched guides
for supported providers, models, supervision and browser operations.

Provide `TYPESAFE_API_KEY` through the environment for Jev decisions. At startup
and when moving to another host or checkout, read its applicable agent/project
rules and verify required setup, tools, tests, permissions and reporting routes.
Tracking services, issue keys and extra coordination roles apply only when the
current project requires them. Keep project-specific requirements in that
project; this skill defines the shared execution flow across projects.

Ask your agent to use `zone17-cook-plan` with your plan, phase and acceptance
criteria. On agents supporting named skill invocation, use `$zone17-cook-plan`.
Missing provider/model choices are collected before workers launch.

Installing the skill does not start workers, create schedules or install a
background service. At plan startup, the Advisor must verify the runtime's
immediate wake route and recovery timer. A Markdown skill alone cannot provide
those runtime capabilities.

Follow the [schedule verification procedure](zone17-cook-plan/references/schedule-verification.md)
before claiming unattended operation: an actual timed launch must bind the
correct Run, complete a recovery pass and rearm successfully. Saved schedules,
manual launches and automation status labels alone are insufficient.
