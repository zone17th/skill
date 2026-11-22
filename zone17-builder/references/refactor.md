# Refactor & Anti-Slop Mode (`zone17-builder refactor`)

Use this flow when an existing codebase (or subsystem) accumulated bloat,
cross-lane duplication, redundant guards or AI slop from earlier work and needs
a structured, **100% behavior-preserving** cleanup.

**Iron law:** *Structure changes; observable behavior does not.* If the audit or
a worker uncovers a real functional bug or missing feature, record it in a
separate *Discovered Bugs* list for the human to schedule as its own ticket —
never sneak behavioral changes into a refactor task.

```text
Phase 1a · Slop Audit & Refactor Spec (Author -> Reviewer -> Gate G1)
  automated static scan + parallel 6-lens slop audit -> Refactor Spec (RF-1..RF-n)
         -> Reviewer rejects speculative churn -> G1 human selects which RF-n ship
Phase 1b · Refactor Plan (Author -> plan-lint -> Reviewer -> Gate G2)
  Wave 1 (pinning tests + pure dead-code/comment subtraction)
         -> Wave 2..N (unify duplicates, reshape domain types, migrate callers & delete old paths)
         -> Final Wave (QA equivalence + net LOC delta) -> G2 human approves plan
Phase 2  · Cook (Orchestrator -> Advisor/Lead lanes -> verify-evidence [mode=refactor] -> Gate G4)
```

---

## Phase 1a: Codebase Slop Audit → Refactor Spec

Unlike a feature request, the user does not hand you a list of requirements —
your first job is to **audit the target scope** (whole repo or `scope=<paths>`)
and prove what is worth cleaning up.

### 1. Run deterministic static detectors first

Before spawning LLM readers, run whatever static dead-code, unused-export, type
and duplicate tools the project or ecosystem already has (from
`project-profile.md` or non-destructive one-off commands):
- TypeScript / JS: `tsc --noEmit --noUnusedLocals --noUnusedParameters`, `knip`,
  eslint unused/complexity rules, import-reference searches.
- Java / Kotlin / Python / Go / Rust: compiler unused warnings, dead-symbol
  searches, coverage/call-graph checks.

### 2. Fan out parallel read-only audit subagents across 6 Slop Categories

Partition the target directories across read-only subagents pinned to the
**`fast`** tier (`Luna` / `Haiku` / `Hydrogen` — or `standard` when subtle AST
tracing is needed, never inheriting `deep` or `professor`; see
[Subagent model tiers](cook.md#subagent-model-tiers-fast--standard--deep--professor))
so the main thread's context and top-tier quota stay clean. Every candidate
finding must cite exact `file:line` paths and estimated lines saved:

| Category | What to hunt (especially after multi-agent / legacy runs) |
| --- | --- |
| **1. Dead & orphaned code** | Unused files, exports, types, DTO fields, API routes, feature flags, CSS classes, seed helpers, or compatibility shims nobody calls |
| **2. Cross-lane duplication** | 2+ helpers, mappers, validators, hooks, UI components or SQL queries built independently in different folders that do the same job |
| **3. Defensive slop & indirection** | Single-caller pass-through wrappers, factories with one implementation, `try/catch` blocks that log-and-rethrow or swallow errors, and internal `if (!x)` guards for states already guaranteed by boundary parsers/types |
| **4. Domain shape debt** | Boolean flag soup (`isLoading` + `isError` + `isSuccess`), magic string/status switches repeated across files, or drifted hand-written types that should derive from one union/schema |
| **5. Comment & debug slop** | Comments restating *what* the code does, banner dividers, commented-out blocks, leftover debug/temporary logs |
| **6. Test slop & pin gaps** | Fragile tests mocking internal helpers instead of asserting behavior, copy-pasted test setup, **and** under-tested modules that need *characterization/pinning tests* before their internals are reshaped |

### 3. Filter ruthlessly before writing the Refactor Spec

Apply the **Reader-Load Filter**:
- Boring, clear, local code **stays untouched**.
- Drop any "cleanup" that adds a new abstraction layer, base class or config
  indirection without deleting net branches, duplicate sites or invalid states.
- Separate any real functional bug found during inspection into Section 8
  (*Discovered Bugs — Out of Scope*) of `assets/refactor-spec-template.md`.

Write the Refactor Spec from `assets/refactor-spec-template.md` with stable IDs
`RF-1`, `RF-2`, … Each `RF-n` names:
- **Current problem & `file:line` sites** (with rough LOC to remove);
- **Target shape** (the unified module, type/union, or deletion);
- **Must-delete targets** (exact files/symbols that must have `0` references
  left when done);
- **Behavioral equivalence criteria (`AC-n`)** and whether **pinning tests
  (`pin-first`)** are required before moving structure.

### 4. Review loop & Gate G1

Send the Refactor Spec through [doc-review.md](doc-review.md) with one extra
instruction to the Reviewer: **reject speculative churn** — any `RF-n` whose
cost/blast radius exceeds the reader-load it removes is graded `false` or
recommended to drop.

At **Gate G1**, present a compact ROI table (`RF-n | Category | Files | Est.
lines removed | Risk | Pin needed?`) plus any *Discovered Bugs*, and let the
human approve all or cherry-pick which `RF-n` items enter the plan.

---

## Phase 1b: Cutting the Refactor Plan

Write the plan from `assets/plan-template.md` (`plan-lint.mjs` validates it as
usual), sequencing waves for zero-regression safety:

1. **Wave 1 — Pinning Tests & Pure Subtraction:**
   - **Pin first:** for any `RF-n` touching behaviorally under-tested code, put
     a characterization-test task (or step 1 inside the lane) in Wave 1 that
     locks current observable outputs on `base_sha` (`pin-first`: must **PASS**
     before structural edits begin).
   - **Subtract before reshaping:** group safe pure deletions (dead files,
     unused exports, comment slop) into Wave 1 so later waves operate on a
     smaller, cleaner tree.
2. **Wave 2..N — Canonicalize, Migrate Callers & Delete Legacy Paths:**
   - Pull shared canonical types/utilities early, then migrate callers and
     **delete the duplicate/legacy functions and files in the same task or wave**.
   - Never leave deprecated aliases, re-exports, or parallel old-and-new paths
     behind.
   - Slice tasks along module seams so parallel lanes do not collide on barrel
     exports or shared index files (list shared barrels in Part B2 of the plan).
3. **Final Wave — `QA` Equivalence & Slop-Delta Gate:**
   - Full test suite + E2E + visual diff (when UI files moved);
   - Mechanical verification that every `Must-delete` symbol/file across all
     approved `RF-n` items is gone (`0` references);
   - Net codebase delta summary (files removed, production LOC added vs deleted).

---

## Phase 2: Refactor QC Additions in Cook

Phase 2 runs the standard [cook.md](cook.md) loop (`Orchestrator` → lane
`Advisor` or `Lead` → `Worker` / `Tester` / `Reviewer`), with `"mode": "refactor"`
set in each task's `<task>-evidence.json` packet so
`scripts/verify-evidence.mjs` enforces three refactor-specific gates:

1. **`pin_first_proofs` (replaces `red_first` unless fixing an explicitly scoped bug):**
   When a task contract lists `pin_first_required: ["AC-1", ...]`, `Tester` runs
   the characterization test against `base_sha` (on the detached stage checkout)
   and proves it **PASSES (`exit_code: 0`)** before the structural change *and*
   still passes on `tested_sha`.
2. **`must_delete` zero-leftover proof:**
   Every legacy file or symbol scheduled for removal in the task contract is
   listed under `must_delete` in `<task>-evidence.json` with `remaining_refs: 0`
   and the exact search command (`git grep` / ripgrep / AST check) run on
   `tested_sha`. `verify-evidence.mjs` fails the task if `remaining_refs > 0` or
   a deleted file path still exists.
3. **Anti-bloat LOC guard (`loc_delta`):**
   Each refactor task records `loc_delta: { prod_added: <n>, prod_deleted: <n> }`
   (from `git diff --numstat <base_sha>..<tested_sha>` excluding test/doc paths).
   If `prod_added > prod_deleted` on a refactor task without an explicit
   `loc_increase_reason`, `verify-evidence.mjs` rejects the packet — preventing
   "refactoring" that quietly adds more code than it removes.

Reviewer triage in [review-method.md](review-method.md) also applies two
refactor-specific blocking checks:
- **Accidental behavior drift:** any changed HTTP status, error code, payload
  field, DB write, ordering or UI state not authorized by the spec is `high`
  (`blocking: true`).
- **Increased reader load:** if a task replaced straightforward code with deeper
  indirection without eliminating duplication or invalid states, revert/simplify
  it before acceptance.
