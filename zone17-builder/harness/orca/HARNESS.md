# Harness: orca (default)

Orca runs every team member in a supervised Orca session and coordinates them
through Orca Runs, Tasks, Dispatches and messages. Calling
`zone17-builder cook` without `harness=` selects `orca`.

## Required tools

- The `orca` CLI, resolved via the `orca-cli` and `orchestration` skills with
  their version-matched guides loaded.
- Node.js (to run `scripts/plan-lint.mjs`, `scripts/verify-evidence.mjs`, and
  `scripts/audit-lanes.mjs`).
- `computer-use` only for native desktop or external OS windows that the Orca
  embedded browser cannot reach.

## Capability map

| Builder concept | Orca mechanism |
| --- | --- |
| Top-level coordination run | Parent orchestration Run (`run-create`, `run-show`, `run-use`); the **Orchestrator** is its coordinator |
| Lane run | Child Run created by a task's lane **Advisor** or **Lead** for its Worker/Tester/Reviewer stages |
| Task / attempt | `task-create` / `worker-start` or `dispatch` (a Dispatch is one attempt) |
| Isolated checkout | Orca worktree (`worker-start --worktree new-top-level`, `orca worktree`) |
| Message, question, completion | `orchestration send` / `ask` / `reply`; `worker_done`, `escalation`, `heartbeat` |
| Inbox | `orchestration check` (+ `--ack`) |
| Session I/O | `orca terminal read/send/rename/close` |
| Settle a worker | `worker-release`, `worker-stop`, `worker-abandon` |
| Scheduler and wake | Orca automations (`orca automations`), `--precheck` + `--reuse-session` |
| Browser | Orca embedded browser via `orca-cli` |
| Remote host | Orca environments (`--environment <name>`, `worker-start --on`) |

## Guides

- [Execution](execution.md): discovering contracts, launching `Advisor` and
  `Lead` lanes, proving delivery and `turn_started`, the event loop, 2-strike
  fresh-worker rotation, fallback/recovery, browser evidence, and cleanup.
- Core references (`references/orchestrator-checkpoint.md`,
  `references/schedule-verification.md`, `references/orchestrator-operations.md`)
  use Orca CLI examples directly.
