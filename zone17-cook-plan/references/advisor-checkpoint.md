# Advisor events and recovery watchdog

## Default: reuse the automation session

Use session mode 2 by default: an existing-workspace Orca automation with
`--reuse-session`. If the user creates the schedule from session A, its first
run creates session B. After verified handover, B owns the Advisor role and
later scheduled turns continue in B until it is unavailable or a verified
threshold handover replaces it. A stops phase coordination after the transfer.
On an existing automation, reuse its actual
prior available session instead of creating another bootstrap session.

Record the initial session, current Advisor session/handle, automation ID and
current Run generation. Completion-event and decision wakes target the current
Advisor owner. Keep A's event route active until B is bound and its wake route
verified; then switch atomically, reconciling pending events by their original
IDs. Initial completions still receive immediate handling rather than waiting
for the first schedule tick. Only one session may consume or mutate the Run.

If B is no longer available, Orca may create session C. C must recover the
durable checkpoint and establish exclusive authority over the same Run before
doing work. Verify previous-owner release/fencing and refresh the event route;
missing connectivity alone never authorizes a second active Advisor. Preserve
the confirmed Advisor provider/model and verify the effective launch settings.

Creating a fresh session every tick (mode 1) or pinning the invoking session A
(mode 3) requires an explicit user choice. `--reuse-session` does not attach to
A. If mode 2 is unsupported, report the limitation instead of silently choosing
another mode. These session rules leave the 15-minute inactivity deadline and
immediate completion handling unchanged.

## Rotate after 10 compactions

Default `max_compactions_per_advisor_session` is **10**. This counts actual
context compactions in one provider conversation, not turns, schedule ticks,
checkpoints or worker compactions. At `count >= 10`, mark rotation pending and
handover at the next safe boundary before normal sleep. Finish an in-flight
merge, acceptance write or dispatch transaction first; do not wait for all
independent workers or the 15-minute timer. A delayed handover may exceed 10;
keep the count and report the blocker rather than resetting it.
Pending rotation does not revoke the current owner's authority; it continues
necessary event handling until the exclusive handover succeeds.

Use a supported provider/runtime compaction counter or explicit compaction
events tied to the actual session ID. Persist the count, source and event cursor
in the durable manifest; deduplicate replayed events. Reloading, resuming or
compacting that same session does not reset its count. If attaching mid-session,
recover its earlier evidence; an incomplete event history is a lower bound,
not proof of zero. A verified lower bound of 10 already justifies rotation.
If the provider exposes no reliable evidence, record `unknown` and report that
automatic rotation at this threshold is unverified. Do not substitute turn
counts or claim the skill itself installs a compaction event listener.

For each pending rotation:

1. Save a compact handover checkpoint: Run/DAG and revision, task/Dispatch owners,
   worktrees, acceptance evidence pointers, active decisions/blockers, pending
   delivery receipts, event cursor and unhandled IDs, project requirements, current
   authority and schedule state. Reference detailed reports instead of copying
   the old conversation. Reconcile unconfirmed prompt delivery first.
2. Prepare one fresh provider conversation using the confirmed Advisor profile
   and Orca's supported handover route. Keep workers, worktrees and the Run alive.
   Load the checkpoint and necessary rules only; a resume/fork carrying the old
   transcript does not satisfy rotation. Record the proposed replacement ID and
   handover stage durably so recovery cannot create repeated replacements.
3. Verify the replacement prompt started and it can read the checkpoint, then
   transfer exclusive Run authority with the supported release/bind protocol.
   Only the authoritative owner may consume events or dispatch work. Preserve
   and reconcile arrivals during transfer by original IDs; retire the old
   Advisor only after the new owner acknowledges the handover.
4. Update and verify both immediate event routing and the existing automation's
   reuse target. `--reuse-session` alone does not select an arbitrary new session.
   Discover the installed adapter's supported transfer mechanism; if unavailable,
   report rotation blocked rather than starting a detached Advisor or changing
   session mode silently. Retain one enabled phase schedule and the inactivity
   deadline based on real Advisor activity.
5. Confirm a genuinely new provider session ID, initialize its compaction count
   from its own evidence (zero only when no compaction has occurred), and record
   the old session's final count and handover receipts. Drain pending events,
   dispatch ready work and report progress before the new Advisor yields.

Validate this handover in isolation before claiming automatic rotation works on
a host/provider. If a transition fails, preserve the last proven authority and
pending handover record, expose the blocker and recover through that protocol;
do not reactivate both Advisors or restart healthy workers.

## Immediate completion handling

`worker_done` is the primary trigger. Every success or failure requests immediate
Advisor attention through a verified event-driven wake route. For child-stage
completions, the feature lead consumes the original event and relays a compact
`completion_notice` with its source IDs; normal test/fix/review routing continues
without waiting for Advisor. The Advisor handles progress notices lightly and
performs acceptance only when the feature's full evidence is ready.

When Advisor is dormant, request its wake immediately. When it is already active,
enqueue into the same durable inbox and handle the event at the next safe
boundary, before yielding. Do not wait for a timer tick, debounce window or more
features to finish. Events already queued may be handled in one turn. Keep one
Advisor consumer and one claimed wake; simultaneous completions must not spawn
parallel Advisors or duplicate acceptance/merge/dispatch actions.

Record the original event ID, Task/Dispatch, outcome, revision, report location,
wake request/receipt and handling acknowledgement. Reconcile direct deliveries,
child relays and watchdog replays by original event identity. A completion is
emitted once; recovering a lost wake retries only the documented wake/delivery
operation, never `worker_done` or the implementation itself. A send receipt
proves enqueue only. Require evidence of a resumed turn and processed event
before claiming Advisor handled it.

The wake bridge must verify submission as well as enqueue, following
[Orca execution](orca-execution.md). An unsubmitted prompt is a pending wake,
not a resumed Advisor. Attempt safe documented recovery immediately; do not
wait for the timer or require the settled sender to keep polling. A busy
Advisor needs processing acknowledgement of the event, not another injected
prompt. Keep unresolved wake receipts durable for the watchdog.

Check event ownership and revision, then immediately choose the next action:
record stage progress, resolve/escalate failure, accept or reject the feature,
perform authorized integration, and dispatch newly ready work. Reuse confirmed
model choices and any project-required issue references. Follow that project's
reporting route if required; tracking is not a universal prerequisite.
Unresolved questions/decisions also request immediate wake. Routine heartbeats
and raw logs do not wake Advisor.

Before going dormant, verify this event path separately from the timer: idle
Advisor resumes on completion, a busy Advisor drains its queue, duplicate
notifications have one effect, and both success and failure are handled. Test
notification transport with clearly marked probes, not fabricated lifecycle
completion of real work. A working watchdog does not establish immediate wake.

## Auxiliary timing contract

Keep exactly one recovery schedule per active phase/run. It exists to detect
interrupted teams, missed completion delivery or stalled handoffs and restore
the workflow. It is never the normal completion/acceptance queue or a reason
to delay next-task dispatch. It resumes the automation's current Advisor session
or a verified replacement of that role and saved state. Authoring/installing
this skill does not create a schedule; starting a plan includes the requested setup.

Persist UTC `last_advisor_active_at`, `next_due_at`, schedule ID, generation,
phase state and pending wake ID in the run manifest. Update activity when the
Advisor starts/resumes, makes a decision, dispatches a wave or finishes its
checkpoint. Before becoming dormant, record its final activity:

```text
next_due_at = last_advisor_active_at + 15 minutes
```

Member messages, heartbeats, test output and background timer checks never
change this timestamp. An Advisor active at 10:00 and again at 10:07 is next
due around 10:22, regardless of member activity at 10:18. A fixed wall-clock
quarter-hour schedule alone does not implement this rule.

On each Advisor activity, reset/rearm the same schedule for the new due time.
Reject stale/early watchdog timer events; an early timer no-op is not Advisor
activity. This due-time/generation check applies only to timer events. Never
delay or discard a `worker_done`, its relay or a decision request because the
watchdog is not due. On event-driven turns, also run any overdue recovery sweep
so frequent completions cannot hide another team's interruption indefinitely.

## Select a verified scheduling adapter

Use the host's supported scheduling API. Prefer a resettable next-run timer
targeting the reusable automation Advisor session. Discover current tool
schemas/help before creating it; never assume a recurring interval resets after
a manual message.

The schedule must be registered with a persistent runtime that outlives the
Advisor turn. A prompt saying "check again in 15 minutes", an in-memory delay
inside a tool call, or a cron/RRULE string saved only in a manifest is not a
scheduler. Verify the runtime's registered ID, enabled state, owner host,
timezone, next run, target and execution history through its supported API.
Read back the actual inactivity threshold: this workflow requires 900 seconds
unless the user changes it. Do not silently inherit another run's 600 seconds.

The mode-2 default applies even when the invoking session is in Codex. Do not
silently use a heartbeat on that original session, which would implement mode 3.
If the user explicitly selects mode 3, use a supported same-session wake adapter
such as the app's thread heartbeat tools, with current schemas and verified Orca
binding. Keep member communication and Dispatch authority in Orca.

For the default Orca automation adapter, read:

```text
ORCA skills get orca-cli --reference references/automations.md
ORCA automations list --json
ORCA automations create --help
ORCA automations edit --help
```

Create an existing-workspace automation with `--reuse-session`; read back
`workspaceMode: existing` and `reuseSession: true`. A `--repo` automation creates
a new worktree per run and is unsuitable for this Advisor checkpoint. Update an
existing schedule with the scoped command below, preserving its other settings:

```text
ORCA automations edit <automation_id> --reuse-session --json
ORCA automations show <automation_id> --json
```

Verify the resume/bridge route and active owner before enabling it. A resumed
process recovers the existing Run and team. The first transfer and replacement
fallbacks follow the explicit handover protocol; routine reuse does not require
another transfer if the session remains the authoritative owner.

Before mutating in a reused session, recheck its current Run binding and lease;
old conversation context is not authority. If it is still the current owner,
continue with the existing binding. If ownership changed, stop and reconcile
instead of stealing the Run. If the adapter launches a fresh continuation,
establish explicit handover from the current Advisor first. The continuation
must validate current Run ownership
and bind from its own authenticated context using the supported current-Run
path. Inspect `run-show` and `run-use --help`; do not add `--takeover-legacy`
to a current Run (`legacy=0`). A local lease alone grants no Orca authority.
Read back the resulting coordinator/generation before consuming mail or
dispatching. On failure, release only the candidate's own claim, preserve the
previous owner's valid handover evidence, and record a recovery blocker. A
candidate that never bound successfully cannot publish a new owner-yield proof.

If the scheduler cannot reset its next run, a single lightweight host-side
timer with a deterministic precheck is acceptable: check the persisted due
time every minute without calling a model or reading logs; request a watchdog
wake after 15 minutes of inactivity. Immediate completion-event wakes bypass
this timer/precheck entirely. Orca advertises `--precheck` on current
builds: exit 0 continues, nonzero skips. Build/use such an adapter only inside
authorized paths, with single-flight wake claiming and no secret output.
The fallback recovery cadence is then about 15-16 minutes; completion handling
has no such delay.

Verify that the chosen adapter persists across ending the Advisor turn, can
reuse its Advisor session, suppresses overlap and actually observes a rearmed due
time. A delivered message or created schedule alone does not prove a resumed
agent turn. Follow [schedule verification](schedule-verification.md), including
an actual scheduled inactivity wake and completed recovery pass. Keep it
disabled during configuration inspection, then explicitly enable the bounded
probe and read back the state; a disabled schedule cannot pass a due-time test.
An automation history status of `completed` is not Advisor completion evidence.

Distinguish expected precheck skips (not due, paused, or a proven active owner)
from blocked execution (unreadable state, unknown owner, unavailable target,
precheck timeout or rejected binding). Record a compact reason and first-seen
time. Repeated blocking skips must surface through a verified host notification
or other authorized route independent of the sleeping Advisor; do not put the
only alert in the inbox that cannot wake. Silence remains no takeover authority.
If the adapter cannot expose these failures, unattended readiness stays blocked.

If immediate event wake cannot be verified, report that requirement as blocked;
do not silently downgrade to processing completions every 15 minutes. Preserve
the current Run and use bounded Orca event waits while Advisor remains active,
if supported, until dormant-session wake is available. Avoid log-polling loops.
If no supported recovery schedule exists, report that separate limitation.
A sleeping/offline host cannot guarantee immediate or scheduled delivery; on
reconnection, drain the durable event backlog before dispatching new work.

## Watchdog recovery turn

1. Recover the manifest and single Advisor ownership. Reconcile unacknowledged
   parent/child completion notices and pending wakes; process any missed events
   immediately. Do not redispatch from a stale manifest.
2. Read a compact fleet snapshot for the parent and known child Runs, including
   remote workers, and the latest durable checkpoints. Ask reachable leads for
   updates when needed. A missing lead cannot reply; reconstruct from saved
   worktree/revision, pending handoffs and authoritative runtime state instead.
3. Classify each relevant attempt from positive evidence. Healthy active work
   continues. A session positively confirmed to need continuation resumes
   through its supported route; an idle TUI alone is not such confirmation.
   A proven failed/stopped attempt uses documented recovery/retry from
   its checkpoint. `unverifiable` stays unknown: inspect/reconnect and report
   the blocker; do not stop, replace or duplicate its editor from silence.
4. Reconcile live children of an interrupted lead before recovering its
   supervision. Reuse existing child Runs/attempts through authorized runtime
   binding; do not launch a second tester/reviewer/editor for the same stage.
   Preserve dirty work, valid checks, task ownership and active locks.
   Load Orca's recovery guide and follow its exact next action/circuit breaker.
5. Resume the unfinished stage or missed handoff with remaining scope and
   evidence. Inspect pending enqueue/submission receipts and actual recipient
   state for prompts left unsubmitted. Apply the safe submission/retry rules
   in Orca execution and verify turn start; never blindly press Enter or resend
   the full task. A settled stage gets a new follow-up Task when further work is
   needed; do not reopen its completed Dispatch. Process recovered acceptance
   packets and dispatch newly unblocked tasks as soon as their gates permit.
6. Record recovery/evidence in the manifest and through any project-required
   reporting route, persist ownership and delivery receipts, and rearm from
   Advisor's final activity. Never fabricate
   a passing test, completion event, successful resume or tracker update.

Keep a recovery record with the observed failure, last valid checkpoint, chosen
resume/retry action, original/replacement attempt IDs and verified result.
Repeated failure or an unsupported recovery route goes to Advisor's decision
queue (and to the user when their input is required), not an endless restart
loop. Continue independent healthy work.

## Report before each Advisor yield

Every actual Advisor pass ends with a concise user-facing progress report in
the user's language before the session sleeps or yields. This applies to the
initial Advisor and the reused automation Advisor, including passes with no
new progress or a blocker. The final response is the report; no separate message
to other people or external channels is implied. Persist the checkpoint and
record final activity, ownership release/yield and rearm before reporting so
the stated next wake reflects saved state.

Include these facts, combining empty categories rather than padding the report:

- Completed and Advisor-accepted work, distinguishing tested/reviewed work
  still awaiting acceptance, integration or a human merge.
- Active features with owner/team and current implementation/test/review stage.
- Blockers or decisions needed, plus newly dispatched and next eligible tasks.
- Actual test/review evidence or a compact checkpoint link; use progress counts
  only when the contract and denominator are known. Do not invent percentages.
- Jev usage since the last report: actual requests/questions, cache reuse,
  omissions or failures, escalations and one or two decisions it supported.
  Use recorded evidence; state zero or unknown usage truthfully. Refer to
  [Jev decisions](jev-decisions.md) for accounting and freshness rules.
- Current Advisor session, schedule enabled/paused/blocked state, and next
  expected watchdog time in the user's timezone when verified. If uncertain,
  state the reason instead of promising a wake. Completion events still request
  immediate handling before that time.
- Advisor compactions as `count/10` with verified or lower-bound evidence, or
  `unknown`; pending/completed rotation and any handover blocker.

Finish with the actual state: waiting for events/schedule, blocked, paused, or
phase completed. A no-change pass can say no new progress, name the continuing
tasks/blocker and the next expected wake. An internal checkpoint file or tracker
comment alone does not satisfy the user-facing report. Raw timer/precheck skips
are not Advisor passes and need no routine report. Surface actionable failures
through the verified notification route described above.

Pause/disable the exact schedule when the user pauses the phase, it completes,
or it is cancelled; preserve active work and task evidence rather than implying cancellation
automatically stops or deletes workers.
While the phase is explicitly paused, preserve incoming events without
automatically resuming implementation; drain them when the user resumes it.
