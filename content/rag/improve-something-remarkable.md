---
slug: improve-something-remarkable
group: rag
name: Improve something remarkable
status: drafted
---

Large language models are already remarkable. They read, reason, summarise,
translate, and write in a dozen registers — trained on a slice of the
internet so large that, for most general questions, the answer is somewhere
inside the weights. For the first time in computing, a single artefact can
hold a conversation about almost anything.

And yet, the moment the question gets specific — your company's policies,
last week's release notes, the contract on your desk — the model has
nothing. It was not trained on it. It was not trained on tomorrow either.
The remarkable thing has a sharp edge: it knows everything in general, and
nothing about you.

Retrieval Augmented Generation is the pattern that closes that gap without
retraining the model. At inference time, the system fetches the most
relevant passages from a knowledge base you own and hands them to the model
alongside the question. The model stops guessing from its training and
starts answering from the source.

The shift is small in code and large in behaviour. You keep the model's
language, its reasoning, its tone. You add facts it could not have known.
Hallucinations drop, citations become possible, and the system stays
current the day you index a new document.

**RAG does not replace what makes the model remarkable. It improves on it —
by giving it the one thing it was missing: your context.**

<!-- Source-of-truth for the published body in react/src/data/topics.js -->
