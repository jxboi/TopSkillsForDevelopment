'use strict';
// Exercise the real script against a small DOM double built from the shipped HTML.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const os = require('node:os');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const promptSource = fs.readFileSync(path.join(os.homedir(), 'workspace/workflow-run-prompts/prompts.md'), 'utf8');
const promptSections = [...promptSource.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const promptMap = new Map(promptSections.map(([, title, body]) => [title, new Map([...body.matchAll(/^- `([^`]+)` — ([^\n]+)$/gm)].map(([, name, prompt]) => [name, prompt]))]).filter(([, items]) => items.size));

const designCopy = fs.readFileSync(path.join(os.homedir(), 'workspace/workflow-run-design2/cards.md'), 'utf8');
const newCards = [...designCopy.matchAll(/^## Card (22|23) — (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(([, number, title, body]) => {
 const value = label => body.match(new RegExp('^- '+label+': ([^\\n]+)', 'm'))?.[1];
 const items = [...body.matchAll(/^- `([^`]+)` — ([^\n]+)\n  - Prompt: ([^\n]+)/gm)].map(([,name,fn,prompt])=>({name,fn,prompt}));
 return {number,title,items,summary:value('Summary'),note:number==='22'?value('Note \\(after the list, `<p class="inside-note">`\\)'):undefined,
 description:value('Description'),use:value('Use'),stars:value('Stars').split(' —')[0],
 topLabel:value('Top inside').match(/label `([^`]+)`/)[1],topNames:[...value('Top inside').split('names:')[1].matchAll(/`([^`]+)`/g)].map(m=>m[1]),
 href:value('Footer link').split(',')[0],aria:body.match(/`([^`]+ original GitHub repository \(opens in new tab\))`/)[1]};
});
assert.equal(newCards.length,2);
// Source document keeps its historical card numbers.
for (const card of newCards) card.number=String(Number(card.number)-1);
promptMap.delete('Scientific Agent Skills');
for(const card of newCards) promptMap.set(card.title,new Map(card.items.map(item=>[item.name,item.prompt])));

const mattResearch = fs.readFileSync(path.join(os.homedir(),'workspace/workflow-run-matt-full/matt-remaining.md'),'utf8').split('## 3. Remaining promoted active skills (22)')[1].split('## Appendix')[0];
const mattRemaining = [...mattResearch.matchAll(/#### \d+\. `([^`]+)`\n- Path: [^\n]+\n- Summary: ([^\n]+)\n- Prompt: ([^\n]+)/g)].map(([,name,fn,prompt])=>({name,fn,prompt}));
assert.equal(mattRemaining.length,22);
for(const item of mattRemaining) promptMap.get('Matt Pocock Skills').set(item.name,item.prompt);
const densityBaseline = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/agent-layer-baseline.json'),'utf8'));

const root = path.join(__dirname, '..');
// pstack23 undo layer: reverse ONLY the 18 appended rows and summary.
const pstack23Categories = {
  "authoring-a-skill": "Writing",
  "autonomous-run": "Planning",
  "autopilot-full": "Review",
  "autopilot-stack": "Review",
  "babysit": "Review",
  "eval": "Testing",
  "hillclimb": "Testing",
  "multi-phase-plan": "Planning",
  "opening-a-pr": "Communication",
  "orchestrate": "Planning",
  "pause-safely": "Planning",
  "prototype": "Design",
  "runtime-forensics": "Debugging",
  "session-pickup": "Understanding",
  "shipping": "Review",
  "trace-forensics": "Debugging",
  "visual-parity": "Testing",
  "worktree-cleanup": "Setup"
};
const pstack23Names = Object.keys(pstack23Categories);
function undoPstack23(text) {
 return text.replace(/<article class="skill-card"[^>]*aria-labelledby="skill-20">[\s\S]*?<\/article>/, card => {
  for (const name of pstack23Names) {
   const rows = [...card.matchAll(/ <li>[^\n]*<\/li>\n/g)].filter(([row]) => row.startsWith(' <li><code class="inside-name">'+name+'</code>'));
   assert.equal(rows.length,1,'pstack23 undo row '+name);
   card = card.replace(rows[0][0],'');
  }
  assert.ok(card.includes('Inside this repo — 23 playbooks'));
  return card.replace('Inside this repo — 23 playbooks','Inside this repo — 5 of 23 playbooks');
 });
}
// impeccable23 undo layer: reverse ONLY the 18 appended rows and summary.
const impeccable23Categories = {
  "adapt": "Design",
  "animate": "Design",
  "clarify": "Writing",
  "colorize": "Design",
  "delight": "Design",
  "distill": "Design",
  "document": "Writing",
  "extract": "Design",
  "generate": "Design",
  "harden": "Building",
  "layout": "Design",
  "live": "Design",
  "onboard": "Design",
  "optimize": "Debugging",
  "overdrive": "Design",
  "quieter": "Design",
  "shape": "Planning",
  "typeset": "Design"
};
const impeccable23Names = Object.keys(impeccable23Categories);
function undoImpeccable23(text) {
 return text.replace(/<article class="skill-card"[^>]*aria-labelledby="skill-22">[\s\S]*?<\/article>/, card => {
  for (const name of impeccable23Names) {
   const rows = [...card.matchAll(/ <li>[^\n]*<\/li>\n/g)].filter(([row]) => row.startsWith(' <li><code class="inside-name">'+name+'</code>'));
   assert.equal(rows.length,1,'impeccable23 undo row '+name);
   card = card.replace(rows[0][0],'');
  }
  assert.ok(card.includes('Inside this repo — 23 commands'));
  return card.replace('Inside this repo — 23 commands','Inside this repo — 5 commands');
 });
}
// Cycle 2 snapshots captured before implementation; historical inputs undo only this pass.
const cycle2PriorScript = "'use strict';\n\nconst searchInput = document.querySelector('#search');\nconst clearSearch = document.querySelector('#clear-search');\nconst toggleInside = document.querySelector('#toggle-inside');\nconst insides = [...document.querySelectorAll('.skill-card details.inside')];\nconst filterButtons = [...document.querySelectorAll('[data-filter]')];\nconst chapters = [...document.querySelectorAll('.chapter')];\nconst cards = [...document.querySelectorAll('.skill-card')];\nconst resultsCount = document.querySelector('#results-count');\nconst emptyState = document.querySelector('#empty-state');\nconst resetButton = document.querySelector('#reset-filters');\n// Optional controls must never prevent unrelated features from initializing.\nfor (const [name, element] of Object.entries({ searchInput, clearSearch, toggleInside, resultsCount, emptyState, resetButton })) {\n  if (!element) console.warn(`Skills: missing ${name}; its feature will degrade gracefully.`);\n}\nlet selectedCategory = 'All skills';\nconst searchableCards = cards.map(card => {\n  const searchable = card.cloneNode(true);\n  searchable.querySelectorAll('.favourite-button, .item-favourite-button').forEach(button => button.remove());\n  searchable.querySelectorAll('.card-use').forEach(line => line.remove());\n  return { card, text: searchable.textContent.toLocaleLowerCase() };\n});\n\n// Favourites: begin\nconst toggleFavourites = document.querySelector('#toggle-favourites');\nconst favouriteButtons = [...document.querySelectorAll('.favourite-button')];\nconst validFavouriteIds = new Set(favouriteButtons.map(button => button.dataset.favouriteFor));\nlet favourites = new Set();\nlet favouritesOnly = false;\ntry {\n  const stored = JSON.parse(localStorage.getItem('topskills-favourites'));\n  if (Array.isArray(stored)) favourites = new Set(stored.filter(id => validFavouriteIds.has(id)));\n} catch (error) {\n  favourites = new Set();\n}\nfunction applyFavourite(button) {\n  const id = button.dataset.favouriteFor;\n  const title = document.querySelector('#' + id).textContent;\n  const pressed = favourites.has(id);\n  button.setAttribute('aria-pressed', String(pressed));\n  button.setAttribute('aria-label', pressed ? `Remove ${title} from favourites` : `Favourite ${title}`);\n  button.textContent = pressed ? '\u2605 Favourited' : '\u2606 Favourite';\n}\nfavouriteButtons.forEach(button => {\n  applyFavourite(button);\n  button.hidden = false;\n  button.addEventListener('click', () => {\n    const id = button.dataset.favouriteFor;\n    if (favourites.has(id)) favourites.delete(id); else favourites.add(id);\n    try {\n      localStorage.setItem('topskills-favourites', JSON.stringify([...favourites]));\n    } catch (error) {\n      favourites = new Set();\n    }\n    favouriteButtons.forEach(applyFavourite);\n    updateResults();\n  });\n});\ntoggleFavourites?.addEventListener('click', () => {\n  favouritesOnly = !favouritesOnly;\n  toggleFavourites.setAttribute('aria-pressed', String(favouritesOnly));\n  toggleFavourites.classList.toggle('active', favouritesOnly);\n  updateResults();\n});\nif (toggleFavourites) toggleFavourites.hidden = false;\n// Favourites: end\n\n// Item favourites: begin\nconst itemFavouriteButtons = [...document.querySelectorAll('.item-favourite-button')];\nconst validItemIds = new Set(itemFavouriteButtons.map(button => button.dataset.itemFavouriteFor));\nlet itemFavourites = new Set();\ntry {\n  const stored = JSON.parse(localStorage.getItem('topskills-item-favourites'));\n  if (Array.isArray(stored)) itemFavourites = new Set(stored.filter(id => validItemIds.has(id)));\n} catch (error) {\n  itemFavourites = new Set();\n}\nfunction hasFavouriteItem(card) {\n  return [...(card.querySelectorAll?.('.item-favourite-button') ?? [])].some(button => itemFavourites.has(button.dataset.itemFavouriteFor));\n}\nfunction revealItemFavourites(list) {\n  list.querySelectorAll?.('.item-favourite-button').forEach(button => {\n    const id = button.dataset.itemFavouriteFor;\n    const name = id.slice(id.indexOf(':') + 1);\n    const pressed = itemFavourites.has(id);\n    button.hidden = false;\n    button.textContent = pressed ? '\u2605' : '\u2606';\n    button.setAttribute('aria-pressed', String(pressed));\n    button.setAttribute('aria-label', pressed ? `Remove ${name} from favourites` : `Favourite ${name}`);\n    button.addEventListener('click', () => {\n      if (itemFavourites.has(id)) itemFavourites.delete(id); else itemFavourites.add(id);\n      try {\n        localStorage.setItem('topskills-item-favourites', JSON.stringify([...itemFavourites]));\n      } catch (error) {\n        itemFavourites = new Set();\n      }\n      updateResults();\n    });\n  });\n}\nfunction updateItemFavourites(terms) {\n  insideSearch.forEach(state => {\n    const { card, inside, list } = state;\n    if (favouritesOnly && !state.filteringFavourites) {\n      state.preFavouriteOpen = searchingInside ? state.preSearchOpen : inside.open;\n      state.filteringFavourites = true;\n    }\n    const itemsOnly = favouritesOnly && !favourites.has(card.querySelector('h3')?.id);\n    list.querySelectorAll?.('li').forEach(item => {\n      const button = item.querySelector('.item-favourite-button');\n      item.hidden = itemsOnly && !itemFavourites.has(button.dataset.itemFavouriteFor) &&\n        !(terms || []).some(term => item.textContent.toLocaleLowerCase().includes(term));\n    });\n    if (itemsOnly && !card.hidden) inside.open = true;\n    if (!favouritesOnly && state.filteringFavourites) {\n      inside.open = state.preFavouriteOpen;\n      if (searchingInside) state.preSearchOpen = state.preFavouriteOpen;\n      state.filteringFavourites = false;\n      if (searchingInside && !card.hidden && terms.some(term => list.textContent.toLocaleLowerCase().includes(term))) {\n        state.autoOpened = !inside.open;\n        inside.open = true;\n      }\n    }\n    revealItemFavourites(list);\n  });\n  updateInsideControl();\n}\n// Item favourites: end\n\nconst insideSearch = cards.map(card => {\n  try {\n    const inside = card.querySelector('details.inside');\n    const list = inside?.querySelector('.inside-list');\n    if (!inside || !list) throw new Error('missing Inside block or list');\n    const prose = ['.description', '.fit-use'].map(selector => card.querySelector(selector))\n      .filter(Boolean).map(element => ({ element, originalHTML: element.innerHTML }));\n    return { card, inside, list, originalHTML: list.innerHTML, prose, preSearchOpen: false, autoOpened: false };\n  } catch (error) {\n    console.warn('Skills: Inside search unavailable for a card.', error);\n    return null;\n  }\n}).filter(Boolean);\nlet searchingInside = false;\n\nfunction updateInsideSearch(terms) {\n  if (terms.length && !searchingInside) {\n    insideSearch.forEach(state => { state.preSearchOpen = state.inside.open; });\n  }\n  insideSearch.forEach(state => {\n    const { card, inside, list, originalHTML, preSearchOpen, prose } = state;\n    list.innerHTML = originalHTML;\n    prose.forEach(({ element, originalHTML }) => { element.innerHTML = originalHTML; });\n    if (!terms.length) {\n      if (searchingInside) inside.open = preSearchOpen;\n      state.autoOpened = false;\n      return;\n    }\n    if (card.hidden && state.autoOpened) {\n      inside.open = false;\n      state.autoOpened = false;\n    }\n    if (card.hidden) return;\n    if (terms.some(term => list.textContent.toLocaleLowerCase().includes(term))) {\n      if (!inside.open) state.autoOpened = true;\n      inside.open = true;\n    }\n    // Inside highlights stay within list items; prose is highlighted separately.\n    [list, ...prose.map(({ element }) => element)].forEach(target => {\n      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);\n      const nodes = [];\n      while (walker.nextNode()) {\n        if (!walker.currentNode.parentElement?.closest('button')) nodes.push(walker.currentNode);\n      }\n      nodes.forEach(node => {\n        const text = node.textContent;\n        const lower = text.toLocaleLowerCase();\n        const fragment = document.createDocumentFragment();\n        let start = 0;\n        let cursor = 0;\n        while (cursor < text.length) {\n          const term = terms.filter(term => lower.startsWith(term, cursor)).sort((a, b) => b.length - a.length)[0];\n          if (!term) { cursor++; continue; }\n          fragment.append(document.createTextNode(text.slice(start, cursor)));\n          const mark = document.createElement('mark');\n          mark.textContent = text.slice(cursor, cursor + term.length);\n          fragment.append(mark);\n          cursor += term.length;\n          start = cursor;\n        }\n        if (start) {\n          fragment.append(document.createTextNode(text.slice(start)));\n          node.replaceWith(fragment);\n        }\n      });\n    });\n  });\n  searchingInside = terms.length > 0;\n  updateInsideControl();\n}\n\nfunction updateResults() {\n  const query = searchInput?.value ?? '';\n  if (clearSearch) clearSearch.hidden = !searchInput || query.length === 0;\n  const terms = query.trim().toLocaleLowerCase().split(/\\s+/).filter(Boolean);\n  let count = 0;\n  searchableCards.forEach(({ card, text }) => {\n    const matchesCategory = selectedCategory === 'All skills' || card.dataset.category === selectedCategory;\n    const matchesFavourite = !favouritesOnly || favourites.has(card.querySelector('h3').id) || hasFavouriteItem(card);\n    const visible = matchesCategory && matchesFavourite && terms.every(term => text.includes(term));\n    card.hidden = !visible;\n    if (visible) count++;\n  });\n  updateInsideSearch(terms);\n  updateItemFavourites(terms);\n  chapters.forEach(chapter => {\n    const members = [...chapter.querySelectorAll('.skill-card')];\n    const firstVisible = members.find(card => !card.hidden);\n    members.forEach(card => card.classList.toggle('first-visible', card === firstVisible));\n    chapter.hidden = !members.some(card => !card.hidden);\n  });\n  if (resultsCount) resultsCount.textContent = `${count} ${count === 1 ? 'skill' : 'skills'} in the collection`;\n  if (emptyState) emptyState.hidden = count !== 0;\n}\n\nsearchInput?.addEventListener('input', updateResults);\nfilterButtons.forEach(button => {\n  button.addEventListener('click', () => {\n    selectedCategory = button.dataset.filter;\n    filterButtons.forEach(filter => {\n      const active = filter === button;\n      filter.classList.toggle('active', active);\n      filter.setAttribute('aria-pressed', String(active));\n    });\n    updateResults();\n  });\n});\n\nfunction resetFilters() {\n  favouritesOnly = false;\n  toggleFavourites?.setAttribute('aria-pressed', 'false');\n  toggleFavourites?.classList.toggle('active', false);\n  if (searchInput) searchInput.value = '';\n  selectedCategory = 'All skills';\n  filterButtons.forEach(button => {\n    const active = button.dataset.filter === selectedCategory;\n    button.classList.toggle('active', active);\n    button.setAttribute('aria-pressed', String(active));\n  });\n  updateResults();\n  searchInput?.focus();\n}\n\nresetButton?.addEventListener('click', resetFilters);\nclearSearch?.addEventListener('click', () => {\n  if (searchInput) searchInput.value = '';\n  updateResults();\n  searchInput?.focus();\n});\n\nfunction updateInsideControl() {\n  if (!toggleInside || !insides.length) return;\n  const scope = insideSearch.filter(({ card }) => !card.hidden);\n  toggleInside.disabled = scope.length === 0;\n  const allOpen = scope.length > 0 && scope.every(({ inside }) => inside.open);\n  toggleInside.textContent = allOpen ? 'Collapse all inside lists' : 'Expand all inside lists';\n  toggleInside.setAttribute('aria-expanded', String(allOpen));\n}\n\ntoggleInside?.addEventListener('click', () => {\n  const scope = insideSearch.filter(({ card }) => !card.hidden);\n  const open = !scope.every(({ inside }) => inside.open);\n  scope.forEach(state => {\n    state.inside.open = open;\n    state.autoOpened = false;\n    if (searchingInside) state.preSearchOpen = open;\n  });\n  updateInsideControl();\n});\ninsides.forEach(inside => inside.addEventListener('toggle', updateInsideControl));\ninsideSearch.forEach(state => {\n  state.inside.addEventListener('click', event => {\n    if (!event.target.closest('summary')) return;\n    state.autoOpened = false;\n    if (searchingInside) state.preSearchOpen = !state.inside.open;\n  });\n});\nfunction revealControls() {\n  if (searchInput) searchInput.disabled = false;\n  filterButtons.forEach(button => { button.hidden = false; });\n  if (toggleInside && insides.length) toggleInside.hidden = false;\n}\n\nrevealControls();\nupdateInsideControl();\nupdateResults();\n\n";
const cycle2Hashes = {"skills.json": "0f8700a5f2cecaa73eb639100fc4bdb7a773a67062834a919f4b880a3601b290", "llms.txt": "e7dda79605966d58e982e833dc32271086cd460f4a211cc27c8e755b86195553", "llms-full.txt": "8c76c03d19d1e256f8ba0f111ecb51f8676368edd2852e518b5db713ff3f3857", "README.md": "c0f012001c8c210cf9e7212410024227a0ea96c53ee06968936d4627f67023e6"};
const cycle2Note = '<p id="reveal-note" class="reveal-note" role="status" aria-live="polite"></p>';
const cycle2CSS = '.reveal-note{margin:0;font-size:var(--type-small);color:var(--muted)}\n.reveal-note:not(:empty){margin:var(--space-2) 0 0}\n.skill-card h3:focus-visible{outline:2px solid var(--ink);outline-offset:var(--underline-offset)}\n';
const undoCycle2JS = text => text
 .replace("const revealNote = document.querySelector('#reveal-note');\n", '')
 .replace("  if (revealNote) revealNote.textContent = '';\n", '')
 .replace(/\/\/ Cycle 2 reveal: begin[\s\S]*?\/\/ Cycle 2 reveal: end\n\n/, '')
 .replace("revealSkill(globalThis.location?.hash.slice(1) ?? '');\n", '');
// Cycle 3 expected data and reversible scope lock.
const c3Table = [
  {
    "id": "skill-1",
    "chapter": "Workflow",
    "oldNumber": "01",
    "newNumber": "01",
    "oldSummary": "Inside this repo \u2014 5 of 15 skills",
    "newSummary": "Inside this repo \u2014 5 of 15 skills",
    "shown": 5,
    "total": 15
  },
  {
    "id": "skill-2",
    "chapter": "Workflow",
    "oldNumber": "02",
    "newNumber": "02",
    "oldSummary": "Featured skills and commands",
    "newSummary": "Featured \u2014 5 skills and commands, total not stated",
    "shown": 5,
    "total": null
  },
  {
    "id": "skill-4",
    "chapter": "Workflow",
    "oldNumber": "04",
    "newNumber": "03",
    "oldSummary": "Inside this repo \u2014 27 skills",
    "newSummary": "Inside this repo \u2014 27 of 27 skills",
    "shown": 27,
    "total": 27
  },
  {
    "id": "skill-12",
    "chapter": "Workflow",
    "oldNumber": "12",
    "newNumber": "04",
    "oldSummary": "Inside this repo \u2014 5 core commands",
    "newSummary": "Inside this repo \u2014 5 of 5 core commands",
    "shown": 5,
    "total": 5
  },
  {
    "id": "skill-16",
    "chapter": "Workflow",
    "oldNumber": "16",
    "newNumber": "05",
    "oldSummary": "Inside this repo \u2014 1 skill, 4 commands",
    "newSummary": "Inside this repo \u2014 5 of 5 (1 skill, 4 commands)",
    "shown": 5,
    "total": 5
  },
  {
    "id": "skill-20",
    "chapter": "Workflow",
    "oldNumber": "20",
    "newNumber": "06",
    "oldSummary": "Inside this repo \u2014 23 playbooks",
    "newSummary": "Inside this repo \u2014 23 of 23 playbooks",
    "shown": 23,
    "total": 23
  },
  {
    "id": "skill-3",
    "chapter": "Quality",
    "oldNumber": "03",
    "newNumber": "01",
    "oldSummary": "Inside this repo \u2014 the only skill",
    "newSummary": "Inside this repo \u2014 1 of 1 skill",
    "shown": 1,
    "total": 1
  },
  {
    "id": "skill-8",
    "chapter": "Quality",
    "oldNumber": "08",
    "newNumber": "02",
    "oldSummary": "Inside this repo \u2014 5 of 25 skills",
    "newSummary": "Inside this repo \u2014 5 of 25 skills",
    "shown": 5,
    "total": 25
  },
  {
    "id": "skill-5",
    "chapter": "Design",
    "oldNumber": "05",
    "newNumber": "01",
    "oldSummary": "Inside this repo \u2014 5 of 7 skills",
    "newSummary": "Inside this repo \u2014 5 of 7 skills",
    "shown": 5,
    "total": 7
  },
  {
    "id": "skill-21",
    "chapter": "Design",
    "oldNumber": "21",
    "newNumber": "02",
    "oldSummary": "Inside this repo \u2014 the only skill",
    "newSummary": "Inside this repo \u2014 1 of 1 skill",
    "shown": 1,
    "total": 1
  },
  {
    "id": "skill-22",
    "chapter": "Design",
    "oldNumber": "22",
    "newNumber": "03",
    "oldSummary": "Inside this repo \u2014 23 commands",
    "newSummary": "Inside this repo \u2014 23 of 23 commands",
    "shown": 23,
    "total": 23
  },
  {
    "id": "skill-6",
    "chapter": "Efficiency",
    "oldNumber": "06",
    "newNumber": "01",
    "oldSummary": "Featured skills and commands",
    "newSummary": "Featured \u2014 5 skills and commands, total not stated",
    "shown": 5,
    "total": null
  },
  {
    "id": "skill-7",
    "chapter": "Knowledge",
    "oldNumber": "07",
    "newNumber": "01",
    "oldSummary": "Inside this repo \u2014 1 skill, 4 subcommands",
    "newSummary": "Inside this repo \u2014 5 of 5 (1 skill, 4 subcommands)",
    "shown": 5,
    "total": 5
  },
  {
    "id": "skill-9",
    "chapter": "Knowledge",
    "oldNumber": "09",
    "newNumber": "02",
    "oldSummary": "Inside this repo \u2014 5 of 9 skills",
    "newSummary": "Inside this repo \u2014 5 of 9 skills",
    "shown": 5,
    "total": 9
  },
  {
    "id": "skill-11",
    "chapter": "Knowledge",
    "oldNumber": "11",
    "newNumber": "03",
    "oldSummary": "Inside this repo \u2014 5 of 19 skills",
    "newSummary": "Inside this repo \u2014 5 of 19 skills",
    "shown": 5,
    "total": 19
  },
  {
    "id": "skill-14",
    "chapter": "Knowledge",
    "oldNumber": "14",
    "newNumber": "04",
    "oldSummary": "Inside this repo \u2014 5 of 6 skills",
    "newSummary": "Inside this repo \u2014 5 of 6 skills",
    "shown": 5,
    "total": 6
  },
  {
    "id": "skill-19",
    "chapter": "Knowledge",
    "oldNumber": "19",
    "newNumber": "05",
    "oldSummary": "Featured inside this catalog",
    "newSummary": "Featured \u2014 5 skills, total not stated",
    "shown": 5,
    "total": null
  },
  {
    "id": "skill-10",
    "chapter": "Discovery",
    "oldNumber": "10",
    "newNumber": "01",
    "oldSummary": "Featured inside this catalog",
    "newSummary": "Featured \u2014 5 skills, total not stated",
    "shown": 5,
    "total": null
  },
  {
    "id": "skill-13",
    "chapter": "Discovery",
    "oldNumber": "13",
    "newNumber": "02",
    "oldSummary": "Featured inside this catalog",
    "newSummary": "Featured \u2014 5 entries, total not stated",
    "shown": 5,
    "total": null
  },
  {
    "id": "skill-15",
    "chapter": "Discovery",
    "oldNumber": "15",
    "newNumber": "03",
    "oldSummary": "5 first-party plugins",
    "newSummary": "Featured \u2014 5 plugins, total not stated",
    "shown": 5,
    "total": null
  },
  {
    "id": "skill-17",
    "chapter": "Discovery",
    "oldNumber": "17",
    "newNumber": "04",
    "oldSummary": "Featured inside this catalog",
    "newSummary": "Featured \u2014 5 skills, total not stated",
    "shown": 5,
    "total": null
  },
  {
    "id": "skill-18",
    "chapter": "Discovery",
    "oldNumber": "18",
    "newNumber": "05",
    "oldSummary": "Inside this repo \u2014 5 of 401 skills",
    "newSummary": "Featured \u2014 5 skills, total not stated",
    "shown": 5,
    "total": null
  }
];
const c3OldDescription = "A collection of 380 Claude Code skills and plugins for engineering, product, research, and more.";
const c3NewDescription = "A collection of Claude Code skills and plugins for engineering, product, research, and more.";
const c3OldProse = "Turns a grilled understanding into a written specification, with implementation seams agreed up front before tickets are cut. (Source: skills/engineering/to-spec/SKILL.md, description + Process steps 2\u20133; orchestrator-verified 2026-10-29.)";
const c3NewProse = "Turns a grilled understanding into a written specification, with implementation seams agreed up front before tickets are cut.";
const c3Hashes = {"script.js": "d5147d5a2676b9c13d0abf07ccbc8e3a4eb6c4b5e2df6555e4174c46be295e9e", "styles.css": "94dd8540f645e2328994d0bc972cadf93fa65bf0beb1163a545bbd7fc9bd653c", "README.md": "c0f012001c8c210cf9e7212410024227a0ea96c53ee06968936d4627f67023e6", "skills.json": "0f8700a5f2cecaa73eb639100fc4bdb7a773a67062834a919f4b880a3601b290", "llms.txt": "e7dda79605966d58e982e833dc32271086cd460f4a211cc27c8e755b86195553", "llms-full.txt": "8c76c03d19d1e256f8ba0f111ecb51f8676368edd2852e518b5db713ff3f3857"};

const c3Read = name => fs.readFileSync(path.join(root,name),'utf8');
const c3Pre = fs.readFileSync(path.join(__dirname,'fixtures/cycle3-pre.index.html'),'utf8');
const c3HTML = c3Read('index.html');
for(const [title,items] of promptMap){const card=c3Pre.match(/<article class="skill-card"[^>]*>[\s\S]*?<\/article>/g).find(c=>c.includes('>'+title+'</h3>'));for(const name of items.keys())if(!card?.includes('<code class="inside-name">'+name+'</code>'))items.delete(name);}
function c3Transform(text, reverse = false) {
 return text.replace(/<article class="skill-card"[^>]*>[\s\S]*?<\/article>/g, card => {
  const row=c3Table.find(r=>card.includes('<h3 id="'+r.id+'">'));
  const from=reverse?'new':'old',to=reverse?'old':'new';
  return card.replace('<span class="number">'+row[from+'Number']+'</span>','<span class="number">'+row[to+'Number']+'</span>')
   .replace('<summary>'+row[from+'Summary'],'<summary>'+row[to+'Summary'])
   .replace(reverse?c3NewDescription:c3OldDescription,reverse?c3OldDescription:c3NewDescription)
   .replace(reverse?c3NewProse:c3OldProse,reverse?c3OldProse:c3NewProse);
 });
}

// Earlier-cycle gates replay their exact input after the C3 scope lock reverses this cycle.
const cycle1HTML = c3Transform(c3HTML,true);
const undoCycle1HTML = text => text
 .replace(/<section class="start-strip"[\s\S]*?<\/section>\n<section class="how-to"[\s\S]*?<\/section>\n(?=<section tabindex="-1" id="collection")/,'')
 .replace(/<p class="card-use">[\s\S]*?<\/p>(?=<a href=)/g,'');
const shippedHTML = undoCycle1HTML(cycle1HTML.replace(cycle2Note+"\n", ""));
const cycle1Styles = fs.readFileSync(path.join(root,'styles.css'),'utf8');
const undoCycle1CSS = text => { const i=text.indexOf('\n.start-strip,.how-to{'); return i<0 ? text : text.slice(0,i); };

const shippedCategoryHTML = shippedHTML.replace(/ <button type="button" class="item-favourite-button"[^>]*>☆<\/button>/g,'');
const historicalAgentOutputs = require('./generate-agent-layer').generate(undoPstack23(undoImpeccable23(shippedHTML)),'https://topskillsfordevelopment.vercel.app');

// UIUX undo layer: reverse ONLY this pass before undoPolish3 in every pipeline.
const uiuxEdits = {
  "styles.css": [
    {
      "before": "h2{font:normal var(--type-entry)/var(--type-entry-leading) var(--serif);",
      "after": "h2,.skill-card h3{font:normal var(--type-entry)/var(--type-entry-leading) var(--serif);"
    },
    {
      "before": ".filter.active{",
      "after": ".filter:disabled{cursor:default;color:var(--muted)}\n.filter:disabled:hover{text-decoration:none}\n.filter.active{"
    },
    {
      "before": ".header-inner{min-height:var(--header-height);display:flex;justify-content:space-between;align-items:center}",
      "after": ".header-inner{min-height:var(--header-height);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-2)}"
    },
    {
      "before": ".inside-name{font-family:var(--mono);font-size:var(--type-mono);color:var(--ink)}",
      "after": ".inside-name{font-family:var(--mono);font-size:var(--type-mono);color:var(--ink);overflow-wrap:anywhere}"
    },
    {
      "before": "summary::-webkit-details-marker{display:none}",
      "after": "summary:hover{text-decoration:underline}\nsummary::-webkit-details-marker{display:none}"
    }
  ],
  "script.js": [
    {
      "before": "  toggleFavourites.setAttribute('aria-pressed', String(favouritesOnly));",
      "after": "  toggleFavourites.setAttribute('aria-pressed', String(favouritesOnly));\n  toggleFavourites.classList.toggle('active', favouritesOnly);"
    },
    {
      "before": "  toggleFavourites?.setAttribute('aria-pressed', 'false');",
      "after": "  toggleFavourites?.setAttribute('aria-pressed', 'false');\n  toggleFavourites?.classList.toggle('active', false);"
    }
  ],
  "index.html": [
    {
      "before": "Try another search or explore a different category.",
      "after": "Try another search or explore a different chapter."
    }
  ]
};
function undoUiux(name, text) {
 for (const {before, after} of [...uiuxEdits[name]].reverse()) {
  assert.ok(text.includes(after), 'Missing uiux edit in ' + name);
  text = text.replace(after, before);
 }
 return text;
}

// Polish3: reverse only this pass before every historical comparison.
const polish3Edits = {
  "index.html": [
    {
      "before": 'aria-label="Filter skills by category"',
      "after": 'aria-label="Filter skills by chapter"'
    }
  ],
  "styles.css": [
    {
      "before": ".card-meta{display:flex;align-items:center;gap:var(--space-1);font-size:var(--type-label);color:var(--muted);white-space:nowrap}\n",
      "after": ".card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-1);font-size:var(--type-label);color:var(--muted);white-space:normal}\n"
    },
    {
      "before": "h2,.skill-card h3{font:normal var(--type-entry)/var(--type-entry-leading) var(--serif);letter-spacing:0;margin:var(--space-3) 0 var(--space-2);overflow-wrap:anywhere}\n",
      "after": "h2{font:normal var(--type-entry)/var(--type-entry-leading) var(--serif);letter-spacing:0;margin:var(--space-3) 0 var(--space-2);overflow-wrap:anywhere}\n"
    },
    {
      "before": "button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:5px}\n",
      "after": "button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:var(--underline-offset)}\n"
    },
    {
      "before": "  .skill-grid:has(> article:only-child) :is(.description,.fit p,.inside-list li,.inside-note,.top-inside){max-width:62ch}\n",
      "after": "  .skill-grid:has(> article:only-child) :is(.description,.fit p,.top-inside){max-width:62ch}\n  .skill-grid:has(> article:not([hidden])):not(:has(> article:not([hidden]) ~ article:not([hidden]))) > article{grid-column:1 / -1}\n  .skill-grid:has(> article:not([hidden])):not(:has(> article:not([hidden]) ~ article:not([hidden]))) :is(.description,.fit p,.top-inside){max-width:62ch}\n"
    },
    {
      "before": ".card-meta{flex-wrap:wrap;white-space:normal}\n  .container,.header-inner,.site-footer>div{width:calc(100% - calc(var(--space-4) + var(--space-1) / 2))}\n",
      "after": "  .container,.header-inner,.site-footer>div{width:calc(100% - calc(var(--space-4) + var(--space-1) / 2))}\n"
    },
    {
      "before": ".item-favourite-button{padding:0 var(--space-1);border:0;background:none;font-family:var(--mono);font-size:var(--type-mono);color:var(--muted)}\n",
      "after": ".item-favourite-button{display:inline-flex;align-items:center;justify-content:center;min-height:24px;min-width:24px;padding:0 var(--space-1);border:0;background:none;font-family:var(--mono);font-size:var(--type-mono);color:var(--muted)}\n"
    },
    {
      "before": "",
      "after": "\n.favourite-button:hover,.item-favourite-button:hover{color:var(--ink)}\n"
    }
  ],
  "script.js": [
    {
      "before": "      item.hidden = itemsOnly && !itemFavourites.has(button.dataset.itemFavouriteFor);\n",
      "after": "      item.hidden = itemsOnly && !itemFavourites.has(button.dataset.itemFavouriteFor) &&\n        !(terms || []).some(term => item.textContent.toLocaleLowerCase().includes(term));\n"
    },
    {
      "before": "",
      "after": "  toggleInside.disabled = scope.length === 0;\n"
    }
  ]
};
function undoPolish3(name, text) {
 for (const {before, after} of [...polish3Edits[name]].reverse()) {
  assert.ok(text.includes(after), 'Missing polish3 edit in ' + name);
  text = text.replace(after, before);
 }
 return text;
}

// Exact edit reversals preserve every historical comparison against its original surface.
function undoItemFavourites(name, text) {
 for(const edit of [...densityBaseline.itemFavouritesBefore[name].edits].reverse()) {
  assert.ok(text.includes(edit.after), 'Missing authorised item edit in '+name);
  text=text.replace(edit.after,edit.before);
 }
 assert.equal(sha256(text),densityBaseline.itemFavouritesBefore[name].sha256);
 return text;
}


// Reverse only the spec-authorised favourites additions for historical comparisons.
const undoFavouritesHTML = text => text
 .replace(/<button type="button" class="favourite-button" hidden data-favourite-for="skill-\d+" aria-pressed="false" aria-label="Favourite [^"]+">☆ Favourite<\/button>/g,'')
 .replace('<button type="button" class="filter" id="toggle-favourites" hidden aria-pressed="false">Favourites</button>','')
 .replace('search and filter and favourite.','search and filter.');
const favouriteCSS = '.favourite-button{padding:0;min-height:var(--touch);border:0;background:none;color:var(--muted)}\n.favourite-button[aria-pressed="true"]{color:var(--ink)}\n';
const undoFavouritesCSS = text => text.replace(favouriteCSS,'');
const undoFavouritesJS = text => text
 .replace(/\/\/ Favourites: begin[\s\S]*?\/\/ Favourites: end\n\n/,'')
 .replace(/const searchableCards = cards.map\(card => \{[\s\S]*?\n}\);/,"const searchableCards = cards.map(card => ({ card, text: card.textContent.toLocaleLowerCase() }));")
 .replace("    const matchesFavourite = !favouritesOnly || favourites.has(card.querySelector('h3').id);\n",'')
 .replace('matchesCategory && matchesFavourite &&','matchesCategory &&')
 .replace("  favouritesOnly = false;\n  toggleFavourites?.setAttribute('aria-pressed', 'false');\n",'');

// Historical gates retain their original byte comparisons after undoing only M1–M4/S1–S4.
const monoStack='ui-monospace,SFMono-Regular,Consolas,monospace';
const polishTokens={'--mono':monoStack,'--underline-offset':'5px','--underline-thickness':'2px','--leading-relaxed':'1.8','--tracking-tight':'-.01em'};
const undoPolishHTML = text => text.replace('available above','available below')
 .replace(/<article class="skill-card"[^>]*aria-labelledby="skill-15">[\s\S]*?<\/article>/,card=>card.replace('top-inside-label">Featured:', 'top-inside-label">Top inside:'))
 .replace(/(<span class="inside-kind">)\((command|subcommand)\)(<\/span>)/g,'$1$2$3');
const undoPolishCSS = text => {
 for(const [name,value] of Object.entries(polishTokens))text=text.replace(';'+name+':'+value,'').replaceAll('var('+name+')',value);
 text=text.replace('  .skill-grid > .skill-card.first-visible::before{border-top:0}\n','');
 text=text.replace('  .skill-grid{grid-template-columns:1fr;gap:var(--space-2)}\n','  .skill-grid{grid-template-columns:1fr;gap:var(--space-2)}\n  .skill-card{padding:var(--space-3) var(--space-3) 0}\n');
 return text.replace('.fit{margin:var(--space-3) 0}', '.fit { margin: var(--space-3) 0; }')
 .replace('.fit p{margin:0;font-size:var(--type-small);line-height:var(--type-prose-leading);color:var(--body)}','.fit p { margin: 0; font-size: var(--type-small); line-height: var(--type-prose-leading); color: var(--body); }')
 .replace('.fit strong{font-weight:600;color:var(--ink)}','.fit strong { font-weight: 600; color: var(--ink); }');
};

const itemHTML = undoPolish3('index.html', undoUiux('index.html', undoPstack23(undoImpeccable23(shippedHTML))));
const categoryHTML = undoItemFavourites('index.html', itemHTML);
// Historical copy gates compare the original surface after removing only the authorized additions.
const stripCategories = value => value.replace(/ <span class="item-category">[^<]*<\/span>/g, '');
const html = stripCategories(undoPolishHTML(undoFavouritesHTML(categoryHTML)));
const categoryCSSRule = '.item-category{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--type-mono);color:var(--muted)}';
const itemStyles = undoPolish3('styles.css', undoUiux('styles.css', undoCycle1CSS(cycle1Styles)));
const categoryStyles = undoItemFavourites('styles.css', itemStyles);
const styles = undoPolishCSS(undoFavouritesCSS(categoryStyles)).replace(categoryCSSRule+'\n','');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const sourcePreCycle1 = undoCycle2JS(source).replace("  searchable.querySelectorAll('.card-use').forEach(line => line.remove());\n",'');
const historicalSource = undoFavouritesJS(undoItemFavourites('script.js', undoPolish3('script.js', undoUiux('script.js', sourcePreCycle1))));
const before = fs.readFileSync(path.join(__dirname, 'fixtures/before/index.html'), 'utf8');
const beforeCSS = fs.readFileSync(path.join(__dirname, 'fixtures/before/styles.css'), 'utf8');
const beforeJS = fs.readFileSync(path.join(__dirname, 'fixtures/before/script.js'), 'utf8');
const starSnapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/before/footer-stars.json'), 'utf8'));
const copy = fs.readFileSync(path.join(__dirname, 'fixtures/copy.md'), 'utf8');
const uses = fs.readFileSync(path.join(__dirname, 'fixtures/when-avoid-copy.md'), 'utf8');
const getCards = text => [...text.matchAll(/<article class="skill-card" data-category="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
const articles = getCards(html), categoryArticles = getCards(undoPolishHTML(undoFavouritesHTML(categoryHTML))), originals = getCards(before);
const failures = [];
function gate(name, fn) { try { fn(); console.log('PASS ' + name); } catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL ' + name + ': ' + e.message); } }
const copyPath = path.join(__dirname, 'fixtures/lists.md');
const approvedCopy = fs.readFileSync(copyPath, 'utf8');
const expectedInside = [...approvedCopy.matchAll(/^### (.+?) — summary: "([^"]+)"([^\n]*)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(([, title, summary, annotations, body]) => ({
  title, summary, note: annotations.match(/note: "([^"]+)"/)?.[1],
  items: [...body.matchAll(/^\d+\. `([^`]+)`[^\n]*? — (.+)$/gm)].map(([, name, fn]) => ({ name, fn })),
}));
expectedInside.splice(9,0,...newCards);
expectedInside.splice(expectedInside.findIndex(c=>c.title==='Scientific Agent Skills'),1);
const mattExpected = expectedInside.find(c=>c.title==='Matt Pocock Skills');
mattExpected.items.push(...mattRemaining);
mattExpected.summary='Inside this repo — 27 skills';
assert.equal(expectedInside.length, 22, 'Approved copy must cover all 22 cards');
const shippedExpectedInside = structuredClone(expectedInside);
assert.equal(shippedExpectedInside.reduce((n, card) => n + card.items.length, 0), 160);
const historicalImpeccable = expectedInside.find(c=>c.title==='Impeccable');
historicalImpeccable.items = historicalImpeccable.items.filter(i=>!impeccable23Names.includes(i.name));
historicalImpeccable.summary='Inside this repo — 5 commands';
const historicalPstack = expectedInside.find(c=>c.title==='pstack');
historicalPstack.items = historicalPstack.items.filter(i=>!pstack23Names.includes(i.name));
historicalPstack.summary='Inside this repo — 5 of 23 playbooks';
assert.equal(expectedInside.reduce((n, card) => n + card.items.length, 0), 124);
const decodeHTML = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) =>
  key[0] === '#' ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1))) :
    ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' })[key.toLowerCase()]);
const renderedText = markup => decodeHTML(markup.replace(/<[^>]*>/g, '')).trim();

const field = (markup, cls, tag = 'p') => markup.match(new RegExp('<' + tag + ' class="' + cls + '"[^>]*>[\\s\\S]*?</' + tag + '>'))?.[0];
const words = text => decodeHTML(text.replace(/<[^>]*>/g, ' ')).trim().split(/\s+/).filter(Boolean).length;
const c3Cards = getCards(c3HTML);
const c3Card = (id,text=c3HTML) => getCards(text).find(a=>a[2].includes('<h3 id="'+id+'">'))[2];
const c3Summary = c => renderedText(c.match(/<summary>([\s\S]*?)<\/summary>/)[1].replace(/<svg[\s\S]*?<\/svg>/,''));
const c3Attrs = (t,name) => [...t.matchAll(new RegExp(name+'="([^"]+)"','g'))].map(m=>m[1]);
const c3Rows = c => [...c.matchAll(/<li>[\s\S]*?<\/li>/g)].map(m=>m[0]);

const densities = categoryArticles.map(([, , c]) => ({title: renderedText(c.match(/<h3[^>]*>(.*?)<\/h3>/)[1]), visible: words(c.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g, '$1')), expanded: words(c)}));
console.table(densities);
for (const kind of ['visible', 'expanded']) console.log(kind, {max:Math.max(...densities.map(c=>c[kind])), total:densities.reduce((n,c)=>n+c[kind],0), mean:densities.reduce((n,c)=>n+c[kind],0)/22});

const categorySource = fs.readFileSync(path.join(os.homedir(),'workspace/workflow-run-categorise/categories.md'),'utf8');
const shippedCategoryAssignments = [...categorySource.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| (?:Confident|Borderline) \|/gm)].map(([,card,item,category])=>[card.trim(),item.trim(),category.trim()]).filter(([title,name])=>{ const card=c3Pre.match(/<article class="skill-card"[^>]*>[\s\S]*?<\/article>/g).find(c=>c.includes('>'+title+'</h3>')); return card?.includes('<code class="inside-name">'+name+'</code>'); });
runCycle2();
assert.equal(shippedCategoryAssignments.length,160);
const categoryAssignments = shippedCategoryAssignments.filter(([card,item])=>(card!=='pstack'||!pstack23Names.includes(item))&&(card!=='Impeccable'||!impeccable23Names.includes(item)));
const shippedPromptMap = new Map([...promptMap].map(([title,items])=>[title,new Map(items)]));
assert.equal([...shippedPromptMap.values()].reduce((n,items)=>n+items.size,0),160);
for(const name of pstack23Names) promptMap.get('pstack').delete(name);
for(const name of impeccable23Names) promptMap.get('Impeccable').delete(name);
const allowedCategories = new Set(['Planning','Building','Testing','Debugging','Review','Understanding','Research','Writing','Design','Communication','Setup','Discovery']);
gate('Inside category inventory, source pairs, exact addition scope and CSS',()=>{
 const expected=new Map(categoryAssignments.map(([card,item,category])=>[JSON.stringify([card,item]),category]));
 assert.equal(categoryAssignments.length,124);assert.equal(expected.size,124);
 const actual=new Map();let count=0;
 for(const [,,card] of categoryArticles){
  const title=renderedText(card.match(/<h3[^>]*>(.*?)<\/h3>/)[1]);
  for(const [item] of card.matchAll(/<li>[\s\S]*?<\/li>/g)){
   const tags=[...item.matchAll(/<span class="item-category">([^<]*)<\/span>/g)];assert.equal(tags.length,1);
   assert.match(item,/<code class="inside-name">[^<]+<\/code> <span class="item-category">/);
   const name=renderedText(item.match(/<code class="inside-name">([^<]+)<\/code>/)[1]);
   const key=JSON.stringify([title,name]);assert.ok(!actual.has(key),'Duplicate pair '+key);
   assert.ok(allowedCategories.has(tags[0][1]));actual.set(key,tags[0][1]);count++;
  }
 }
 assert.equal(count,124);assert.equal((categoryHTML.match(/class="item-category"/g)||[]).length,count);
 assert.deepEqual(actual,expected,'0 missing / extra source pairs and exact categories');
 assert.equal(sha256(html),densityBaseline.categoryAdditionBaseline.html,'Only category spans may change HTML');
 assert.equal((categoryStyles.match(/\.item-category\s*\{/g)||[]).length,1);
 assert.equal(sha256(styles),densityBaseline['styles.css'],'Only the one exact category rule may change CSS');
 assert.equal(sha256(require('./generate-agent-layer').generate(cycle1HTML,'https://topskillsfordevelopment.vercel.app')['llms.txt']),densityBaseline.categoryAdditionBaseline.short);
 for(const kind of ['visible','expanded']){
  const prior=densityBaseline.categoryAdditionBaseline[kind];
  const measured=densities.reduce((n,c)=>n+c[kind],0);
  assert.equal(measured-prior,kind==='visible'?0:categoryAssignments.length);
 }
});

gate('1 density budgets', () => { for (const [kind,max,total,mean] of Object.entries(densityBaseline.budgets).map(([kind,b])=>[kind,b.max,b.total,b.mean])) { assert.ok(densities.every(c=>c[kind]<=max)); const sum=densities.reduce((n,c)=>n+c[kind],0); assert.equal(sum,total); assert.equal(Math.max(...densities.map(c=>c[kind])),max); assert.ok(sum/22<=mean); } });
gate('1b per-card expanded budgets', () => {
 const expected = densityBaseline.expanded;
 assert.deepEqual(densities.map(c=>c.expanded), expected);
});
gate('removal scope, numbering and counts', () => {
 for(const name of ['index.html','skills.json','llms.txt','llms-full.txt']) assert.doesNotMatch(fs.readFileSync(path.join(root,name),'utf8'),/Scientific|scientific-agent-skills|EGFR|scanpy|rdkit/i,name);
 assert.deepEqual(articles.map(a=>Number(a[0].match(/aria-labelledby="skill-(\d+)"/)[1])).sort((a,b)=>a-b),Array.from({length:22},(_,i)=>i+1));
 for(const [,,card] of articles){const id=card.match(/<h3 id="([^"]+)"/)[1],r=c3Table.find(r=>r.id===id);assert.equal(renderedText(field(card,'number','span')),r.oldNumber);assert.equal(renderedText(field(c3Card(id),'number','span')),r.newNumber);}
 assert.equal(articles.filter(a=>a[1]==='Knowledge').length,5);
 assert.ok(html.includes('Knowledge (5)')); assert.ok(html.includes('Knowledge <span>(5)</span>'));
 assert.match(html,/Star counts are a snapshot supplied for 29 Oct 2026\./);
});
gate('Matt full promoted list, exact original bytes and excluded skills',()=>{
 const card=articles.find(a=>a[0].includes('aria-labelledby="skill-4"'))[0];
 const original=densityBaseline.originalMattCard;
 const list=c=>[...c.matchAll(/<li>[\s\S]*?<\/li>/g)].map(m=>m[0]);
 const actual=list(card), prior=list(original);
 assert.equal(actual.length,27);
 assert.deepEqual(actual.slice(0,5),prior);
 const names=actual.map(i=>i.match(/inside-name">([^<]+)/)[1]);
 assert.equal(new Set(names).size,27);
 assert.deepEqual(names.slice(5),mattRemaining.map(i=>i.name));
 for(const [i,item] of mattRemaining.entries())assert.equal(actual[i+5],'<li><code class="inside-name">'+item.name+'</code> — '+item.fn+'<p class="example-prompt">'+item.prompt+'</p></li>');
 const outside=c=>c.replace(/<details class="inside">[\s\S]*?<\/details>/,'');
 assert.equal(outside(card),outside(original));
 assert.deepEqual(articles.filter(a=>!a[0].includes('aria-labelledby="skill-4"')).map(a=>sha256(a[0])),densityBaseline.protectedCards);
 const excluded=['chief-of-staff','claude-handoff','loop-me','setup-ts-deep-modules','writing-beats','writing-fragments','writing-shape','git-guardrails-claude-code','migrate-to-shoehorn','scaffold-exercises','setup-pre-commit'];
 for(const name of ['index.html','skills.json','llms.txt','llms-full.txt'])for(const skill of excluded)assert.ok(!fs.readFileSync(path.join(root,name),'utf8').includes(skill),name+' excludes '+skill);
});
gate('2 inventory and order', () => {
 assert.equal(articles.length,22);
 assert.equal((html.match(/<p class="example-prompt">/g)||[]).length,124);
 for(const [, , c] of articles) { const positions=['<div class="card-meta">','<h3','<p class="top-inside">','<p class="description">','<div class="fit">','<details class="inside"','<div class="card-footer">'].map(x=>c.indexOf(x)); assert.ok(positions.every((p,i)=>p>=0&&(!i||p>positions[i-1]))); assert.equal((c.match(/<details\b/g)||[]).length,1); }
 for(const cls of ['top-inside','inside','inside-list']) assert.equal((html.match(new RegExp('class="'+cls+'"','g'))||[]).length,22);
 assert.equal((html.match(/<li><code class="inside-name">/g)||[]).length,124);
 for(const file of [html,styles,source]) assert.doesNotMatch(file, /(?:class="(?:guide|prompt|copy-button)|\.(?:guide|prompt(?!-background)|copy-button)\b|toggle-guides|copy-prompt|copyStatus|updateGuideControl)/);
});
gate('3 protected copy and approved sources', () => {
 for(const [index,[,,markup]] of articles.entries()) {
 const expected=expectedInside[index]; if(expected.number) continue; const original=originals.find(a=>a[2].includes('>'+expected.title+'</h3>'))[2]; const inside=markup.match(/<details class="inside"[^>]*>([\s\S]*?)<\/details>/)[1];
 assert.equal(decodeHTML(field(markup,'description')),decodeHTML(field(original,'description')));
 assert.equal(decodeHTML(field(markup,'fit-use')),decodeHTML(field(original,'fit-use')));
 const use=uses.match(new RegExp('## '+expected.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\n\\nUse when: ([^\\n]+)'));
 assert.ok(use,expected.title); assert.equal(renderedText(field(markup,'fit-use')).replace(/^Use when /,''),use[1]);
 const originalInside = original.match(/<details class="inside"[^>]*>([\s\S]*?)<\/details>/)[1];
 const restoredInside = expected.title==='Matt Pocock Skills' ? inside.replace(/ <li>[^\n]*<\/li>\n/g,(line)=>mattRemaining.some(i=>line.startsWith(' <li><code class="inside-name">'+i.name+'</code>'))?'':line).replace('Inside this repo — 27 skills','Inside this repo — 5 of 31 skills') : inside;
 assert.equal(decodeHTML(restoredInside.replace(/<p class="example-prompt">[^<]*<\/p>/g, '')),decodeHTML(originalInside));
 assert.equal(renderedText(inside.match(/<summary>([\s\S]*?)<\/summary>/)[1]),expected.summary);
  const summary = renderedText(inside.match(/<summary>([\s\S]*?)<\/summary>/)[1]);
  const items = [...inside.matchAll(/<li>([\s\S]*?)<\/li>/g)];
  assert.equal(items.length, expected.items.length);
  assert.doesNotMatch(inside, /<a\b|<h[1-6]\b/);
  items.forEach(([, item], itemIndex) => {
    const name = item.match(/^<code class="inside-name">([\s\S]*?)<\/code> — ([\s\S]*)$/);
    assert.ok(name, 'Name, em dash, function markup');
    assert.equal(decodeHTML(name[1]), expected.items[itemIndex].name);
    assert.equal(renderedText(name[2].replace(/<p class="example-prompt">[^<]*<\/p>$/, '').replace(/\s*<span class="inside-kind">[^<]*<\/span>$/, '')), expected.items[itemIndex].fn);
    const kind = item.match(/<span class="inside-kind">([^<]+)<\/span>/)?.[1];
    const expectedKind = itemIndex > 0 ? ({ 'Vercel Skills': 'command', Graphify: 'subcommand' })[expected.title] : undefined;
    assert.equal(kind, expectedKind);
  });
  if (expected.title === 'Matt Pocock Skills') {
    assert.ok(expected.items.some(item => item.name === 'to-spec'));
    assert.ok(items.some(([, item]) => renderedText(item.match(/<code[^>]*>(.*?)<\/code>/)[1]) === 'tdd'));
  }
  const notes = [...inside.matchAll(/<p class="inside-note">([\s\S]*?)<\/p>/g)];
  assert.deepEqual(notes.map(([, note]) => renderedText(note)), expected.note ? [expected.note] : []);
  if (expected.note) {
    assert.match(renderedText(notes[0][1]), /not the whole catalog/);
    assert.doesNotMatch(summary, /\bof \d/);
  }
  if (['Vercel Skills', 'Graphify', 'Spec Kit'].includes(expected.title)) assert.doesNotMatch(summary, /\bskills\b/);

 }
 const pstack=expectedInside.find(c=>c.title==='pstack'); assert.ok(pstack.items.some(i=>i.name==='bug-fix')); assert.ok(pstack.items.some(i=>i.name==='perf-issue'));
});

gate('prompt inventory, mapping, hygiene and exact change scope', () => {
 assert.equal(promptMap.size,22);
 assert.equal([...promptMap.values()].reduce((n,items)=>n+items.size,0),124);
 const actualPrompts=[];
 for(const [i,[,,card]] of articles.entries()) {
  const title=densities[i].title;
  const expected=promptMap.get(title); assert.ok(expected, title);
  const inside=card.match(/<details class="inside"[^>]*>([\s\S]*?)<\/details>/)[1];
  const items=[...inside.matchAll(/<li>([\s\S]*?)<\/li>/g)];
  assert.deepEqual(items.map(([,item])=>decodeHTML(item.match(/<code class="inside-name">([^<]+)<\/code>/)[1])), [...expected.keys()], title+' item order');
  for(const [,item] of items) {
   const name=decodeHTML(item.match(/<code class="inside-name">([^<]+)<\/code>/)[1]);
   const matches=[...item.matchAll(/<p class="example-prompt">([^<]*)<\/p>/g)];
   assert.equal(matches.length,1,title+' / '+name+' prompt count');
   const prompt=decodeHTML(matches[0][1]);
   assert.ok(Buffer.from(prompt).equals(Buffer.from(expected.get(name))),title+' / '+name+' decoded bytes differ');
   assert.ok(item.endsWith(matches[0][0]), title+' / '+name+' prompt must be last');
   assert.doesNotMatch(prompt,/\bexample\.(?:com|org|net)\b|\b(?:localhost|your-domain|placeholder)\b/i);
   actualPrompts.push(prompt);
  }
  assert.doesNotMatch(inside,/<(?:button|input|a|select|textarea)\b|\b(?:tabindex|onclick|contenteditable)=/i);
  assert.equal((card.match(/class="example-prompt"/g)||[]).length,items.length);
 }
 assert.equal(actualPrompts.length,124); assert.equal(new Set(actualPrompts).size,124);
 assert.equal((html.match(/class="example-prompt"/g)||[]).length,124);
 assert.doesNotMatch(html,/\b(?:UNCONFIRMED|illustrative|not repo-quoted|research.note|Grade:\s*(?:Verified|Crafted)|Source:\s*https?:|example\.(?:com|org|net))\b/i);
 let restored=html;
 restored=restored.replace(/skill-(\d+)/g,(_,n)=>'skill-'+(Number(n)>=14?Number(n)+1:Number(n)))
  .replace(/(<span class="number">)(\d+)(<\/span>)/g,(_,a,n,b)=>a+String(Number(n)>=14?Number(n)+1:Number(n)).padStart(2,'0')+b);
 const removedOriginal=originals.find(a=>a[2].includes('>Scientific Agent Skills</h3>'))[0];
 restored=restored.replace(/<article class="skill-card" data-category="Knowledge" aria-labelledby="skill-15">/,removedOriginal+'\n$&');
 restored=restored.replace('Knowledge (5)','Knowledge (6)').replace('Knowledge <span>(5)</span>','Knowledge <span>(6)</span>');
 for(const card of getCards(restored).filter(a=>/aria-labelledby="skill-(?:22|23)"/.test(a[0]))) restored=restored.replace(card[0]+(restored[restored.indexOf(card[0])+card[0].length]==="\n"?"\n":""), "");
 const section6Changes = [["Discover 21 popular", "Discover 22 popular"], ["note-number\">21<", "note-number\">22<"], ["collection of 21 popular", "collection of 22 popular"], ["All skills (21)", "All skills (22)"], ["Design (1)", "Design (3)"], ["Design <span>(1)</span>", "Design <span>(3)</span>"], ["21 skills in the collection", "22 skills in the collection"], ["All 21 skills are available", "All 22 skills are available"], ["21 skills. Star counts", "22 skills. Star counts"]];
 for(const [oldText,newText] of section6Changes) { assert.ok(html.includes(newText),newText); restored=restored.replace(newText,oldText); }
 // The original TDD hash has no recoverable published-HEAD baseline.
 // Check restoration structurally; gate 3 protects the existing 21 cards' copy.
 const restoredCards=getCards(restored);
 assert.equal(restoredCards.length,21,'Restored inventory must contain 21 articles');
 assert.doesNotMatch(restored,/skill-(?:22|23)\b|Taste Skill|Impeccable|design-taste-frontend|Ledgerly|PRODUCT\.md/,'New-card content must be removed');
 const originalTitles=originals.map(([,,card])=>renderedText(card.match(/<h3[^>]*>(.*?)<\/h3>/)[1]));
 assert.equal(originalTitles.length,21,'Pre-existing inventory must contain 21 titles');
 assert.deepEqual(restoredCards.map(([,,card])=>renderedText(card.match(/<h3[^>]*>(.*?)<\/h3>/)[1])),originalTitles,'All 21 pre-existing titles must remain in order');
 for(const [oldText,newText] of section6Changes) {
  assert.ok(restored.includes(oldText),'Section 6 text must be restored: '+oldText);
  assert.ok(!restored.includes(newText),'Updated section 6 text must be absent: '+newText);
 }
 assert.doesNotMatch(renderedText(restored),/\b23\s+(?:popular\b|skills\b)|\bAll skills\s*\(23\)/i,'No 23-count prose may remain');
});

gate('new Design copy, honesty, totals and placement',()=>{
 const design=articles.filter(a=>a[1]==='Design');
 assert.deepEqual(design.map(a=>renderedText(a[2].match(/<h3[^>]*>(.*?)<\/h3>/)[1])),['UI/UX Pro Max','Taste Skill','Impeccable']);
 assert.deepEqual(design.map(a=>a[0].match(/aria-labelledby="([^"]+)"/)[1]),['skill-5','skill-21','skill-22']);
 assert.deepEqual(design.map(a=>renderedText(field(a[2],'number','span'))),['05','21','22']);
 for(const expected of newCards) {
  const article=articles.find(a=>a[0].includes('aria-labelledby="skill-'+expected.number+'"'));
  assert.ok(article,expected.title); const markup=article[2];
  assert.match(markup,new RegExp('<h3 id="skill-'+expected.number+'">'+expected.title+'</h3>'));
  assert.equal(renderedText(field(markup,'card-meta','div')),expected.number+'Design·Intermediate '+expected.stars);
  assert.ok(markup.includes('aria-label="'+expected.stars+' GitHub stars"'));
  assert.equal(renderedText(field(markup,'description')),expected.description);
  assert.equal(renderedText(field(markup,'fit-use')),'Use when '+expected.use);
  assert.equal(renderedText(markup.match(/<summary>([\s\S]*?)<\/summary>/)[1]),expected.summary);
  assert.deepEqual([...markup.matchAll(/<p class="inside-note">([^<]+)<\/p>/g)].map(m=>decodeHTML(m[1])),expected.note?[expected.note]:[]);
  const items=[...markup.matchAll(/<li><code class="inside-name">([^<]+)<\/code> — ([\s\S]*?)<p class="example-prompt">([^<]*)<\/p><\/li>/g)];
  assert.deepEqual(items.map(m=>({name:decodeHTML(m[1]),fn:decodeHTML(m[2]),prompt:decodeHTML(m[3])})),expected.items);
  assert.doesNotMatch(markup,/inside-kind/);
  assert.equal(renderedText(field(markup,'top-inside')),expected.topLabel+' '+expected.topNames.join(' · '));
  const footer=field(markup,'card-footer','div');
  assert.ok(footer.includes('href="'+expected.href+'" target="_blank" rel="noopener noreferrer" aria-label="'+expected.aria+'"'));
  assert.equal(renderedText(footer),'GitHub repository');
  for(const item of expected.items) { assert.ok(words(item.prompt)>=15&&words(item.prompt)<=25); assert.equal((item.prompt.match(/[.!?](?=\s|$)/g)||[]).length,1); }
 }
 const taste=design[1][2], impeccable=design[2][2];
 assert.equal((taste.match(/<li>/g)||[]).length,1);
 assert.equal(renderedText(taste.match(/<summary>([\s\S]*?)<\/summary>/)[1]),'Inside this repo — the only skill');
 assert.equal(renderedText(field(taste,'inside-note')),'Earlier classic variants moved to satellite repos.');
 assert.deepEqual([...impeccable.matchAll(/<li><code class="inside-name">([^<]+)<\/code>/g)].map(m=>m[1]),['init','polish','bolder','critique','audit']);
 assert.equal(renderedText(impeccable.match(/<summary>([\s\S]*?)<\/summary>/)[1]),'Inside this repo — 5 commands');
 assert.doesNotMatch(impeccable,/of (?:23|24)|\d+ (?:skills|rules)|inside-name">craft</);
 assert.doesNotMatch(html,/redesign-existing-projects|high-end-visual-design|minimalist-ui|industrial-brutalist-ui|61 rules|\bdeprecated\b/i);
 assert.match(styles,/#chapter-design::before\{content:"III"/);
 assert.equal(sha256(styles),'8b2601b309c4e6947c3d36e0dbf0b2315c15b6c720d035792cde73ab931b21e1','styles.css must remain byte-identical');
});

const expectedPromptRule = '.example-prompt{margin:var(--space-1) 0 0;padding:var(--space-1) var(--space-2);border-left:1px solid var(--line);background:var(--prompt-background);color:var(--body);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--type-mono);line-height:var(--type-list-leading);overflow-wrap:anywhere}';
gate('one exact prompt CSS rule', () => {
 assert.equal(styles.split(expectedPromptRule).length-1,1);
 assert.equal(sha256(styles.replace(expectedPromptRule+'\n','')), '601858b937d43c199ed606413e1ddca645e92dada109e15ffd96d2de66ee6dc8', 'Only the specified CSS rule may be added');
 const declaration=expectedPromptRule.slice(expectedPromptRule.indexOf('{'));
 assert.doesNotMatch(declaration, /#[\da-f]|\b(?:rgb|hsl)\(|border-radius|box-shadow|--accent/);
 const tokens=new Set([...styles.match(/:root\{([^}]*)}/)[1].matchAll(/(--[\w-]+):/g)].map(m=>m[1]));
 for(const [,token] of declaration.matchAll(/var\((--[\w-]+)\)/g)) assert.ok(tokens.has(token));
});

const topRows=[...copy.matchAll(/^\| ([^|]+) \| [^|]+ \| ([^|]+) \| ([^|]+) \|$/gm)].filter(m=>!['Card','---'].includes(m[1].trim()));
topRows.splice(9,0,...newCards.map(c=>[null,c.title,c.topLabel,c.topNames.join(', ')]));
topRows.splice(topRows.findIndex(row=>row[1].trim()==='Scientific Agent Skills'),1);
gate('4 exact top lines',()=>{assert.equal(topRows.length,22); articles.forEach(([,,c],i)=>{ const row=topRows[i]; const names=row[3].trim().split(', '); assert.equal(renderedText(field(c,'top-inside')),row[2].trim()+' '+names.join(' · ')); assert.deepEqual([...field(c,'top-inside').matchAll(/<code class="inside-name">(.*?)<\/code>/g)].map(m=>decodeHTML(m[1])),expectedInside[i].items.slice(0,2).map(x=>x.name)); });});
gate('5 stars and number',()=>{articles.forEach(([,,c],i)=>{if(newCards.some(n=>n.title===densities[i].title)) return; const snapshot=starSnapshot[originals.findIndex(a=>a[2].includes('>'+densities[i].title+'</h3>'))]; const meta=field(c,'card-meta','div'); const stars=meta.match(/<span class="meta-stars"[\s\S]*?<\/span>/)?.[0]; assert.equal(stars,snapshot.stars.replace('class="stars"','class="meta-stars"')); const footer=field(c,'card-footer','div'); assert.doesNotMatch(footer,/stars|icon-star/); assert.match(footer,/<a href=/); }); for(const [,rule] of styles.matchAll(/\.number\{([^}]*)}/g)){assert.doesNotMatch(rule,/--accent|--type-entry-number|--type-note|--serif/);} assert.match(styles,/\.number\{[^}]*var\(--type-mono\)[^}]*var\(--muted\)/); assert.match(styles,/\.meta-stars\{[^}]*tabular-nums/);});
gate('6 collapsed Karpathy',()=>{for(const [,,c]of articles)assert.doesNotMatch(c,/<details class="inside"[^>]*\bopen\b/); const c=articles.find(a=>a[2].includes('>Karpathy Skills</h3>'))[2];assert.equal(renderedText(field(c,'top-inside')),'Inside: karpathy-guidelines');});
gate('7 single scoped bulk toggle',()=>{assert.equal((html.match(/id="toggle-inside"/g)||[]).length,1); assert.equal((html.match(/id="toggle-[^"]+"/g)||[]).length,1); assert.match(source,/querySelectorAll\('\.skill-card details\.inside'\)/); for(const label of ['Expand all inside lists','Collapse all inside lists'])assert.ok(source.includes(label));assert.match(source,/setAttribute\('aria-expanded', String\(allOpen\)\)/);});
function element(textContent = '') {
  const listeners = {};
  const classes = new Set();
  return {
    cloneNode() { return {textContent:this.textContent,querySelectorAll:()=>[]}; },
    textContent, disabled: true, hidden: false, value: '', open: false, dataset: {}, attrs: {}, style: {},
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      contains(name) { return classes.has(name); },
      toggle(name, force) {
        const active = force === undefined ? !classes.has(name) : force;
        if (active) classes.add(name); else classes.delete(name);
        return active;
      },
    },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, handler) { listeners[name] = handler; },
    fire(name) { return listeners[name]?.(); },
    click() { return this.fire('click'); },
    focus() { this.focused = true; }, select() {}, remove() {},
  };
}
function markupElement(originalHTML) {
 return { innerHTML: originalHTML, get textContent() { return renderedText(this.innerHTML); } };
}
const highlightDocument = {
 createTreeWalker(root) {
  const nodes=[]; const re= /([^<]+)|(<[^>]*>)/g; let match;
  // Text offsets are captured before replacements, then adjusted by prior replacements.
  let shift=0;
  while((match=re.exec(root.innerHTML))) if(match[1]) {
   const start=match.index, length=match[0].length;
   nodes.push({textContent:decodeHTML(match[0]),replaceWith(fragment) {
    const replacement=fragment.parts.map(p=>p.tag?'<'+p.tag+'>'+p.textContent+'</'+p.tag+'>':p.textContent).join('');
    root.innerHTML=root.innerHTML.slice(0,start+shift)+replacement+root.innerHTML.slice(start+shift+length);
    shift+=replacement.length-length;
   }});
  }
  let i=0;return {nextNode(){this.currentNode=nodes[i++];return !!this.currentNode;}};
 },
 createDocumentFragment:()=>({parts:[],append(node){this.parts.push(node);}}),
 createTextNode:textContent=>({textContent}),
 createElement:tag=>({tag,textContent:''}),
};
function exerciseControls() {
 const ids=Object.fromEntries(['search','clear-search','toggle-inside','results-count','empty-state','reset-filters'].map(id=>[id,element()]));
 const lists=categoryArticles.map(([,,c])=>{const originalHTML=c.match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1];return markupElement(originalHTML);});
 const insides=lists.map(list=>Object.assign(element(),{querySelector:()=>list}));
 const prose=articles.map(([,,c])=>Object.fromEntries(['description','fit-use'].map(cls=>[cls,markupElement(field(c,cls).replace(/^<p[^>]*>|<\/p>$/g,''))])));
 const cards=categoryArticles.map(([,category,c],i)=>Object.assign(element(renderedText(c)),{dataset:{category},querySelector:sel=>sel==='details.inside'?insides[i]:prose[i][sel.slice(1)]}));
 const chapterMarkup=[...html.matchAll(/<section class="chapter" aria-labelledby="([^"]+)">([\s\S]*?)<\/section>/g)];
 const chapters=chapterMarkup.map(([,id])=>Object.assign(element(),{querySelectorAll:()=>cards.filter(c=>c.dataset.category.toLowerCase()===id.replace('chapter-',''))}));
 const filters=[...html.matchAll(/data-filter="([^"]+)"/g)].map(([,category])=>Object.assign(element(),{dataset:{filter:category}}));
 const document={querySelector:sel=>ids[sel.slice(1)],querySelectorAll:sel=>({'.skill-card':cards,'.chapter':chapters,'[data-filter]':filters,'.skill-card details.inside':insides})[sel]||[],...highlightDocument};
 // Exercise the real text walker as well as controls.
 vm.runInNewContext(source,{document,NodeFilter:{SHOW_TEXT:4},console});
 const search=q=>{ids.search.value=q;ids.search.fire('input');};const visible=()=>cards.filter(c=>!c.hidden);

 // Search intentionally includes category text through card.textContent.
 // Design previously matched 11 cards; json-canvas's Design tag adds Obsidian Skills (12).
 // planning previously matched 5; Planning tags add Matt Pocock Skills, Karpathy Skills,
 // Agent Skills, Impeccable, Google Skills and Claude Skills Collection (11).
 const categorySearchCases = [
  ['Design', ['Superpowers','Matt Pocock Skills','Spec Kit','Vercel Skills','UI/UX Pro Max','Taste Skill','Impeccable','Obsidian Skills','Google Skills','Agentic Awesome Skills','Claude Plugins Official','Claude Skills Collection'],11],
  ['planning', ['Superpowers','ECC','Matt Pocock Skills','Spec Kit','Karpathy Skills','Agent Skills','Impeccable','Google Skills','Agentic Awesome Skills','Awesome Claude Code','Claude Skills Collection'],5],
 ];
 for(const [term,expected,oldCount] of categorySearchCases){
  assert.equal(articles.filter(([,,c])=>renderedText(c).toLowerCase().includes(term.toLowerCase())).length,oldCount,'Historical category-free search');
  search(term);
  assert.deepEqual(cards.flatMap((card,i)=>card.hidden?[]:[densities[i].title]),expected,term+' includes item categories');
  search('');
 }
 const originalLists=lists.map(list=>list.innerHTML);
 const allFilter=()=>filters.find(f=>f.dataset.filter==='All skills').click();
 const assertPromptSearch=(term,title,itemName)=>{
  search(term); assert.equal(visible().length,1,term+' visible count');
  const index=cards.findIndex(card=>!card.hidden); assert.equal(densities[index].title,title);
  assert.equal(insides[index].open,true);
  const item=[...lists[index].innerHTML.matchAll(/<li>([\s\S]*?)<\/li>/g)].find(([,markup])=>markup.includes('<code class="inside-name">'+itemName+'</code>'))?.[1];
  assert.ok(item?.match(/<p class="example-prompt">([\s\S]*?)<\/p>/)?.[1].includes('<mark>'+term+'</mark>'),term+' highlighted inside its prompt');
  assert.equal(ids['toggle-inside'].textContent,'Collapse all inside lists');
  assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'true');
  return index;
 };
 // A manually opened block must survive prompt searches and clearing.
 insides[1].open=true;
 const prePromptOpen=insides.map(inside=>inside.open);
 search('EGFR'); assert.equal(visible().length,0); assert.equal(ids['empty-state'].hidden,false); assert.equal(ids['results-count'].textContent,'0 skills in the collection');
 search(''); assert.deepEqual(insides.map(inside=>inside.open),prePromptOpen);
 lists.forEach((list,i)=>assert.equal(list.innerHTML,originalLists[i]));
 assertPromptSearch('Ledgerly','Taste Skill','design-taste-frontend'); search('');
 assertPromptSearch('PRODUCT.md','Impeccable','init'); search('');
 assertPromptSearch('auth-system.md','Superpowers','subagent-driven-development');
 const beforeToggle=insides.map(inside=>inside.open);
 ids['toggle-inside'].click(); assert.equal(insides[0].open,false);
 assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'false');
 assert.equal(ids['toggle-inside'].textContent,'Expand all inside lists');
 insides.forEach((inside,i)=>{if(i!==0)assert.equal(inside.open,beforeToggle[i]);});
 search(''); assert.deepEqual(insides.map(inside=>inside.open),prePromptOpen);
 lists.forEach((list,i)=>assert.equal(list.innerHTML,originalLists[i]));
 filters.find(f=>f.dataset.filter==='Knowledge').click();
 search('EGFR'); assert.equal(visible().length,0); assert.equal(ids['empty-state'].hidden,false); assert.equal(ids['results-count'].textContent,'0 skills in the collection');
 search('auth-system.md'); assert.equal(visible().length,0); assert.equal(ids['empty-state'].hidden,false);
 search(''); allFilter(); insides.forEach(inside=>inside.open=false);
 assert.equal(ids.search.disabled,false);assert.equal(visible().length,22);assert.equal(ids['toggle-inside'].hidden,false);
 ids['toggle-inside'].click();assert.ok(insides.every(i=>i.open));assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'true');ids['toggle-inside'].click();assert.ok(insides.every(i=>!i.open));
 insides[0].open=true; search('to-spec');assert.equal(visible().length,1);assert.ok(insides[2].open);assert.equal(ids['toggle-inside'].textContent,'Collapse all inside lists'); assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'true'); assert.match(lists[2].innerHTML, /<code class="inside-name"><mark>to-spec<\/mark><\/code>/); search('worktrees');assert.equal(insides[2].open,false);assert.ok(insides[0].open);search('');assert.ok(insides[0].open);assert.equal(insides[2].open,false);lists.forEach((l,i)=>assert.equal(l.innerHTML,categoryArticles[i][2].match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1]));
 for(const f of filters){search('');f.click();assert.equal(visible().length,cards.filter(c=>f.dataset.filter==='All skills'||c.dataset.category===f.dataset.filter).length);assert.equal(f.attrs['aria-pressed'],'true');}
 filters.find(f=>f.dataset.filter==='Workflow').click();search('worktrees');assert.equal(visible().length,1);assert.deepEqual(chapters.map(c=>c.hidden),[false,true,true,true,true,true]);search('');
 filters.find(f=>f.dataset.filter==='Design').click();search('design-system');
 assert.equal(visible().length,1);assert.equal(ids['toggle-inside'].textContent,'Collapse all inside lists');assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'true');
 const hiddenOpen=insides.map(i=>i.open); const designIndex=cards.findIndex(c=>!c.hidden);
 ids['toggle-inside'].click();assert.equal(insides[designIndex].open,false);assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'false');
 insides.forEach((inside,i)=>{if(i!==designIndex)assert.equal(inside.open,hiddenOpen[i]);});search('');assert.equal(insides[designIndex].open,false);
 search('design-system');ids['toggle-inside'].click();ids['toggle-inside'].click();search('');assert.equal(insides[designIndex].open,true);
 ids['reset-filters'].click();
 search('intelligence');assert.ok(prose.some(p=>p.description.innerHTML.includes('<mark>')));search('');
 search('Use when');assert.ok(prose.some(p=>p['fit-use'].innerHTML.includes('<mark>')));search('');
 prose.forEach((p,i)=>Object.entries(p).forEach(([cls,node])=>assert.equal(node.innerHTML,field(articles[i][2],cls).replace(/^<p[^>]*>|<\/p>$/g,''))));
 filters.find(f=>f.dataset.filter==='Design').click();assert.equal(visible().length,3);assert.deepEqual(chapters.map(c=>c.hidden),[true,true,false,true,true,true]);search('Superpowers');assert.equal(visible().length,0);assert.equal(ids['toggle-inside'].textContent,'Expand all inside lists');assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'false');assert.equal(ids['empty-state'].hidden,false);assert.equal(ids['results-count'].textContent,'0 skills in the collection');ids['clear-search'].click();assert.equal(visible().length,3);ids['reset-filters'].click();assert.equal(visible().length,22);assert.equal(ids['empty-state'].hidden,true);assert.equal(ids['clear-search'].hidden,true);assert.ok(chapters.every(c=>!c.hidden));
}
gate('8 search paths' ,()=>{for(const pattern of [/originalHTML/,/preSearchOpen/,/inside\.open = true/,/createElement\('mark'\)/,/createTreeWalker/,/innerHTML = originalHTML/,/list\.textContent/,/card\.hidden/])assert.match(source,pattern);assert.match(historicalSource,/text: card\.textContent\.toLocaleLowerCase\(\)/); exerciseControls();});
const rules = css => [...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)}/g)];
gate('9 CSS tokens and dispositions',()=>{
assert.doesNotMatch(styles, /border[^;{}]*dashed/);
const borderFor = selector => styles.slice(styles.indexOf(selector + '{')).split('}')[0].match(/border-bottom:([^;}]*)/)[1];
assert.equal(borderFor('#collection-title'), borderFor('.chapter-heading'));

// T4: inspect declarations outside tokens; exceptions are limited by property.
const tokenlessCSS = styles.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root\s*\{[^}]*}/, '');
for (const [, selectors, declarations] of tokenlessCSS.matchAll(/([^{}]+)\{([^{}]*)}/g)) {
  for (const declaration of declarations.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1);
    for (const match of value.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
      const n = Number(match[1]);
      const allowed = (/^border(?:-(?:top|bottom|left|right))?$/.test(property) && [1,2,3].includes(n))
        || (property === 'outline' && n === 2) || (property === 'outline-offset' && [0,5].includes(n))
        // 5px link underline offset preserves the existing optical separation.
        || (property === 'text-underline-offset' && n === 5)
        || (property === 'text-decoration-thickness' && n === 2)
        // -2px aligns the pseudo rule with the reserved 2px card border.
        || (property === 'top' && n === -2)
        // 1px size and -1px margin are the standard visually hidden clipping geometry.
        || (/sr-only/.test(selectors) && (['width','height'].includes(property) && n === 1 || property === 'margin' && n === -1));
      assert.ok(allowed, 'Untokenized px: ' + property + ':' + value);
    }
  }
}

assert.match(styles, /@media\(max-width:640px\)\{\s*\.skill-card\.first-visible::before\{border-top:0}/);
assert.match(html, /<input\b[^>]*\bdisabled\b[^>]*id="search"/);
assert.doesNotMatch(styles, /border-radius:\s*(?:24|8)px/);
assert.doesNotMatch(styles, /--radius-[\w-]+:\s*(?:24|8)px/);
assert.match(styles, /--radius-control:6px/);
for (const [, radius] of styles.matchAll(/border-radius:([^;}]+)/g)) assert.ok(['0', 'var(--radius-control)'].includes(radius));
assert.doesNotMatch(html, /built-with|How this site was built|class="closing"|A better workflow starts/);
assert.doesNotMatch(styles, /built-with|\.closing\b|--type-(?:built|closing)(?:-mobile)?:/);


 const tokens=css=>Object.fromEntries([...css.match(/:root\{([^}]*)}/)[1].matchAll(/(--[\w-]+):([^;}]*)/g)].map(m=>[m[1],m[2]])); const old=tokens(beforeCSS),now=tokens(styles); for(const token of ['--copy-width','--hero-wide-padding','--type-entry-number','--type-built','--type-built-mobile','--type-closing','--type-closing-mobile']) delete old[token]; assert.deepEqual(now,{...old,'--type-list-leading':'1.5'});
 for(const [selector,props]of [['.hero',['padding:var(--space-6) 0 var(--space-4)']],['.top-inside',['margin:var(--space-2) 0 var(--space-1)','var(--type-small)','var(--type-list-leading)','color:var(--body)']],['.top-inside-label',['var(--type-label)','var(--muted)']],['.inside-list li',['line-height:var(--type-list-leading)']],['.category',['font-weight:600','color:var(--ink)']],['mark',['background:var(--prompt-background)','color:var(--ink)','font-weight:600','text-decoration:underline','text-decoration-color:var(--accent)','text-decoration-thickness:2px','text-underline-offset:5px']],['.chapter-lede',['var(--type-small)','var(--body)']]]) {const rule=rules(styles).find(m=>m[1].trim()===selector);assert.ok(rule,selector);for(const p of props)assert.ok(rule[2].includes(p),selector+': '+p);}
 assert.match(styles,/\.skill-card h3\{[^}]*margin:var\(--space-4\) 0 var\(--space-2\)/);
 assert.match(styles,/:is\(\.description,\.fit p,\.inside-list li,\.inside-note,\.top-inside\)\{max-width:62ch}/);
 assert.match(styles,/\.skill-grid :is\(\.inside-list li,\.inside-note\)\{max-width:62ch}/);
 for(const [,,decl]of rules(styles).filter(r=>!r[1].includes(':root')&&!rules(beforeCSS).some(o=>o[1]===r[1]&&o[2]===r[2]))) { for(const [,t]of decl.matchAll(/var\((--[\w-]+)\)/g))assert.ok(t in now); assert.doesNotMatch(decl,/#|\b(?:rgb|hsl)\(/); }
 const accent=rules(styles).filter(r=>r[2].includes('var(--accent)'));assert.equal(accent.length,3);
});
gate('10 unchanged surface and chapter ledes',()=>{
 for(const [i,[,,c]]of articles.entries()) { if(newCards.some(n=>n.title===densities[i].title)) continue; const original=originals.find(a=>a[2].includes('>'+densities[i].title+'</h3>'))[2]; assert.deepEqual(c.match(/<a href=[\s\S]*?<\/a>/g),original.match(/<a href=[\s\S]*?<\/a>/g)); }
 for(const pattern of [/<h2 class="chapter-heading"[^>]*>[\s\S]*?<\/h2>/g,/<button[^>]*data-filter=[\s\S]*?<\/button>/g,/<section class="hero[\s\S]*?<\/section>/g])assert.deepEqual([...html.replace('Knowledge <span>(5)</span>','Knowledge <span>(6)</span>').replace('Knowledge (5)','Knowledge (6)').replace('Design <span>(3)</span>','Design <span>(1)</span>').replace('All skills (22)','All skills (21)').replace('Design (3)','Design (1)').replace('note-number">22<','note-number">21<').replace('collection of 22 popular','collection of 21 popular').matchAll(pattern)].map(m=>m[0]),[...before.replace('<span class="note-line"></span>', '').matchAll(pattern)].map(m=>m[0]));
 for(const id of ['workflow','quality','design','efficiency','knowledge','discovery']) { const rule=styles.match(new RegExp('#chapter-'+id+'::before\\{[^}]*}'))?.[0]; assert.ok(rule);assert.ok(beforeCSS.includes(rule)); }
 const ledes=[...copy.matchAll(/^- (Workflow|Quality|Design|Efficiency|Knowledge|Discovery) — (.+)$/gm)].map(m=>m[2]); const shipped=[...html.matchAll(/<h2 class="chapter-heading"[^>]*>[\s\S]*?<\/h2>\s*<p class="chapter-lede">([^<]+)<\/p>/g)].map(m=>m[1]);assert.deepEqual(shipped,ledes); console.log('Chapter lede words:',ledes.reduce((n,l)=>n+words(l),0));
});
gate('11 script diff discipline',()=>{
 assert.equal(sha256(historicalSource), '54c74dd5029521a0f8d1e749ad0e846563d87a393eb02c12af3d7805e97c2b50', 'script.js must be byte-identical');
 const functionBlock=(s,name,next)=>s.slice(s.indexOf(name),s.indexOf(next,s.indexOf(name)));
 for(const [start,end]of [['  chapters.forEach','searchInput?.addEventListener'],["searchInput?.addEventListener",'function update']]) {assert.equal(functionBlock(historicalSource,start,end),functionBlock(beforeJS,start,end));}
 const oldFiltering=beforeJS.slice(beforeJS.indexOf('function updateResults'),beforeJS.indexOf('searchInput?.addEventListener'));
 const newFiltering=historicalSource.slice(historicalSource.indexOf('function updateResults'),historicalSource.indexOf('searchInput?.addEventListener')).replace('  updateInsideSearch(terms);\n','');assert.equal(newFiltering,oldFiltering);
 // Toggle/search paths are intentionally changed; filtering and chapter paths remain protected above.

});
function exerciseHighlight() {
 const list=markupElement('<li><code class="inside-name">to-spec</code> — worktrees</li>');
 const description=markupElement('worktrees description');const use=markupElement('<strong>Use when</strong> worktrees');
 const originals=[list,description,use].map(n=>n.innerHTML);
 const inside=Object.assign(element(),{querySelector:()=>list});
 const card=Object.assign(element('to-spec worktrees description Use when'),{querySelector:s=>s==='details.inside'?inside:s==='.description'?description:use,dataset:{category:'Design'}});
 const search=element();
 const document={...highlightDocument,querySelector:s=>s==='#search'?search:null,querySelectorAll:s=>s==='.skill-card'?[card]:s==='.skill-card details.inside'?[inside]:[]};
 vm.runInNewContext(source,{document,NodeFilter:{SHOW_TEXT:4},console:{warn(){}}});
 search.value='to to-spec';search.fire('input');assert.match(list.innerHTML,/<code class="inside-name"><mark>to-spec<\/mark><\/code>/);assert.doesNotMatch(list.innerHTML,/<mark>to<\/mark>/);
 search.value='worktrees';search.fire('input');for(const node of [list,description,use])assert.match(node.innerHTML,/<mark>worktrees<\/mark>/);
 search.value='';search.fire('input');[list,description,use].forEach((node,i)=>assert.equal(node.innerHTML,originals[i]));
}
gate('polish CSS, prose and portability',()=>{
 assert.match(styles,/@media\(max-width:640px\)\{[\s\S]*?\.card-meta\{flex-wrap:wrap;white-space:normal}/);
 assert.match(styles,/\.card-footer a\{[^}]*min-height:var\(--touch\)/);
 assert.match(styles,/#collection-title\{[^}]*line-height:var\(--type-display-leading\)/);
 assert.match(styles,/\.chapter-heading\{[^}]*line-height:var\(--type-entry-leading\)/);
 assert.match(styles,/\.skip-link:focus\{[^}]*color:var\(--paper\)/);
 assert.doesNotMatch(styles,/--(?:copy-width|hero-wide-padding|type-entry-number):|\.note-line|\.description\{min-height:0}/);
 assert.doesNotMatch(html,/class="note-line"/);
 for(const prose of [html.match(/<meta name="description"[^>]*>/)[0],html.match(/<noscript>[\s\S]*?<\/noscript>/)[0]])assert.doesNotMatch(prose,/practical guides|example prompts|copy prompts/);
 assert.doesNotMatch(fs.readFileSync(__filename,'utf8').split("gate('polish CSS")[0],/['"]\/tmp\/fix-in-place-before|path.resolve\(root, ['"]\.\.\/workflow-run-/);
});
gate('12 highlight assertions and manual live checklist',()=>{ exerciseHighlight(); console.log('Manual live checklist (not performed; user prohibits live checking): prompt strips under items without overflow at desktop and narrowest allowed width; triple-click selects only one prompt, copy/paste exact; EGFR shows the empty state; clear restores prompts; leave All skills, empty query, all collapsed; true 320–360px rendering unverified; 22 collapsed cards with stars/top lines; expand/collapse 22; to-spec/worktrees opens and marks; Design III (3); filters, clear, reset; layout; true 320–360px phone width. Static checks do not constitute live verification.'); });
// Agent-layer public seams: shipped files versus independently extracted HTML copy.
const agentBaseline = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/agent-layer-baseline.json'),'utf8'));
const agentNav = '<nav aria-label="For agents">For agents: <a href="skills.json">skills.json</a>, <a href="llms.txt">llms.txt</a>, <a href="llms-full.txt">llms-full.txt</a></nav>';
const agentSnippet = `When starting a task, fetch https://topskillsfordevelopment.vercel.app/skills.json.
Match the task to each skill's Use-when line and category, and pick at most 2 skills.
Then follow the chosen skill's own repository install instructions, and start with its example prompt.
Do not install every matching skill — pick the smallest set that covers the task.
Do not invent an install command: if the repository does not state one, say so and stop.
If no skill matches the task, use no skill from this catalog rather than forcing a match.`;
const chapterMarkup = [...html.matchAll(/<section class="chapter"[^>]*>([\s\S]*?)<\/section>/g)].map(m=>m[1]);
const agentChapters = chapterMarkup.map(c=>renderedText(c.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1].replace(/<span>[\s\S]*?<\/span>/,'')));
const agentExpectedCards = getCards(c3Transform(shippedCategoryHTML)).map(([,category,c])=>{
 const heading=c.match(/<h3 id="([^"]+)">([^<]+)<\/h3>/); assert.ok(heading,'Missing shipped anchor');
 const stars=renderedText(field(c,'meta-stars','span'));
 assert.match(stars,/^\d{1,3}(?:,\d{3})*$/);
 assert.ok(field(c,'meta-stars','span').includes('aria-label="'+stars+' GitHub stars"'));
 assert.equal(renderedText(field(c,'category','span')),category);
 const top=field(c,'top-inside');
 const items=[...c.match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1].matchAll(/<li><code class="inside-name">([^<]+)<\/code> <span class="item-category">([^<]+)<\/span> — ([\s\S]*?)<\/li>/g)].map(([,name,category,body])=>{
  const prompts=[...body.matchAll(/<p class="example-prompt">([^<]*)<\/p>/g)]; assert.equal(prompts.length,1);
  const example_prompt=decodeHTML(prompts[0][1]); assert.doesNotMatch(example_prompt,/[\r\n]/);
  return {name:decodeHTML(name),category,kind:body.match(/<span class="inside-kind">([^<]+)<\/span>/)?.[1].replace(/^\((command|subcommand)\)$/,'$1')??null,
   function:renderedText(body.replace(prompts[0][0],'').replace(/<span class="inside-kind">[^<]+<\/span>/,'')),example_prompt};
 });
 const description=renderedText(field(c,'description')); assert.doesNotMatch(description,/[\r\n]/);
 return {id:heading[1],number:Number(heading[1].slice(6)),title:decodeHTML(heading[2]),category,
 level:renderedText(c.match(/<span class="dot">·<\/span><span>([^<]+)<\/span>/)[1]),stars:Number(stars.replaceAll(',','')),
 repo:field(c,'card-footer','div').match(/<a href="([^"]+)"/)[1],description,
 use_when:renderedText(field(c,'fit-use').replace('<strong>Use when</strong>','')),
 top_inside:{label:renderedText(field(top,'top-inside-label','span')),names:[...top.matchAll(/<code class="inside-name">([^<]+)<\/code>/g)].map(m=>decodeHTML(m[1]))},
 inside_summary:renderedText(c.match(/<summary>([\s\S]*?)<\/summary>/)[1].replace(/<svg[\s\S]*?<\/svg>/,'')),
 inside_note:field(c,'inside-note')?renderedText(field(c,'inside-note')):null,inside:items};
});
const agentExpected = {site:decodeHTML(html.match(/<title>(.*?) — /)[1]),description:decodeHTML(html.match(/<meta name="description" content="([^"]+)"/)[1]),
 star_snapshot:html.match(/Star counts are a snapshot supplied for ([^<]+)\.<\/p>/)[1],agent_guide:'llms.txt',chapters:agentChapters,count:articles.length,cards:agentExpectedCards};
const readAgentFile = name => {
 const bytes=fs.readFileSync(path.join(root,name));
 const value=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
 assert.ok(value.endsWith('\n'),name+' trailing newline');
 return value;
};
gate('agent files: UTF-8, schema, field-by-field HTML match and hygiene',()=>{
 const json=readAgentFile('skills.json'), catalog=JSON.parse(json);
 assert.deepEqual(Object.keys(catalog),Object.keys(agentExpected));
 assert.deepEqual(catalog,agentExpected);
 assert.equal(json,JSON.stringify(agentExpected,null,2)+'\n');
 const prompts=[], pairs=[];
 for(const card of catalog.cards){
  assert.deepEqual(Object.keys(card),Object.keys(agentExpectedCards[0]));
  assert.deepEqual(Object.keys(card.top_inside),['label','names']);
  for(const item of card.inside){assert.deepEqual(Object.keys(item),['name','category','kind','function','example_prompt']);prompts.push(item.example_prompt);pairs.push(card.id+' / '+item.name);assert.doesNotMatch(item.function,/^—/);}
 }
 for(const values of [catalog.cards.map(c=>c.id),catalog.cards.map(c=>c.number),prompts,pairs])assert.equal(new Set(values).size,values.length);
 assert.equal(catalog.count,22);assert.equal(pairs.length,160);assert.equal(prompts.length,160);
 assert.doesNotMatch(json,/"install"\s*:|Verified|Crafted|Uncertain|UNCONFIRMED|illustrative|not repo-quoted|example\.(?:com|org)/);
 // Equality above permits only verbatim page text, including the amended prompt URL/command exceptions.
 const withoutPrompts=catalog.cards.map(c=>({...c,inside:c.inside.map(({example_prompt,...item})=>item)}));
 const urls=JSON.stringify(withoutPrompts).match(/https?:[^"\s]+/g)||[];
 assert.deepEqual(urls,catalog.cards.map(c=>c.repo));
 assert.ok(!json.includes(agentSnippet));
});
gate('agent text catalogs: exact headers, chapters, card lines, functions, kinds, notes and prompts',()=>{
 const short=readAgentFile('llms.txt'), full=readAgentFile('llms-full.txt');
 const common=`# ${agentExpected.site}\n\n> ${agentExpected.description}\n\n> For agents — how to use this catalog:\n${agentSnippet.split('\n').map(l=>'> '+l).join('\n')}\n\n`;
 let expectedShort=common+`> Full catalog: llms-full.txt — Structured catalog: skills.json — Star counts are a snapshot supplied for ${agentExpected.star_snapshot}.\n`;
 let expectedFull=common+`> Full catalog in structured form: skills.json — Short index: llms.txt — Star counts are a snapshot supplied for ${agentExpected.star_snapshot}.\n`;
 // Domain is a build-time input: validate path/fragment independently of its hostname.
 const anchorDomain = value => value.replace(/https?:\/\/[^\s/]+(?=#skill-)/g,'SITE_URL');
 for(const [i,chapter] of agentChapters.entries()){
  expectedShort+='\n## '+chapter+'\n';expectedFull+='\n## '+chapter+'\n';
  const lede=field(chapterMarkup[i],'chapter-lede');if(lede)expectedFull+='\n'+renderedText(lede)+'\n';
  for(const c of agentExpectedCards.filter(c=>c.category===chapter)){
   const stars=c.stars.toLocaleString('en-US'),anchor='SITE_URL#'+c.id;
   expectedShort+=`\n- [${c.title}](${c.repo}) — ${c.category} · ${stars} stars — ${c.description} — Card: ${anchor}\n`;
   expectedFull+=`\n### ${c.title}\n\n- Category: ${c.category} · Level: ${c.level} · Stars: ${stars} · Repo: ${c.repo} · Card: ${anchor}\n- Description: ${c.description}\n- Use when: ${c.use_when}\n- Top inside: ${c.top_inside.label} ${c.top_inside.names.join(', ')}\n- Inside: ${c.inside_summary}\n`;
   for(const item of c.inside)expectedFull+=`- ${item.name}${item.kind?' ('+item.kind+')':''} [${item.category}] — ${item.function}\n  > ${item.example_prompt}\n`;
   if(c.inside_note)expectedFull+='- Note: '+c.inside_note+'\n';
  }
 }
 assert.equal(anchorDomain(short),expectedShort);assert.equal(anchorDomain(full),expectedFull);
 assert.equal((short.match(/^- \[/gm)||[]).length,articles.length);
 assert.equal((full.match(/^### /gm)||[]).length,articles.length);
 assert.equal((full.match(/^  > /gm)||[]).length,160);
 for(const value of [short,full]){
  // The amendment bans added claims, not shipped phrases such as 'Production-grade'
  // or 'verified' in prompts. Remove exact HTML-derived copy before checking additions.
  const pageCopy = [agentExpected.description, ...agentChapters,
   ...chapterMarkup.map(c=>field(c,'chapter-lede')).filter(Boolean).map(renderedText),
   ...agentExpectedCards.flatMap(c=>[c.title,c.description,c.use_when,c.inside_summary,c.inside_note,
    c.top_inside.label,...c.top_inside.names,...c.inside.flatMap(i=>[i.name,i.function,i.example_prompt])])].filter(Boolean).sort((a,b)=>b.length-a.length);
  let added=value; for(const copy of pageCopy)added=added.split(copy).join('');
  assert.doesNotMatch(added,/Verified|Crafted|Uncertain|UNCONFIRMED|illustrative|not repo-quoted|example\.(?:com|org)|\bgrade\b/i);
  assert.deepEqual([...value.matchAll(/ — Card: | · Card: /g)].length,articles.length);
  for(const [,id] of value.matchAll(/Card: https?:\/\/[^\s]+#([^\s]+)/g))assert.ok(agentExpectedCards.some(c=>c.id===id));
 }
});
gate('agent outputs regenerate byte-for-byte from HTML only',()=>{
 const {generate}=require('./generate-agent-layer');
 const outputs=generate(c3Transform(shippedHTML),'https://topskillsfordevelopment.vercel.app');
 assert.deepEqual(Object.keys(outputs),['skills.json','llms.txt','llms-full.txt']);
 for(const [name,expected] of Object.entries(outputs))assert.equal(readAgentFile(name),expected,name+' generated bytes');
});
gate('agent footer insertion only, protected bytes and unchanged per-card baseline',()=>{
 assert.equal((html.match(/<nav aria-label="For agents">/g)||[]).length,1);
 assert.ok(html.includes(agentNav));
 const footer=html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];
 assert.equal(footer,agentBaseline.footer.replace('</p>','</p>'+agentNav));
 assert.equal(sha256(html.replace(articles.find(a=>a[0].includes('aria-labelledby="skill-4"'))[0],agentBaseline.originalMattCard).replace(agentNav,'')),agentBaseline['index.html'],'Restoring the separately verified Matt card permits only the exact footer nav change from the removal baseline');
 assert.ok(!html.includes(agentSnippet));
 for(const name of ['styles.css','script.js'])assert.equal(sha256(name==='styles.css'?styles:historicalSource),agentBaseline[name],name+' pre-build bytes');
 for(const kind of ['visible','expanded'])assert.deepEqual(densities.map(c=>c[kind]),agentBaseline[kind],kind+' per-card baseline');
});


// Actual shipped surface gates supplement, rather than replace, the historical checks.
gate('polish2 M1–M3 exact HTML scope and labels',()=>{
 assert.equal(sha256(undoPolishHTML(undoFavouritesHTML(categoryHTML))),densityBaseline.polish2Before['index.html']);
 const noscript=categoryHTML.match(/<noscript>[\s\S]*?<\/noscript>/)[0];
 assert.match(noscript,/available above/);assert.doesNotMatch(noscript,/available below/);
 const cards=getCards(categoryHTML),catalog=JSON.parse(readAgentFile('skills.json'));
 const labels=cards.map(([,,c])=>renderedText(field(field(c,'top-inside'),'top-inside-label','span')));
 // Full byte scope is checked separately; these assertions make the featured inventory explicit.
 assert.equal(labels[19],'Featured:');assert.equal(labels.filter(l=>l==='Featured:').length,7);
 assert.deepEqual(labels,catalog.cards.map(c=>c.top_inside.label));
 for(const [i,label] of labels.entries())if(i!==19)assert.equal(label,renderedText(field(field(articles[i][2],'top-inside'),'top-inside-label','span')));
 const section=readAgentFile('llms-full.txt').split('### Claude Plugins Official\n')[1].split('\n### ')[0];
 assert.match(section,/^- Top inside: Featured: /m);
 assert.equal((categoryHTML.match(/class="inside-kind"/g)||[]).length,8);
 for(const [title,kind] of [['Vercel Skills','command'],['Graphify','subcommand']]){
  const c=cards.find(a=>a[2].includes('>'+title+'</h3>'))[2];
  assert.equal((c.match(new RegExp('<span class="inside-kind">\\('+kind+'\\)</span>','g'))||[]).length,4);
  assert.deepEqual(catalog.cards.find(c=>c.title===title).inside.filter(i=>i.kind).map(i=>i.kind),Array(4).fill(kind));
  assert.equal((readAgentFile('llms-full.txt').match(new RegExp(' \\('+kind+'\\) \\[','g'))||[]).length,4);
 }
 assert.doesNotMatch(readAgentFile('llms-full.txt'),/\(\((?:sub)?command\)\)/);
});
gate('polish2 M4/S1–S4 exact CSS scope and preserved rendered values',()=>{
 assert.equal(sha256(undoPolishCSS(undoFavouritesCSS(categoryStyles))),densityBaseline.polish2Before['styles.css']);
 const rootRule=categoryStyles.match(/:root\{([^}]*)}/)[1];
 for(const [name,value] of Object.entries(polishTokens))assert.ok(rootRule.includes(name+':'+value));
 const outsideRoot=categoryStyles.replace(/:root\{[^}]*}/,'');assert.ok(!outsideRoot.includes(monoStack));
 for(const selector of ['.number','.meta-stars','.inside-name','.example-prompt','.item-category']){
  const rule=outsideRoot.match(new RegExp('\\'+selector+'\\{([^}]*)}'))[1];assert.ok(rule.includes('var(--mono)'));
 }
 for(const [property,token,count] of [['text-underline-offset','--underline-offset',4],['text-decoration-thickness','--underline-thickness',2],['line-height','--leading-relaxed',2],['letter-spacing','--tracking-tight',2]]){
  assert.equal(outsideRoot.split(property+':var('+token+')').length-1,count);
  assert.ok(!outsideRoot.includes(property+':'+polishTokens[token]));
 }
 const desktop=categoryStyles.split('@media(min-width:641px){')[1].split('\n}')[0];
 assert.ok(desktop.includes('.skill-grid > .skill-card.first-visible::before{border-top:0}'));
 const mobile=categoryStyles.split('@media(max-width:640px){')[1].split('\n}')[0];
 assert.doesNotMatch(mobile,/\.skill-card\{padding:/);
 assert.match(categoryStyles,/@media\(min-width:1000px\)\{[^}]*\.skill-card\{padding:var\(--space-4\) var\(--space-4\) 0}/);
 for(const rule of ['.fit{margin:var(--space-3) 0}', '.fit p{margin:0;font-size:var(--type-small);line-height:var(--type-prose-leading);color:var(--body)}','.fit strong{font-weight:600;color:var(--ink)}'])assert.ok(categoryStyles.includes(rule));
});
const readHistoricalAgentFile = name => historicalAgentOutputs[name];
gate('polish2 agent-file scope: only card 15 label, short index unchanged',()=>{
 const json=JSON.parse(readHistoricalAgentFile('skills.json'));assert.equal(json.cards[19].id,'skill-15');assert.equal(json.cards[19].top_inside.label,'Featured:');
 json.cards[19].top_inside.label='Top inside:';
 assert.equal(sha256(JSON.stringify(json,null,2)+'\n'),densityBaseline.polish2Before['skills.json']);
 const full=readHistoricalAgentFile('llms-full.txt');
 const restored=full.replace(/(### Claude Plugins Official\n[\s\S]*?\n- Top inside: )Featured:/,'$1Top inside:');
 assert.notEqual(restored,full);assert.equal(sha256(restored),densityBaseline.polish2Before['llms-full.txt']);
 assert.equal(sha256(readHistoricalAgentFile('llms.txt')),densityBaseline.polish2Before['llms.txt']);
});
gate('polish2 recomputed shipped budgets and per-card scope',()=>{
 const measured=getCards(undoFavouritesHTML(categoryHTML)).map(([,,c])=>({title:renderedText(c.match(/<h3[^>]*>(.*?)<\/h3>/)[1]),visible:words(c.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1')),expanded:words(c)}));
 for(const kind of ['visible','expanded']){
  assert.deepEqual(measured.map(c=>c[kind]),densities.map((c,i)=>c[kind]-(i===19?1:0)));
  const total=measured.reduce((n,c)=>n+c[kind],0),max=Math.max(...measured.map(c=>c[kind]));
  assert.equal(total,kind==='visible'?1223:6248);
  console.log('Shipped '+kind,JSON.stringify({total,max,mean:total/22,maxCards:measured.filter(c=>c[kind]===max).map(c=>c.title)}));
 }
 console.table(measured);
});

gate('favourites shipped markup and script contracts',()=>{
 const cards=getCards(categoryHTML);
 assert.equal((categoryHTML.match(/class="favourite-button"/g)||[]).length,22);
 for(const [,,card] of cards){
  const id=card.match(/<h3 id="([^"]+)">/)[1];
  const title=card.match(/<h3[^>]*>([^<]+)<\/h3>/)[1];
  const button=`<button type="button" class="favourite-button" hidden data-favourite-for="${id}" aria-pressed="false" aria-label="Favourite ${title}">☆ Favourite</button>`;
  assert.ok(card.includes(button));assert.equal((card.match(/class="favourite-button"/g)||[]).length,1);
  assert.ok(field(card,'card-footer','div').includes('</a>'+button));
 }
 assert.equal((categoryHTML.match(/id="toggle-favourites"/g)||[]).length,1);
 assert.ok(categoryHTML.includes('<button type="button" class="filter" id="toggle-favourites" hidden aria-pressed="false">Favourites</button>'));
 assert.match(source,/topskills-favourites/);
 assert.match(source,/try \{[\s\S]*?localStorage.getItem[\s\S]*?catch/);
 assert.match(source,/try \{[\s\S]*?localStorage.setItem[\s\S]*?catch/);
 assert.match(source,/matchesCategory && matchesFavourite &&/);
 assert.match(source,/querySelectorAll\('\.favourite-button'\)/);
});

function exerciseFavourites(storage) {
 const ids=Object.fromEntries(['search','clear-search','toggle-favourites','reset-filters','empty-state','results-count'].map(id=>[id,element()]));
 const shipped=getCards(categoryHTML);
 const buttons=shipped.map(([,,c])=>Object.assign(element('☆ Favourite'),{hidden:true,dataset:{favouriteFor:c.match(/<h3 id="([^"]+)">/)[1]}}));
 const headings=shipped.map(([,,c])=>Object.assign(element(renderedText(c.match(/<h3[^>]*>(.*?)<\/h3>/)[1])),{id:c.match(/<h3 id="([^"]+)">/)[1]}));
 const cards=shipped.map(([,category,c],i)=>Object.assign(element(renderedText(c)),{
  dataset:{category},querySelector:selector=>selector==='h3'?headings[i]:null,
  cloneNode(){
   let markup=c;
   return {querySelectorAll(selector){if(selector==='.card-use')return [{remove(){markup=markup.replace(/<p class="card-use">[\s\S]*?<\/p>/g,'');}}];assert.equal(selector,'.favourite-button, .item-favourite-button');return [{remove(){markup=markup.replace(/<button type="button" class="favourite-button"[^>]*>[^<]*<\/button>/g,'');}}];},get textContent(){return renderedText(markup);}};
  }
 }));
 const filters=['All skills','Workflow','Design'].map(category=>Object.assign(element(),{dataset:{filter:category}}));
 const document={querySelector:selector=>ids[selector.slice(1)]||headings.find(h=>h.id===selector.slice(1)),querySelectorAll:selector=>({'.skill-card':cards,'.favourite-button':buttons,'[data-filter]':filters})[selector]||[]};
 vm.runInNewContext(source,{document,localStorage:{getItem:key=>key==='topskills-item-favourites'?null:storage.getItem(key),setItem:(key,value)=>storage.setItem(key,value)},console:{warn(){}}});
 return {ids,buttons,headings,cards,filters,visible:()=>cards.filter(c=>!c.hidden),search(value){ids.search.value=value;ids.search.fire('input');}};
}
gate('favourites behaviour: persistence, intersection, reset, search exclusion and labels',()=>{
 let saved;const storage={getItem(key){assert.equal(key,'topskills-favourites');return '["skill-1","skill-2","skill-5","skill-999",null]';},setItem(key,value){assert.equal(key,'topskills-favourites');saved=JSON.parse(value);}};
 const x=exerciseFavourites(storage);const {ids,buttons,headings,filters}=x;
 assert.equal(x.visible().length,22);assert.ok(buttons.every(b=>!b.hidden));assert.equal(ids['toggle-favourites'].hidden,false);
 for(const [i,b] of buttons.entries()){
  const pressed=['skill-1','skill-2','skill-5'].includes(headings[i].id);
  assert.equal(b.attrs['aria-pressed'],String(pressed));assert.equal(b.textContent,pressed?'★ Favourited':'☆ Favourite');
  assert.equal(b.attrs['aria-label'],pressed?`Remove ${headings[i].textContent} from favourites`:`Favourite ${headings[i].textContent}`);
 }
 ids['toggle-favourites'].click();assert.equal(x.visible().length,3);
 filters[1].click();assert.equal(x.visible().length,2);
 x.search('Superpowers');assert.equal(x.visible().length,1);
 x.search('ECC');assert.equal(x.visible().length,1);
 filters[2].click();assert.equal(x.visible().length,0);assert.equal(ids['empty-state'].hidden,false);
 ids['clear-search'].click();assert.equal(x.visible().length,1);assert.equal(ids['toggle-favourites'].attrs['aria-pressed'],'true');
 ids['reset-filters'].click();assert.equal(x.visible().length,22);assert.equal(ids['toggle-favourites'].attrs['aria-pressed'],'false');
 x.search('favourite');assert.equal(x.visible().length,0);assert.equal(buttons[0].textContent,'★ Favourited');
 x.search('');buttons[0].click();assert.equal(buttons[0].textContent,'☆ Favourite');assert.equal(buttons[0].attrs['aria-label'],'Favourite '+headings[0].textContent);assert.ok(!saved.includes(headings[0].id));
 buttons[0].click();assert.equal(buttons[0].textContent,'★ Favourited');assert.ok(saved.includes(headings[0].id));
 const reloaded=exerciseFavourites({getItem:()=>JSON.stringify(saved)});assert.equal(reloaded.buttons[0].attrs['aria-pressed'],'true');
 ids['toggle-favourites'].click();buttons[0].click();assert.equal(x.visible().length,2);
});
gate('favourites storage failures and corrupt data degrade to empty without crashes',()=>{
 for(const value of ['{broken','{}','null','["skill-999"]']){
  const x=exerciseFavourites({getItem:()=>value});x.ids['toggle-favourites'].click();assert.equal(x.visible().length,0);
 }
 const x=exerciseFavourites({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
 x.buttons[0].click();x.ids['toggle-favourites'].click();assert.equal(x.visible().length,0);assert.ok(x.buttons.every(b=>b.attrs['aria-pressed']==='false'));
});
gate('favourites exact CSS scope, accent discipline and recomputed budgets',()=>{
 assert.ok(categoryStyles.endsWith(favouriteCSS));assert.equal((categoryStyles.match(/var\(--accent\)/g)||[]).length,3);
 const shipped=getCards(categoryHTML),prior=getCards(undoFavouritesHTML(categoryHTML));
 const visible=card=>card.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1');
 for(const kind of ['visible','expanded']){
  const measure=card=>words(kind==='visible'?visible(card):card);
  const counts=shipped.map(([,,c])=>measure(c));
  assert.deepEqual(counts,prior.map(([,,c])=>measure(c)+2));
  const total=counts.reduce((a,b)=>a+b,0),max=Math.max(...counts),mean=total/22;
  assert.equal(total,kind==='visible'?1267:6292);assert.equal(max,kind==='visible'?79:906);assert.equal(mean,kind==='visible'?1267/22:286);
  console.log('Favourites shipped '+kind,JSON.stringify({total,max,mean,growth:44}));
  const pageTotal=measure(categoryHTML),priorPageTotal=measure(undoFavouritesHTML(categoryHTML));
  assert.equal(pageTotal,kind==='visible'?1465:6490);
  assert.equal(priorPageTotal,kind==='visible'?1418:6443);
  assert.equal(pageTotal-priorPageTotal,47);
  console.log('Favourites whole HTML '+kind,JSON.stringify({total:pageTotal,prior:priorPageTotal,growth:pageTotal-priorPageTotal}));
 }
 assert.equal(words('☆ Favourite'),2);assert.equal(words('Favourites'),1);assert.equal(words('and favourite'),2);
});

gate('item favourites shipped inventory and runtime contracts',()=>{
 let count=0;
 for(const [,,card] of getCards(itemHTML)){
  const id=card.match(/<h3 id="([^"]+)"/)[1];
  for(const [li] of card.matchAll(/<li>[\s\S]*?<\/li>/g)){
   const name=li.match(/class="inside-name">([^<]+)</)[1];
   assert.ok(li.includes(`<button type="button" class="item-favourite-button" hidden data-item-favourite-for="${id}:${name}" aria-pressed="false" aria-label="Favourite ${name}">☆</button>`));
   assert.equal((li.match(/class="item-favourite-button"/g)||[]).length,1); count++;
  }
 }
 assert.equal(count,124);
 assert.equal((itemHTML.match(/class="item-favourite-button"/g)||[]).length,124);
 assert.match(source,/topskills-item-favourites/);
 assert.match(source,/try \{[\s\S]*?localStorage.getItem\('topskills-item-favourites'\)[\s\S]*?catch/);
 assert.match(source,/try \{[\s\S]*?localStorage.setItem\('topskills-item-favourites'[\s\S]*?catch/);
 assert.match(source,/favourites.has[\s\S]*?hasFavouriteItem\(card\)/);
 assert.match(source,/item.hidden = [^;]*itemFavourites.has/);
 assert.match(source,/preFavouriteOpen/);
 assert.match(source,/inside.open = true/);
 assert.match(source,/inside.open = state.preFavouriteOpen/);
 assert.match(source,/querySelectorAll\('\.favourite-button, \.item-favourite-button'\)/);
 assert.match(source,/closest\('button'\)/);
});

function exerciseItemFavourites(storage, surface = itemHTML) {
 const ids=Object.fromEntries(['search','clear-search','toggle-favourites','reset-filters','empty-state','results-count','toggle-inside'].map(id=>[id,element()]));
 const shipped=getCards(surface);
 const lists=shipped.map(([,,c])=>{
  let markup='',rows=[];
  const list={
   get innerHTML(){return markup;},
   set innerHTML(value){
    markup=value;
    rows=[...value.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([,li])=>{
     const id=decodeHTML(li.match(/data-item-favourite-for="([^"]+)"/)[1]);
     const button=Object.assign(element('☆'),{hidden:true,dataset:{itemFavouriteFor:id}});
     return Object.assign(element(renderedText(li)),{button,querySelector:selector=>selector==='.item-favourite-button'?button:null});
    });
   },
   get textContent(){return renderedText(markup);},
   querySelectorAll(selector){return selector==='li'?rows:selector==='.item-favourite-button'?rows.map(row=>row.button):[];}
  };
  list.innerHTML=c.match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1]; return list;
 });
 const insides=lists.map(list=>Object.assign(element(),{querySelector:()=>list}));
 const headings=shipped.map(([,,c])=>Object.assign(element(renderedText(c.match(/<h3[^>]*>(.*?)<\/h3>/)[1])),{id:c.match(/<h3 id="([^"]+)"/)[1]}));
 const buttons=headings.map(h=>Object.assign(element(),{dataset:{favouriteFor:h.id}}));
 const cards=shipped.map(([,category,c],i)=>Object.assign(element(),{
  dataset:{category},
  querySelector:selector=>selector==='h3'?headings[i]:selector==='details.inside'?insides[i]:null,
  querySelectorAll:selector=>lists[i].querySelectorAll(selector),
  cloneNode(){let markup=c;return {querySelectorAll(selector){if(selector==='.card-use')return [{remove(){markup=markup.replace(/<p class="card-use">[\s\S]*?<\/p>/g,'');}}];assert.equal(selector,'.favourite-button, .item-favourite-button');return [{remove(){markup=markup.replace(/<button\b[^>]*class="(?:item-)?favourite-button"[^>]*>[^<]*<\/button>/g,'');}}];},get textContent(){return renderedText(markup);}};}
 }));
 const filters=['All skills','Workflow','Design'].map(category=>Object.assign(element(),{dataset:{filter:category}}));
 const document={...highlightDocument,querySelector:selector=>ids[selector.slice(1)]||headings.find(h=>h.id===selector.slice(1)),querySelectorAll:selector=>({'.skill-card':cards,'.favourite-button':buttons,'.item-favourite-button':lists.flatMap(l=>l.querySelectorAll('.item-favourite-button')),'.skill-card details.inside':insides,'[data-filter]':filters})[selector]||[]};
 vm.runInNewContext(source,{document,localStorage:storage,NodeFilter:{SHOW_TEXT:4},console});
 return {ids,cards,lists,insides,buttons,filters,visible:()=>cards.filter(c=>!c.hidden),item(id){return lists.flatMap(l=>l.querySelectorAll('.item-favourite-button')).find(b=>b.dataset.itemFavouriteFor===id);},search(value){ids.search.value=value;ids.search.fire('input');}};
}
gate('item favourites runtime: persistence, item-only rows, card union, intersections and restore',()=>{
 const saved={'topskills-favourites':'[]','topskills-item-favourites':'[]'};
 const storage={getItem:key=>saved[key],setItem:(key,value)=>{saved[key]=value;}};
 const x=exerciseItemFavourites(storage), id='skill-4:to-questionnaire';
 assert.equal(x.item(id).hidden,false);assert.equal(x.item(id).textContent,'☆');
 x.item(id).click();assert.equal(x.item(id).textContent,'★');assert.equal(x.item(id).attrs['aria-label'],'Remove to-questionnaire from favourites');
 assert.deepEqual(JSON.parse(saved['topskills-item-favourites']),[id]);assert.equal(saved['topskills-favourites'],'[]');
 const reload=exerciseItemFavourites(storage);assert.equal(reload.item(id).attrs['aria-pressed'],'true');
 x.insides[0].open=true;const prior=x.insides.map(i=>i.open);
 x.ids['toggle-favourites'].click();assert.equal(x.visible().length,1);assert.equal(x.cards[2].hidden,false);assert.equal(x.insides[2].open,true);
 assert.equal(x.lists[2].querySelectorAll('li').filter(li=>!li.hidden).length,1);
 x.search('to-questionnaire');assert.equal(x.visible().length,1);assert.equal(x.item(id).textContent,'★');
 x.filters[2].click();assert.equal(x.visible().length,0);assert.equal(x.ids['empty-state'].hidden,false);
 x.ids['clear-search'].click();assert.equal(x.ids['toggle-favourites'].attrs['aria-pressed'],'true');
 x.filters[0].click();assert.equal(x.visible().length,1);
 x.ids['toggle-favourites'].click();assert.deepEqual(x.insides.map(i=>i.open),prior);assert.ok(x.lists.every(l=>l.querySelectorAll('li').every(li=>!li.hidden)));
 // List replacement during search must leave item controls live and exclude labels from search.
 x.search('favourite');assert.equal(x.visible().length,0);x.search('');
 x.item('skill-16:skills add').click();assert.equal(x.item('skill-16:skills add').textContent,'★');
 x.ids['toggle-favourites'].click();x.buttons[2].click();assert.ok(x.lists[2].querySelectorAll('li').every(li=>!li.hidden));
 assert.equal(x.visible().length,2);
 x.buttons[2].click();x.item(id).click();assert.equal(x.visible().length,1);
 x.ids['reset-filters'].click();assert.equal(x.visible().length,22);assert.deepEqual(x.insides.map(i=>i.open),prior);assert.ok(x.lists.every(l=>l.querySelectorAll('li').every(li=>!li.hidden)));
 // Search and favourites can begin and end in either order.
 for(const order of ['search-first','filter-first']){
  const y=exerciseItemFavourites({getItem:key=>key==='topskills-item-favourites'?JSON.stringify([id]):'[]',setItem(){}});
  y.insides[1].open=true;const before=y.insides.map(i=>i.open);
  if(order==='search-first'){y.search('to-questionnaire');y.ids['toggle-favourites'].click();}else{y.ids['toggle-favourites'].click();y.search('to-questionnaire');}
  y.ids['toggle-favourites'].click();assert.equal(y.insides[2].open,true,'active search keeps its matching Inside list open');y.ids['clear-search'].click();assert.deepEqual(y.insides.map(i=>i.open),before);
 }
});
gate('item favourites corrupt and unavailable storage degrade safely',()=>{
 for(const value of ['{bad','{}','null','["skill-4:missing",null]']){
  const x=exerciseItemFavourites({getItem:key=>key==='topskills-item-favourites'?value:'[]'});
  x.ids['toggle-favourites'].click();assert.equal(x.visible().length,0);
 }
 const x=exerciseItemFavourites({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
 x.item('skill-4:to-questionnaire').click();assert.equal(x.item('skill-4:to-questionnaire').textContent,'☆');x.ids['toggle-favourites'].click();assert.equal(x.visible().length,0);
});
gate('item favourites measured shipped budgets and exact CSS additions',()=>{
 const added=itemStyles.slice(categoryStyles.length);
 assert.equal(rules(added).length,2);assert.ok(rules(added).every(([,selector])=>selector.trim().startsWith('.item-favourite-button')));
 assert.doesNotMatch(added,/accent|#[\da-f]+|shadow/);
 assert.equal((itemStyles.match(/var\(--accent\)/g)||[]).length,3);
 for(const kind of ['visible','expanded']){
  const measure=markup=>words(kind==='visible'?markup.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1'):markup);
  const counts=getCards(itemHTML).map(([,,c])=>measure(c));
  const prior=getCards(categoryHTML).map(([,,c])=>measure(c));
  const total=counts.reduce((a,b)=>a+b,0),max=Math.max(...counts),mean=total/22;
  assert.equal(total-prior.reduce((a,b)=>a+b,0),kind==='visible'?0:124);
  assert.deepEqual({total,max,mean,pageTotal:measure(itemHTML)},densityBaseline.itemFavouritesBudgets[kind]);
  console.log('Item favourites measured '+kind,JSON.stringify({total,max,mean,pageTotal:measure(itemHTML)}));
 }
});

// Polish3 behaviour gates: exercise the shipped script, not source-string presence.
gate('polish3 M2 search exposes matching non-favourite rows',()=>{
 const x=exerciseItemFavourites({getItem:key=>key==='topskills-item-favourites'?'["skill-4:to-questionnaire"]':'[]',setItem(){}});
 x.ids['toggle-favourites'].click();
 x.search('domain-modeling');
 assert.equal(x.visible().length,1);
 assert.equal(x.cards[2].hidden,false);
 const matching=x.lists[2].querySelectorAll('li').find(row=>row.button.dataset.itemFavouriteFor==='skill-4:domain-modeling');
 assert.ok(matching);
 assert.equal(matching.hidden,false);
 assert.equal(x.ids['results-count'].textContent,'1 skill in the collection');
});
gate('polish3 S5 inside control disables at zero results and recovers',()=>{
 const x=exerciseItemFavourites({getItem:()=> '[]',setItem(){}});
 assert.equal(x.ids['toggle-inside'].disabled,false);
 x.search('polish3-no-matching-skill');
 assert.equal(x.visible().length,0);
 assert.equal(x.ids['toggle-inside'].disabled,true);
 x.ids['clear-search'].click();
 assert.equal(x.visible().length,22);
 assert.equal(x.ids['toggle-inside'].disabled,false);
});

// UIUX behaviour gates: M2 only; execute the shipped script against the DOM double.
gate('uiux M2 favourites active state follows toggle and reset',()=>{
 const x=exerciseItemFavourites({getItem:()=> '[]',setItem(){}});
 const toggle=x.ids['toggle-favourites'];
 assert.equal(toggle.classList.contains('active'),false);
 toggle.click();
 assert.equal(toggle.classList.contains('active'),true);
 assert.equal(toggle.attrs['aria-pressed'],'true');
 toggle.click();
 assert.equal(toggle.classList.contains('active'),false);
 assert.equal(toggle.attrs['aria-pressed'],'false');
 toggle.click();
 x.ids['reset-filters'].click();
 assert.equal(toggle.classList.contains('active'),false);
 assert.equal(toggle.attrs['aria-pressed'],'false');
});

// pstack23 shipped-surface gates: content, source inventories, runtime and budgets.
gate('pstack23 shipped inventory, sources, categories, buttons and unique prompts',()=>{
 const cards=getCards(shippedHTML), card=cards.find(a=>a[0].includes('aria-labelledby="skill-20"'))[2];
 const rows=[...card.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>m[1]);
 assert.equal(rows.length,23);
 assert.deepEqual(rows.map(row=>row.match(/class="inside-name">([^<]+)</)[1]),['bug-fix','feature','investigation','refactoring','perf-issue',...pstack23Names]);
 assert.equal(renderedText(card.match(/<summary>([\s\S]*?)<\/summary>/)[1]),'Inside this repo — 23 playbooks');
 assert.equal((shippedHTML.match(/<li>/g)||[]).length,160);
 const allPrompts=[...shippedHTML.matchAll(/<p class="example-prompt">([^<]*)<\/p>/g)].map(m=>decodeHTML(m[1]));
 assert.equal(allPrompts.length,160);assert.equal(new Set(allPrompts).size,160);
 const shippedPairs=new Map();
 for(const [,,markup] of getCards(shippedCategoryHTML)){
  const title=renderedText(markup.match(/<h3[^>]*>(.*?)<\/h3>/)[1]);
  const expectedCard=shippedExpectedInside.find(c=>c.title===title);
  const items=[...markup.matchAll(/<li>([\s\S]*?)<\/li>/g)];
  assert.equal(items.length,expectedCard.items.length);
  for(const [i,[,row]] of items.entries()){
   const name=row.match(/class="inside-name">([^<]+)</)[1];
   const category=row.match(/class="item-category">([^<]+)</)[1];
   const prompt=decodeHTML(row.match(/class="example-prompt">([^<]*)</)[1]);
   assert.equal(name,expectedCard.items[i].name);
   assert.equal(prompt,shippedPromptMap.get(title).get(name));
   shippedPairs.set(JSON.stringify([title,name]),category);
  }
 }
 assert.equal(shippedPairs.size,160);
 assert.deepEqual(shippedPairs,new Map(shippedCategoryAssignments.map(([card,name,category])=>[JSON.stringify([card,name]),category])));
 const expected=shippedExpectedInside.find(c=>c.title==='pstack');
 for(const [i,row] of rows.entries()) {
  const name=row.match(/class="inside-name">([^<]+)</)[1];
  const categories=[...row.matchAll(/<span class="item-category">([^<]+)<\/span>/g)];
  assert.equal(categories.length,1);
  assert.equal(categories[0][1],shippedCategoryAssignments.find(([c,n])=>c==='pstack'&&n===name)[2]);
  const prompts=[...row.matchAll(/<p class="example-prompt">([^<]*)<\/p>/g)];assert.equal(prompts.length,1);
  const prompt=decodeHTML(prompts[0][1]);assert.equal(prompt,shippedPromptMap.get('pstack').get(name));
  assert.match(prompt,/^\/poteto-mode /);assert.doesNotMatch(prompt,/[\r\n]|\bexample\.(?:com|org|net)\b|\b(?:localhost|your-domain|placeholder)\b/i);
  const fn=renderedText(row.split(' — ')[1].replace(/<p class="example-prompt">[\s\S]*/,''));
  assert.equal(fn,expected.items[i].fn);
  if(i<5)continue;
  assert.equal(categories[0][1],pstack23Categories[name]);
  assert.equal((row.match(/class="item-favourite-button"/g)||[]).length,1);
  assert.ok(row.includes(`<button type="button" class="item-favourite-button" hidden data-item-favourite-for="skill-20:${name}" aria-pressed="false" aria-label="Favourite ${name}">☆</button>`));
  const source='https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/'+name+'.md';
  assert.ok(promptSource.includes('- `'+name+'` — '+prompt+'\n  - Grade: Crafted (illustrative, not repo-quoted). Source: '+source));
 }
 // Undo feeds all protected historical hashes; it also proves no other card changed.
 assert.deepEqual(getCards(shippedHTML).filter(a=>!a[0].includes('aria-labelledby="skill-20"')).map(a=>a[0]),getCards(undoPstack23(shippedHTML)).filter(a=>!a[0].includes('aria-labelledby="skill-20"')).map(a=>a[0]));
 assert.equal((fs.readFileSync(path.join(root,'styles.css'),'utf8').match(/var\(--accent\)/g)||[]).length,3);
});
gate('pstack23 shipped search and Favourites for every new item',()=>{
 for(const name of pstack23Names){
  const saved={};const storage={getItem:key=>saved[key]||'[]',setItem:(key,value)=>{saved[key]=value;}};
  const x=exerciseItemFavourites(storage,shippedHTML), id='skill-20:'+name;
  const cardIndex=getCards(shippedHTML).findIndex(a=>a[0].includes('aria-labelledby="skill-20"'));
  x.search(shippedPromptMap.get('pstack').get(name));assert.equal(x.visible().length,1,name+' prompt search');assert.equal(x.cards[cardIndex].hidden,false);
  x.search('');x.item(id).click();assert.equal(x.item(id).attrs['aria-pressed'],'true');
  x.ids['toggle-favourites'].click();assert.equal(x.visible().length,1);assert.equal(x.cards[cardIndex].hidden,false);
  const rows=x.lists[cardIndex].querySelectorAll('li').filter(row=>!row.hidden);assert.equal(rows.length,1);assert.equal(rows[0].button.dataset.itemFavouriteFor,id);
  const reload=exerciseItemFavourites(storage,shippedHTML);assert.equal(reload.item(id).attrs['aria-pressed'],'true');
 }
});
gate('pstack23 measured shipped budgets',()=>{
 for(const kind of ['visible','expanded']){
  const measure=markup=>words(kind==='visible'?markup.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1'):markup);
  const counts=getCards(shippedHTML).map(([,,c])=>measure(c)), total=counts.reduce((a,b)=>a+b,0), max=Math.max(...counts);
  console.log('pstack23 shipped '+kind,JSON.stringify({total,max,meanNumerator:total,meanDenominator:22,pageTotal:measure(shippedHTML)}));
  assert.equal(total-getCards(undoPstack23(shippedHTML)).reduce((n,[,,c])=>n+measure(c),0),kind==='visible'?-2:words(rowsForBudget())-2);
 }
 function rowsForBudget(){return getCards(shippedHTML).find(a=>a[0].includes('aria-labelledby="skill-20"'))[2].match(/ <li>[^\n]*<\/li>\n/g).slice(5).join('');}
});

// impeccable23 shipped-surface gates: content, source inventories, runtime and budgets.
gate('impeccable23 shipped inventory, exact scope, sources, categories, buttons and prompts',()=>{
 const cards=getCards(shippedHTML),card=cards.find(a=>a[0].includes('aria-labelledby="skill-22"'))[2];
 const rows=[...card.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>m[1]);
 assert.equal(rows.length,23);
 assert.deepEqual(rows.map(row=>row.match(/class="inside-name">([^<]+)</)[1]),['init','polish','bolder','critique','audit',...impeccable23Names]);
 assert.equal(renderedText(card.match(/<summary>([\s\S]*?)<\/summary>/)[1]),'Inside this repo — 23 commands');
 assert.equal((shippedHTML.match(/<li>/g)||[]).length,160);
 const prompts=[...shippedHTML.matchAll(/<p class="example-prompt">([^<]*)<\/p>/g)].map(m=>decodeHTML(m[1]));
 assert.equal(prompts.length,160);assert.equal(new Set(prompts).size,160);
 // Command-name checks deliberately permit the protected English word in the Use line.
 for(const [,,markup] of cards)for(const [,name] of markup.matchAll(/<li><code class="inside-name">([^<]+)</g))assert.notEqual(name,'craft');
 const catalog=JSON.parse(readAgentFile('skills.json'));
 for(const c of catalog.cards)for(const item of c.inside)assert.notEqual(item.name,'craft');
 const full=readAgentFile('llms-full.txt');assert.doesNotMatch(full,/^- craft(?: \[| \()/m);
 const expected=shippedExpectedInside.find(c=>c.title==='Impeccable');
 assert.equal(catalog.cards.find(c=>c.id==='skill-22').inside_summary,c3Table.find(r=>r.id==='skill-22').newSummary);
 const sourceBody=designCopy.split('## Card 23 — Impeccable\n')[1].split('## Items deliberately NOT shipped')[0];
 for(const [i,row] of rows.entries()){
  const name=row.match(/class="inside-name">([^<]+)</)[1];
  const categories=[...row.matchAll(/<span class="item-category">([^<]+)<\/span>/g)];assert.equal(categories.length,1);
  const examples=[...row.matchAll(/<p class="example-prompt">([^<]*)<\/p>/g)];assert.equal(examples.length,1);
  const prompt=decodeHTML(examples[0][1]);assert.equal(prompt,shippedPromptMap.get('Impeccable').get(name));
  const fn=renderedText(row.split(' — ')[1].replace(/<p class="example-prompt">[\s\S]*/,''));assert.equal(fn,expected.items[i].fn);
  assert.doesNotMatch(row,/inside-kind/);
  if(i<5)continue;
  assert.equal(categories[0][1],impeccable23Categories[name]);
  assert.equal((row.match(/class="item-favourite-button"/g)||[]).length,1);
  assert.ok(row.includes(`<button type="button" class="item-favourite-button" hidden data-item-favourite-for="skill-22:${name}" aria-pressed="false" aria-label="Favourite ${name}">☆</button>`));
  assert.match(prompt,new RegExp('^(?:Run )?/impeccable '+name+' '));
  assert.doesNotMatch(prompt,/[\r\n]|\bexample\.(?:com|org|net)\b|\b(?:localhost|your-domain|placeholder)\b/i);
  assert.ok(sourceBody.includes('- `'+name+'` — '+fn+'\n  - Prompt: '+prompt+'\n  - Prompt grade: Crafted (illustrative, not repo-quoted). Function source: ../workflow-run-impeccable23/command-metadata.md#'+name));
  assert.ok(categorySource.includes('| Impeccable | '+name+' | '+impeccable23Categories[name]+' | Confident |  |'));
 }
 // Combined historical hashes protect original rows and all surrounding bytes.
 assert.deepEqual(cards.filter(a=>!a[0].includes('aria-labelledby="skill-22"')).map(a=>a[0]),getCards(undoImpeccable23(shippedHTML)).filter(a=>!a[0].includes('aria-labelledby="skill-22"')).map(a=>a[0]));
 assert.equal((fs.readFileSync(path.join(root,'styles.css'),'utf8').match(/var\(--accent\)/g)||[]).length,3);
});
gate('impeccable23 shipped search and Favourites for every new item',()=>{
 for(const name of impeccable23Names){
  const saved={};const storage={getItem:key=>saved[key]||'[]',setItem:(key,value)=>{saved[key]=value;}};
  const x=exerciseItemFavourites(storage,shippedHTML),id='skill-22:'+name;
  const cardIndex=getCards(shippedHTML).findIndex(a=>a[0].includes('aria-labelledby="skill-22"'));
  x.search(shippedPromptMap.get('Impeccable').get(name));assert.equal(x.visible().length,1,name+' prompt search');assert.equal(x.cards[cardIndex].hidden,false);
  x.search('');x.item(id).click();assert.equal(x.item(id).attrs['aria-pressed'],'true');
  x.ids['toggle-favourites'].click();assert.equal(x.visible().length,1);assert.equal(x.cards[cardIndex].hidden,false);
  const rows=x.lists[cardIndex].querySelectorAll('li').filter(row=>!row.hidden);assert.equal(rows.length,1);assert.equal(rows[0].button.dataset.itemFavouriteFor,id);
  const reload=exerciseItemFavourites(storage,shippedHTML);assert.equal(reload.item(id).attrs['aria-pressed'],'true');
 }
});
gate('impeccable23 measured shipped budgets',()=>{
 for(const kind of ['visible','expanded']){
  const measure=markup=>words(kind==='visible'?markup.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1'):markup);
  const counts=getCards(shippedHTML).map(([,,c])=>measure(c)),total=counts.reduce((a,b)=>a+b,0),max=Math.max(...counts);
  const prior=undoImpeccable23(shippedHTML),added=getCards(shippedHTML).find(a=>a[0].includes('aria-labelledby="skill-22"'))[2].match(/ <li>[^\n]*<\/li>\n/g).slice(5).join('');
  assert.equal(total-getCards(prior).reduce((n,[,,c])=>n+measure(c),0),kind==='visible'?0:words(added));
  assert.equal(measure(shippedHTML)-measure(prior),kind==='visible'?0:words(added));
  console.log('impeccable23 shipped '+kind,JSON.stringify({total,max,meanNumerator:total,meanDenominator:22,pageTotal:measure(shippedHTML)}));
 }
});


const cycle1Footers = {
 "skill-1": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 12 more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-2": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 12 more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-4": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 7 more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-12": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 38 more \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">uv tool install specify-cli</code></p>",
 "skill-16": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 75+ more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-20": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Cursor \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-3": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Cursor \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-8": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 8 more \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">npx skills add addyosmani/agent-skills</code></p>",
 "skill-5": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 21 more \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">npm install -g ui-ux-pro-max-cli</code></p>",
 "skill-21": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">npx skills add https://github.com/Leonxlnx/taste-skill --skill \"design-taste-frontend\"</code></p>",
 "skill-22": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 17 more \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">npx impeccable install</code></p>",
 "skill-6": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 38 more \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">npx @caveman-ai/cli@latest</code></p>",
 "skill-7": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 18 more \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">uv tool install graphifyy</code></p>",
 "skill-9": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 14 more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-11": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Claude.ai, Claude API \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-14": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, OpenCode \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">npx skills add https://github.com/kepano/obsidian-skills</code></p>",
 "skill-19": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Antigravity CLI \u00b7 <span class=\"card-use-label\">Install:</span> <code class=\"card-use-code\">npx skills add google/skills</code></p>",
 "skill-10": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 9 more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-13": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-15": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-17": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 5 more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>",
 "skill-18": "<p class=\"card-use\"><span class=\"card-use-label\">Works with:</span> Claude Code, Codex, Cursor and 10 more \u00b7 <span class=\"card-use-label\">Install:</span> see GitHub repository</p>"
};
const cycle1ExpectedStrip = "<section class=\"start-strip\" aria-labelledby=\"start-title\"><h2 id=\"start-title\">Start with 3</h2><p class=\"start-criterion\">One pick per task phase, chosen from each card's own Use-when line. A starting point, not a ranking.</p><div class=\"start-list\" role=\"list\"><div class=\"start-item\" role=\"listitem\"><span class=\"start-phase\">Plan</span><a href=\"#skill-4\">Matt Pocock Skills</a><span class=\"start-when\">At the start of feature or bug work</span><span class=\"start-stars\">305,511 stars</span></div><div class=\"start-item\" role=\"listitem\"><span class=\"start-phase\">Build</span><a href=\"#skill-3\">Karpathy Skills</a><span class=\"start-when\">During a non-trivial coding task</span><span class=\"start-stars\">225,828 stars</span></div><div class=\"start-item\" role=\"listitem\"><span class=\"start-phase\">Review (frontend)</span><a href=\"#skill-22\">Impeccable</a><span class=\"start-when\">When designing, critiquing, polishing, or auditing frontend interfaces</span><span class=\"start-stars\">94,446 stars</span></div></div></section>";
const cycle1ExpectedNote = "<section class=\"how-to\" aria-labelledby=\"how-to-title\"><h2 id=\"how-to-title\">How to use a skill</h2><p>A skill is a set of instructions that teaches your coding agent a repeatable way of working. Install one from its repository, then ask your agent for it by name or paste an example prompt from the card's Inside list.</p><p>Each card's Works with and Install lines come from the repository's own documentation. Some commands set up a tool first, and some repositories state no single command, so follow the README for the next step.</p></section>";
const cycle1ExpectedCSS = ".start-strip,.how-to{margin:0 0 var(--space-5)}\n.start-strip{border-top:1px solid var(--ink);padding-top:var(--space-2)}\n.start-strip h2,.how-to h2{font:normal var(--type-note)/var(--type-entry-leading) var(--serif);letter-spacing:0;margin:0 0 var(--space-1)}\n.start-criterion{margin:0 0 var(--space-3);font-size:var(--type-small);line-height:var(--type-prose-leading);color:var(--body)}\n.start-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-3)}\n.start-item{display:flex;flex-direction:column;gap:var(--space-1);padding-top:var(--space-2);border-top:1px solid var(--line)}\n.start-phase{font-family:var(--mono);font-size:var(--type-mono);font-weight:600;font-variant-caps:small-caps;letter-spacing:.08em;color:var(--ink)}\n.start-item a{font:normal var(--type-note)/var(--type-entry-leading) var(--serif);color:var(--ink);text-underline-offset:var(--underline-offset);overflow-wrap:anywhere}\n.start-when{font-size:var(--type-small);line-height:var(--type-prose-leading);color:var(--body)}\n.start-stars{font:var(--type-mono) var(--mono);font-variant-numeric:tabular-nums;color:var(--muted)}\n.how-to{border-top:1px solid var(--line);padding-top:var(--space-2);max-width:62ch}\n.how-to p{margin:0 0 var(--space-1);font-size:var(--type-small);line-height:var(--type-prose-leading);color:var(--body)}\n.card-use{flex:0 0 100%;margin:0;padding:var(--space-1) 0 0;font:var(--type-mono)/var(--type-list-leading) var(--mono);color:var(--muted);overflow-wrap:anywhere}\n.card-use-label{color:var(--ink)}\n.card-use-code{font:inherit;color:var(--ink)}\n@media(max-width:1000px){.start-list{grid-template-columns:1fr}}\n";
// Cycle 1 gates inspect raw files; historical gates above retain undone inputs.
const cycle1Cards = getCards(cycle1HTML), cycle1BeforeCards=getCards(shippedHTML);
const cycle1Id = card => card.match(/<h3 id="([^"]+)">/)[1];
const cycle1Count = (text, pattern) => [...text.matchAll(pattern)].length;
const cycle1Section = cls => cycle1HTML.match(new RegExp('<section class="'+cls+'"[\\s\\S]*?</section>'))?.[0] || '';
const cycle1Strip=cycle1Section('start-strip'),cycle1Note=cycle1Section('how-to');
gate('cycle1 G1 byte-scope',()=>{
 assert.equal(sha256(shippedHTML),'dbc1050244fb035757f920707278b3466c71686de4ead656476145fa63338622');
 assert.equal(sha256(undoCycle1CSS(cycle1Styles)),'3eedac1055ee0758e6a3d2c0297fff9ffc2e35a86496a983432edda760f0915a');
 assert.equal(sha256(sourcePreCycle1),'4bbdad590105319abdaede884ee47caf3fdaf88c3a2d1c4cbe3141ece9078d12');
 for(const [pattern,n] of [[/<li>/g,160],[/class="example-prompt"/g,160],[/class="inside-name"/g,202],[/<section class="start-strip"/g,1],[/<section class="how-to"/g,1],[/<p class="card-use">/g,22]])assert.equal(cycle1Count(cycle1HTML,pattern),n);
 assert.equal(cycle1Cards.length,22);
 cycle1Cards.forEach(([,,c],i)=>assert.equal(undoCycle1HTML(c),cycle1BeforeCards[i][2]));
});
gate('cycle1 G2 strip',()=>{
 assert.equal(cycle1Strip,cycle1ExpectedStrip);
 assert.match(cycle1HTML,/<main><div class="container"><section class="hero"[^\n]*<\/section>\n<section class="start-strip"/);
 const items=[...cycle1Strip.matchAll(/<div class="start-item"[^>]*>([\s\S]*?)<\/div>/g)];assert.equal(items.length,3);
 assert.deepEqual(items.map(([,c])=>c.match(/href="([^"]+)"/)[1]),['#skill-4','#skill-3','#skill-22']);
 for(const [,c] of items){const [,id,title]=c.match(/<a href="#([^"]+)">([^<]+)<\/a>/);const matches=cycle1Cards.filter(([,,x])=>cycle1Id(x)===id);assert.equal(matches.length,1);const card=matches[0][2];assert.equal(renderedText(card.match(/<h3[^>]*>(.*?)<\/h3>/)[1]),title);assert.ok(renderedText(field(card,'fit-use')).replace(/^Use when\s*/,'').startsWith(renderedText(field(c,'start-when','span'))));assert.equal(renderedText(field(c,'start-stars','span')),renderedText(field(card,'meta-stars','span'))+' stars');}
 assert.doesNotMatch(cycle1Strip,/<li>|class="chapter"|—/);
});
gate('cycle1 G3 note',()=>{assert.equal(cycle1Note,cycle1ExpectedNote);assert.ok(cycle1HTML.includes(cycle1Strip+'\n'+cycle1Note+'\n<section tabindex="-1" id="collection"'));assert.doesNotMatch(cycle1Note,/`|npx |npm |uv tool|curl /);});
gate('cycle1 G4 order',()=>{const positions=['<section class="hero"','<section class="start-strip"','<section class="how-to"','<section tabindex="-1" id="collection"'].map(t=>cycle1HTML.indexOf(t));assert.ok(positions.every((n,i)=>n>=0&&(!i||n>positions[i-1])));});
gate('cycle1 G5 footer lines',()=>{
 assert.equal(cycle1Count(cycle1HTML,/<p class="card-use">/g),22);
 const fallback=[];let commands=0;
 const researchPath=path.join(os.homedir(),'workspace/workflow-run-critique-cycle1/agy-table.md');
 const research=fs.existsSync(researchPath)?fs.readFileSync(researchPath,'utf8'):null;
 for(const [,,c] of cycle1Cards){const id=cycle1Id(c),line=field(c,'card-use'),footer=field(c,'card-footer','div');assert.equal(line,cycle1Footers[id]);assert.ok(footer.startsWith('<div class="card-footer">'+line+'<a href='));assert.equal(cycle1Count(footer,/<a /g),1);assert.equal(cycle1Count(footer,/class="favourite-button"/g),1);assert.ok(footer.includes('</a><button type="button" class="favourite-button"'));assert.doesNotMatch(line,/<a|<button|<svg/);
 const command=field(line,'card-use-code','code');if(command)commands++;else {assert.ok(renderedText(line).includes('Install: see GitHub repository'));fallback.push(id);}
 if(research){const title=renderedText(c.match(/<h3[^>]*>(.*?)<\/h3>/)[1]);const row=research.split('\n').find(r=>r.startsWith('| '+title+' |'));assert.ok(row,title);const cells=row.split(/(?<!\\)\|/).map(t=>t.trim());const harnesses=cells[3].split(', ').map(t=>/^Codex\b|^OpenAI Codex$/.test(t)?'Codex':t);const shown=renderedText(line).split('Works with: ')[1].split(' · Install:')[0];const names=shown.replace(/ and \d+\+? more$/,'').split(', ');for(const name of names)assert.ok(harnesses.includes(name),title+': '+name);const more=shown.match(/ and (\d+\+?) more$/);if(more)assert.equal(more[1],id==='skill-16'?'75+':String(harnesses.length-3));if(command)assert.equal(renderedText(command),cells[4].slice(1,-1));}
 }
 assert.equal(commands,9);assert.deepEqual(fallback.sort(),['skill-1','skill-2','skill-4','skill-16','skill-20','skill-3','skill-9','skill-11','skill-10','skill-13','skill-15','skill-17','skill-18'].sort());
});
gate('cycle1 G6 no invention',()=>{
 const commands=Object.values(cycle1Footers).map(c=>field(c,'card-use-code','code')).filter(Boolean).map(renderedText).sort();
 assert.deepEqual(cycle1Cards.map(([,,c])=>field(c,'card-use-code','code')).filter(Boolean).map(renderedText).sort(),commands);assert.equal(commands.length,9);
 for(const [,,c] of cycle1Cards){const line=field(c,'card-use');assert.doesNotMatch(line,/--agy|\/plugin|\/add-plugin|curl|claude plugin|specify init|uipro/);if(cycle1Id(c)!=='skill-6')assert.doesNotMatch(line,/@latest/);}
});
const cycle1Runtime = surface => exerciseItemFavourites({getItem:()=>null,setItem(){}},surface);
const cycle1Visible = x => x.cards.flatMap((c,i)=>c.hidden?[]:[cycle1Id(getCards(cycle1HTML)[i][2])]);
gate('cycle1 G7 search pollution',()=>{
 assert.match(source,/querySelectorAll\('\.favourite-button, \.item-favourite-button'\)/);assert.match(source,/querySelectorAll\('\.card-use'\)/);
 const raw=cycle1Runtime(cycle1HTML),undone=cycle1Runtime(shippedHTML),counts={};
 for(const probe of ['works with','install:','see github repository','uv tool install','npx skills add','and 12 more','75+ more','codex','cursor','claude code','antigravity','opencode','claude.ai','npm install -g','npx']){raw.search(probe);undone.search(probe);assert.deepEqual(cycle1Visible(raw),cycle1Visible(undone),probe);counts[probe]=raw.visible().length;}
 assert.equal(cycle1Cards.filter(([,,c])=>renderedText(c).toLowerCase().includes('see github repository')).length,13);raw.search('see github repository');assert.equal(raw.visible().length,0);assert.equal(raw.ids['empty-state'].hidden,false);console.log('Cycle1 search counts',JSON.stringify(counts));
});
gate('cycle1 G8 behaviour unchanged',()=>{
 const x=cycle1Runtime(cycle1HTML),prior=cycle1Runtime(shippedHTML);
 for(const [i,n] of [[1,6],[2,3],[0,22]]){x.filters[i].click();assert.equal(x.visible().length,n);}
 x.search('Superpowers');prior.search('Superpowers');assert.deepEqual(cycle1Visible(x),cycle1Visible(prior));x.search('');x.buttons[0].click();x.ids['toggle-favourites'].click();assert.deepEqual(cycle1Visible(x),['skill-1']);x.ids['reset-filters'].click();x.search('favourite');assert.equal(x.visible().length,0);
 assert.deepEqual(c3Cards.map(([,,c])=>renderedText(field(c,'number','span'))),c3Table.map(r=>r.newNumber));assert.deepEqual(c3Cards.map(([,,c])=>c3Summary(c)),c3Table.map(r=>r.newSummary));
 for(const cls of ['number'])assert.deepEqual(cycle1Cards.map(([,,c])=>field(c,cls,'span')),cycle1BeforeCards.map(([,,c])=>field(c,cls,'span')));
 assert.deepEqual([...cycle1HTML.matchAll(/<summary>(.*?)<\/summary>/g)].map(m=>m[1]),[...shippedHTML.matchAll(/<summary>(.*?)<\/summary>/g)].map(m=>m[1]));
});
gate('cycle1 G9 accent and CSS scope',()=>{
 assert.equal(cycle1Count(cycle1Styles,/var\(--accent\)/g),3);const i=cycle1Styles.indexOf('\n.start-strip,.how-to{');assert.ok(i>0);const block=cycle1Styles.slice(i+1).replace(cycle2CSS,'');assert.equal(block,cycle1ExpectedCSS);assert.doesNotMatch(block,/--accent|#[0-9a-f]|rgb\(|hsl\(|border-radius|box-shadow|3px/);
});
gate('cycle1 G10 agent files unchanged',()=>{
 const hashes={'skills.json':'0f8700a5f2cecaa73eb639100fc4bdb7a773a67062834a919f4b880a3601b290','llms.txt':'e7dda79605966d58e982e833dc32271086cd460f4a211cc27c8e755b86195553','llms-full.txt':'8c76c03d19d1e256f8ba0f111ecb51f8676368edd2852e518b5db713ff3f3857'};
 const generated=require('./generate-agent-layer').generate(cycle1HTML,'https://topskillsfordevelopment.vercel.app');
 for(const [name,hash] of Object.entries(hashes)){const disk=fs.readFileSync(path.join(root,name),'utf8');assert.equal(sha256(generated[name]),hash);assert.deepEqual(require('./generate-agent-layer').generate(c3HTML,'https://topskillsfordevelopment.vercel.app')[name],disk);}
});
gate('cycle1 G11 budgets',()=>{
 const totals={};for(const kind of ['visible','expanded']){const measure=t=>words(kind==='visible'?t.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1'):t);const counts=cycle1Cards.map(([,,c],i)=>{assert.equal(measure(c),measure(cycle1BeforeCards[i][2])+words(field(c,'card-use')));return measure(c);});totals[kind]={cards:counts.reduce((a,b)=>a+b,0),max:Math.max(...counts),page:measure(cycle1HTML)};assert.deepEqual(totals[kind],kind==='visible'?{cards:1552,max:87,page:1888}:{cards:8666,max:1354,page:9002});}
 assert.equal(words(cycle1Strip),58);assert.equal(words(cycle1Note),80);assert.equal(cycle1Cards.reduce((n,[,,c])=>n+words(field(c,'card-use')),0),287);console.log('Cycle1 budgets',JSON.stringify(totals),'strip 58 note 80 footers 287');
});


// Cycle 3 gates always inspect the actual shipped files.
gate('cycle3 C3-G1 numbering',()=>{
 assert.deepEqual(c3Cards.map(a=>a[2].match(/<h3 id="([^"]+)"/)[1]),c3Table.map(r=>r.id));
 const chapters={};for(const r of c3Table){const c=c3Cards.find(a=>a[2].includes('<h3 id="'+r.id+'">'))[0];assert.equal(renderedText(field(c,'number','span')),r.newNumber);assert.match(r.newNumber,/^0\d$/);assert.equal(c3Attrs(c,'aria-labelledby')[0],r.id);assert.equal(c3Attrs(c,'data-category')[0],r.chapter);(chapters[r.chapter]??=[]).push(r.newNumber);}
 for(const ns of Object.values(chapters))assert.deepEqual(ns,ns.map((_,i)=>String(i+1).padStart(2,'0')));
 for(const attr of ['data-favourite-for','data-item-favourite-for'])assert.deepEqual(c3Attrs(c3HTML,attr),c3Attrs(c3Pre,attr));
 assert.deepEqual(c3Attrs(c3HTML,'data-favourite-for'),c3Table.map(r=>r.id));assert.equal(c3Attrs(c3HTML,'data-item-favourite-for').length,160);
 const strip=t=>t.match(/<section class="start-strip"[\s\S]*?<\/section>/)[0];assert.equal(strip(c3HTML),strip(c3Pre));assert.deepEqual(c3Attrs(strip(c3HTML),'href'),['#skill-4','#skill-3','#skill-22']);for(const href of c3Attrs(strip(c3HTML),'href'))assert.ok(c3HTML.includes('<h3 id="'+href.slice(1)+'">'));
 assert.doesNotMatch(source,/\bnumber\b|\.number/);assert.equal(sha256(c3Read('styles.css')),c3Hashes['styles.css']);
});
gate('cycle3 C3-G2 summary labels',()=>{
 let t=0,f=0;const featured=[];
 for(const r of c3Table){const c=c3Card(r.id),old=c3Card(r.id,c3Pre),summary=c3Summary(c);assert.equal(summary,r.newSummary);assert.equal(c3Rows(c).length,r.shown);assert.equal((c.match(/<li><code class="inside-name">/g)||[]).length,r.shown);
 const m=summary.match(r.total===null?/^Featured — (\d+) (.+), total not stated$/:/^Inside this repo — (\d+) of (\d+) (.+)$/);assert.ok(m);assert.equal(+m[1],r.shown);if(r.total===null){f++;featured.push(r.id);}else{t++;assert.equal(+m[2],r.total);}
 assert.deepEqual(c.match(/<p class="inside-note">[^<]*<\/p>/g),old.match(/<p class="inside-note">[^<]*<\/p>/g));
 if(r.total===null&&r.id!=='skill-18')assert.ok(c.includes('<p class="inside-note">Featured entries, not the whole catalog.</p>'));
 if(![...c3Table.filter(r=>r.total===null&&r.id!=='skill-18').map(r=>r.id),'skill-21'].includes(r.id))assert.ok(!c.includes('class="inside-note"'));
 assert.equal(c.match(/<summary>[\s\S]*?(<svg[\s\S]*?<\/svg>)/)[1],old.match(/<summary>[\s\S]*?(<svg[\s\S]*?<\/svg>)/)[1]);
 if(['skill-1','skill-8','skill-5','skill-9','skill-11','skill-14'].includes(r.id))assert.deepEqual(summary.match(/(\d+) of (\d+)/).slice(1),c3Summary(old).match(/(\d+) of (\d+)/).slice(1));
 if(['skill-16','skill-7'].includes(r.id)){const kind=r.id==='skill-16'?'command':'subcommand';assert.equal((c.match(new RegExp('class="inside-kind">\\('+kind+'\\)','g'))||[]).length,4);assert.equal(c3Rows(c).filter(li=>!li.includes('inside-kind')).length,1);assert.ok(summary.includes('(1 skill, 4 '+kind+'s)'));assert.equal(1+4,r.shown);}
 }assert.equal(t,14);assert.equal(f,8);assert.deepEqual(featured,['skill-2','skill-6','skill-19','skill-10','skill-13','skill-15','skill-17','skill-18']);
});
gate('cycle3 C3-G3 skill-18 reconciliation',()=>{
 const r=c3Table.find(r=>r.id==='skill-18'),c=c3Card(r.id);assert.equal(renderedText(field(c,'description')),c3NewDescription);assert.equal(c3Summary(c),r.newSummary);assert.doesNotMatch(renderedText(c),/\b(380|401)\b/);assert.doesNotMatch(field(c,'description')+c3Summary(c),/\bof \d|\b\d{3}\b/);
 for(const n of ['index.html','skills.json','llms.txt','llms-full.txt'])assert.doesNotMatch(c3Read(n),/\b(380|401)\b/);
});
gate('cycle3 C3-G4 to-spec prose',()=>{
 const r=c3Table.find(r=>r.id==='skill-4'),rows=c3Rows(c3Card(r.id)),old=c3Rows(c3Card(r.id,c3Pre)),matches=rows.filter(li=>li.includes('data-item-favourite-for="skill-4:to-spec"'));assert.equal(matches.length,1);assert.equal(matches[0],rows[2]);assert.equal(rows.length,r.shown);
 const prose=matches[0].match(/<\/button> — ([\s\S]*?)<p class="example-prompt">/)[1];assert.equal(prose,c3NewProse);assert.equal(matches[0].replace(c3NewProse,c3OldProse),old[2]);for(const term of ['grilled understanding','written specification','implementation seams','tickets are cut'])assert.ok(prose.includes(term));
 for(const n of ['index.html','skills.json','llms.txt','llms-full.txt'])assert.doesNotMatch(c3Read(n),/orchestrator-verified|orchestrator|Process steps|SKILL\.md, description|2026-10-29\.\)/);
});
gate('cycle3 C3-G5 regression and diff-locking',()=>{
 // The reverse transform locks every byte outside the explicitly permitted edits.
 assert.equal(c3Transform(c3HTML,true),c3Pre);
 for(const [pattern,n] of [[/<article class="skill-card"/g,c3Table.length],[/<li>/g,160],[/class="example-prompt"/g,160],[/<p class="card-use">/g,22],[/class="favourite-button"/g,22],[/class="item-favourite-button"/g,160],[/id="reveal-note"/g,1]])assert.equal([...c3HTML.matchAll(pattern)].length,n);
 assert.ok(c3HTML.includes(cycle2Note));for(const [name,hash] of Object.entries(c3Hashes).filter(([n])=>['script.js','styles.css','README.md'].includes(n)))assert.equal(sha256(c3Read(name)),hash);
 const live=cycle1Runtime(c3HTML),pre=cycle1Runtime(c3Pre);for(const probe of ['works with','install:','see github repository','uv tool install','npx skills add','and 12 more','75+ more','codex','cursor','claude code','antigravity','opencode','claude.ai','npm install -g','npx']){live.search(probe);pre.search(probe);assert.deepEqual(cycle1Visible(live),cycle1Visible(pre),probe);}
 new vm.Script(source);assert.equal([...c3Read('styles.css').matchAll(/var\(--accent\)/g)].length,3);
 for(const [cls,n] of [['start-strip',58],['how-to',80]])assert.equal(words(c3HTML.match(new RegExp('<section class="'+cls+'"[\\s\\S]*?<\\/section>'))[0]),n);assert.equal(c3Cards.reduce((n,[,,c])=>n+words(field(c,'card-use')),0),287);
 console.log('Cycle3 C3-G5 invariant clauses PASS (before agent-layer checks)');
 const generate=require('./generate-agent-layer').generate,expected=generate(c3HTML,'https://topskillsfordevelopment.vercel.app'),prior=generate(c3Pre,'https://topskillsfordevelopment.vercel.app'),future=generate(c3Transform(c3Pre),'https://topskillsfordevelopment.vercel.app');
 for(const [n,value] of Object.entries(expected)){assert.equal(c3Read(n),value);assert.equal(value,future[n]);assert.equal(sha256(prior[n]),c3Hashes[n]);}
 const catalog=JSON.parse(c3Read('skills.json'));assert.equal(catalog.cards.length,c3Table.length);assert.deepEqual(catalog.cards.map(c=>c.number).sort((a,b)=>a-b),Array.from({length:22},(_,i)=>i+1));for(const c of catalog.cards)assert.equal(c.number,+c.id.slice(6));
 console.log('Cycle3 invariant clauses PASS; agent layer regenerated and restricted to allowed HTML changes');
});
gate('cycle3 words measurements',()=>{
 for(const kind of ['visible','expanded']){const measure=t=>words(kind==='visible'?t.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1'):t);const values=[c3Pre,c3HTML].map(t=>{const cs=getCards(t).map(([,,c])=>measure(c));return {cards:cs.reduce((a,b)=>a+b,0),max:Math.max(...cs),page:measure(t)};});console.log('Cycle3 words '+kind,JSON.stringify(values));}
});

if(failures.length){console.error(failures.length+' failing gates');process.exitCode=1;}else console.log('PASS all polish gates');


function runCycle2() {
 const cycle1Id = markup => markup.match(/<h3 id="([^"]+)">/)[1];
 const cycle1Count = (text, pattern) => [...text.matchAll(pattern)].length;
 function runtime(code = source, hash = '', query = '') {
  const events = [], docEvents = {}, globalEvents = {}, location = {hash};
  const ids = Object.fromEntries(['search','clear-search','toggle-favourites','reset-filters','empty-state','results-count','reveal-note'].map(id=>[id,element()]));
  ids.search.value=query;
  for (const id of ['reveal-note','results-count']) {
   let value='';Object.defineProperty(ids[id],'textContent',{get:()=>value,set(v){value=v;events.push([id,v]);}});
  }
  const headings = [], cards = getCards(c3HTML).map(([,category,markup])=>{
   const id=cycle1Id(markup), h=Object.assign(element(),{id,hasAttribute(name){return name in this.attrs;},setAttribute(name,value){this.attrs[name]=value;events.push(['attribute',id,name,value]);},focus(opts){events.push(['focus',id,JSON.parse(JSON.stringify(opts))]);},scrollIntoView(opts){events.push(['scroll',id,JSON.parse(JSON.stringify(opts))]);}});
   headings.push(h);
   const card=Object.assign(element(),{dataset:{category},querySelector:sel=>sel==='h3'?h:null,querySelectorAll:()=>[],cloneNode(){let text=markup;return {querySelectorAll(sel){return [{remove(){text=sel==='.card-use'?text.replace(/<p class="card-use">[\s\S]*?<\/p>/g,''):text.replace(/<button\b[^>]*>[\s\S]*?<\/button>/g,'');}}];},get textContent(){return renderedText(text);}};}});
   h.closest=sel=>sel==='.skill-card'?card:null;return card;
  });
  ids['skill-98']=Object.assign(element(),{closest:()=>null});
  const filters=['All skills','Workflow','Quality','Design','Efficiency','Knowledge','Discovery'].map(filter=>Object.assign(element(),{dataset:{filter}}));
  filters.forEach((b,i)=>{b.setAttribute('aria-pressed',String(!i));b.classList.toggle('active',!i);});
  ids['toggle-favourites'].setAttribute('aria-pressed','false');
  const document={addEventListener:(name,fn)=>docEvents[name]=fn,querySelector:sel=>ids[sel.slice(1)]||headings.find(h=>h.id===sel.slice(1)),querySelectorAll:sel=>({'.skill-card':cards,'[data-filter]':filters})[sel]||[]};
  const stored={};vm.runInNewContext(code,{document,location,addEventListener:(name,fn)=>globalEvents[name]=fn,localStorage:{getItem:()=>null,setItem:(k,v)=>stored[k]=v},console:{warn(){}}});
  const x={ids,cards,headings,filters,events,stored,visible:()=>headings.filter((h,i)=>!cards[i].hidden).map(h=>h.id),filter(name){filters.find(b=>b.dataset.filter===name).click();},search(value){ids.search.value=value;ids.search.fire('input');},click(href,opts={}){docEvents.click?.({target:{closest:()=>({getAttribute:()=>href})},...opts});},hash(hash){location.hash=hash;globalEvents.hashchange?.();},heading:id=>headings.find(h=>h.id===id)};
  x.state=()=>JSON.stringify([ids.search.value,filters.map(b=>[b.attrs,b.classList.contains('active')]),ids['toggle-favourites'].attrs,ids['toggle-favourites'].classList.contains('active'),x.visible(),ids['reveal-note'].textContent,stored]);return x;
 }
 const note=x=>x.ids['reveal-note'].textContent;
 const all=x=>{assert.equal(x.visible().length,22);assert.equal(x.ids.search.value,'');assert.equal(x.filters[0].attrs['aria-pressed'],'true');assert.equal(x.ids['toggle-favourites'].attrs['aria-pressed'],'false');assert.equal(x.ids['toggle-favourites'].classList.contains('active'),false);};
 const reveal=(x,id='skill-4')=>{x.search('zzzz');x.click('#'+id);};
 gate('cycle2 C2-G1 hidden by chapter',()=>{for(const id of ['skill-4','skill-3']){const x=runtime();x.filter('Design');assert.ok(!x.visible().includes('skill-4')&&!x.visible().includes('skill-3'));assert.ok(x.visible().includes('skill-22'));x.click('#'+id);all(x);assert.equal(x.filters[3].attrs['aria-pressed'],'false');}});
 gate('cycle2 C2-G2 hidden by search',()=>{const x=runtime();x.search('zzzz');assert.equal(x.visible().length,0);assert.equal(x.ids['empty-state'].hidden,false);x.click('#skill-3');all(x);assert.equal(x.ids['empty-state'].hidden,true);assert.equal(x.ids['results-count'].textContent,'22 skills in the collection');});
 gate('cycle2 C2-G3 favourites and combined',()=>{for(const combined of [false,true]){const x=runtime();if(combined){x.filter('Design');x.search('zzzz');}x.ids['toggle-favourites'].click();assert.ok(!x.visible().includes('skill-22'));x.click(combined?'#skill-4':'#skill-22');all(x);}});
 gate('cycle2 C2-G4 visible no-op',()=>{for(const category of ['All skills','Workflow']){const x=runtime();x.filter(category);const before=x.state();x.events.length=0;x.click('#skill-4');assert.equal(x.state(),before);assert.deepEqual(x.events,[]);assert.deepEqual(x.heading('skill-4').attrs,{});}});
 gate('cycle2 C2-G5 invalid targets',()=>{const x=runtime();x.filter('Design');x.search('zzzz');for(const hash of ['#collection','#skill-99','#skill-4x','#skill-','#chapter-workflow','','#skill-98']){const before=x.state();x.events.length=0;x.click(hash);x.hash(hash);assert.equal(x.state(),before);assert.deepEqual(x.events,[]);}});
 gate('cycle2 C2-G6 message and placement',()=>{assert.equal(cycle1Count(cycle1HTML,/id="reveal-note"/g),1);assert.ok(cycle1HTML.includes('</p></div>\n'+cycle2Note+'\n<section class="chapter"'));assert.equal(cycle1Count(source,/Filters cleared\. Showing all skills\./g),1);assert.ok(!cycle1HTML.includes('Filters cleared. Showing all skills.'));const x=runtime();reveal(x);assert.equal(note(x),'Filters cleared. Showing all skills.');x.click('#skill-3');assert.equal(note(x),'Filters cleared. Showing all skills.');x.search('a');assert.equal(note(x),'');reveal(x);x.filter('Design');assert.equal(note(x),'');});
 gate('cycle2 C2-G7 focus and order',()=>{const x=runtime();x.search('zzzz');x.events.length=0;x.click('#skill-4');assert.equal(x.heading('skill-4').attrs.tabindex,'-1');assert.ok(!x.ids.search.focused);assert.deepEqual(x.events.filter(e=>['focus','scroll'].includes(e[0])),[['focus','skill-4',{preventScroll:true}],['scroll','skill-4',{block:'start'}]]);const order=x.events.map(e=>e[0]);assert.ok(order.indexOf('results-count')<order.lastIndexOf('reveal-note'));assert.ok(order.lastIndexOf('reveal-note')<order.indexOf('focus'));assert.ok(order.indexOf('focus')<order.indexOf('scroll'));x.heading('skill-4').attrs.tabindex='-2';reveal(x);assert.equal(x.heading('skill-4').attrs.tabindex,'-2');});
 gate('cycle2 C2-G8 load hashchange modifiers',()=>{const x=runtime(source,'#skill-4','zzzz');all(x);assert.equal(note(x),'Filters cleared. Showing all skills.');assert.ok(x.events.some(e=>e[0]==='focus'));const y=runtime(source,'#skill-4');assert.equal(note(y),'');assert.ok(!y.events.some(e=>e[0]==='focus'));y.filter('Workflow');y.hash('#skill-22');all(y);for(const opts of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]){const z=runtime();z.filter('Design');const before=z.state();z.click('#skill-4',opts);assert.equal(z.state(),before);}});
 gate('cycle2 C2-G9 filtering unchanged',()=>{assert.equal(undoCycle2JS(source),cycle2PriorScript);const x=runtime(),prior=runtime(cycle2PriorScript),counts={};for(const probe of ['works with','install:','see github repository','uv tool install','npx skills add','and 12 more','75+ more','codex','cursor','claude code','antigravity','opencode','claude.ai','npm install -g','npx']){x.search(probe);prior.search(probe);assert.deepEqual(x.visible(),prior.visible(),probe);counts[probe]=x.visible().length;}x.search('see github repository');assert.equal(x.visible().length,0);assert.equal(x.ids['empty-state'].hidden,false);console.log('Cycle2 probe counts',JSON.stringify(counts));x.search('');prior.search('');for(const [category,n] of [['Workflow',6],['Quality',2],['Design',3],['Efficiency',1],['Knowledge',5],['Discovery',5],['All skills',22]]){x.filter(category);prior.filter(category);assert.deepEqual(x.visible(),prior.visible());assert.equal(x.visible().length,n);}for(const control of ['toggle-favourites','clear-search','reset-filters']){x.ids[control].click();prior.ids[control].click();assert.deepEqual(x.visible(),prior.visible());}});
 gate('cycle2 C2-G10 counts',()=>{assert.equal(getCards(cycle1HTML).length,22);for(const [pattern,n] of [[/<li>/g,160],[/class="example-prompt"/g,160],[/<p class="card-use">/g,22]])assert.equal(cycle1Count(cycle1HTML,pattern),n);assert.equal(words(cycle1HTML.match(/<section class="start-strip"[\s\S]*?<\/section>/)[0]),58);assert.equal(words(cycle1HTML.match(/<section class="how-to"[\s\S]*?<\/section>/)[0]),80);const hrefs=[...cycle1HTML.match(/<section class="start-strip"[\s\S]*?<\/section>/)[0].matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(hrefs,['skill-4','skill-3','skill-22']);hrefs.forEach(id=>assert.ok(cycle1HTML.includes('<h3 id="'+id+'">')));});
 gate('cycle2 C2-G11 budgets identity CSS',()=>{for(const visible of [true,false]){const measure=t=>words(visible?t.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g,'$1'):t);const counts=getCards(cycle1HTML).map(([,,c])=>measure(c));assert.deepEqual([counts.reduce((a,b)=>a+b,0),Math.max(...counts),measure(cycle1HTML)],visible?[1552,87,1888]:[8666,1354,9002]);console.log('Cycle2 words before/after',visible?'visible':'expanded',measure(cycle1HTML.replace(cycle2Note+'\n','')),measure(cycle1HTML));}for(const [name,hash] of Object.entries(cycle2Hashes)){assert.equal(sha256(name==='README.md'?fs.readFileSync(path.join(root,name)):require('./generate-agent-layer').generate(cycle1HTML,'https://topskillsfordevelopment.vercel.app')[name]),hash);console.log('Cycle2 historical byte identity '+name);}assert.equal(cycle1Count(cycle1Styles,/var\(--accent\)/g),3);assert.equal([...cycle1Styles.matchAll(/[^{}]+\{([^{}]*)\}/g)].filter(r=>r[1].includes('var(--accent)')).length,3);assert.ok(cycle1Styles.endsWith(cycle2CSS));assert.doesNotMatch(cycle2CSS,/--accent|#[0-9a-f]|rgb\(|hsl\(|border-radius|box-shadow/);});
 gate('cycle2 C2-G12 accessibility',()=>{assert.ok(cycle1HTML.includes(cycle2Note));assert.ok(cycle1Styles.includes('.skill-card h3:focus-visible{outline:2px solid var(--ink);outline-offset:var(--underline-offset)}'));const additions=source.replace(cycle2PriorScript,'');assert.doesNotMatch(additions,/keydown|tabindex="0"|tabindex', '0'/);assert.match(source,/setAttribute\('tabindex', '-1'\)/);});
}
