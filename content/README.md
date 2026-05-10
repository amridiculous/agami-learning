# Chapter Content — Authoring Reference

Each chapter on the site has a matching markdown file here. As you learn a
topic, fill in the body of its `.md`, then copy that body into
`react/src/data/topics.js` (the `body` field for the matching chapter).

The site does not auto-read these files — they are the source-of-truth notes
that the JS data file is updated from. This keeps the runtime build small
and the editing surface plain markdown.

---

## Project context — what happens from here

The website template is done. From here, the site stops being a UI project
and becomes a publishing surface. The workflow:

1. **Pick a chapter** from `rag/` or `agentic-workflows/`.
2. **Read about the concept** — first-principles, multiple sources.
3. **Apply it via a real-world research thread**: **hydroponics**. Every
   concept on the site gets tested against the same domain (sensor data,
   nutrient schedules, growth logs, lighting curves, troubleshooting notes).
   Same domain across chapters = compounding context and a real artefact at
   the end.
4. **Explain it**, with the hydroponics application as the worked example.
   The concept stays general; the example is concrete.
5. **Tools**: research with **Claude** (Sonnet / Opus, depending on depth),
   notes in **Obsidian** (private vault), final publish lands here.
6. **Daily cadence**: learnings get posted here as they happen +
   cross-posted to **Twitter** (short thread per chapter or per breakthrough,
   linking back to the chapter page).
7. **Commit rhythm**: small, daily, dated commits. The markdown file is
   updated first; once a chapter has earned `status: published`, copy the
   body into `data/topics.js` in the same commit.

The site is not a product launch — it is a *running log of a learning
process*, made public on purpose.

## Layout

```
content/
  README.md                       ← this file
  rag/                            ← topic group: RAG
    chunking-strategies.md
    embeddings.md
    vector-databases.md
    retrieval-bm25-vs-dense.md
    hybrid-search.md
    reranking.md
    query-rewriting.md
    context-window-management.md
    prompt-construction.md
    evaluation.md
    hallucination-mitigation.md
    multi-hop-retrieval.md
  agentic-workflows/              ← topic group: Agentic Workflows
    tool-use.md
    planning-and-decomposition.md
    react-pattern.md
    multi-agent-systems.md
    memory-and-state.md
    function-calling.md
    agent-loops-and-termination.md
    observability.md
    guardrails.md
    evaluation-agents.md
```

## File format

Each chapter file uses YAML front matter for metadata + a markdown body
following a fixed three-section structure (concept → hydroponics
application → trade-offs/mistakes):

```markdown
---
slug: chunking-strategies
group: rag
name: Chunking strategies
status: placeholder        # placeholder | drafted | published
---

## The concept

(First-principles explanation of the topic. Generalised, no domain bias.)

## Applied to hydroponics

(How this concept shows up — or fails to show up — in the live grow
research thread. One concrete worked example: a dataset, a decision, a
chart, a config. This is the bridge from theory to a thing that runs.)

## Trade-offs and mistakes

(What surprised you when you applied it. What you would do differently
next time. The post-hoc commentary that makes the chapter worth reading
twice.)
```

## Per-chapter workflow

1. Pick a chapter to learn.
2. Read about the concept (Claude + cited sources).
3. Apply it to the **hydroponics** research thread — keep one concrete
   worked example per chapter, drawn from the live grow project.
4. Open the chapter's `.md` and replace the placeholder body with the
   notes: concept first, then the hydroponics application, then the
   trade-offs / mistakes you ran into.
5. Set `status: drafted` while drafting, then `status: published` when ready.
6. Copy the body into `react/src/data/topics.js` → matching chapter's `body`.
7. Cross-post the takeaway to Twitter with a link back to the chapter URL.
8. Commit the markdown + the JS update + (optionally) any new
   images/diagrams together in one dated commit.

## Slugs are stable

The `slug` is what the URL uses (`/chapter/<slug>`) and what
`data/topics.js` keys on. **Do not rename slugs** once published — the URL
will break for anyone who has the link saved.

If you really need to rename, also add a redirect.
