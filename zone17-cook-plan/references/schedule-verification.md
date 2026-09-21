# Verify scheduled recovery

Use at plan startup, when repairing a missed wake, or after changing the runtime,
provider, target session or scheduling adapter. This skill supplies a workflow;
it does not install a scheduler or certify a provider's wake implementation.

## Pending-paste runtime regression

Windows Orca 1.4.205 has a reproduced scheduler reuse failure: the prompt can
remain in the composer after dispatch. Skill instructions cannot fix a prompt
that never starts executing. Record the actual runtime build and delivery path;
do not infer a fix from installing this skill or from a newer version number.

Before unattended Advisor sleep, require a naturally triggered reuse cycle with
correlated turn-start evidence, followed by another successful reuse cycle.
The sender must wait for paste settlement, submit, and verify the turn. A write
receipt alone is insufficient. If delivery is unconfirmed, preserve the exact
run/session/PTY binding and block automatic resend or replacement-session launch
until that attempt is reconciled. Report this as a recovery blocker; continue
independent supervised work. Manual Enter remains assisted recovery.

After a runtime patch or app update, repeat these checks on the actual host and
provider. Keep verification `partial` until the real timer and reuse tests pass.

## Trace the actual attempt

Record each boundary independently. Stop assigning success at the first boundary
without evidence; later stages stay unverified.

| Boundary | Required evidence |
| --- | --- |
| Registered | Runtime schedule ID, enabled state, owner host, target, timezone and next run; default mode has `workspaceMode: existing` and `reuseSession: true` |
| Due | Actual last Advisor activity plus 900 seconds, current generation and active phase |
| Triggered | Execution-history entry for a scheduled trigger and its scheduled/actual timestamps |
| Allowed | Precheck exit/reason and one claimed wake; expected skips are distinguished from blockers |
| Started | Correlated provider turn/submission evidence on the intended session or authorized continuation |
| Bound | Same phase Run, authenticated Advisor owner and current generation verified from runtime |
| Processed | Actual checkpoint, handled delivery IDs when present, recovery/dispatch decisions and evidence |
| Rearmed | Own lease released or valid yield recorded, final activity persisted, correct next due time and schedule still enabled |
| Reported | Matching `advisor_report_id` plus non-empty user-facing final response in the provider transcript or automation output, including complete done/in-progress/not-started/blocked inventory, ledger-based phase percentage, and verified next wake or blocker |

For Orca, inspect `automations show`, `automations runs`, `status` and exact
terminal/worker receipts as supported by current help. Filter history to the
relevant run IDs and compact fields; avoid dumping entire provider transcripts.
An automation can report `completed` after dispatching input while the Advisor
has not completed a turn. Neither that status, a terminal tab, precheck exit 0
nor prompt text in a snapshot substitutes for the remaining evidence.
A pass may persist `report_status: prepared` before its final response because it
cannot inspect its own post-final transcript. On the next wake or from a read-only
observer, reconcile that entry against the actual output. If the matching report
is absent, the reporting boundary failed even when checkpoint and rearm passed;
resend the prepared report once, deduplicated by ID, and preserve a blocker when
receipt still cannot be observed.

Use current role-specific bindings, not a copied historical handle. For a fresh
Advisor continuation, verify the old owner's explicit release/handover or other
positive authority evidence before binding. An unexpired lease held by another
owner blocks mutation. Expiry alone does not prove that process stopped.
Keep the pending launch claim separate from accepted Run ownership so failed
startup cannot replace the last valid handover record. A stale or unrelated
yield is invalid even when its Run ID happens to match.

## Exercise the real timer

1. Inspect any existing schedule first and reuse the run's exact ID. Confirm
   permissions, actual provider/model, host availability and one Advisor owner.
   Keep the configuration disabled while checking it. Use a unique probe ID and
   a harmless acknowledgement/checkpoint; never fabricate a real `worker_done`.
2. Prepare a short due-time transport probe using the chosen adapter's supported
   schedule mechanism. Explicitly enable it, read back the due time, and let
   the runtime trigger it after the initiating Advisor turn yields. Do not call
   a manual run, send an extra prompt or press Enter to rescue the probe and
   still label it an automatic success. Record manual interventions separately.
3. Observe through the runtime's receipts from a read-only observer or verified
   host callback. Do not keep the same Advisor active in a waiting loop when
   testing wake from dormancy. No observer may consume that Advisor's inbox or
   become a second coordinator.
4. Require the receiving Advisor to write correlated start, binding, checkpoint
   and finish evidence. It may legitimately find no new work; it must still
   complete and rearm the recovery pass, then report progress before yielding.
   A turn that starts then fails binding
   proves transport only, not a working workflow.
5. Restore the 900-second inactivity threshold and production trigger through
   the same adapter, read them back, then observe a real inactivity cycle. A
   shortened probe, manual run or attention-marker bypass does not prove the
   15-minute rule. Activity at 10:07 must supersede a 10:15 timer from 10:00;
   the next eligible wake is 10:22, or roughly 10:22-10:23 with a minute precheck.
6. Verify a subsequent eligible cycle after finish/rearm. Confirm expected skips
   while a real Advisor owner is active, no duplicate consumers during an event
   wake, and no launches while paused. For default mode 2, compare actual
   provider session IDs across cycles: reuse the same available automation
   session unless a verified compaction-threshold handover is due. A reused
   workspace/tab name alone is insufficient. Verify
   both timer and completion-event wakes target that current Advisor, including
   after the initial handover. Exercise stop/pause in an isolated probe
   or at a real authorized pause, never by interrupting healthy phase work.

Use a shortened probe only in isolated verification state or when it cannot
change live work cadence. Keep one production schedule; do not create a second
phase Advisor to test the first. Do not alter a schedule owned by an active
repair team. Observe its existing test and record what it actually proves.

Test unavailable-session fallback only in isolation or after a real session
loss. Record the replacement session, same Run/checkpoint, exclusive binding
and updated wake route. Never close a healthy Advisor merely to force this
case. A fresh session on every normal tick fails the default reuse contract.

Verify [compaction rotation](advisor-checkpoint.md#rotate-after-10-compactions)
in isolation: nine observed compactions retain the session; the tenth requests
one handover at a safe boundary. Replaying an event must not increment twice,
and resuming the same session must retain its count. Missing counter evidence
stays unknown. Verify a new provider session ID, compact checkpoint recovery,
single ownership, retained workers and pending events, then both an event wake
and a naturally triggered schedule reuse of that new Advisor. Do not force ten
compactions on the live Advisor merely to test the threshold. A simulated counter
tests policy only; real provider-event detection remains a separate proof.

Classify readiness as `unverified`, `partial`, `verified` or `blocked` with the
remaining boundary and reason. Only completed evidence through rearm/report and a
subsequent eligible cycle supports `verified`. State the tested host/provider;
one provider passing does not certify every provider. Until then, keep supported
supervised operation available and disclose the unattended limitation.

## Diagnose a missed wake

| Observation | Next action |
| --- | --- |
| No registered/enabled schedule | Complete actual registration/enablement and read it back; prompt text is insufficient |
| Due time passed with no history entry | Check scheduler owner/host availability, timezone and next run; inspect missed-run policy |
| `skipped_precheck` | Read exit code and compact reason; distinguish expected not-due/busy from unreadable ownership or timeout |
| Target unavailable | Reconcile the exact project/workspace/host binding; preserve existing work and schedule identity |
| Input accepted, no turn proof | Follow submission verification in Orca execution; never blindly resend the task |
| Paste remains in the Advisor composer | Inspect the rendered screen and exact target; submit the existing verified draft once under the Orca execution recovery rules |
| Prompt prose appears in a shell or causes parser errors | Treat launch/target selection as failed; do not send more text or Enter to that shell; reconcile agent readiness and runtime identity |
| Turn started, binding rejected | Check actual Run kind and supported binding; no `--takeover-legacy` for `legacy=0`; preserve prior owner proof |
| New session on each normal tick | Read back `reuseSession`, prior session availability and execution host; restore mode 2 and verify identity across turns |
| Checkpoint completed, no later wake | Check final activity, uncleared own lease/claim, trigger rearm and accidental schedule disablement |

A manual Enter that rescues a pending draft is assisted recovery, not a passing
scheduled probe. Instructions inside that unsubmitted prompt cannot repair its
own delivery. Fix the sending adapter/runtime and repeat the natural wake test;
do not infer submission from a fixed paste delay or an automatic extra Enter.

A guard that suppresses every future tick is a blocked workflow even if each
individual skip is safe. Keep unknown ownership non-destructive while exposing
the blocker through an independent verified notification route. Do not clear
someone else's lease or backdate activity merely to force the timer to run.
Keep completion-event wake verification separate: passing this timer test does
not prove immediate `worker_done` handling.
