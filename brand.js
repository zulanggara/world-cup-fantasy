// Shared brand row (logo only) injected above the nav on every page.
(function () {
  function init() {
    const wrap = document.querySelector('.wrap');
    const pageHeader = document.querySelector('.page-header');
    if (!wrap || !pageHeader) return;

    const row = document.createElement('div');
    row.className = 'brand-row';
    row.innerHTML = `<a href="index.html" class="brand-logo">World Cup 2026 Fantasy Stats</a>`;
    wrap.insertBefore(row, pageHeader);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
