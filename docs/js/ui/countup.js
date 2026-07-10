// Count-up for stat values: animates from 0 to the target the first time the
// element becomes visible. Skipped under prefers-reduced-motion.

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function countUp(el, value, format) {
  if (value === null || value === undefined) { el.textContent = '—'; return; }
  const done = () => { el.textContent = format(value); };
  if (reduced.matches || !('IntersectionObserver' in window)) { done(); return; }

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now();
    const dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(value * eased);
      if (p < 1) requestAnimationFrame(tick); else done();
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.4 });
  io.observe(el);
}
