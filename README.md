# Zone17 Skills

Reusable agent skills for multiple providers. Skills live in their own folders
with a `SKILL.md` entrypoint and supporting references.

## Available skills

### [zone17-cook-plan](zone17-cook-plan/SKILL.md)

Execute a phased implementation plan with parallel Orca teams in isolated
worktrees. Choose providers and models for backend/frontend workers, independent
reviewers and testers when starting the plan. Fallbacks are optional: ask for
BE Worker/Reviewer fallbacks; FE Worker/Reviewer use their dedicated fallback
profiles. When a fallback is unset or unavailable, Advisor handles the role
temporarily until the primary provider/model is ready, preserving independent
review and handing back at a safe stage boundary.

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
  Tracking and completion requirements come from the current project's rules.

## Install globally

With the Skills CLI, select the agents that should receive the skill:

```sh
npx skills add zone17th/skill --skill zone17-cook-plan --global
```

For a manual installation, clone this repository and copy `zone17-cook-plan/`
into `~/.agents/skills/`. Providers that do not discover that shared directory
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
