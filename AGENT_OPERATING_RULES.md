# Titan Agent Operating Rules

## Default Operating Mode

Titan should be handled in Fast-Safe Mode unless the owner explicitly says otherwise.

Fast-Safe Mode means:
- prefer single-purpose milestones
- keep scope narrow
- preserve current behavior and totals unless explicitly approved otherwise
- optimize for recovery, handoff, and non-coder safety

## Continuity Authority Order

When starting or resuming Titan, read continuity files in this order:

1. `SESSION_HANDOFF.md`
2. `LIVE_PROJECT.md`
3. `CURRENT_STATE.md`
4. `NEXT_STEPS.md`
5. `DECISIONS_LOG.md`

Authority order:
- `SESSION_HANDOFF.md` is the highest-priority latest-state file.
- `LIVE_PROJECT.md` is the stable project-truth file.
- `CURRENT_STATE.md`, `NEXT_STEPS.md`, and `DECISIONS_LOG.md` are supporting context.

If there is any conflict:
- prefer `SESSION_HANDOFF.md` for the latest baton-pass state
- prefer `LIVE_PROJECT.md` for the stable project briefing

Ignore archival handoff files for the latest active state unless the owner explicitly asks for historical context.

If `SESSION_HANDOFF.md` contains a latest verified baton anchor commit, use that exact commit as the baton anchor.

If `SESSION_HANDOFF.md` contains an exact next safest step, do not invent another one.

If a new AI reports an older commit than `SESSION_HANDOFF.md`, treat that as a continuity failure and correct the baton-pass anchor before doing any work.

Do not invent your own next step if `SESSION_HANDOFF.md` already states one.

## New-AI Startup Behavior

Any new AI taking over Titan must:
- read `SESSION_HANDOFF.md` first
- not skip `SESSION_HANDOFF.md`
- anchor to the latest verified baton anchor commit named there
- use the exact next safest step named there unless the owner explicitly changes direction
- treat any mismatch against older supporting docs as a baton-pass issue, not as permission to drift away from `SESSION_HANDOFF.md`

The first response from any new AI must report:
1. current phase
2. stable truths
3. non-negotiable safety rules
4. latest verified baton anchor commit
5. exact next safest step

The first response must not code.

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

Before finalizing any milestone, run a documentation impact check and decide which sensitive docs must be updated.

Do not leave sensitive docs stale after meaningful milestones.

At minimum, consider whether to update:
- `NEW_AI_START.md`
- `CURRENT_STATE.md`
- `NEXT_STEPS.md`
- `DECISIONS_LOG.md`
- `LIVE_PROJECT.md`
- `AGENT_OPERATING_RULES.md`
- `SESSION_HANDOFF.md`

Sensitivity guidance:
- always update `SESSION_HANDOFF.md` when the latest verified baton anchor commit, active focus, or exact next safest step changes
- update `LIVE_PROJECT.md` when the stable project briefing, current recommended direction, important functionality, or latest important commits change
- update `CURRENT_STATE.md`, `NEXT_STEPS.md`, and `DECISIONS_LOG.md` whenever logic, architecture, recovery/handoff clarity, or meaningful owner-facing product surface changes
- do not skip necessary doc updates just because the change was “small”
- if unsure, report which docs were considered and why they were or were not updated

Baton-pass anchor rule:
- `SESSION_HANDOFF.md` should name the latest verified commit that the current baton-pass state is anchored to.
- It does not need to self-reference the same new docs-only commit that refreshes the handoff wording itself.
- If a continuity-only commit updates the handoff docs, keep the baton anchor explicit and truthful instead of forcing a self-staling commit hash into the file.

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
