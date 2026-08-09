(function () {
  const SIZE = 10;
  const RING = 16;

  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  const root = document.documentElement;
  root.classList.add('has-pointer');
  dot.style.setProperty('--cursor-size', SIZE + 'px');
  ring.style.setProperty('--cursor-ring', RING + 'px');

  function restore(why) {
    if (!root.classList.contains('has-pointer')) return;
    root.classList.remove('has-pointer');
    dot.style.display = 'none';
    ring.style.display = 'none';
    console.warn('[pointer] native cursor restored:', why);
  }
  window.addEventListener('error', () => restore('script error'));
  window.addEventListener('unhandledrejection', () => restore('promise rejection'));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') restore('escape pressed');
  });

  window.addEventListener('pointermove', (e) => {
    dot.style.setProperty('--cx', e.clientX + 'px');
    dot.style.setProperty('--cy', e.clientY + 'px');
    ring.style.setProperty('--cx', e.clientX + 'px');
    ring.style.setProperty('--cy', e.clientY + 'px');

    const native = e.target && e.target.closest
      ? e.target.closest('[data-cursor="native"]')
      : null;
    root.classList.toggle('wants-native-cursor', !!native);
  }, { passive: true });
})();
