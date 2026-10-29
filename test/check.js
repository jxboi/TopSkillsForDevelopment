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
assert.ok(styles.includes('--copy-width:144px') && styles.includes('min-width:var(--copy-width)'));
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

// Muted text on the prompt background would be 4.30:1, below AA.
const plainCSS = styles.replace(/\/\*[\s\S]*?\*\//g, '');
const visualRules = [...plainCSS.matchAll(/([^{}]+)\{([^{}]*)}/g)];
const promptRule = visualRules.find(([, selector]) => selector.trim() === '.prompt');
assert.ok(promptRule && /background:var\(--prompt-background\)/.test(promptRule[2]));
for (const [, selector, declarations] of visualRules) {
  if (selector.includes('.prompt')) assert.doesNotMatch(declarations, /(?:^|;)\s*color:\s*(?:var\(--muted\)|#6b6b64)/);
  if (/background(?:-color)?:\s*(?:var\(--prompt-background\)|#e9e6de)/.test(declarations)) {
    assert.doesNotMatch(declarations, /(?:^|;)\s*color:\s*(?:var\(--muted\)|#6b6b64)/);
  }
  const properties = declarations.split(';').filter(part => part.includes(':')).map(part => part.slice(0, part.indexOf(':')).trim());
  assert.ok(properties.filter(property => property === 'content').length <= 1, 'No duplicate content declarations');
}
const mediaConditions = [...plainCSS.matchAll(/@media\s*([^{}]+)\{/g)].map(([, condition]) => condition.replace(/\s/g, ''));
assert.equal(new Set(mediaConditions).size, mediaConditions.length, 'No duplicate media conditions');
const mainStart = html.indexOf('<main>');
const builtWith = html.indexOf('<section class="built-with container"');
const mainEnd = html.indexOf('</main>');
const footerStart = html.indexOf('<footer');
assert.ok(mainStart >= 0 && mainStart < builtWith && builtWith < mainEnd && mainEnd < footerStart);
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
assert.match(source, /searchInput\.disabled = false/);
const articles = [...html.matchAll(/<article class="skill-card" data-category="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
assert.equal(articles.length, 21);

// Depth field T1: agreed fit markup, copy, order, and CSS seams.
const fitParagraphs = kind => [...html.matchAll(new RegExp(`<p class="fit-${kind}">([\\s\\S]*?)</p>`, 'g'))];
assert.equal(fitParagraphs('use').length, 21, 'Expected 21 fit-use paragraphs (one per card)');
assert.equal(fitParagraphs('avoid').length, 21, 'Expected 21 fit-avoid paragraphs (one per card)');
assert.doesNotMatch(html, /<[^>]+\bclass\s*=\s*["'][^"']*\bbest\b[^"']*["']/);
// Decode the ampersand entities used in the copy before checking rendered text.
const textOnly = markup => markup.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
const fitSentences = articles.map(([, , markup], index) => {
  const fitBlocks = [...markup.matchAll(/<div class="fit">([\s\S]*?)<\/div>/g)];
  assert.equal(fitBlocks.length, 1, `Card ${index + 1} needs one fit block`);
  const sentences = ['use', 'avoid'].map(kind => {
    const paragraphs = [...markup.matchAll(new RegExp(`<p class="fit-${kind}">([\\s\\S]*?)</p>`, 'g'))];
    assert.equal(paragraphs.length, 1, `Card ${index + 1} needs one fit-${kind}`);
    assert.ok(fitBlocks[0][1].includes(paragraphs[0][0]), 'Fit paragraph belongs inside the fit block');
    const label = kind === 'use' ? 'Use when' : 'Avoid when';
    assert.ok(paragraphs[0][1].startsWith(`<strong>${label}</strong>`));
    const sentence = textOnly(paragraphs[0][1].replace(`<strong>${label}</strong>`, ''));
    assert.ok(sentence.length >= 20 && sentence.length <= 160, `Card ${index + 1} fit-${kind} must be 20–160 chars`);
    assert.match(sentence, /^[^.!?]+[.!?]$/, `Card ${index + 1} fit-${kind} must be a single sentence`);
    return sentence;
  });
  assert.ok(fitBlocks[0][1].indexOf('class="fit-use"') < fitBlocks[0][1].indexOf('class="fit-avoid"'), 'Use precedes Avoid in each fit block');
  const [use, avoid] = sentences;
  const description = textOnly(markup.match(/<p class="description">([\s\S]*?)<\/p>/)[1]);
  assert.ok(!description.includes(use), 'Use sentence must not duplicate the description');
  assert.ok(!description.includes(avoid), 'Avoid sentence must not duplicate the description');
  assert.notEqual(avoid, use);
  assert.ok(!avoid.includes(use), 'Avoid sentence must not contain the Use sentence');
  const firstFour = sentence => sentence.toLowerCase().split(/\s+/).slice(0, 4).join(' ');
  assert.notEqual(firstFour(avoid), firstFour(use), 'Use and Avoid must start with different four words');
  const positions = ['<div class="card-meta">', '<h3', '<p class="description">', '<div class="fit">', '<details', '<div class="card-footer">']
    .map(marker => markup.indexOf(marker));
  assert.ok(positions.every((position, i) => position >= 0 && (i === 0 || position > positions[i - 1])), 'Card order: meta → h3 → description → fit → details → footer');
  assert.ok(markup.indexOf('</div>', positions[3]) < positions[4], 'Fit block must end before details');
  return sentences;
});
for (const [offset, kind] of ['use', 'avoid'].entries()) {
  assert.deepEqual(fitParagraphs(kind).map(([, markup]) => textOnly(markup.replace(/<strong>[\s\S]*?<\/strong>/, ''))),
    fitSentences.map(sentences => sentences[offset]), 'Fit pairs follow article document order');
}
assert.doesNotMatch(plainCSS, /\.best\b/);
const fitRules = visualRules.filter(([, selector]) => /\.fit\b/.test(selector));
assert.ok(fitRules.some(([, selector]) => selector.trim() === '.fit'), 'Expected a .fit rule');
for (const [, , declarations] of fitRules) {
  assert.doesNotMatch(declarations, /#|var\(\s*--accent\b|\bborder|\bbackground/i);
  for (const [, token] of declarations.matchAll(/var\(\s*(--[\w-]+)/g)) {
    assert.match(token, /^--(?:type-small|type-prose-leading|space-[\w-]+|body|ink)$/);
  }
}
assert.match(plainCSS, /\.skill-grid:has\(> article:only-child\) :is\(\.description,\.fit p,\.guide,\.prompt-text\)\s*\{\s*max-width:\s*62ch\s*;?\s*}/);

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
assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
assert.ok(html.indexOf('<h3') > html.indexOf('<h2 class="chapter-heading"'));
assert.equal([...html.matchAll(/<h3\b/g)].length, articles.length);
assert.equal(chapterMarkup.reduce((sum, [, , markup]) => sum + [...markup.matchAll(/<h3 id="skill-\d+">/g)].length, 0), articles.length);
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
    button.closest = selector => ({ querySelector: query => selector === '.prompt' ? (query === '.prompt-text' ? prompt : null) : (query === '[id^="skill-"]' ? element(markup.match(/<h3[^>]*>([^<]*)<\/h3>/)[1]) : null) });
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
  assert.equal(app.ids.search.disabled, false);
  assert.equal(app.visible().length, 21);
  assert.equal(app.ids['toggle-guides'].hidden, false);
  assert.ok(app.chapters.every(chapter => !chapter.hidden));
  // Derive a unique search term from the shipped fit copy and all card text.
  const cardText = app.cards.map(card => card.textContent.toLowerCase());
  const fitWords = fitSentences.flatMap((sentences, index) =>
    (sentences.join(' ').toLowerCase().match(/[a-z]+/g) || []).map(word => ({ word, index })));
  const uniqueFitWord = fitWords.find(({ word, index }) =>
    cardText.every((text, cardIndex) => text.includes(word) === (cardIndex === index)));
  assert.ok(uniqueFitWord, 'Fit copy must supply a word searchable in exactly one card');
  app.search(uniqueFitWord.word);
  assert.deepEqual(app.visible(), [app.cards[uniqueFitWord.index]], 'Searching a derived fit word shows exactly its card');
  app.search('');

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
  assert.deepEqual(app.cards.filter(card => card.classList.contains('first-visible')), app.visible());
  assert.equal(app.visible().length, 1);
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
  assert.deepEqual(app.cards.filter(card => card.classList.contains('first-visible')),
    app.chapters.map(chapter => chapter.querySelectorAll('.skill-card')[0]));
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
    const title = articles[index][2].match(/<h3[^>]*>([^<]*)<\/h3>/)[1];
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
  // T1 / seam 3: filtering chapters must not renumber their decorative headings.
  const cssRules = [...styles.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .flatMap(([, selectors, body]) => selectors.split(',').map(selector => ({
      selector: selector.trim(),
      declarations: Object.fromEntries(body.split(';').filter(part => part.includes(':')).map(part => {
        const colon = part.indexOf(':');
        return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()];
      })),
    })));
  const roman = number => {
    let result = '';
    for (const [value, numeral] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) {
      while (number >= value) { result += numeral; number -= value; }
    }
    return result;
  };
  const numeralFailures = [];
  chapterMarkup.forEach(([, id], index) => {
    const expected = roman(index + 1);
    const headingRules = cssRules.filter(rule => rule.selector === `#${id}` || rule.selector === `#${id}::before`);
    const fixedContent = headingRules.some(rule => rule.selector.endsWith('::before') &&
      new RegExp(`^["']${expected}["']\\s*/\\s*["']["']$`).test(rule.declarations.content || ''));
    const fixedCounter = headingRules.some(rule => {
      const assignment = (rule.declarations['counter-set'] || '').match(/^([\w-]+)\s+(\d+)$/);
      return assignment && Number(assignment[2]) === index + 1 && cssRules.some(contentRule =>
        (contentRule.selector === '.chapter-heading::before' || contentRule.selector === `#${id}::before`) &&
        new RegExp(`^counter\\(\\s*${assignment[1]}\\s*,\\s*upper-roman\\s*\\)\\s*/\\s*["']["']$`)
          .test(contentRule.declarations.content || ''));
    });
    if (!fixedContent && !fixedCounter) numeralFailures.push(`#${id} must have a fixed CSS numeral ${expected} derived from heading order`);
  });
  if (cssRules.some(rule => rule.selector === '.chapter' &&
    /\bchapter\b/.test(rule.declarations['counter-increment'] || '') &&
    cssRules.some(headingRule => headingRule.selector === '.chapter-heading::before' &&
      /counter\(\s*chapter\b/.test(headingRule.declarations.content || '')))) {
    numeralFailures.push('Heading numerals must not depend on the running .chapter counter-increment');
  }
  assert.deepEqual(numeralFailures, [], 'Chapter numerals must remain stable when earlier chapters are hidden');
  console.log('PASS: 21 cards; chapter grouping and hiding, search, filters, empty state, reset, clear-search, guides, copy, and missing-element resilience.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
