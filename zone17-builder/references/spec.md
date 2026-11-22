# Phase 1a: Spec

The spec states what will be true when the work is done and how anyone can
verify it. It does not prescribe internal implementation; that belongs in the
plan. A strong spec lets an independent reviewer catch gaps without reading this
chat, and lets a Phase 2 Tester write behavioral tests without asking what
"works" means.

## 1. Intake

1. Restate the user's goal in two or three sentences and inventory every source
   provided: requirement docs, designs, tickets, examples, prior specs.
2. Read every source in full. When an external source can mutate (wiki, Figma
   frame, shared doc), save a dated snapshot where the project stores references
   so reviewers and Phase 2 lanes read the exact version you read.
3. **Read the touched code first.** Record current behavior with `file:line`
   references. Specs written without reading the codebase describe an imaginary
   system.
4. Draw explicit boundaries: **in scope**, **out of scope**, and **must not
   change**.

## 2. Empirical spikes (settle technical forks before asking or freezing)

Before turning technical doubts into guesses or human questions, check whether a
quick experiment can settle them:

- When feasibility, API behavior, query/render latency, library compatibility,
  or layout fidelity is uncertain and can be measured in 15–30 minutes, run a
  **throwaway spike/prototype** in an isolated scratch branch or temp script
  (never on the integration or default branch).
- Record the measured result (command, numbers, tradeoffs) in the spec's
  *Sources* or *Current state* section and delete the throwaway edits.
- Never ask the human to guess an engineering fact the codebase or a 15-minute
  run can prove.

## 3. Find what is unclear

Scan the request for rework traps:

- terms used inconsistently, or sources that disagree;
- happy-path-only rules: behavior at zero, at bounds, on duplicate/concurrent
  submission, or on partial failure;
- behavior across every user role and data state;
- migration behavior for existing records and in-flight sessions;
- numbers without units/bounds, or open-ended lists ending in "etc.";
- requirements with no observable check.

Sort each item:

| Kind | Action |
| --- | --- |
| Answered by code, git/PR history or project docs | Answer it yourself and cite `file:line` or commit/PR |
| Empirical technical/performance fork | Run a bounded throwaway spike (Section 2) and cite the result |
| Business rule, scope or product tradeoff | Batch for the human per "Asking the human" in [SKILL.md](../SKILL.md) |
| Reversible detail with an obvious default | State as a labelled assumption to confirm at G1 |
| Exact business data only stakeholders hold | Ask; leave marked and empty until answered — never invent it |

Ask the first question batch before drafting the full spec body so the answers
shape the structure.

## 4. Write the spec

Start from `assets/spec-template.md`, in the project's document language and
location:

- **Stable IDs.** Requirements `R-n`, acceptance criteria `AC-n`, decisions
  `D-n`, open questions `Q-n`. Never renumber retired IDs; mark them retired.
- **Observable acceptance criteria.** Every `AC-n` states starting state, action
  and observable outcome — plus negative/refusal criteria (what is rejected and
  with which error). "Works properly" and "fast" are invalid.
- **Bidirectional links.** Every `R-n` has at least one `AC-n`, and every `AC-n`
  maps to an `R-n`.
- **Effect on what exists.** Name affected existing data, users, screens, jobs
  and modules with paths; this seeds the plan's *Impact outside the task* rows.
- **Measurable non-functional requirements** only where applicable (security,
  latency/throughput numbers, a11y, i18n), referencing `project-profile.md`
  rather than repeating standing repo rules.
- **Decision trail & honest open questions.** Record who decided what, when, in
  their words, and what `Q-n` blocks which `R-n`.

## 5. Review loop & Gate G1

Send the spec through [doc-review.md](doc-review.md) (single reviewer or a
2-model cross-vendor panel). Route `needs-human` items into a single question
batch, resolve blocking/should-fix findings, and stop at the 3-round cap.

At **Gate G1**, present a concise summary: scope in/out, spike findings (if
any), decisions recorded, assumptions to confirm, open questions with blocked
requirements, and review counts/rejections. Record the user's approval with the
spec version/commit. After G1, the spec is frozen; modifications go through
[change requests](../SKILL.md#change-requests).
