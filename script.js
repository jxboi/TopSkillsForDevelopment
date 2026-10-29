'use strict';

const searchInput = document.querySelector('#search');
const clearSearch = document.querySelector('#clear-search');
const toggleGuides = document.querySelector('#toggle-guides');
const guides = [...document.querySelectorAll('.skill-card details')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.skill-card')];
const resultsCount = document.querySelector('#results-count');
const emptyState = document.querySelector('#empty-state');
const resetButton = document.querySelector('#reset-filters');
const copyStatus = document.querySelector('#copy-status');
// Optional controls must never prevent unrelated features from initializing.
for (const [name, element] of Object.entries({ searchInput, clearSearch, toggleGuides, resultsCount, emptyState, resetButton, copyStatus })) {
  if (!element) console.warn(`Skills: missing ${name}; its feature will degrade gracefully.`);
}
let selectedCategory = 'All skills';
const searchableCards = cards.map(card => ({ card, text: card.textContent.toLocaleLowerCase() }));

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

function updateGuideControl() {
  if (!toggleGuides || !guides.length) return;
  const allOpen = guides.every(guide => guide.open);
  toggleGuides.textContent = allOpen ? 'Collapse all' : 'Expand all guides';
  toggleGuides.setAttribute('aria-expanded', String(allOpen));
}

toggleGuides?.addEventListener('click', () => {
  const open = !guides.every(guide => guide.open);
  guides.forEach(guide => { guide.open = open; });
  updateGuideControl();
});
guides.forEach(guide => guide.addEventListener('toggle', updateGuideControl));
function revealControls() {
  filterButtons.forEach(button => { button.hidden = false; });
  if (toggleGuides && guides.length) toggleGuides.hidden = false;
}

revealControls();
updateGuideControl();
updateResults();

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
    const prompt = button.closest('.prompt')?.querySelector('.prompt-text');
    try {
      if (!prompt) throw new Error('Prompt unavailable');
      await copyText(prompt.textContent);
      button.textContent = 'Copied!';
      resetTimer = setTimeout(() => { button.textContent = 'Copy prompt'; }, 3000);
      if (copyStatus) copyStatus.textContent = `Example prompt copied for ${button.closest('.skill-card')?.querySelector('h2')?.textContent ?? 'this skill'}.`;
    } catch {
      button.textContent = 'Select prompt to copy';
      const selection = window.getSelection();
      if (prompt && selection) {
        const range = document.createRange();
        range.selectNodeContents(prompt);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      if (copyStatus) copyStatus.textContent = prompt && selection
        ? 'Clipboard unavailable. The prompt is selected; use your browser’s copy command.'
        : 'Clipboard unavailable. Select the prompt to copy with your browser’s copy command.';
    }
  });
});
