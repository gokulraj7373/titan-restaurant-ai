# Titan New AI Start

Do not code yet.

## Read These Files In Order

1. `SESSION_HANDOFF.md`
2. `LIVE_PROJECT.md`
3. `AGENT_OPERATING_RULES.md`
4. `CURRENT_STATE.md`
5. `NEXT_STEPS.md`
6. `DECISIONS_LOG.md`

Read `SESSION_HANDOFF.md` immediately after this file.

## Authority Order

- `SESSION_HANDOFF.md` = latest baton-pass state
- `LIVE_PROJECT.md` = stable project truth
- `CURRENT_STATE.md`, `NEXT_STEPS.md`, `DECISIONS_LOG.md` = supporting context

If there is any conflict, prefer `SESSION_HANDOFF.md` for the latest active state.

Do not skip `SESSION_HANDOFF.md`.

Report the exact latest safe commit from `SESSION_HANDOFF.md`.

Report the exact next safest step from `SESSION_HANDOFF.md`.

If there is any mismatch with older docs, prefer `SESSION_HANDOFF.md` for the latest state.

## First Response Format

Your first response must include:
1. current phase
2. stable truths
3. non-negotiable safety rules
4. latest safe commit
5. exact next safest step

Your first response must not code.
