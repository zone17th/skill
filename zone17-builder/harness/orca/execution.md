# Orca execution

## Discover current contracts

Resolve the `orca` executable as `orca-cli` and `orchestration` instruct
(`ORCA` below is a placeholder). Load version-matched guides:

```text
ORCA skills get orchestration
ORCA skills get orca-cli
ORCA skills get orchestration --reference references/coordinator-loop.md
ORCA skills get orchestration --reference references/placement-and-remote.md
ORCA skills get orchestration --reference references/messaging-and-gates.md
```

Use `--help` for unfamiliar flags; never invent unsupported options. Verify
effective model launch receipts against requested profiles.

## Orchestrator and lane owners (`Advisor` / `Lead`)

The initial session owns the parent Run as **Orchestrator** until verified
handover to the reusable automation session
([orchestrator-checkpoint.md](../../references/orchestrator-checkpoint.md)).
Each ready plan task spawns one lane owner — either a coordinate-only
**`Advisor`** (`lane_owner_role: advisor`) or a working+coordinating **`Lead`**
(`lane_owner_role: lead`) — which creates a child Run for its `Worker`, `Tester`
and `Reviewer` stages while keeping its parent Task/Dispatch provenance.

Start every `Advisor`, `Lead`, `BE Worker` and `FE Worker` spec with:
`Read <path>/worker-principles.md before reading or writing code.`

```text
ORCA status --json
ORCA orchestration run-create --objective "<phase objective>" --json
ORCA orchestration task-create --spec "<complete lane task contract>" --json
ORCA orchestration worker-start --task <task_id> --worktree new-top-level --repo <exact_repo_selector> --base-branch <verified_base_ref> --name <role-lane_slug> --agent <confirmed_agent> --model <confirmed_model> --json
```

Verify the created worktree's branch and base SHA against the contract. Copy
`worker-principles.md`, `review-method.md`, `verify-evidence.mjs` and
`project-profile.md` to the remote run folder when dispatching to a remote host
that lacks local skill paths (never copy credentials).

Within a lane, obey the **Worktree budget** (`cook.md`, max 5 per lane):
- Sequential/disjoint workers edit in the lane head checkout.
- `Tester` and `Reviewer` edit no tracked code: run them on the paused lane head
  or share **one** standing stage checkout re-pointed each round via
  `git checkout --detach <sha>`, isolating DB names and ports per reader.

```text
ORCA orchestration worker-start --spec "<stage contract>" --worktree id:<complete_worktree_id> --agent <confirmed_agent> --model <confirmed_model> --json
```

## Prove delivery and turn start

Track enqueue and execution separately for lane assignments, stage handoffs,
escalations and `Orchestrator` wakes:

| Observation | Proves |
| --- | --- |
| `orchestration send` receipt | Message is durably queued |
| `input_accepted` | Terminal accepted text; turn not yet proven |
| `turn_started` / correlated activity | Recipient began handling this handoff |
| Processing acknowledgement / report | Stage or message was handled |

1. Launch stages with `orchestration worker-start` and verify its `ready` /
   Dispatch receipt (`worker-show` / `worker-read` if needed). Do not send raw
   Enter after a clean `worker-start`.
2. Use `orchestration send` for tracked mail and `ask`/`reply` for blocking
   questions. Once an active recipient acknowledges or acts on mail, never paste
   duplicate pointers into its terminal.
3. Only when a dormant terminal fails to pick up mail and the adapter requires
   terminal wake input:
   ```text
   ORCA terminal wait --terminal <verified_handle> --for tui-idle --timeout-ms 60000 --json
   ORCA terminal send --terminal <verified_handle> --text "<wake prompt>" --enter --wait-submit 10 --json
   ```
   After an ambiguous transport error, retry only with the bound
   `--retry-request <id>` on the same process incarnation.

### Stuck-composer recovery

If `terminal read --screen` (`source: screen`) proves this workflow's exact
pending prompt sits unsubmitted in the intended composer with no active turn,
submit that draft once via the documented adapter (or one bare Enter when that
is the only exposed route) and confirm `turn_started` on the same Run. Never
press Enter on silence, a shell prompt, or `screen-unavailable`.

## Event loop, 2-strike worker reset, and completion

Lane `Advisor`s and `Lead`s poll child inboxes with bounded waits ($\le 60\text{s}$):

```text
ORCA orchestration check --wait --types "worker_done,escalation,question" --timeout-ms 60000 --json
ORCA orchestration reply --id <message_id> --body "<answer>" --json
ORCA orchestration send --to dispatch:<dispatch_id> --subject "<task and stage>" --body "<packet>" --json
```

- **Read full bodies before `--ack`.** Never ack from truncated views.
- **2-strike fresh-worker rotation:** After 2 failed fix rounds on the same
  trigger, release the stuck `Worker` (`worker-release`), keep the checkout, and
  launch a **fresh `Worker` Dispatch** on the same worktree with the 2-attempt
  failure summary and *Attack the Premise* directive. After strike 3, escalate a
  `decision_required` packet to `Orchestrator`.
- **Pre-`worker_done` gate:** Before a lane `Advisor` or `Lead` emits its own
  final `worker_done`, release all child stages, close any remote test runners,
  remove lane sub-worktrees/DBs, write `<task>-evidence.json`, and run
  `node <verify_script> <task>-evidence.json` (must exit `0`). Emit
  `worker_done` once and end the turn.

## Orca pitfalls

- **`ask` requires `reply`:** only `orchestration reply --id <msg_id>` unblocks
  `ask`; plain `send` leaves the caller blocked.
- **Mail after settle:** send lane-to-Orchestrator notices after settle with
  `--to run:<parent_run_id>` so they do not stay in the child Run.
- **Inherited `ORCA_TERMINAL_HANDLE`:** echo env after launch and pass `--from`
  explicitly so a spawned terminal never impersonates another handle.
- **Never `--interrupt` codex:** it terminates the codex process; send a normal
  redirect message instead.
- **Shell quoting:** pass message bodies via single quotes or a file so
  backticks and PowerShell `@role` splatting never execute or strip text.

## Fallback, watchdog recovery & browser evidence

- **Nudge, do not fall back** on transient 429/5xx/stream drops; advance to the
  next roster entry only on proven quota exhaustion or missing launcher
  ([orchestrator-operations.md](../../references/orchestrator-operations.md)).
- On watchdog turns, inspect `worker-list --run <id> --include-remote --json`
  and compare lane owner timestamps against child report times to nudge missed
  wakeups. Preserve healthy child stages when recovering an interrupted lane
  owner.
- **Browser stages:** read `ORCA skills get orca-cli --reference references/browser.md`,
  isolate `browserPageId` per lane, follow `snapshot -> action -> snapshot`, and
  pair screenshots with deterministic baseline diffs.
- **Integration & cleanup:** `Orchestrator` verifies `<task>-evidence.json` with
  `verify-evidence.mjs`, merges into the integration branch, reruns affected
  checks on the merge SHA, unlinks external junctions, removes clean merged
  worktrees (`orca worktree rm`, never `--force`), and verifies host hygiene
  with `scripts/audit-lanes.mjs`.
