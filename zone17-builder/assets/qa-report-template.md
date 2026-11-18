# QA report: <run title>

> Spec: <path, version> · Plan: <path, version, scope version> · Integration branch: <name> @ <final SHA>
> Base: <branch> @ <SHA> · Written: <system time> · By: <QA lead>, accepted by <Advisor>

## 1. Verdict

<ready for the final pull request | not ready>, with the reasons in two or
three sentences. Name anything a person must decide.

## 2. Acceptance against the spec

| Spec criterion | Task | Test or scenario | Result on final SHA | Evidence |
| --- | --- | --- | --- | --- |
| AC-1 | | | pass / fail / not run | <log path> |

Criteria without evidence: <list, or "none">.

## 3. Checks on the final SHA

| Check | Command | Exit | Executed | Passed | Failed | Skipped | Base executed / skipped | Log |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

New skips or fewer executed tests than the base, with reasons: <…>

## 4. Regression and cross-task flows

| Item (impact row or flow) | From task | Check | Result | Evidence |
| --- | --- | --- | --- | --- |

## 5. Wave gates

| Wave | SHA | Result | Failures and what was done |
| --- | --- | --- | --- |

## 6. Visual sweep

<Viewports, themes and languages covered; findings; or "no screens in this run".>

## 7. Open items

| Item | Kind (defect, follow-up, unstable test, quarantined test, deferred finding) | Severity | Owner | Tracker item or decision |
| --- | --- | --- | --- | --- |

## 8. Deviations from the spec or plan

| What differs | Decision ID | Documents updated |
| --- | --- | --- |

## 9. For whoever releases

<What runs on deploy (migrations, configuration), what it touches, how to undo
it, and what to check afterwards. Releasing is outside this run.>

## 10. Numbers

- Tasks: <n>; fix rounds per task: <min / median / max>
- Findings by stage: test <n>, review <n>, wave gate <n>, final QA <n>
- Found late (at a wave gate or final QA, should have been caught in a task): <n>, listed in lessons
- Unstable tests: <n>
