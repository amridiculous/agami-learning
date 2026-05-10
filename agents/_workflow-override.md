# Workflow Override — Dev-First Preview Pattern

**Status:** Locked by user request on this engagement. Applies to all future iterations on this client.

## The rule

After the brief / plan is approved, **invoke `developer-agent` next for a quick preview**. Do NOT route through `design-agent`, `design-qa-agent`, `code-reviewer-agent`, or `qa-test-agent` first.

The user reviews the running site in their browser. Once the structure + look is approved by visual review, only then do we run:
1. `design-agent` — to formalize tokens, type scale, motion specs, accessibility specs (so the design is locked in writing for future devs / agents)
2. `design-qa-agent` → if FAIL, fix loop back to developer-agent
3. `code-reviewer-agent` → if FAIL, fix loop back
4. `qa-test-agent` → if FAIL, fix loop back

## Why

The user values fast visual feedback over formal process. Running the full pipeline before a single browser screenshot reaches the user means:
- Multiple agent rounds spent locking in details that might be entirely wrong (which happened on v1 — see CLAUDE.md v2 rewrite)
- High latency between "I have an idea" and "I see it in a browser"
- Time wasted in QA gates that catch issues a 5-second visual review would have caught instantly

## When to deviate

The standard `design → dev → QA` order applies if:
- The user explicitly asks for "full QA pass" or "production-ready review"
- The build is past structural approval and we're locking in for launch
- A regression appears after launch and we need formal review before re-shipping

## How orchestrator-agent should interpret this

`orchestrator-agent.md` describes the standard 6-phase pipeline. For this client, it should:
1. After Phase 0 (brief approved): jump directly to Phase 2 (developer-agent), skipping Phase 1 (design-agent)
2. Surface the dev server URL and ask the user "does this look right?" before any QA agent runs
3. Only after the user says yes does the orchestrator run Phase 1 (design-agent, retroactively documenting what was built) followed by Phases 3–5 (QA gates)

This is an additive override — the orchestrator's normal logic still applies for any other client.
