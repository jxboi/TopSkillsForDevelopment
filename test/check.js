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
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const before = fs.readFileSync(path.join(__dirname, 'fixtures/before/index.html'), 'utf8');
const beforeCSS = fs.readFileSync(path.join(__dirname, 'fixtures/before/styles.css'), 'utf8');
const beforeJS = fs.readFileSync(path.join(__dirname, 'fixtures/before/script.js'), 'utf8');
const starSnapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/before/footer-stars.json'), 'utf8'));
const copy = fs.readFileSync(path.join(__dirname, 'fixtures/copy.md'), 'utf8');
const uses = fs.readFileSync(path.join(__dirname, 'fixtures/when-avoid-copy.md'), 'utf8');
const getCards = text => [...text.matchAll(/<article class="skill-card" data-category="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
const articles = getCards(html), originals = getCards(before);
const failures = [];
function gate(name, fn) { try { fn(); console.log('PASS ' + name); } catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL ' + name + ': ' + e.message); } }
const copyPath = path.join(__dirname, 'fixtures/lists.md');
const approvedCopy = fs.readFileSync(copyPath, 'utf8');
const expectedInside = [...approvedCopy.matchAll(/^### (.+?) — summary: "([^"]+)"([^\n]*)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(([, title, summary, annotations, body]) => ({
  title, summary, note: annotations.match(/note: "([^"]+)"/)?.[1],
  items: [...body.matchAll(/^\d+\. `([^`]+)`[^\n]*? — (.+)$/gm)].map(([, name, fn]) => ({ name, fn })),
}));
assert.equal(expectedInside.length, 21, 'Approved copy must cover all 21 cards');
assert.equal(expectedInside.reduce((n, card) => n + card.items.length, 0), 101);
const decodeHTML = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) =>
  key[0] === '#' ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1))) :
    ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' })[key.toLowerCase()]);
const renderedText = markup => decodeHTML(markup.replace(/<[^>]*>/g, '')).trim();

const field = (markup, cls, tag = 'p') => markup.match(new RegExp('<' + tag + ' class="' + cls + '"[^>]*>[\\s\\S]*?</' + tag + '>'))?.[0];
const words = text => decodeHTML(text.replace(/<[^>]*>/g, ' ')).trim().split(/\s+/).filter(Boolean).length;
const densities = articles.map(([, , c]) => ({title: renderedText(c.match(/<h3[^>]*>(.*?)<\/h3>/)[1]), visible: words(c.replace(/<details\b[^>]*>\s*(<summary>[\s\S]*?<\/summary>)[\s\S]*?<\/details>/g, '$1')), expanded: words(c)}));
console.table(densities);
for (const kind of ['visible', 'expanded']) console.log(kind, {max:Math.max(...densities.map(c=>c[kind])), total:densities.reduce((n,c)=>n+c[kind],0), mean:densities.reduce((n,c)=>n+c[kind],0)/21});
gate('1 density budgets', () => { for (const [kind,max,total,mean] of [['visible',77,1168,55.62],['expanded',319,5410,257.62]]) { assert.ok(densities.every(c=>c[kind]<=max)); const sum=densities.reduce((n,c)=>n+c[kind],0); assert.equal(sum,total); assert.equal(Math.max(...densities.map(c=>c[kind])),max); assert.ok(sum/21<=mean); } });
gate('1b per-card expanded budgets', () => {
 const expected = [272,275,280,250,258,319,99,237,250,256,288,265,267,259,265,284,262,254,245,226,299];
 assert.deepEqual(densities.map(c=>c.expanded), expected);
});
gate('2 inventory and order', () => {
 assert.equal(articles.length,21);
 assert.equal((html.match(/<p class="example-prompt">/g)||[]).length,101);
 for(const [, , c] of articles) { const positions=['<div class="card-meta">','<h3','<p class="top-inside">','<p class="description">','<div class="fit">','<details class="inside"','<div class="card-footer">'].map(x=>c.indexOf(x)); assert.ok(positions.every((p,i)=>p>=0&&(!i||p>positions[i-1]))); assert.equal((c.match(/<details\b/g)||[]).length,1); }
 for(const cls of ['top-inside','inside','inside-list']) assert.equal((html.match(new RegExp('class="'+cls+'"','g'))||[]).length,21);
 assert.equal((html.match(/<li><code class="inside-name">/g)||[]).length,101);
 for(const file of [html,styles,source]) assert.doesNotMatch(file, /(?:class="(?:guide|prompt|copy-button)|\.(?:guide|prompt(?!-background)|copy-button)\b|toggle-guides|copy-prompt|copyStatus|updateGuideControl)/);
});
gate('3 protected copy and approved sources', () => {
 for(const [index,[,,markup]] of articles.entries()) {
 const expected=expectedInside[index]; const inside=markup.match(/<details class="inside"[^>]*>([\s\S]*?)<\/details>/)[1];
 assert.equal(decodeHTML(field(markup,'description')),decodeHTML(field(originals[index][2],'description')));
 assert.equal(decodeHTML(field(markup,'fit-use')),decodeHTML(field(originals[index][2],'fit-use')));
 const use=uses.match(new RegExp('## '+expected.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\n\\nUse when: ([^\\n]+)'));
 assert.ok(use,expected.title); assert.equal(renderedText(field(markup,'fit-use')).replace(/^Use when /,''),use[1]);
 assert.equal(decodeHTML(inside.replace(/<p class="example-prompt">[^<]*<\/p>/g, '')),decodeHTML(originals[index][2].match(/<details class="inside"[^>]*>([\s\S]*?)<\/details>/)[1]));
 assert.equal(renderedText(inside.match(/<summary>([\s\S]*?)<\/summary>/)[1]),expected.summary);
  const summary = renderedText(inside.match(/<summary>([\s\S]*?)<\/summary>/)[1]);
  const items = [...inside.matchAll(/<li>([\s\S]*?)<\/li>/g)];
  assert.equal(items.length, expected.title === 'Karpathy Skills' ? 1 : 5);
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
    assert.ok(!items.some(([, item]) => renderedText(item.match(/<code[^>]*>(.*?)<\/code>/)[1]) === 'tdd'));
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
 assert.equal(promptMap.size,21);
 assert.equal([...promptMap.values()].reduce((n,items)=>n+items.size,0),101);
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
 assert.equal(actualPrompts.length,101); assert.equal(new Set(actualPrompts).size,101);
 assert.equal((html.match(/class="example-prompt"/g)||[]).length,101);
 assert.doesNotMatch(html,/\b(?:UNCONFIRMED|illustrative|not repo-quoted|research.note|Grade:\s*(?:Verified|Crafted)|Source:\s*https?:|example\.(?:com|org|net))\b/i);
 assert.equal(sha256(html.replace(/<p class="example-prompt">[^<]*<\/p>/g,'')), '47cda9f2e3e268d40767739dc12023766dfade5c3adaf1bcd1aec429e918c6c2', 'Only prompt insertions are allowed');
});
const expectedPromptRule = '.example-prompt{margin:var(--space-1) 0 0;padding:var(--space-1) var(--space-2);border-left:1px solid var(--line);background:var(--prompt-background);color:var(--body);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--type-mono);line-height:var(--type-list-leading);overflow-wrap:anywhere}';
gate('one exact prompt CSS rule', () => {
 assert.equal(styles.split(expectedPromptRule).length-1,1);
 assert.equal(sha256(styles.replace(expectedPromptRule+'\n','')), 'eda680d77a783538fcaf9b1a554d3f71d7e916fc88e659c8ce3c2ef076d668e1', 'Only the specified CSS rule may be added');
 const declaration=expectedPromptRule.slice(expectedPromptRule.indexOf('{'));
 assert.doesNotMatch(declaration, /#[\da-f]|\b(?:rgb|hsl)\(|border-radius|box-shadow|--accent/);
 const tokens=new Set([...styles.match(/:root\{([^}]*)}/)[1].matchAll(/(--[\w-]+):/g)].map(m=>m[1]));
 for(const [,token] of declaration.matchAll(/var\((--[\w-]+)\)/g)) assert.ok(tokens.has(token));
});

const topRows=[...copy.matchAll(/^\| ([^|]+) \| [^|]+ \| ([^|]+) \| ([^|]+) \|$/gm)].filter(m=>!['Card','---'].includes(m[1].trim()));
gate('4 exact top lines',()=>{assert.equal(topRows.length,21); articles.forEach(([,,c],i)=>{ const row=topRows[i]; const names=row[3].trim().split(', '); assert.equal(renderedText(field(c,'top-inside')),row[2].trim()+' '+names.join(' · ')); assert.deepEqual([...field(c,'top-inside').matchAll(/<code class="inside-name">(.*?)<\/code>/g)].map(m=>decodeHTML(m[1])),expectedInside[i].items.slice(0,2).map(x=>x.name)); });});
gate('5 stars and number',()=>{articles.forEach(([,,c],i)=>{const meta=field(c,'card-meta','div'); const stars=meta.match(/<span class="meta-stars"[\s\S]*?<\/span>/)?.[0]; assert.equal(stars,starSnapshot[i].stars.replace('class="stars"','class="meta-stars"')); const footer=field(c,'card-footer','div'); assert.doesNotMatch(footer,/stars|icon-star/); assert.match(footer,/<a href=/); }); for(const [,rule] of styles.matchAll(/\.number\{([^}]*)}/g)){assert.doesNotMatch(rule,/--accent|--type-entry-number|--type-note|--serif/);} assert.match(styles,/\.number\{[^}]*var\(--type-mono\)[^}]*var\(--muted\)/); assert.match(styles,/\.meta-stars\{[^}]*tabular-nums/);});
gate('6 collapsed Karpathy',()=>{for(const [,,c]of articles)assert.doesNotMatch(c,/<details class="inside"[^>]*\bopen\b/); const c=articles.find(a=>a[2].includes('>Karpathy Skills</h3>'))[2];assert.equal(renderedText(field(c,'top-inside')),'Inside: karpathy-guidelines');});
gate('7 single scoped bulk toggle',()=>{assert.equal((html.match(/id="toggle-inside"/g)||[]).length,1); assert.equal((html.match(/id="toggle-[^"]+"/g)||[]).length,1); assert.match(source,/querySelectorAll\('\.skill-card details\.inside'\)/); for(const label of ['Expand all inside lists','Collapse all inside lists'])assert.ok(source.includes(label));assert.match(source,/setAttribute\('aria-expanded', String\(allOpen\)\)/);});
function element(textContent = '') {
  const listeners = {};
  const classes = new Set();
  return {
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
 const lists=articles.map(([,,c])=>{const originalHTML=c.match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1];return markupElement(originalHTML);});
 const insides=lists.map(list=>Object.assign(element(),{querySelector:()=>list}));
 const prose=articles.map(([,,c])=>Object.fromEntries(['description','fit-use'].map(cls=>[cls,markupElement(field(c,cls).replace(/^<p[^>]*>|<\/p>$/g,''))])));
 const cards=articles.map(([,category,c],i)=>Object.assign(element(renderedText(c)),{dataset:{category},querySelector:sel=>sel==='details.inside'?insides[i]:prose[i][sel.slice(1)]}));
 const chapterMarkup=[...html.matchAll(/<section class="chapter" aria-labelledby="([^"]+)">([\s\S]*?)<\/section>/g)];
 const chapters=chapterMarkup.map(([,id])=>Object.assign(element(),{querySelectorAll:()=>cards.filter(c=>c.dataset.category.toLowerCase()===id.replace('chapter-',''))}));
 const filters=[...html.matchAll(/data-filter="([^"]+)"/g)].map(([,category])=>Object.assign(element(),{dataset:{filter:category}}));
 const document={querySelector:sel=>ids[sel.slice(1)],querySelectorAll:sel=>({'.skill-card':cards,'.chapter':chapters,'[data-filter]':filters,'.skill-card details.inside':insides})[sel]||[],...highlightDocument};
 // Exercise the real text walker as well as controls.
 vm.runInNewContext(source,{document,NodeFilter:{SHOW_TEXT:4},console});
 const search=q=>{ids.search.value=q;ids.search.fire('input');};const visible=()=>cards.filter(c=>!c.hidden);

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
 assertPromptSearch('EGFR','Scientific Agent Skills','database-lookup');
 search(''); assert.deepEqual(insides.map(inside=>inside.open),prePromptOpen);
 lists.forEach((list,i)=>assert.equal(list.innerHTML,originalLists[i]));
 assertPromptSearch('auth-system.md','Superpowers','subagent-driven-development');
 const beforeToggle=insides.map(inside=>inside.open);
 ids['toggle-inside'].click(); assert.equal(insides[0].open,false);
 assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'false');
 assert.equal(ids['toggle-inside'].textContent,'Expand all inside lists');
 insides.forEach((inside,i)=>{if(i!==0)assert.equal(inside.open,beforeToggle[i]);});
 search(''); assert.deepEqual(insides.map(inside=>inside.open),prePromptOpen);
 lists.forEach((list,i)=>assert.equal(list.innerHTML,originalLists[i]));
 filters.find(f=>f.dataset.filter==='Knowledge').click();
 assertPromptSearch('EGFR','Scientific Agent Skills','database-lookup');
 search('auth-system.md'); assert.equal(visible().length,0); assert.equal(ids['empty-state'].hidden,false);
 search(''); allFilter(); insides.forEach(inside=>inside.open=false);
 assert.equal(ids.search.disabled,false);assert.equal(visible().length,21);assert.equal(ids['toggle-inside'].hidden,false);
 ids['toggle-inside'].click();assert.ok(insides.every(i=>i.open));assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'true');ids['toggle-inside'].click();assert.ok(insides.every(i=>!i.open));
 insides[0].open=true; search('to-spec');assert.equal(visible().length,1);assert.ok(insides[2].open);assert.equal(ids['toggle-inside'].textContent,'Collapse all inside lists'); assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'true'); assert.match(lists[2].innerHTML, /<code class="inside-name"><mark>to-spec<\/mark><\/code>/); search('worktrees');assert.equal(insides[2].open,false);assert.ok(insides[0].open);search('');assert.ok(insides[0].open);assert.equal(insides[2].open,false);lists.forEach((l,i)=>assert.equal(l.innerHTML,articles[i][2].match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1]));
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
 filters.find(f=>f.dataset.filter==='Design').click();assert.equal(visible().length,1);assert.deepEqual(chapters.map(c=>c.hidden),[true,true,false,true,true,true]);search('Superpowers');assert.equal(visible().length,0);assert.equal(ids['toggle-inside'].textContent,'Expand all inside lists');assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'false');assert.equal(ids['empty-state'].hidden,false);assert.equal(ids['results-count'].textContent,'0 skills in the collection');ids['clear-search'].click();assert.equal(visible().length,1);ids['reset-filters'].click();assert.equal(visible().length,21);assert.equal(ids['empty-state'].hidden,true);assert.equal(ids['clear-search'].hidden,true);assert.ok(chapters.every(c=>!c.hidden));
}
gate('8 search paths' ,()=>{for(const pattern of [/originalHTML/,/preSearchOpen/,/inside\.open = true/,/createElement\('mark'\)/,/createTreeWalker/,/innerHTML = originalHTML/,/list\.textContent/,/card\.hidden/])assert.match(source,pattern);assert.match(source,/text: card\.textContent\.toLocaleLowerCase\(\)/); exerciseControls();});
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
assert.match(styles, /\.built-with ul\{[^}]*max-width:64ch/);


 const tokens=css=>Object.fromEntries([...css.match(/:root\{([^}]*)}/)[1].matchAll(/(--[\w-]+):([^;}]*)/g)].map(m=>[m[1],m[2]])); const old=tokens(beforeCSS),now=tokens(styles); for(const token of ['--copy-width','--hero-wide-padding','--type-entry-number']) delete old[token]; assert.deepEqual(now,{...old,'--type-list-leading':'1.5'});
 for(const [selector,props]of [['.hero',['padding:var(--space-6) 0 var(--space-4)']],['.top-inside',['margin:var(--space-2) 0 var(--space-1)','var(--type-small)','var(--type-list-leading)','color:var(--body)']],['.top-inside-label',['var(--type-label)','var(--muted)']],['.inside-list li',['line-height:var(--type-list-leading)']],['.category',['font-weight:600','color:var(--ink)']],['mark',['background:var(--prompt-background)','color:var(--ink)','font-weight:600','text-decoration:underline','text-decoration-color:var(--accent)','text-decoration-thickness:2px','text-underline-offset:5px']],['.chapter-lede',['var(--type-small)','var(--body)']]]) {const rule=rules(styles).find(m=>m[1].trim()===selector);assert.ok(rule,selector);for(const p of props)assert.ok(rule[2].includes(p),selector+': '+p);}
 assert.match(styles,/\.skill-card h3\{[^}]*margin:var\(--space-4\) 0 var\(--space-2\)/);
 assert.match(styles,/:is\(\.description,\.fit p,\.inside-list li,\.inside-note,\.top-inside\)\{max-width:62ch}/);
 assert.match(styles,/\.skill-grid :is\(\.inside-list li,\.inside-note\)\{max-width:62ch}/);
 for(const [,,decl]of rules(styles).filter(r=>!r[1].includes(':root')&&!rules(beforeCSS).some(o=>o[1]===r[1]&&o[2]===r[2]))) { for(const [,t]of decl.matchAll(/var\((--[\w-]+)\)/g))assert.ok(t in now); assert.doesNotMatch(decl,/#|\b(?:rgb|hsl)\(/); }
 const accent=rules(styles).filter(r=>r[2].includes('var(--accent)'));assert.equal(accent.length,3);
});
gate('10 unchanged surface and chapter ledes',()=>{
 for(const [i,[,,c]]of articles.entries())assert.deepEqual(c.match(/<a href=[\s\S]*?<\/a>/g),originals[i][2].match(/<a href=[\s\S]*?<\/a>/g));
 for(const pattern of [/<h2 class="chapter-heading"[^>]*>[\s\S]*?<\/h2>/g,/<button[^>]*data-filter=[\s\S]*?<\/button>/g,/<section class="hero[\s\S]*?<\/section>/g])assert.deepEqual([...html.matchAll(pattern)].map(m=>m[0]),[...before.replace('<span class="note-line"></span>', '').matchAll(pattern)].map(m=>m[0]));
 for(const id of ['workflow','quality','design','efficiency','knowledge','discovery']) { const rule=styles.match(new RegExp('#chapter-'+id+'::before\\{[^}]*}'))?.[0]; assert.ok(rule);assert.ok(beforeCSS.includes(rule)); }
 const ledes=[...copy.matchAll(/^- (Workflow|Quality|Design|Efficiency|Knowledge|Discovery) — (.+)$/gm)].map(m=>m[2]); const shipped=[...html.matchAll(/<h2 class="chapter-heading"[^>]*>[\s\S]*?<\/h2>\s*<p class="chapter-lede">([^<]+)<\/p>/g)].map(m=>m[1]);assert.deepEqual(shipped,ledes); console.log('Chapter lede words:',ledes.reduce((n,l)=>n+words(l),0));
});
gate('11 script diff discipline',()=>{
 assert.equal(sha256(fs.readFileSync(path.join(root,'script.js'))), '54c74dd5029521a0f8d1e749ad0e846563d87a393eb02c12af3d7805e97c2b50', 'script.js must be byte-identical');
 const functionBlock=(s,name,next)=>s.slice(s.indexOf(name),s.indexOf(next,s.indexOf(name)));
 for(const [start,end]of [['  chapters.forEach','searchInput?.addEventListener'],["searchInput?.addEventListener",'function update']]) {assert.equal(functionBlock(source,start,end),functionBlock(beforeJS,start,end));}
 const oldFiltering=beforeJS.slice(beforeJS.indexOf('function updateResults'),beforeJS.indexOf('searchInput?.addEventListener'));
 const newFiltering=source.slice(source.indexOf('function updateResults'),source.indexOf('searchInput?.addEventListener')).replace('  updateInsideSearch(terms);\n','');assert.equal(newFiltering,oldFiltering);
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
gate('12 highlight assertions and manual live checklist',()=>{ exerciseHighlight(); console.log('Manual live checklist (not performed; user prohibits live checking): prompt strips under items without overflow at desktop and narrowest allowed width; triple-click selects only one prompt, copy/paste exact; EGFR opens and highlights; clear restores prompts; leave All skills, empty query, all collapsed; true 320–360px rendering unverified; 21 collapsed cards with stars/top lines; expand/collapse 21; to-spec/worktrees opens and marks; Design III (1); filters, clear, reset; layout; true 320–360px phone width. Static checks do not constitute live verification.'); });
if(failures.length){console.error(failures.length+' failing gates');process.exitCode=1;}else console.log('PASS all polish gates');
