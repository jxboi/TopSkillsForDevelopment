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

const itemHTML = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const categoryHTML = undoItemFavourites('index.html', itemHTML);
// Historical copy gates compare the original surface after removing only the authorized additions.
const stripCategories = value => value.replace(/ <span class="item-category">[^<]*<\/span>/g, '');
const html = stripCategories(undoPolishHTML(undoFavouritesHTML(categoryHTML)));
const categoryCSSRule = '.item-category{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--type-mono);color:var(--muted)}';
const itemStyles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const categoryStyles = undoItemFavourites('styles.css', itemStyles);
const styles = undoPolishCSS(undoFavouritesCSS(categoryStyles)).replace(categoryCSSRule+'\n','');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const historicalSource = undoFavouritesJS(undoItemFavourites('script.js', source));
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
assert.equal(expectedInside.reduce((n, card) => n + card.items.length, 0), 124);
const decodeHTML = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) =>
  key[0] === '#' ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1))) :
    ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' })[key.toLowerCase()]);
const renderedText = markup => decodeHTML(markup.replace(/<[^>]*>/g, '')).trim();

const field = (markup, cls, tag = 'p') => markup.match(new RegExp('<' + tag + ' class="' + cls + '"[^>]*>[\\s\\S]*?</' + tag + '>'))?.[0];
const words = text => decodeHTML(text.replace(/<[^>]*>/g, ' ')).trim().split(/\s+/).filter(Boolean).length;
const densities = categoryArticles.map(([, , c]) => ({title: renderedText(c.match(/<h3[^>]*>(.*?)<\/h3>/)[1]), visible: words(c.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g, '$1')), expanded: words(c)}));
console.table(densities);
for (const kind of ['visible', 'expanded']) console.log(kind, {max:Math.max(...densities.map(c=>c[kind])), total:densities.reduce((n,c)=>n+c[kind],0), mean:densities.reduce((n,c)=>n+c[kind],0)/22});

const categorySource = fs.readFileSync(path.join(os.homedir(),'workspace/workflow-run-categorise/categories.md'),'utf8');
const categoryAssignments = [...categorySource.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| (?:Confident|Borderline) \|/gm)].map(([,card,item,category])=>[card.trim(),item.trim(),category.trim()]);
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
 assert.equal(sha256(fs.readFileSync(path.join(root,'llms.txt'))),densityBaseline.categoryAdditionBaseline.short);
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
 for(const [,,card] of articles) assert.equal(card.match(/<h3 id="skill-(\d+)"/)[1],String(Number(renderedText(field(card,'number','span')))));
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
const agentExpectedCards = getCards(categoryHTML).map(([,category,c])=>{
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
 return {id:heading[1],number:Number(renderedText(field(c,'number','span'))),title:decodeHTML(heading[2]),category,
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
 assert.equal(catalog.count,22);assert.equal(pairs.length,124);assert.equal(prompts.length,124);
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
 assert.equal((full.match(/^  > /gm)||[]).length,124);
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
 const outputs=generate(itemHTML,'https://topskillsfordevelopment.vercel.app');
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
gate('polish2 agent-file scope: only card 15 label, short index unchanged',()=>{
 const json=JSON.parse(readAgentFile('skills.json'));assert.equal(json.cards[19].id,'skill-15');assert.equal(json.cards[19].top_inside.label,'Featured:');
 json.cards[19].top_inside.label='Top inside:';
 assert.equal(sha256(JSON.stringify(json,null,2)+'\n'),densityBaseline.polish2Before['skills.json']);
 const full=readAgentFile('llms-full.txt');
 const restored=full.replace(/(### Claude Plugins Official\n[\s\S]*?\n- Top inside: )Featured:/,'$1Top inside:');
 assert.notEqual(restored,full);assert.equal(sha256(restored),densityBaseline.polish2Before['llms-full.txt']);
 assert.equal(sha256(readAgentFile('llms.txt')),densityBaseline.polish2Before['llms.txt']);
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
   return {querySelectorAll(selector){assert.equal(selector,'.favourite-button, .item-favourite-button');return [{remove(){markup=markup.replace(/<button type="button" class="favourite-button"[^>]*>[^<]*<\/button>/g,'');}}];},get textContent(){return renderedText(markup);}};
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

function exerciseItemFavourites(storage) {
 const ids=Object.fromEntries(['search','clear-search','toggle-favourites','reset-filters','empty-state','results-count','toggle-inside'].map(id=>[id,element()]));
 const shipped=getCards(itemHTML);
 const lists=shipped.map(([,,c])=>{
  let markup='',rows=[];
  const list={
   get innerHTML(){return markup;},
   set innerHTML(value){
    markup=value;
    rows=[...value.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([,li])=>{
     const id=decodeHTML(li.match(/data-item-favourite-for="([^"]+)"/)[1]);
     const button=Object.assign(element('☆'),{hidden:true,dataset:{itemFavouriteFor:id}});
     return Object.assign(element(),{button,querySelector:selector=>selector==='.item-favourite-button'?button:null});
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
  cloneNode(){let markup=c;return {querySelectorAll(selector){assert.equal(selector,'.favourite-button, .item-favourite-button');return [{remove(){markup=markup.replace(/<button\b[^>]*class="(?:item-)?favourite-button"[^>]*>[^<]*<\/button>/g,'');}}];},get textContent(){return renderedText(markup);}};}
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

if(failures.length){console.error(failures.length+' failing gates');process.exitCode=1;}else console.log('PASS all polish gates');
