# Document review

How a spec or a plan is reviewed in phase 1. The author's draft is checked by a
reviewer that did not write it and does not share the author's context, because
an author rereading their own document sees what they meant, not what it says.

## The reviewer

- A separate agent instance on the profile the user chose (SKILL.md, "Roles in
  phase 1"). Start it through the harness as its own session, or as an
  in-process subagent when the user accepts that. It receives files and a
  contract, never the author's reasoning or this conversation.
- Record the requested and the effective model. On a proven launch failure move
  to the next entry of the user's list; when the list is exhausted, ask the
  user rather than reviewing your own document.
- The same reviewer session may serve every round of one document and then the
  plan; it keeps useful context. Start a fresh one when its context fills up or
  it starts defending its earlier findings instead of rereading.

## Contract for the reviewer

Give it a self-contained contract (a file in the run folder), with absolute
paths:

```yaml
role: document reviewer
document: <path of the spec or plan>
kind: spec | plan
round: <n>, full | delta
sources: <what the document must agree with: requirement sources and saved copies for a spec; the approved spec for a plan>
repository: <checkout path, so that claims about code can be checked>
project_profile: <path>
method: <absolute path of this file>; lenses in <absolute path of lenses/>
lenses: <the list for this round, from the table below>
style: <the project's documentation rules, document language, reader type>
previous_findings: <report path of the last round, for a delta round>
may_edit: false | true (only in a review-and-fix round)
report: <path for the report in the run folder>
```

Tell it to change nothing but the report, unless `may_edit` is true, and never
to commit, push or touch the tracker.

## Lenses

Each lens is one pass with one method. Recipes are in `lenses/`
([README](lenses/README.md)); the reviewer loads the files and runs them as
written. With subagents available it runs the independent lenses in parallel,
each seeing the document and the contract but no other lens's findings.

| Lens | File | Spec | Plan | What it looks for |
| --- | --- | --- | --- | --- |
| `adversarial` | `lens-adversarial.md` | full round | full round | What is missing or wrong; at least ten findings |
| `edge-case-hunter` | `lens-edge-case-hunter.md` | every round | every round | States, boundaries and paths the document leaves unhandled |
| `traceability` | `lens-traceability.md` | every round | every round | Sources, requirements, criteria, tasks and tests that do not line up |
| `test-impact` | `lens-test-impact.md` | criteria only | every round | Criteria nobody can test; impact rows that are missing or unchecked |
| `structure` | `lens-structure.md` | last round | last round | Shape: cuts, merges, moves |
| `prose` | `lens-prose.md` | last round, after `structure` | last round, after `structure` | Wording that blocks understanding |

`adversarial` runs only in the full round: it must return at least ten
findings, so running it every round would keep the loop from ever settling.
The editorial lenses run once, on the last round, when content has stopped
moving; they never challenge content, only how it is organized and expressed.

## Triage

The lenses raise candidates; the reviewer judges each one after all lenses
report, and no finding is dropped silently:

1. Check the claim against the document, its sources and, for claims about
   existing behaviour, the code. A finding that cites a file or a rule must
   quote it.
2. Grade it:

| Grade | Meaning | Effect |
| --- | --- | --- |
| `blocking` | The document is wrong, contradicts a source, or leaves out something a team would build wrongly without | Must be fixed before the gate |
| `should-fix` | Real and worth fixing; a careful team would probably cope | Fixed, or deferred by the author with a written reason |
| `minor` | Real, small | Author's choice |
| `needs-human` | Only the human can settle it: a business rule, scope, a missing fact | Goes into the next question batch |
| `false` | Checked; the problem does not exist here | Listed with what disproves it |

   When the harm is real but its size is unclear, take the higher grade.
3. A project rule outranks a lens's opinion: a finding that asks for something
   the rules forbid is `false`; a rule violation is at least `should-fix`.

Each finding in the report has a stable ID (`S<round>-<n>` for a spec,
`P<round>-<n>` for a plan), the lens, the location (section and line), the
problem in one line, the proposed fix, the consequence if it ships, the grade,
and what would prove it fixed.

## Rounds

| Round | Reviewer | Author |
| --- | --- | --- |
| 1, full | Runs the full-round lenses, triages, writes the report. Edits nothing | Answers every finding: fixes it, or rejects it with a reason. Rejections go into the document's review log. Asks the human the `needs-human` batch |
| 2, delta | Settles each earlier finding as `resolved`, `open` or `superseded`; reviews what changed; runs the editorial lenses. When `may_edit` is true it fixes what remains itself and lists each edit | Reads the reviewer's edits (diff against the snapshot); disagreement goes to the human |
| 3, only if round 2 left a `blocking` finding open | One more delta, limited to the open findings | Fixes |

After round 3, stop and take what is still open to the human with both views.
More rounds rarely converge; they usually mean the document needs a decision,
not another review.

A finding the author and the reviewer disagree on is never closed by whoever
speaks last: it goes to the human with the author's reasoning and the
reviewer's counterexample.

## One writer at a time

- Snapshot the document into the run folder before each round, so that every
  round can be diffed.
- While the reviewer works, the author does not edit the document. In a
  review-and-fix round the reviewer is the only writer.
- For a plan, run `plan-lint` after every edit by anyone.

## Closing the loop

The loop is closed when no `blocking` finding is open, every `should-fix` is
fixed or deferred with a reason, `needs-human` findings are answered or parked
as open questions with the parts they block, and for a plan the lint passes.

Append a short entry to the document's review log (round, reviewer model,
counts by grade, what was rejected and why, report path), update the builder
state, and go to the gate.
