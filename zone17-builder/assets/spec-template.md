# Spec: <title>

> Status: draft | in review | approved <date> · Version: <n> · Author: <who> · Reviewer: <model>
> Tracking: <issue reference, when the project requires one>

Write in the project's document language. Keep the IDs (`R-`, `AC-`, `D-`,
`Q-`) as they are; the plan, the tests and the QA report point at them. Delete
this note and any section that truly does not apply, saying so in one line
rather than leaving it empty.

## 1. Summary

<Two or three sentences: what will be different for whom when this is done.>

## 2. Sources

| Source | Version or date read | Saved copy |
| --- | --- | --- |
| <requirement document, design, ticket, conversation> | | <path, when the source can change> |

## 3. Scope

- **In scope:** <…>
- **Out of scope:** <what a reader might expect and will not get>
- **Must not change:** <existing behaviour that stays as it is>

## 4. Current state

<What the system does today in the area touched, with file references.>

## 5. Terms

| Term | Meaning here |
| --- | --- |

## 6. Requirements

### R-1 <short name>

<What must be true. One behaviour per requirement.>

- Source: <source and location, or decision D-n>
- Roles / states it applies to: <…>
- Acceptance criteria:
  - **AC-1** Given <starting state>, when <action>, then <observable result>.
  - **AC-2** <the refusal: given …, when …, then <error or unchanged state>>.

### R-2 <short name>

<…>

## 7. Effect on what exists

What changes outside the new behaviour. This seeds the plan's impact rows.

| What is affected | Where | How it changes | Requirement |
| --- | --- | --- | --- |
| <existing data, screens, endpoints, jobs, other modules, permissions, documents> | <path or name> | | R-n |

## 8. Data and migration

<New or changed data; what happens to existing records; how to go back.>

## 9. Non-functional requirements

Only the ones that apply, each with something measurable. The project's
standing requirements (see the project profile) apply without being repeated.

| Kind | Requirement | How it is checked |
| --- | --- | --- |
| Security and permissions | | |
| Performance | <a number and the conditions> | |
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

| Round | Date | Reviewer | Blocking | Should fix | Minor | Rejected, with reasons | Report |
| --- | --- | --- | --- | --- | --- | --- | --- |
