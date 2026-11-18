# Bundled review lenses

Review recipes used by [document review](../doc-review.md) in phase 1 and by
the [code review method](../review-method.md) in phase 2. They are bundled so
that a project, an execution host or a remote worker needs nothing installed
beyond this skill. When a worker runs on a host that cannot read the skill
folder, copy this folder into the run folder and name that path in its contract.

| File | Lens | Used for |
| --- | --- | --- |
| `lens-adversarial.md` | `adversarial` | code, documents |
| `lens-edge-case-hunter.md` | `edge-case-hunter` | code, behavioural documents |
| `lens-verification-gap.md` | `verification-gap` | code |
| `lens-structure.md` | `structure` | documents |
| `lens-prose.md` | `prose` | documents, after `structure` |
| `editorial-common.md`, `structure-models.md` | shared by the two editorial lenses | documents |
| `lens-traceability.md` | `traceability` | specs, plans |
| `lens-test-impact.md` | `test-impact` | specs, plans |

## Origin

The first seven files and `scripts/word_metrics.py` are copied from the
`bmad-review` skill of BMAD-METHOD (`github:bmad-code-org/BMAD-METHOD`), as
installed on 2026-11-18, under its MIT licence; the copyright and permission
notice is in [`LICENSE-BMAD.txt`](LICENSE-BMAD.txt) and travels with these
files. This skill is not affiliated with or endorsed by the BMAD project. Local
changes are limited to how the files find each other and their settings:

- paths point into this folder instead of the BMAD skill root;
- `{workflow.*}` settings are replaced by values the review contract passes
  (style guide, reader type, standing directives);
- the word-count script is called with `python` instead of BMAD's `uv run`.

The lens methods themselves are unchanged. To pick up upstream improvements,
copy the files again and reapply those three changes. `lens-traceability.md`
and `lens-test-impact.md` are written for this skill.

Lenses emit findings without severity. Grading is the reviewer's job, in the
triage step of the method that called the lens.
