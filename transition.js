(function () {
  const MS = 420;

  const veil = document.createElement('div');
  veil.className = 'veil';
  const attach = () => document.body.appendChild(veil);
  if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);

  const root = document.documentElement;
  root.classList.add('is-entering');
  const clear = () => root.classList.remove('is-entering');

  if (document.readyState !== 'loading') requestAnimationFrame(clear);
  else document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(clear));
  setTimeout(clear, 1200);

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { root.classList.remove('is-leaving'); clear(); }
  });

  function crossesDocument(a) {
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (!/\.html?$/.test(url.pathname) && url.pathname !== '/' &&
        !url.pathname.endsWith('/')) return false;
    return url.pathname !== location.pathname || url.search !== location.search;
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey ||
        e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || !crossesDocument(a)) return;

    e.preventDefault();
    const go = () => { location.href = a.href; };
    root.classList.add('is-leaving');
    veil.addEventListener('transitionend', go, { once: true });
    setTimeout(go, MS + 120);
  });
})();
