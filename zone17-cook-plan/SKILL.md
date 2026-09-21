---
name: zone17-cook-plan
description: >-
  Execute a phased implementation plan with parallel Orca worktree teams,
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

## Start or resume

1. Read the plan and current host, workspace and repository requirements,
   including applicable `AGENTS.md`, `CLAUDE.md` and their referenced guides.
   Identify the current phase, actual integration branch/base commit, acceptance
   criteria and authorization. Discover required setup, checks, tracking and
   merge rules from that project; never carry another project's requirements
   into it. A phase's main branch need not be `main`; verify the merge target.
2. Read `orchestration` and `orca-cli`, resolve their selected Orca executable,
   and load its version-matched guides. Read `typesafe-ai` and
   [Jev decisions](references/jev-decisions.md) before task dispatch; include
   the default judgment triggers and decision-record policy in team contracts.
   These are real dependencies: use Orca Runs, Tasks, Dispatches and messages,
   not another provider's native subagents as a substitute.
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
6. Read [Orca execution](references/orca-execution.md) to start the first wave,
   and [Advisor events and recovery](references/advisor-checkpoint.md) before
   enabling background supervision. Verify immediate event-driven wakeup and
   the separate recovery timer before the Advisor goes dormant.
   Complete [schedule verification](references/schedule-verification.md) on the
   actual host/provider. Instructions, a saved schedule or a successful manual
   launch alone do not establish that unattended recovery works. Record partial
   or blocked verification explicitly; never report an untested timer as ready.

## Team roster

These are role profiles, not a limit of one terminal per role. Instantiate the
same confirmed profile in multiple independent feature teams when capacity
allows. A reviewer is a separate agent instance from that feature's author.

| Member | Responsibility | Provider/model selection |
| --- | --- | --- |
| Advisor | Initial decomposition, immediate completion handling and next-task dispatch, unresolved decisions, acceptance, integration, recovery and temporary handling of roles without an available fallback | Initial main session, then reused automation session after handover; preserve confirmed provider/model |
| Member 1: BE Worker | Backend implementation and fixes; coordinates its feature team | Ask primary provider/model and optional BE Worker fallback provider/model |
| Member 2: FE Worker | Frontend implementation and fixes; coordinates its feature team | Ask primary provider/model; fallback is the optional Fallback FE Worker profile below |
| Member 3: BE Reviewer | Identify concrete backend bugs, regressions, risks and missing verification | Ask primary provider/model and optional BE Reviewer fallback provider/model |
| Member 4: FE Reviewer | Identify frontend bugs, UX/accessibility/responsiveness risks and missing verification | Ask primary provider/model; fallback is the optional Fallback FE Reviewer profile below |
| Member 5: Tester | Run actual tests, operate Orca browser, capture reproducible evidence | Ask |
| Fallback FE Worker | Optional fallback for Member 2 | Ask optionally; unset means Advisor handles the role temporarily |
| Fallback FE Reviewer | Optional fallback for Member 4; retain independent review | Ask optionally; unset means Advisor handles the role temporarily |
| Jev | Narrow typed judgments for everyone in the team | TypeSafe, `jev-latest` unless the user selects another available Jev model |

Collect `provider/agent`, exact `model`, optional supported `effort`, execution
host, and available concurrency for each selected profile. All fallback choices
are optional; record an unset fallback as `null`, not an unanswered requirement.
Member 1 and Member 3 have their own BE fallbacks; Member 2 and Member 4 use
Fallback FE Worker and Fallback FE Reviewer respectively, without another
duplicate FE fallback setting. The previously mentioned `claude-opus-5` and
`terra` remain optional FE Worker candidates, not automatic defaults. If chosen,
confirm their exact provider/model mappings and order. Keep credentials in each
provider's existing configuration.

Check runtime launch support, then compare requested and effective launch
receipts. An unavailable primary uses its configured fallback. If that fallback
is unset or also unavailable, the Advisor temporarily performs the affected
role using its own confirmed provider/model until the primary becomes available.
Record temporary ownership and preserve the task checkpoint, evidence and
independent review. An Advisor that authored the code uses a separate reviewer
instance on the Advisor profile; it cannot self-review that code. If no eligible
instance/capacity exists, retain the affected gate as pending and continue other
ready work. Verify primary availability and hand back at a safe stage boundary;
do not restart the task or permit two simultaneous edit owners. Follow
[fallback and recovery](references/orca-execution.md#fallback-and-recovery).

## Divide for parallel progress

The Advisor chooses the unit of delivery: one plan task or one small feature
inside it. Each unit must have a bounded scope, output and observable acceptance.
Split independent units aggressively and launch the whole ready wave before
waiting. Limit concurrency only for real dependencies, editing conflicts,
environment isolation, provider limits or available resources.

Use one isolated Orca worktree per independently edited unit. Record its exact
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
  -> Worker implements
  -> Tester runs checks -> Worker fixes -> Tester reruns affected checks
  -> Reviewer reviews tested revision -> Worker fixes
  -> Tester verifies fixes -> Reviewer verifies revised code
  -> Advisor accepts the complete feature and controls integration
```

Repeat the inner test/fix loop until evidence is sufficient, and the outer
review/fix loop until blocking findings are resolved. Review fixes always return
through relevant testing. Preserve passing evidence for unchanged code; invalidate
evidence and reviews that no longer cover the submitted revision or environment.

The assigned worker is also its feature's coordination lead. It may run a child
Orca Run to dispatch Tester and Reviewer profiles and process their replies.
This is a routing duty, not a new decision-making role. It cannot accept its own
feature, broaden scope, merge the phase branch, or bypass project completion
gates. This structure allows feature loops to continue while the Advisor is dormant.

Every `worker_done` triggers immediate handling and Advisor notification. A
child-stage completion is processed by its feature lead and relayed to Advisor
with its original event IDs; the lead continues the normal loop without waiting
for Advisor approval. A feature lead's own completion goes directly to Advisor
for acceptance or failure recovery. Never defer a completion to the timer.

Workers, testers and reviewers discuss findings through Orca messages. Use
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
submission and recovery rules in [Orca execution](references/orca-execution.md).
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

All browser interaction uses Orca CLI and Orca's embedded browser. Tester owns
its page IDs and follows snapshot -> interaction -> fresh snapshot. Jev can
select an observed candidate or interpret a message; it cannot invent page
elements, replace actual browser actions or declare a test passed.

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
The Advisor decides whether the feature is complete. Integrate only through the
authorized phase branch workflow and honor repository rules reserving merges for
humans. If a human merge is required, report ready-for-merge and retain work.

After integration, verify required checks on the resulting branch. Preserve
evidence outside disposable worktrees, confirm commits are reachable, settle
all Dispatches, release/retain their resources explicitly, and remove only the
accepted task's clean worktree through Orca. Do not force-delete dirty, live,
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
