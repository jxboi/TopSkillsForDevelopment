const searchInput = document.getElementById('search');
const results = document.getElementById('results');
const cards = Array.from(document.querySelectorAll('.card'));
const chips = Array.from(document.querySelectorAll('.chip'));
let activeFilter = 'all';

function applyFilter() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const matchesCategory = activeFilter === 'all' || card.dataset.category === activeFilter;
    const matchesQuery = !query || card.dataset.search.includes(query) || card.querySelector('h2').textContent.toLowerCase().includes(query);
    const show = matchesCategory && matchesQuery;
    card.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });
  results.textContent = visible === cards.length
    ? 'Showing all 10 skills.'
    : `Showing ${visible} of 10 skills.`;
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    applyFilter();
  });
});

searchInput.addEventListener('input', applyFilter);

document.querySelectorAll('.copy').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = button.parentElement.querySelector('code').textContent;
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = 'Copied!';
    } catch {
      const area = document.createElement('textarea');
      area.value = code;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      button.textContent = 'Copied!';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 1800);
  });
});

applyFilter();
