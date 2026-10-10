# Review method

How a BE or FE Reviewer stage produces its findings. It runs unattended inside
a lane, so nothing in it may wait for a person. It borrows BMAD's review lenses
and triage rules when the BMAD skills are installed on the execution host, and
falls back to the same steps done by hand when they are not.

## What not to run

Never run these inside a lane, on any role:

- `bmad-code-review`: it halts several times for a person's choice, and one of
  its options makes the reviewer apply its own patches. Workers own fixes.
- `bmad-build-auto`: it is its own unattended loop, a second orchestrator
  inside the harness's.
- `bmad-walkthrough`: it is a guided review with a person in it.

## Inputs

- `review_round`: `full` for the first review of a feature revision, `delta`
  for verifying fixes after `changes_required`.
- The reviewed range: `base_sha..reviewed_sha` for `full`,
  `last_reviewed_sha..reviewed_sha` for `delta`. Write the unified diff to a
  uniquely named temp file outside the worktree; lenses read that file, and the
  diff text never goes into a prompt.
- The feature contract: `result`, `acceptance`, `constraints` and the `rules`
  paths. This is the change's intent.
- For `delta`: the open findings of the previous round, with their IDs.

## Lenses

| Round | Lenses |
| --- | --- |
| `full` | `adversarial`, `edge-case-hunter`, `verification-gap`, plus `fe-quality` when the diff touches UI |
| `delta` | `edge-case-hunter`, `verification-gap`, plus `fe-quality` when the delta touches UI |

`adversarial` must return at least ten findings, so it runs only in the full
round. Running it in every round would keep the review/fix loop from ever
settling. Most of its findings end as `false` or `low` in triage, and that is
expected.

Each lens's recipe is its BMAD reference file, found in the installed
`bmad-review` skill:

- `references/lens-adversarial.md`
- `references/lens-edge-case-hunter.md`
- `references/lens-verification-gap.md`

Resolve the skill folder on the execution host (`~/.agents/skills/bmad-review`
or the host's skills directory). When `bmad-review` is installed and the
project has `_bmad/` (the nearest ancestor of the worktree containing one),
invoke it with an explicit lens list (`skill:bmad-review lenses=<codes>`), the
diff file as content and the contract's intent as `also_consider`, and set the
output to `json`; record `review_method: bmad-review`. Without `_bmad/`,
`bmad-review` would stop to offer setup, so load the three lens files yourself
and run them as written; record `review_method: bmad-lenses`. The project's
BMAD customization applies only in the first form.

When `bmad-review` is not installed at all, run the same three passes from
their descriptions in this file: an adversarial pass that reads only the diff,
an edge-case pass that traces every branch and boundary the change reaches, and
a verification-gap pass that reads the tests before claiming what they cover.
Record `review_method: builtin` in the report.

### `fe-quality` lens

Not shipped by BMAD; give this text to the lens as its whole recipe:

> Review the UI part of the diff for problems a user meets: missing loading,
> empty and error states; keyboard reachability and focus order; visible focus;
> labels and roles for controls; touch targets on coarse pointers; layout at
> narrow widths and with long or translated text; colours and sizes that bypass
> the project's tokens; copy that bypasses the project's i18n. Read the
> project's UI rules from the contract's `rules` paths first. Report each
> finding with `location`, `trigger_condition`, `guard_snippet` and
> `potential_consequence`. Do not assign severity. Return `[]` when the UI
> change has none of these problems.

### Running the lenses

Every lens sees the diff file and the contract intent, never another lens's
findings. Give the edge-case, verification-gap and fe-quality lenses the
contract's `rules` paths; keep the adversarial lens context-free, it reads only
the diff. When the reviewer's provider has in-process subagents, launch one
per lens, all before reading any result, each with: "Return ONLY your findings.
Do not invoke any skill and do not spawn subagents." Otherwise run them one
after another in the reviewer session. A lens that fails or returns nothing is
listed under `failed_lenses` and the review continues with the rest.

## Triage

The reviewer, not the lenses, judges every finding after all lenses report:

1. Verify the claim at the cited file and line. Follow callers and upstream
   guards until the bad outcome is shown to happen or not. A true fact about
   nearby code does not settle the finding.
2. Give exactly one verdict:
   - `high`: the bad outcome is real and intolerable for users or developers.
   - `medium`: real and tolerable.
   - `low`: real, cosmetic or negligible.
   - `false`: checked, the bad outcome does not happen here; write what
     disproves it.
   - `maybe-false`: the code at hand cannot settle it; write what check would.
   When the harm is real but its size is unclear, take the higher grade. A
   developer-only harm must name where it will break.
3. A verification-gap finding arrives with its evidence; trust what it filed
   and grade it.
4. Never drop a finding silently. `false` and rejected `low` findings go in
   the report's `rejected` list with their reason. Reject a `low` finding when
   everyday use is unlikely to meet it and its fix adds branches or guards.
5. The project's rules (contract `rules`) override a lens's opinion: a finding
   that asks for something the rules forbid is `false`; a rule violation is at
   least `medium`.

## Report

Map the triaged findings onto the stage report in
[task contracts](task-contracts.md#stage-outcomes-and-evidence):

| Triage | Report field | Routing |
| --- | --- | --- |
| `high` | finding, `blocking: true` | `review_verdict: changes_required` |
| `medium` | finding, `blocking: lead` | the lead fixes it or records a reasoned deferral before acceptance |
| `low` (kept) | finding, `blocking: false` | note only |
| `maybe-false` | finding, `blocking: lead`, with the check that settles it | the lead routes the check to the Tester or decides |
| `false`, rejected `low` | `rejected` list with the refutation | none |

Each finding carries a stable ID `R<round>-<n>`, the lens that raised it, file
and line, `trigger_condition` as the trigger, `potential_consequence` as the
impact, the triage grade as severity, `guard_snippet` as the proposed fix, the
fix owner (the lane's worker for the touched paths) and the verification that
will prove it fixed. Findings from several lenses about the same defect stay
separate and are linked; overlap is signal.

`review_verdict` is `changes_required` when any finding is `blocking: true`,
`blocked` when the diff or rules could not be read, and `clear` otherwise.
`clear` with `blocking: lead` items is still clear for the reviewer; the lead
owns those items. Also record `review_round`, the reviewed range,
`review_method` (`bmad-review`, `bmad-lenses` or `builtin`), the lenses run and
`failed_lenses`.

## Delta round

A delta round reviews only the fix range and settles the previous round's open
findings: each one is `resolved` (cite the commit and the evidence that covers
its trigger), `open` or `superseded`. New findings in the delta get new IDs.
An open `high` keeps `changes_required`. A delta that touches files outside the
fixes, or more than the fixes need, gets a `full` round instead.
