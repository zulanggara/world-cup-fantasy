// Shared brand row (logo) + nav wrapped in one sticky header shell, so the
// nav (and its dropdowns) always stays on top while scrolling and never
// gets visually clipped by page content below it.
(function () {
  function init() {
    const wrap = document.querySelector('.wrap');
    const pageHeader = document.querySelector('.page-header');
    if (!wrap || !pageHeader) return;

    const shell = document.createElement('header');
    shell.className = 'site-header';

    const row = document.createElement('div');
    row.className = 'brand-row';
    row.innerHTML = `<a href="index.html" class="brand-logo">World Cup 2026 Fantasy Stats</a>`;

    wrap.insertBefore(shell, pageHeader);
    shell.appendChild(row);
    shell.appendChild(pageHeader);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
