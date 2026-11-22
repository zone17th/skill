# Adversarial Lens

Conduct a critical review of the provided content.
Look for what is missing, broken, or contradicts stated invariants — not only
what is obviously wrong on the surface.

Focus strictly on high-signal defects: unstated failure modes, broken domain
invariants, caller/consumer breakage, security/authorization gaps, race
conditions, or unverified assumptions. If `also_consider` areas were provided,
weigh them alongside the analysis.

- Ground every finding in the actual artifact (and repository/sources when
  provided). Never invent nitpicks, stylistic preferences, or impossible
  hypotheticals merely to pad a list.
- If the content is empty, stop and say so.
- **Quality over quota:** return as many real issues as exist; an empty list
  (`[]`) is a valid result when the artifact genuinely holds up under scrutiny.

## Findings shape

Emit each finding with the canonical fields:

- `location` — where in the content (`file:line` for code, section/ID for
  documents, `"general"` when it spans the whole artifact)
- `trigger_condition` — the concrete condition or break, in one line
- `guard_snippet` — the root-cause fix or missing specification
- `potential_consequence` — what breaks in production or downstream work if
  unaddressed

No severity, priority, or ranking.
