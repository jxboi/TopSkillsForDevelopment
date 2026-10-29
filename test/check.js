'use strict';
// Exercise the real script against a small DOM double built from the shipped HTML.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert.ok(styles.includes('#6b6b64'));
assert.ok(styles.includes('--touch:44px'));
assert.ok(styles.includes('min-width:144px'));
const mainStart = html.indexOf('<main>');
const builtWith = html.indexOf('<section class="built-with container"');
const mainEnd = html.indexOf('</main>');
const footerStart = html.indexOf('<footer');
assert.ok(mainStart >= 0 && mainStart < builtWith && builtWith < mainEnd && mainEnd < footerStart);
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const articles = [...html.matchAll(/<article class="skill-card" data-category="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
assert.equal(articles.length, 21);
assert.match(html, /How this site was built/);
const filterTags = [...html.matchAll(/<button[^>]*data-filter="([^"]+)"[^>]*>/g)];
filterTags.forEach(([tag]) => assert.match(tag, /\bhidden\b/));
const categoryCounts = new Map();
for (const [, category] of articles) {
  categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
}
const filterButtons = [...html.matchAll(/<button[^>]*data-filter="([^"]+)"[^>]*>([^<]*)<\/button>/g)];
assert.deepEqual(filterButtons.map(([, category]) => category).sort(), ['All skills', ...categoryCounts.keys()].sort());
let categoryLabelTotal = 0;
for (const [, category, label] of filterButtons) {
  const count = category === 'All skills' ? articles.length : categoryCounts.get(category);
  assert.equal(label, `${category} (${count})`, `${category} filter label must match its card count`);
  if (category !== 'All skills') categoryLabelTotal += Number(label.match(/\((\d+)\)$/)[1]);
}
assert.equal(categoryLabelTotal, 21, 'Category filter counts must sum to 21');
assert.match(html, /id="toggle-guides" hidden/);

const chapterMarkup = [...html.matchAll(/<section class="chapter" aria-labelledby="([^"]+)">([\s\S]*?)<\/section>/g)];
assert.deepEqual(chapterMarkup.map(([, , markup]) => markup.match(/class="chapter-heading"[^>]*>([^<]+)/)[1].trim()),
  ['Workflow', 'Quality', 'Design', 'Efficiency', 'Knowledge', 'Discovery']);
const groupedArticles = [];
for (const [, id, markup] of chapterMarkup) {
  const heading = markup.match(/<h2 class="chapter-heading" id="([^"]+)">([^<]+) <span>\((\d+)\)<\/span><\/h2>/);
  assert.ok(heading, 'Each chapter needs a linked heading and count');
  assert.equal(heading[1], id);
  const members = [...markup.matchAll(/<article class="skill-card" data-category="([^"]+)"[^>]*>[\s\S]*?<\/article>/g)];
  assert.equal(members.length, Number(heading[3]));
  assert.ok(members.every(([, category]) => category === heading[2]), 'Chapter contains only its own category');
  groupedArticles.push(...members.map(([article]) => article));
}
assert.deepEqual(groupedArticles, articles.map(([article]) => article), 'Every card belongs to exactly one chapter');

function element(textContent = '') {
  const listeners = {};
  return {
    textContent, hidden: false, value: '', open: false, dataset: {}, attrs: {}, style: {},
    classList: { toggle() {} },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, handler) { listeners[name] = handler; },
    fire(name) { return listeners[name]?.(); },
    click() { return this.fire('click'); },
    focus() { this.focused = true; }, select() {}, remove() {},
  };
}
function setup(missing = '', options = {}) {
  const ids = Object.fromEntries(['search', 'clear-search', 'toggle-guides', 'results-count', 'empty-state', 'reset-filters', 'copy-status'].map(id => [id, element()]));
  delete ids[missing];
  const cards = articles.map(([, category, markup]) => Object.assign(element(markup.replace(/<[^>]*>/g, ' ')), { dataset: { category } }));
  const chapters = chapterMarkup.map(([, , markup]) => {
    const memberIds = [...markup.matchAll(/<article[^>]*aria-labelledby="([^"]+)"/g)].map(([, id]) => id);
    const members = cards.filter((card, index) => memberIds.includes(articles[index][0].match(/aria-labelledby="([^"]+)"/)[1]));
    return Object.assign(element(), { querySelectorAll: selector => selector === '.skill-card' ? members : [] });
  });
  const guides = cards.map(() => element());
  const filters = missing === 'filters' ? [] : filterTags.map(([, category]) => Object.assign(element(), { dataset: { filter: category } }));
  const copies = articles.map(([, , markup]) => {
    const button = element('Copy prompt');
    const prompt = options.noPrompt ? null : element(markup.match(/class="prompt-text">([^<]*)/)[1]);
    button.closest = selector => ({ querySelector: () => selector === '.prompt' ? prompt : element(markup.match(/<h2[^>]*>([^<]*)<\/h2>/)[1]) });
    return button;
  });
  const timers = [];
  const copied = [];
  const selected = [];
  const document = {
    querySelector: selector => ids[selector.slice(1)] ?? null,
    querySelectorAll: selector => ({ '.chapter': chapters, '.skill-card': cards, '.skill-card details': guides, '[data-filter]': filters, '.copy-button': copies })[selector] ?? [],
    createElement: () => element(), body: { append() {} },
    execCommand: () => { copied.push('fallback'); return !options.failCopy; },
    createRange: () => ({ selectNodeContents: prompt => selected.push(prompt.textContent) }),
  };
  vm.runInNewContext(source, {
    document, navigator: { clipboard: { writeText: async text => { copied.push(text); } } },
    window: { isSecureContext: !options.fallback, getSelection: () => ({ removeAllRanges() {}, addRange() {} }) },
    console: { warn() {} }, setTimeout: callback => { timers.push(callback); return timers.length; }, clearTimeout() {},
  });
  return { ids, cards, chapters, guides, filters, copies, copied, selected, timers,
    visible: () => cards.filter(card => !card.hidden),
    search(query) { ids.search.value = query; ids.search.fire('input'); },
  };
}
async function check() {
  const app = setup();
  assert.equal(app.visible().length, 21);
  assert.equal(app.ids['toggle-guides'].hidden, false);
  assert.ok(app.chapters.every(chapter => !chapter.hidden));
  app.search('  SUPERPOWERS   settings  ');
  assert.equal(app.visible().length, 1);
  assert.deepEqual(app.chapters.map(chapter => chapter.hidden), [false, true, true, true, true, true], 'Search hides entire nonmatching chapters');
  assert.equal(app.ids['results-count'].textContent, '1 skill in the collection');
  assert.equal(app.ids['clear-search'].hidden, false);
  for (const filter of app.filters) {
    app.search('');
    filter.click();
    assert.equal(filter.attrs['aria-pressed'], 'true');
    assert.equal(app.visible().length, app.cards.filter(card => filter.dataset.filter === 'All skills' || card.dataset.category === filter.dataset.filter).length);
  }
  app.filters.find(button => button.dataset.filter === 'Design').click();
  assert.deepEqual(app.chapters.map(chapter => chapter.hidden), [true, true, false, true, true, true], 'Design filter shows only its chapter');
  app.search('Superpowers');
  assert.equal(app.visible().length, 0);
  assert.equal(app.ids['empty-state'].hidden, false);
  assert.ok(app.chapters.every(chapter => chapter.hidden), 'No matches hides every chapter heading');
  app.ids['clear-search'].click();
  assert.equal(app.ids.search.value, '');
  assert.equal(app.ids.search.focused, true);
  assert.equal(app.visible().length, app.cards.filter(card => card.dataset.category === 'Design').length);
  assert.equal(app.filters.find(button => button.dataset.filter === 'Design').attrs['aria-pressed'], 'true');
  app.ids['reset-filters'].click();
  assert.equal(app.visible().length, 21);
  assert.equal(app.ids['empty-state'].hidden, true);
  assert.ok(app.chapters.every(chapter => !chapter.hidden), 'Reset restores all chapters');
  assert.equal(app.ids.search.value, '');
  assert.equal(app.ids.search.focused, true);
  app.search('unknown-skill-xyz');
  app.ids['clear-search'].click();
  assert.equal(app.visible().length, 21);
  assert.equal(app.ids['clear-search'].hidden, true);
  app.ids['toggle-guides'].click();
  assert.ok(app.guides.every(guide => guide.open));
  assert.equal(app.ids['toggle-guides'].attrs['aria-expanded'], 'true');
  app.guides[0].open = false;
  app.guides[0].fire('toggle');
  assert.equal(app.ids['toggle-guides'].attrs['aria-expanded'], 'false');
  app.ids['toggle-guides'].click();
  app.ids['toggle-guides'].click();
  assert.ok(app.guides.every(guide => !guide.open));
  for (const [index, button] of app.copies.entries()) {
    await button.click();
    assert.equal(button.textContent, 'Copied!');
    const title = articles[index][2].match(/<h2[^>]*>([^<]*)<\/h2>/)[1];
    assert.equal(app.ids['copy-status'].textContent, `Example prompt copied for ${title}.`);
  }
  assert.equal(app.copied.length, 21);
  assert.equal(app.timers.length, 21);
  app.timers[0]();
  assert.equal(app.copies[0].textContent, 'Copy prompt');
  const fallback = setup('', { fallback: true });
  await fallback.copies[0].click();
  assert.equal(fallback.copies[0].textContent, 'Copied!');
  const failed = setup('', { fallback: true, failCopy: true });
  await failed.copies[0].click();
  assert.equal(failed.copies[0].textContent, 'Select prompt to copy');
  assert.equal(failed.selected.length, 1);
  assert.equal(failed.timers.length, 0);
  const absent = setup('', { noPrompt: true });
  await absent.copies[0].click();
  assert.equal(absent.copies[0].textContent, 'Select prompt to copy');
  for (const missing of [...Object.keys(app.ids), 'filters']) {
    const partial = setup(missing);
    if (partial.ids.search) partial.search('Superpowers');
    if (partial.ids['toggle-guides']) partial.ids['toggle-guides'].click();
    if (partial.ids['reset-filters']) partial.ids['reset-filters'].click();
    if (partial.ids['clear-search']) partial.ids['clear-search'].click();
    await partial.copies[0].click();
    assert.equal(partial.copies[0].textContent, 'Copied!');
    assert.equal(partial.visible().length, 21);
  }
  console.log('PASS: 21 cards; chapter grouping and hiding, search, filters, empty state, reset, clear-search, guides, copy, and missing-element resilience.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
