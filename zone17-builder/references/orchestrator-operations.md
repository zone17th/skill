# Orchestrator operations

Field-tested operating rules for Phase 2. They complement the harness execution
guide (Orca: [execution.md](../harness/orca/execution.md)),
[orchestrator-checkpoint.md](orchestrator-checkpoint.md) and
[qa-qc.md](qa-qc.md). Stricter project rules in `project-profile.md` always win.

## Acceptance

1. **Mechanical packet check first.** Run
   `node <skill-root>/scripts/verify-evidence.mjs <packet.json>` before reading
   prose summaries. If any AC lacks a command, zero exit code, matching SHA or
   existing raw log, or if base-vs-head counts regressed unexplained, return the
   output directly to the lane `Advisor` or `Lead`.
2. **Rerun checks on the merge result yourself.** Before committing an
   integration merge, ensure/migrate the integration checkout's test database
   and run the affected checks (typecheck, lint, affected suites, boundary/dead-code
   gates) plus repository contract tests. Check verbose output for silent DB/env
   `SKIP`s — a skipped test is zero evidence even when exit code is `0`. When
   `Tester` ran on a lightweight model, rerun every affected check in full.
3. **Inspect uncovered deltas.** Diff `reviewed_sha..tested_sha`. Production
   changes require a Reviewer delta pass (or a recorded `Orchestrator` review if
   trivial). Any post-review edit to tests or fixtures **must** get a Reviewer
   delta pass checking for weakened assertions, new skips or widened tolerances.
   Only pure documentation deltas pass with a note.
4. **Withhold on unexecuted criteria.** Never accept a task with an unexecuted
   criterion; send a follow-up stage to the same lane `Advisor` or `Lead`.
5. **Additive integration conflicts.** The `Orchestrator` may resolve purely
   additive conflicts (exports, barrel files, locale keys, schema registrations)
   by keeping both sides and noting it in the merge commit. Behavioral conflicts
   go back to the owning lane.
6. **Cleanup & tracker update.** Close child/cloud-runner sessions, unlink
   external junctions before `orca worktree rm`, drop per-lane DBs, run
   `node <skill-root>/scripts/audit-lanes.mjs`, and advance tracker status only
   along the project's documented workflow.

## Small findings

A finding is small when its fix needs no new design or broad retest: a 1–3 line
mapping/copy/token tweak, a missing boundary parse with an obvious unit assertion,
or a tiny test-assertion tightening. Fix it immediately via an in-process
subagent (under [worker-principles.md](worker-principles.md)) rather than
spinning a full lane round:

- Edit only when no other editor is active on that checkout (lane head between
  stages, or integration branch right after merge).
- One atomic commit (with test when behavior changes).
- The lane `Advisor`/`Lead` or `Orchestrator` reads the diff and reruns affected
  checks directly, recording the SHA in the packet. Anything larger or touching
  another lane's paths goes through the normal Worker → Tester → Reviewer loop.

## 2-strike failure recovery (Fresh Worker + Attack the Premise)

When a `Worker` fails **two consecutive fix rounds** on the same test or review
finding:

1. **Stop reusing that Worker session.** Sunk-cost context causes agents to
   stack guards onto a broken premise. Release/close the Worker session while
   keeping the lane head checkout and branch intact.
2. **Spawn a fresh Worker session** on the same checkout with:
   - the original task contract and `worker-principles.md` path;
   - exact command and failure output;
   - 3–5 bullet lines summarizing what Attempts 1 and 2 changed and why they
     failed;
   - instruction: *"Verify the shared premise of the two failed attempts before
     writing a third patch."*
3. **Escalate on strike 3.** If the fresh Worker also fails, pause only that
   lane and send a compact decision packet to `Orchestrator` (options, root
   contradiction, whether the task spec/contract itself is flawed).

## Visual testing

- Route `visual_stages` to `Tester visual` when configured, else `Tester`.
- **Deterministic diff first.** Compare screenshots/DOM snapshots against
  committed baselines or a reference oracle with an explicit tolerance. The
  model classifies a diff (`expected`, `regression`, `within_tolerance`,
  `stale_baseline`, `environment`, `uncertain`); it never eyeballs parity from a
  single screenshot without a reference. `uncertain` escalates to the lane owner
  or `Orchestrator` — never auto-accept.
- **Screenshots never prove** persistence, authorization, idempotency or tenant
  isolation; verify those with automated functional tests.
- Record baseline OS/platform gaps (e.g. `win32` vs Linux CI), rerun without
  snapshot-update flags to prove zero diff, and stop/clean all app servers and
  seed data when the stage finishes.

## Single Orchestrator: lease and coordinator discipline

- **Read first, then acquire.** Read the lease file, `run-show` coordinator and
  precheck log in one step; acquire the lease in a separate step only if expired,
  finished, or already owned by this session. Never use a combined check-and-write
  that could clobber a live peer tick.
- **Touch every ≤ 10 minutes** during long integration suites or E2E runs
  (run heavy commands in the background and refresh the lease between checks so
  the 15-minute watchdog never starts a competing `Orchestrator`).
- **Coordinator drift check.** Inspect `run-show` every pass. If a child or lane
  accidentally bound the parent Run as coordinator, re-bind the parent Run from
  the `Orchestrator`, drain the inbox immediately, and remind lanes never to
  bind the parent Run.

## Launch races and delivery recovery

- **Fresh-worktree setup race:** If an agent launches while a worktree setup
  hook is still running, the TUI may fail to open and drop prompt text into a raw
  shell (e.g. PowerShell `>>`). Stop the Dispatch, close the terminal, wait for
  setup completion, verify `git status` is clean, and retry on the same worktree.
  If a second supervised start fails the same way, open a plain terminal in the
  worktree, start the agent TUI manually until idle, create a fresh Task with
  `dispatch --return-preamble`, paste/submit once, verify `turn_started`, and
  record the abandoned Task ID.
- **Stuck composer:** Only when `terminal read --screen` proves the exact
  pending prompt sits unsubmitted in the intended agent composer with no active
  turn, submit once via the documented adapter (or one bare Enter when that is
  the adapter's documented path) and verify `turn_started`. Never press Enter on
  silence, a shell prompt, or an unreadable screen.
- **Duplicate `ask` timeouts:** Reply to every duplicate `ask` ID with the same
  recorded decision and leave a one-line note telling the sender the question is
  settled.

## Transient provider errors

- **Nudge, never fall back** on HTTP 429, "model at capacity", 5xx gateway
  blips, or dropped streams (for 5xx, wait until the endpoint responds `< 500`
  first). A zero-token scheduler precheck nudger may resume stalled screens when
  no busy spinner follows the error, honoring the pause marker.
- **Fall back only on proven unavailability** (exhausted quota/credits, missing
  CLI/launcher). Notify the user if fallback puts Reviewer and Author/Worker on
  the exact same model, as single-model review has blind spots.

## Host resources & remote test runner

- Enforce per-host lane concurrency caps; run affected-only checks inside lanes
  and reserve full-suite runs for Wave gates and Final QA.
- Check CPU and disk before heavy builds/E2E; keep build/temp caches on volumes
  with headroom; pin runtime versions (e.g. Node/Python major) from
  `project-profile.md`.
- **Remote test runner (when present):** `Tester` (or `Tester cloud`) pushes
  only the lane branch to run non-visual checks remotely and captures SHA,
  command, exit code and raw log. Visual/desktop stages stay on the host. Close
  remote runner agents and `Tester cloud` terminals as part of lane close, list
  them in `DONE`, and have `Orchestrator` verify closure every pass.

## Standing cleanup (automated via `audit-lanes.mjs`)

Run `node <skill-root>/scripts/audit-lanes.mjs --repo <repo> [--manifest <run-manifest.json>] --integration <branch>`
on every `Orchestrator` pass and at every lane close:

1. **Sessions:** release settled stage/worker Dispatches and close dead tabs.
2. **Worktrees (all hosts & repos):** unlink external junctions/symlinks first
   (delete the link, never its target), remove merged clean worktrees via normal
   `orca worktree rm` (never `--force`), verify the directory is gone on disk,
   and delete merged local branches. Enforce max **5 worktrees per lane**.
3. **Data & ports:** drop per-lane/stage test DBs (in background if `DROP`
   waits), delete temporary storage buckets/caches, free ports, and close remote
   runner sessions of closed lanes.
4. **Never** delete committed evidence, baselines, dirty/unmerged worktrees, or
   processes by image name (kill only verified PIDs).

## Pause, resume and scope questions

- **Pause:** write the pause marker honored by prechecks/nudgers; instruct live
  `Advisor`/`Lead` lanes to finish their current command, let running child
  stages write reports, revert nothing, and persist exact resume state (SHA,
  stage, active child). Disable the watchdog schedule.
- **Resume:** only on explicit user instruction — remove the pause marker,
  re-enable the schedule, wake paused lanes, and drain queued events.
- **Scope/contract questions from lanes:** inspect the code one layer deeper
  before answering; many apparent gaps are already answered by existing services
  or schemas. Reply with concrete boundaries, required tests and affected paths.
