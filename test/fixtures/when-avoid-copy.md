# TopSkills: Use when / Avoid when copy

Edited from `workspace/research_notes/topskills-when-to-use.md`. Site card order. No site file edited.

## Superpowers

Use when: At the start of a new task, before any code, when you want spec brainstorming, worktree isolation, bite-sized planning, and test-driven development.

Avoid when: Dispatched as a single-purpose subagent on an isolated task, or when the user tells the agent to bypass skill workflows.

Source grade: Verified

## ECC

Use when: When running a full-lifecycle workflow in a supported harness that needs planning, test-driven implementation, fresh-context review, and build repair.

Avoid when: Mid-implementation, where compaction erases transient state, or under tight token limits and simple tasks where hooks and agent teams add overhead.

Source grade: Verified

## Karpathy Skills

Use when: During a non-trivial coding task where models tend to assume silently, add speculative abstractions, edit unrelated code, or skip verifiable test loops.

Avoid when: On trivial tasks such as a typo fix or obvious one-liner, where the added caution and verification loops cost speed for no gain.

Source grade: Verified

## Matt Pocock Skills

Use when: At the start of feature or bug work, when human grilling should settle ambiguity and shared terminology before tickets and test-driven development.

Avoid when: When you want a fully automated process with no human grilling, or in an initialized repository where grill-me replaces repository-aware grill-with-docs.

Source grade: Verified

## UI/UX Pro Max

Use when: When building, refactoring, or auditing an interface that needs concrete choices on palette, font pairing, responsive layout, and accessibility compliance.

Avoid when: On backend logic, API or database design, infrastructure, or non-visual scripts, where its guidance adds nothing to how an interface looks or moves.

Source grade: Verified

## Caveman

Use when: In interactive terminal coding sessions where replies pile up token waste, latency, and conversational filler.

Avoid when: Under fixed-credit or per-request billing such as GitHub Copilot, in terse Q&A where rule injection outweighs savings, or for commits, pull requests, and docs.

Source grade: Verified

## Graphify

Use when: When exploring an unfamiliar codebase or a mixed folder of code, PDFs, notes, and images that needs a persistent, queryable graph of cross-file links.

Avoid when: On small file sets that already fit in context, where token reduction is about 1x, or on unsegmented corpora beyond 2M words or 200 files.

Source grade: Verified

## Agent Skills

Use when: When guiding an agent through multi-stage feature delivery that needs requirements, specs, tests, security passes, and human checkpoints to prevent shortcuts.

Avoid when: In hands-off long autonomous runs without human checkpoints, or quick edits where the multi-phase lifecycle is more ceremony than the change deserves.

Source grade: Verified

## Understand-Anything

Use when: When onboarding onto a large unfamiliar repository of 200,000+ lines and you need a visual dashboard of architecture layers, business flows, and diff impact.

Avoid when: With a tight token budget and no subscription or local model for the first full multi-agent scan, or inside ephemeral git worktrees without output redirection.

Source grade: Verified

## Agentic Awesome Skills

Use when: When an autonomous agent should inspect your codebase, search a skill catalog over read-only MCP, and produce a validated stack manifest with plan preview.

Avoid when: When bulk-installing the catalog into agent directories, causing context overload and crashes, or expecting semantic ranking and guaranteed safe execution.

Source grade: Verified

## Anthropic Skills

Use when: When Claude needs multi-step procedural guidance for domain tasks like DOCX, PDF, PPTX, and XLSX generation, web app testing, or MCP server scaffolding.

Avoid when: For critical production tasks without testing in your target environment, since the repository states it serves demonstration and educational purposes.

Source grade: Verified

## Spec Kit

Use when: When building a greenfield app or complex multi-step feature whose requirements and tasks must become executable specifications before code is generated.

Avoid when: On large features run as one unscoped implementation without phase limits, or quick ad-hoc changes where formal specification artifacts add overhead.

Source grade: Verified

## Awesome Claude Code

Use when: When configuring Claude Code and you want a selective directory of vetted tools, status lines, hooks, subagents, and guides that meet maturity thresholds.

Avoid when: When you want a package-manager installer for raw skill files, or workflows for assistants that lack Claude Code-specific features.

Source grade: Verified

## Scientific Agent Skills

Use when: When running workflows in genomics, cheminformatics, physics, clinical research, or lab automation that need vetted links to 100+ scientific databases.

Avoid when: When bulk-installing the entire catalog in a sensitive environment without reviewing community-contributed skill files or running behavioral security scans.

Source grade: Verified

## Obsidian Skills

Use when: When a task writes wikilinks, embeds, or callouts, edits canvas or base files, or manages vault state through the Obsidian CLI.

Avoid when: When writing portable Markdown for non-Obsidian parsers, where wikilinks and embeds fail to render, or running CLI operations while the desktop app is closed.

Source grade: Verified

## Claude Plugins Official

Use when: When you want to discover and install Anthropic-vetted or partner-vetted commands, MCP configurations, agents, and skill bundles inside Claude Code.

Avoid when: In high-security environments without manual auditing, since Anthropic cannot verify third-party plugin code, or in harnesses lacking plugin support.

Source grade: Verified

## Vercel Skills

Use when: When you need one CLI to search, install, update, sync, or test-run skills across several coding agent harnesses from git, URLs, or npm.

Avoid when: On machines without Node 22 or newer, or beside auto-updating harness marketplaces, where file-level copies may register duplicate skills.

Source grade: Verified (Use and Node avoid claim); Reported (duplicate-registration half of Avoid)

## Awesome Agent Skills

Use when: When you need production-ready skills authored by engineering teams such as Supabase, Stripe, Sentry, and Vercel, usable across several coding assistants.

Avoid when: In zero-trust environments needing pre-audited skills, since skills are curated, not audited, and may carry prompt injections or malicious payloads.

Source grade: Verified

## Claude Skills Collection

Use when: When you need cross-functional playbooks for executive advisory, marketing, compliance, or research, plus zero-dependency Python analysis and conversion tools.

Avoid when: Without a local Python 3 interpreter for the scripts, or when you only want simple coding rules without executive and cross-functional persona overhead.

Source grade: Verified

## Google Skills

Use when: When designing or configuring services on Google Cloud, Gemini APIs, Firebase, Android, or Google Ads, or weighing Google products for a stack component.

Avoid when: When the stack is already committed to another cloud provider with no Google product named, or the task involves no platform choice.

Source grade: Verified

## pstack

Use when: At the start of a demanding task such as reproducing defects, tracing performance bottlenecks, or overnight autonomous work needing empirical verification.

Avoid when: In workflows built on heavy upfront planning and spec-first stages, which the author eschews, or in non-Cursor harnesses lacking bugbot and automations.

Source grade: Verified

## Notes

Flagged (meaning changed or detail dropped to fit 20-160 characters and a single-period sentence):

- **Vercel Skills:** the Use claim and the Node avoid claim are Verified. The duplicate-registration half of the Avoid sentence is **Reported**, not Verified (it rests on a cross-reference in the mattpocock/skills README). The research gives Node.js 22.20+; the sentence says "Node 22 or newer" because periods inside the version break the one-period sentence check. The minor version 22.20 is lost.
- **Agentic Awesome Skills (research refinement):** the Use sentence follows the current repo (agent-first MCP search plus a validated stack manifest with plan preview), not the site's catalog framing. Dropped: "reproducible", "immutable", "before installation" and the manifest file name. The Avoid sentence (bulk-install overload) is the most useful new line; "truncation crashes" is shortened to "crashes". The site description still says catalog, so the two read differently until the card copy is decided.
- **Anthropic Skills (research refinement):** the Avoid sentence carries the repo Disclaimer (demonstration and educational purposes), which the site card does not mention. It is new, not a contradiction.
- **Superpowers:** dropped "interactive" and "before asking clarifying questions".
- **ECC:** slash commands dropped. The Avoid sentence merges three sourced cases (compaction mid-run, strict token limits with hooks, simple sequential tasks with multi-agent teams) into two clauses; "full runtime hooks" becomes "hooks".
- **Matt Pocock Skills:** command slashes and file names (GLOSSARY, ADRs) dropped; "tracer-bullet" dropped.
- **Graphify:** dropped "without re-reading raw files each session" and the "tweets" example.
- **Understand-Anything:** dropped the Karpathy-pattern LLM wiki case.
- **Awesome Claude Code:** the maturity threshold (14 days of commits or 100+ stars) is dropped.
- **Scientific Agent Skills:** named packages (RDKit, Scanpy, BioPython) dropped.
- **Awesome Agent Skills:** named language stacks and assistants dropped; "several" replaces the lists.
- **Claude Plugins Official:** "first-party" becomes "Anthropic-vetted"; the plugin install command is dropped.
- **pstack:** poteto-mode dropped from Use (it is already in the card description); "multi-model fan-outs" dropped.
- **Caveman:** "code comments" dropped from the persisted-content list; "PRs" written out as pull requests.

Length trims (15 sentences that were 161-185 characters, cut to 160 or fewer; where trimming lost meaning, it is noted):

- **ECC Use:** "starting a full-lifecycle engineering workflow" became "running a full-lifecycle workflow". "Engineering" is lost.
- **Matt Pocock Skills Use:** "a human-in-the-loop grilling session" became "human grilling". The explicit human-in-the-loop framing is reduced to the word "human".
- **Matt Pocock Skills Avoid:** "stateless" dropped before grill-me. The stateless versus repository-aware contrast now rests on "repository-aware" alone.
- **Agentic Awesome Skills Use:** "coding" and "local" dropped, and "a plan preview" became "plan preview". The catalog is no longer said to be local.
- **Agentic Awesome Skills Avoid:** "which causes" became "causing"; "full" and "watched" dropped. "Watched" was the sourced mechanism for the overload, so the sentence now says only "agent directories".
- **Spec Kit Use:** "specification documents" became "specifications". The documents framing is lost; the sense is intact.
- **Awesome Claude Code Use:** "a Claude Code setup" became "Claude Code". No meaningful loss.
- **Scientific Agent Skills Use:** "computational" dropped. The domain list still implies it.
- **Claude Plugins Official Avoid:** "Claude Code" dropped from "plugin support", so the harness is no longer named in the sentence.
- **Awesome Agent Skills Use:** "languages and" dropped, so the language-breadth claim is lost; assistants remain.
- **Awesome Agent Skills Avoid:** "the repository says" dropped. The "curated, not audited" statement is no longer attributed to the repository, though it is still its stated position.
- **Claude Skills Collection Use:** "academic" dropped from research, and "analysis tools and conversion scripts" became "analysis and conversion tools". "Academic" is lost and "scripts" becomes "tools".
- **Claude Skills Collection Avoid:** "underlying" dropped before scripts. No meaningful loss.
- **Google Skills Use:** "deploying" dropped from the verb list. Deploying is no longer named.
- **pstack Use:** "engineering", "subtle" and "running" dropped, and "that needs" became "needing". "Subtle" qualified the defects and is lost.

No skill lacked a compliant sentence pair.

Description overlap that could not be fully avoided (no verbatim or substring match, but close in topic):

- **Agentic Awesome Skills:** the card says "discovering, comparing, and planning which skills to use"; the Use sentence (searching a catalog, producing a manifest and plan preview) is adjacent.
- **Obsidian Skills:** the card names the CLI and Markdown formats; the Use sentence names the CLI again but leads with wikilinks, embeds, canvas, and base files.
- **Claude Plugins Official:** the card says "Anthropic-managed directory"; the Use sentence says "Anthropic-vetted", which is the sourced claim.
- **Awesome Claude Code:** the card says "curated collection"; the Use sentence says "selective directory" for the same sourced reason.
- **Spec Kit:** the card says "spec-driven development"; the Use sentence turns on specifications before code generation.

Not checked: per the research file's caveat, section anchors were not re-opened against the READMEs in this pass.
