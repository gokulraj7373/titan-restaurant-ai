<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older Next.js examples.

Before writing code:
- read the relevant guide in `node_modules/next/dist/docs/`
- check for breaking changes
- follow current file and routing conventions
- heed deprecation notices
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project Purpose

This repo is a restaurant intelligence MVP.

The current goal is to help a restaurant owner:
- upload sales and expense files
- store them safely in Supabase
- create imported business rows
- view simple dashboards and analytics
- understand business performance with low-cost logic

Current strategy:
- use SQL-backed Supabase data
- use rule-based business insights first
- avoid unnecessary complexity
- keep the product practical, low-cost, and easy to maintain

When working in this repo, prefer:
- simple solutions
- small changes
- easy-to-read code
- owner-friendly wording

## Non-Coder Safety Rules

This project should stay easy to manage for a non-coder owner.

Always follow these rules:
- make small, bounded changes
- work on one feature at a time
- do not refactor unrelated files
- do not change more files than necessary
- keep code beginner-friendly and readable
- avoid clever patterns when simple code will do
- do not add hidden complexity

## Change Control Rules

Before coding:
- identify exactly which files need to change
- state those files clearly
- avoid touching extra files unless absolutely necessary

While coding:
- preserve existing working features
- do not silently remove sections that already work
- do not redesign working UI unless the user asks for it
- keep the current behavior stable unless the task requires a change
- prefer safe additions over risky rewrites

If a request feels too broad:
- break it into smaller safe steps
- prefer the smallest useful version first

## Explanation Rules

After every change, explain in plain English:
- what files changed
- what was changed
- why it was changed
- what to test next

Explanations should be:
- short
- structured
- beginner-friendly
- free of unnecessary jargon

Never assume the owner understands coding concepts unless they are explained simply.

## Documentation Rules

If a major feature is added, changed, or completed, check whether these docs should also be updated:
- `README.md`
- `CURRENT_STATE.md`
- `NEXT_STEPS.md`
- `DECISIONS_LOG.md`
- `PROJECT_MASTER.md`
- `RECOVERY_GUIDE.md`

Prefer keeping docs accurate as the project grows.

If docs are not updated in the same change, mention clearly whether they should be updated next.

## Supabase And Data Safety Rules

Prefer:
- simple Supabase queries
- clear table usage
- direct and readable business calculations

Avoid:
- expensive AI APIs unless explicitly requested
- unnecessary backend complexity
- adding new data patterns when existing tables already fit the need

Keep table usage aligned with:
- `uploads_log`
- `sales_imports`
- `expense_imports`

Use SQL-backed and rule-based business logic first whenever possible.

## UI And Product Rules

Keep the current product style consistent:
- dark theme
- clean layouts
- simple cards and sections
- owner-friendly business wording

Do not redesign the product unless asked.

Prefer:
- clear labels
- simple summaries
- practical page structure
- consistent spacing and wording

## Recovery Mindset

Work in a way that helps the user continue safely even after a long break.

Prefer changes that are:
- easy to verify manually
- easy to explain later
- easy to continue from
- easy to recover if something goes wrong

Avoid:
- hidden dependencies
- large silent rewrites
- changes that make future work harder to understand

## Output Style

Codex should be:
- concise
- structured
- calm
- beginner-friendly

Responses should:
- focus on the exact task
- explain important terms simply
- tell the user what to test
- avoid overloading the user with technical detail

## Default Safe Working Pattern

The default safe working pattern in this repo is:

1. Understand the exact goal.
2. Identify the exact files that need to change.
3. Make the smallest safe change that solves the problem.
4. Explain clearly what changed and why.
5. Tell the user what to test next.
6. Suggest doc updates if the change affects project understanding or recovery.
