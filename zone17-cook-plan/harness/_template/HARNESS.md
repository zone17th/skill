# Harness: <name>

Copy this folder to `harness/<name>/` and fill every section before a run
selects `:<name>`. A harness that leaves a capability unmapped must say what
replaces it or that the capability is missing; the Advisor then reports the
gap instead of improvising.

## Required tools

<CLI, skills or services this harness needs, and how to verify each one>

## Capability map

| Core term | <name> mechanism |
| --- | --- |
| Coordination run | |
| Child run | |
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

- `execution.md`: starting the first wave, proving delivery and turn start,
  the event loop, fallback and recovery, integration and cleanup on this
  harness. Use `harness/orca/execution.md` as the model.
