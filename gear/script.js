// script.js — gear page logic
// Depends on: data.js (GEAR constant), injected before this script

let currentRegion = localStorage.getItem('gear-region') || 'DE';

// ── RENDER ────────────────────────────────────────────────

function renderAll() {
  const app = document.getElementById('app');
  app.innerHTML = GEAR.map(renderCategory).join('');
  bindToggles();
}

function renderCategory(cat) {
  return `
    <section class="category">
      <div class="category-header">
        <h2>${esc(cat.category)}</h2>
        <span class="toggle-icon">▾</span>
      </div>
      <div class="product-grid">
        ${cat.products.map(renderProduct).join('')}
      </div>
    </section>
  `;
}

function renderProduct(p) {
  const isGlobal = !!p.global_link;
  const storeName = p.global_store || 'store';

  const linksHTML = isGlobal
    ? `<a class="buy-btn buy-btn-primary"
         href="${esc(p.global_link)}"
         target="_blank" rel="noopener">
         ${p.ref ? '★ ' : ''}Buy on ${esc(storeName)}
       </a>`
    : `<a class="buy-btn buy-btn-primary region-link"
         href="${esc(p.links[currentRegion])}"
         target="_blank" rel="noopener"
         data-de="${esc(p.links.DE)}"
         data-us="${esc(p.links.US)}"
         data-uk="${esc(p.links.UK)}">
         ${p.ref ? '★ ' : ''}Buy on Amazon
       </a>`;

  return `
    <div class="product-card">
      <div class="product-name">${esc(p.name)}</div>
      ${p.desc ? `<div class="product-desc">${esc(p.desc)}</div>` : ''}
      <div class="product-links">${linksHTML}</div>
    </div>
  `;
}

// ── REGION SWITCHING ──────────────────────────────────────

function updateRegion(region) {
  currentRegion = region;
  localStorage.setItem('gear-region', region);

  document.querySelectorAll('.region-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.region === region);
  });

  document.querySelectorAll('.region-link').forEach(link => {
    link.href = link.dataset[region.toLowerCase()];
  });
}

// ── ACCORDION ────────────────────────────────────────────

function bindToggles() {
  document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.category').classList.toggle('collapsed');
    });
  });
}

// ── UTILS ─────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── INIT ──────────────────────────────────────────────────

document.querySelectorAll('.region-btn').forEach(btn => {
  btn.addEventListener('click', () => updateRegion(btn.dataset.region));
  btn.classList.toggle('active', btn.dataset.region === currentRegion);
});

renderAll();
