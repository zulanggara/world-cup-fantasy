// Shared player headshot renderer. FIFA serves real photos from
// play.fifa.com/media/image/headshots/{fifaId}_headshot.png — confirmed
// public (CORS: *), keyed by the `fifaId` field already present on most
// players in data/players.json (not every player has one, and a handful of
// fifaIds 403 with no photo behind them, so this always degrades to the
// existing colored-initials avatar via onerror rather than a broken image).
window.PlayerPhoto = (function () {
  function avatarColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 62%)`;
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function headshotUrl(fifaId) {
    return `https://play.fifa.com/media/image/headshots/${fifaId}_headshot.png`;
  }

  // Called from the <img>'s onerror — swaps the broken photo for the
  // colored-initials fallback by reading the name/size it stashed on
  // itself as data attributes (avoids ever embedding HTML inside an HTML
  // attribute string).
  function handleError(img) {
    const name = img.dataset.ppName || '?';
    const size = Number(img.dataset.ppSize) || 44;
    const wrap = img.closest('.pp-wrap') || img;
    wrap.outerHTML = fallbackHtml(name, size);
  }

  function fallbackHtml(name, size) {
    const s = size || 44;
    const fontSize = Math.round(s * 0.4);
    return `<span class="avatar-circle pp-fallback" style="width:${s}px;height:${s}px;font-size:${fontSize}px;background:${avatarColor(name)};">${escapeHtml(initials(name))}</span>`;
  }

  // size in px. Returns an <img> (when fifaId is known) that falls back to
  // the initials avatar on load error, or just the initials avatar directly
  // when there's no fifaId to try.
  function html(fifaId, name, size) {
    const s = size || 44;
    const safeName = name || '?';
    if (!fifaId) return fallbackHtml(safeName, s);
    return `<span class="pp-wrap" style="width:${s}px;height:${s}px;display:inline-block;flex-shrink:0;">
      <img class="pp-img" src="${headshotUrl(fifaId)}" alt="" loading="lazy"
        data-pp-name="${escapeAttr(safeName)}" data-pp-size="${s}"
        style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;display:block;background:var(--panel2);"
        onerror="PlayerPhoto.handleError(this)" />
    </span>`;
  }

  return { html, handleError, headshotUrl };
})();
