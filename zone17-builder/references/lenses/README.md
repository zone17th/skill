# Bundled review lenses

Review recipes used by [document review](../doc-review.md) in Phase 1 and by the
[code review method](../review-method.md) in Phase 2. They are bundled so that a
project, an execution host or a remote worker needs nothing installed beyond
this skill. When a worker runs on a host that cannot read the skill folder, copy
this folder into the run folder and name that path in its contract.

| File | Lens | Used for |
| --- | --- | --- |
| `lens-adversarial.md` | `adversarial` | code, documents |
| `lens-edge-case-hunter.md` | `edge-case-hunter` | code, behavioral documents |
| `lens-verification-gap.md` | `verification-gap` | code |
| `lens-structure.md` | `structure` | documents |
| `lens-prose.md` | `prose` | documents, after `structure` |
| `editorial-common.md`, `structure-models.md` | shared by the two editorial lenses | documents |
| `lens-traceability.md` | `traceability` | specs, plans |
| `lens-test-impact.md` | `test-impact` | specs, plans |

## Origin

The first seven files and `scripts/word_metrics.py` are derived from the
`bmad-review` skill of BMAD-METHOD (`github:bmad-code-org/BMAD-METHOD`), under
its MIT licence; the copyright and permission notice is in
[`LICENSE-BMAD.txt`](LICENSE-BMAD.txt) and travels with these files. This skill
is not affiliated with or endorsed by the BMAD project. Local adaptations:

- paths point into this folder instead of the BMAD skill root;
- `{workflow.*}` settings are replaced by values the review contract passes;
- `word_metrics.py` is invoked with `python` instead of `uv run`;
- `lens-adversarial.md` drops the mandatory 10-finding minimum quota so clean
  diffs and tight documents may return `[]` rather than padded low-signal noise.

`lens-traceability.md` and `lens-test-impact.md` are written for `zone17-builder`.
Lenses emit candidate findings without severity; verification and grading happen
in the Reviewer triage step.
