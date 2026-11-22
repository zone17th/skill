# Zone17 Skills

Reusable engineering skills for multi-agent coding workflows across providers
(Claude Code, Codex, Antigravity, Cursor, OpenCode, Orca).

## Available skills

### [zone17-builder](zone17-builder/SKILL.md) *(Primary — v0.2.0)*

End-to-end engineering workflow from request to final pull request in two gated
phases, project-neutral across stacks and trackers:

- **Phase 1 · Documents (`Author` → `Document Reviewer` / Panel → Human Gates G1 & G2):**
  - Runs quick empirical spikes/prototypes before freezing specs or plans when
    code can settle a technical or performance fork.
  - Writes a traceable **Spec** (`R-n`, `AC-n`, `D-n`, `Q-n`) and **Plan**
    (`Domain shape`, pipeline DAG/waves/weights/risk, per-task external impact,
    and behavioral + `red-first` test plans).
  - Validates plans mechanically with `scripts/plan-lint.mjs` and reviews via
    bundled lenses (single reviewer or cross-vendor 2-model panel).
- **Phase 2 · Cook (`Orchestrator` → Lane `Advisor` / `Lead` → Gate G4 Final PR):**
  - **Orchestrator** coordinates waves, handles immediate `worker_done` and
    escalations, reruns merge checks on the integration branch, enforces wave
    gates, and audits worktree/ledger hygiene via `scripts/audit-lanes.mjs`.
  - Each plan task runs in one isolated lane owned by either an **`Advisor`**
    (pure lane coordinator; edits no product code) or a **`Lead`** (implements
    its `focus` slice + coordinates parallel workers; never self-tests or
    self-reviews).
  - Every `Lead`, `Advisor` and `BE/FE Worker` follows
    [worker-principles.md](zone17-builder/references/worker-principles.md)
    (domain shape & boundary discipline first, anti-slop subtraction, root-cause
    fixes, 2-strike fresh-worker rotation with *Attack the Premise*, and a
    pre-handoff deslop/no-comments pass).
  - `Tester` and execution-grounded `BE/FE Reviewer` validate behavior;
    `scripts/verify-evidence.mjs` checks every acceptance log, SHA, suite count
    delta, `red-first` failure proof and review verdict before acceptance.
  - Saved **Roster Presets** (`~/.agents/zone17-roster.json` via
    `zone17-builder setup`), quiet watchdog heartbeats on idle ticks, and
    `/ketchup`-style catch-up reports when state changes.

### [zone17-cook-plan](zone17-cook-plan/SKILL.md) *(Legacy v1)*

First-generation standalone cook workflow, retained intact so already-active v1
runs can finish cleanly without mid-run drift. Use **`zone17-builder`** (or
`zone17-builder cook` with an existing plan) for all new work.

## Install globally

With the Skills CLI:

```sh
npx skills add zone17th/skill --skill zone17-builder --global
```

Manual installation: clone this repository and copy `zone17-builder/` into
`~/.agents/skills/zone17-builder` (linking into `~/.claude/skills/`,
`~/.codex/skills/`, `~/.gemini/skills/` or `~/.cursor/skills/` where needed).

## Mechanical verification scripts (`zone17-builder/scripts/`)

All Node scripts are zero-dependency ES modules:

```sh
node zone17-builder/scripts/plan-lint.mjs <plan.md>
node zone17-builder/scripts/verify-evidence.mjs <task-evidence.json>
node zone17-builder/scripts/audit-lanes.mjs --repo <repo> --manifest <run-manifest.json> --integration <branch>
python zone17-builder/scripts/word_metrics.py <doc.md>
```
