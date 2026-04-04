# Titan Agent Operating Rules

## Default Operating Mode

Titan should be handled in Fast-Safe Mode unless the owner explicitly says otherwise.

Fast-Safe Mode means:
- prefer single-purpose milestones
- keep scope narrow
- preserve current behavior and totals unless explicitly approved otherwise
- optimize for recovery, handoff, and non-coder safety

## Required Verification Style For Every Completed Step

Every completed step must include this verification pack:

1. What you changed
2. Why it is safe
3. What did not change
4. Validation commands run
5. Files changed
6. Docs updated
7. Git result
8. Verification evidence
   - output summary from `git show --stat --name-only --oneline HEAD`
   - output summary from `git status --short` after commit
   - note whether working tree is clean
9. Risk check
   - confirm whether any forbidden areas were touched
   - confirm whether any scope drift happened

Do not stop at a narrative summary after approved work.

## Stop-And-Report Rules

Stop and report instead of continuing if:
- scope drifts outside the approved files
- a required fact is unclear and cannot be safely inferred from repo state
- a change would affect policy, totals, live truth, or memo stance without explicit approval
- a hidden refactor seems necessary to continue
- unrelated dirty worktree changes appear and create real conflict

If scope drifts, do not auto-commit.

## Forbidden Actions

- `git reset --hard`
- `git restore`
- `git clean`
- any history rewrite
- any push
- any database state change
- any silent overwrite
- any policy promotion into live truth without explicit approval
- touching unapproved files without stopping and reporting

## Git Safety Rules

- Auto-commit only if scope stayed exactly within approval.
- Auto-commit only if the step remained fully read-only when that was required.
- Auto-commit only after running the approved validation commands.
- Always report:
  - files changed
  - commands run
  - exact commit message
  - post-commit working tree status

## Doc Update Rules

Whenever a milestone changes any of the following, documentation-update instructions must be included in the proposed Codex prompt or milestone plan:
- logic
- architecture
- recovery or handoff clarity
- meaningful owner-facing product surface

Continuity docs must never be left stale after meaningful milestones.

At minimum, consider whether to update:
- `CURRENT_STATE.md`
- `NEXT_STEPS.md`
- `DECISIONS_LOG.md`
- `LIVE_PROJECT.md`
- `AGENT_OPERATING_RULES.md`
- `SESSION_HANDOFF.md`

## Owner-First Tone And Memo-Safe Expectations

- Use plain owner-friendly wording.
- Keep read-only review language conservative.
- Do not present memo hints as believable links.
- Do not make review surfaces sound like live dashboard truth.
- Do not use alarming language unless there is a real confirmed risk.
- Prefer calm, structured, concise summaries.

## Sales Truth Review Safety Rules

- `/sales-truth-review` is read-only in effect.
- Memo remains unresolved and excluded from live sales truth.
- Memo hints are investigative only.
- No live truth promotion has happened yet.
- The current proposed net sale candidate total must remain unchanged unless explicitly approved otherwise.
- Reconciliation behavior must remain unchanged unless explicitly approved otherwise.

## Prompt Hygiene Rule For Future Agents

Every future suggested Codex prompt for Titan must include documentation-update instructions whenever the milestone changes:
- logic
- architecture
- recovery or handoff clarity
- meaningful owner-facing product surface

This rule is mandatory so future AIs do not leave continuity behind.
