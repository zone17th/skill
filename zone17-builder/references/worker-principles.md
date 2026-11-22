# Worker & Lane Engineering Principles

Read this file before reading or editing repository code. Every lane `Advisor`,
lane `Lead`, `BE Worker` and `FE Worker` works for the human operator under
these rules, even when a short fix brief does not repeat them. Project rules in
the contract (`rules`) win whenever they are stricter.

## 1. Shape the data before writing logic

- **Model the domain explicitly.** Settle the data types, state machine, variant
  union, or lookup/registry table *before* writing control flow. Follow the
  contract's `domain_shape` when provided; if a task crosses a module boundary
  without a clear shape, define the types and caller signature first.
- **Make illegal states unrepresentable.** Replace parallel booleans and loosely
  typed strings/IDs with discriminated unions, branded/typed IDs, and exhaustive
  switches. Derive types from authoritative schemas instead of hand-syncing
  duplicates.
- **Boundary discipline.** Parse, validate, and normalize untrusted input at
  system edges (HTTP/RPC handlers, CLI args, DB/queue readers, env/config, IPC).
  Inside the boundary, trust internal types and keep business logic pure and
  easy to test without heavy mocking.

## 2. Write less code, not more (Anti-Slop)

- **Subtract before you add.** Delete dead code, unused flags, and redundant
  validators in your owned paths before building on top of them. Bias toward the
  smallest diff that cleanly solves the problem (*Laziness Protocol*).
- **Minimize reader load.** Collapse single-caller pass-through wrappers, shrink
  mutable state scope, and keep control flow flat. A maintainer should trace
  question to answer in as few hops as possible.
- **Migrate callers, then delete legacy paths.** Within your owned scope, do not
  preserve throwaway compatibility shims, dual codepaths, or `_v2` suffixes
  unless the approved spec/plan explicitly requires a staged external migration.

## 3. Fix root causes, never symptom guards

- **Trace to the first wrong state.** When fixing a bug or test failure, find the
  exact point where an invariant broke and fix it there. Adding `if (!x) return`
  or `?? default` is a valid fix *only* when `x` being absent is a legitimate
  domain state — never to silence a crash from upstream corruption.
- **Attack the premise (2-strike rule).** If two fix attempts sharing an
  assumption fail the same test or review gate, **stop writing a third patch**.
  Write down the shared assumption, test that assumption directly against the
  code/runtime, and report the finding to your lane `Advisor` or `Lead` (which
  rotates in a fresh worker when needed).

## 4. Test observable behavior and prove it works

- **Test behavior, not implementation.** Assert outputs, persisted state,
  returned errors, and user-visible effects that must survive internal
  refactoring. Never edit a test merely to weaken assertions, widen tolerances,
  mock away the unit under test, or add skips so CI turns green.
- **Prove it on the real surface.** "It compiles" or "types pass" is not proof.
  Run the affected checks in your contract and inspect actual command exit codes
  and output before reporting completion.
- **Make operations idempotent.** Migrations, seeds, retries, and background
  handlers must converge safely to the same state when re-run after partial
  failure.

## 5. Mandatory pre-handoff clean pass (`deslop` + `no-comments`)

Before committing and emitting `worker_done` to your lane `Advisor` or `Lead`,
read your full `git diff` from top to bottom and strip AI slop:

1. Remove leftover debug logs, commented-out code, unused imports, and
   speculative helpers/options nobody calls.
2. **Delete every comment that restates what the code does** (`// increment i`,
   `// check user permission`, section-banner comments). Keep a comment *only*
   when it records a non-obvious **why** (a subtle invariant, a browser/OS/API
   quirk, or why an obvious-looking alternative fails). Better yet: rename the
   symbol or tighten the type so no comment is needed.
3. Keep commits small, ordered, and atomic so a delta review or revert is clean.
