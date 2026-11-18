# Starting from documents that already exist

A spec or a plan written before this skill, or by other means, can enter the
workflow. The aim is to bring it up to what the next phase needs, not to
rewrite it: keep its content, its IDs and its language, and add what is missing.

Do not move a run that is already cooking under another workflow onto this
skill midway. Finish it there; adopt from the next run.

## An existing spec

1. Write the project profile and read the spec with its sources and the code,
   as intake would.
2. Check it against what phase 1 requires of a spec ([spec.md](spec.md)):
   stable IDs for requirements and criteria; observable acceptance criteria,
   including refusals; the effect on what exists; decisions with their trail;
   open questions with what they block. List the gaps.
3. Close the gaps in place, or in an addendum when the spec is approved and
   versioned and its owner prefers it untouched. Where the spec has no IDs, add
   them without changing wording. Never renumber IDs that others already cite.
4. Run [document review](doc-review.md) once, as a full round with the
   `traceability`, `test-impact` and `edge-case-hunter` lenses. Skip the
   editorial lenses and the adversarial lens unless the user wants the spec
   reopened: an approved document is being checked for fitness, not rewritten.
5. Bring `needs-human` findings and anything that changes meaning to the user.
   If only form changed (IDs, structure), record that G1 stands on the earlier
   approval; if content changed, ask for approval of the changes.

## An existing plan

1. Run `plan-lint` on it first. The result is the list of mechanical gaps. A
   plan with different labels may need only a labels file (`--labels`); see
   `--help`.
2. Upgrade the plan in place:
   - one pipeline table with hard and soft dependencies, wave, weight and risk
     per task (merge tables that hold these separately);
   - in each task that is not finished: acceptance criteria with IDs, owned
     paths, **impact outside the task** derived from the code, and a **test
     plan** that covers every criterion and impact row ([plan.md](plan.md));
   - a closing QA task, if the plan has none;
   - gates that tasks wait on, as gate IDs.
3. Tasks already merged stay as they are. Add a `Status` column to the pipeline
   table, mark them `done` and give them no new fields (the lint then skips
   their sections); their weight counts as accepted. Their changes
   still matter: the impact rows of the remaining tasks must take the merged
   code into account, and the final QA task covers the whole spec.
4. Run the lint until it passes, then one review round with `traceability` and
   `test-impact`, limited to what was added.
5. Tell the user what was added and what it changes in effort, since new tests
   and impact checks are real work that the original weights did not count. Adjust
   weights only with their agreement, as a new scope version. Ask for approval
   of the upgraded plan (G2); the earlier approval did not cover the additions.

## What adoption does not do

- It does not judge again decisions the user already made, or reopen an
  approved scope.
- It does not make an old plan pass by filling fields with placeholders. An
  impact row or a test nobody thought about is worse than an honest gap, because
  it looks checked.
- It does not start the cook. G3 is still the user's word.
