# Harness: <name>

Copy this folder to `harness/<name>/` and fill every section before selecting
`harness=<name>`. If any capability is unsupported, state the limitation
explicitly so the **Orchestrator** reports it rather than improvising.

## Required tools

<CLI, skills and Node runtime needed on hosts, and how to verify each>

## Capability map

| Builder concept | <name> mechanism |
| --- | --- |
| Top-level coordination run (`Orchestrator`) | |
| Lane run (`Advisor` / `Lead`) | |
| Task / attempt | |
| Isolated checkout | |
| Message, question, completion | |
| Inbox | |
| Session I/O | |
| Settle a worker | |
| Scheduler and wake | |
| Browser | |
| Remote host | |

## Guides

- `execution.md`: launching `Advisor`/`Lead` lanes, proving delivery and
  `turn_started`, event loop, 2-strike fresh-worker rotation, fallback/recovery,
  browser evidence, integration and `audit-lanes.mjs` cleanup. Model it on
  `harness/orca/execution.md`.
