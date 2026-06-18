// Shared "last sync" footer, injected at the end of <body> on every page.
(function () {
  function tt(key, fallback) {
    return window.I18N ? window.I18N.t(key, fallback) : fallback;
  }

  function formatWIB(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' WIB';
  }

  function relativeTime(iso) {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return tt('footer.justNow', 'baru saja');
    if (mins < 60) return `${mins} ${tt('common.minutesShort', 'menit')} ${tt('footer.ago', 'lalu')}`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} ${tt('common.hoursShort', 'jam')} ${tt('footer.ago', 'lalu')}`;
    const days = Math.round(hours / 24);
    return `${days} ${tt('common.daysShort', 'hari')} ${tt('footer.ago', 'lalu')}`;
  }

  let lastMeta = null;
  let footerEl = null;

  function injectStyleOnce() {
    if (document.getElementById('app-footer-style')) return;
    const style = document.createElement('style');
    style.id = 'app-footer-style';
    style.textContent = `
      .app-footer {
        max-width: inherit; margin-top: 32px; padding: 16px 0 4px;
        border-top: 1px solid var(--border); color: var(--text-dim); font-size: 12px;
        display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
        font-family: 'JetBrains Mono', monospace;
      }
      .app-footer .sync-dot { width: 7px; height: 7px; border-radius: 50%; background: #6fcf67; display: inline-block; margin-right: 6px; }
      .app-footer .sync-dot.stale { background: var(--accent); }
      .app-footer .sync-dot.very-stale { background: #ef476f; }
    `;
    document.head.appendChild(style);
  }

  function render() {
    injectStyleOnce();
    let html;
    if (lastMeta) {
      const wib = formatWIB(lastMeta.lastSync);
      const rel = relativeTime(lastMeta.lastSync);
      const hoursSince = (Date.now() - new Date(lastMeta.lastSync).getTime()) / 3600000;
      const dotClass = hoursSince > 6 ? 'very-stale' : hoursSince > 2 ? 'stale' : '';
      html = `<span><span class="sync-dot ${dotClass}"></span>${tt('footer.lastSync', 'Data terakhir disinkronkan')}: ${wib} (${rel})</span><span>·</span><span>${lastMeta.playersCount ?? '?'} ${tt('footer.players', 'pemain')}</span>`;
    } else {
      html = `<span>${tt('footer.noSync', 'Waktu sinkronisasi data tidak tersedia — jalankan')} <code>node scraper.js</code> ${tt('footer.toCreate', 'untuk membuat')} <code>data/sync_meta.json</code>.</span>`;
    }

    if (!footerEl) {
      const wrap = document.querySelector('.wrap');
      footerEl = document.createElement('footer');
      footerEl.className = 'app-footer';
      if (wrap) wrap.appendChild(footerEl);
      else document.body.appendChild(footerEl);
    }
    footerEl.innerHTML = html;
  }

  async function init() {
    try {
      const res = await fetch('data/sync_meta.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      lastMeta = await res.json();
    } catch (e) {
      lastMeta = null;
    }
    render();
    document.addEventListener('i18n:change', render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
