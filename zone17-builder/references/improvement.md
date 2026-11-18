# Improving this skill

Every run teaches something about the process: a rule that was missing, one
that was unclear, one that cost more than it caught. This file says how those
observations are collected and how they reach the skill, so that it gets better
with use instead of growing by accident.

The division of work is simple. The Advisor (the author, in phase 1) notices
and writes down. At set moments it sorts what it wrote and proposes changes.
The human decides. Only an approved change is made, and it is made in the
skill's source repository, never in an installed copy.

## 1. Note as you go

Keep `skill-notes.md` in the run folder, append-only. Add an entry whenever the
process itself, not the product, went wrong or could have gone better. Check
for something to note at these moments; often there is nothing, and that is
fine:

- after each gate in phase 1 (what did the reviewer or the human catch that the
  templates or the method should have prompted?);
- after each task is accepted or abandoned in phase 2;
- after each wave gate and after final QA (what reached this point that a
  task's own checks should have caught?);
- whenever the Advisor had to improvise because the skill was silent, two
  rules contradicted each other, or a rule had to be bent to keep working.

One entry:

```text
## <system time> · <phase, task or gate>
- What happened: <facts, with the report or log path>
- Cost: <rework rounds, lost time, a defect found late, a wrong question to the user>
- Cause in the process: <missing rule | unclear rule | wrong rule | rule too heavy | tooling>
- Where: <skill file and section, or "project rules", or "this run's team rules">
- Idea: <the smallest change that would have prevented it>
```

Write facts, not blame. An entry without evidence is an opinion; keep it only
if it recurs. Leads report process problems to the Advisor in their messages;
only the Advisor writes the file.

## 2. Sort before proposing

At the end of the run, and earlier when the same problem shows up a second
time, read the notes together and sort them:

| Kind | Where it belongs | What to do |
| --- | --- | --- |
| About this project (its commands, hosts, conventions, a recurring trap in its code) | The project's rule files, or the next run's team rules | Propose it to the user as a project change; it never goes into this skill |
| About this run only (a one-off incident, a provider outage) | The run's lessons file | Record it; propose nothing |
| About the process, and it would apply in another project too | This skill | Candidate for a proposal |

Keeping the skill project-neutral depends on this sorting. A rule that names a
tool, a path or a team belongs to a project, however useful it was.

Then weigh each candidate. Prefer changes that showed up more than once, cost
something measurable, and can be fixed by clarifying or removing text.
Be wary of adding a rule for a single incident: each rule is read on every
future run, so it must earn its place. Proposing that a rule be deleted or
simplified is as valuable as proposing a new one.

## 3. Propose to the human

When there are candidates, include a short section in the final report of the
run (or raise it at once when a rule is actively causing harm). When there are
none, say so in one line and move on; do not manufacture proposals.

For each proposal give:

- the problem and how often it happened, with evidence paths;
- the change: which file and section, and the new wording in a sentence or two;
- what it costs every future run (more reading, more steps, a slower stage)
  and what could go wrong with it;
- your recommendation: adopt, try for one run, or leave.

The human answers per item. Record each answer in the decision record.

## 4. Apply an approved change

- Edit the skill in its **source repository**, on a branch or directly as the
  repository's own rules say, with the reason in the commit message. Installed
  copies on any host are never edited by hand; they are replaced from the
  repository.
- Add an entry to `CHANGELOG.md` under a new version: what changed, why, and
  which run it came from.
- Run `scripts/plan-lint.mjs` on a known-good plan and check the links between
  files when the change touches formats or file names.
- Update every host the user works on from the repository, and say which hosts
  were updated and which were not reachable.
- A run in progress keeps the version it started with. It records that version
  in its builder state, and takes an urgent fix as an entry in its own team
  rules instead. The new version applies from the next run.

Do not edit this skill, the project's rule files or another skill on your own
initiative, even when the fix looks obvious. The cost of waiting for a yes is
small; a process that rewrites itself unseen is one nobody can trust.
