'use strict';
// Static-output utility, invoked explicitly; index.html is its only content input.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const decode = text => text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, key) => key[0] === '#'
  ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2),16) : Number(key.slice(1)))
  : ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'})[key.toLowerCase()]);

// Minimal tree reader for the shipped static HTML, with no runtime dependencies.
function parse(html) {
  const root={tag:'#document',attrs:{},children:[]}, stack=[root];
  const voidTags=new Set(['meta','link','input','br','hr','img','use','path']);
  for(const token of html.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g)||[]) {
    if(token.startsWith('<!'))continue;
    if(token.startsWith('</')) {
      const tag=token.slice(2,-1).trim();
      const index=stack.map(n=>n.tag).lastIndexOf(tag);
      if(index>0)stack.length=index;
    } else if(token.startsWith('<')) {
      const tag=token.match(/^<([^\s/>]+)/)[1];
      const node={tag,attrs:Object.fromEntries([...token.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])])),children:[]};
      stack.at(-1).children.push(node);
      if(!voidTags.has(tag)&&!token.endsWith('/>'))stack.push(node);
    } else stack.at(-1).children.push(decode(token));
  }
  return root;
}
const descendants = (node,predicate) => node.children.flatMap(child=>typeof child==='string'?[]:[...(predicate(child)?[child]:[]),...descendants(child,predicate)]);
const byClass = (node,cls) => descendants(node,n=>(n.attrs.class||'').split(/\s+/).includes(cls));
const byTag = (node,tag) => descendants(node,n=>n.tag===tag);
const text = (node,omit=()=>false) => typeof node==='string'?node:omit(node)?'':node.children.map(n=>text(n,omit)).join('');
const clean = node => text(node).trim();
const one = nodes => {assert.equal(nodes.length,1,'Expected one shipped element');return nodes[0];};
const cls = (node,name) => one(byClass(node,name));
const singleLine = value => {assert.doesNotMatch(value,/[\r\n]/,'Shipped field contains newline');return value;};

function generate(html,siteURL) {
  assert.match(siteURL,/^https?:\/\/[^/]+$/,'Site URL must be an origin');
  const page=parse(html),chapterNodes=byClass(page,'chapter');
  const chapters=chapterNodes.map(node=>text(cls(node,'chapter-heading'),n=>n.tag==='span').trim());
  const cards=byClass(page,'skill-card').map(node=>{
    const heading=one(byTag(node,'h3')), id=heading.attrs.id;
    assert.ok(id,'Card lacks shipped h3 id');
    const meta=cls(node,'card-meta'), category=node.attrs['data-category'];
    assert.equal(category,clean(cls(meta,'category')),'Category mismatch');
    const metaChildren=meta.children.filter(n=>typeof n!=='string');
    const dotIndex=metaChildren.findIndex(n=>n.attrs.class==='dot');
    assert.ok(dotIndex>=0);const level=clean(metaChildren[dotIndex+1]);
    const starNode=cls(meta,'meta-stars'),starText=text(starNode,n=>n.tag==='svg').trim();
    assert.match(starText,/^\d{1,3}(?:,\d{3})*$/,'Unparseable stars');
    assert.equal(starNode.attrs['aria-label'],starText+' GitHub stars');
    const top=cls(node,'top-inside'),inside=cls(node,'inside-list');
    const items=byTag(inside,'li').map(item=>{
      const nameNode=cls(item,'inside-name'),kindNodes=byClass(item,'inside-kind');
      const prompt=singleLine(clean(cls(item,'example-prompt')));
      const fn=text(item,n=>n===nameNode||n.attrs.class==='inside-kind'||n.attrs.class==='item-category'||n.attrs.class==='example-prompt').trim();
      assert.ok(fn.startsWith('— '),'Missing item separator');
      return {name:clean(nameNode),category:clean(cls(item,'item-category')),kind:kindNodes.length?clean(one(kindNodes)).replace(/^\((command|subcommand)\)$/,'$1'):null,function:fn.slice(2).trim(),example_prompt:prompt};
    });
    const notes=byClass(node,'inside-note');
    return {id,number:Number(clean(cls(node,'number'))),title:clean(heading),category,level,stars:Number(starText.replaceAll(',','')),
      repo:one(byTag(cls(node,'card-footer'),'a')).attrs.href,
      description:singleLine(clean(cls(node,'description'))),
      use_when:text(cls(node,'fit-use'),n=>n.tag==='strong').trim(),
      top_inside:{label:clean(cls(top,'top-inside-label')),names:byClass(top,'inside-name').map(clean)},
      inside_summary:text(one(byTag(node,'summary')),n=>n.tag==='svg').trim(),inside_note:notes.length?clean(one(notes)):null,inside:items};
  });
  const site=clean(one(byTag(page,'title'))).split(' — ')[0];
  const description=one(descendants(page,n=>n.tag==='meta'&&n.attrs.name==='description')).attrs.content;
  const footer=cls(page,'site-footer');
  const star_snapshot=clean(one(byTag(footer,'p'))).match(/Star counts are a snapshot supplied for (.+)\.$/)[1];
  const catalog={site,description,star_snapshot,agent_guide:'llms.txt',chapters,count:cards.length,cards};
  const snippet=`When starting a task, fetch ${siteURL}/skills.json.
Match the task to each skill's Use-when line and category, and pick at most 2 skills.
Then follow the chosen skill's own repository install instructions, and start with its example prompt.
Do not install every matching skill — pick the smallest set that covers the task.
Do not invent an install command: if the repository does not state one, say so and stop.
If no skill matches the task, use no skill from this catalog rather than forcing a match.`;
  const header=`# ${site}\n\n> ${description}\n\n> For agents — how to use this catalog:\n${snippet.split('\n').map(line=>'> '+line).join('\n')}\n\n`;
  let short=header+`> Full catalog: llms-full.txt — Structured catalog: skills.json — Star counts are a snapshot supplied for ${star_snapshot}.\n`;
  let full=header+`> Full catalog in structured form: skills.json — Short index: llms.txt — Star counts are a snapshot supplied for ${star_snapshot}.\n`;
  for(const [i,chapter] of chapters.entries()) {
    short+='\n## '+chapter+'\n';full+='\n## '+chapter+'\n';
    const ledes=byClass(chapterNodes[i],'chapter-lede');if(ledes.length)full+='\n'+clean(one(ledes))+'\n';
    for(const card of cards.filter(c=>c.category===chapter)) {
      const stars=card.stars.toLocaleString('en-US'),anchor=siteURL+'#'+card.id;
      short+=`\n- [${card.title}](${card.repo}) — ${card.category} · ${stars} stars — ${card.description} — Card: ${anchor}\n`;
      full+=`\n### ${card.title}\n\n- Category: ${card.category} · Level: ${card.level} · Stars: ${stars} · Repo: ${card.repo} · Card: ${anchor}\n- Description: ${card.description}\n- Use when: ${card.use_when}\n- Top inside: ${card.top_inside.label} ${card.top_inside.names.join(', ')}\n- Inside: ${card.inside_summary}\n`;
      for(const item of card.inside)full+=`- ${item.name}${item.kind?' ('+item.kind+')':''} [${item.category}] — ${item.function}\n  > ${item.example_prompt}\n`;
      if(card.inside_note)full+='- Note: '+card.inside_note+'\n';
    }
  }
  return {'skills.json':JSON.stringify(catalog,null,2)+'\n','llms.txt':short,'llms-full.txt':full};
}
module.exports={generate};
if(require.main===module) {
  const root=path.join(__dirname,'..');
  const outputs=generate(fs.readFileSync(path.join(root,'index.html'),'utf8'),process.argv[2]||'https://topskillsfordevelopment.vercel.app');
  for(const [name,content] of Object.entries(outputs))fs.writeFileSync(path.join(root,name),content);
}
