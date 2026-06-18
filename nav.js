// Shared top navigation, grouped into dropdowns to keep the bar short as
// pages grow. Renders into the existing <nav class="top-nav"></nav>
// placeholder on every page. Re-renders on i18n:change for translated
// labels, and collapses into a hamburger + slide-down list under 760px.
window.NAV = (function () {
  const GROUPS = [
    { type: 'link', href: 'index.html', i18nKey: 'nav.dashboard', fallback: 'Dashboard' },
    {
      type: 'group', i18nKey: 'nav.groupPlayers', fallback: 'Players',
      items: [
        { href: 'players.html', i18nKey: 'nav.players', fallback: 'Player List' },
        { href: 'player-compare.html', i18nKey: 'nav.playerCompare', fallback: 'Player Compare' },
      ],
    },
    {
      type: 'group', i18nKey: 'nav.groupSquads', fallback: 'Squads',
      items: [
        { href: 'best-xi.html', i18nKey: 'nav.compare', fallback: 'Team Compare' },
        { href: 'best15-overall.html', i18nKey: 'nav.best15overall', fallback: 'Best 15 Overall' },
        { href: 'best15-next-round.html', i18nKey: 'nav.nextround', fallback: 'Next Round Forecast' },
        { href: 'best15-research.html', i18nKey: 'nav.research', fallback: 'Best 15 (Research)' },
      ],
    },
    { type: 'link', href: 'groups.html', i18nKey: 'nav.groups', fallback: 'Standings & Fixtures' },
    { type: 'link', href: 'my-squad.html', i18nKey: 'nav.mysquad', fallback: 'Build Squad' },
  ];

  function tt(key, fallback) {
    return window.I18N ? window.I18N.t(key, fallback) : fallback;
  }

  // Some hosts (npx serve's default cleanUrls, potential Vercel rewrites)
  // serve "page.html" at the URL "/page" with no extension. Normalize both
  // sides to a bare page name so active-state matching works either way.
  function normalizePage(p) {
    const last = (p || '').split('/').pop() || 'index';
    return last.replace(/\.html$/i, '').toLowerCase() || 'index';
  }

  function currentPage() {
    return normalizePage(location.pathname);
  }

  function render() {
    const nav = document.querySelector('.top-nav');
    if (!nav) return;
    const cur = currentPage();

    let html = '<button class="nav-burger" id="navBurger" aria-label="Menu" type="button">☰</button><div class="nav-list" id="navList">';
    for (const g of GROUPS) {
      if (g.type === 'link') {
        const active = normalizePage(g.href) === cur ? ' active' : '';
        html += `<a href="${g.href}" class="nav-tab${active}" data-i18n="${g.i18nKey}">${tt(g.i18nKey, g.fallback)}</a>`;
      } else {
        const childActive = g.items.some((it) => normalizePage(it.href) === cur);
        html += `<div class="nav-dropdown">
          <button class="nav-tab nav-dropdown-btn${childActive ? ' active' : ''}" type="button">
            <span data-i18n="${g.i18nKey}">${tt(g.i18nKey, g.fallback)}</span> <span class="nav-caret">▾</span>
          </button>
          <div class="nav-dropdown-menu">
            ${g.items.map((it) => {
              const itActive = normalizePage(it.href) === cur ? ' active' : '';
              return `<a href="${it.href}" class="nav-dropdown-item${itActive}" data-i18n="${it.i18nKey}">${tt(it.i18nKey, it.fallback)}</a>`;
            }).join('')}
          </div>
        </div>`;
      }
    }
    html += '</div>';
    nav.innerHTML = html;
    wireInteractions(nav);
  }

  function wireInteractions(nav) {
    nav.querySelector('#navBurger')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const list = nav.querySelector('#navList');
      if (!list) return;
      const opening = !list.classList.contains('open');
      if (opening) {
        const burgerRect = e.currentTarget.getBoundingClientRect();
        list.style.top = `${Math.round(burgerRect.bottom + 8)}px`;
      }
      list.classList.toggle('open', opening);
    });
    nav.querySelectorAll('.nav-dropdown-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = btn.closest('.nav-dropdown');
        const wasOpen = dd.classList.contains('open');
        nav.querySelectorAll('.nav-dropdown.open').forEach((d) => d.classList.remove('open'));
        if (!wasOpen) dd.classList.add('open');
      });
    });
    document.addEventListener('click', () => {
      nav.querySelectorAll('.nav-dropdown.open').forEach((d) => d.classList.remove('open'));
    });
  }

  document.addEventListener('i18n:change', render);

  function init() {
    render();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { render };
})();
