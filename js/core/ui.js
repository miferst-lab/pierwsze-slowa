export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
export const clear = (el) => { el.replaceChildren(); return el; };
export const shuffle = (arr, rnd = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
export const delay = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? Math.min(ms, 150) : ms));
/** Etykieta głoski do wyświetlenia: "m" -> "Mm", "sz" -> "Sz sz". */
export const soundLabel = (s) => (s.length > 1 ? `${s[0].toUpperCase()}${s.slice(1)} ${s}` : `${s.toUpperCase()}${s}`);
export const STAR = `<svg viewBox='0 0 100 100' aria-hidden='true'><polygon points='50,8 62,38 94,38 68,58 78,90 50,70 22,90 32,58 6,38 38,38'/></svg>`;
