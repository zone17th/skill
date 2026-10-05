# Advisor operations

These rules come from running real phases. They add to the acceptance, delivery
and recovery contracts in the selected harness's execution guide (Orca: [execution](../harness/orca/execution.md)) and
[Advisor events and recovery](advisor-checkpoint.md). The project's own rules
still win when they are stricter. Keep project-specific values (proxy hosts,
drive letters, tracker names) in the run's team rules, not here.

## Acceptance

1. **Rerun it yourself.** Before committing an integration, the Advisor runs the
   affected checks on the merge result (typecheck, lint, the affected test
   files, boundary/unused-code gates) and then the repository's contract tests
   on the integration branch. A Tester pass never replaces this run. Record the
   commands, counts and exit codes in the merge commit body or checkpoint.
   First make sure the integration checkout's own test database exists and is
   migrated, using the project's ensure/migrate step. Then read the verbose
   output for skipped tests: a DB-backed test that SKIPs for a missing database
   is not evidence, even when the package prints `ok`.
2. **Read the uncovered delta.** When commits landed after the last Reviewer
   pass, diff the reviewed SHA against the final SHA. Production code in that
   delta needs a Reviewer delta round, or an Advisor review recorded with a
   reason when the delta is small. A delta that only touches tests, fixtures
   or docs can pass with a recorded note.
3. **Withhold on unexecuted criteria.** If an acceptance criterion was never
   actually executed (a skipped spec, an env-gated suite, missing baselines, no
   Tester on the final SHA), do not accept. This holds even when every stage
   reports pass. Send a follow-up Task to the same lead, terminal and worktree
   that names the gap and the evidence required.
4. **Minimum Tester evidence.** A Tester report must carry, per check: the exact
   command, the exit code, a raw log (or a durable pointer to one) and the
   tested SHA. A missing field makes that check unproven. Verify that every
   report path the lead cites exists before relying on it.
5. **Weak Tester models need a full rerun.** When the Tester runs on a
   lightweight model, the Advisor reruns every affected check itself, not a
   sample.
6. **Integration conflicts.** The Advisor may resolve a conflict itself when
   both sides only add code at the same place (exports, locale keys, IPC
   schemas, test cases). Keep both sides and say so in the merge commit. Any
   conflict that changes behaviour goes back to the owning lead.
7. **Cleanup after merge.** Release the lead Dispatch and close every child
   stage terminal. Before removing the worktree, check that no link or junction
   points outside it, then remove it through Orca. Drop the lane's own
   databases and other per-lane resources. If the lane used a remote test
   runner, close it from the worktree first (UniWork: `cloud-runner.mjs close`
   deletes the agent and its results refs) and delete the pushed lane branch.
   Record what was cleaned.
8. **Tracker status.** Move an issue only along the tracker's documented flow.
   For example, do not set a review status before a PR exists. When one issue
   spans several slices, comment per accepted slice and leave the status until
   the whole issue is done.

## Visual testing

- **Who runs it.** Stages listed in the contract's `visual_stages` go to the
  Tester visual profile when one is configured. When it is unset, every test
  stage, visual or not, goes to the Tester. The rules below apply to
  whoever runs the stage.
- **Deterministic diff first.** Use screenshot assertions or pixel diff with a
  declared tolerance against a committed baseline or the project's oracle. The
  model reads the diff and classifies it as one of: expected, regression,
  within tolerance, stale baseline, environment or uncertain. A model never
  declares visual parity by eye.
- **Jev at visual checkpoints.** Use a Choice for the observed page/window state
  and one for the diff class, and a Noul for each visual acceptance claim
  against its criterion. `uncertain` goes to the lead or Advisor and is never
  auto-accepted.
- **Limits of screenshots.** A screenshot never proves save, permission,
  idempotency or key/data isolation. Those stay automated tests.
- **Baselines.** Commit baselines with the stage and state which platform they
  were rendered on. Report platform gaps; for example, win32-only baselines
  leave CI on another OS without coverage. Rerun without updating snapshots and
  record the zero-diff result.
- **Clean up.** The visual stage starts and stops its own app/stack and cleans
  the data and processes it created. Evidence and baselines are never deleted.

## One Advisor: lease and coordinator

- **Read first, then take.** Read the lease file, the Run's coordinator and the
  precheck log in one step. Start the lease in a separate step, and only when
  the lease is finished or stale, or already yours. A combined
  "check and start" call can overwrite another session's fresh lease. If that
  happens, restore their lease at once and make no Run mutation.
- **Keep the lease fresh.** Touch the lease at least every 10 minutes during
  long reruns or waits. Run anything that can exceed that (full audit suites,
  packaging, e2e) in the background and touch between checks. A stale lease
  lets the watchdog bind another Advisor mid-merge. If that happens, the other
  Advisor must stand down, and you re-take the Run and drain the inbox.
- **Parallel invocations.** A scheduler can invoke two Advisor sessions for the
  same tick. A session that sees another session's fresh lease stays out of the
  Run for that pass and reports that.
- **Coordinator drift.** A worker can end up bound as the parent Run's
  coordinator, and then its completions stop reaching the Advisor. Check
  `run-show` every pass. On drift, re-take the Run through the supported
  current-Run path, drain the inbox at once, and add an explicit
  "never bind the parent Run" line to lead contracts.

## Launch and delivery recovery

- **Fresh-worktree launch race.** An agent started in a brand-new worktree while
  its setup hook runs can lose the race: the TUI never starts and the dispatch
  text lands in the shell (for example PowerShell `>>` continuation, where it
  may later run as commands). That is a positive launch failure.
  1. Stop the Dispatch and close the agent terminal.
  2. Wait for the setup terminal's completion marker.
  3. Check that the worktree is still clean.
  4. Retry on the same worktree.
- **Hand-start fallback.** If the retry fails the same way:
  1. Open a plain terminal in the worktree, start the agent yourself and confirm
     its composer stays up.
  2. Runtimes may refuse `worker-start --terminal` on a hand-started agent, and
     a Task stopped several times may be blocked. So create a new Task with the
     same spec and `dispatch --return-preamble` it to that terminal.
  3. Paste the preamble, submit it and confirm the turn started.
  4. Record the abandoned Task.
- **Stuck composer.** A preamble visible in the composer without a started turn
  gets one bare Enter under the stuck-composer rule in
  the selected harness's execution guide (Orca: [execution](../harness/orca/execution.md)), followed by turn-start evidence.
- **`ask` timeouts.** A worker whose blocking `ask` timed out re-asks or
  escalates. Answer every duplicate with the same decision, and put a one-line
  pointer in the worker's terminal. Say explicitly that the question is
  answered and must not be asked again.

## Transient provider errors

- **Nudge, do not fall back.** Rate limits (429), "model at capacity", proxy or
  gateway 5xx, stream disconnects and exhausted automatic reconnects are
  transient. Nudge the worker to continue from where it stopped; never switch
  to a fallback profile for them. For proxy errors, nudge only after the
  endpoint answers again (any status below 500).
- **Zero-token nudger.** Run a nudger as a scheduler precheck that always exits
  nonzero, so no model session starts. Filter by agent identity. Treat a worker
  as recovered when any busy marker follows the error on screen. Spinners
  redraw character by character, so do not rely on one literal "Working"
  string. Log every nudge and skip, and honour the pause marker.
- **Next account before the next profile.** A usage, weekly or rolling quota
  limit is a proven failure of that account, not of the provider. When the
  user has several accounts for the same provider (for example several
  runtime-managed Codex accounts, each with its own home), move the lane to
  the next account on the same worktree before using the fallback profile:
  1. Fence the old Dispatch.
  2. Hand-start the agent with that account's home.
  3. Create a Task that carries the progress note.
  4. Dispatch it with the preamble.
  Do not flip the host-wide active account unless the user asks, because that
  moves every new launch.
- **Fallback on proven failure only.** A fallback needs positive evidence, such
  as quota or usage-limit exhaustion or a launcher that is not available.
  Record requested and effective profiles. Tell the user when two independent
  roles (for example Reviewer and Tester) end up on the same model, because the
  review then gets shallower.

## Host resources

- **Concurrency by machine.** Cap concurrent lanes by what the host sustains
  (the user sets the number) and drain above the cap before dispatching more.
  Stages run affected-only checks. The full suite runs once on the integration
  branch before the phase PR.
- **Check load before heavy runs.** Check CPU before long or timing-sensitive
  runs. Kill stray long-running processes (for example a filesystem-wide
  `find`) before builds, e2e or packaging.
- **Put space where it exists.** Keep caches, temp dirs, build output and
  packaged artifacts on a volume with free space. Delete large artifacts after
  recording checksums and listings.
- **Pin toolchains.** Use the project's pinned runtimes (for example the pinned
  Node major, not a newer system one) in Advisor reruns and worker contracts.
- **Remote test runner, when the project has one.** Run non-visual checks
  (unit, contract, targeted integration groups, typecheck, lint, builds) on
  a cloud runner instead of the host. UniWork has one:
  `.cursor/cloud/cloud-runner.mjs` on `test/cursor-cloud-env` gives one Cursor
  cloud VM per worktree, at about 5 cents and 20 s for a warm round.
  - The Tester stays a separate instance. It writes the spec, drives the runner
    and reads the raw logs. Its evidence is the runner report, which carries
    SHA, command, exit code and raw log for each check.
  - Only the lane's own branch is pushed, and only so the runner can test it.
    There is still no PR and no push to the integration or default branch.
  - Visual, browser, desktop-window and packaged-OS stages stay on the host.
  - Put the exact runner command and rules into the phase team rules and every
    Tester brief. The G3-G4 `team-rules.md` section "Cloud test runner" is the
    template.

## Pause and resume

- **Pause.** Create the pause marker that every scheduler precheck and nudger
  honours. Tell each lead to stop at a safe point: finish the current command,
  let a running child stage write its report, start nothing new, revert
  nothing. Stop any Dispatch that never started. Persist each lane's position
  (SHA, stage, running child) and the exact resume steps.
- **Resume.** Resume only on the user's instruction. Remove the marker, send a
  resume message to each paused lead, drain the inbox, then relaunch anything
  that never started.

## Scope questions and decisions

- **Check the code first.** Before answering a worker's scope or contract
  question, inspect the code. Answers often already exist one layer down, such
  as a service that implements what the handler hides. Give a concrete decision
  with conditions: what is in scope, what stays out, required tests and
  reviewers.
- **Route findings that need an owner.** When a Reviewer finding needs an owner
  choice (a gap inherited from an accepted slice), the Advisor picks the lane
  and records why.
- **One decision record.** Keep a single decision record in the run folder. Each
  user decision quotes the user's words, has a timestamp from the system clock,
  and states what it supersedes. Decisions that change an already-decided gate
  need the user's confirmation first.

## Reporting

- Take every timestamp in reports, checkpoints and decision records from the
  system clock. Never estimate or round forward.
- Quote paths exactly. When a message cites a path that does not exist, locate
  the real file and say so in the report.
