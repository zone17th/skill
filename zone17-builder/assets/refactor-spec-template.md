# Refactor Spec: <title / scope>

> Mode: refactor (100% behavior-preserving) · Status: draft | in review | approved <date> · Version: <n>
> Author: <who> · Reviewer / Panel: <models> · Tracking: <issue reference, or none>

Write in the project's document language. Keep IDs (`RF-`, `AC-`, `D-`, `Q-`)
stable. Every `RF-n` must justify its existence by deleting dead weight,
collapsing duplication, tightening domain types, or lowering reader load —
without altering observable external behavior. Delete this note.

## 1. Audit scope & baseline

- **Target paths / modules:** <repo-wide or specific directories>
- **Baseline commit (`base_sha`):** <branch @ SHA>
- **Static audit commands run:** <`tsc`, `knip`, eslint, compiler flags, grep scripts + summary counts>
- **Baseline test health:** <suites run, executed/passed/skipped counts>

## 2. Boundary & behavioral invariance

- **In scope (`RF-n` categories included):** <…>
- **Out of scope (left untouched on purpose):** <boring clear code, frozen modules, upcoming feature areas>
- **Must hold invariant (100% unchanged):** <public APIs, DB schemas/data, CLI flags, UI visuals/flows, permissions, error codes>

## 3. Refactor items (`RF-n`)

### RF-1 · <short title, e.g. Unify 3 duplicate exam-timer formatters>

- **Category:** <dead-code | duplication | defensive-slop | domain-shape | comment-slop | test-hygiene>
- **Current state & evidence:** <exact `file:line` sites and why it hurts reader load or safety; est. lines removed: `~N`>
- **Target shape:** <canonical module/type/state machine or pure deletion>
- **Must-delete targets:** <exact legacy files, exported functions, types or shims that must have `0` remaining references>
- **Pinning needed (`pin-first`):** <`yes` (name the characterization test to pass on `base_sha` first) | `no — already covered by <existing test>`>
- **Equivalence criteria:**
  - **AC-1** <observable behavior that remains identical before and after, and the test/equivalence command proving it>
  - **AC-2** `0` references to `<deleted symbols/paths>` remain in the repository on `tested_sha`.

### RF-2 · <short title>

<same fields>

## 4. ROI summary table (for Gate G1 selection)

| ID | Category | Touched area | Est. prod LOC delta | Pinning needed | Risk | Include? |
| --- | --- | --- | --- | --- | --- | --- |
| RF-1 | duplication | `packages/web-*` | `-120 / +35` | no | standard | yes |

## 5. Cross-module impact & shared barrels

| Shared file / contract | Affected by `RF-n` | How callers migrate |
| --- | --- | --- |

## 6. Discovered bugs or feature gaps *(Out of scope — do NOT fix silently)*

Bugs found while auditing code. Keep them out of refactor tasks so behavior
stays 100% pinned unless the human explicitly files/approves a separate fix.

| ID | Location (`file:line`) | Current buggy behavior | Suggested follow-up ticket |
| --- | --- | --- | --- |

## 7. Decisions & open questions

| ID | Question or Decision | Recommendation / Answer | Decided by, when | Blocks |
| --- | --- | --- | --- | --- |

## Review log

| Round | Date | Reviewer / Panel | Blocking | Should fix | Rejected churn (`RF-n` dropped) | Report |
| --- | --- | --- | --- | --- | --- | --- |
