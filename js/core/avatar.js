// Awatar lektorki: mała postać przy zadaniu. Odbija poruszeniem (podskok), gdy gra lektor, zmienia pozę na „cieszy się”
// po pochwale i „myśli” po błędzie/podpowiedzi. Zdarzenia pochodzą z Narrator.onSpeak. Rodzic może go ukryć (state.avatar).
// Dżungla: Artysta dostarczył „mówi” tylko jako małpkę (niespójną), więc mówienie = sowa „cieszy się” z podskokiem.
export const LEKTOR = {
  lesna: { name: 'Lisica z mapą', mowi: 'lesna-mowi', cieszy: 'lesna-cieszy', mysli: 'lesna-mysli' },
  kosmos: { name: 'Robot-lektor', mowi: 'kosmos-mowi', cieszy: 'kosmos-cieszy', mysli: 'kosmos-mysli' },
  dzungla: { name: 'Sowa-lektorka', mowi: 'dzungla-cieszy', cieszy: 'dzungla-cieszy', mysli: 'dzungla-mysli' },
  wyspy: { name: 'Miś polarny', mowi: 'wyspy-mowi', cieszy: 'wyspy-cieszy', mysli: 'wyspy-mysli' },
};
export const lektorSrc = (world, mood) => `art/lektor/${(LEKTOR[world] ?? LEKTOR.lesna)[mood] ?? (LEKTOR[world] ?? LEKTOR.lesna).mowi}.webp`;

export function initAvatar(ctx, narrator) {
  const el = document.createElement('div');
  el.id = 'lektor'; el.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img'); img.alt = ''; img.draggable = false; el.append(img);
  document.body.append(el);
  let timer = 0;
  const set = (mood) => { const w = ctx.world().id; const src = lektorSrc(w, mood); if (!img.src.endsWith(src)) img.src = src; el.dataset.mood = mood; };
  const refresh = () => { document.documentElement.dataset.avatar = ctx.state.avatar === false ? 'off' : 'on'; el.classList.remove('talk'); set('mowi'); };
  narrator.onSpeak((ev) => {
    clearTimeout(timer);
    if (ev.type === 'start') { set(ev.mood); el.classList.toggle('talk', !!ev.talk); }
    else { el.classList.remove('talk'); timer = setTimeout(() => set('mowi'), 1800); }
  });
  refresh();
  return { refresh, el };
}
