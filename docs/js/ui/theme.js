// The charcoal editorial theme is the default. The light alternative and a
// visitor's explicit choice are retained in localStorage.

export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const apply = (dark) => {
    document.documentElement.toggleAttribute('data-theme', false);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    btn.setAttribute('aria-label', dark ? 'Attiva il tema chiaro' : 'Attiva il tema scuro');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101419' : '#ffffff');
  };

  apply(document.documentElement.getAttribute('data-theme') === 'dark');

  btn.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    apply(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* private mode */ }
  });
}
