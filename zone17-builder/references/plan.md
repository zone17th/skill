# Phase 1b: Plan

The plan turns an approved spec into tasks that teams can build in parallel in
phase 2. Each task becomes one lead's contract there, so the plan is written
for a reader who has only the plan, the spec and the repository: a lead on
another machine, with none of this conversation.

Write the plan as one file from `assets/plan-template.md`, at the project's
plan location and in its document language. Keep the template's field labels
(or the aliases `plan-lint --help` lists), because the lint and the cook phase
read them.

## The parts of a plan

| Part | Holds | Why it exists |
| --- | --- | --- |
| A. Run setup | Branches and base commit, gates, what the run is authorized to do, tracking, environment, acceptance rules common to all tasks | Leads apply the same rules without asking |
| B. Conventions for this run | Contracts decided up front, migration rules, shared files and who may edit them | Parallel teams do not collide |
| C. Pipeline | Dependency table, waves, diagram, critical path, milestones | The Advisor knows what to start and what waits |
| D. Task contracts | One section per task | Each becomes a cook contract |
| E. Risks | What may go wrong and what to do then | Leads stop and report instead of improvising |
| Review log | Rounds, findings fixed, findings rejected | The next reader sees why the plan looks this way |

## Cutting tasks

- One task is one independently deliverable result that one lead can take
  through code, test and review: small enough to finish in one focused lane,
  large enough to be testable on its own.
- Split along seams where teams will not edit the same files. When two tasks
  must touch the same file, name the file in part B with its owner and order.
- Pull shared contracts out first: an API shape, a schema, a shared type or
  component that several tasks consume becomes its own early task, and its
  consumers depend on it. This is what makes later waves parallel.
- Do not split tightly coupled work just to raise the task count.
- Every plan ends with one **QA task** in the last wave that depends on all
  others ([QA and QC](qa-qc.md#final-qa-task) says what it does).
- Each requirement and acceptance criterion of the spec lands in at least one
  task. Keep a coverage table (spec ID to task) in part C or as an appendix;
  the reviewer's traceability lens checks it.

## The pipeline (part C)

One table drives the whole run:

| Task | Hard deps | Soft deps | Wave | Weight | Risk |
| --- | --- | --- | --- | --- | --- |

- **Hard dependency**: the task cannot start until the other is merged into the
  integration branch. **Soft dependency**: it can start, but cannot be
  submitted until the other lands (for example a screen built against an agreed
  contract while the backend is still in work). Being honest about which is
  which is what keeps lanes from idling.
- A task can also wait on a **gate** that is not a task: a design that is not
  drawn yet, an access, a decision the user owes. Give the gate an ID in part
  A's gate table and list that ID among the task's hard dependencies. Gates do
  not change wave numbers; the Advisor holds the task until the gate is passed.
- **Wave** = 1 for tasks without hard dependencies, otherwise one more than the
  latest wave among its hard dependencies. The wave is the earliest moment a
  task may start, not a schedule.
- **Weight**: the task's share of the work, used for the progress percentage.
  Weights are fixed when the plan is approved; splitting a task later divides
  its weight among the children.
- **Risk**: `standard` or `high`, by the project profile's risk list.

Below the table, add the diagram of waves, the critical path (the longest
chain; `plan-lint` prints it), the tasks worth starting first because others
wait on them, the most lanes that can run at once, and what to hold back when
the host is full.

## Task contracts (part D)

Each task section has these fields. The two in bold type are where plans most
often fall short, and they are what phase 2's quality checks run on.

- **Spec**: the requirement, criterion and decision IDs this task implements.
- **Deliverables**: what exists when the task is done, concretely: endpoints,
  screens, migrations, jobs, documents.
- **Owned paths**: the files and folders this task may edit. Everything else
  is read-only for it.
- **Out of scope**: what a reader might assume is included and is not.
- **Acceptance**: criteria `AC-1`, `AC-2`, … local to the task, each an
  observable condition with the evidence that will prove it (a command, an
  assertion, a browser scenario).
- **Impact outside the task**: see below.
- **Test plan**: see below.
- **Design / references**: design files, saved sources, examples, when any.

### Impact outside the task

A change rarely stays inside the files it edits. This field lists everything
outside the task's owned paths that can behave differently because of it, so
that someone checks each one instead of discovering it after merge.

Derive it from the code, not from memory. For each thing the task changes,
search for who uses it: callers and importers of changed functions and types,
consumers of changed endpoints, events and schemas, readers of changed tables
and columns, screens that render a changed shared component, configuration and
environment readers, permissions and roles, seed and fixture data, generated
clients, translations, documentation, scheduled jobs, external integrations,
and other tasks of this plan that are in work at the same time.

Write one row per affected thing:

```text
- <what is affected> (<where: path or symbol>) → <the check that proves it still works> [owner: this task | <other task ID>]
```

- The check is an existing test to run, a new test to write, or a named
  scenario. "Verify manually" is not a check unless it names the scenario and
  the expected result.
- `owner` says who makes the change the affected thing needs, if any. When it
  is another task, that task's contract lists the same item from its side.
- When the search finds nothing, write `none` followed by what you searched
  and where. A bare "none" tells the reader nobody looked.

In phase 2 these rows become the task's `regression_scope`: the Tester runs
every check in them, and the wave gate reruns the ones that cross tasks.

### Test plan

"Fully tested" has a definition here, so that author, reviewer and tester mean
the same thing:

1. Every acceptance criterion has at least one test, named with the criterion
   ID, its level (unit, integration, contract, end-to-end, visual, performance)
   and the command that runs it. Choose the lowest level that really observes
   the behaviour; a screenshot does not prove a save, and a unit test with the
   database mocked does not prove a constraint.
2. Every failure the criterion implies has a negative test: the refused input,
   the missing permission, the conflict, the limit.
3. Every impact row has its regression check listed here too.
4. A `high` risk task adds what its risk demands, taken from the profile and
   the kind of risk: each permission alone and absent; replay and concurrent
   attempts for anything that can be sent twice; migration run on data shaped
   like production's, not only on an empty database; boundary values for
   calculations; and for those criteria a **red-first** mark, meaning the test
   must be shown failing on the code before the change.
5. Bug fixes always carry a red-first test that reproduces the bug.
6. Test data: what it is, where it comes from, how parallel runs stay isolated.
7. What is deliberately not tested, and why. An honest gap is reviewable; a
   silent one is not.

## Lint, then review

Run the lint before each review round and after each fix:

```text
node <skill-root>/scripts/plan-lint.mjs <plan.md>
```

It checks what a script can check: the table against the sections, unknown and
circular dependencies, wave numbers, weights against the declared total,
missing or empty fields, criteria with no test, impact rows with no check, and
a closing QA task. Exit code 0 is required for G2. It cannot judge whether a
task is well cut or an impact list is complete; that is the review's job.

Then send the plan through [document review](doc-review.md) with the spec as
its source.

## Gate G2

Report to the user: the number of tasks, waves and total weight; the critical
path; the high-risk tasks and what extra they get; open questions and the tasks
they block; what the plan assumes about hosts and tools; the lint result and the
review result. Ask for approval, and say plainly that approving the plan does
not start the cook. Record the approval with the plan's version or commit.

When the project requires tracker items for plan tasks, create them after G2
under the project's rules and write their IDs into the pipeline table.
