# Adopting existing specs and plans

Bring an existing spec or plan up to the next phase's mechanical bar without
rewriting approved substance: preserve its language, intent and existing IDs,
and add only missing structure. Never migrate an already-cooking run mid-flight
from legacy `zone17-cook-plan`; finish that run there and start the next phase
or batch on `zone17-builder`.

## Adopting an existing spec

1. Write `project-profile.md` and read the spec alongside its sources and code.
2. Check against [spec.md](spec.md): stable `R-n` / `AC-n` / `D-n` / `Q-n` IDs
   (add missing IDs without renumbering cited ones), observable positive and
   refusal criteria, *Effect on what exists*, decision trail, and honest open
   questions.
3. Fill gaps in place (or via an addendum if the approved file is frozen).
4. Run one [doc-review.md](doc-review.md) round with `traceability`,
   `test-impact` and `edge-case-hunter` (skipping `adversarial` and editorial
   lenses unless the user wants a full reopen).
5. Batch `needs-human` items. If only formatting/IDs were added, record G1
   standing on prior approval; if behavior changed, confirm G1 with the user.

## Adopting an existing plan (including entering `zone17-builder cook`)

1. Run `node <skill-root>/scripts/plan-lint.mjs <plan.md>` (passing `--labels`
   if custom headings exist) to list exact mechanical gaps.
2. Upgrade unfinished tasks in place ([plan.md](plan.md)):
   - single pipeline table (`Task | Hard deps | Soft deps | Wave | Weight | Risk`);
   - per unfinished task: `AC-n` criteria, `Domain shape`, `Owned paths`,
     code-searched `Impact outside the task`, and a full `Test plan`;
   - a closing `QA` task in the final wave and any gate IDs.
3. Already-merged tasks keep a `Status: done` column entry (`plan-lint.mjs`
   checks their dependencies/weights and skips section field checks); account
   for their merged code in remaining tasks' impact rows and in Final QA.
4. Run `plan-lint.mjs` to exit `0`, then one review pass (`traceability` +
   `test-impact`) on the added sections.
5. Report added checks/impact rows, confirm G2 on the upgraded plan, and wait
   for explicit G3 before cooking. Never pad missing fields with fake
   placeholders just to turn the linter green.
