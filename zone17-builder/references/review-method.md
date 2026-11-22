# Code review method (Phase 2)

How `BE Reviewer` and `FE Reviewer` evaluate task revisions unattended inside a
lane. Bundled lens recipes live in [`lenses/`](lenses/README.md). Interactive or
self-orchestrating external workflows (`bmad-code-review`, `bmad-build-auto`,
`bmad-walkthrough`) are strictly banned inside lanes.

## Core principle: Execution-proven review (`/interrogate` standard)

Static speculation creates noise and defensive-code bloat. Reviewers operate on
the lane's read-only stage checkout (`git checkout --detach <reviewed_sha>`) and
must **ground findings in reality**:

1. **Probe whenever runnable.** If you suspect an unhandled input, broken caller,
   type hole, regression or edge case that a quick command, existing test, node
   one-liner or grep/AST check can demonstrate without modifying tracked files,
   **run it** and attach the exact command and output.
2. **Zero quota, zero filler.** `[]` (zero blocking/actionable findings) is a
   valid, healthy verdict on clean code. Drop style nitpicks not backed by
   project rules, hypothetical future requirements, and requests to add `if (!x)`
   guards for states made impossible by internal types/boundaries
   ([worker-principles.md](worker-principles.md#3-fix-root-causes-never-symptom-guards)).
3. **Multi-vendor panel for `high` risk tasks.** When `risk_tier: high` and
   `high_risk_panel` is configured in the roster, the lane `Advisor` or `Lead`
   spawns 2 reviewers from different model families in parallel on the `full`
   round and merges their verified findings.

## Inputs

- `review_round`: `full` (`base_sha..reviewed_sha`) or `delta`
  (`last_reviewed_sha..reviewed_sha`). Write the unified diff to a temp file
  outside the worktree; lenses read that file rather than receiving giant diffs
  inlined in prompts.
- Feature contract: `domain_shape`, `result`, `acceptance`, `constraints`,
  `regression_scope`, and `rules` (including `worker-principles.md`).
- For `delta`: open findings from the prior round with stable IDs `R<round>-<n>`.

## Lenses

| Round | Lenses |
| --- | --- |
| `full` | `adversarial`, `edge-case-hunter`, `verification-gap`, plus `fe-quality` when UI files changed, plus `code-craft` check |
| `delta` | `edge-case-hunter`, `verification-gap`, plus `fe-quality` when UI files changed in delta |

Run lenses in parallel in-process subagents when available (each seeing only the
diff file and contract intent, returning raw findings without spawning nested
skills), or sequentially in one session otherwise. **Subagent tier rule:** pin
lens subagents to the `standard` tier (`Sonnet` / `Terra` / `Argon` from
`subagent_tiers` in `cook.md`). A Reviewer running on `professor` (`Fable` /
`Astra` / `Carbon`) **must never spawn `professor` subagents** — either pin lens
subagents to `standard` or run the lenses inline in the Reviewer session.

### Built-in `fe-quality` & `code-craft` passes

- **`fe-quality` (when UI touched):** check missing loading/empty/error states,
  keyboard reachability/focus order, accessible labels/roles, touch targets,
  narrow/overflow/i18n layout resilience, and design-token/i18n bypasses against
  project UI rules.
- **`code-craft` (against `worker-principles.md`):** flag duplicated domain
  state or boolean soup violating `domain_shape`, unparsed external boundary
  inputs, leftover dead/compatibility shims, and redundant "what" comments left
  behind.

## Reviewer triage & verification

After lenses return candidates, the Reviewer verifies each one before grading:

1. Read the cited `file:line`, trace callers and upstream boundary types/guards,
   and **run a non-destructive probe/test command** when executable verification
   is possible.
2. Assign one grade:
   - `high` (`blocking: true` → `review_verdict: changes_required`): proven bug,
     broken contract/caller, security/permission flaw, missing required
     verification, or test weakened to fake a pass.
   - `medium` (`blocking: lane_owner`): real defect or `worker-principles`
     violation worth fixing now; the lane `Advisor` or `Lead` fixes it (often via
     [small findings](orchestrator-operations.md#small-findings)) or records a
     justified deferral before acceptance.
   - `low` (`blocking: false`): real but minor; note only. Reject `low` items
     into `rejected` if fixing them would add speculative branches or reader load.
   - `maybe-false` (`blocking: lane_owner`): static code cannot settle it; name
     the exact runtime check `Tester` must run to prove or refute it.
   - `false` (`rejected` list with refutation): disproved by types, upstream
     guards, project rules, or a passing probe. Never drop silently; record the
     1-line refutation so later rounds do not re-raise it.

## Output & Delta rounds

Emit findings with stable ID `R<round>-<n>`, lens, `file:line`, `trigger`,
`impact`, `severity`, `proof_command` (when run), proposed root-cause fix, and
required verification. `review_verdict` is `changes_required` if any finding has
`blocking: true`, `blocked` if inputs were unreadable, and `clear` otherwise.

In a **`delta` round**:
- Verify each prior open finding (`resolved` citing commit + test evidence,
  `open`, or `superseded`). If the delta edited unrelated files beyond the fix
  scope, escalate back to a `full` round.
- **Audit test/fixture edits first:** any removed assertion, added skip, widened
  tolerance, or mocked-out core path added to make tests green is an immediate
  `high` (`blocking: true`) broken-verification finding.
