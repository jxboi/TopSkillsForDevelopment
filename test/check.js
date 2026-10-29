'use strict';
// Exercise the real script against a small DOM double built from the shipped HTML.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const before = fs.readFileSync('/tmp/fix-in-place-before/index.html', 'utf8');
const beforeCSS = fs.readFileSync('/tmp/fix-in-place-before/styles.css', 'utf8');
const beforeJS = fs.readFileSync('/tmp/fix-in-place-before/script.js', 'utf8');
const starSnapshot = JSON.parse(fs.readFileSync('/tmp/fix-in-place-before/footer-stars.json', 'utf8'));
const copy = fs.readFileSync(path.resolve(root, '../workflow-run-fix-in-place/copy.md'), 'utf8');
const uses = fs.readFileSync(path.resolve(root, '../workflow-run-full-review/when-avoid-copy.md'), 'utf8');
const getCards = text => [...text.matchAll(/<article class="skill-card" data-category="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
const articles = getCards(html), originals = getCards(before);
const failures = [];
function gate(name, fn) { try { fn(); console.log('PASS ' + name); } catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL ' + name + ': ' + e.message); } }
const copyPath = path.resolve(root, '../workflow-run-top5/lists.md');
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
gate('1 density budgets', () => { for (const [kind,max,total,mean] of [['visible',77,1168,55.62],['expanded',220,3550,170]]) { assert.ok(densities.every(c=>c[kind]<=max)); const sum=densities.reduce((n,c)=>n+c[kind],0); assert.ok(sum<=total); assert.ok(sum/21<=mean); } });
gate('2 inventory and order', () => {
 assert.equal(articles.length,21);
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
 assert.equal(decodeHTML(inside),decodeHTML(originals[index][2].match(/<details class="inside"[^>]*>([\s\S]*?)<\/details>/)[1]));
 assert.equal(renderedText(inside.match(/<summary>([\s\S]*?)<\/summary>/)[1]),expected.summary);
  const summary = renderedText(inside.match(/<summary>([\s\S]*?)<\/summary>/)[1]);
  const items = [...inside.matchAll(/<li>([\s\S]*?)<\/li>/g)];
  assert.equal(items.length, expected.title === 'Karpathy Skills' ? 1 : 5);
  assert.doesNotMatch(inside, /<a\b|<h[1-6]\b/);
  items.forEach(([, item], itemIndex) => {
    const name = item.match(/^<code class="inside-name">([\s\S]*?)<\/code> — ([\s\S]*)$/);
    assert.ok(name, 'Name, em dash, function markup');
    assert.equal(decodeHTML(name[1]), expected.items[itemIndex].name);
    assert.equal(renderedText(name[2].replace(/\s*<span class="inside-kind">[^<]*<\/span>$/, '')), expected.items[itemIndex].fn);
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
function exerciseControls() {
 const ids=Object.fromEntries(['search','clear-search','toggle-inside','results-count','empty-state','reset-filters'].map(id=>[id,element()]));
 const lists=articles.map(([,,c])=>{const originalHTML=c.match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1];return {innerHTML:originalHTML,textContent:renderedText(originalHTML)};});
 const insides=lists.map(list=>Object.assign(element(),{querySelector:()=>list}));
 const cards=articles.map(([,category,c],i)=>Object.assign(element(renderedText(c)),{dataset:{category},querySelector:()=>insides[i]}));
 const chapterMarkup=[...html.matchAll(/<section class="chapter" aria-labelledby="([^"]+)">([\s\S]*?)<\/section>/g)];
 const chapters=chapterMarkup.map(([,id])=>Object.assign(element(),{querySelectorAll:()=>cards.filter(c=>c.dataset.category.toLowerCase()===id.replace('chapter-',''))}));
 const filters=[...html.matchAll(/data-filter="([^"]+)"/g)].map(([,category])=>Object.assign(element(),{dataset:{filter:category}}));
 const document={querySelector:sel=>ids[sel.slice(1)],querySelectorAll:sel=>({'.skill-card':cards,'.chapter':chapters,'[data-filter]':filters,'.skill-card details.inside':insides})[sel]||[],createTreeWalker:()=>({nextNode:()=>false})};
 // This inherited DOM double checks controls and state; highlighting needs the live browser checklist.
 vm.runInNewContext(source,{document,NodeFilter:{SHOW_TEXT:4},console});
 const search=q=>{ids.search.value=q;ids.search.fire('input');};const visible=()=>cards.filter(c=>!c.hidden);
 assert.equal(ids.search.disabled,false);assert.equal(visible().length,21);assert.equal(ids['toggle-inside'].hidden,false);
 ids['toggle-inside'].click();assert.ok(insides.every(i=>i.open));assert.equal(ids['toggle-inside'].attrs['aria-expanded'],'true');ids['toggle-inside'].click();assert.ok(insides.every(i=>!i.open));
 insides[0].open=true; search('to-spec');assert.equal(visible().length,1);assert.ok(insides[2].open);search('worktrees');assert.ok(insides[0].open);search('');assert.ok(insides[0].open);assert.equal(insides[2].open,false);lists.forEach((l,i)=>assert.equal(l.innerHTML,articles[i][2].match(/<ul class="inside-list">([\s\S]*?)<\/ul>/)[1]));
 for(const f of filters){search('');f.click();assert.equal(visible().length,cards.filter(c=>f.dataset.filter==='All skills'||c.dataset.category===f.dataset.filter).length);assert.equal(f.attrs['aria-pressed'],'true');}
 filters.find(f=>f.dataset.filter==='Design').click();assert.equal(visible().length,1);assert.deepEqual(chapters.map(c=>c.hidden),[true,true,false,true,true,true]);search('Superpowers');assert.equal(visible().length,0);assert.equal(ids['empty-state'].hidden,false);assert.equal(ids['results-count'].textContent,'0 skills in the collection');ids['clear-search'].click();assert.equal(visible().length,1);ids['reset-filters'].click();assert.equal(visible().length,21);assert.equal(ids['empty-state'].hidden,true);assert.equal(ids['clear-search'].hidden,true);assert.ok(chapters.every(c=>!c.hidden));
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


 const tokens=css=>Object.fromEntries([...css.match(/:root\{([^}]*)}/)[1].matchAll(/(--[\w-]+):([^;}]*)/g)].map(m=>[m[1],m[2]])); const old=tokens(beforeCSS),now=tokens(styles); assert.deepEqual(now,{...old,'--type-list-leading':'1.5'});
 for(const [selector,props]of [['.hero',['padding:var(--space-6) 0 var(--space-4)']],['.top-inside',['margin:var(--space-2) 0 0','var(--type-small)','var(--type-list-leading)','color:var(--body)']],['.top-inside-label',['var(--type-label)','var(--muted)']],['.inside-list li',['line-height:var(--type-list-leading)']],['.category',['font-weight:600','color:var(--ink)']],['mark',['background:var(--prompt-background)','color:var(--ink)']],['.chapter-lede',['var(--type-small)','var(--body)']]]) {const rule=rules(styles).find(m=>m[1].trim()===selector);assert.ok(rule,selector);for(const p of props)assert.ok(rule[2].includes(p),selector+': '+p);}
 assert.match(styles,/\.skill-card h3\{[^}]*margin:var\(--space-4\) 0 var\(--space-2\)/);
 assert.match(styles,/:is\(\.description,\.fit p,\.inside-list li,\.inside-note,\.top-inside\)\{max-width:62ch}/);
 assert.match(styles,/\.skill-grid :is\(\.inside-list li,\.inside-note\)\{max-width:62ch}/);
 for(const [,,decl]of rules(styles).filter(r=>!r[1].includes(':root')&&!rules(beforeCSS).some(o=>o[1]===r[1]&&o[2]===r[2]))) { for(const [,t]of decl.matchAll(/var\((--[\w-]+)\)/g))assert.ok(t in now); assert.doesNotMatch(decl,/#|\b(?:rgb|hsl)\(|[1-9][0-9]*px/); }
 const accent=rules(styles).filter(r=>r[2].includes('var(--accent)'));assert.equal(accent.length,2);
});
gate('10 unchanged surface and chapter ledes',()=>{
 for(const [i,[,,c]]of articles.entries())assert.deepEqual(c.match(/<a href=[\s\S]*?<\/a>/g),originals[i][2].match(/<a href=[\s\S]*?<\/a>/g));
 for(const pattern of [/<h2 class="chapter-heading"[^>]*>[\s\S]*?<\/h2>/g,/<button[^>]*data-filter=[\s\S]*?<\/button>/g,/<section class="hero[\s\S]*?<\/section>/g])assert.deepEqual([...html.matchAll(pattern)].map(m=>m[0]),[...before.matchAll(pattern)].map(m=>m[0]));
 for(const id of ['workflow','quality','design','efficiency','knowledge','discovery']) { const rule=styles.match(new RegExp('#chapter-'+id+'::before\\{[^}]*}'))?.[0]; assert.ok(rule);assert.ok(beforeCSS.includes(rule)); }
 const ledes=[...copy.matchAll(/^- (Workflow|Quality|Design|Efficiency|Knowledge|Discovery) — (.+)$/gm)].map(m=>m[2]); const shipped=[...html.matchAll(/<h2 class="chapter-heading"[^>]*>[\s\S]*?<\/h2>\s*<p class="chapter-lede">([^<]+)<\/p>/g)].map(m=>m[1]);assert.deepEqual(shipped,ledes); console.log('Chapter lede words:',ledes.reduce((n,l)=>n+words(l),0));
});
gate('11 script diff discipline',()=>{
 const functionBlock=(s,name,next)=>s.slice(s.indexOf(name),s.indexOf(next,s.indexOf(name)));
 for(const [start,end]of [['  chapters.forEach','searchInput?.addEventListener'],["searchInput?.addEventListener",'function update']]) {assert.equal(functionBlock(source,start,end),functionBlock(beforeJS,start,end));}
 const oldFiltering=beforeJS.slice(beforeJS.indexOf('function updateResults'),beforeJS.indexOf('searchInput?.addEventListener'));
 const newFiltering=source.slice(source.indexOf('function updateResults'),source.indexOf('searchInput?.addEventListener')).replace('  updateInsideSearch(terms);\n','');assert.equal(newFiltering,oldFiltering);
 const normalize=s=>s.replaceAll('toggleInside','toggleGuides').replaceAll('insides','guides').replaceAll('updateInsideControl','updateGuideControl').replaceAll('inside => inside','guide => guide').replaceAll('inside.open','guide.open').replaceAll('inside => {','guide => {').replaceAll('Collapse all inside lists','Collapse all').replaceAll('Expand all inside lists','Expand all guides');
 const tail=source.slice(source.indexOf('function updateInsideControl')); const oldTail=beforeJS.slice(beforeJS.indexOf('function updateGuideControl'),beforeJS.indexOf('async function copyText')).trim();assert.equal(normalize(tail).trim(),oldTail);
});
gate('12 live verification record',()=>{ console.log('Live checklist (requires browser after publish; local Playwright launch blocked: Hatch WebGL domain policy required; 320–360px remains unverified): 21 collapsed cards with stars/top lines; expand/collapse 21; to-spec/worktrees opens and marks; Design III (1); filters, clear, reset; layout; true 320–360px phone width. Static checks do not constitute live verification.'); });
if(failures.length){console.error(failures.length+' failing gates');process.exitCode=1;}else console.log('PASS all 12 fix-in-place gates');
