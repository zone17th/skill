# Harness: orca (default)

Orca runs every team member in an Orca terminal and coordinates them through
Orca Runs, Tasks, Dispatches and messages. This is the default harness: a
plain `zone17-cook-plan` invocation uses it.

## Required tools

- The `orca` CLI, resolved exactly as the `orca-cli` and `orchestration`
  skills instruct, with their version-matched guides loaded.
- `typesafe-ai` for Jev (harness independent).
- `computer-use` only for desktop or external windows that the CLI cannot reach.

## Capability map

| Core term | Orca mechanism |
| --- | --- |
| Coordination run | Orca orchestration Run (`run-create`, `run-show`, `run-use`); the Advisor is its coordinator |
| Child run | A Run the feature lead creates for its own stages |
| Task / attempt | `task-create` / `worker-start` or `dispatch` (a Dispatch is one attempt) |
| Isolated checkout | Orca worktree (`worker-start --worktree new-top-level`, `orca worktree`) |
| Message, question, completion | `orchestration send` / `ask` / `reply`; `worker_done`, `escalation`, `heartbeat` |
| Inbox | `orchestration check` (+ `--ack`) |
| Session I/O | `orca terminal read/send/rename/close` |
| Settle a worker | `worker-release`, `worker-stop`, `worker-abandon` |
| Scheduler and wake | Orca automations (`orca automations`), precheck + reused session |
| Browser | Orca embedded browser via `orca-cli` |
| Remote host | Orca environments (`--environment <name>`, `worker-start --on`) |

## Guides

- [Execution](execution.md): discovering contracts, starting the first wave,
  proving delivery and turn start, the event loop, fallback and recovery,
  browser evidence, integration and cleanup.
- The core references (`references/advisor-checkpoint.md`,
  `references/schedule-verification.md`, `references/advisor-operations.md`)
  use Orca command names in their examples; on this harness they apply as
  written.
