/**
 * topics.js — v2 schema (TopicGroup → Chapters).
 *
 * Add a new topic group by appending an object to `topicGroups`. The page
 * shell handles the active group via the URL slug; chapters within a group
 * are rendered by ChapterColumn.
 *
 * Field reference:
 *   slug      — URL-safe id for the topic group
 *   label     — short label for TopicGroupRail (e.g. 'RAG +')
 *   title     — large-serif word for TopicTitle (e.g. 'RAG')
 *   body      — array of paragraph strings (used on a future topic-overview view)
 *   chapters  — array of { slug, name, body } — the right-column scrollable list
 */
export const topicGroups = [
  {
    slug: 'rag',
    label: 'RAG +',
    title: 'Retrieval Augmented Generation',
    body: [
      'Retrieval Augmented Generation is the pattern where a language model is given access to an external knowledge base at inference time. Instead of relying only on its training, the model retrieves relevant chunks of text and grounds its answer in them.',
      'The result is fresher facts, fewer hallucinations, and the ability to point at exactly which source the model used. It is the most-deployed pattern for production LLM systems today.',
    ],
    chapters: [
      {
        slug: 'improve-something-remarkable',
        name: 'Improve something remarkable',
        body: 'Large language models are already remarkable. They read, reason, summarise, translate, and write in a dozen registers — trained on a slice of the internet so large that, for most general questions, the answer is somewhere inside the weights. For the first time in computing, a single artefact can hold a conversation about almost anything.\n\nAnd yet, the moment the question gets specific — your company\'s policies, last week\'s release notes, the contract on your desk — the model has nothing. It was not trained on it. It was not trained on tomorrow either. The remarkable thing has a sharp edge: it knows everything in general, and nothing about you.\n\nRetrieval Augmented Generation is the pattern that closes that gap without retraining the model. At inference time, the system fetches the most relevant passages from a knowledge base you own and hands them to the model alongside the question. The model stops guessing from its training and starts answering from the source.\n\nThe shift is small in code and large in behaviour. You keep the model\'s language, its reasoning, its tone. You add facts it could not have known. Hallucinations drop, citations become possible, and the system stays current the day you index a new document. RAG does not replace what makes the model remarkable. It improves on it — by giving it the one thing it was missing: your context.',
      },
      {
        slug: 'embeddings',
        name: 'Embeddings',
        body: 'Dense vector representations that turn text into points in a high-dimensional space where similar meanings sit close together. Placeholder copy.',
      },
      {
        slug: 'vector-databases',
        name: 'Vector databases',
        body: 'Specialized stores tuned for approximate nearest-neighbor search at billions-of-vectors scale. Placeholder copy.',
      },
      {
        slug: 'retrieval-bm25-vs-dense',
        name: 'Retrieval (BM25 vs. dense)',
        body: 'Lexical retrieval (BM25) and semantic retrieval (dense) make different mistakes; understanding both is the foundation of hybrid search. Placeholder copy.',
      },
      {
        slug: 'hybrid-search',
        name: 'Hybrid search',
        body: 'Combine lexical and dense scores via reciprocal rank fusion or learned weights to keep the best of both. Placeholder copy.',
      },
      {
        slug: 'reranking',
        name: 'Re-ranking',
        body: 'A second-stage cross-encoder scores query-document pairs to surface the most relevant results from the candidate set. Placeholder copy.',
      },
      {
        slug: 'query-rewriting',
        name: 'Query rewriting',
        body: 'Expand, decompose, or hypothetically answer a query before retrieval to bridge the lexical gap. Placeholder copy.',
      },
      {
        slug: 'context-window-management',
        name: 'Context window management',
        body: 'Choosing what survives the prompt-construction stage when retrieved context exceeds the model context window. Placeholder copy.',
      },
      {
        slug: 'prompt-construction',
        name: 'Prompt construction',
        body: 'How retrieved chunks, system instructions, and the user query are stitched into a single prompt. Placeholder copy.',
      },
      {
        slug: 'evaluation',
        name: 'Evaluation (faithfulness, answer relevance)',
        body: 'Faithfulness, answer relevance, and context precision/recall as the four standard RAG metrics. Placeholder copy.',
      },
      {
        slug: 'hallucination-mitigation',
        name: 'Hallucination mitigation',
        body: 'Grounding, citation forcing, refuse-to-answer thresholds, and post-hoc verification as defenses against ungrounded output. Placeholder copy.',
      },
      {
        slug: 'multi-hop-retrieval',
        name: 'Multi-hop retrieval',
        body: 'Iterative retrieval where each step uses the previous result to inform the next query. Placeholder copy.',
      },
    ],
  },
  {
    slug: 'agentic-workflows',
    label: 'Agentic Workflows +',
    title: 'Agentic Workflows',
    body: [
      'Agentic workflows are systems where a language model plans, calls tools, observes the results, and iterates toward a goal — rather than answering in a single shot. The model becomes a controller, not just a generator.',
      'Done well, agents collapse multi-step human work into a single instruction. Done poorly, they loop, hallucinate tool calls, and burn tokens. The discipline is in the scaffolding around the model.',
    ],
    chapters: [
      {
        slug: 'tool-use',
        name: 'Tool use',
        body: 'How models invoke external functions — schemas, argument validation, and result handling. Placeholder copy.',
      },
      {
        slug: 'planning-and-decomposition',
        name: 'Planning and decomposition',
        body: 'Breaking a goal into ordered sub-tasks before execution. ReAct, Plan-and-Execute, and Tree-of-Thought patterns. Placeholder copy.',
      },
      {
        slug: 'react-pattern',
        name: 'ReAct pattern',
        body: 'Interleaved reasoning and action steps that let the model think aloud between tool calls. Placeholder copy.',
      },
      {
        slug: 'multi-agent-systems',
        name: 'Multi-agent systems',
        body: 'Multiple specialised agents collaborating via shared memory, message-passing, or a supervisor agent. Placeholder copy.',
      },
      {
        slug: 'memory-and-state',
        name: 'Memory and state',
        body: 'Short-term scratchpads, long-term vector memory, and structured state stores that persist across turns. Placeholder copy.',
      },
      {
        slug: 'function-calling',
        name: 'Function calling',
        body: 'Native function-calling APIs from OpenAI, Anthropic, and others — the standard interface for structured tool use. Placeholder copy.',
      },
      {
        slug: 'agent-loops-and-termination',
        name: 'Agent loops and termination',
        body: 'How an agent decides it is done, and how to bound infinite loops with step budgets, time budgets, or explicit stop tokens. Placeholder copy.',
      },
      {
        slug: 'observability',
        name: 'Observability',
        body: 'Tracing every step, every tool call, every token cost — turning the agent from a black box into something debuggable. Placeholder copy.',
      },
      {
        slug: 'guardrails',
        name: 'Guardrails',
        body: 'Input validation, output validation, and runtime policies that catch unsafe behaviour before it reaches a user. Placeholder copy.',
      },
      {
        slug: 'evaluation-agents',
        name: 'Evaluation (agents)',
        body: 'End-to-end task-completion metrics, step-level grading, and trajectory analysis as the standard agent evaluation stack. Placeholder copy.',
      },
    ],
  },
];

/**
 * Owner / about content. Placeholder values from client.md — owner replaces
 * these strings before public launch (URLs, bio paragraphs, portrait file).
 */
export const owner = {
  name: 'Agami',
  tagline: 'Using AI tools for purposes that matter.',
  motto: 'Using AI tools for purposes that matter.',
  bio: [
    'We aren\'t here to keep up with the hype. We are here to put these tools to use for the people, the problems, and the purposes that deserve them.',
  ],
  links: {
    linkedin: 'https://www.linkedin.com/in/PLACEHOLDER',
    github: 'https://github.com/PLACEHOLDER',
  },
  roster: [
    { name: 'Amrit', role: 'Practitioner' },
    { name: 'Projjal', role: 'Practitioner' },
  ],
  services: [
    {
      name: 'Topics',
      items: ['Retrieval Augmented Generation', 'Agentic Workflows', 'Embedding Models', 'Vector Retrieval', 'LLM Evaluation', 'Hallucination Mitigation', 'Prompt Engineering'],
    },
  ],
  technologies: {
    left: ['Python', 'LangChain', 'LlamaIndex'],
    right: ['OpenAI API', 'Claude API', 'Pinecone'],
  },
  specialties: {
    left: ['RAG Pipelines', 'Retrieval Quality'],
    right: ['Agentic Systems', 'Production LLMs'],
  },
  collaborators: ['Mira Hossain', 'Daniel Roque', 'Yuki Tanaka', 'Ada Olusegun', 'Tomas Reinhardt', 'Priya Subramanian'],
};

// Convenience export — most callers want the first (and only-at-MVP) group.
export default topicGroups;
