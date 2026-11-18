# QA and QC

What phase 2 adds to the cook loop so that "tests passed" means the work is
right, and so that tasks that pass alone also work together. QC is checking
each task's output; QA is checking the whole as it comes together. Both run for
every task and every run, whatever models fill the roles.

Contents: [QC per task](#qc-per-task) · [Wave gate](#wave-gate) ·
[Final QA task](#final-qa-task) · [Final pull request](#final-pull-request) ·
[Follow-ups and lessons](#follow-ups-and-lessons)

## QC per task

The lead puts these into the task contract from the plan (`test_plan`,
`regression_scope`, `risk_tier`, `red_first`) and into every Tester and
Reviewer brief. The Advisor checks them at acceptance; a missing one means the
task is not accepted yet and goes back to the same lead.

### 1. The plan's tests exist and ran

Every acceptance criterion's planned test exists, is named so it can be found,
and ran on the submitted revision. The acceptance packet carries a table: one
row per criterion with the test, the command, the exit code, the log and the
SHA. A criterion with an empty cell was never verified.

When a planned test turns out to be the wrong one, the lead says so and
proposes the replacement; it does not quietly drop it.

### 2. Regression scope

The Tester runs every check in the task's impact rows, not only the task's own
tests. This is the part that catches a change breaking something outside the
files it edited. An impact found during the work that the plan missed is added
to the scope and reported to the Advisor, who adds it to the plan's row.

### 3. Red-first proof

A test that cannot fail proves nothing. For every bug fix, and for the
criteria a `high` risk task marks `red_first`, the Tester shows that the new
test fails without the change:

1. In the lane's read-only stage checkout (never on the lane branch), restore
   the production files to their state before the change while keeping the new
   test. `git checkout <base_sha> -- <production paths>` on a detached checkout
   does this; when files are too entangled, revert the fix commit there instead.
2. Run the new test. It must fail, and for the reason the criterion describes,
   not because it no longer compiles.
3. Record the command, the failing output and both SHAs, then discard the
   checkout's changes.

A test that still passes without the change goes back to the worker as a
finding: it asserts nothing about the behaviour.

### 4. Test changes are reviewed

Any commit that changes tests or fixtures after the last review gets a delta
review aimed at weakened verification: removed or loosened assertions, new
skips, wider tolerances, mocks replacing the path under test, expected values
edited to match the output. Editing a test until it passes is the cheapest way
to make a failure disappear, so it is never waved through with a note. Only
documentation-only deltas can pass with a recorded note.

### 5. Counts against the base

A green exit code can hide tests that stopped running. Per suite, the Tester
reports executed, passed, failed and skipped counts for the tested revision and
for the base revision. Fewer executed tests, or any new skip, needs a reason in
the report. Disabling, skipping or deleting a test to get a pass is a blocking
finding unless the plan says the behaviour it tested was removed.

### 6. Unstable tests

A failing test is a failure until someone shows otherwise. Tester briefs do not
pre-label any failure as known or unrelated.

- To call a failure unstable, the Tester reruns the test alone at least three
  times, records the results, and states a cause it can point to (timing, load,
  shared state, order). "Passed on rerun" alone is not a diagnosis.
- Each unstable test gets an entry in the run's unstable-test ledger with its
  owner and a follow-up, and the project's tracker item when the project uses
  one. The Advisor decides whether it blocks.
- Tests of a high-risk area are never set aside as unstable: an intermittent
  failure there is investigated as a possible real race.
- A test may be quarantined only by the Advisor, with a recorded reason, and it
  is listed in the QA report.

### 7. Evidence that counts

As in [Advisor operations](advisor-operations.md#acceptance): each check has its
command, exit code, raw log and tested SHA; a test that skipped for a missing
service is not evidence; the Advisor reruns the affected checks on the merge
result itself.

## Wave gate

Tasks are tested alone in their lanes. The wave gate tests them together, early
enough that a conflict is cheap to fix.

When the last task of a wave is merged into the integration branch, and at
least once a day on long waves, the Advisor runs on the integration head:

1. the project's full non-visual checks (through the remote runner when the
   project has one);
2. the end-to-end suite, when the project has one;
3. the cross-task regression checks: impact rows whose owner or affected thing
   belongs to a different task than the one that changed it.

Record the result in the run folder with command, exit code, log and SHA.

- A failure gets an owner the same day: the task whose change caused it, or a
  new follow-up task when the cause spans tasks. Tasks that depend on the
  broken area are not accepted until it is fixed; unrelated tasks keep going.
- The next wave's tasks may start before the gate finishes. The gate limits
  what can be accepted, not what can begin, so that lanes do not idle.
- Treat this as integration work: it gets its own lead when it needs fixing
  ([One lead per plan task](cook.md#one-lead-per-plan-task)).

## Final QA task

The plan's last task. It has its own lead and its own contract, and it checks
the whole run against the spec on the integration branch. It finds problems; it
does not build features. Small fixes follow the
[small findings](advisor-operations.md#small-findings) rule, larger ones become
fix tasks.

1. **Spec walk.** For every acceptance criterion of the spec: the task that
   implemented it, the test that proves it, and its result on the final
   integration SHA. Any criterion without evidence is a defect, even if every
   task was accepted.
2. **Full run.** All checks of the project profile on the final integration
   SHA: static checks, all test levels, end-to-end, build, and the plan's
   performance checks. Counts against the run's base revision.
3. **Whole-run regression.** Every impact row of every task once more, on the
   final SHA.
4. **Flows across tasks.** The end-to-end scenarios the spec implies that no
   single task owns, including the failure paths.
5. **Visual sweep**, when the work has screens: the project's required
   viewports, themes and languages, by the
   [visual testing](advisor-operations.md#visual-testing) rules.
6. **Documents match the code.** The spec, the plan and the project documents
   the profile names say what was built; deviations decided during the run are
   written back with their decision IDs.
7. **Ledgers closed.** Every follow-up, deferred finding, unstable test and
   quarantined test has one of: fixed, a tracker item with an owner, or a
   recorded decision not to do it. Nothing is left as a bare note.
8. **QA report** from `assets/qa-report-template.md`, in the run folder and
   wherever the project keeps such reports.

The Advisor accepts the QA task like any other: by reading the evidence and
rerunning the checks on the final SHA.

## Final pull request

The run's last act. Open the pull request from the integration branch to the
plan's target branch when the project profile and the plan's authorization
allow the agent to open it; otherwise report it ready and stop. Its body gives a
reviewer who was not in the run what they need:

- what was built, by spec requirement, and what was left out or deferred;
- the acceptance table (criterion, evidence, result) or a link to the QA report;
- test results on the final SHA with counts;
- known issues, unstable tests, follow-ups with their tracker items;
- what a person should check by hand, and how;
- for data or configuration changes: what runs on deploy, what it touches and
  how to undo it. This is information for whoever releases; releasing is not
  part of this run.

Then stop. Merging this pull request, deploying and anything after are the
user's separate requests ([SKILL.md](../SKILL.md#scope)). Report the final
state, disable the run's schedule, and close leads, sessions, worktrees and
per-lane resources by the [standing cleanup](advisor-operations.md#standing-cleanup-every-pass-unprompted)
rules.

## Follow-ups and lessons

- **Follow-up ledger.** One file per run: every finding deferred at a task's
  acceptance, with its source, severity, owner and state. The Advisor reviews
  it at each wave gate; an item that can lose data, money or access is raised
  to the user at once, not carried to the end.
- **Numbers worth keeping.** Per task: fix rounds, findings by stage. Per run:
  defects found at the wave gate and at final QA that a task's own QC should
  have caught, and the count of unstable tests. They show where the process
  leaks, which is the point of counting.
- **Notes on the process.** After each accepted or abandoned task, each wave
  gate and final QA, the Advisor adds what it learned about the process to
  `skill-notes.md` in the run folder: what escaped a stage and why, which rule
  would have caught it, what slowed lanes down, where the skill was silent or
  got in the way. Leads send such observations to the Advisor in their
  messages.
- **Lessons and proposals.** At the end of the run the Advisor sorts the notes
  into lessons about this project (for its rule files or the next run's team
  rules), lessons of this run only, and lessons about the process (candidates
  for this skill), writes them to `lessons.md`, and puts the proposals, if
  there are any, in the final report for the user to decide.
  [Improving this skill](improvement.md) gives the note format, the sorting and
  how an approved change is applied. Do not edit the project's rule files or
  this skill on your own.
