'use strict';

const searchInput = document.querySelector('#search');
const clearSearch = document.querySelector('#clear-search');
const toggleInside = document.querySelector('#toggle-inside');
const insides = [...document.querySelectorAll('.skill-card details.inside')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const chapters = [...document.querySelectorAll('.chapter')];
const cards = [...document.querySelectorAll('.skill-card')];
const resultsCount = document.querySelector('#results-count');
const emptyState = document.querySelector('#empty-state');
const resetButton = document.querySelector('#reset-filters');
// Optional controls must never prevent unrelated features from initializing.
for (const [name, element] of Object.entries({ searchInput, clearSearch, toggleInside, resultsCount, emptyState, resetButton })) {
  if (!element) console.warn(`Skills: missing ${name}; its feature will degrade gracefully.`);
}
let selectedCategory = 'All skills';
const searchableCards = cards.map(card => ({ card, text: card.textContent.toLocaleLowerCase() }));

const insideSearch = cards.map(card => {
  const inside = card.querySelector('details.inside');
  const list = inside.querySelector('.inside-list');
  return { card, inside, list, originalHTML: list.innerHTML, preSearchOpen: false };
});
let searchingInside = false;

function updateInsideSearch(terms) {
  if (terms.length && !searchingInside) {
    insideSearch.forEach(state => { state.preSearchOpen = state.inside.open; });
  }
  insideSearch.forEach(({ card, inside, list, originalHTML, preSearchOpen }) => {
    list.innerHTML = originalHTML;
    if (!terms.length) {
      if (searchingInside) inside.open = preSearchOpen;
      return;
    }
    if (card.hidden || !terms.some(term => list.textContent.toLocaleLowerCase().includes(term))) return;
    inside.open = true;
    const walker = document.createTreeWalker(list, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const text = node.textContent;
      const lower = text.toLocaleLowerCase();
      const fragment = document.createDocumentFragment();
      let start = 0;
      let cursor = 0;
      while (cursor < text.length) {
        const term = terms.filter(term => lower.startsWith(term, cursor)).sort((a, b) => b.length - a.length)[0];
        if (!term) { cursor++; continue; }
        fragment.append(document.createTextNode(text.slice(start, cursor)));
        const mark = document.createElement('mark');
        mark.textContent = text.slice(cursor, cursor + term.length);
        fragment.append(mark);
        cursor += term.length;
        start = cursor;
      }
      if (start) {
        fragment.append(document.createTextNode(text.slice(start)));
        node.replaceWith(fragment);
      }
    });
  });
  searchingInside = terms.length > 0;
}

function updateResults() {
  const query = searchInput?.value ?? '';
  if (clearSearch) clearSearch.hidden = !searchInput || query.length === 0;
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  searchableCards.forEach(({ card, text }) => {
    const matchesCategory = selectedCategory === 'All skills' || card.dataset.category === selectedCategory;
    const visible = matchesCategory && terms.every(term => text.includes(term));
    card.hidden = !visible;
    if (visible) count++;
  });
  updateInsideSearch(terms);
  chapters.forEach(chapter => {
    const members = [...chapter.querySelectorAll('.skill-card')];
    const firstVisible = members.find(card => !card.hidden);
    members.forEach(card => card.classList.toggle('first-visible', card === firstVisible));
    chapter.hidden = !members.some(card => !card.hidden);
  });
  if (resultsCount) resultsCount.textContent = `${count} ${count === 1 ? 'skill' : 'skills'} in the collection`;
  if (emptyState) emptyState.hidden = count !== 0;
}

searchInput?.addEventListener('input', updateResults);
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    filterButtons.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    updateResults();
  });
});

function resetFilters() {
  if (searchInput) searchInput.value = '';
  selectedCategory = 'All skills';
  filterButtons.forEach(button => {
    const active = button.dataset.filter === selectedCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  updateResults();
  searchInput?.focus();
}

resetButton?.addEventListener('click', resetFilters);
clearSearch?.addEventListener('click', () => {
  if (searchInput) searchInput.value = '';
  updateResults();
  searchInput?.focus();
});

function updateInsideControl() {
  if (!toggleInside || !insides.length) return;
  const allOpen = insides.every(inside => inside.open);
  toggleInside.textContent = allOpen ? 'Collapse all inside lists' : 'Expand all inside lists';
  toggleInside.setAttribute('aria-expanded', String(allOpen));
}

toggleInside?.addEventListener('click', () => {
  const open = !insides.every(inside => inside.open);
  insides.forEach(inside => { inside.open = open; });
  updateInsideControl();
});
insides.forEach(inside => inside.addEventListener('toggle', updateInsideControl));
function revealControls() {
  if (searchInput) searchInput.disabled = false;
  filterButtons.forEach(button => { button.hidden = false; });
  if (toggleInside && insides.length) toggleInside.hidden = false;
}

revealControls();
updateInsideControl();
updateResults();

