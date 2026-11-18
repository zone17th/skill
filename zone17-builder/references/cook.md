# Phase 2: Cook

Read this file when the builder enters the cook phase (gate G3 in
[SKILL.md](../SKILL.md)). The phase needs an approved plan (gate G2), the
user's explicit word to start, and the [project profile](project-profile.md).
Run `node <skill-root>/scripts/plan-lint.mjs <plan>` once more before the
first dispatch: a plan edited after approval goes back through
[document review](doc-review.md) first.

Turn a plan into small, independently deliverable features. The main session
where this skill is invoked is the initial Advisor. By default, the first
automation session takes over that role through a verified handover; subsequent
scheduled turns reuse that automation session (`--reuse-session`). Hand over to
a replacement Advisor when it is unavailable or the user asks, preserving the same Run/checkpoint and
exclusive ownership. Keep implementation moving in many small parallel
teams; do not make the Advisor monitor terminal logs or approve each routine
handoff.

## Select the harness

The harness is the runtime that starts sessions, isolates checkouts, carries
messages and schedules wakes. Read it from the invocation argument
`harness=<harness>` (`zone17-builder cook harness=<harness>`). No argument
means `orca`.

Load `../harness/<harness>/HARNESS.md` before step 2 below and follow its
required tools, capability map and guides wherever this skill says "the
harness". If that folder does not exist, stop and tell the user the harness is
not supported yet; never fall back to another harness silently. Record the
harness in the run manifest. One run uses one harness; resuming with a
different harness is a question for the user, not a switch. New harnesses start
from `../harness/_template/`.

## Start or resume

1. Read the approved plan, the spec it implements, the
   [project profile](project-profile.md) written in phase 1 (write it now when
   the plan came from elsewhere) and current host, workspace and repository requirements,
   including applicable `AGENTS.md`, `CLAUDE.md` and their referenced guides.
   Identify the current phase, actual integration branch/base commit, acceptance
   criteria and authorization. Discover required setup, checks, tracking and
   merge rules from that project; never carry another project's requirements
   into it. A phase's main branch need not be `main`; verify the merge target.
2. Load the harness's required tools and guides (Orca: `orchestration` and
   `orca-cli`, resolve their selected executable and load its version-matched
   guides). Read `typesafe-ai` and
   [Jev decisions](jev-decisions.md) before task dispatch; include
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
   [execution](../harness/orca/execution.md)) to start the first wave,
   and [Advisor events and recovery](advisor-checkpoint.md) before
   enabling background supervision. Verify immediate event-driven wakeup and
   the separate recovery timer before the Advisor goes dormant.
   Complete [schedule verification](schedule-verification.md) on the
   actual host/provider. Instructions, a saved schedule or a successful manual
   launch alone do not establish that unattended recovery works. Record partial
   or blocked verification explicitly; never report an untested timer as ready.
7. Read [Advisor operations](advisor-operations.md) before the first
   acceptance, pause or launch recovery. It covers the Advisor's own reruns,
   lease discipline, launch races, transient provider errors, host resources,
   pause/resume and the decision record.
8. Read [QA and QC](qa-qc.md) before writing the first task contract. It adds
   the per-task quality checks, the wave gate, the final QA task and the final
   pull request that closes this phase.

## Team roster

These are role profiles, not a limit of one terminal per role. Instantiate the
same confirmed profile in multiple independent feature teams when capacity
allows. A reviewer is a separate agent instance from that feature's author.

| Role | Responsibility | Selection |
| --- | --- | --- |
| Advisor | Initial decomposition, immediate completion handling and next-task dispatch, unresolved decisions, acceptance, integration, recovery and temporary handling of roles whose list is exhausted | Initial main session, then reused automation session after handover; preserve confirmed provider/model |
| Lead | Owns exactly ONE plan task, which is its lane (see [One lead per plan task](#one-lead-per-plan-task)): its child Run, stage and worker dispatch, merging its workers' commits, the acceptance packet; closes after the Advisor settles that task. Mode `coordinator` or `working`, see [Lead modes](#lead-modes) | Ask; also ask the default mode and optional focus |
| BE Worker | Backend implementation and fix tasks given by a lead or the Advisor | Ask |
| FE Worker | Frontend implementation and fix tasks given by a lead or the Advisor | Ask |
| BE Reviewer | Identify concrete backend bugs, regressions, risks and missing verification, by the [review method](review-method.md) | Ask |
| FE Reviewer | Identify frontend bugs, UX/accessibility/responsiveness risks and missing verification, by the [review method](review-method.md) | Ask |
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
lane edit in the lead's worktree by default (a coordinator lead codes nothing, so
the checkout is free): one editing worker there at a time, or several on disjoint
paths that never commit concurrently. Only a worker that must edit in parallel
with another, on overlapping paths or with its own builds/tests, gets its own
checkout; the lead merges it and removes it at once. See
[Worktree budget](#worktree-budget).

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
[fallback and recovery](../harness/orca/execution.md#fallback-and-recovery)).

### One lead per plan task

User rule (2026-11-05): a lead leads exactly the one plan task it is assigned.
It is not a long-lived owner of a PBI or of a group of tasks.

- **Unit.** One lead per plan task (for example `P6-T11`, or `UNI-2468`), or per
  follow-up ticket the Advisor files. Several tiny tasks of the plan may share a
  lead only when the plan itself groups them into one task.
- **Lifetime.** The lead starts when the Advisor dispatches the task. It runs
  the worker → tester ∥ reviewer → fix-round loop and sends the acceptance
  packet. It closes once the Advisor accepts the task or reassigns it. Closing
  means: stage sessions released, task worktrees removed, branch kept, final
  STATUS line written.
- **No reuse.** A finished lead never takes another task. The next task gets a
  fresh lead with a small context. Decisions that must carry over go into the
  next lead's contract, not into its memory.
- **Integration is a task too.** Merging accepted tasks into a phase or verify
  branch, an E2E run, or a rerun campaign each gets its own lead under the same
  rule.
- **Concurrency.** Run as many task leads at once as the ready wave, editing
  conflicts and host resources allow (see [Divide for parallel progress](#divide-for-parallel-progress)).
  Queue the rest in the Advisor's ready list and start one as soon as a slot
  frees. Place leads on whichever host has capacity.
- **Advisor bookkeeping.** Keep one row per live lead: task, lead terminal,
  host, branch/base SHA, stage, and channel (Orca mail, or an inbox file for a
  remote host). Sweep closed leads on every pass.

## Divide for parallel progress

The Advisor chooses the unit of delivery: one plan task or one small feature
inside it. Each unit has its own lead ([One lead per plan task](#one-lead-per-plan-task)). Each unit must have a bounded scope, output and observable acceptance.
Split independent units aggressively and launch the whole ready wave before
waiting. Limit concurrency only for real dependencies, editing conflicts,
environment isolation, provider limits or available resources.

Use one isolated harness worktree per independently edited unit. Record its exact
branch, base SHA, owner and environment. One worker owns edits in that checkout.
Separate cross-cutting contracts first, then parallelize their consumers.
Do not split tightly coupled work merely to increase the agent count.

### Worktree budget

Spawn a worktree or session only when no existing one can do the job. Before
every `--worktree new-*` or new session, name the reason in the contract
(parallel editor, different repo/host, a lane head); "a new stage round" is never
a reason.

- A lane is one plan task. It owns its head worktree (the lead's), and workers
  edit there by default. The worktree is removed when the task's lead closes.
- Testers, cloud testers, visual testers and reviewers edit nothing. They run in
  the lead's checkout while editing pauses, or in ONE standing read-only stage
  checkout per lane that each round re-points (`git checkout --detach <sha>`).
  Never one checkout per stage, role or round.
- A second worker that must edit in parallel gets its own checkout; it is removed
  as soon as its commit is merged into the lane.
- Cap: lane head + one stage checkout + live parallel editors, at most 5 per lane.
  The Advisor counts worktrees per lane on every host each pass and removes
  merged extras ([standing cleanup](advisor-operations.md#standing-cleanup-every-pass-unprompted)).
- The same rule holds for sessions: reuse a settled stage session's slot (release
  it first) rather than leaving it idle, and do not start a session for work an
  existing live session of the same role and lane can take.

Give every team a self-contained contract from
[task and message contracts](task-contracts.md), including the
absolute paths to applicable rules. Workers in another checkout/host do not
automatically inherit this session's instructions or installed skills.

## Autonomous feature loop

```text
Advisor assigns a bounded feature (the contract carries the plan task's
                                   test plan, impact rows and risk tier)
  -> Lead implements (working mode) and dispatches Workers in parallel
  -> Tester runs checks, the regression scope and the QC proofs
  -> Workers fix -> Tester reruns affected checks
  -> Reviewer reviews tested revision -> Worker fixes
  -> Tester verifies fixes -> Reviewer verifies revised code and test changes
  -> Advisor accepts the complete feature and controls integration
  -> wave gate on the integration branch when the wave's last task merges
  -> final QA task -> final pull request (the run ends here)
```

The quality checks named above are defined in [QA and QC](qa-qc.md). They are
part of the loop for every task, whatever model fills a role: a strong model
changes how detailed a contract must be, never which checks run.

Reviewers follow the [review method](review-method.md): parallel
lenses (bundled under `lenses/`), then their own triage, a `full` round first and
`delta` rounds after fixes. No role runs `bmad-code-review`, `bmad-build-auto`
or `bmad-walkthrough` inside a lane; they wait for a person or orchestrate.

Repeat the inner test/fix loop until evidence is sufficient, and the outer
review/fix loop until blocking findings are resolved. Review fixes always return
through relevant testing. Preserve passing evidence for unchanged code; invalidate
evidence and reviews that no longer cover the submitted revision or environment.
A small finding whose fix needs no new test or review round is fixed at once by
the lead or Advisor through an in-process subagent, not by another lane round; see
[small findings](advisor-operations.md#small-findings).

Each plan task has one Lead in the mode its contract names. It runs a child
run to dispatch Worker, Tester and Reviewer profiles and process their replies.
This is a routing duty, not a new decision-making role. It cannot accept its own
feature, broaden scope, merge the phase branch, or bypass project completion
gates. This structure allows feature loops to continue while the Advisor is dormant.

Cleanup is a standing duty, never a user request: leads remove each merged
fix/stage worktree, branch, database and process inside their lane as they go,
and the Advisor sweeps sessions, worktrees (every host and repository) and
per-lane data on every pass. See
[standing cleanup](advisor-operations.md#standing-cleanup-every-pass-unprompted).

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

Follow [Jev decisions](jev-decisions.md) at each applicable trigger,
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
[visual testing](advisor-operations.md#visual-testing): a
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
[Advisor operations](advisor-operations.md#acceptance). The QC conditions in
[QA and QC](qa-qc.md#qc-per-task) are acceptance conditions too.
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
`report_status: prepared`; report any pending or blocked
[Advisor handover](advisor-checkpoint.md#hand-over-to-a-replacement-advisor).

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

The percentage stays on the plan's scope. Work outside the plan (user bugs,
extra requests) does not enter its denominator; it is reported beside it as
accepted/total counts. Only when the user asks to update the plan does that work
join the plan scope and the percentage get recomputed. Show counts with the
percentage, for example `plan 86.6% (71/82) · outside plan 32/65`.

Report even when no progress changed; do not imply that yielding completes the
phase. Checkpoint writes, tracker comments, schedule rearm, lease release and
conversation recap do not satisfy this condition. If execution stops after
preparation but before a matching final response is observable, leave the report
pending; the next Advisor wake reconciles the prior transcript/output and sends
the prepared report once when missing. Follow the reporting, progress accounting
and deduplication contract in
[Advisor events and recovery](advisor-checkpoint.md).

Disable the run's schedule when the phase finishes or the user pauses it.
For completion, also report integration, cleanup and unresolved work. A
checkpoint that yields the Advisor session is a suspended run, never a claim
that the phase or its active Dispatches have finished.

## Where the run ends

The run ends when the plan's final pull request is open with the QA report
attached, or reported ready when the project reserves opening it for a person
([QA and QC](qa-qc.md#final-pull-request)). Merging that pull request,
deploying and releasing are outside this skill. Do them only when the user
asks, as a separate request under the project's own rules. Task pull requests
into the integration branch are still merged as the plan's authorization says.
