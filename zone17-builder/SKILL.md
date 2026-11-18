---
name: zone17-builder
description: >-
  Take a piece of work from request to final pull request in two gated phases.
  Phase 1, documents: write a spec, then an implementation plan with a task
  pipeline, per-task impact outside the task and a full test plan; an
  independent reviewer model reviews both with bundled review lenses, unclear
  points go back to the human, and the human approves each document. Phase 2,
  cook: execute the plan with parallel worktree teams, independent test and
  review per task, QC gates, wave and final QA, ending at the final pull
  request. Use whenever the user wants to build a feature or a batch of work
  end to end, write or review a spec or an implementation plan, break work
  into a task pipeline, or execute ("cook") a plan with agent teams, and for
  "zone17-builder", "lên spec", "lên plan", "cook plan". Works in any project:
  commands, rules and tracking are discovered from the current project.
  Loading this skill alone does not start a team or a schedule.
---

# Zone17 Builder

One workflow from a request to the final pull request, in two phases with a
human gate between every step that commits the team to something.

```text
Phase 1 · Documents (this session is the author)
  intake -> questions -> SPEC -> review loop -> G1 human approves the spec
         -> PLAN (pipeline, impact, test plan) -> lint -> review loop
         -> G2 human approves the plan
Phase 2 · Cook (this session becomes the Advisor)
  G3 human says start -> waves of task teams (code -> test -> review -> QC)
         -> wave gate on the integration branch -> final QA task
         -> G4 final pull request, QA report attached   <- the run ends here
```

## Scope

The skill covers the original request up to the final pull request. Merging
that pull request, deploying, releasing and anything else outside the approved
spec are separate requests the user makes when they want them; do not start
them as "the obvious next step". During the run the user may ask for extra work;
handle it as a [change request](#change-requests) or report it beside the plan
as work outside it, never by quietly growing the scope.

The skill is project-neutral. Nothing in it names a stack, a tracker, a branch
model or a test command. Read those from the current project every time
([project profile](references/project-profile.md)) and never carry a value from
another project into this one, even one you remember well.

## Invocation

`zone17-builder [spec | plan | cook | status] [harness=<name>]`

- No phase word: resume from the builder state if one exists; otherwise start
  at `spec`.
- `spec`, `plan`, `cook`: enter that phase. A phase whose gate is not met (a
  plan without an approved spec, a cook without an approved plan) can be
  entered only with a document the user supplies; bring that document up to
  what the phase needs first, by [adopt.md](references/adopt.md).
- `status`: report gates, open questions, review rounds and, during cook, the
  Advisor progress report. Change nothing.
- `harness=<name>` selects the runtime for cook and for reviewer sessions;
  default `orca`. See [cook](references/cook.md#select-the-harness).

## What to read, and when

| When | Read |
| --- | --- |
| Always first, before any writing | [project-profile.md](references/project-profile.md) |
| Writing or changing a spec | [spec.md](references/spec.md), `assets/spec-template.md` |
| Writing or changing a plan | [plan.md](references/plan.md), `assets/plan-template.md` |
| A spec or a plan already exists | [adopt.md](references/adopt.md) |
| Before sending any document to review | [doc-review.md](references/doc-review.md) |
| The user says start cooking | [cook.md](references/cook.md), then the files it names, then [qa-qc.md](references/qa-qc.md) |
| Closing the run | [qa-qc.md](references/qa-qc.md#final-qa-task), `assets/qa-report-template.md` |
| After each gate, each accepted task, and at the end of the run | [improvement.md](references/improvement.md) |

Do not load the cook references during phase 1; they are long and only matter
once teams run.

## Gates

A gate is passed only by the evidence in its row. Record each pass in the
builder state with a timestamp from the system clock and, for human gates, the
user's own words.

| Gate | Passed when | Who passes it |
| --- | --- | --- |
| G0 intake | Project profile written; sources read; the first question batch answered or parked | Author |
| G1 spec | Review loop closed with no open blocking finding; open questions listed with the tasks they block; the user approves | Human |
| G2 plan | `plan-lint` exits 0; review loop closed; every acceptance criterion and impact row has a test; the user approves | Human |
| G3 start | The user explicitly says to start cooking; roster confirmed; base branch is the one the plan names | Human |
| G4 final PR | Final QA task accepted; QA report written; final pull request open, or reported ready where a person must open it | Advisor, then the run stops |

Approval of one gate does not carry to the next. An approved spec is not
permission to cook, and "looks good" on a draft plan is not G3. When it is not
clear which gate the user's words pass, ask.

## Roles in phase 1

- **Author**: the current session. It writes the spec and the plan, answers
  findings, and owns the documents between review rounds.
- **Document reviewer**: an independent agent on a model the user chooses. Ask
  for it once, at the first review, as an ordered list (`<agent> <model>
  [effort]`, primary first, then fallbacks); reuse the answer for later rounds
  and for the plan. Never invent a model. A reviewer on the same model as the
  author reviews more shallowly, so say so when that happens.
- **Human**: decides business meaning, scope, and every gate.

The reviewer's method, the bundled lenses and the round limits are in
[doc-review.md](references/doc-review.md). The lenses are copied into this skill
(`references/lenses/`), so no project and no host needs BMAD installed.

## Asking the human

Unclear points are the main source of rework, so surface them early and ask
well:

- First try to answer from the code, the project's documents and earlier
  decisions; cite where the answer came from. Ask only what is truly the
  human's to decide: business rules, scope, priorities, trade-offs, data that
  only they or their analysts hold.
- Ask in batches at natural points (after intake, after each review round),
  not one interruption per doubt. Each question states what you found, the
  options, what each option costs, and your recommendation.
- Never fill a gap with invented business data to keep moving. An unanswered
  question goes into the document's open-questions section with its owner and
  the tasks it blocks; work that does not depend on it continues.
- Record every answer in one decision record: the user's words, the system
  time, and what it supersedes. Then update the document; a decision that lives
  only in chat is lost to reviewers and to the teams in phase 2.

## Builder state

Keep one small state file per run, `builder-state.json`, in the run folder
([project profile](references/project-profile.md#run-folder)): request summary,
the skill version the run started with (top entry of `CHANGELOG.md`, plus the
repository commit when known), document paths and versions, reviewer profile
(requested and effective), review rounds with report paths, open questions,
gate passes, and during cook a pointer to the cook run manifest. Recover from it before creating anything; a
conversation summary is not a substitute. Never store credentials there.

## Change requests

A requirement that changes after G1 is a change request, whoever raises it:

1. Write a spec addendum (or a new spec version) that says what changes and
   what it supersedes; ask what is unclear.
2. Update the plan: new or changed tasks, their impact rows and tests, the
   pipeline, and the weights. Run `plan-lint`.
3. Send only the changed parts through the review loop.
4. Get the user's approval, then bump the scope version. During cook, tell the
   affected leads, and report the new denominator explicitly.

Small clarifications that change no behaviour are recorded as decisions without
this loop. Work the user asks for outside the spec stays outside the plan's
percentage unless they ask to add it.

## The skill improves with use

Each run leaves notes about the process itself: a rule that was missing,
unclear, wrong, or heavier than what it caught. The Advisor writes them to
`skill-notes.md` in the run folder as it goes, sorts them at the end of the run
(this project, this run only, or the process in general), and proposes changes
to the human when there are any worth making. Nothing is proposed for the sake
of proposing. An approved change is made in the skill's source repository with
a `CHANGELOG.md` entry and then copied to every host; an installed copy is
never edited by hand, and a run in progress keeps the version it started with.
The method is in [improvement.md](references/improvement.md).

## Bundled resources

- `scripts/plan-lint.mjs`: checks a plan's pipeline table against its task
  sections (unknown or circular dependencies, wave numbers, weights, missing
  fields, acceptance criteria without a test). Run with Node; `--help` lists
  options and the label aliases it accepts.
- `scripts/word_metrics.py`: word counts for the editorial lenses.
- `assets/`: spec, plan and QA report templates. Write documents in the
  project's document language; keep the template's field labels or their listed
  aliases so the lint can read the plan.
- `references/lenses/`: review lens recipes for code and documents.
- `harness/`: runtime adapters for cook and reviewer sessions.
