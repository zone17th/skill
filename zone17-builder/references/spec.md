# Phase 1a: Spec

The spec states what will be true when the work is done and how anyone can
check it. It does not say how to build it; that is the plan. A good spec lets a
reviewer who never saw this conversation find the gaps, and lets a tester in
phase 2 write tests without asking what "works" means.

## 1. Intake

1. Restate the request in two or three sentences and list what the user gave
   you: requirement documents, designs, tickets, examples, earlier specs.
2. Read every source in full. When a source lives outside the repository and
   can change (a wiki page, a design canvas), save a dated copy where the
   project keeps such copies, so that the reviewer and later the teams read the
   version you read. Note any source you could not open.
3. Read the code the request touches before writing about it. Record current
   behaviour with file references. Requirements written without looking at the
   code describe a system that does not exist.
4. Draw the boundary: what is in scope, what is explicitly out, and what
   existing behaviour must not change.

## 2. Find what is unclear

Go through the request looking for the things that cause rework later:

- terms used two ways, or two sources that disagree;
- a rule stated for the normal case only: what happens at zero, at the limit,
  on the second attempt, when two people do it at once, when it fails halfway;
- behaviour for each role and each state of the data, not only the main one;
- anything about existing data or users when the new rule arrives;
- numbers without units or bounds, and lists that end in "etc.";
- a requirement with no way to observe that it holds.

Sort each item:

| Kind | What to do |
| --- | --- |
| The code or the project's documents already answer it | Answer it yourself and cite the source |
| A business or scope decision | Ask the human, following "Asking the human" in SKILL.md |
| A reversible detail with an obvious default | Write it as a labelled assumption and list it for confirmation at G1 |
| Data only the business holds (real lists, prices, wording that must be exact) | Ask; leave it empty and marked until answered. Never invent it |

Ask the first batch before writing the spec body, so the answers shape it.
Later batches come out of the review loop.

## 3. Write the spec

Start from `assets/spec-template.md`, in the project's document language and at
the project's document location. Rules that make the spec usable downstream:

- **Stable IDs.** Requirements `R-n`, acceptance criteria `AC-n`, decisions
  `D-n`, open questions `Q-n`. The plan, the tests and the QA report all point
  at these IDs, so never renumber; retire an ID instead.
- **Observable acceptance criteria.** Each one names a condition someone can
  check: an input and the result, a state and what the user sees, a request and
  the response. "Works correctly" and "is fast" are not criteria. Give negative
  criteria too: what is refused, and with which error.
- **Every requirement has at least one criterion**, and every criterion points
  back to a requirement.
- **Effect on what exists.** Say what changes for existing data, existing users,
  existing screens and other parts of the system. This section seeds the plan's
  "impact outside the task" rows, so be specific about what and where.
- **Non-functional requirements only where they apply**: security and
  permissions, performance with a number, accessibility, languages,
  compatibility. Take the project's standing requirements from the profile
  instead of restating them.
- **Decisions keep their trail**: who decided, when, in what words, and what
  was superseded.
- **Open questions are honest.** Each has an owner, a recommendation, and the
  requirements it blocks. A spec may pass G1 with open questions only when the
  user accepts that the blocked parts wait.

Before review, read the spec once as someone who was not in the conversation:
is every term defined, is every "as discussed" replaced by what was discussed.

## 4. Review loop

Send the spec through [document review](doc-review.md). Findings the reviewer
marks `needs-human` become the next question batch. Fix, re-review, and stop at
the round limit.

## 5. Gate G1

Give the user a short report: what the spec covers and leaves out, the decisions
taken, assumptions to confirm, questions still open and what they block, and
the review result (rounds, findings fixed, findings rejected with reasons).
Ask for approval. Record the approval with the spec's version or commit.

An approved spec is frozen. Later changes go through
[change requests](../SKILL.md#change-requests). Committing the spec or opening
a pull request for it follows the project's authorization rules; when they are
silent, ask.
