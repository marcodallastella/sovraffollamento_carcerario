// Dark mode: follows prefers-color-scheme, manual override in localStorage.
// The boot script in <head> applies the stored theme before first paint;
// this module only wires the toggle.

export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const apply = (dark) => {
    document.documentElement.toggleAttribute('data-theme', false);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    btn.setAttribute('aria-label', dark ? 'Attiva il tema chiaro' : 'Attiva il tema scuro');
  };

  apply(document.documentElement.getAttribute('data-theme') === 'dark');

  btn.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    apply(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* private mode */ }
  });

  // Follow OS changes unless the user chose explicitly.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try { if (localStorage.getItem('theme')) return; } catch { /* ignore */ }
    apply(e.matches);
  });
}
