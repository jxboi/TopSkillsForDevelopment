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
const searchableCards = cards.map(card => {
  const searchable = card.cloneNode(true);
  searchable.querySelectorAll('.favourite-button, .item-favourite-button').forEach(button => button.remove());
  return { card, text: searchable.textContent.toLocaleLowerCase() };
});

// Favourites: begin
const toggleFavourites = document.querySelector('#toggle-favourites');
const favouriteButtons = [...document.querySelectorAll('.favourite-button')];
const validFavouriteIds = new Set(favouriteButtons.map(button => button.dataset.favouriteFor));
let favourites = new Set();
let favouritesOnly = false;
try {
  const stored = JSON.parse(localStorage.getItem('topskills-favourites'));
  if (Array.isArray(stored)) favourites = new Set(stored.filter(id => validFavouriteIds.has(id)));
} catch (error) {
  favourites = new Set();
}
function applyFavourite(button) {
  const id = button.dataset.favouriteFor;
  const title = document.querySelector('#' + id).textContent;
  const pressed = favourites.has(id);
  button.setAttribute('aria-pressed', String(pressed));
  button.setAttribute('aria-label', pressed ? `Remove ${title} from favourites` : `Favourite ${title}`);
  button.textContent = pressed ? '★ Favourited' : '☆ Favourite';
}
favouriteButtons.forEach(button => {
  applyFavourite(button);
  button.hidden = false;
  button.addEventListener('click', () => {
    const id = button.dataset.favouriteFor;
    if (favourites.has(id)) favourites.delete(id); else favourites.add(id);
    try {
      localStorage.setItem('topskills-favourites', JSON.stringify([...favourites]));
    } catch (error) {
      favourites = new Set();
    }
    favouriteButtons.forEach(applyFavourite);
    updateResults();
  });
});
toggleFavourites?.addEventListener('click', () => {
  favouritesOnly = !favouritesOnly;
  toggleFavourites.setAttribute('aria-pressed', String(favouritesOnly));
  toggleFavourites.classList.toggle('active', favouritesOnly);
  updateResults();
});
if (toggleFavourites) toggleFavourites.hidden = false;
// Favourites: end

// Item favourites: begin
const itemFavouriteButtons = [...document.querySelectorAll('.item-favourite-button')];
const validItemIds = new Set(itemFavouriteButtons.map(button => button.dataset.itemFavouriteFor));
let itemFavourites = new Set();
try {
  const stored = JSON.parse(localStorage.getItem('topskills-item-favourites'));
  if (Array.isArray(stored)) itemFavourites = new Set(stored.filter(id => validItemIds.has(id)));
} catch (error) {
  itemFavourites = new Set();
}
function hasFavouriteItem(card) {
  return [...(card.querySelectorAll?.('.item-favourite-button') ?? [])].some(button => itemFavourites.has(button.dataset.itemFavouriteFor));
}
function revealItemFavourites(list) {
  list.querySelectorAll?.('.item-favourite-button').forEach(button => {
    const id = button.dataset.itemFavouriteFor;
    const name = id.slice(id.indexOf(':') + 1);
    const pressed = itemFavourites.has(id);
    button.hidden = false;
    button.textContent = pressed ? '★' : '☆';
    button.setAttribute('aria-pressed', String(pressed));
    button.setAttribute('aria-label', pressed ? `Remove ${name} from favourites` : `Favourite ${name}`);
    button.addEventListener('click', () => {
      if (itemFavourites.has(id)) itemFavourites.delete(id); else itemFavourites.add(id);
      try {
        localStorage.setItem('topskills-item-favourites', JSON.stringify([...itemFavourites]));
      } catch (error) {
        itemFavourites = new Set();
      }
      updateResults();
    });
  });
}
function updateItemFavourites(terms) {
  insideSearch.forEach(state => {
    const { card, inside, list } = state;
    if (favouritesOnly && !state.filteringFavourites) {
      state.preFavouriteOpen = searchingInside ? state.preSearchOpen : inside.open;
      state.filteringFavourites = true;
    }
    const itemsOnly = favouritesOnly && !favourites.has(card.querySelector('h3')?.id);
    list.querySelectorAll?.('li').forEach(item => {
      const button = item.querySelector('.item-favourite-button');
      item.hidden = itemsOnly && !itemFavourites.has(button.dataset.itemFavouriteFor) &&
        !(terms || []).some(term => item.textContent.toLocaleLowerCase().includes(term));
    });
    if (itemsOnly && !card.hidden) inside.open = true;
    if (!favouritesOnly && state.filteringFavourites) {
      inside.open = state.preFavouriteOpen;
      if (searchingInside) state.preSearchOpen = state.preFavouriteOpen;
      state.filteringFavourites = false;
      if (searchingInside && !card.hidden && terms.some(term => list.textContent.toLocaleLowerCase().includes(term))) {
        state.autoOpened = !inside.open;
        inside.open = true;
      }
    }
    revealItemFavourites(list);
  });
  updateInsideControl();
}
// Item favourites: end

const insideSearch = cards.map(card => {
  try {
    const inside = card.querySelector('details.inside');
    const list = inside?.querySelector('.inside-list');
    if (!inside || !list) throw new Error('missing Inside block or list');
    const prose = ['.description', '.fit-use'].map(selector => card.querySelector(selector))
      .filter(Boolean).map(element => ({ element, originalHTML: element.innerHTML }));
    return { card, inside, list, originalHTML: list.innerHTML, prose, preSearchOpen: false, autoOpened: false };
  } catch (error) {
    console.warn('Skills: Inside search unavailable for a card.', error);
    return null;
  }
}).filter(Boolean);
let searchingInside = false;

function updateInsideSearch(terms) {
  if (terms.length && !searchingInside) {
    insideSearch.forEach(state => { state.preSearchOpen = state.inside.open; });
  }
  insideSearch.forEach(state => {
    const { card, inside, list, originalHTML, preSearchOpen, prose } = state;
    list.innerHTML = originalHTML;
    prose.forEach(({ element, originalHTML }) => { element.innerHTML = originalHTML; });
    if (!terms.length) {
      if (searchingInside) inside.open = preSearchOpen;
      state.autoOpened = false;
      return;
    }
    if (card.hidden && state.autoOpened) {
      inside.open = false;
      state.autoOpened = false;
    }
    if (card.hidden) return;
    if (terms.some(term => list.textContent.toLocaleLowerCase().includes(term))) {
      if (!inside.open) state.autoOpened = true;
      inside.open = true;
    }
    // Inside highlights stay within list items; prose is highlighted separately.
    [list, ...prose.map(({ element }) => element)].forEach(target => {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        if (!walker.currentNode.parentElement?.closest('button')) nodes.push(walker.currentNode);
      }
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
  });
  searchingInside = terms.length > 0;
  updateInsideControl();
}

function updateResults() {
  const query = searchInput?.value ?? '';
  if (clearSearch) clearSearch.hidden = !searchInput || query.length === 0;
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  searchableCards.forEach(({ card, text }) => {
    const matchesCategory = selectedCategory === 'All skills' || card.dataset.category === selectedCategory;
    const matchesFavourite = !favouritesOnly || favourites.has(card.querySelector('h3').id) || hasFavouriteItem(card);
    const visible = matchesCategory && matchesFavourite && terms.every(term => text.includes(term));
    card.hidden = !visible;
    if (visible) count++;
  });
  updateInsideSearch(terms);
  updateItemFavourites(terms);
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
  favouritesOnly = false;
  toggleFavourites?.setAttribute('aria-pressed', 'false');
  toggleFavourites?.classList.toggle('active', false);
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
  const scope = insideSearch.filter(({ card }) => !card.hidden);
  toggleInside.disabled = scope.length === 0;
  const allOpen = scope.length > 0 && scope.every(({ inside }) => inside.open);
  toggleInside.textContent = allOpen ? 'Collapse all inside lists' : 'Expand all inside lists';
  toggleInside.setAttribute('aria-expanded', String(allOpen));
}

toggleInside?.addEventListener('click', () => {
  const scope = insideSearch.filter(({ card }) => !card.hidden);
  const open = !scope.every(({ inside }) => inside.open);
  scope.forEach(state => {
    state.inside.open = open;
    state.autoOpened = false;
    if (searchingInside) state.preSearchOpen = open;
  });
  updateInsideControl();
});
insides.forEach(inside => inside.addEventListener('toggle', updateInsideControl));
insideSearch.forEach(state => {
  state.inside.addEventListener('click', event => {
    if (!event.target.closest('summary')) return;
    state.autoOpened = false;
    if (searchingInside) state.preSearchOpen = !state.inside.open;
  });
});
function revealControls() {
  if (searchInput) searchInput.disabled = false;
  filterButtons.forEach(button => { button.hidden = false; });
  if (toggleInside && insides.length) toggleInside.hidden = false;
}

revealControls();
updateInsideControl();
updateResults();

