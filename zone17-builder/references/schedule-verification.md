# Verify scheduled recovery

Run at Phase 2 startup, after repairing a missed wake, or after changing the
host, provider, `Orchestrator` session or scheduler adapter. Markdown instructions
cannot certify runtime timers; verify actual runtime behavior before marking
unattended recovery `verified`.

## Known pending-paste runtime hazard

Some desktop runtimes (e.g. reproduced on Windows Orca 1.4.205) can paste a
scheduled prompt into the composer without starting a turn. Before relying on
unattended `Orchestrator` dormancy, verify two natural `--reuse-session` cycles
with correlated `turn_started` evidence. Write receipts alone are not proof. If
a draft stalls unsubmitted, keep the exact Run/session binding, report a
`partial`/`blocked` schedule state, and use documented stuck-composer recovery
([execution.md](../harness/orca/execution.md#stuck-composer-recovery)) — never
auto-spawn a duplicate `Orchestrator`.

## Verification boundaries

Stop claiming verification at the first boundary lacking runtime evidence:

| Boundary | Required evidence |
| --- | --- |
| Registered | Schedule ID, `enabled: true`, host, target, `workspaceMode: existing`, `reuseSession: true` |
| Due | `last_orchestrator_active_at + 900s` (default 15m), current generation, active phase |
| Triggered | Runtime execution-history entry showing scheduled vs actual trigger timestamps |
| Allowed | Precheck exit `0` when due (and nonzero skip verified while active or paused) |
| Started | Correlated `turn_started` on the intended `Orchestrator` session ID |
| Bound | Same parent Run, exclusive `Orchestrator` lease/binding verified via `run-show` |
| Processed | Checkpoint updated, `audit-lanes.mjs` run, missed wakes/stalls swept |
| Rearmed & Reported | Lease released, `next_due_at` rearmed, and quiet watchdog line (or catch-up report) emitted |

## Exercising the real timer safely

1. Inspect existing automations (`ORCA automations list --json`) and reuse the
   run's schedule ID. Keep disabled while configuring; use a marked harmless
   probe — never fake a `worker_done`.
2. Run a short isolated due-time probe first: enable, yield the `Orchestrator`
   turn (do not busy-wait in the same turn), and verify natural wakeup, Run
   binding, checkpoint write and rearm without manual Enter rescue.
3. Restore the production `900s` inactivity threshold, verify that mid-window
   `Orchestrator` activity pushes `next_due_at` forward (`10:07` activity moves
   a `10:15` due time to `10:22`), and confirm expected precheck skips when busy
   or paused.
4. Record `schedule_verification` in `run-manifest.json` as `unverified`,
   `partial`, `verified` or `blocked` with tested host/provider details. Keep
   completion-event wake verification (`worker_done`) separate from watchdog
   timer verification.

## Quick diagnosis table

| Symptom | Action |
| --- | --- |
| Due time passed, no run entry | Check host sleep/availability, `enabled` flag, timezone and missed-run policy |
| `skipped_precheck` | Inspect precheck exit reason: expected (`not_due` / `busy` / `paused`) vs blocker (`unreadable_state` / `lease_conflict`) |
| Input accepted, no turn started | Inspect `terminal read --screen`; submit verified pending draft once per Orca execution guide |
| Prompt landed in raw shell | Launch target failed; stop sending input, reconcile TUI readiness and session handle |
| Fresh session created every tick | Re-verify `--reuse-session` (`reuseSession: true`) and target session availability |
