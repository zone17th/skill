# Task and message contracts

## Run manifest

Persist only operational memory needed to resume:

- Run ID, plan/version, phase, integration branch/base SHA, workspace root.
- Initial Advisor session, current Advisor session/host and verified Orca
  coordinator address; applicable host/project rule paths and any project-required
  tracking/reporting route. Populate project-specific fields only when applicable.
- Advisor session mode (default `reuse-automation`), automation-owned session
  identity, expected provider/model, handover receipts and current event-wake
  route. Preserve the Run ID across reuse or a verified replacement session.
- Advisor rotation policy (`max_compactions_per_advisor_session: 10`), actual
  provider session ID, verified compaction count or lower bound/unknown, evidence
  source/cursor and last counted event. Persist outside the provider context.
  Record pending rotation, checkpoint path, old/replacement session IDs, handover
  stage, exclusive-owner receipts, wake-route verification and failure reason.
- Confirmed primary role profiles, optional fallback mappings (explicit `null`
  when unset), capacity and effective launches. Map Member 2 to Fallback FE
  Worker and Member 4 to Fallback FE Reviewer; keep BE fallbacks for Member 1
  and Member 3 separate. Default an unset/unavailable fallback to Advisor.
  Record temporary ownership, primary unavailability evidence and handback
  readiness/checkpoint so recovery preserves current work.
- Jev policy/question version, decision-record location, cache freshness policy,
  fallback owner and last reported decision IDs/usage cursor. Aggregate actual
  requests separately from typed questions, cache hits and relayed records.
- Feature ID -> Orca parent Task/active Dispatch -> child Run IDs, plus any
  project-required issue reference.
- Exact worktree selectors, absolute paths, branch SHAs and ownership.
- Contract/report/evidence paths, gates, pending decisions and acknowledged
  message/request IDs. Use the project's configured source of truth; if no
  external tracker is required, the Run/Task manifest is sufficient.
- Per-team durable resume checkpoint, last actual progress, current stage and
  revision, pending handoff, and current child Run/Dispatch ownership. Preserve
  unfinished edits and artifact paths so recovery does not restart from scratch.
- Per-action handoff receipt: stable message ID, actual recipient and live
  attempt/process identity, transport, enqueue receipt, submission request ID
  if provided, observed input/turn-start evidence, processing acknowledgement,
  verification owner and next recovery action. Preserve unknown observations
  as unknown; these are manifest fields, not invented Orca response fields.
- One schedule ID; last Advisor activity, next due time, generation,
  active/pending wake state, and whether the phase is running or paused. Separate
  completion-event IDs from watchdog generations, and record the last recovery
  sweep so frequent events cannot hide another team's interruption indefinitely.
- Schedule verification state (`unverified`, `partial`, `verified`, `blocked`),
  actual threshold/host/provider, scheduled trigger receipts, correlated turn
  start, successful Run binding, recovery-pass result and rearm evidence. Store
  pending launch claims separately from authoritative Advisor ownership. A
  failed launch/binding must not overwrite the last valid owner's yield proof.

Choose a shared, authorized durable location. Do not create a second global
tracking board or write run-specific settings into this installed skill.
Use one writer per record or an atomic compare-and-swap/lock when shared.

## Feature contract

```yaml
feature_id: <stable local identifier>
plan_task: <plan reference and phase>
issue: <project-required issue reference or null>
parent_issue: <project-required parent reference or null>
target: <component and explicit owned paths>
result: <concrete user-visible or technical behavior>
out_of_scope: <boundaries>
constraints: <compatibility, security and repository invariants>
acceptance:
  - id: AC-1
    behavior: <observable condition>
    evidence_required: <command, assertion or browser scenario>
dependencies: <real prerequisites and contract versions>
integration_branch: <resolved branch>
base_sha: <verified commit>
worktree: <exact Orca selector and absolute path>
edit_owner: <one worker profile/Dispatch>
tester_profile: <confirmed Member 5 profile>
reviewer_profiles: <BE, FE or both as applicable>
rules: <absolute rule and skill paths available on execution host>
environment: <isolated ports/database/browser targets; no secrets>
report_destination: <durable path outside disposable worktree>
decision_route: <actual parent Run/Advisor address>
completion_route: <verified immediate Advisor wake/relay and source event IDs>
handoff_route: <verified submission/wake adapter and delivery verification owner>
tracking_route: <project-required reporting route or null>
fallback_policy: <optional confirmed role fallback or null; unset/unavailable -> Advisor until primary ready>
jev_policy: <default triggers, decision-record location and freshness policy>
```

Before dispatch, replace the bracketed values with real facts. If frontend and
backend both change, cover both with independent reviews. A feature has one
lead and edit owner at a time; split or sequence other editors explicitly.

## Stage outcomes and evidence

An Orca Task is one dispatchable unit, not necessarily the entire plan feature.
Use distinct stage Tasks for test, review and follow-up verification. A valid
stage `worker_done` settles that stage; it does not settle feature acceptance.

A tester/reviewer can successfully complete an investigation that finds a bug.
Its report must separate `stage_outcome` (report produced or execution failed)
from `test_verdict` (`pass`, `fail`, `blocked`, `not_run`) or `review_verdict`
(`clear`, `changes_required`, `blocked`). If that stage's contract explicitly
requires passing tests, failed tests mean a failed stage. Always route from
the actual verdict; never infer product correctness from lifecycle success.

Record, as applicable:

- Task/Dispatch IDs, issue, role, timestamp, tested/reviewed commit SHA and
  any dirty-tree diff identity. Prefer a committed immutable handoff.
- Exact command and working directory, environment/base URL, exit status,
  relevant output, artifact paths, failing assertions and reproduction steps.
- Browser page ID, route, viewport, actions, expected and actual observations,
  screenshots and relevant console/network evidence with private data removed.
- Per-criterion evidence links; skipped/unavailable checks with reasons.
- Jev decision references and judged/cached/skipped/unavailable/invalid status,
  unresolved semantic questions and the responsible fallback owner. These
  judgments supplement execution evidence and independent review.
- Findings with stable ID, file/line, trigger, impact, severity, proposed fix
  owner and verification requirement. Explicitly state when no findings exist.
- Unresolved risks and the next eligible stage. A requested command is not a
  command that ran, and a passing exit code is not sufficient if the command's
  own documented behavior permits unmet checks.

## Orca message body

Use structured bodies within real Orca `send`/`ask`/`reply` calls; these fields
do not define new CLI flags:

```yaml
kind: checkpoint_request | checkpoint | handoff | feedback | decision_required | completion_notice
message_id: <stable producer-generated id for replay/deduplication>
feature_id: <feature>
issue: <project-required issue reference or null>
run_id: <owning Run>
task_id: <stage Task>
dispatch_id: <authoritative attempt>
revision: <SHA and environment identity>
observed_state: <what is proven now>
evidence: <bounded summary and accessible artifact paths>
feedback_ids: <references; preserve original findings>
jev_decisions: <decision references, pending judgments or omission reasons>
next_owner: <eligible profile or Advisor>
blocking_decision: <question, options, tradeoffs and recommendation if needed>
```

For `completion_notice`, include the original `worker_done` message ID, source
Run/Task/Dispatch, outcome, report path and whether this is a stage completion
or a feature ready for acceptance. Forward it immediately to Advisor through
the verified route. It is a notification of the original event, not another
`worker_done` or permission to settle a child Task twice. A failed outcome is
also an immediate notification. Do not wait for tracker acknowledgement or the
watchdog before requesting Advisor attention.

Read messages at natural checkpoints and immediately before `worker_done`.
Acknowledge only after processing every delivered row and recording ownership
decisions. Preserve the producer message ID for deduplication; it is not a CLI
retry token. Use only the transport's documented retry method and actual
runtime-issued request ID where required. A successful enqueue is not proof
of receipt or action. Track execution/handling as described in
[Orca execution](orca-execution.md); do not report a handoff running from typed
but unsubmitted text. Stale revisions do not overwrite current outcomes.

## Feedback handling

Attach feedback to its feature and revision. Exact IDs and exact duplicates
are deterministic. Apply the default [Jev policy](jev-decisions.md) to semantic
matching, likely duplicates among bounded candidates and finding coverage by
fix evidence. Record the outcome or concrete omission reason. Preserve both
reports and their provenance; link possible duplicates rather than deleting
them. One fix can resolve several findings only when its verification covers
each trigger.

Workers own fixes. Reviewers report findings and verify resolution. Tester owns
independent execution evidence. A disputed finding includes the author's
reasoning and the reviewer's counterexample in a decision packet to Advisor.

## Checkpoint response

Persist a checkpoint at stage handoffs and natural work boundaries, including
after tests and before yielding or a risky operation. Do not wait for the
watchdog to request the first checkpoint: a terminated agent cannot reply.

Each feature lead aggregates its team's checkpoint: current stage/revision,
completed evidence, active members, blockers, remaining work and available
capacity. Include new Jev decision references, actual request/question counts,
cache reuse, omission/failure reasons and escalations; do not recount a relayed
decision as a new call. Reply through Orca without stopping healthy tests.
Missing replies remain unknown; they do not justify launching a duplicate worker.
