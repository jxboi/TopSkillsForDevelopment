# Fix-in-place — final copy decisions

Sources that STAY byte-identical (after HTML entity decoding): descriptions, Use-when lines (~/workspace/workflow-run-full-review/when-avoid-copy.md), Inside names and functions (~/workspace/workflow-run-top5/lists.md, incl. Matt to-spec present / tdd absent), Inside summaries, Inside notes, repo links, star counts. Nothing below rewords any of them. New copy in this file is limited to: the top-names line label, chapter ledes, and control labels — all neutral wording that makes no claim about any skill.

## 1. Top-names line (new, visible, one per card)

Format: `<p class="top-inside"><span class="top-inside-label">LABEL</span> NAME · NAME</p>` — names are the first two `<code class="inside-name">` values of that card's Inside list, in list order, joined by ` · `; Karpathy shows its single name. Names are duplicated data, not new content: the same names still appear in the Inside list. The label varies by card kind so a command is never presented as a skill and a catalog entry is never presented as the whole repo.

| Card | Inside summary (unchanged) | Top-line label | Top-line names |
|---|---|---|---|
| Superpowers | Inside this repo — 5 of 15 skills | Top inside: | brainstorming, using-git-worktrees |
| ECC | Featured skills and commands | Featured: | tdd-workflow, /ecc:plan |
| Matt Pocock Skills | Inside this repo — 5 of 31 skills | Top inside: | grill-with-docs, grill-me |
| Spec Kit | Inside this repo — 5 core commands | Top commands: | speckit-specify, speckit-plan |
| Vercel Skills | Inside this repo — 1 skill, 4 commands | Top commands: | find-skills, skills add |
| pstack | Inside this repo — 5 of 23 playbooks | Top inside: | bug-fix, feature |
| Karpathy Skills | Inside this repo — the only skill | Inside: | karpathy-guidelines |
| Agent Skills | Inside this repo — 5 of 25 skills | Top inside: | /spec, /plan |
| UI/UX Pro Max | Inside this repo — 5 of 7 skills | Top inside: | ui-ux-pro-max, design-system |
| Caveman | Featured skills and commands | Featured: | /caveman, /ultracave |
| Graphify | Inside this repo — 1 skill, 4 subcommands | Top subcommands: | /graphify, graphify query |
| Understand-Anything | Inside this repo — 5 of 9 skills | Top inside: | understand, understand-dashboard |
| Anthropic Skills | Inside this repo — 5 of 19 skills | Top inside: | pdf, docx |
| Scientific Agent Skills | Inside this repo — 5 of 177 skills | Top inside: | database-lookup, scanpy |
| Obsidian Skills | Inside this repo — 5 of 6 skills | Top inside: | obsidian-markdown, obsidian-bases |
| Google Skills | Featured inside this catalog | Featured: | finding-google-skills, google-cloud-recipe-auth |
| Agentic Awesome Skills | Featured inside this catalog | Featured: | brainstorming, concise-planning |
| Awesome Claude Code | Featured inside this catalog | Featured: | Caveman, Claude Code Infrastructure Showcase |
| Claude Plugins Official | 5 first-party plugins | Top inside: | skill-creator, plugin-dev |
| Awesome Agent Skills | Featured inside this catalog | Featured: | anthropics/docx, anthropics/doc-coauthoring |
| Claude Skills Collection | Inside this repo — 5 of 401 skills | Top inside: | skill-security-auditor, pw |

Rendered examples: Superpowers — `Top inside: brainstorming · using-git-worktrees`. Karpathy Skills — `Inside: karpathy-guidelines`. Vercel Skills — `Top commands: find-skills · skills add`. Google Skills — `Featured: finding-google-skills · google-cloud-recipe-auth`. Awesome Claude Code's `Caveman` entry is the report's correct cross-reference to another card, not a duplication error — leave it.

## 2. Chapter ledes (new, one line per chapter, under the chapter heading)

Neutral, claim-free, no statistics. Markup: `<p class="chapter-lede">…</p>` directly after each `<h2 class="chapter-heading">`.

- Workflow — How work moves from an idea to shipped code.
- Quality — Checks that keep code honest before it ships.
- Design — Interfaces that look considered, not generated.
- Efficiency — Less noise between thought and output.
- Knowledge — Ways to hold a codebase in your head.
- Discovery — Catalogs and directories for finding the right skill.

## 3. Control labels (replacing the guides control)

- Old control `Expand all guides` / `Collapse all` is DELETED with the guides (see spec §4).
- New control, in the same filter-row position: `Expand all inside lists` / `Collapse all inside lists`, `aria-expanded` mirroring state, scoped to `details.inside` only.
- Search-match behaviour adds no new visible copy except `<mark>` highlighting inside Inside lists (browser default mark styling is overridden in spec §6 to ink-on-paper tint using existing tokens only — no new colour).
- Karpathy: no special label, no footnote, no explanation UI. Its Inside block is collapsed like every other card; its single skill is visible in its top-names line.

## 4. What is deleted, verbatim

- All 21 `details.guide` blocks in full: summaries, 63 guide steps, 21 prompt boxes, 21 copy buttons, and the `#copy-status` live region's purpose (the element itself may be removed or left inert — if left, it must never be populated).
- The `#toggle-guides` button and its label.
- No description, Use line, Inside item, summary, note, link, or star count is deleted, reworded, or reordered by this pass.

## 5. Deliberately NOT decided here

- Obsidian's 6th skill (`knap`) remains unfootnoted, as the top-5 designer left it — the top-names line shows the first two of the five listed, so the omission question is unchanged.
- No per-card imagery, no index/table view, no card-count reduction. Those are direction-level decisions (audit E1–E3), out of scope for fix-in-place.
