# Improving this skill (`encode-lessons-in-structure`)

Every run exposes process friction: a silent gap, an ambiguous contract, or a
rule heavier than the bugs it caught. Collect facts during the run, enforce
fixes at the **highest structural level** that works so prompts stay lean, and
apply changes only in the source repository after human approval.

## 1. Note friction as you go (`skill-notes.md`)

The Author (Phase 1) and `Orchestrator` (Phase 2) append concise factual entries
to `skill-notes.md` in the run folder (lane `Advisor`s and `Lead`s send process
observations in their messages; only `Orchestrator` writes the file):

- after gates G1 and G2 (what did reviewers or the human catch late?);
- after any task needing $> 1$ fix round or hitting the 2-strike worker reset;
- after Wave gates and Final QA (what escaped per-task QC?);
- whenever the `Orchestrator` had to improvise around a silent or overly rigid
  rule.

Entry shape:

```text
## <ISO time> · <phase / task / gate>
- Fact & evidence: <what happened + log/report path>
- Cost: <extra rounds, wasted tokens, late defect, unnecessary human question>
- Root process cause: <missing check | unclear contract | wrong rule | prompt bloat | tooling>
- Candidate fix & level: <architecture | script/lint | test | prose> — <1-line idea>
```

## 2. Sort by scope, then enforce at the highest structural level

At run close (or immediately when the same mistake class appears **twice**),
sort entries by destination:

| Scope | Belongs in | Action |
| --- | --- | --- |
| Specific to this repository/stack | Project rules, types, or CI/lint | Propose as a project improvement; never put repo specifics into `zone17-builder` |
| One-off runtime/provider incident | Run `lessons.md` | Record only; propose nothing |
| Reusable across projects | `zone17-builder` | Evaluate via the 4-level hierarchy below |

### The 4-level enforcement hierarchy (never default to adding prose)

Assume every future agent skims long Markdown files under context pressure. When
fixing a recurring mistake class (2+ occurrences), pick the highest level that
prevents it mechanically:

1. **Level 1 — Architecture & Contract Shape:** change the workflow boundary or
   JSON/YAML contract schema so the bad state cannot be represented (e.g.
   isolating stage checkouts, splitting `Advisor` vs `Lead` roles, requiring
   `domain_shape` up front).
2. **Level 2 — Mechanical Script / Lint Check:** encode the rule in
   `scripts/plan-lint.mjs`, `scripts/verify-evidence.mjs`, or
   `scripts/audit-lanes.mjs` with an error message that names the exact fix.
   *Whenever a new script check covers an old prose paragraph, delete or shrink
   the prose paragraph in the same commit.*
3. **Level 3 — Automated Test / Self-check:** add a fixture check proving the
   script catches a real past mistake.
4. **Level 4 — Prose Rule (last resort, judgment calls only):** add Markdown
   instructions only when Levels 1–3 cannot express the rule. Deleting or
   simplifying heavy prose is as valuable as adding a rule.

## 3. Propose to the human & apply cleanly

Include concrete proposals (evidence count, target file/script, enforcement
level, token/latency cost, recommendation) at the end of the run report — or a
single line saying `No skill changes proposed` when none cleared the bar.

Once approved by the human:
1. Edit `zone17-builder` in its **source repository**, never only in an
   installed global folder.
2. Add a versioned entry to `CHANGELOG.md` citing the run/decision.
3. Verify `plan-lint.mjs`, `verify-evidence.mjs` and `audit-lanes.mjs` pass
   syntax and smoke checks.
4. Sync installed copies across configured hosts (reporting any unreachable
   host). Active runs keep the version recorded in their `builder-state.json`.
