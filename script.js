'use strict';

const searchInput = document.querySelector('#search');
const clearSearch = document.querySelector('#clear-search');
const toggleGuides = document.querySelector('#toggle-guides');
const guides = [...document.querySelectorAll('.skill-card details')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.skill-card')];
const resultsCount = document.querySelector('#results-count');
const emptyState = document.querySelector('#empty-state');
const copyStatus = document.querySelector('#copy-status');
let selectedCategory = 'All skills';
const searchableCards = cards.map(card => ({ card, text: card.textContent.toLocaleLowerCase() }));

function updateResults() {
  clearSearch.hidden = searchInput.value.length === 0;
  const terms = searchInput.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  searchableCards.forEach(({ card, text }) => {
    const matchesCategory = selectedCategory === 'All skills' || card.dataset.category === selectedCategory;
    const visible = matchesCategory && terms.every(term => text.includes(term));
    card.hidden = !visible;
    if (visible) count++;
  });
  resultsCount.textContent = `${count} ${count === 1 ? 'skill' : 'skills'} in the collection`;
  emptyState.hidden = count !== 0;
}

searchInput.addEventListener('input', updateResults);
filterButtons.forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.filter;
  filterButtons.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  updateResults();
}));

function resetFilters() {
  searchInput.value = '';
  filterButtons[0].click();
  searchInput.focus();
}

document.querySelector('#reset-filters').addEventListener('click', resetFilters);
clearSearch.addEventListener('click', resetFilters);

function updateGuideControl() {
  const allOpen = guides.every(guide => guide.open);
  toggleGuides.textContent = allOpen ? 'Collapse all' : 'Expand all guides';
  toggleGuides.setAttribute('aria-expanded', String(allOpen));
}

toggleGuides.addEventListener('click', () => {
  const open = !guides.every(guide => guide.open);
  guides.forEach(guide => { guide.open = open; });
  updateGuideControl();
});
guides.forEach(guide => guide.addEventListener('toggle', updateGuideControl));

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Use the local-file fallback. */ }
  }
  const previousFocus = document.activeElement;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(textarea);
  textarea.select();
  let copied;
  try { copied = document.execCommand('copy'); }
  finally { textarea.remove(); previousFocus?.focus({ preventScroll: true }); }
  if (!copied) throw new Error('Copy unavailable');
}

document.querySelectorAll('.copy-button').forEach(button => {
  let resetTimer;
  button.addEventListener('click', async () => {
    clearTimeout(resetTimer);
    const text = button.closest('.prompt').querySelector('.prompt-text').textContent;
    try {
      await copyText(text);
      button.textContent = 'Copied!';
      copyStatus.textContent = `Example prompt copied for ${button.closest('.skill-card').querySelector('h2').textContent}.`;
    } catch {
      button.textContent = 'Select prompt to copy';
      const range = document.createRange();
      range.selectNodeContents(button.closest('.prompt').querySelector('.prompt-text'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = 'Clipboard unavailable. The prompt is selected; use your browser’s copy command.';
    }
    resetTimer = setTimeout(() => { button.textContent = 'Copy prompt'; }, 3000);
  });
});
