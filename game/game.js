/*
 * TopSkills Game v1: walk the world, collect the 218 Inside items ("skills").
 *
 * Runs as an ES module (served) or a classic script (opened from file://);
 * three.js comes from the import map in game.html via dynamic import(), so a
 * CDN failure can be caught and shown in a readable error panel.
 *
 * The pure logic (data, XP/levels, layout, spawn, progress) runs without a
 * DOM and is exposed as globalThis.TopSkillsGame for headless checks.
 */
(function (root) {
  'use strict';

  // Snapshot of inputs/skills.json (GitHub main 85f70e1d, 2026-11-02),
  // trimmed to the fields the game uses. Item: [name, category, function, example_prompt].
  const DATA = {"chapters":["Workflow","Quality","Design","Efficiency","Knowledge","Discovery"],"cards":[{"id":"skill-1","title":"Superpowers","category":"Workflow","items":[["brainstorming","Planning","Explores and clarifies user requirements through iterative questioning before building begins, synthesizing understanding into a written design specification.","Help me brainstorm the requirements and architecture for our new user authentication system before we write any code."],["using-git-worktrees","Setup","Provisions an isolated development workspace on a separate branch using harness-native tooling or git worktree fallbacks, verifying clean baseline test status before implementation starts.","Set up an isolated git worktree on a new feature branch and verify a clean test baseline before starting work."],["writing-plans","Planning","Decomposes an approved design document into granular, bite-sized tasks (2–5 minutes each) specifying exact file paths, full code implementations, and explicit test verification steps.","Create a granular implementation plan with bite-sized tasks, exact file paths, and test verification steps for our approved design."],["subagent-driven-development","Building","Coordinates implementation by dispatching an isolated subagent for each task, followed by two-stage reviews (spec compliance and code quality) after every step.","Execute the plan in docs/superpowers/plans/auth-system.md using subagent-driven development, dispatching fresh subagents with reviews for each task."],["test-driven-development","Testing","Enforces a strict Red-Green-Refactor discipline that requires writing a failing test and observing it fail before producing the minimal code required to pass.","Implement the user profile service using strict test-driven development by writing a failing test first before adding production code."]]},{"id":"skill-2","title":"ECC","category":"Workflow","items":[["tdd-workflow","Testing","Directs a complete test-driven development cycle requiring a failing test prior to code implementation, followed by incremental greening and refactoring targeting 80%+ test coverage across unit, integration, and E2E suites.","Reproduce the shopping cart checkout bug with a failing test first, then use tdd-workflow to implement the fix."],["/ecc:plan","Planning","Clarifies user requirements, assesses architectural and operational risks, and structures a step-by-step implementation plan while halting for explicit confirmation before code edits occur.","/ecc:plan \"Implement user authentication with JWT tokens, role-based access control, and password reset endpoints in our API.\""],["/code-review","Review","Conducts a structured, fresh-context code review on uncommitted local modifications or GitHub pull requests using a multi-phase checklist for bugs, style, and security.","/code-review Run a fresh-context review on uncommitted local modifications to check for bugs, styling issues, and potential security vulnerabilities."],["/build-fix","Debugging","Inspects the repository to detect its active build system and iteratively resolves compiler, linter, and type-check errors using minimal, localized changes.","/build-fix Inspect the repository build system and incrementally resolve all TypeScript compiler and linter errors using minimal, localized changes."],["security-scan","Review","Scans the agent harness setup (`.claude/` directory, MCP servers, hooks, and prompt guidelines) for configuration flaws, injection vulnerabilities, and credential exposure using AgentShield.","/security-scan .claude/ to audit our configuration for hardcoded secrets, injection vulnerabilities, and overly permissive MCP server settings."]]},{"id":"skill-4","title":"Matt Pocock Skills","category":"Workflow","items":[["grill-with-docs","Planning","Interrogates the user in depth about planned changes while writing Architecture Decision Records (ADRs) and maintaining a ubiquitous project domain glossary (`GLOSSARY.md`) before work starts.","/grill-with-docs Interview me about our proposed caching architecture while recording architectural decision records and updating our project glossary."],["grill-me","Planning","Recursively interviews the user on an idea, plan, or general proposal until every branch of the design decision tree is explored and aligned.","/grill-me Interview me relentlessly about my proposal for a team on-call rotation until every branch of the plan is resolved."],["to-spec","Planning","Turns a grilled understanding into a written specification, with implementation seams agreed up front before tickets are cut.","/to-spec Turn our conversation into a complete feature specification, proposing test seams and publishing it to our issue tracker."],["implement","Building","Executes tasks defined by a specification or ticket list, triggering `/tdd` across identified seams and terminating with `/code-review` before committing changes.","/implement Build the feature described in ticket #104, using test-driven development at identified seams and running code review before committing."],["code-review","Review","Performs a dual-axis evaluation of repository diffs comparing code against standards and against the originating spec using parallel, isolated subagents.","Review our current changes since main against repo coding standards and originating issue #45 using parallel subagents for evaluation."],["ask-matt","Discovery","Routes user to the right workflow or skill","Use ask-matt to recommend the best skill sequence for turning our auth refactor idea into tested, production-ready code."],["codebase-design","Planning","Designs deep modules behind simple seams","Use codebase-design to restructure our payment gateway into a deep module hiding its internal webhook handlers behind one interface."],["diagnosing-bugs","Debugging","Disciplined loop for hard bugs and failures","Use diagnosing-bugs to build a reproducible failing test for the intermittent session timeout before attempting any speculative code fix."],["domain-modeling","Planning","Sharpens terms and updates glossary and ADRs","Use domain-modeling to clarify our order fulfillment terminology, resolve naming ambiguities, and update the glossary with our new state transitions."],["implement-spec","Building","Executes full spec using concurrent workers","Use implement-spec to execute our completed billing integration spec across parallel implementer subagents on a dedicated feature branch."],["improve-codebase-architecture","Understanding","Finds deep module opportunities in a codebase","Use improve-codebase-architecture to scan our repository for shallow abstractions, generate an interactive HTML report, and suggest deeper seams."],["pr","Writing","Formats PR body with summary and verification","Use pr to construct a pull request description including a concise summary, before-and-after verification evidence, and merge risk analysis."],["prototype","Building","Builds throwaway logic or UI spike prototypes","Use prototype to build a throwaway single-file HTML spike validating our multi-step checkout state machine before writing production code."],["research","Research","Investigates primary sources into repo docs","Use research to investigate the latest Stripe webhook idempotency guidelines against official documentation and document findings in our repository."],["retro","Review","Reviews session to improve agent environment","Use retro to evaluate our recent development session and recommend high-impact improvements to our linter rules, steering docs, and harness."],["setup-matt-pocock-skills","Setup","Configures tracker, labels, and doc structure","Use setup-matt-pocock-skills to configure our GitHub issue tracker integration, establish triage labels, and initialize our domain documentation layout."],["tdd","Testing","Drives red-green-refactor vertical slices","Use tdd to implement our token verification logic by writing a failing test first, followed by minimal implementation and refactoring."],["to-tickets","Planning","Splits specs into tracer-bullet issue graphs","Use to-tickets to decompose our authentication specification into tracer-bullet tickets declaring explicit dependency edges for our tracking system."],["triage","Planning","Processes issues into actionable agent briefs","Use triage to inspect incoming user bug reports, verify reproduction steps, apply triage labels, and draft structured agent-ready implementation briefs."],["wayfinder","Planning","Maps multi-session work as decision tickets","Use wayfinder to break our database migration into a decision map of sequential tickets resolving unknowns one step at a time."],["wizard","Setup","Generates interactive bash setup walkthroughs","Use wizard to generate an interactive bash script that guides our DevOps engineer step-by-step through manual AWS credential provisioning."],["grilling","Planning","Relentless interview primitive for decisions","Use grilling to relentlessly interview me about our proposed caching strategy until every trade-off and edge case is thoroughly resolved."],["handoff","Communication","Compacts session context for another agent","Use handoff to summarize our current debugging progress into a concise state document so another agent can continue the task seamlessly."],["teach","Communication","Interactive workspace for learning concepts","Use teach to guide me through understanding distributed consensus algorithms with interactive exercises and incremental knowledge checks in this workspace."],["to-questionnaire","Planning","Turns blocked decisions into questionnaires","Use to-questionnaire to create an asynchronous markdown questionnaire for our product manager regarding unresolved user permission requirements and trade-offs."],["wait-what","Communication","Re-explains unclear messages using glossary","Use wait-what to rephrase your previous technical explanation in plain English using terminology already established in our project glossary."],["writing-for-agents","Writing","Guides authoring docs and steering for agents","Use writing-for-agents to craft clear, concise instructions for our team steering guidelines following proven context-pointer and front-loading principles."]]},{"id":"skill-12","title":"Spec Kit","category":"Workflow","items":[["speckit-specify","Planning","Creates or updates a detailed feature specification (`spec.md`) from natural language requirements, defining functional scope, user stories, and technical constraints.","/speckit-specify Build a photo organizer with albums grouped by date and a tile preview of each album."],["speckit-plan","Planning","Executes implementation planning using design templates to generate technical design artifacts, technology choices, and architectural boundaries.","/speckit-plan Use .NET Aspire with Postgres, Blazor Server for the drag-and-drop frontend, and REST APIs for task management."],["speckit-tasks","Planning","Decomposes the architectural plan and specification into an actionable, dependency-ordered `tasks.md` checklist for systematic implementation.","/speckit-tasks Break down our technical plan into an actionable, dependency-ordered checklist in tasks.md for systematic feature implementation."],["speckit-implement","Building","Executes the implementation plan by processing and building out each task defined in `tasks.md` with prerequisite validation checks.","/speckit-implement Implement only the Setup and Foundational phases: project scaffolding and the project/task data model with basic CRUD."],["speckit-converge","Review","Audits the codebase against the spec, plan, and tasks, automatically appending any missing or incomplete work as new tasks to `tasks.md` until full convergence is reached.","/speckit-converge Audit our codebase against the spec, plan, and tasks, appending any missing requirements to tasks.md until fully converged."]]},{"id":"skill-16","title":"Vercel Skills","category":"Workflow","items":[["find-skills","Discovery","Instructs an AI coding agent on how to query and install agent skills via the Skills CLI when a user requests capabilities not natively supported.","Find a skill for building responsive HTML emails and install it directly into our current project workspace to style newsletters."],["skills add","Setup","Downloads and installs agent skills from GitHub repositories, URLs, or local paths directly into the active project or globally.","skills add vercel-labs/agent-skills --skill web-design-guidelines to configure our project with responsive layout rules and typography standards."],["skills find","Discovery","Interactively searches the open agent skills ecosystem by keyword query or scopes results to a specific GitHub owner.","skills find react performance --owner vercel-labs to discover verified optimization skills for our frontend application codebase."],["skills use","Setup","Generates prompt text or temporarily initializes a coding agent with a specified skill without permanently adding it to project dependencies.","skills use vercel-labs/agent-skills@web-design-guidelines to temporarily load styling rules into this agent session without installing them permanently."],["skills update","Setup","Checks for and updates installed project and global skills to their latest upstream releases.","skills update to refresh all installed agent skills to their latest upstream versions and check for breaking configuration changes."]]},{"id":"skill-20","title":"pstack","category":"Workflow","items":[["bug-fix","Debugging","Mandates reproducing a reported defect directly on the matching target surface first, binary-searching root causes with runtime evidence, and staging a failing repro test commit before landing the fix.","/poteto-mode users get two notifications after a retry: repro first with a failing test, then fix and verify."],["feature","Building","Orchestrates implementing new or modified behavior by establishing domain data shapes, conducting parallel architectural exploration, writing a four-dimension throughput checkpoint, and delegating scoped implementation.","/poteto-mode Implement webhook signature verification for inbound Stripe events, establishing domain data shapes and throughput checkpoints before delegating scoped code changes."],["investigation","Understanding","Executes read-only inquiry into how a subsystem functions or why an architectural decision was made, producing cited explanations and tradeoff matrices without introducing code modifications.","/poteto-mode Investigate how our session expiration and token refresh pipeline works, providing cited code explanations and tradeoff analysis without modifying any files."],["refactoring","Building","Performs behavior-preserving structural alterations by first pinning existing contracts with characterization tests, eliminating dead code, and migrating callers and legacy APIs simultaneously in a single wave.","/poteto-mode Refactor the legacy billing service into modular handlers, pinning existing behavior with characterization tests first to ensure zero functional regressions."],["perf-issue","Debugging","Traces measured slowness against an established baseline trace, systematically applies performance mantras in order of cost, and independently verifies post-fix metric improvements before shipping.","/poteto-mode Trace database query latency on the dashboard endpoint against our baseline profile and optimize the slow queries with verified post-fix benchmarks."],["authoring-a-skill","Writing","Owns a skill’s voice by validating frontmatter, referenced files, cross-skill links, and structural test cases, deleting prose that changes no decision, then running Opening a PR.","/poteto-mode Author a release-notes skill with valid frontmatter, working cross-skill links, and structural cases, keeping only instructions that change decisions."],["autonomous-run","Planning","Defines a checkable exit condition, then drives toward it without stopping through evidence-based iterations, event watchers or timed heartbeats, verifying each change and discarding attempts that do not advance it.","/poteto-mode Run until the invoice retry regression passes consistently, defining the exit predicate first and using heartbeats to verify each attempted fix."],["autopilot-full","Review","Owns verdicts while assigning one owner per PR, requiring independent verification by a swarm that never wrote the code and green CI at each current head before anything merges.","/poteto-mode Coordinate the three billing PRs with one owner each, independent verification swarms, and green CI at each head before allowing merges."],["autopilot-stack","Review","Runs Autopilot-full verification without merging, stopping at verified PRs with green checks at their current heads and handing them to the operator, stacking only PRs that build on others.","/poteto-mode Verify the schema and billing migration PRs as a dependent stack, then hand their current-head verdicts to me without merging."],["babysit","Review","Owns the merge frontier by declaring a mode, clearing one PR at a time, and stopping where a human decision begins, while leaving the actual landing operation to Shipping.","/poteto-mode Babysit the completed invoice PR stack in drive mode, clearing one PR at a time and stopping when a product decision needs me."],["eval","Testing","Owns experiment design through planning, blinding, running, and synthesising results, keeping evaluation language out of candidate environments and prompts while a blinded judge assesses outputs against a private rubric.","/poteto-mode Evaluate two release-note instruction variants with sanitized workspaces, one organic task, and a blinded judge using a private rubric for factual accuracy."],["hillclimb","Testing","Owns one metric and experiment integrity through a frozen measurement harness, testing one change at a time, keeping measured improvements or reverting failures, and never claiming wins from inspection alone.","/poteto-mode Reduce dashboard startup latency with a frozen realistic workload, one change per measurement, and a decision log recording every kept or reverted attempt."],["multi-phase-plan","Planning","Owns the plan rather than implementation, producing an evidence-backed checklist an owner executes box by box and an operator audits, with dependencies, verification steps, and explicit review gates.","/poteto-mode Plan the billing provider migration as ordered PR checklists with dependencies, evidence requirements, and review gates, without implementing any code."],["opening-a-pr","Communication","Runs at the end of every other playbook, preparing work in a worktree off main and organising small ordered commits so each can become a future independently landable PR.","/poteto-mode Prepare the invoice retry fix for review from a worktree off main, arranging small ordered commits that each form a landable PR."],["orchestrate","Planning","Runs the program rather than writing code, deciding which agent owns each piece, checking the evidence each produces, and maintaining authoritative program state in the Project tracker throughout execution.","/poteto-mode Coordinate the checkout migration across scoped agent owners, check their evidence, and maintain dependencies and progress in the Project tracker."],["pause-safely","Planning","Owns a clean stop by finishing or backing out of the atomic step, taking no irreversible action, and leaving a durable wip checkpoint with a resume note for a cold-start agent.","/poteto-mode Pause the checkout migration at a safe boundary, checkpoint unfinished work, and record verified progress, current state, and the first action for resumption."],["prototype","Design","Owns a design decision through a throwaway instrument, exploring alternatives quickly in an isolated scratch directory, observing their behaviour, and handing the chosen direction to Feature for the real build.","/poteto-mode Prototype compact and spacious invoice tables behind a switcher in a scratch directory, observe their interactions, and recommend a direction for Feature."],["runtime-forensics","Debugging","Owns diagnosis from a live process by capturing a profile, heap snapshot, or CDP trace, reducing it to the smoking gun, and proving the mechanism before delivering a cited diagnosis.","/poteto-mode Capture a heap snapshot from the running invoice dashboard, trace retained subscriptions to their GC roots, and deliver a cited diagnosis before proposing fixes."],["session-pickup","Understanding","Owns the resume point by reading the prior transcript, cloud URL, or pushed branch first, reconstructing completed and pending work without redoing it, and retaining a reduced timeline in the main thread.","/poteto-mode Resume the invoice migration from its pushed branch and prior transcript, identify completed work and pending decisions, and continue from the recorded resume point."],["shipping","Review","Owns what lands by verifying each PR independently, landing only the verified contiguous run from the root, confirming each merge, and keeping hands off the stack while it lands.","/poteto-mode Ship the verified billing stack from its root through its approved ceiling, confirming each merge and preserving the remaining stack while it lands."],["trace-forensics","Debugging","Owns diagnosis from an existing artifact by identifying its format, parsing it with generic tooling, reducing it to a source-attributed finding, and distinguishing confirmed causes from hypotheses without a live rerun.","/poteto-mode Analyze the saved checkout CPU profile with a generic parser, identify the hot call path and source symbols, and report the strongest supported diagnosis."],["visual-parity","Testing","Owns pixel-exact equivalence by establishing the baseline before migration, moving one component at a time, and verifying zero image diff without changing the harness or tampering with baseline images.","/poteto-mode Migrate the invoice status component against its existing screenshot baseline, checking every state by image diff and preserving the harness and baseline images."],["worktree-cleanup","Setup","Snapshots and audits worktrees and simulator state using paths from worktree list, classifying size, age, merge state, uncommitted work, and PR state before checking active usage and pruning confirmed candidates.","/poteto-mode Audit worktrees and simulator storage, classify candidates from worktree list, cross-check active chats, and hold any uncommitted work for my decision."],["architect","Design","Develops competing type and module sketches, synthesizes a design, and implements against it.","/architect Design the reservation service types and module boundaries before implementing the booking flow."],["arena","Building","Runs parallel attempts at one brief and combines the strongest parts into a verified artifact.","/arena Produce competing CSV importers and synthesize the clearest implementation with verified error handling."],["automate-me","Writing","Turns recurring working preferences and direct feedback into a personal mode skill.","/poteto-mode use automate-me to capture my review preferences in a personal mode skill."],["benchmark-checklist","Testing","Checks performance claims against actual work, bottlenecks, tuning, errors, and repeatable measurements.","/poteto-mode use benchmark-checklist to vet the claimed export speedup before we choose a serializer."],["blast-radius","Review","Investigates breakage beyond a change and runs real code to prove its critical safety assumption.","/poteto-mode use blast-radius to check what removing the session cache eviction call could break."],["bro","Communication","Rewrites the previous reply in simpler, concise language without jargon.","/poteto-mode use bro to restate your last explanation of transaction isolation in plain words."],["correct","Building","Prevents recurring agent mistakes through architecture, types, or executable checks proven against past failures.","/correct Prevent agents from repeatedly bypassing the permission parser and prove the enforcement catches a past mistake."],["create-formal-verification-skill","Testing","Verifies a high-impact property with a suitable formal tool and creates a reusable project skill.","/create-formal-verification-skill Verify that concurrent lease renewals cannot grant two owners and leave a rerunnable skill."],["create-verification-skill","Testing","Creates and exercises a project skill that launches the real app, drives user behavior, and retains evidence.","/create-verification-skill Build a verification skill for our inventory CLI and prove its stock adjustment journey."],["figure-it-out","Planning","Designs and executes an auditable workflow with falsifiable goals, experiments, and decision records when no playbook fits.","/figure-it-out Plan and execute the tenant storage migration with independently verifiable units and an audit trail."],["how","Understanding","Explores code to explain subsystem structure, runtime flow, and ownership before changes.","/poteto-mode use how to explain where notification delivery is owned and how retries reach the queue."],["in-your-own-words","Understanding","Restates the user's goals and the problem behind the request to check understanding.","/in-your-own-words Restate what I need from offline invoice editing and the problem it solves for field staff."],["interrogate","Review","Uses adversarial reviewers and reruns their reproductions to report only demonstrated failures.","/poteto-mode use interrogate to challenge the new password reset flow and report only failures proven by a run."],["ketchup","Communication","Summarizes changes since the user's last message and supplies the context for every pending user decision.","/ketchup Catch me up on the import work since my last message and explain any decisions waiting on me."],["ketchup-video","Communication","Presents the chat's recent changes in a subtitled slide video with pending decisions listed as text.","/ketchup-video Show what changed in the calendar redesign and list the choices that still need me."],["maintain-formal-verification-skill","Testing","Updates formal checks to match changed code and distinguishes verification drift from genuine property violations.","/maintain-formal-verification-skill Reconcile the lease model with the renewal refactor and classify each failure as drift or a bug."],["maintain-verification-skill","Testing","Audits a verification skill and feature map against source and live app behavior, correcting proven drift.","/maintain-verification-skill Audit the inventory verification map against the current CLI and exercise every mapped feature."],["make-bot-ui","Building","Builds a UI whose server sends webhook events to a Grok Bot while keeping the sender key out of the browser.","/poteto-mode use make-bot-ui to build a task dashboard whose buttons wake a Grok Bot through a server-held webhook key."],["no-comments","Review","Runs Comment Sicko, audits its findings, fixes accepted root causes, and offers enforceable replacements for constraint comments.","/no-comments Review the invoice parser diff and address accepted findings within that scope."],["poteto-help","Understanding","Answers pstack questions with a suitable next prompt and links to the source instructions.","/poteto-help Which workflow should I use to verify a change before handing it over?"],["poteto-mode","Building","Routes demanding tasks through playbooks with engineering principles, deliberate delegation, and verification of real results.","/poteto-mode Add cancellation to scheduled reports and verify that canceled reports never send email."],["principle-attack-the-premise","Debugging","Tests the assumption shared by repeated failed fixes before attempting another repair.","/poteto-mode apply attack the premise: test whether clock skew actually explains the two failed retry fixes."],["principle-boundary-discipline","Building","Concentrates validation at system boundaries and keeps internal business logic pure and typed.","/poteto-mode apply boundary discipline: parse incoming shipment payloads once before passing typed data to the service."],["principle-build-the-lever","Building","Creates a rerunnable tool to perform or verify nontrivial work instead of relying on manual edits.","/poteto-mode apply build the lever: write a rerunnable codemod for the route parameter rename."],["principle-encode-lessons-in-structure","Building","Converts recurring instructions and corrections into structural or executable enforcement where possible.","/poteto-mode apply encode lessons in structure: enforce the repeated rule against importing storage internals."],["principle-exhaust-the-design-space","Design","Compares competing prototypes before choosing an unfamiliar interaction or architectural direction.","/poteto-mode apply exhaust the design space: prototype three keyboard navigation patterns for the command palette."],["principle-experience-first","Design","Prioritizes the consumer's experience and polished core workflows when trading off scope and implementation effort.","/poteto-mode apply experience first: narrow the launch scope so the booking confirmation flow feels complete."],["principle-explain-the-number","Testing","Establishes what a measurement means by identifying its limiter and ruling out misleading work or noise.","/poteto-mode apply explain the number: investigate what bounds our claimed search throughput and whether every query ran."],["principle-fix-root-causes","Debugging","Traces a reproduced symptom to the first incorrect decision and fixes the fault rather than hiding its consequences.","/poteto-mode apply fix root causes: trace why stale cart totals are created before adding another checkout guard."],["principle-foundational-thinking","Planning","Chooses data structures, shared-state boundaries, and reusable foundations before feature logic.","/poteto-mode apply foundational thinking: settle the shipment state model and verification scaffold before adding transitions."],["principle-guard-the-context-window","Planning","Keeps bulk material in delegated work and concise summaries in the main conversation as context fills.","/poteto-mode apply guard the context window: delegate the large trace reads and retain only cited findings here."],["principle-laziness-protocol","Building","Favors deletion, consolidated decisions, and the smallest sufficient change over extra abstractions.","/poteto-mode apply laziness protocol: simplify the single-caller report adapters before proposing another layer."],["principle-make-operations-idempotent","Building","Designs state changes to reconcile existing state and converge after repeats or interrupted runs.","/poteto-mode apply make operations idempotent: make interrupted attachment imports safe to resume without duplicates."],["principle-migrate-callers-then-delete-legacy-apis","Building","Migrates internal callers and removes the obsolete API together when coordinated breaking changes are supported.","/poteto-mode apply migrate callers then delete legacy apis: move every internal pricing caller to the new contract in one wave."],["principle-minimize-reader-load","Building","Reduces unnecessary indirection and hidden mutable state so readers can trace values and ownership.","/poteto-mode apply minimize reader load: collapse pass-through permission wrappers and reduce shared mutable flags."],["principle-model-the-domain","Design","Represents domain rules in suitable structures instead of spreading state assumptions across conditionals.","/poteto-mode apply model the domain: replace the subscription lifecycle booleans with explicit states and transitions."],["principle-never-block-on-the-human","Planning","Proceeds with reasonable reversible work and presents results for asynchronous human correction.","/poteto-mode apply never block on the human: complete the reversible formatter cleanup and show me the result."],["principle-outcome-oriented-execution","Planning","Directs planned migrations toward a verified target architecture with explicit boundaries for temporary breakage.","/poteto-mode apply outcome oriented execution: migrate the event store toward the agreed design with explicit verification checkpoints."],["principle-prove-it-works","Testing","Checks the actual artifact and records rerunnable evidence before declaring a task complete.","/poteto-mode apply prove it works: run the report cancellation path and inspect the actual delivery records."],["principle-redesign-from-first-principles","Design","Reconsiders the whole affected design as though a new requirement had been present from the start.","/poteto-mode apply redesign from first principles: reshape the upload design around resumability and update its references."],["principle-separate-before-serializing-shared-state","Design","Eliminates shared write targets where possible and structurally serializes access only when sharing is required.","/poteto-mode apply separate before serializing shared state: give metrics workers independent output files before considering a lock."],["principle-sequence-verifiable-units","Planning","Orders multi-step work into small units that each pass a concrete check before the next begins.","/poteto-mode apply sequence verifiable units: migrate one search index at a time and verify each before proceeding."],["principle-subtract-before-you-add","Building","Removes dead code and redundant machinery before building on the simpler design.","/poteto-mode apply subtract before you add: remove the unused coupon validators before adding the promotion route."],["principle-test-behavior-not-implementation","Testing","Tests observable contracts so checks catch broken behavior while surviving internal refactors.","/poteto-mode apply test behavior not implementation: assert the receipt is sent once without pinning private helper order."],["principle-type-system-discipline","Building","Uses domain types, validated boundaries, and exhaustive variants to make invalid states fail at compile time.","/poteto-mode apply type system discipline: distinguish CustomerId from InvoiceId and exhaust payment result variants."],["recall","Understanding","Reconstructs recent work from scoped chats, shared records, and live state into a current brief and next action.","/poteto-mode use recall to reconstruct this week's work on payment retries and identify the next useful action."],["reflect","Review","Reviews the active conversation through three lenses and proposes concrete skill edits for user approval.","/reflect Review this session for durable lessons and propose edits to the existing verification skills."],["setup-pstack","Setup","Detects available models and writes an always-applied rule assigning pstack roles and reasoning budgets.","/setup-pstack Configure a medium reasoning budget using the models available in this session."],["sharpen","Planning","Deepens a task through professional methods, raw evidence, and independent checks, then rewrites its prompt.","/sharpen Rewrite my request to investigate churn using raw cancellation evidence and an outside check."],["show-me-your-work","Communication","Maintains an evidence-linked TSV decision trail for long or unattended work and audits it before handoff.","/show-me-your-work Keep a decision trail for the catalog migration with reasons, evidence, and verified outcomes."],["statechart","Testing","Checks a TLA+ model and draws a Mermaid statechart with shortest paths to rule violations.","/statechart Model the reservation hold lifecycle and show the shortest path to any double-booking violation."],["swarm","Research","Distributes coverage slices or races across parallel workers and consolidates their evidence into one report.","/swarm Investigate queue backpressure across producer, broker, and consumer slices and return one evidence-backed report."],["tdd","Testing","Reproduces a bug with a practical failing test before the fix and confirms the regression check passes afterward.","/poteto-mode use tdd to fix the date parser regression with a cheap local failing test first."],["teach","Understanding","Combines code mechanics and design rationale into a plain explanation paced to the learner.","/poteto-mode use teach to explain how the reservation scheduler works and why it uses leases."],["technical-writing","Writing","Shapes technical documents with Diátaxis structure and clear sentences using Google, STE, and Global English rules.","/technical-writing Rewrite the backup recovery guide as a focused how-to with unambiguous restore steps."],["typescript-best-practices","Building","Applies TypeScript rules for domain modeling, validated data, exhaustive narrowing, and schema-derived types.","/poteto-mode use typescript-best-practices to review the payment event types and replace unsafe casts with validated narrowing."],["unslop","Writing","Removes formulaic AI phrasing and filler while preserving the text's meaning and intended tone.","/poteto-mode use unslop to revise the release announcement while preserving every factual claim."],["why","Understanding","Investigates code decisions across available evidence sources and separates cited findings from inference and unknowns.","/poteto-mode use why to investigate the rationale for the invoice retention threshold and distinguish evidence from inference."]]},{"id":"skill-3","title":"Karpathy Skills","category":"Quality","items":[["karpathy-guidelines","Planning","Enforces four foundational behavioral principles (Think Before Coding, Simplicity First, Surgical Changes, and Goal-Driven Execution) to curb AI over-engineering, unstated assumptions, and extraneous edits.","Follow the karpathy-guidelines to add a feature to export user data, clarifying assumptions and delivering minimal surgical changes with verified tests."]]},{"id":"skill-8","title":"Agent Skills","category":"Quality","items":[["/spec","Planning","Authors a comprehensive PRD covering objectives, commands, directory structure, testing strategy, and boundaries before writing any code.","/spec Author a complete product requirements document for adding role-based access control with admin permissions and audit logging before implementation."],["/plan","Planning","Decomposes specifications into small, atomic, verifiable implementation tasks ordered by dependency with clear acceptance criteria.","/plan Decompose our user authentication specification into small, atomic implementation tasks ordered by dependency with explicit acceptance criteria."],["/build","Building","Implements changes in vertical slices—coding, testing, verifying, and committing atomically with safe defaults and feature flags.","/build Implement the user registration slice from our plan, writing tests and verifying functionality before committing each change atomically."],["/test","Testing","Enforces a strict Red-Green-Refactor cycle following the test pyramid to verify functional correctness and prevent regressions.","/test Apply a strict Red-Green-Refactor cycle to implement input validation for email signups, writing failing tests first before production code."],["/review","Review","Conducts a five-axis pre-merge quality and code health review evaluating architecture, correctness, tests, security, and maintainability.","/review Conduct a five-axis pre-merge review of our authentication pull request, evaluating correctness, architecture, tests, security, and maintainability."]]},{"id":"skill-5","title":"UI/UX Pro Max","category":"Design","items":[["ui-ux-pro-max","Design","Delivers searchable, stack-specific design intelligence across 22 frameworks, covering UI styles, color palettes, font pairings, animations, and UX best practices.","Build a landing page for my SaaS product with dark mode, modern typography pairings, and accessible shadcn/ui components."],["design-system","Design","Generates multi-tiered design token architectures (primitive, semantic, component), CSS variables, component specifications, and presentation slide structures.","Generate a complete design system for our analytics dashboard, establishing primitive, semantic, and component token layers with CSS variables."],["ui-styling","Design","Directs the creation of accessible web interfaces utilizing shadcn/ui components, Tailwind CSS utility patterns, and visual canvas layouts.","Style our user settings dashboard using accessible shadcn/ui components, responsive Tailwind CSS utility classes, and custom dark mode themes."],["design","Design","Coordinates broad branding and graphic deliverables, including logo creation, corporate identity programs, social cards, mockups, and icon generation.","Design a complete brand identity package including modern SVG vector icons, social preview cards, and corporate presentation slide templates."],["banner-design","Design","Designs responsive digital and print banners across social platforms, display advertising, and website hero sections using preset art direction styles.","Create a set of responsive promotional banners for our product launch across Twitter, LinkedIn, and website hero sections using glassmorphism styling."]]},{"id":"skill-21","title":"Taste Skill","category":"Design","items":[["design-taste-frontend","Design","Applies researched art directions, sources real open-archive media, and enforces an anti-slop house style with automated real-browser screenshot audits for public pages and app screens.","Build a landing page for Ledgerly, an invoicing tool for freelance designers, with pricing and a short FAQ."]]},{"id":"skill-22","title":"Impeccable","category":"Design","items":[["init","Planning","Runs project discovery once per project, asking only what it cannot infer, and writes PRODUCT.md that every later command reads.","Run /impeccable init for this project, discovering its users, jobs, and constraints and writing the PRODUCT.md every later command will read."],["polish","Design","Refines an existing interface for shipping without redesigning it, fixing blockers, missing states, drift, and visual inconsistencies in priority order.","/impeccable polish the settings page, refining it for shipping without redesigning it and fixing missing states and visual inconsistencies first."],["bolder","Design","Amplifies a safe or bland interface to the conviction the rest of the design system already implies, scoped to the named target only.","/impeccable bolder the pricing cards, amplifying their hierarchy and visual conviction without rebuilding the surrounding page or adding effects."],["critique","Review","Scores a design against usability heuristics with dual isolated assessments and detector evidence, ranking what to fix first.","/impeccable critique the pricing cards, scoring the design against usability heuristics and ranking the fixes that matter most first."],["audit","Review","Checks accessibility, performance, theming, responsive behaviour, and implementation integrity, ranking findings P0 (blocking) to P3 (polish).","Run /impeccable audit on the checkout flow, checking accessibility, performance, theming, and responsive behaviour and ranking findings from P0 to P3."],["adapt","Design","Adapts designs across screen sizes, devices, contexts, and platforms by implementing breakpoints, fluid layouts, and touch targets that keep responsive interfaces usable across different viewing conditions.","/impeccable adapt the appointment booking form for phones and tablets, adjusting breakpoints, fluid layouts, and touch targets throughout the flow."],["animate","Design","Enhances a feature with purposeful animations, micro-interactions, and motion effects that improve usability and add delight, making transitions and interactions feel more alive without adding decoration for its own sake.","/impeccable animate the file upload panel with progress transitions and completion feedback that help users understand each stage of uploading."],["clarify","Writing","Improves unclear UX copy, error messages, microcopy, labels, and instructions so interfaces become easier to understand, addressing confusing text and hard-to-follow guidance wherever users need clearer wording.","/impeccable clarify the password reset flow, rewriting its field labels, expired link message, and recovery instructions so users understand their next step."],["colorize","Design","Adds strategic color to monochromatic features or interfaces that lack visual interest, making dull designs more engaging and expressive with a palette that brings warmth and vibrancy.","/impeccable colorize the gray meal planning dashboard, using strategic color to distinguish meal groups and make the weekly view more engaging."],["delight","Design","Adds moments of joy, personality, and unexpected touches that make interfaces memorable and enjoyable to use, elevating functional experiences with details that give everyday interactions a more delightful character.","/impeccable delight the reading tracker with a memorable book completion moment and small touches of personality in its reading milestones."],["distill","Design","Strips designs to their essence by removing unnecessary complexity, noise, and elements, simplifying crowded interfaces into cleaner, more focused experiences that retain a simple and powerful design.","/impeccable distill the subscription management screen, removing repeated explanations and unnecessary controls so the current plan and renewal action stand out."],["document","Writing","Generates DESIGN.md in Google Stitch format by extracting colors, typography, spacing, radii, and component patterns from existing code, then confirms descriptive language for atmosphere and color character with the user.","/impeccable document the existing travel planner design system in DESIGN.md, extracting its visual patterns and confirming atmosphere and color descriptions with me."],["extract","Design","Pulls reusable patterns, components, and design tokens into the design system, identifying repeated implementations and consolidating them to reduce drift and restore consistency across the codebase.","/impeccable extract the repeated account settings controls into shared components and design tokens, consolidating spacing and field patterns across the settings screens."],["generate","Design","Boots live mode, finds the named element on the open page, scrolls to it, and delivers the requested number of design variants for the user to cycle through and accept.","/impeccable generate 3 restrained variants of the membership comparison cards, bringing the named element into view so I can cycle through and accept one."],["harden","Building","Makes interfaces production-ready through error handling, internationalization, text overflow fixes, and edge case management, improving resilience when real-world data and unusual input put existing screens under pressure.","/impeccable harden the delivery address form for long international addresses, translated labels, failed submissions, and incomplete customer data before release."],["layout","Design","Improves layout, spacing, and visual rhythm by fixing monotonous grids, inconsistent spacing, and weak hierarchy, giving crowded or poorly aligned interfaces a clearer and more coherent composition.","/impeccable layout the inventory overview, fixing its monotonous grid, crowded stock summaries, and inconsistent spacing so the most urgent information leads."],["live","Design","Starts interactive live variant mode on a running dev server, letting users select browser elements and design actions while AI-generated HTML and CSS alternatives hot-swap through HMR.","/impeccable live on the running dev server so I can select the event header in the browser and compare alternative design actions."],["onboard","Design","Designs onboarding flows, first-run experiences, and empty states that guide new users to value through welcome screens, account setup, progressive disclosure, contextual guidance, and meaningful activation moments.","/impeccable onboard new users of the shared grocery list, designing the first empty state and setup steps through adding their first household item."],["optimize","Debugging","Diagnoses and fixes UI performance across loading speed, rendering, animations, images, and bundle size, addressing slow or laggy interfaces to make the experience faster and smoother.","/impeccable optimize the photo archive grid, diagnosing slow image loading, rendering delays, and scrolling jank before fixing the largest performance costs."],["overdrive","Design","Pushes interfaces past conventional limits with technically ambitious implementations such as shaders, spring physics, scroll-driven reveals, and 60fps animations, creating extraordinary experiences with strong visual impact.","/impeccable overdrive the astronomy exhibition opening with a shader starfield, spring interactions, and scroll-driven reveals that sustain smooth 60fps motion."],["quieter","Design","Tones down visually aggressive or overstimulating designs by reducing intensity while preserving quality, giving overwhelming interfaces a calmer, more refined aesthetic when their current treatment feels too loud.","/impeccable quieter the concert ticket dashboard, reducing competing visual intensity so ticket status and entry details feel calm and easy to scan."],["shape","Planning","Plans UX and UI before code through a discovery interview, using visual probes when available and producing a user-confirmed design brief that guides the subsequent implementation work.","/impeccable shape a volunteer shift signup flow, interviewing me about coordinator needs and confirming a design brief before any implementation begins."],["typeset","Design","Improves typography by fixing font choices, hierarchy, sizing, weight, and readability, making interface text feel intentional and giving existing content a more polished and deliberate typographic treatment.","/impeccable typeset the recipe detail page, improving ingredient readability, instruction hierarchy, font sizing, and weight so cooks can follow each step easily."]]},{"id":"skill-6","title":"Caveman","category":"Efficiency","items":[["/caveman","Communication","Enforces an ultra-concise, structured communication style (answer first, one idea per sentence, eliminating conversational filler) while preserving code, file paths, commands, and numbers character-for-character.","/caveman explain why my React component re-renders every time the parent updates and how to memoize props without breaking state."],["/ultracave","Communication","Compresses agent communication to maximum brevity using sentence fragments and single-word answers while stating each technical fact only once.","/ultracave diagnose why my long-running Node.js worker leaks memory and recommend minimal fixes without conversational pleasantries."],["/caveman-compress","Writing","Shrinks agent steering and memory files (e.g., `CLAUDE.md`, `AGENTS.md`) to conserve context window tokens while backing up originals and keeping headings, code blocks, and paths intact.","/caveman-compress CLAUDE.md to shrink this project memory file and conserve context window tokens before starting development."],["/caveman-review","Review","Performs a dense code review outputting exactly one finding per line anchored to code line numbers without discursive preambles.","/caveman-review the current pull request diff and output exactly one actionable finding per line with severity, location, and fix."],["investigate-first","Debugging","Enforces a disciplined debugging playbook requiring the agent to gather log/test evidence and confirm a credible failure mechanism before any code edits are authorized.","Investigate the intermittent timeout failures in our payment service by tracing failure evidence and ranking hypotheses without modifying product code."]]},{"id":"skill-7","title":"Graphify","category":"Knowledge","items":[["/graphify","Understanding","Executes the full deterministic AST parsing and extraction pipeline on a codebase to detect communities, identify god nodes, and generate an interactive HTML visual graph, GraphRAG-ready JSON, and a `GRAPH_REPORT.md` architecture summary.","/graphify . --mode deep to extract AST dependencies, identify god nodes, and generate the architecture report for this codebase."],["graphify query","Understanding","Answers architecture and code relationship questions using deterministic graph traversal (BFS or semantic search) against local graph artifacts instead of grepping raw source files.","Run graphify query \"what connects auth to the database?\" using BFS traversal to trace component dependencies without reading raw files."],["graphify path","Understanding","Traces and outputs the dependency and call connection paths between two specified components or god nodes within the knowledge graph.","Run graphify path \"UserService\" \"DatabasePool\" to trace all intermediary call chains and dependencies connecting these two components."],["graphify explain","Understanding","Inspects a specific node or component in the graph and summarizes its architectural role, community membership, upstream dependencies, and downstream dependents.","Run graphify explain \"RateLimiter\" to summarize its architectural role, community membership, upstream dependencies, and downstream caller components."],["graphify add","Research","Ingests, parses, or transcribes an external artifact (such as an arXiv paper URL, YouTube video, or document) and merges its extracted entities into the existing project graph.","Run graphify add https://arxiv.org/abs/1706.03762 to ingest this transformer architecture paper and merge its concepts into our graph."]]},{"id":"skill-9","title":"Understand-Anything","category":"Knowledge","items":[["understand","Understanding","Scans the project with tree-sitter and a multi-agent pipeline to extract files, functions, classes, and dependencies into an incremental knowledge graph saved in `.ua/knowledge-graph.json`.","/understand to scan our project with tree-sitter, extract all dependencies, and generate the initial knowledge graph in .ua/."],["understand-dashboard","Understanding","Launches an interactive, web-based visual dashboard displaying the codebase knowledge graph color-coded by architectural layer with search and inspection capabilities.","/understand-dashboard to launch the interactive web visualizer and inspect our project knowledge graph color-coded by architectural layer."],["understand-chat","Understanding","Answers natural language architectural and flow questions about the project by traversing the indexed knowledge graph without reading entire raw files.","/understand-chat How does the payment flow work from user checkout down through the payment gateway and transaction logging?"],["understand-diff","Understanding","Evaluates git diffs and pending code modifications against the knowledge graph to determine structural impact, affected dependencies, and downstream blast radius.","/understand-diff to evaluate our uncommitted git modifications against the knowledge graph and report affected downstream components and risks."],["understand-explain","Understanding","Performs a focused architectural breakdown of a specified file, class, or function, detailing its structural role, callers, callees, and dependencies.","/understand-explain src/auth/login.ts to break down its structural role, callers, callees, and imported dependencies across our codebase."]]},{"id":"skill-11","title":"Anthropic Skills","category":"Knowledge","items":[["pdf","Writing","Reads, extracts text and tabular data, merges, splits, rotates, watermarks, creates, fills forms, encrypts/decrypts, and runs OCR on PDF files.","Extract all financial summary tables from quarterly-report.pdf and merge pages one through five with our signed appendix document."],["docx","Writing","Creates, reads, edits, and manipulates Microsoft Word documents (.docx) and templates (.dotx) with structured styling, tables of contents, letterheads, and tracked changes.","Generate a professional project kickoff report as a Word document (.docx) with a table of contents, executive summary, and letterhead."],["xlsx","Writing","Reads, edits, formats, calculates formulas, generates charts, cleans messy data, and creates Microsoft Excel spreadsheets (.xlsx, .xlsm, .csv).","Clean the messy raw sales CSV in my downloads, format it as an xlsx spreadsheet, and calculate quarterly revenue formulas."],["pptx","Writing","Creates, reads, extracts text from, updates, and formats Microsoft PowerPoint slide decks and templates (.pptx, .potx), including speaker notes and layouts.","Create a ten-slide pitch deck presentation in 16:9 widescreen format (.pptx) summarizing our quarterly product roadmap and speaker notes."],["skill-creator","Writing","Provides instructions and workflows for creating new custom skills from scratch, improving existing skills, running evals, and optimizing skill descriptions for triggering accuracy.","I want to make a new custom skill for automated semantic database migrations, so help me draft and evaluate it."]]},{"id":"skill-14","title":"Obsidian Skills","category":"Knowledge","items":[["obsidian-markdown","Writing","Authors and edits Obsidian Flavored Markdown notes using wikilinks, transclusions, embeds, callout blocks, and YAML frontmatter properties.","Create a new project dashboard note in Obsidian Flavored Markdown using YAML frontmatter properties, embedded note transclusions, wikilinks, and warning callouts."],["obsidian-bases","Writing","Creates and configures Obsidian Base files (`.base`) with database-like table views, filter criteria, formulas, and property summaries.","Create an Obsidian Base file with a table view to organize our project tasks, filtering by status and calculating completion percentages."],["json-canvas","Design","Constructs and edits visual JSON Canvas files (`.canvas`) comprising nodes, directional edges, grouping boundaries, and connection metadata.","Build a visual architecture diagram as an Obsidian JSON Canvas file with labeled nodes, grouped component boundaries, and directional connection edges."],["obsidian-cli","Writing","Operates active Obsidian desktop vaults through the `obsidian` CLI to manipulate notes, search vaults, reload plugins, and execute JavaScript.","Search my active Obsidian vault for uncompleted action items and append a formatted summary list into today's daily note using obsidian-cli."],["defuddle","Writing","Extracts clean, readable Markdown from arbitrary HTML web pages via the Defuddle CLI, eliminating clutter and adverts to minimize token usage.","Extract the full article from the URL I give you into clean readable Markdown using Defuddle, stripping navigation menus, banners, and advertising clutter."]]},{"id":"skill-19","title":"Google Skills","category":"Knowledge","items":[["finding-google-skills","Discovery","Serves as Google's dynamic skills catalog router, inspecting user task requirements and fetching matching Google platform decision, setup, and architecture skills on demand from `index.json`.","Find and load the appropriate Google Cloud database skills from the catalog index to help me migrate MySQL to Cloud SQL."],["google-cloud-recipe-auth","Setup","Delivers authoritative guidance on Google Cloud Identity and Access Management (IAM), configuring human and service identities, Application Default Credentials (ADC), and required API attribution headers.","Configure Application Default Credentials and least-privilege IAM service account roles for our backend service to securely access Google Cloud Storage."],["google-cloud-recipe-onboarding","Setup","Provides a streamlined, non-interactive onboarding flow for individual developers getting started on Google Cloud, handling account setup, billing linkage, project creation, and initial resource deployment.","Walk me through the developer onboarding flow to set up a new Google Cloud project, link billing, and enable required APIs."],["google-cloud-recipe-foundation-builder","Setup","Deploys a baseline landing zone foundation for an enterprise Google Cloud Organization, establishing organizational security guardrails, folder hierarchies, billing links, and centralized logging.","Deploy a secure baseline landing zone foundation for our enterprise Google Cloud Organization with folder hierarchies, guardrails, and centralized audit logging."],["google-cloud-solution-architecture","Planning","Interactively gathers workload requirements to design holistic, multi-product Google Cloud solution blueprints, service integration plans, and architecture diagrams.","Gather our requirements interactively and design a multi-product Google Cloud architecture blueprint for a real-time event streaming and analytics platform."]]},{"id":"skill-10","title":"Agentic Awesome Skills","category":"Discovery","items":[["brainstorming","Planning","Guides the agent through collaborative reasoning and inquiry to refine ambiguous requirements and creative ideas into validated architectural designs before implementation.","Use @brainstorming to help me design a user profile page with authentication and dark mode before writing any application code."],["concise-planning","Planning","Generates actionable, atomic, and structured task checklists to organize coding tasks before source modification begins.","Create an actionable, atomic implementation plan with ordered task items and validation steps before modifying our authentication API codebase."],["test-driven-development","Testing","Directs implementation through failing behavioral tests first, followed by code implementation and refactoring within verified regression boundaries.","Implement the shopping cart discount calculation using test-driven development, writing a failing behavioral test first before writing production code."],["lint-and-validate","Testing","Executes configured linting and type checks, differentiates actual failures from unexecuted checks, and reports concrete validation diagnostics.","Run configured linter and type-checker audits across the repository, reporting concrete diagnostics and fixing all detected syntax and style errors."],["systematic-debugging","Debugging","Investigates errors, test failures, and unexpected application behaviors methodically from empirical evidence and structured hypotheses rather than speculative guessing.","Investigate our checkout timeout failure by formulating hypotheses from server logs and reproducing the root cause before attempting code fixes."]]},{"id":"skill-13","title":"Awesome Claude Code","category":"Discovery","items":[["Caveman","Communication","Compresses agent communication tokens by instructing Claude Code to converse in concise, fragmented \"caveman speak.\"","/caveman explain why my React component re-renders whenever its parent updates and how to memoize props without breaking state."],["Claude Code Infrastructure Showcase","Discovery","Implements dynamic skill selection by using lifecycle hooks to automatically detect and activate relevant skills based on active context.","Configure dynamic skill selection using lifecycle hooks and skill-rules.json so relevant guidelines activate automatically as I edit API controllers and routes."],["Cooklang skills","Writing","Allows AI coding agents to parse, create, and manage Cooklang recipe files (`.cook`) and meal plans (`.menu`).","Plan dinners for next week using my existing recipes, format them into a menu file, and generate the shopping list."],["daily.dev","Research","Fetches curated developer news feeds and community insights from the daily.dev platform directly into an agent session.","Fetch today's top developer news and trending articles on TypeScript architecture from daily.dev directly into this agent session."],["fable-mode","Planning","Configures Claude Code for autonomous multi-stage planning, sub-agent delegation, and automated self-verification loops.","/fable-mode Refactor our authentication middleware into modular stages with subagent delegation, automated test verification, and cold self-critique reviews."]]},{"id":"skill-15","title":"Claude Plugins Official","category":"Discovery","items":[["skill-creator","Writing","Guides users through creating, refining, evaluating, and benchmarking custom Claude Code agent skills with variance analysis.","I want to make a new skill for automating database migrations, so help me design, draft, and run evaluations on it."],["plugin-dev","Building","Provides developer tooling and procedural guidelines for constructing Claude Code plugins, custom commands, hooks, and MCP servers.","/plugin-dev:create-plugin Build a plugin for managing PostgreSQL schema migrations with custom slash commands, lifecycle hooks, and validation checks."],["feature-dev","Building","Orchestrates a 7-phase feature development workflow utilizing specialized subagents for code exploration, architectural design, and implementation review.","/feature-dev Add user authentication with OAuth and role-based permissions using specialized subagents for exploration, architecture, and code review."],["code-review","Review","Performs multi-agent automated code reviews on git pull requests, generating prioritized issues scored by confidence.","/code-review Run automated multi-agent code review on this pull request to identify high-confidence bugs and convention issues."],["commit-commands","Writing","Streamlines routine git repository workflows via dedicated commands for drafting commit messages (`/commit`), pushing PRs (`/commit-push-pr`), and pruning stale branches (`/clean_gone`).","/commit-push-pr Stage our local changes, write a conventional commit message, push this branch, and create a GitHub pull request."]]},{"id":"skill-17","title":"Awesome Agent Skills","category":"Discovery","items":[["anthropics/docx","Writing","Enables coding agents to inspect, create, edit, and format Microsoft Word (`.docx`) documents.","Create a formatted project specification Word document (.docx) with a table of contents, executive summary, and custom header styling."],["anthropics/doc-coauthoring","Writing","Structures multi-turn collaborative document authoring, drafting, and iterative editorial reviews.","Help me co-author an engineering RFC for our caching architecture through iterative context gathering, outline refinement, and reader testing."],["anthropics/pptx","Writing","Generates, updates, and formats Microsoft PowerPoint presentation slide decks (`.pptx`).","Generate a ten-slide widescreen 16:9 .pptx pitch deck covering our quarterly product roadmap, with speaker notes on every slide."],["anthropics/xlsx","Writing","Creates, edits, and analyzes Microsoft Excel spreadsheets (`.xlsx`) including cell formulas, sheets, and tabular formatting.","Clean this raw customer orders CSV, convert it into an Excel spreadsheet (.xlsx), and calculate monthly revenue formulas across sheets."],["anthropics/pdf","Writing","Extracts text and tables, parses structured forms, and compiles printable PDF documents.","Pull every financial summary table out of quarterly-report.pdf and merge its first five pages with our signed appendix PDF."]]},{"id":"skill-18","title":"Claude Skills Collection","category":"Discovery","items":[["skill-security-auditor","Review","Scans and audits AI agent skills for malicious execution patterns, subprocess calls, network data exfiltration, prompt injections, and supply-chain risks before installation, returning a strict PASS, WARN, or FAIL verdict.","Audit the candidate agent skill at ./custom-skill for prompt injection vectors, malicious execution patterns, and data exfiltration before installation."],["pw","Testing","Provides a comprehensive end-to-end Playwright testing toolkit to generate tests, diagnose and repair flaky test failures, migrate suites from Cypress or Selenium, and integrate with BrowserStack and TestRail.","/pw:fix Diagnose and fix intermittent timeout failures in our checkout flow Playwright tests by analyzing test traces and updating locators."],["self-improving-agent","Writing","Analyzes and curates auto-memory entries across agent sessions, promoting recurring patterns and debugging insights into durable project rules (`CLAUDE.md`) or extracting them into reusable custom skills.","/si:memory-review Analyze our project MEMORY.md to identify recurring debugging insights and promote proven patterns into permanent CLAUDE.md rules."],["karpathy-coder","Review","Enforces Andrej Karpathy's four core coding principles—surfacing assumptions, radical simplicity, surgical diffs, and verifiable success criteria—using automated complexity checkers, diff linters, and review hooks.","/karpathy-check Review my staged changes against the four principles to verify minimal diff noise, simple architecture, and test verification."],["grill-me","Planning","Relentlessly interviews the user one question at a time to stress-test architectural plans and designs, exploring the codebase first before asking questions and systematically resolving decision dependencies.","/cs:grill-me Grill me one question at a time to stress-test our caching architecture proposal and resolve design decision dependencies."]]}]};

  // ---------------------------------------------------------------- config
  const STORAGE_KEY = 'topskills-game-progress';
  // Kept apart from STORAGE_KEY so the progress save is never rewritten or cleared by these.
  const TARGET_KEY = 'topskills-game-target'; // raw card id
  const HOWTO_KEY = 'topskills-game-howto-seen'; // '1' once the How to Play overlay is closed
  const ZONE_TOAST_MS = 3200;
  const XP_PER_PICKUP = 10;
  const XP_PER_CARD = 50;
  const PICKUP_RADIUS = 0.8;
  // Orbs whose home spot is within this distance get pulled toward the player;
  // never more than SPAWN_CLEARANCE, so the spawn point can't attract anything.
  const MAGNET_RADIUS = 1.5;
  const SPAWN_CLEARANCE = 1.5;
  const COMBO_WINDOW = 5; // seconds

  const ZONE_SIZE = 44; // Workflow needs room for its 81-orb and 27-orb clusters side by side
  const ROAD = 6;
  const ZONE_COLS = 3;
  const ZONE_ROWS = 2;
  const PITCH = ZONE_SIZE + ROAD;
  const BOUNDS = {
    x: (PITCH * (ZONE_COLS - 1)) / 2 + ZONE_SIZE / 2 + 3,
    z: (PITCH * (ZONE_ROWS - 1)) / 2 + ZONE_SIZE / 2 + 3,
  };
  const ORB_SPACING = 1.05; // Vogel-spiral constant; neighbours end up ~1.6+ apart
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const PREFERRED_SPAWN = { x: 0, z: 0 }; // crossroads between the two middle zones

  const MOVE_SPEED = 6;
  const DASH_MULTIPLIER = 1.5;
  const ACCEL = 12;
  const DECEL = 9;

  const CHAPTER_STYLE = {
    Workflow: { orb: '#f2a93b', tint: '#f1e2bb', ink: '#8a5a12' },
    Quality: { orb: '#36b06a', tint: '#d3e6d1', ink: '#1f6b3e' },
    Design: { orb: '#e0527a', tint: '#f2d3da', ink: '#8e2643' },
    Efficiency: { orb: '#2f95d0', tint: '#cfe2ee', ink: '#18577d' },
    Knowledge: { orb: '#8a63d6', tint: '#e0d7f0', ink: '#4c3290' },
    Discovery: { orb: '#e26d2e', tint: '#f3dac8', ink: '#8a3a10' },
  };

  // ---------------------------------------------------------------- data
  const CARDS = DATA.cards.map((card) => ({
    id: card.id,
    title: card.title,
    chapter: card.category,
    items: card.items.map(([name, category, fn, prompt]) => ({
      id: card.id + ':' + name,
      name,
      category,
      fn,
      prompt,
      cardId: card.id,
    })),
  }));
  const ITEMS = CARDS.flatMap((c) => c.items);
  const TOTAL_ITEMS = ITEMS.length;
  const TOTAL_XP = TOTAL_ITEMS * XP_PER_PICKUP + CARDS.length * XP_PER_CARD;

  // ---------------------------------------------------------------- XP and levels
  // XP to go from level n to n+1 is 100 + 50*(n-1); this is the cumulative sum.
  function xpThreshold(level) {
    const n = level - 1;
    return 100 * n + 25 * n * (n - 1);
  }
  function levelFromXp(xp) {
    let level = 1;
    while (xpThreshold(level + 1) <= xp) level++;
    return level;
  }
  const MAX_LEVEL = levelFromXp(TOTAL_XP);

  // ---------------------------------------------------------------- progress
  function createProgress(cards) {
    const cardById = new Map(cards.map((c) => [c.id, c]));
    const itemById = new Map();
    cards.forEach((c) => c.items.forEach((it) => itemById.set(it.id, it)));
    const collected = new Set();
    let xp = 0;

    function cardCount(cardId) {
      return cardById.get(cardId).items.reduce((n, it) => n + (collected.has(it.id) ? 1 : 0), 0);
    }
    function isCardComplete(cardId) {
      const card = cardById.get(cardId);
      return cardCount(cardId) === card.items.length;
    }
    function recomputeXp() {
      xp = collected.size * XP_PER_PICKUP;
      cards.forEach((c) => { if (isCardComplete(c.id)) xp += XP_PER_CARD; });
    }

    return {
      get collectedCount() { return collected.size; },
      get xp() { return xp; },
      get level() { return levelFromXp(xp); },
      has: (id) => collected.has(id),
      item: (id) => itemById.get(id),
      cardCount,
      isCardComplete,
      collect(id) {
        const item = itemById.get(id);
        if (!item || collected.has(id)) return null;
        const levelBefore = levelFromXp(xp);
        collected.add(id);
        let xpGained = XP_PER_PICKUP;
        const cardCompleted = isCardComplete(item.cardId);
        if (cardCompleted) xpGained += XP_PER_CARD;
        xp += xpGained;
        const levelAfter = levelFromXp(xp);
        return {
          item,
          card: cardById.get(item.cardId),
          xpGained,
          cardCompleted,
          levelBefore,
          levelAfter,
          leveledUp: levelAfter > levelBefore,
          won: collected.size === itemById.size,
        };
      },
      // XP and level are derived from `collected`, so a tampered or stale save stays consistent.
      load(raw) {
        collected.clear();
        if (raw && Array.isArray(raw.collected)) {
          raw.collected.forEach((id) => { if (itemById.has(id)) collected.add(id); });
        }
        recomputeXp();
      },
      reset() {
        collected.clear();
        xp = 0;
      },
      serialize() {
        return { collected: Array.from(collected), xp, level: levelFromXp(xp) };
      },
    };
  }

  // ---------------------------------------------------------------- layout
  function clusterRadius(count) {
    return ORB_SPACING * Math.sqrt(count) + 1.5;
  }

  // Nearest spot to the zone centre (scanning outward in rings) where the
  // cluster circle fits inside the zone and clear of clusters already placed.
  function findClusterSpot(zone, r, placed) {
    const limit = zone.half - 0.5;
    for (let d = 0; d <= zone.half * 1.5; d += 0.5) {
      const steps = d === 0 ? 1 : Math.ceil((2 * Math.PI * d) / 0.5);
      for (let s = 0; s < steps; s++) {
        const a = -Math.PI / 2 + (s / steps) * Math.PI * 2;
        const x = zone.cx + Math.cos(a) * d;
        const z = zone.cz + Math.sin(a) * d;
        if (Math.abs(x - zone.cx) + r > limit || Math.abs(z - zone.cz) + r > limit) continue;
        if (placed.every((p) => Math.hypot(p.x - x, p.z - z) >= p.r + r)) return { x, z };
      }
    }
    throw new Error('Layout: no room for a cluster in zone ' + zone.name);
  }

  function buildLayout(cards, chapters) {
    const zones = chapters.map((name, i) => {
      const col = i % ZONE_COLS;
      const row = Math.floor(i / ZONE_COLS);
      return {
        name,
        index: i,
        cx: (col - (ZONE_COLS - 1) / 2) * PITCH,
        cz: (row - (ZONE_ROWS - 1) / 2) * PITCH,
        half: ZONE_SIZE / 2,
      };
    });
    const clusters = [];
    const orbs = [];
    zones.forEach((zone) => {
      const zoneCards = cards
        .filter((c) => c.chapter === zone.name)
        .sort((a, b) => b.items.length - a.items.length);
      const placed = [];
      zoneCards.forEach((card) => {
        const r = clusterRadius(card.items.length);
        const spot = findClusterSpot(zone, r, placed);
        placed.push({ x: spot.x, z: spot.z, r });
        const cluster = { card, zone, x: spot.x, z: spot.z, r };
        clusters.push(cluster);
        card.items.forEach((item, k) => {
          const rr = ORB_SPACING * Math.sqrt(k + 0.5);
          const th = k * GOLDEN_ANGLE;
          orbs.push({
            item,
            card,
            zone,
            cluster,
            x: spot.x + Math.cos(th) * rr,
            z: spot.z + Math.sin(th) * rr,
          });
        });
      });
    });
    return { zones, clusters, orbs, bounds: BOUNDS };
  }

  function minOrbDistance(p, orbs) {
    let best = Infinity;
    orbs.forEach((o) => { best = Math.min(best, Math.hypot(o.x - p.x, o.z - p.z)); });
    return best;
  }

  // Spawn rule: at least SPAWN_CLEARANCE from every orb. Use the crossroads
  // if it qualifies, otherwise the clearest point on a coarse grid.
  function chooseSpawn(orbs) {
    let best = { x: PREFERRED_SPAWN.x, z: PREFERRED_SPAWN.z, minDist: minOrbDistance(PREFERRED_SPAWN, orbs) };
    if (best.minDist >= SPAWN_CLEARANCE) return best;
    for (let x = -BOUNDS.x + 2; x <= BOUNDS.x - 2; x += 1) {
      for (let z = -BOUNDS.z + 2; z <= BOUNDS.z - 2; z += 1) {
        const d = minOrbDistance({ x, z }, orbs);
        if (d > best.minDist) best = { x, z, minDist: d };
      }
    }
    return best;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- public surface
  const gameState = { collectedCount: 0, xp: 0, level: 1, totalItems: TOTAL_ITEMS };
  root.__gameState = gameState;
  root.TopSkillsGame = {
    DATA,
    CARDS,
    ITEMS,
    TOTAL_ITEMS,
    TOTAL_XP,
    MAX_LEVEL,
    STORAGE_KEY,
    TARGET_KEY,
    HOWTO_KEY,
    PICKUP_RADIUS,
    MAGNET_RADIUS,
    SPAWN_CLEARANCE,
    COMBO_WINDOW,
    BOUNDS,
    xpThreshold,
    levelFromXp,
    createProgress,
    buildLayout,
    chooseSpawn,
    minOrbDistance,
  };

  if (typeof document === 'undefined') return;

  // ================================================================ browser
  function showError(message, err) {
    const detail = err ? String(err && err.message ? err.message : err) : '';
    if (root.__showGameError) root.__showGameError(message, detail);
    else alert(message + (detail ? '\n' + detail : ''));
    console.error('[TopSkills]', message, err || '');
  }

  async function boot() {
    let THREE;
    try {
      THREE = await import('three');
    } catch (err) {
      showError('three.js could not be loaded from the CDN (unpkg.com, three@0.160.0). Check your connection and try again.', err);
      return;
    }
    try {
      startGame(THREE);
      root.__gameBooted = true;
      document.getElementById('error-panel').hidden = true; // in case the slow-load watchdog fired first
    } catch (err) {
      showError('The game failed to start. Your browser may not support WebGL.', err);
    }
  }

  function startGame(THREE) {
    const $ = (id) => document.getElementById(id);
    const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    const PAPER = '#fafaf7';
    const INK = '#1a1a18';

    const layout = buildLayout(CARDS, DATA.chapters);
    const spawn = chooseSpawn(layout.orbs);
    if (spawn.minDist < SPAWN_CLEARANCE) console.error('[TopSkills] spawn rule violated', spawn);
    console.info('[TopSkills] spawn (' + spawn.x + ', ' + spawn.z + '), nearest orb ' + spawn.minDist.toFixed(2) + ' units');

    const progress = createProgress(CARDS);
    progress.load(readStorage());

    // ------------------------------------------------------------ renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    renderer.setSize(root.innerWidth, root.innerHeight);
    $('stage').appendChild(renderer.domElement);

    const SKY = '#e9e5d6';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 40, 100);

    const camera = new THREE.PerspectiveCamera(55, root.innerWidth / root.innerHeight, 0.1, 260);
    const CAM_OFFSET = new THREE.Vector3(0, 6.2, 8.8);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b29c, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(20, 40, 15);
    scene.add(sun);

    // ------------------------------------------------------------ canvas helpers
    function canvasTexture(canvas, pixelated) {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      if (pixelated) {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
      } else {
        tex.anisotropy = 4;
      }
      return tex;
    }

    function textCanvas(text, { size = 32, weight = 700, fg = INK, bg = PAPER, border = 0, padX = 14, padY = 8, minText = '' }) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const font = weight + ' ' + size + 'px ' + FONT;
      ctx.font = font;
      const w = Math.ceil(Math.max(ctx.measureText(text).width, ctx.measureText(minText).width)) + padX * 2;
      const h = size + padY * 2;
      canvas.width = w;
      canvas.height = h;
      const draw = (t, colors) => {
        const c = colors || { fg, bg };
        ctx.clearRect(0, 0, w, h);
        if (c.bg) { ctx.fillStyle = c.bg; ctx.fillRect(0, 0, w, h); }
        if (border) { ctx.lineWidth = border; ctx.strokeStyle = INK; ctx.strokeRect(border / 2, border / 2, w - border, h - border); }
        ctx.font = font;
        ctx.fillStyle = c.fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, w / 2, h / 2 + size * 0.04);
      };
      draw(text);
      return { canvas, aspect: w / h, draw };
    }

    // ------------------------------------------------------------ ground + zones
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({ color: '#d6d0bc' })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const play = new THREE.Mesh(
      new THREE.PlaneGeometry(BOUNDS.x * 2, BOUNDS.z * 2),
      new THREE.MeshBasicMaterial({ color: '#ebe7d9' })
    );
    play.rotation.x = -Math.PI / 2;
    play.position.y = 0.005;
    scene.add(play);

    function rectLine(cx, cz, hx, hz, y, color) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(cx - hx, y, cz - hz),
        new THREE.Vector3(cx + hx, y, cz - hz),
        new THREE.Vector3(cx + hx, y, cz + hz),
        new THREE.Vector3(cx - hx, y, cz + hz),
      ]);
      return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color }));
    }
    scene.add(rectLine(0, 0, BOUNDS.x, BOUNDS.z, 0.03, INK));

    const chapterTotals = {};
    DATA.chapters.forEach((ch) => {
      chapterTotals[ch] = CARDS.filter((c) => c.chapter === ch).reduce((n, c) => n + c.items.length, 0);
    });

    const chapterSigns = [];
    layout.zones.forEach((zone) => {
      const style = CHAPTER_STYLE[zone.name] || CHAPTER_STYLE.Workflow;
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(ZONE_SIZE, ZONE_SIZE),
        new THREE.MeshBasicMaterial({ color: style.tint })
      );
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(zone.cx, 0.01, zone.cz);
      scene.add(tile);
      scene.add(rectLine(zone.cx, zone.cz, zone.half, zone.half, 0.02, INK));

      // Large floating chapter sign.
      const cardsInZone = CARDS.filter((c) => c.chapter === zone.name).length;
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 300;
      const g = c.getContext('2d');
      g.fillStyle = PAPER;
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = style.orb;
      g.fillRect(0, 0, c.width, 26);
      g.lineWidth = 14;
      g.strokeStyle = INK;
      g.strokeRect(7, 7, c.width - 14, c.height - 14);
      g.fillStyle = INK;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = '800 128px ' + FONT;
      g.fillText(zone.name.toUpperCase(), c.width / 2, 138);
      g.font = '600 44px ' + FONT;
      g.fillStyle = '#44443f';
      g.fillText('Chapter ' + (zone.index + 1) + '  ·  ' + cardsInZone + (cardsInZone === 1 ? ' card' : ' cards') + '  ·  ' + chapterTotals[zone.name] + ' skills', c.width / 2, 236);
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 12 * (300 / 1024)),
        new THREE.MeshBasicMaterial({ map: canvasTexture(c), side: THREE.DoubleSide })
      );
      sign.position.set(zone.cx, 7.5, zone.cz);
      scene.add(sign);
      chapterSigns.push({ mesh: sign, baseY: 7.5, phase: zone.index });
    });

    // Spawn marker.
    const spawnRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.05, 40),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.35 })
    );
    spawnRing.rotation.x = -Math.PI / 2;
    spawnRing.position.set(spawn.x, 0.03, spawn.z);
    scene.add(spawnRing);

    // Decorative trees and rocks (visual only, no collision), kept out of clusters.
    (function decorate() {
      const spots = [];
      layout.zones.forEach((zone) => {
        const rand = mulberry32(1009 * (zone.index + 1));
        let tries = 0;
        let made = 0;
        while (made < 22 && tries < 600) {
          tries++;
          const x = zone.cx + (rand() * 2 - 1) * (zone.half - 1.2);
          const z = zone.cz + (rand() * 2 - 1) * (zone.half - 1.2);
          const blocked = layout.clusters.some((cl) => Math.hypot(cl.x - x, cl.z - z) < cl.r + 0.8)
            || spots.some((s) => Math.hypot(s.x - x, s.z - z) < 2.2)
            || (Math.abs(x - zone.cx) < 6.5 && Math.abs(z - zone.cz) < 2); // under the chapter sign
          if (blocked) continue;
          spots.push({ x, z, s: 0.75 + rand() * 0.6, rock: rand() < 0.3, rot: rand() * Math.PI });
          made++;
        }
      });
      const trees = spots.filter((s) => !s.rock);
      const rocks = spots.filter((s) => s.rock);
      const trunkGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.7, 6);
      trunkGeo.translate(0, 0.35, 0);
      const crownGeo = new THREE.ConeGeometry(0.6, 1.5, 7);
      crownGeo.translate(0, 1.35, 0);
      const rockGeo = new THREE.DodecahedronGeometry(0.4, 0);
      rockGeo.translate(0, 0.2, 0);
      const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: '#6b4a2b' }), trees.length);
      const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshLambertMaterial({ color: '#5f8a55', flatShading: true }), trees.length);
      const rockMesh = new THREE.InstancedMesh(rockGeo, new THREE.MeshLambertMaterial({ color: '#a39f92', flatShading: true }), rocks.length);
      const m = new THREE.Object3D();
      trees.forEach((t, i) => {
        m.position.set(t.x, 0, t.z);
        m.rotation.set(0, t.rot, 0);
        m.scale.setScalar(t.s);
        m.updateMatrix();
        trunks.setMatrixAt(i, m.matrix);
        crowns.setMatrixAt(i, m.matrix);
      });
      rocks.forEach((r, i) => {
        m.position.set(r.x, 0, r.z);
        m.rotation.set(r.rot, r.rot * 2, 0);
        m.scale.set(r.s, r.s * 0.7, r.s);
        m.updateMatrix();
        rockMesh.setMatrixAt(i, m.matrix);
      });
      scene.add(trunks, crowns, rockMesh);
    })();

    // ------------------------------------------------------------ card signs
    const cardSigns = new Map();
    layout.clusters.forEach((cl) => {
      const total = cl.card.items.length;
      const label = (n) => cl.card.title + '   ' + n + '/' + total + (n === total ? '  ✓' : '');
      const tc = textCanvas(label(total), { size: 40, weight: 800, border: 5, padX: 18, padY: 10 });
      const tex = canvasTexture(tc.canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
      const h = 0.62;
      sprite.scale.set(h * tc.aspect, h, 1);
      sprite.position.set(cl.x, 3.0, cl.z);
      scene.add(sprite);
      const update = () => {
        const n = progress.cardCount(cl.card.id);
        tc.draw(label(n), n === total ? { fg: PAPER, bg: INK } : null);
        tex.needsUpdate = true;
      };
      update();
      cardSigns.set(cl.card.id, { update });
    });

    // ------------------------------------------------------------ orbs
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    {
      const g = glowCanvas.getContext('2d');
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
    }
    const glowTex = canvasTexture(glowCanvas);
    const orbGeo = new THREE.SphereGeometry(0.26, 20, 14);
    const coreGeo = new THREE.SphereGeometry(0.11, 12, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const orbMats = {};
    const glowMats = {};
    Object.keys(CHAPTER_STYLE).forEach((ch) => {
      orbMats[ch] = new THREE.MeshBasicMaterial({ color: CHAPTER_STYLE[ch].orb, transparent: true, opacity: 0.88 });
      glowMats[ch] = new THREE.SpriteMaterial({ map: glowTex, color: CHAPTER_STYLE[ch].orb, transparent: true, opacity: 0.75, depthWrite: false });
    });

    const LABEL_FULL = 6;
    const LABEL_GONE = 11;
    const orbs = layout.orbs.map((o, i) => {
      const ch = o.zone.name in CHAPTER_STYLE ? o.zone.name : 'Workflow';
      const group = new THREE.Group();
      group.position.set(o.x, 0.95, o.z);
      const ball = new THREE.Mesh(orbGeo, orbMats[ch]);
      const core = new THREE.Mesh(coreGeo, coreMat);
      const glow = new THREE.Sprite(glowMats[ch]);
      glow.scale.setScalar(1.2);
      const tc = textCanvas(o.item.name, { size: 30, weight: 700, fg: INK, bg: 'rgba(250,250,247,0.92)', padX: 10, padY: 6 });
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(tc.canvas), transparent: true, depthWrite: false }));
      const lh = 0.26;
      label.scale.set(lh * tc.aspect, lh, 1);
      label.position.y = 0.58;
      group.add(glow, ball, core, label);
      const collected = progress.has(o.item.id);
      if (!collected) scene.add(group);
      return { data: o, group, glow, label, phase: (i * 2.399) % (Math.PI * 2), collected, color: CHAPTER_STYLE[ch].orb, pull: 0 };
    });

    // ------------------------------------------------------------ beacon
    // A light pillar on the nearest uncollected orb, ignoring fog so it reads from across a zone.
    const BEACON_HEIGHT = 18;
    const beaconCanvas = document.createElement('canvas');
    beaconCanvas.width = 4;
    beaconCanvas.height = 128;
    {
      const g = beaconCanvas.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.55, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 4, 128);
    }
    const beaconTex = canvasTexture(beaconCanvas);
    const beaconTube = (radius, opacity) => new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, BEACON_HEIGHT, 20, 1, true).translate(0, BEACON_HEIGHT / 2, 0),
      new THREE.MeshBasicMaterial({ map: beaconTex, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false })
    );
    const beaconCore = beaconTube(0.16, 0.95);
    const beaconHalo = beaconTube(0.42, 0.45);
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.6, 32),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false })
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.04;
    const beacon = new THREE.Group();
    beacon.add(beaconHalo, beaconCore, beaconRing);
    beacon.visible = false;
    scene.add(beacon);
    let beaconTarget = null;

    // ------------------------------------------------------------ player sprite
    const ADV = {
      hat: '#2f6b4f', band: '#d9a62e', skin: '#f1c39a', cheek: '#e79c7c', hair: '#5a3a22',
      scarf: '#c8412f', tunic: '#2d5b9a', tunicDark: '#22477a', belt: '#5a3a22', gold: '#e8bf4a',
      pack: '#8a5a2b', packLight: '#a8743d', pants: '#3b3226', backPants: '#2c251c', boot: '#2a1e14',
    };
    function drawAdventurer(pose) {
      const W = 32;
      const H = 48;
      const S = 4;
      const src = document.createElement('canvas');
      src.width = W;
      src.height = H;
      const g = src.getContext('2d');
      const px = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
      const b = pose.bob;
      const leg = (x, dx, lift, pants) => {
        px(x + dx, 33, 4, 10 - lift, pants);
        px(x + dx, 43 - lift, 6, 4, ADV.boot);
      };
      // Legs (back leg first so the front one overlaps).
      leg(12, pose.legB, pose.liftB || 0, ADV.backPants);
      leg(17, pose.legA, pose.liftA || 0, ADV.pants);
      // Backpack and scarf tail behind the body.
      px(5, 22 + b, 6, 10, ADV.pack);
      px(6, 23 + b, 4, 2, ADV.packLight);
      px(5 - pose.scarf, 20 + b, 6, 2, ADV.scarf);
      px(3 - pose.scarf * 2, 22 + b, 4, 2, ADV.scarf);
      // Body.
      px(10, 22 + b, 12, 11 - b, ADV.tunic);
      px(10, 31 + b, 12, 2 - b, ADV.tunicDark);
      px(10, 28 + b, 12, 2, ADV.belt);
      px(17, 28 + b, 2, 2, ADV.gold);
      px(12, 22 + b, 2, 6, ADV.belt);
      // Scarf, head, hat.
      px(10, 19 + b, 12, 3, ADV.scarf);
      px(12, 11 + b, 9, 8, ADV.skin);
      px(21, 14 + b, 1, 2, ADV.skin);
      px(10, 11 + b, 3, 6, ADV.hair);
      px(18, 13 + b, 2, 2, INK);
      px(16, 16 + b, 2, 1, ADV.cheek);
      px(10, 3 + b, 12, 6, ADV.hat);
      px(10, 7 + b, 12, 1, ADV.band);
      px(7, 9 + b, 19, 2, ADV.hat);
      // Front arm swings with the stride.
      px(17 + pose.arm, 23 + b, 3, 7, ADV.tunicDark);
      px(17 + pose.arm, 30 + b, 3, 2, ADV.skin);
      // 1px ink outline around the silhouette.
      const img = g.getImageData(0, 0, W, H);
      const a = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : img.data[(y * W + x) * 4 + 3]);
      const out = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (a(x, y) === 0 && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) out.push([x, y]);
        }
      }
      out.forEach(([x, y]) => px(x, y, 1, 1, INK));
      const dst = document.createElement('canvas');
      dst.width = W * S;
      dst.height = H * S;
      const d = dst.getContext('2d');
      d.imageSmoothingEnabled = false;
      d.drawImage(src, 0, 0, W * S, H * S);
      return canvasTexture(dst, true);
    }
    const FRAMES = {
      idle: [
        drawAdventurer({ bob: 0, legA: 0, legB: 0, arm: 0, scarf: 0 }),
        drawAdventurer({ bob: 1, legA: 0, legB: 0, arm: 0, scarf: 1 }),
      ],
      walk: [
        drawAdventurer({ bob: 0, legA: 2, legB: -2, arm: -2, liftB: 1, scarf: 1 }),
        drawAdventurer({ bob: -1, legA: 0, legB: 0, arm: 0, scarf: 0 }),
        drawAdventurer({ bob: 0, legA: -2, legB: 2, arm: 2, liftA: 1, scarf: 1 }),
        drawAdventurer({ bob: -1, legA: 0, legB: 0, arm: 0, scarf: 0 }),
      ],
    };

    const player = new THREE.Group();
    const spriteGeo = new THREE.PlaneGeometry(0.8, 1.2);
    spriteGeo.translate(0, 0.6, 0);
    const spriteMat = new THREE.MeshBasicMaterial({ map: FRAMES.idle[0], alphaTest: 0.5, side: THREE.DoubleSide });
    const sprite = new THREE.Mesh(spriteGeo, spriteMat);
    player.add(sprite);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 24),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.22, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    player.add(shadow);
    scene.add(player);

    const motion = { x: spawn.x, z: spawn.z, vx: 0, vz: 0, facing: 1, animPhase: 0, idleClock: 0, walkAmt: 0, lean: 0 };
    player.position.set(motion.x, 0, motion.z);
    camera.position.set(motion.x + CAM_OFFSET.x, CAM_OFFSET.y, motion.z + CAM_OFFSET.z);
    const camLook = new THREE.Vector3(motion.x, 0.9, motion.z);
    camera.lookAt(camLook);

    // ------------------------------------------------------------ particles
    const bursts = [];
    function burst(x, y, z, color, count, speed, life, size) {
      const pos = new Float32Array(count * 3);
      const vel = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2;
        const up = Math.random() * 0.9 + 0.1;
        const s = speed * (0.5 + Math.random() * 0.7);
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
        vel[i * 3] = Math.cos(th) * Math.sqrt(1 - up * up) * s;
        vel[i * 3 + 1] = up * s;
        vel[i * 3 + 2] = Math.sin(th) * Math.sqrt(1 - up * up) * s;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color, size, transparent: true, depthWrite: false });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      bursts.push({ points, vel, age: 0, life, gravity: speed > 2 ? 7 : 1.5 });
    }
    const rings = [];
    function shockRing(x, z, color) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.42, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.05, z);
      scene.add(ring);
      rings.push({ ring, age: 0, life: 0.45 });
    }
    // Dash trail: a fixed pool of glow puffs dropped behind the player, recycled oldest-first.
    const TRAIL_LIFE = 0.38;
    const TRAIL_COLORS = ['#f2a93b', '#fff1c9', '#f2a93b', '#c8412f'];
    const trail = [];
    for (let i = 0; i < 36; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: TRAIL_COLORS[i % TRAIL_COLORS.length], transparent: true, depthWrite: false,
      }));
      s.visible = false;
      scene.add(s);
      trail.push({ sprite: s, age: TRAIL_LIFE, size: 0 });
    }
    let trailNext = 0;
    function emitTrail(x, z, vx, vz) {
      const t = trail[trailNext];
      trailNext = (trailNext + 1) % trail.length;
      const sp = Math.hypot(vx, vz) || 1;
      const back = 0.28 + Math.random() * 0.12;
      t.sprite.position.set(
        x - (vx / sp) * back + (Math.random() - 0.5) * 0.25,
        0.25 + Math.random() * 0.75,
        z - (vz / sp) * back + (Math.random() - 0.5) * 0.25
      );
      t.size = 0.45 + Math.random() * 0.3;
      t.age = 0;
      t.sprite.visible = true;
    }
    function updateTrail(dt) {
      trail.forEach((t) => {
        if (t.age >= TRAIL_LIFE) return;
        t.age += dt;
        const f = Math.min(1, t.age / TRAIL_LIFE);
        t.sprite.visible = f < 1;
        t.sprite.scale.setScalar(t.size * (1 - f * 0.7));
        t.sprite.material.opacity = 0.85 * (1 - f);
        t.sprite.position.y += dt * 0.4;
      });
    }
    function updateEffects(dt) {
      updateTrail(dt);
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.age += dt;
        const attr = b.points.geometry.attributes.position;
        const p = attr.array;
        for (let k = 0; k < p.length; k += 3) {
          b.vel[k + 1] -= b.gravity * dt;
          p[k] += b.vel[k] * dt;
          p[k + 1] = Math.max(0.03, p[k + 1] + b.vel[k + 1] * dt);
          p[k + 2] += b.vel[k + 2] * dt;
        }
        attr.needsUpdate = true;
        b.points.material.opacity = Math.max(0, 1 - b.age / b.life);
        if (b.age >= b.life) {
          scene.remove(b.points);
          b.points.geometry.dispose();
          b.points.material.dispose();
          bursts.splice(i, 1);
        }
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.age += dt;
        const t = r.age / r.life;
        r.ring.scale.setScalar(1 + t * 4);
        r.ring.material.opacity = Math.max(0, 1 - t);
        if (r.age >= r.life) {
          scene.remove(r.ring);
          r.ring.geometry.dispose();
          r.ring.material.dispose();
          rings.splice(i, 1);
        }
      }
    }

    // ------------------------------------------------------------ audio
    const audio = { ctx: null, master: null, muted: false };
    function ensureAudio() {
      if (!audio.ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return null;
        audio.ctx = new AC();
        audio.master = audio.ctx.createGain();
        audio.master.gain.value = audio.muted ? 0 : 0.5;
        audio.master.connect(audio.ctx.destination);
      }
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return audio.ctx;
    }
    function tone(freq, delay, dur, type, vol) {
      const ctx = ensureAudio();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(audio.master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
    const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    function pickupChime(combo) {
      const f = 523.25 * Math.pow(2, PENTA[Math.min(combo - 1, PENTA.length - 1)] / 12);
      tone(f, 0, 0.4, 'sine', 0.3);
      tone(f * 2, 0.05, 0.3, 'triangle', 0.09);
    }
    function cardChime() {
      tone(659.25, 0.12, 0.4, 'triangle', 0.2);
      tone(987.77, 0.22, 0.55, 'triangle', 0.2);
    }
    function levelChime() {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone(f, 0.1 + i * 0.09, 0.55, 'triangle', 0.22));
      tone(1567.98, 0.6, 0.9, 'sine', 0.16);
    }
    const unlockAudio = () => ensureAudio();
    root.addEventListener('keydown', unlockAudio, { once: true });
    root.addEventListener('pointerdown', unlockAudio, { once: true });

    const muteBtn = $('btn-mute');
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
      muteBtn.textContent = audio.muted ? 'Sound: off' : 'Sound: on';
      muteBtn.setAttribute('aria-pressed', String(audio.muted));
      muteBtn.blur();
    });

    // ------------------------------------------------------------ input
    const KEYMAP = {
      KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    };
    const held = new Set();
    let shiftHeld = false;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') shiftHeld = true;
      const dir = KEYMAP[e.code];
      if (dir) {
        held.add(dir);
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        closePickup();
        hideConfirm();
      }
    });
    root.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') shiftHeld = false;
      const dir = KEYMAP[e.code];
      if (dir) held.delete(dir);
    });
    root.addEventListener('blur', () => { held.clear(); shiftHeld = false; });

    // Touch: joystick anywhere on the left half, dash button bottom right.
    const joy = { id: null, ox: 0, oy: 0, x: 0, z: 0, dash: false };
    const touchZone = $('touch-zone');
    const joyEl = $('joystick');
    const knob = $('joystick-knob');
    const dashBtn = $('btn-dash');
    const JOY_RADIUS = 52;
    function enableTouchUi() {
      touchZone.hidden = false;
      dashBtn.hidden = false;
      $('hint').classList.add('gone');
    }
    if (root.matchMedia && root.matchMedia('(pointer: coarse)').matches) enableTouchUi();
    root.addEventListener('touchstart', enableTouchUi, { once: true, passive: true });
    touchZone.addEventListener('pointerdown', (e) => {
      if (joy.id !== null) return;
      joy.id = e.pointerId;
      joy.ox = e.clientX;
      joy.oy = e.clientY;
      joyEl.style.left = e.clientX + 'px';
      joyEl.style.top = e.clientY + 'px';
      joyEl.hidden = false;
      knob.style.transform = '';
      touchZone.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    touchZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joy.id) return;
      let dx = e.clientX - joy.ox;
      let dy = e.clientY - joy.oy;
      const len = Math.hypot(dx, dy);
      if (len > JOY_RADIUS) { dx *= JOY_RADIUS / len; dy *= JOY_RADIUS / len; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      joy.x = dx / JOY_RADIUS;
      joy.z = dy / JOY_RADIUS;
    });
    const endJoy = (e) => {
      if (e.pointerId !== joy.id) return;
      joy.id = null;
      joy.x = joy.z = 0;
      joyEl.hidden = true;
    };
    touchZone.addEventListener('pointerup', endJoy);
    touchZone.addEventListener('pointercancel', endJoy);
    const dashOn = (e) => { joy.dash = true; dashBtn.classList.add('held'); e.preventDefault(); };
    const dashOff = () => { joy.dash = false; dashBtn.classList.remove('held'); };
    dashBtn.addEventListener('pointerdown', dashOn);
    dashBtn.addEventListener('pointerup', dashOff);
    dashBtn.addEventListener('pointercancel', dashOff);
    dashBtn.addEventListener('pointerleave', dashOff);
    dashBtn.addEventListener('contextmenu', (e) => e.preventDefault());

    function readInput() {
      let x = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0) + joy.x;
      let z = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0) + joy.z;
      const len = Math.hypot(x, z);
      if (len > 1) { x /= len; z /= len; }
      if (len < 0.12) { x = 0; z = 0; } // joystick dead zone
      return { x, z, dash: shiftHeld || joy.dash };
    }

    // ------------------------------------------------------------ HUD
    const chapterList = $('chapter-list');
    const chapterRows = {};
    const cardRows = {};
    // Each chapter name expands its cards; a card row picks (or drops) that card as the target.
    DATA.chapters.forEach((ch) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="swatch"></span><button type="button" class="name" aria-expanded="false"></button><span class="num"></span><span class="bar"><div></div></span><ul class="ch-cards" hidden></ul>';
      li.querySelector('.swatch').style.background = (CHAPTER_STYLE[ch] || CHAPTER_STYLE.Workflow).orb;
      const nameBtn = li.querySelector('.name');
      nameBtn.textContent = ch;
      nameBtn.title = 'Show ' + ch + ' cards to pick a target';
      const cardList = li.querySelector('.ch-cards');
      CARDS.filter((c) => c.chapter === ch).forEach((card) => {
        const row = document.createElement('li');
        row.innerHTML = '<button type="button" class="card-pick" aria-pressed="false"><span class="card-title"></span><span class="card-num"></span></button>';
        row.querySelector('.card-title').textContent = card.title;
        const btn = row.querySelector('.card-pick');
        btn.addEventListener('click', () => {
          setTarget(targetCardId === card.id ? null : card.id);
          btn.blur();
        });
        cardList.appendChild(row);
        cardRows[card.id] = btn;
      });
      nameBtn.addEventListener('click', () => {
        const open = cardList.hidden;
        cardList.hidden = !open;
        nameBtn.setAttribute('aria-expanded', String(open));
        nameBtn.blur();
      });
      chapterList.appendChild(li);
      chapterRows[ch] = li;
    });

    // Target card: steers the beacon to that card's orbs. Stored under TARGET_KEY as a raw card id.
    const cardById = new Map(CARDS.map((c) => [c.id, c]));
    let targetCardId = null;
    {
      const saved = readKey(TARGET_KEY);
      if (saved && cardById.has(saved) && !progress.isCardComplete(saved)) targetCardId = saved;
      else if (saved) removeKey(TARGET_KEY);
    }
    function setTarget(cardId) {
      targetCardId = cardId && cardById.has(cardId) && !progress.isCardComplete(cardId) ? cardId : null;
      if (targetCardId) writeKey(TARGET_KEY, targetCardId);
      else removeKey(TARGET_KEY);
      beaconTarget = null; // snap to the new pool's nearest orb next frame, skipping the hysteresis
      renderTarget();
      syncPickupTarget();
    }
    $('btn-target-clear').addEventListener('click', (e) => { setTarget(null); e.currentTarget.blur(); });
    const xpFill = $('xp-fill');
    const xpBar = $('xp-bar');

    function xpFraction(xp, level) {
      const lo = xpThreshold(level);
      const hi = level >= MAX_LEVEL ? TOTAL_XP : xpThreshold(level + 1);
      return hi > lo ? Math.min(1, (xp - lo) / (hi - lo)) : 1;
    }
    function setFill(frac, animate) {
      if (!animate) xpFill.classList.add('no-anim');
      xpFill.style.width = (frac * 100).toFixed(2) + '%';
      xpFill.classList.toggle('empty', frac <= 0);
      if (!animate) {
        void xpFill.offsetWidth;
        xpFill.classList.remove('no-anim');
      }
    }
    let fillTimer = 0;
    function renderHud(opts) {
      const xp = progress.xp;
      const level = progress.level;
      const n = progress.collectedCount;
      $('hud-level').textContent = String(level);
      $('hud-count').textContent = n + '/' + TOTAL_ITEMS;
      $('hud-xp-text').textContent = level >= MAX_LEVEL
        ? xp + ' XP · max level'
        : (xp - xpThreshold(level)) + ' / ' + (xpThreshold(level + 1) - xpThreshold(level)) + ' XP to level ' + (level + 1);
      const frac = xpFraction(xp, level);
      xpBar.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
      clearTimeout(fillTimer);
      if (opts && opts.levelUp) {
        // Fill to the end of the old level, then roll over into the new one.
        setFill(1, true);
        fillTimer = setTimeout(() => { setFill(0, false); setFill(frac, true); }, 650);
      } else {
        setFill(frac, !(opts && opts.instant));
      }
      DATA.chapters.forEach((ch) => {
        const got = CARDS.filter((c) => c.chapter === ch).reduce((s, c) => s + progress.cardCount(c.id), 0);
        const li = chapterRows[ch];
        li.querySelector('.num').textContent = got + '/' + chapterTotals[ch];
        li.querySelector('.bar > div').style.width = ((got / chapterTotals[ch]) * 100).toFixed(1) + '%';
        li.classList.toggle('done', got === chapterTotals[ch]);
      });
      renderTarget();
      gameState.collectedCount = n;
      gameState.xp = xp;
      gameState.level = level;
    }

    function renderTarget() {
      CARDS.forEach((card) => {
        const btn = cardRows[card.id];
        const got = progress.cardCount(card.id);
        const done = got === card.items.length;
        btn.querySelector('.card-num').textContent = done ? '✓' : got + '/' + card.items.length;
        btn.disabled = done;
        btn.setAttribute('aria-pressed', String(card.id === targetCardId));
        btn.title = done ? card.title + ' is complete' : card.id === targetCardId ? 'Clear target' : 'Target this card';
      });
      const box = $('hud-target');
      if (!targetCardId) { box.hidden = true; return; }
      const card = cardById.get(targetCardId);
      const got = progress.cardCount(card.id);
      $('hud-target-name').textContent = card.title;
      $('hud-target-count').textContent = got + '/' + card.items.length;
      $('hud-target-fill').style.width = ((got / card.items.length) * 100).toFixed(1) + '%';
      box.hidden = false;
    }

    // Pickup panel.
    const panel = $('pickup-panel');
    const pickupTargetBtn = $('pickup-target');
    let pickupCardId = null;
    function syncPickupTarget() {
      const show = !!pickupCardId && !progress.isCardComplete(pickupCardId);
      pickupTargetBtn.hidden = !show;
      if (!show) return;
      const on = pickupCardId === targetCardId;
      pickupTargetBtn.textContent = on ? 'Targeted ✓ · clear target' : 'Target this card';
      pickupTargetBtn.setAttribute('aria-pressed', String(on));
    }
    pickupTargetBtn.addEventListener('click', () => {
      setTarget(pickupCardId === targetCardId ? null : pickupCardId);
      pickupTargetBtn.blur();
    });
    function showPickup(result) {
      const { item, card } = result;
      $('pickup-kicker').textContent = 'Skill collected · +' + result.xpGained + ' XP' + (result.cardCompleted ? ' · card complete!' : '');
      $('pickup-name').textContent = item.name;
      $('pickup-meta').textContent = 'Card: ' + card.title + ' · ' + card.chapter + ' chapter' + (item.category ? ' · ' + item.category : '');
      $('pickup-function').textContent = item.fn;
      $('pickup-prompt').textContent = item.prompt;
      pickupCardId = card.id;
      syncPickupTarget();
      panel.hidden = false;
      panel.scrollTop = 0;
      panel.classList.remove('pop');
      void panel.offsetWidth;
      panel.classList.add('pop');
    }
    function closePickup() { panel.hidden = true; }
    $('pickup-close').addEventListener('click', closePickup);
    $('pickup-x').addEventListener('click', closePickup);

    // Toast.
    let toastTimer = 0;
    function toast(text) {
      const el = $('toast');
      el.textContent = text;
      el.hidden = false;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
    }

    // Zone-complete toast: its own element so it never replaces a card-complete toast.
    let zoneToastTimer = 0;
    function zoneToast(zoneName) {
      const el = $('zone-toast');
      $('zone-toast-title').textContent = zoneName + ' complete';
      $('zone-toast-sub').textContent = 'All ' + chapterTotals[zoneName] + ' skills in this chapter collected';
      el.style.setProperty('--zone-color', (CHAPTER_STYLE[zoneName] || CHAPTER_STYLE.Workflow).orb);
      el.hidden = true;
      void el.offsetWidth;
      el.hidden = false;
      clearTimeout(zoneToastTimer);
      zoneToastTimer = setTimeout(() => { el.hidden = true; }, ZONE_TOAST_MS);
    }
    function chapterCount(ch) {
      return CARDS.filter((c) => c.chapter === ch).reduce((s, c) => s + progress.cardCount(c.id), 0);
    }

    // Level up.
    let levelTimer = 0;
    function celebrateLevel(level) {
      const flash = $('flash');
      flash.classList.remove('on');
      void flash.offsetWidth;
      flash.classList.add('on');
      const banner = $('levelup');
      $('levelup-sub').textContent = 'Level ' + level + (level >= MAX_LEVEL ? ' · max' : '');
      banner.hidden = true;
      void banner.offsetWidth;
      banner.hidden = false;
      clearTimeout(levelTimer);
      levelTimer = setTimeout(() => { banner.hidden = true; }, 2300);
      const badge = $('level-badge');
      badge.classList.remove('pulse');
      void badge.offsetWidth;
      badge.classList.add('pulse');
      levelChime();
    }

    // Combo.
    const combo = { count: 0, last: -Infinity };
    const comboEl = $('combo');
    function bumpCombo(now) {
      combo.count = now - combo.last <= COMBO_WINDOW ? combo.count + 1 : 1;
      combo.last = now;
      if (combo.count >= 2) {
        $('combo-count').textContent = '×' + combo.count;
        comboEl.hidden = false;
        comboEl.classList.remove('bump');
        void comboEl.offsetWidth;
        comboEl.classList.add('bump');
      }
    }
    function updateCombo(now) {
      if (combo.count === 0) return;
      const left = COMBO_WINDOW - (now - combo.last);
      if (left <= 0) {
        combo.count = 0;
        comboEl.hidden = true;
        return;
      }
      $('combo-timer-fill').style.width = ((left / COMBO_WINDOW) * 100).toFixed(1) + '%';
    }

    // Reset with a confirm step.
    const confirmBox = $('reset-confirm');
    function hideConfirm() { confirmBox.hidden = true; }
    $('btn-reset').addEventListener('click', () => { confirmBox.hidden = !confirmBox.hidden; });
    $('btn-reset-no').addEventListener('click', hideConfirm);
    $('btn-reset-yes').addEventListener('click', () => {
      progress.reset();
      try { root.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
      orbs.forEach((o) => {
        if (o.collected) { o.collected = false; scene.add(o.group); }
      });
      cardSigns.forEach((s) => s.update());
      motion.x = spawn.x;
      motion.z = spawn.z;
      motion.vx = motion.vz = 0;
      combo.count = 0;
      comboEl.hidden = true;
      closePickup();
      $('win').hidden = true;
      hideConfirm();
      renderHud({ instant: true });
      toast('Progress reset. Back to the start!');
    });

    // Win screen.
    let playSeconds = 0;
    function formatTime(sec) {
      const s = Math.floor(sec);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = String(s % 60).padStart(2, '0');
      return h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss;
    }
    function showWin() {
      $('win-time').textContent = formatTime(playSeconds);
      $('win-level').textContent = String(progress.level);
      $('win-xp').textContent = String(progress.xp);
      $('win').hidden = false;
      $('win-keep').focus();
    }
    $('win-keep').addEventListener('click', () => { $('win').hidden = true; });

    // ------------------------------------------------------------ collecting
    function collectOrb(orb, now) {
      const result = progress.collect(orb.data.item.id);
      if (!result) return;
      orb.collected = true;
      scene.remove(orb.group);
      const p = orb.group.position;
      burst(p.x, p.y, p.z, orb.color, 34, 4.2, 0.85, 0.16);
      burst(p.x, p.y, p.z, '#ffffff', 14, 2.6, 0.6, 0.1);
      shockRing(p.x, p.z, orb.color);
      orb.pull = 0;
      orb.group.scale.setScalar(1);
      bumpCombo(now);
      pickupChime(combo.count);
      writeStorage(progress.serialize());
      cardSigns.get(result.card.id).update();
      if (result.cardCompleted) {
        toast('Card complete: ' + result.card.title + ' · +' + XP_PER_CARD + ' XP bonus');
        cardChime();
        const cl = layout.clusters.find((c) => c.card.id === result.card.id);
        burst(cl.x, 3, cl.z, '#e8bf4a', 60, 5, 1.2, 0.2);
        if (result.card.id === targetCardId) setTarget(null); // nothing left to point at
      }
      // Counts only ever rise by one per pickup, so this fires exactly on the zone's last orb.
      const zoneName = orb.data.zone.name;
      if (chapterCount(zoneName) === chapterTotals[zoneName]) zoneToast(zoneName);
      renderHud({ levelUp: result.leveledUp });
      if (result.leveledUp) celebrateLevel(result.levelAfter);
      showPickup(result);
      if (result.won) setTimeout(showWin, 1200);
    }

    // ------------------------------------------------------------ minimap
    const mm = $('minimap');
    const mctx = mm.getContext('2d');
    function sizeMinimap() {
      const dpr = Math.min(root.devicePixelRatio || 1, 2);
      mm.width = Math.round(mm.clientWidth * dpr);
      mm.height = Math.round(mm.clientHeight * dpr);
    }
    function drawMinimap() {
      const W = mm.width;
      const H = mm.height;
      if (!W || !H) return;
      const sx = W / (BOUNDS.x * 2);
      const sz = H / (BOUNDS.z * 2);
      const toX = (x) => (x + BOUNDS.x) * sx;
      const toY = (z) => (z + BOUNDS.z) * sz;
      mctx.fillStyle = '#ebe7d9';
      mctx.fillRect(0, 0, W, H);
      const unit = W / 210;
      mctx.lineWidth = Math.max(1, unit);
      layout.zones.forEach((zone) => {
        const style = CHAPTER_STYLE[zone.name] || CHAPTER_STYLE.Workflow;
        const x = toX(zone.cx - zone.half);
        const y = toY(zone.cz - zone.half);
        mctx.fillStyle = style.tint;
        mctx.fillRect(x, y, zone.half * 2 * sx, zone.half * 2 * sz);
        mctx.strokeStyle = INK;
        mctx.strokeRect(x, y, zone.half * 2 * sx, zone.half * 2 * sz);
        mctx.fillStyle = style.ink;
        mctx.font = '700 ' + Math.round(8 * unit) + 'px ' + FONT;
        mctx.textBaseline = 'top';
        mctx.fillText(zone.name.toUpperCase(), x + 3 * unit, y + 3 * unit);
      });
      const dot = Math.max(2, 2.2 * unit);
      orbs.forEach((o) => {
        if (o.collected) return;
        mctx.fillStyle = o.color;
        mctx.fillRect(toX(o.data.x) - dot / 2, toY(o.data.z) - dot / 2, dot, dot);
      });
      const px = toX(motion.x);
      const py = toY(motion.z);
      mctx.beginPath();
      mctx.arc(px, py, 4.2 * unit, 0, Math.PI * 2);
      mctx.fillStyle = PAPER;
      mctx.fill();
      mctx.beginPath();
      mctx.arc(px, py, 2.8 * unit, 0, Math.PI * 2);
      mctx.fillStyle = INK;
      mctx.fill();
    }

    // ------------------------------------------------------------ resize
    function resize() {
      const w = root.innerWidth;
      const h = root.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w / h < 1 ? 68 : 55;
      camera.updateProjectionMatrix();
      sizeMinimap();
    }
    root.addEventListener('resize', resize);
    resize();

    // ------------------------------------------------------------ loop
    let clock = 0;
    let last = performance.now();
    let moved = 0;
    let dustTimer = 0;
    let trailTimer = 0;
    let frameNo = 0;
    const hint = $('hint');
    const hintTimer = setTimeout(() => hint.classList.add('gone'), 12000);

    function step(dt) {
      clock += dt;
      playSeconds += dt;

      // Movement: ease velocity toward the input target (acceleration, not steps).
      const input = readInput();
      const maxSpeed = MOVE_SPEED * (input.dash ? DASH_MULTIPLIER : 1);
      const tx = input.x * maxSpeed;
      const tz = input.z * maxSpeed;
      const hasInput = input.x !== 0 || input.z !== 0;
      const k = 1 - Math.exp(-(hasInput ? ACCEL : DECEL) * dt);
      motion.vx += (tx - motion.vx) * k;
      motion.vz += (tz - motion.vz) * k;
      if (!hasInput && Math.hypot(motion.vx, motion.vz) < 0.02) motion.vx = motion.vz = 0;
      motion.x += motion.vx * dt;
      motion.z += motion.vz * dt;
      const limX = BOUNDS.x - 0.4;
      const limZ = BOUNDS.z - 0.4;
      if (motion.x > limX || motion.x < -limX) { motion.x = Math.max(-limX, Math.min(limX, motion.x)); motion.vx = 0; }
      if (motion.z > limZ || motion.z < -limZ) { motion.z = Math.max(-limZ, Math.min(limZ, motion.z)); motion.vz = 0; }
      player.position.set(motion.x, 0, motion.z);

      const speed = Math.hypot(motion.vx, motion.vz);
      moved += speed * dt;
      if (moved > 3 && !hint.classList.contains('gone')) { hint.classList.add('gone'); clearTimeout(hintTimer); }

      // Facing (screen-space horizontal; the camera never yaws) and animation frame.
      if (motion.vx > 0.15) motion.facing = 1;
      else if (motion.vx < -0.15) motion.facing = -1;
      sprite.scale.x = motion.facing;
      if (speed > 0.35) {
        motion.animPhase += speed * dt * 1.5;
        spriteMat.map = FRAMES.walk[Math.floor(motion.animPhase) % 4];
        motion.idleClock = 0;
      } else {
        motion.idleClock += dt;
        spriteMat.map = FRAMES.idle[Math.floor(motion.idleClock / 0.6) % 2];
      }

      // Walk feel: hop on each stride and lean into screen-horizontal travel, easing back to idle.
      // The hop peaks on the legs-together frames (1, 3) and touches down on the stride frames (0, 2).
      const walkTarget = Math.min(1, speed / MOVE_SPEED);
      motion.walkAmt += (walkTarget - motion.walkAmt) * (1 - Math.exp(-10 * dt));
      motion.lean += (-(motion.vx / (MOVE_SPEED * DASH_MULTIPLIER)) * 0.2 - motion.lean) * (1 - Math.exp(-12 * dt));
      const hop = Math.abs(Math.sin((motion.animPhase - 0.5) * Math.PI / 2)) * motion.walkAmt;
      sprite.position.y = hop * (input.dash ? 0.11 : 0.08);
      sprite.rotation.z = motion.lean;
      sprite.scale.y = 1 + (hop - 0.5) * 0.05 * motion.walkAmt;
      shadow.scale.setScalar(1 - hop * 0.15);

      // Dash: ground dust plus a glow trail behind the player.
      if (input.dash && speed > MOVE_SPEED * 1.05) {
        dustTimer -= dt;
        if (dustTimer <= 0) {
          dustTimer = 0.06;
          burst(motion.x, 0.08, motion.z, '#9c9480', 5, 0.9, 0.45, 0.12);
        }
      }
      if (input.dash && speed > MOVE_SPEED * 0.5) {
        trailTimer -= dt;
        while (trailTimer <= 0) {
          trailTimer += 0.02;
          emitTrail(motion.x, motion.z, motion.vx, motion.vz);
        }
      } else {
        trailTimer = 0;
      }

      // Camera follows behind and above, looking at the character.
      const ck = 1 - Math.exp(-6 * dt);
      camera.position.x += (motion.x + CAM_OFFSET.x - camera.position.x) * ck;
      camera.position.y += (CAM_OFFSET.y - camera.position.y) * ck;
      camera.position.z += (motion.z + CAM_OFFSET.z - camera.position.z) * ck;
      camLook.x += (motion.x - camLook.x) * Math.min(1, ck * 1.6);
      camLook.z += (motion.z - camLook.z) * Math.min(1, ck * 1.6);
      camera.lookAt(camLook);
      // Cylindrical billboard: the sprite turns to face the camera around Y.
      sprite.rotation.y = Math.atan2(camera.position.x - motion.x, camera.position.z - motion.z);

      // Orbs: bob, glow, fade labels by distance, magnet pull, collect on contact.
      // Distances are from each orb's fixed home spot, so the magnet can only reach MAGNET_RADIUS.
      const r2 = PICKUP_RADIUS * PICKUP_RADIUS;
      const m2 = MAGNET_RADIUS * MAGNET_RADIUS;
      let nearest = null;
      let nearestD2 = Infinity;
      let targetD2 = Infinity;
      let cardNearest = null;
      let cardNearestD2 = Infinity;
      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        if (o.collected) continue;
        const dx = o.data.x - motion.x;
        const dz = o.data.z - motion.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < m2) o.pull = Math.min(1, o.pull + dt * 7);
        else if (o.pull > 0) o.pull = Math.max(0, o.pull - dt * 4);
        const d = Math.sqrt(d2);
        // Contact = the pulled orb is within PICKUP_RADIUS; with no pull this is exactly the v1 rule.
        if (d2 < r2 || (d2 < m2 && d * (1 - o.pull) < PICKUP_RADIUS)) {
          collectOrb(o, clock);
          continue;
        }
        if (d2 < nearestD2) { nearestD2 = d2; nearest = o; }
        if (targetCardId && o.data.card.id === targetCardId && d2 < cardNearestD2) { cardNearestD2 = d2; cardNearest = o; }
        if (o === beaconTarget) targetD2 = d2;
        const bobY = 0.95 + Math.sin(clock * 2.2 + o.phase) * 0.14;
        o.group.position.set(
          o.data.x - dx * o.pull,
          bobY + (0.7 - bobY) * o.pull,
          o.data.z - dz * o.pull
        );
        o.group.scale.setScalar(1 - o.pull * 0.35);
        o.glow.scale.setScalar(1.1 + Math.sin(clock * 3.1 + o.phase) * 0.18);
        if (d > LABEL_GONE) {
          o.label.visible = false;
        } else {
          o.label.visible = true;
          o.label.material.opacity = d < LABEL_FULL ? 1 : 1 - (d - LABEL_FULL) / (LABEL_GONE - LABEL_FULL);
        }
      }

      // Beacon on the nearest uncollected orb of the target card if one is set, otherwise the
      // nearest uncollected orb overall. A small hysteresis stops it flickering between two
      // near-equidistant orbs; it dims up close so it doesn't hide the orb.
      const useCard = !!cardNearest;
      const want = useCard ? cardNearest : nearest;
      const wantD2 = useCard ? cardNearestD2 : nearestD2;
      if (want && (targetD2 === Infinity || Math.sqrt(wantD2) < Math.sqrt(targetD2) - 0.3)) beaconTarget = want;
      if (!want) beaconTarget = null;
      beacon.visible = !!beaconTarget;
      if (beaconTarget) {
        if (beacon.userData.color !== beaconTarget.color) {
          beacon.userData.color = beaconTarget.color;
          [beaconCore, beaconHalo, beaconRing].forEach((m) => m.material.color.set(beaconTarget.color));
        }
        beacon.position.set(beaconTarget.data.x, 0, beaconTarget.data.z);
        const dist = Math.sqrt(beaconTarget === want ? wantD2 : targetD2);
        const far = Math.min(1, Math.max(0, (dist - 2) / 4));
        const pulse = 0.85 + Math.sin(clock * 3) * 0.15;
        beaconCore.material.opacity = (0.3 + 0.65 * far) * pulse;
        beaconHalo.material.opacity = (0.12 + 0.33 * far) * pulse;
        const ripple = (clock * 0.8) % 1;
        beaconRing.scale.setScalar(1 + ripple * 0.8);
        beaconRing.material.opacity = 0.75 * (1 - ripple);
      }
      chapterSigns.forEach((s) => { s.mesh.position.y = s.baseY + Math.sin(clock * 0.8 + s.phase) * 0.25; });
      spawnRing.material.opacity = 0.25 + Math.sin(clock * 2) * 0.1;

      updateEffects(dt);
      updateCombo(clock);
    }

    function frame(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      step(dt);
      renderer.render(scene, camera);
      if ((frameNo++ & 1) === 0) drawMinimap();
      root.requestAnimationFrame(frame);
    }

    // First-run How to Play: shown until closed once; any click/tap on it or any key closes it.
    // Uses HOWTO_KEY only, never STORAGE_KEY. If storage is blocked it simply shows each visit.
    const howto = $('howto');
    function closeHowto() {
      if (howto.hidden) return;
      howto.hidden = true;
      writeKey(HOWTO_KEY, '1');
      root.removeEventListener('keydown', closeHowto, true);
    }
    if (readKey(HOWTO_KEY) !== '1') {
      howto.hidden = false;
      howto.addEventListener('click', closeHowto);
      root.addEventListener('keydown', closeHowto, true);
      $('howto-start').focus();
    }

    renderHud({ instant: true });
    $('loading').hidden = true;
    root.requestAnimationFrame((now) => { last = now; frame(now); });
  }

  function readStorage() {
    try {
      const raw = root.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeStorage(value) {
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      /* storage full or blocked: progress just won't persist */
    }
  }
  // Plain-string side keys (target card, How to Play flag); never touch STORAGE_KEY.
  function readKey(key) {
    try { return root.localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeKey(key, value) {
    try { root.localStorage.setItem(key, value); } catch (e) { /* not persisted */ }
  }
  function removeKey(key) {
    try { root.localStorage.removeItem(key); } catch (e) { /* not persisted */ }
  }

  boot();
})(typeof window !== 'undefined' ? window : globalThis);
