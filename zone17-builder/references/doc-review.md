# Document review (Phase 1)

Every spec and plan is reviewed by an independent agent (or panel) that did not
author it and receives no hidden chat context — only the document, its sources,
`project-profile.md` and repository access.

## Single reviewer vs Multi-vendor Review Panel

- Load `doc_reviewer` (and optional `high_risk_panel`) from
  `~/.agents/zone17-roster.json` when present, confirming once with the user;
  otherwise ask once and offer to save the preset
  ([cook.md](cook.md#roster-presets)). Never invent a model or self-review in
  the Author session.
- **Standard mode:** one independent reviewer on a different model (ideally a
  different model family from the Author; note if same-model fallback occurs).
- **Panel mode (recommended for Round 1 `full` review of complex specs/plans):**
  spawn 2 reviewers from **different model families** in parallel (e.g. Claude +
  GPT/Codex or Gemini). Each runs the round's lenses independently; the Author
  merges and deduplicates their triaged findings. Cross-family panels catch
  architectural blind spots at Phase 1 token cost instead of Phase 2 rework cost.

## Reviewer contract

Write a self-contained contract file in the run folder with absolute paths:

```yaml
role: document reviewer
document: <absolute path of spec or plan>
kind: spec | plan
round: <1 | 2 | 3>, <full | delta>
sources: <requirement sources/snapshots for spec; approved spec path for plan>
repository: <checkout path to verify claims about existing code>
project_profile: <absolute path>
method: <absolute path of doc-review.md>; lenses in <absolute path of lenses/>
lenses: <list for this round>
style: <project doc rules, language, reader type>
previous_findings: <prior round report path, or null>
may_edit: false # true only if explicitly requested in Round 2 delta
report: <output report path in run folder>
```

The reviewer modifies nothing outside `report` (unless `may_edit: true`) and
never commits, pushes or mutates trackers.

## Lenses per round

| Lens | File | Spec | Plan | Focus |
| --- | --- | --- | --- | --- |
| `adversarial` | `lens-adversarial.md` | Round 1 (`full`) | Round 1 (`full`) | Missing requirements, broken assumptions, unstated failure modes (`[]` allowed if tight; zero filler) |
| `edge-case-hunter` | `lens-edge-case-hunter.md` | Every round | Every round | Unhandled states, boundaries, concurrency and lifecycle transitions |
| `traceability` | `lens-traceability.md` | Every round | Every round | Source ↔ `R-n` ↔ `AC-n` ↔ task ↔ test breaks and repo path mismatches |
| `test-impact` | `lens-test-impact.md` | Criteria check | Every round | Untestable criteria, wrong test levels, missing negative/risk tests, missing impact rows |
| `structure` | `lens-structure.md` | Final round | Final round | Organization: cuts, merges, ordering |
| `prose` | `lens-prose.md` | Final round (after `structure`) | Final round (after `structure`) | Clarity and concision (`word_metrics.py`) |

Run independent lenses in parallel subagents when supported, passing each lens
only the document and contract (never another lens's output). **Subagent tier
rule:** pin lens subagents to the `standard` tier (`Sonnet` / `Terra` / `Argon`
from `subagent_tiers`), never inheriting a `professor`-tier (`Fable` / `Astra` /
`Carbon`) or `deep`-tier model; if the runtime cannot pin a cheaper model for
subagents, a `professor` reviewer runs the lenses inline in its own session.

## Triage & grading

After lenses complete, the reviewer verifies every candidate against the
document, sources and repository code (quoting conflicting lines) and assigns
one grade:

| Grade | Meaning | Action |
| --- | --- | --- |
| `blocking` | Wrong, contradicts source/code, or omits something that causes a team to build the wrong thing | Must fix before gate |
| `should-fix` | Real gap worth closing | Fix, or defer with written rationale |
| `minor` | Small real improvement | Author's discretion |
| `needs-human` | Business rule, scope or stakeholder data only the human can decide | Batched to the human |
| `false` | Disproved against the document/repo | Recorded in `rejected` with refutation |

Project rules outrank lens preferences. Each finding carries a stable ID
(`S<round>-<n>` or `P<round>-<n>`), lens, location, one-line trigger, proposed
fix, consequence, grade, and verification check.

## Bounded rounds (max 3) & single-writer discipline

- Snapshot the document before each round; never edit while the reviewer runs;
  run `plan-lint.mjs` after every plan edit.
- **Round 1 (`full`):** full lenses → Author fixes, logs reasoned rejections,
  and batches `needs-human` questions to the user.
- **Round 2 (`delta`):** settles Round 1 findings (`resolved`, `open`,
  `superseded`), checks changed sections, and runs `structure` + `prose`.
- **Round 3 (`delta`, only if a `blocking` item remains):** scoped strictly to
  open `blocking` items. If anything remains disputed after Round 3, present
  both sides to the human rather than looping further.
- Close the loop by appending a summary row to the document's Review Log and
  updating `builder-state.json`.
