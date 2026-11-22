# Orchestrator events, watchdog and catch-up reporting

## Default session mode: reuse the automation session

Use Orca existing-workspace automation with `--reuse-session` (mode 2) by
default. When invoked from user session A, the first scheduled run creates
automation session B; after verified handover, B is the authoritative
**Orchestrator** and subsequent ticks reuse B until unavailable or explicitly
handed over. Session A stops coordinating once handover completes.

Record `initial_session`, `current_orchestrator_session`, `automation_id` and
`run_generation` in `run-manifest.json`. Route all `worker_done` and escalation
wakes to the single authoritative `Orchestrator`. Only one session may mutate
the parent Run at a time.

## Hand over to a replacement Orchestrator

Hand over only when the current `Orchestrator` session is unavailable or the
user asks (never on an arbitrary compaction count). At a safe boundary (after
finishing any in-flight merge or dispatch):

1. Write a compact handover checkpoint (`run-manifest.json` + active blockers,
   unacknowledged message IDs, worktree map, and verified schedule state). Point
   to report files rather than copying chat transcripts.
2. Start one fresh session on the confirmed `Orchestrator` profile, verify it
   reads the checkpoint, transfer exclusive Run binding (`run-use` / lease),
   repoint immediate event wakes and the `--reuse-session` target, and confirm
   the new session ID before retiring the old session.
3. If transfer is unsupported or fails, keep the previous proven owner record
   and surface the blocker — never run two active Orchestrators.

## Immediate event handling (`worker_done` & escalations)

`worker_done` and `decision_required` are primary event triggers — never defer
them to the 15-minute watchdog:

- **Child-stage `worker_done`:** consumed immediately by the lane's `Advisor` or
  `Lead`, which advances the lane (`Worker -> Tester ∥ Reviewer -> fix`) without
  waiting on `Orchestrator` and relays a lightweight `completion_notice` carrying
  the original event IDs.
- **Lane `worker_done` (or escalation):** wakes a dormant `Orchestrator`
  immediately, or queues into an active `Orchestrator`'s inbox to be drained
  before yielding. Deduplicate across direct delivery, relay and watchdog sweeps
  by original `message_id`.
- Verify both enqueue and recipient `turn_started` per the harness guide (Orca:
  [execution.md](../harness/orca/execution.md#prove-delivery-and-turn-start)).

## 15-minute inactivity watchdog

Keep **one** persistent recovery schedule per active run. Its sole job is
recovering interrupted lanes, missed wakes or unsubmitted drafts — never normal
task dispatch.

Persist `last_orchestrator_active_at`, `next_due_at`, `schedule_id`,
`generation` and `phase_state` in `run-manifest.json`. Update activity whenever
the `Orchestrator` starts, dispatches, accepts, or finishes an active pass:

```text
next_due_at = last_orchestrator_active_at + 15 minutes (900s default)
```

Lane heartbeats, worker logs and skipped prechecks never reset this clock. If
the runtime scheduler cannot dynamically reset its next tick, use a lightweight
zero-token `--precheck` script (exit `0` when `now >= next_due_at` and not
paused/busy; nonzero to skip without starting a model turn). Follow
[schedule-verification.md](schedule-verification.md) on the real host before
declaring unattended operation `verified`.

### Watchdog recovery sweep

On a watchdog wake (and on overdue sweeps piggybacked onto event turns):

1. Verify single `Orchestrator` lease/Run binding (`run-show`) and run
   `node <skill-root>/scripts/audit-lanes.mjs`.
2. Reconcile unacknowledged `worker_done` / `escalation` messages and compare
   each live lane owner's last activity against its children's latest report
   timestamps (nudge an idle lane `Advisor`/`Lead` that missed a child report).
3. Classify stalled attempts from positive runtime evidence (`worker-list
   --include-remote`, `terminal read --screen`): nudge transient 429/5xx stalls,
   submit verified stuck drafts once, and recover proven dead attempts on their
   existing worktree without duplicating live editors. Silence alone never
   authorizes a second editor.
4. Process ready acceptance packets, dispatch newly unblocked tasks, persist the
   checkpoint, and rearm `next_due_at`.

## Reporting: `/ketchup` catch-up on changes, quiet heartbeat when idle

Reporting serves the human operator without flooding the transcript:

### 1. Quiet watchdog heartbeat (no-change timer tick)

When a 15-minute watchdog sweep finds **zero state changes** (no task accepted,
dispatched, failed, recovered or newly blocked, and no human questions pending):

- Persist updated `last_orchestrator_active_at`, rearm the schedule, release the
  lease, and output **one compact line**:
  `[orchestrator-watchdog · <ISO-time> · quiet · plan <X.X>% (<w_done>/<w_total>) · <N> active lanes · next due <HH:MM>]`
- Do **not** dump the full multi-section inventory table on an unchanged
  watchdog tick.

### 2. Full `/ketchup` catch-up report (any state change, gate, blocker, or `status`)

Emit a structured catch-up report in the user's language at the end of every
pass that changed state, hit a blocker/gate, started or finished a wave, or
answered `zone17-builder status`:

1. **What changed since last report:** 2–5 crisp lines naming newly accepted
   tasks, newly launched lanes, resolved/new blockers, or wave-gate results.
2. **Waiting on you (Human decisions):** every open question or gate requiring
   human input, written so the human can decide **from this reply alone**
   (context, options, cost, recommendation). Omit or write `none` when nothing
   waits on the human.
3. **Task inventory table** covering all four buckets (`done`, `in progress`,
   `not started`, `blocked`):
   `Task | Weight | Lane owner (Advisor/Lead) | Stage | Evidence / Blocker | Next action`
4. **Progress ledger** (validated by `audit-lanes.mjs`):
   - `phase_completion_percent = orchestrator_accepted_weight / total_scoped_weight * 100`
   - Only `Orchestrator`-accepted tasks enter the numerator. Splitting a task
     divides its original weight among children without changing the denominator;
     only an approved Change Request updates `total_scoped_weight` and bumps
     `scope_version`.
   - Keep out-of-plan requests separate:
     `plan 86.6% (71/82 weight, 9/11 tasks) · outside plan 2/3`.
5. **Runtime footer:** active `Orchestrator` session, `audit-lanes` status,
   schedule state (`verified` / `partial` / `paused` / `disabled`), and next
   expected watchdog time.

Persist the checkpoint and rearm/disable the schedule *before* emitting the
final response, and make no further tool calls after it. Disable the schedule
whenever the run pauses, cancels, or reaches Gate G4.
