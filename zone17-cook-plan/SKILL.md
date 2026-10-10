---
name: zone17-cook-plan
description: >-
  Execute a phased implementation plan with parallel worktree teams on a
  selectable harness (`zone17-cook-plan:<harness>`, default Orca),
  user-selected providers and models, autonomous worker/test/review loops,
  Jev typed decisions, immediate Advisor handling of worker completion, and
  a 15-minute recovery watchdog for interrupted workflows.
  Use for the zone17 cook-plan workflow and supervised multi-provider plan
  execution with evidence-based acceptance and requirements discovered from
  the current project. Authoring this skill alone does not start a team or a schedule.
---

# Zone17 Cook Plan

Turn a plan into small, independently deliverable features. The main session
where this skill is invoked is the initial Advisor. By default, the first
automation session takes over that role through a verified handover; subsequent
scheduled turns reuse that automation session (`--reuse-session`). Rotate to a
fresh Advisor after 10 verified compactions at the next safe boundary, or recover
in a replacement when unavailable, preserving the same Run/checkpoint and
exclusive ownership. Keep implementation moving in many small parallel
teams; do not make the Advisor monitor terminal logs or approve each routine
handoff.

## Select the harness

The harness is the runtime that starts sessions, isolates checkouts, carries
messages and schedules wakes. Read it from the invocation suffix:
`zone17-cook-plan:<harness>`, or `zone17-cook-plan :<harness>` /
`harness=<harness>` as the first argument where a colon in the skill name is
not supported. No suffix means `orca`.

Load `harness/<harness>/HARNESS.md` before step 2 below and follow its
required tools, capability map and guides wherever this skill says "the
harness". If that folder does not exist, stop and tell the user the harness is
not supported yet; never fall back to another harness silently. Record the
harness in the run manifest. One run uses one harness; resuming with a
different suffix is a question for the user, not a switch. New harnesses start
from `harness/_template/`.

## Start or resume

1. Read the plan and current host, workspace and repository requirements,
   including applicable `AGENTS.md`, `CLAUDE.md` and their referenced guides.
   Identify the current phase, actual integration branch/base commit, acceptance
   criteria and authorization. Discover required setup, checks, tracking and
   merge rules from that project; never carry another project's requirements
   into it. A phase's main branch need not be `main`; verify the merge target.
2. Load the harness's required tools and guides (Orca: `orchestration` and
   `orca-cli`, resolve their selected executable and load its version-matched
   guides). Read `typesafe-ai` and
   [Jev decisions](references/jev-decisions.md) before task dispatch; include
   the default judgment triggers and decision-record policy in team contracts.
   These are real dependencies: use the harness's runs, tasks, attempts and
   messages, not another provider's native subagents as a substitute (a lead's
   in-process subagents noted in the roster are workers inside its lane, not a
   replacement for the harness).
3. Recover an existing run before creating anything. Keep a small durable run
   manifest inside an authorized workspace, separate from disposable feature
   worktrees. Store addresses, task contracts, artifact pointers, model choices,
   scheduling state and acknowledgements. Honor the project's configured source
   of truth when one exists. Never store credentials in the manifest or global
   skill folder.
4. Ask for missing primary provider/model choices and offer optional fallbacks
   together, in the user's language, using the roster below. Reuse confirmed
   choices; a blank/skipped fallback is valid and does not block startup or
   require repeated questions. While primary answers are pending,
   read the plan, identify independent slices and prepare task contracts; do
   not launch a role with an invented model.
5. Verify the required tools, runtime/provider capabilities and environment on
   each execution host before dispatch. Apply the project's documented tracking,
   approval and completion gates when present; resolve any required tracker or
   coordination route from its current rules. A project without such a requirement
   does not need an issue key, tracking service or additional coordinator to start.
   Pass discovered requirements to workers and recheck them when moving hosts
   or checkouts.
6. Read the harness's execution guide (Orca:
   [execution](harness/orca/execution.md)) to start the first wave,
   and [Advisor events and recovery](references/advisor-checkpoint.md) before
   enabling background supervision. Verify immediate event-driven wakeup and
   the separate recovery timer before the Advisor goes dormant.
   Complete [schedule verification](references/schedule-verification.md) on the
   actual host/provider. Instructions, a saved schedule or a successful manual
   launch alone do not establish that unattended recovery works. Record partial
   or blocked verification explicitly; never report an untested timer as ready.
7. Read [Advisor operations](references/advisor-operations.md) before the first
   acceptance, pause or launch recovery. It covers the Advisor's own reruns,
   lease discipline, launch races, transient provider errors, host resources,
   pause/resume and the decision record.

## Team roster

These are role profiles, not a limit of one terminal per role. Instantiate the
same confirmed profile in multiple independent feature teams when capacity
allows. A reviewer is a separate agent instance from that feature's author.

| Role | Responsibility | Selection |
| --- | --- | --- |
| Advisor | Initial decomposition, immediate completion handling and next-task dispatch, unresolved decisions, acceptance, integration, recovery and temporary handling of roles whose list is exhausted | Initial main session, then reused automation session after handover; preserve confirmed provider/model |
| Lead | Owns one feature lane: its child Run, stage and worker dispatch, merging its workers' commits, the acceptance packet. Mode `coordinator` or `working`, see [Lead modes](#lead-modes) | Ask; also ask the default mode and optional focus |
| BE Worker | Backend implementation and fix tasks given by a lead or the Advisor | Ask |
| FE Worker | Frontend implementation and fix tasks given by a lead or the Advisor | Ask |
| BE Reviewer | Identify concrete backend bugs, regressions, risks and missing verification, by the [review method](references/review-method.md) | Ask |
| FE Reviewer | Identify frontend bugs, UX/accessibility/responsiveness risks and missing verification, by the [review method](references/review-method.md) | Ask |
| Tester | Run actual tests, capture reproducible evidence | Ask |
| Tester cloud | One fresh session per round on the project's remote test runner; drives the runner and reads its logs, edits nothing | Optional; only when the project has a runner. Unset means Tester |
| Tester visual | Stages that need a real browser, desktop windows/computer use, screenshots or visual diff; classifies deterministic diffs and scores UI quality | Optional; unset means Tester |
| Bridge lead | Local relay for a lane whose lead runs on a remote host: reads the remote lead and child Run, nudges, mirrors status and questions to the Advisor; edits nothing | Optional; only with remote hosts. Unset means the Advisor relays |
| Jev | Narrow typed judgments for everyone in the team | TypeSafe, `jev-latest` unless the user selects another available Jev model |

Write each role's profile as a comma-separated list. The first entry is the
primary and the rest are fallbacks, tried in that order; no separate fallback
setting exists. One entry is `<agent> <model> [effort]`, for example
`claude claude-sonnet-5-5 high, codex gpt-6-astra high`. A one-entry list has
no fallback. Ask for every required role's list in one question, in the user's
language; reuse confirmed lists and never invent an entry.

Provider-specific conditions (peak-hour windows, quotas, extra accounts, child
caps, launch quirks) are not part of the roster and are not asked at startup:
not every provider has them. When the user states one during the run, attach it
as a free-text note to the affected entry in the run's team rules, quoting the
user, and apply it from then on.

Keep credentials in each provider's existing configuration. Record the
execution host and available concurrency per profile when known.

### Lead modes

- `coordinator`: the lead triages, splits every failure list by area into
  disjoint fix tasks for parallel workers, merges their commits and verifies.
  It edits no product code. Above the project's large-failure threshold it
  sends the Advisor a triage plan and waits for an answer before dispatching.
- `working`: the lead also implements tasks itself and dispatches the rest to
  workers in parallel. An optional free-text `focus` says which tasks it keeps,
  for example "hard tasks first", "FE tasks", "BE tasks" or "critical path".
  Without a focus it keeps the task that blocks the most other work. It keeps
  its workers busy up to the cap between its own commits and still never
  tests or reviews its own code.

The roster sets the default mode and focus; a feature contract may override both
for its lane (`lead_mode`, `lead_focus`). A lead whose provider has in-process
subagents may use them as its workers when its roster entry notes it; they
follow the same contracts, owned paths and caps as harness workers. Workers in one
lane own disjoint paths or their own checkout; the lead merges them.

Name every session `<role>-<lane_slug> (<issue>)`, adding ` rN` for round or
retry N, with role one of `advisor`, `lead`, `worker`, `reviewer_be`,
`reviewer_fe`, `tester`, `tester_cloud`, `tester_visual` or `bridge`. Use it as
the task title and rename the terminal right after start; re-apply it when an
agent overwrites the title.

Check runtime launch support, then compare requested and effective launch
receipts. An unavailable entry moves the role to the next entry in its list.
When the list is exhausted, the Advisor temporarily performs the affected
role using its own confirmed provider/model until the primary becomes available.
Record temporary ownership and preserve the task checkpoint, evidence and
independent review. An Advisor that authored the code uses a separate reviewer
instance on the Advisor profile; it cannot self-review that code. If no eligible
instance/capacity exists, retain the affected gate as pending and continue other
ready work. Verify primary availability and hand back at a safe stage boundary;
do not restart the task or permit two simultaneous edit owners. Follow
fallback and recovery in the harness's execution guide (Orca:
[fallback and recovery](harness/orca/execution.md#fallback-and-recovery)).

## Divide for parallel progress

The Advisor chooses the unit of delivery: one plan task or one small feature
inside it. Each unit must have a bounded scope, output and observable acceptance.
Split independent units aggressively and launch the whole ready wave before
waiting. Limit concurrency only for real dependencies, editing conflicts,
environment isolation, provider limits or available resources.

Use one isolated harness worktree per independently edited unit. Record its exact
branch, base SHA, owner and environment. One worker owns edits in that checkout.
Separate cross-cutting contracts first, then parallelize their consumers.
Do not split tightly coupled work merely to increase the agent count.

Give every team a self-contained contract from
[task and message contracts](references/task-contracts.md), including the
absolute paths to applicable rules. Workers in another checkout/host do not
automatically inherit this session's instructions or installed skills.

## Autonomous feature loop

```text
Advisor assigns a bounded feature
  -> Lead implements (working mode) and dispatches Workers in parallel
  -> Tester runs checks -> Workers fix -> Tester reruns affected checks
  -> Reviewer reviews tested revision -> Worker fixes
  -> Tester verifies fixes -> Reviewer verifies revised code
  -> Advisor accepts the complete feature and controls integration
```

Reviewers follow the [review method](references/review-method.md): parallel
lenses (BMAD's when installed), then their own triage, a `full` round first and
`delta` rounds after fixes. No role runs `bmad-code-review`, `bmad-build-auto`
or `bmad-walkthrough` inside a lane; they wait for a person or orchestrate.

Repeat the inner test/fix loop until evidence is sufficient, and the outer
review/fix loop until blocking findings are resolved. Review fixes always return
through relevant testing. Preserve passing evidence for unchanged code; invalidate
evidence and reviews that no longer cover the submitted revision or environment.

Each feature has one Lead in the mode its contract names. It runs a child
run to dispatch Worker, Tester and Reviewer profiles and process their replies.
This is a routing duty, not a new decision-making role. It cannot accept its own
feature, broaden scope, merge the phase branch, or bypass project completion
gates. This structure allows feature loops to continue while the Advisor is dormant.

Cleanup is a standing duty, never a user request: leads remove each merged
fix/stage worktree, branch, database and process inside their lane as they go,
and the Advisor sweeps sessions, worktrees (every host and repository) and
per-lane data on every pass. See
[standing cleanup](references/advisor-operations.md#standing-cleanup-every-pass-unprompted).

Every `worker_done` triggers immediate handling and Advisor notification. A
child-stage completion is processed by its feature lead and relayed to Advisor
with its original event IDs; the lead continues the normal loop without waiting
for Advisor approval. A feature lead's own completion goes directly to Advisor
for acceptance or failure recovery. Never defer a completion to the timer.

Workers, testers and reviewers discuss findings through harness messages. Use
Jev by default for semantic judgments at dispatch, test/review handoffs,
next-owner selection, browser checkpoints, recovery and acceptance preparation.
Use code for known transitions and facts. Unclear requirements, disputed
findings, repeated lack of progress, cross-team conflicts and contradictory
Jev results go to the Advisor with a compact decision packet. Pause only the
affected slice.

For every handoff requiring action, verify delivery and recipient execution as
separate facts. A message enqueued, text in a composer, or `accepted: true` is
not proof that a turn started. The sender/lead or receiving wake bridge retains
delivery responsibility until start/handling evidence exists. Check promptly;
do not leave an unsubmitted prompt for the 15-minute watchdog. Follow the
submission and recovery rules in the harness's execution guide.
Use supervised starts for stage Tasks; never replace them with raw prompts.

## Jev and browser work

Follow [Jev decisions](references/jev-decisions.md) at each applicable trigger,
even when the main agent feels confident. Record a validated response, valid
cache reference or explicit omission/failure reason; never silently bypass it.
Focus on classification, screening, routing and quick bounded judgments.
Use `TYPESAFE_API_KEY` from the environment without printing it. Ask only narrow
Choice/Noul/Score questions, batch independent questions sharing the same state,
and send minimal sanitized context. Jev can classify tasks, screen candidates,
attach feedback, flag possible duplicates, compare evidence with acceptance
criteria, suggest the next eligible role, and interpret browser observations.
Reuse fresh judgments for unchanged evidence. Record actual requests and
decision outcomes in checkpoints and report Jev's contribution before sleep.
Service failures use the documented fallback; do not claim a call succeeded.

All browser interaction uses the harness's browser (Orca: the embedded browser
through the Orca CLI). Tester owns
its page IDs and follows snapshot -> interaction -> fresh snapshot. Jev can
select an observed candidate or interpret a message; it cannot invent page
elements, replace actual browser actions or declare a test passed.

Contracts mark which stages are visual. That covers browser e2e,
render/fidelity, theme/zoom/responsive layout and packaged desktop runs. Those
stages go to the Tester visual profile when one is set; otherwise they go to
the Tester. Either way the stage follows
[visual testing](references/advisor-operations.md#visual-testing): a
deterministic diff comes first, the model only classifies it, and screenshots
never prove save, permission or data-isolation behaviour.

## Advisor acceptance and completion

The Advisor handles `worker_done` as soon as it arrives: wake it if dormant, or
queue the event for its next safe boundary if already active. Drain queued
events before yielding; do not wait for a batch window or schedule tick. Handle
both success and failure, record child-stage progress without taking over its
lead's routing, and accept completed features or arrange recovery as needed.
Assign newly ready phase tasks in the same turn when capacity permits.

The single timer, due approximately 15 minutes after Advisor's own last activity,
is only a recovery watchdog for interrupted teams, missed event delivery or a
stalled handoff. It is not the normal acceptance or task-dispatch mechanism.
Member heartbeats do not reset it. Recover from durable checkpoints and proven
runtime state; silence alone never authorizes a duplicate editor.

Accept only after checking the submitted revision, actual test/browser results,
resolved review findings, acceptance criteria, remaining risks and any evidence
required by the project's completion rules.
Jev scores and `worker_done` are not acceptance, test evidence or merge authority.
Before integrating, the Advisor reruns the affected checks on the merge result
itself; a Tester pass never replaces that run. A Tester report counts only
when it carries command, exit code, raw log and tested SHA for each check.
Review any delta committed after the last Reviewer pass. Withhold acceptance
while any criterion was never actually executed, and send the gap back to the
same lead. Details are in
[Advisor operations](references/advisor-operations.md#acceptance).
The Advisor decides whether the feature is complete. Integrate only through the
authorized phase branch workflow and honor repository rules reserving merges for
humans. If a human merge is required, report ready-for-merge and retain work.

After integration, verify required checks on the resulting branch. Preserve
evidence outside disposable worktrees, confirm commits are reachable, settle
all Dispatches, release/retain their resources explicitly, and remove only the
accepted task's clean worktree through the harness. Do not force-delete dirty, live,
unmerged or unverifiable work. Record final evidence through the project's
required reporting route when configured; honor its completion permissions.

Treat the user-facing report as a terminal condition of every actual Advisor
pass, not optional narration. Before ending the turn, persist the checkpoint,
final activity/rearm state and a stable `advisor_report_id` with
`report_status: prepared`; then check the per-session compaction count. Follow
[Advisor rotation](references/advisor-checkpoint.md#rotate-after-10-compactions)
when the threshold is reached; report unknown counts or blocked handovers.

The non-empty final response must be the progress report and carry that report
ID. It gives a complete phase view grouped as `done`, `in progress`, `not
started` and `blocked`, naming every task/feature, owner/team, stage, dependency
or blocker and next action. Include newly assigned/next-ready work, evidence and
pending acceptance, verified schedule state and the next expected wake.

Always report the phase completion percentage from a durable, versioned progress
ledger. The numerator counts only Advisor-accepted task/feature weight; the
denominator is total scoped weight. Establish weights when decomposing the plan,
use explicitly labelled equal weights when no better estimate exists, and keep a
parent's weight constant when splitting it among children. Never invent a
percentage from elapsed time, message counts or subjective confidence; report
an unknown percentage and the missing basis until the ledger is established.
Report scope/denominator changes explicitly.

Report even when no progress changed; do not imply that yielding completes the
phase. Checkpoint writes, tracker comments, schedule rearm, lease release and
conversation recap do not satisfy this condition. If execution stops after
preparation but before a matching final response is observable, leave the report
pending; the next Advisor wake reconciles the prior transcript/output and sends
the prepared report once when missing. Follow the reporting, progress accounting
and deduplication contract in
[Advisor events and recovery](references/advisor-checkpoint.md).

Disable the run's schedule when the phase finishes or the user pauses it.
For completion, also report integration, cleanup and unresolved work. A
checkpoint that yields the Advisor session is a suspended run, never a claim
that the phase or its active Dispatches have finished.
