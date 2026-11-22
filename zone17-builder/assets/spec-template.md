# Spec: <title>

> Status: draft | in review | approved <date> · Version: <n> · Author: <who> · Reviewer / Panel: <models>
> Tracking: <issue reference, when the project requires one>

Write in the project's document language. Keep the IDs (`R-`, `AC-`, `D-`,
`Q-`) stable; the plan, tests and QA report point at them. Delete this note and
mark any inapplicable section in one line rather than leaving it blank.

## 1. Summary

<Two or three sentences: what changes for whom when this work is done.>

## 2. Sources & empirical spikes

| Source or spike | Version / date / command | Saved copy or measured result |
| --- | --- | --- |
| <requirement doc, design, ticket, or throwaway prototype benchmark> | | <snapshot path or measured numbers> |

## 3. Scope

- **In scope:** <…>
- **Out of scope:** <what a reader might expect and will not get>
- **Must not change:** <existing behavior preserved unchanged>

## 4. Current state

<What the system does today in the touched area, with `file:line` references.>

## 5. Terms

| Term | Meaning here |
| --- | --- |

## 6. Requirements

### R-1 <short name>

<What must be true. One cohesive behavior per requirement.>

- Source: <source and location, or decision D-n>
- Roles / states it applies to: <…>
- Acceptance criteria:
  - **AC-1** Given <starting state>, when <action>, then <observable result>.
  - **AC-2** *(Refusal / limit)* Given <invalid state or missing permission>, when <action>, then <error and unchanged state>.

### R-2 <short name>

<…>

## 7. Effect on what exists

What changes outside the new behavior (seeds the plan's *Impact outside the task* rows).

| What is affected | Where | How it changes | Requirement |
| --- | --- | --- | --- |
| <existing data, screens, endpoints, jobs, modules, permissions, docs> | <path or symbol> | | R-n |

## 8. Data and migration

<New or changed data shapes; handling of existing rows; rollback path.>

## 9. Non-functional requirements

Only applicable items, each with a measurable target (standing repo rules in
`project-profile.md` apply without repetition).

| Kind | Requirement | How it is checked |
| --- | --- | --- |
| Security and permissions | | |
| Performance | <number and conditions> | |
| Accessibility, languages, compatibility | | |

## 10. Decisions

| ID | Decision | Decided by, when | In their words | Supersedes |
| --- | --- | --- | --- | --- |
| D-1 | | | | |

## 11. Assumptions to confirm

| Assumption | Why it seemed safe | Confirmed |
| --- | --- | --- |

## 12. Open questions

| ID | Question | Recommendation | Owner | Blocks |
| --- | --- | --- | --- | --- |
| Q-1 | | | | R-n |

## Review log

| Round | Date | Reviewer / Panel | Blocking | Should fix | Minor | Rejected (with reason) | Report |
| --- | --- | --- | --- | --- | --- | --- | --- |
