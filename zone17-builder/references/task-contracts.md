# Task, manifest and evidence contracts

## Run manifest (`run-manifest.json`)

Persist compact operational state in the run folder (outside disposable
worktrees; single writer or atomic write; zero credentials):

- `run_id`, `skill_version`, `plan_path`, `plan_version`, `spec_path`,
  `harness` (default `orca`), `integration_branch`, `base_sha`, `workspace_root`.
- **Orchestrator authority:** `initial_session`, `current_orchestrator_session`,
  `automation_id`, `run_generation`, `session_mode` (default
  `reuse-automation`), `lease`, `handover_state`, and verified wake route.
- **Confirmed roster:** role fallback chains (`orchestrator`, `advisor`, `lead`,
  `worker_be`, `worker_fe`, `reviewer_be`, `reviewer_fe`, `tester`, optional
  `tester_cloud`, `tester_visual`, `bridge`, `high_risk_panel`),
  `default_lane_owner` (`advisor` | `lead`), `default_lead_focus`, mid-run
  provider notes, per-host concurrency caps, and temporary fallback ownership.
- **Progress ledger** (validated by `scripts/audit-lanes.mjs`):
  - `scope_version`, `weighting_basis` (`estimated` | `equal`), `total_weight`,
    `orchestrator_accepted_weight`, bucket weight sums (`done`, `in_progress`,
    `not_started`, `blocked` — must equal `total_weight`), and computed
    `phase_completion_percent`.
  - Per-task row: `task_id`, `parent_id`, `weight`, `status`,
    `lane_owner_role` (`advisor` | `lead`), `lane_handle`, `host`, `branch`,
    `worktrees` (selectors + paths), `stage`, `FixStrikeCount`, and
    `evidence_packet_path`.
  - `outside_plan`: `{ accepted: <n>, total: <n> }` tracked beside plan scope.
- **Delivery & watchdog state:** unacknowledged `message_ids`, pending handoff
  receipts (`enqueued`, `input_accepted`, `turn_started`, `handled`),
  `schedule_id`, `schedule_verification` (`unverified` | `partial` | `verified`
  | `blocked`), `last_orchestrator_active_at`, `next_due_at`, and `paused` flag.

## Lane task contract

Give every lane `Advisor` or `Lead` a self-contained contract with concrete,
host-accessible paths:

```yaml
feature_id: <stable task ID, e.g. T3>
plan_task: <plan section heading and wave>
issue: <tracker ID or null>
lane_owner_role: advisor | lead # advisor = coordinate-only; lead = implements focus + coordinates
lead_focus: <optional slice for lead role, e.g. "core domain & BE"; null for advisor>
worker_principles: <absolute path to references/worker-principles.md on execution host>
domain_shape: <core types, state machine, union or boundary signature from the plan>
target: <module and explicit owned_paths; everything else is read-only>
result: <concrete user-visible or technical behavior>
out_of_scope: <explicit exclusions>
constraints: <compatibility, security and repository invariants>
acceptance:
  - id: AC-1
    behavior: <observable condition>
    evidence_required: <command, assertion or browser scenario>
risk_tier: standard | high
test_plan: <per AC-n: test name, level, exact command>
regression_scope:
  - id: IMP-1
    target: <affected outside path/symbol>
    command: <exact regression command>
red_first: <list of AC-n IDs (or ["BUG"]) requiring failing proof on base_sha; [] if none>
visual_stages: <AC-n IDs needing browser/screenshot/pixel-diff verification; [] if none>
dependencies: <merged hard deps and soft-dep readiness rules>
integration_branch: <branch>
base_sha: <verified commit SHA>
worktree: <exact harness worktree selector and path>
worktree_reason: lane head # max 5 worktrees/lane: lane head + 1 stage checkout + parallel editors
worker_profiles: <BE, FE or both fallback lists>
tester_profile: <Tester fallback list>
cloud_tester_profile: <Tester cloud list or null>
visual_tester_profile: <Tester visual list or null>
reviewer_profiles: <BE/FE lists; include high_risk_panel when risk_tier == high>
review_method: <absolute path to references/review-method.md on execution host>
verify_script: <absolute path to scripts/verify-evidence.mjs on execution host>
rules: <absolute paths to project-profile.md and repo rule files>
environment: <isolated DB name, ports, base URL; zero secrets>
evidence_packet_path: <durable JSON path outside disposable worktrees>
orchestrator_route: <parent Run / Orchestrator wake address>
fallback_policy: <next profile in role list; exhausted -> Orchestrator>
```

**Mandatory kickoff header** for every `Advisor`, `Lead`, `BE Worker` and
`FE Worker` prompt:

```text
Read <worker_principles> before reading or writing code.
```

## Evidence packet schema (`<task>-evidence.json`)

Before emitting lane `worker_done`, the lane `Advisor` or `Lead` writes this
JSON packet to `evidence_packet_path` and validates it with
`node <skill-root>/scripts/verify-evidence.mjs <evidence_packet_path>` (exit `0`
required):

```json
{
  "feature_id": "T3",
  "risk_tier": "high",
  "is_bug_fix": false,
  "base_sha": "<40-char-or-short-sha>",
  "tested_sha": "<sha>",
  "reviewed_sha": "<sha>",
  "review_verdict": "clear",
  "open_blocking_findings": 0,
  "uncovered_delta_kind": "none",
  "uncovered_delta_note": "",
  "required_acs": ["AC-1", "AC-2"],
  "criteria": [
    {
      "id": "AC-1",
      "test": "rejects duplicate submission",
      "command": "npm test -- submit.spec.ts",
      "exit_code": 0,
      "sha": "<tested_sha>",
      "log_path": "/durable/run-folder/logs/T3-ac1.log"
    }
  ],
  "regression_scope": [
    {
      "id": "IMP-1",
      "target": "src/billing/summary.ts",
      "command": "npm test -- summary.spec.ts",
      "exit_code": 0,
      "sha": "<tested_sha>",
      "log_path": "/durable/run-folder/logs/T3-imp1.log"
    }
  ],
  "suites": [
    {
      "name": "unit",
      "executed": 42,
      "passed": 42,
      "failed": 0,
      "skipped": 0,
      "base_executed": 40,
      "base_skipped": 0,
      "count_delta_reason": ""
    }
  ],
  "red_first_required": ["AC-1"],
  "red_first_proofs": [
    {
      "id": "AC-1",
      "base_sha": "<base_sha>",
      "tested_sha": "<tested_sha>",
      "command": "npm test -- submit.spec.ts",
      "exit_code": 1,
      "failure_summary": "Expected 409 Conflict, received 200 OK",
      "log_path": "/durable/run-folder/logs/T3-ac1-red.log"
    }
  ],
  "cleaned_resources": {
    "sub_worktrees_removed": [],
    "databases_dropped": ["test_t3_stage"],
    "cloud_runners_closed": []
  }
}
```

Always separate `stage_outcome` (did the stage finish writing a report?) from
`test_verdict` (`pass` | `fail` | `blocked`) and `review_verdict` (`clear` |
`changes_required` | `blocked`). Never infer passing code from lifecycle
completion alone.

## Structured harness messages

Within Orca `send` / `ask` / `reply` bodies:

```yaml
kind: handoff | feedback | decision_required | completion_notice | checkpoint
message_id: <stable producer ID for deduplication>
feature_id: <task ID>
run_id: <owning Run>
task_id: <stage or lane Task>
dispatch_id: <authoritative Dispatch>
revision: <commit SHA>
observed_state: <concise proven facts>
evidence_packet: <durable path when applicable>
feedback_ids: <finding IDs R<round>-<n>>
fix_strike: <0 | 1 | 2 | 3>
next_owner: <role or orchestrator>
blocking_decision: <question, options, costs and recommendation when escalating>
```

Workers own fixes (under the 2-strike fresh-worker rule); Testers own execution
evidence; Reviewers own code verification. Disputed findings escalate to the
`Orchestrator` with the author's reasoning and the reviewer's repro/counterexample.
