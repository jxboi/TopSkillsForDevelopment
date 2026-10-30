# TopSkills — inside lists: final per-card copy (site card order)

Source: `~/workspace/research_notes/topskills-top5-per-repo.md` (all
entries Verified there). Functions below are copied from that report in
meaning; the implementing pass must reproduce them byte-for-byte after
HTML entity decoding, per the spec's harness assertions. Two deliberate
deviations from the report, both decided by the orchestrator and marked
where they occur:

- **Matt Pocock:** `tdd` swapped OUT, `to-spec` IN (see that card).
  `to-spec`'s function is anchored by the orchestrator to
  skills/engineering/to-spec/SKILL.md (description: "Turn the current
  conversation into a spec"; Process step 2 sketches the test seams and
  checks them with the user, step 3 writes the spec) — verified
  2026-10-29 from the repo itself, so it is now Verified, not exempt.
- **pstack:** playbook names normalised to their file forms (`bug-fix`,
  `perf-issue`) from the report's prose forms ("bug fix", "Perf issue").
  The mapping is noted on that card.

Summary lines are the exact `<summary>` text for each card's
`details.inside` block. "Kind" notes say how each item must be tagged
(see spec §5). All items: source grade Verified.

## Workflow

### Superpowers — summary: "Inside this repo — 5 of 15 skills"

1. `brainstorming` — Explores and clarifies user requirements through iterative questioning before building begins, synthesizing understanding into a written design specification.
2. `using-git-worktrees` — Provisions an isolated development workspace on a separate branch using harness-native tooling or git worktree fallbacks, verifying clean baseline test status before implementation starts.
3. `writing-plans` — Decomposes an approved design document into granular, bite-sized tasks (2–5 minutes each) specifying exact file paths, full code implementations, and explicit test verification steps.
4. `subagent-driven-development` — Coordinates implementation by dispatching an isolated subagent for each task, followed by two-stage reviews (spec compliance and code quality) after every step.
5. `test-driven-development` — Enforces a strict Red-Green-Refactor discipline that requires writing a failing test and observing it fail before producing the minimal code required to pass.

### ECC — summary: "Featured skills and commands" — note: "Featured entries, not the whole catalog."

1. `tdd-workflow` (skill) — Directs a complete test-driven development cycle requiring a failing test prior to code implementation, followed by incremental greening and refactoring targeting 80%+ test coverage across unit, integration, and E2E suites.
2. `/ecc:plan` (command) — Clarifies user requirements, assesses architectural and operational risks, and structures a step-by-step implementation plan while halting for explicit confirmation before code edits occur.
3. `/code-review` (command) — Conducts a structured, fresh-context code review on uncommitted local modifications or GitHub pull requests using a multi-phase checklist for bugs, style, and security.
4. `/build-fix` (command) — Inspects the repository to detect its active build system and iteratively resolves compiler, linter, and type-check errors using minimal, localized changes.
5. `security-scan` (skill and command) — Scans the agent harness setup (`.claude/` directory, MCP servers, hooks, and prompt guidelines) for configuration flaws, injection vulnerabilities, and credential exposure using AgentShield.

### Matt Pocock Skills — summary: "Inside this repo — 5 of 31 skills"

Orchestrator swap applied: `tdd` OUT (implement already invokes tdd),
`to-spec` IN. The five form the workflow spine.

1. `grill-with-docs` — Interrogates the user in depth about planned changes while writing Architecture Decision Records (ADRs) and maintaining a ubiquitous project domain glossary (`GLOSSARY.md`) before work starts.
2. `grill-me` — Recursively interviews the user on an idea, plan, or general proposal until every branch of the design decision tree is explored and aligned.
3. `to-spec` — Turns a grilled understanding into a written specification, with implementation seams agreed up front before tickets are cut. (Source: skills/engineering/to-spec/SKILL.md, description + Process steps 2–3; orchestrator-verified 2026-10-29.)
4. `implement` — Executes tasks defined by a specification or ticket list, triggering `/tdd` across identified seams and terminating with `/code-review` before committing changes.
5. `code-review` — Performs a dual-axis evaluation of repository diffs comparing code against standards and against the originating spec using parallel, isolated subagents.

### Spec Kit — summary: "Inside this repo — 5 core commands"

Items are commands in the spec-driven lifecycle chain, not skills. No
total is shown (see spec §5).

1. `speckit-specify` (or `specify`) — Creates or updates a detailed feature specification (`spec.md`) from natural language requirements, defining functional scope, user stories, and technical constraints.
2. `speckit-plan` (or `plan`) — Executes implementation planning using design templates to generate technical design artifacts, technology choices, and architectural boundaries.
3. `speckit-tasks` (or `tasks`) — Decomposes the architectural plan and specification into an actionable, dependency-ordered `tasks.md` checklist for systematic implementation.
4. `speckit-implement` (or `implement`) — Executes the implementation plan by processing and building out each task defined in `tasks.md` with prerequisite validation checks.
5. `speckit-converge` (or `converge`) — Audits the codebase against the spec, plan, and tasks, automatically appending any missing or incomplete work as new tasks to `tasks.md` until full convergence is reached.

### Vercel Skills — summary: "Inside this repo — 1 skill, 4 commands"

Item 1 is the skill; items 2–5 each carry the `command` kind tag.

1. `find-skills` (skill) — Instructs an AI coding agent on how to query and install agent skills via the Skills CLI when a user requests capabilities not natively supported.
2. `skills add` (command) — Downloads and installs agent skills from GitHub repositories, URLs, or local paths directly into the active project or globally.
3. `skills find` (command) — Interactively searches the open agent skills ecosystem by keyword query or scopes results to a specific GitHub owner.
4. `skills use` (command) — Generates prompt text or temporarily initializes a coding agent with a specified skill without permanently adding it to project dependencies.
5. `skills update` (command) — Checks for and updates installed project and global skills to their latest upstream releases.

### pstack — summary: "Inside this repo — 23 playbooks"

Items are playbooks under `/poteto-mode`, not skills. Names normalised
to file forms: report's "bug fix" → `bug-fix`; report's "perf (or Perf
issue)" → `perf-issue`.

1. `bug-fix` — Mandates reproducing a reported defect directly on the matching target surface first, binary-searching root causes with runtime evidence, and staging a failing repro test commit before landing the fix.
2. `feature` — Orchestrates implementing new or modified behavior by establishing domain data shapes, conducting parallel architectural exploration, writing a four-dimension throughput checkpoint, and delegating scoped implementation.
3. `investigation` — Executes read-only inquiry into how a subsystem functions or why an architectural decision was made, producing cited explanations and tradeoff matrices without introducing code modifications.
4. `refactoring` — Performs behavior-preserving structural alterations by first pinning existing contracts with characterization tests, eliminating dead code, and migrating callers and legacy APIs simultaneously in a single wave.
5. `perf-issue` — Traces measured slowness against an established baseline trace, systematically applies performance mantras in order of cost, and independently verifies post-fix metric improvements before shipping.
6. `authoring-a-skill` — Owns a skill’s voice by validating frontmatter, referenced files, cross-skill links, and structural test cases, deleting prose that changes no decision, then running Opening a PR.
7. `autonomous-run` — Defines a checkable exit condition, then drives toward it without stopping through evidence-based iterations, event watchers or timed heartbeats, verifying each change and discarding attempts that do not advance it.
8. `autopilot-full` — Owns verdicts while assigning one owner per PR, requiring independent verification by a swarm that never wrote the code and green CI at each current head before anything merges.
9. `autopilot-stack` — Runs Autopilot-full verification without merging, stopping at verified PRs with green checks at their current heads and handing them to the operator, stacking only PRs that build on others.
10. `babysit` — Owns the merge frontier by declaring a mode, clearing one PR at a time, and stopping where a human decision begins, while leaving the actual landing operation to Shipping.
11. `eval` — Owns experiment design through planning, blinding, running, and synthesising results, keeping evaluation language out of candidate environments and prompts while a blinded judge assesses outputs against a private rubric.
12. `hillclimb` — Owns one metric and experiment integrity through a frozen measurement harness, testing one change at a time, keeping measured improvements or reverting failures, and never claiming wins from inspection alone.
13. `multi-phase-plan` — Owns the plan rather than implementation, producing an evidence-backed checklist an owner executes box by box and an operator audits, with dependencies, verification steps, and explicit review gates.
14. `opening-a-pr` — Runs at the end of every other playbook, preparing work in a worktree off main and organising small ordered commits so each can become a future independently landable PR.
15. `orchestrate` — Runs the program rather than writing code, deciding which agent owns each piece, checking the evidence each produces, and maintaining authoritative program state in the Project tracker throughout execution.
16. `pause-safely` — Owns a clean stop by finishing or backing out of the atomic step, taking no irreversible action, and leaving a durable wip checkpoint with a resume note for a cold-start agent.
17. `prototype` — Owns a design decision through a throwaway instrument, exploring alternatives quickly in an isolated scratch directory, observing their behaviour, and handing the chosen direction to Feature for the real build.
18. `runtime-forensics` — Owns diagnosis from a live process by capturing a profile, heap snapshot, or CDP trace, reducing it to the smoking gun, and proving the mechanism before delivering a cited diagnosis.
19. `session-pickup` — Owns the resume point by reading the prior transcript, cloud URL, or pushed branch first, reconstructing completed and pending work without redoing it, and retaining a reduced timeline in the main thread.
20. `shipping` — Owns what lands by verifying each PR independently, landing only the verified contiguous run from the root, confirming each merge, and keeping hands off the stack while it lands.
21. `trace-forensics` — Owns diagnosis from an existing artifact by identifying its format, parsing it with generic tooling, reducing it to a source-attributed finding, and distinguishing confirmed causes from hypotheses without a live rerun.
22. `visual-parity` — Owns pixel-exact equivalence by establishing the baseline before migration, moving one component at a time, and verifying zero image diff without changing the harness or tampering with baseline images.
23. `worktree-cleanup` — Snapshots and audits worktrees and simulator state using paths from worktree list, classifying size, age, merge state, uncommitted work, and PR state before checking active usage and pruning confirmed candidates.

## Quality

### Karpathy Skills — summary: "Inside this repo — the only skill" — block rendered `open`

The single skill bundles four principles; they stay inside its one
function line and are NOT presented as four separate skills.

1. `karpathy-guidelines` — Enforces four foundational behavioral principles (Think Before Coding, Simplicity First, Surgical Changes, and Goal-Driven Execution) to curb AI over-engineering, unstated assumptions, and extraneous edits.

### Agent Skills — summary: "Inside this repo — 5 of 25 skills"

Displayed names are the slash commands; each maps to the skill noted in
parentheses. The command is the user-facing entry.

1. `/spec` (maps to `spec-driven-development`) — Authors a comprehensive PRD covering objectives, commands, directory structure, testing strategy, and boundaries before writing any code.
2. `/plan` (maps to `planning-and-task-breakdown`) — Decomposes specifications into small, atomic, verifiable implementation tasks ordered by dependency with clear acceptance criteria.
3. `/build` (maps to `incremental-implementation`) — Implements changes in vertical slices—coding, testing, verifying, and committing atomically with safe defaults and feature flags.
4. `/test` (maps to `test-driven-development`) — Enforces a strict Red-Green-Refactor cycle following the test pyramid to verify functional correctness and prevent regressions.
5. `/review` (maps to `code-review-and-quality`) — Conducts a five-axis pre-merge quality and code health review evaluating architecture, correctness, tests, security, and maintainability.

## Design

### UI/UX Pro Max — summary: "Inside this repo — 5 of 7 skills"

1. `ui-ux-pro-max` — Delivers searchable, stack-specific design intelligence across 22 frameworks, covering UI styles, color palettes, font pairings, animations, and UX best practices.
2. `design-system` — Generates multi-tiered design token architectures (primitive, semantic, component), CSS variables, component specifications, and presentation slide structures.
3. `ui-styling` — Directs the creation of accessible web interfaces utilizing shadcn/ui components, Tailwind CSS utility patterns, and visual canvas layouts.
4. `design` — Coordinates broad branding and graphic deliverables, including logo creation, corporate identity programs, social cards, mockups, and icon generation.
5. `banner-design` — Designs responsive digital and print banners across social platforms, display advertising, and website hero sections using preset art direction styles.

## Efficiency

### Caveman — summary: "Featured skills and commands" — note: "Featured entries, not the whole catalog."

No total is shown: the list is drawn from a mixed pool (22 registered
skills plus 8 commands plus playbooks), so no single total names the
set (see spec §5).

1. `/caveman` — Enforces an ultra-concise, structured communication style (answer first, one idea per sentence, eliminating conversational filler) while preserving code, file paths, commands, and numbers character-for-character.
2. `/ultracave` — Compresses agent communication to maximum brevity using sentence fragments and single-word answers while stating each technical fact only once.
3. `/caveman-compress` — Shrinks agent steering and memory files (e.g., `CLAUDE.md`, `AGENTS.md`) to conserve context window tokens while backing up originals and keeping headings, code blocks, and paths intact.
4. `/caveman-review` — Performs a dense code review outputting exactly one finding per line anchored to code line numbers without discursive preambles.
5. `investigate-first` (playbook) — Enforces a disciplined debugging playbook requiring the agent to gather log/test evidence and confirm a credible failure mechanism before any code edits are authorized.

## Knowledge

### Graphify — summary: "Inside this repo — 1 skill, 4 subcommands"

Item 1 is the skill; items 2–5 each carry the `subcommand` kind tag.

1. `/graphify` (skill) — Executes the full deterministic AST parsing and extraction pipeline on a codebase to detect communities, identify god nodes, and generate an interactive HTML visual graph, GraphRAG-ready JSON, and a `GRAPH_REPORT.md` architecture summary.
2. `graphify query` (subcommand) — Answers architecture and code relationship questions using deterministic graph traversal (BFS or semantic search) against local graph artifacts instead of grepping raw source files.
3. `graphify path` (subcommand) — Traces and outputs the dependency and call connection paths between two specified components or god nodes within the knowledge graph.
4. `graphify explain` (subcommand) — Inspects a specific node or component in the graph and summarizes its architectural role, community membership, upstream dependencies, and downstream dependents.
5. `graphify add` (subcommand) — Ingests, parses, or transcribes an external artifact (such as an arXiv paper URL, YouTube video, or document) and merges its extracted entities into the existing project graph.

### Understand-Anything — summary: "Inside this repo — 5 of 9 skills"

1. `understand` (invoked as `/understand`) — Scans the project with tree-sitter and a multi-agent pipeline to extract files, functions, classes, and dependencies into an incremental knowledge graph saved in `.ua/knowledge-graph.json`.
2. `understand-dashboard` (invoked as `/understand-dashboard`) — Launches an interactive, web-based visual dashboard displaying the codebase knowledge graph color-coded by architectural layer with search and inspection capabilities.
3. `understand-chat` (invoked as `/understand-chat`) — Answers natural language architectural and flow questions about the project by traversing the indexed knowledge graph without reading entire raw files.
4. `understand-diff` (invoked as `/understand-diff`) — Evaluates git diffs and pending code modifications against the knowledge graph to determine structural impact, affected dependencies, and downstream blast radius.
5. `understand-explain` (invoked as `/understand-explain`) — Performs a focused architectural breakdown of a specified file, class, or function, detailing its structural role, callers, callees, and dependencies.

### Anthropic Skills — summary: "Inside this repo — 5 of 19 skills"

1. `pdf` — Reads, extracts text and tabular data, merges, splits, rotates, watermarks, creates, fills forms, encrypts/decrypts, and runs OCR on PDF files.
2. `docx` — Creates, reads, edits, and manipulates Microsoft Word documents (.docx) and templates (.dotx) with structured styling, tables of contents, letterheads, and tracked changes.
3. `xlsx` — Reads, edits, formats, calculates formulas, generates charts, cleans messy data, and creates Microsoft Excel spreadsheets (.xlsx, .xlsm, .csv).
4. `pptx` — Creates, reads, extracts text from, updates, and formats Microsoft PowerPoint slide decks and templates (.pptx, .potx), including speaker notes and layouts.
5. `skill-creator` — Provides instructions and workflows for creating new custom skills from scratch, improving existing skills, running evals, and optimizing skill descriptions for triggering accuracy.

### Scientific Agent Skills — summary: "Inside this repo — 5 of 177 skills"

1. `database-lookup` — Executes reproducible queries against 80 documented scientific, regulatory, and financial database APIs with explicit endpoint selection, pagination, and provenance tracking.
2. `scanpy` — Drives single-cell RNA-seq workflows encompassing quality control, normalization, high-variable gene selection, clustering, marker ranking, and AnnData file conversion.
3. `rdkit` — Provides programmatic cheminformatics routines for SMILES/SDF parsing, molecular descriptor calculation, substructure searching, and 2D/3D structure generation.
4. `autoskill` — Analyzes recorded Screenpipe user activity windows to detect repetitive computational research workflows and draft candidate skill definitions.
5. `paperclip` — Searches and extracts biomedical literature, FDA/PMDA/EMA filings, and clinical trial records using the Paperclip CLI with line-pinned citation tracking.

### Obsidian Skills — summary: "Inside this repo — 5 of 6 skills"

"5 of 6" is intentional: the omitted 6th skill is `knap` (renders
Markdown templates from structured CSV or JSON data). It is omitted
by the top-5 rule, not by error; see spec §9 for the footnote question.

1. `obsidian-markdown` — Authors and edits Obsidian Flavored Markdown notes using wikilinks, transclusions, embeds, callout blocks, and YAML frontmatter properties.
2. `obsidian-bases` — Creates and configures Obsidian Base files (`.base`) with database-like table views, filter criteria, formulas, and property summaries.
3. `json-canvas` — Constructs and edits visual JSON Canvas files (`.canvas`) comprising nodes, directional edges, grouping boundaries, and connection metadata.
4. `obsidian-cli` — Operates active Obsidian desktop vaults through the `obsidian` CLI to manipulate notes, search vaults, reload plugins, and execute JavaScript.
5. `defuddle` — Extracts clean, readable Markdown from arbitrary HTML web pages via the Defuddle CLI, eliminating clutter and adverts to minimize token usage.

### Google Skills — summary: "Featured inside this catalog" — note: "Featured entries, not the whole catalog."

No total is shown: the report gives 177 skills in index.json but 184
documented links and 182 SKILL.md files, so no single total is
trustworthy for the summary (see spec §5).

1. `finding-google-skills` — Serves as Google's dynamic skills catalog router, inspecting user task requirements and fetching matching Google platform decision, setup, and architecture skills on demand from `index.json`.
2. `google-cloud-recipe-auth` — Delivers authoritative guidance on Google Cloud Identity and Access Management (IAM), configuring human and service identities, Application Default Credentials (ADC), and required API attribution headers.
3. `google-cloud-recipe-onboarding` — Provides a streamlined, non-interactive onboarding flow for individual developers getting started on Google Cloud, handling account setup, billing linkage, project creation, and initial resource deployment.
4. `google-cloud-recipe-foundation-builder` — Deploys a baseline landing zone foundation for an enterprise Google Cloud Organization, establishing organizational security guardrails, folder hierarchies, billing links, and centralized logging.
5. `google-cloud-solution-architecture` — Interactively gathers workload requirements to design holistic, multi-product Google Cloud solution blueprints, service integration plans, and architecture diagrams.

## Discovery

### Agentic Awesome Skills — summary: "Featured inside this catalog" — note: "Featured entries, not the whole catalog."

No total is shown: the report's section says 2,872 skills while its
summary says 2,750+ — conflicting, so neither figure goes in the
summary (see spec §5). Items are the flagship "Essentials" bundle.

1. `brainstorming` — Guides the agent through collaborative reasoning and inquiry to refine ambiguous requirements and creative ideas into validated architectural designs before implementation.
2. `concise-planning` — Generates actionable, atomic, and structured task checklists to organize coding tasks before source modification begins.
3. `test-driven-development` — Directs implementation through failing behavioral tests first, followed by code implementation and refactoring within verified regression boundaries.
4. `lint-and-validate` — Executes configured linting and type checks, differentiates actual failures from unexecuted checks, and reports concrete validation diagnostics.
5. `systematic-debugging` — Investigates errors, test failures, and unexpected application behaviors methodically from empirical evidence and structured hypotheses rather than speculative guessing.

### Awesome Claude Code — summary: "Featured inside this catalog" — note: "Featured entries, not the whole catalog."

Items are external skills indexed in the catalog's Skills section (the
catalog itself contains 0 in-tree skills). Its first entry, Caveman,
is also a card on this site; that cross-reference is correct as
reported and must not be de-duplicated away.

1. `Caveman` — Compresses agent communication tokens by instructing Claude Code to converse in concise, fragmented "caveman speak."
2. `Claude Code Infrastructure Showcase` — Implements dynamic skill selection by using lifecycle hooks to automatically detect and activate relevant skills based on active context.
3. `Cooklang skills` — Allows AI coding agents to parse, create, and manage Cooklang recipe files (`.cook`) and meal plans (`.menu`).
4. `daily.dev` — Fetches curated developer news feeds and community insights from the daily.dev platform directly into an agent session.
5. `fable-mode` — Configures Claude Code for autonomous multi-stage planning, sub-agent delegation, and automated self-verification loops.

### Claude Plugins Official — summary: "5 first-party plugins" — note: "Featured entries, not the whole catalog."

Items are first-party plugins in `/plugins/`; the 315-plugin index
total is NOT shown because it names a different, larger class than
the items displayed (see spec §5).

1. `skill-creator` — Guides users through creating, refining, evaluating, and benchmarking custom Claude Code agent skills with variance analysis.
2. `plugin-dev` — Provides developer tooling and procedural guidelines for constructing Claude Code plugins, custom commands, hooks, and MCP servers.
3. `feature-dev` — Orchestrates a 7-phase feature development workflow utilizing specialized subagents for code exploration, architectural design, and implementation review.
4. `code-review` — Performs multi-agent automated code reviews on git pull requests, generating prioritized issues scored by confidence.
5. `commit-commands` — Streamlines routine git repository workflows via dedicated commands for drafting commit messages (`/commit`), pushing PRs (`/commit-push-pr`), and pruning stale branches (`/clean_gone`).

### Awesome Agent Skills — summary: "Featured inside this catalog" — note: "Featured entries, not the whole catalog."

Items are the first 5 of the catalog's lead flagship section
("Official Claude Skills"); no index total is shown because the list
is drawn from one section, not the whole 1,497+ index (see spec §5).

1. `anthropics/docx` — Enables coding agents to inspect, create, edit, and format Microsoft Word (`.docx`) documents.
2. `anthropics/doc-coauthoring` — Structures multi-turn collaborative document authoring, drafting, and iterative editorial reviews.
3. `anthropics/pptx` — Generates, updates, and formats Microsoft PowerPoint presentation slide decks (`.pptx`).
4. `anthropics/xlsx` — Creates, edits, and analyzes Microsoft Excel spreadsheets (`.xlsx`) including cell formulas, sheets, and tabular formatting.
5. `anthropics/pdf` — Extracts text and tables, parses structured forms, and compiles printable PDF documents.

### Claude Skills Collection — summary: "Inside this repo — 5 of 401 skills"

1. `skill-security-auditor` — Scans and audits AI agent skills for malicious execution patterns, subprocess calls, network data exfiltration, prompt injections, and supply-chain risks before installation, returning a strict PASS, WARN, or FAIL verdict.
2. `pw` — Provides a comprehensive end-to-end Playwright testing toolkit to generate tests, diagnose and repair flaky test failures, migrate suites from Cypress or Selenium, and integrate with BrowserStack and TestRail.
3. `self-improving-agent` — Analyzes and curates auto-memory entries across agent sessions, promoting recurring patterns and debugging insights into durable project rules (`CLAUDE.md`) or extracting them into reusable custom skills.
4. `karpathy-coder` — Enforces Andrej Karpathy's four core coding principles—surfacing assumptions, radical simplicity, surgical diffs, and verifiable success criteria—using automated complexity checkers, diff linters, and review hooks.
5. `grill-me` — Relentlessly interviews the user one question at a time to stress-test architectural plans and designs, exploring the codebase first before asking questions and systematically resolving decision dependencies.

---

## Counts check

21 cards. Items per card: 5 everywhere except Karpathy Skills (1).
Total items: 20 × 5 + 1 = 101, matching the report's 101 entries
before the Matt swap (the swap replaces one item with another; the
count is unchanged). Source grade for every item: Verified, including
Matt `to-spec` (orchestrator-anchored to its SKILL.md, see above).
