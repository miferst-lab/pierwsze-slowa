// „Nagraj siebie” i „Lusterko”: kamera + mikrofon WYŁĄCZNIE lokalnie, bez wysyłania i bez zapisu.
// - Lusterko: podgląd z kamery (odbity jak w lustrze), bez nagrywania.
// - Nagraj siebie: obraz + dźwięk do 8 s (bez kamery: sam dźwięk), potem jednorazowe odtworzenie obok wzoru lektora
//   i AUTOMATYCZNE usunięcie: zwalniamy blob: URL po obejrzeniu, najpóźniej po 60 s albo przy wyjściu z kroku.
// - Wszystkie ścieżki kamery/mikrofonu są zatrzymywane, gdy nie są potrzebne. Brak automatycznej oceny wymowy.
import { h } from '../../js/core/ui.js';

export const PRIVACY = 'Kamera i mikrofon działają tylko na tym urządzeniu. Nic nie jest wysyłane ani zapisywane.';
export const AUTO_DELETE = 'Nagranie zniknie samo po obejrzeniu (najpóźniej po minucie albo po wyjściu z ekranu).';
export const MAX_MS = 8000, DELETE_AFTER_MS = 60000;
export const supportsRecording = () => !!(globalThis.navigator?.mediaDevices?.getUserMedia && globalThis.MediaRecorder);

/** onModel: odtwarza wzór lektora. Zwraca { el, dispose }. */
export function createRecorder({ onModel, narrator }) {
  let stream = null, rec = null, url = null, recTimer = 0, delTimer = 0, disposed = false, mode = 'idle';
  const status = h('p', { class: 'rec-status', role: 'status', 'aria-live': 'polite' }, '');
  const btnModel = h('button', { class: 'btn small', type: 'button', id: 'rec-model' }, '▶ Wzór lektora');
  const btnRec = h('button', { class: 'btn small', type: 'button', id: 'rec-btn' }, '● Nagraj siebie');
  const btnMirror = h('button', { class: 'btn small', type: 'button', id: 'mirror-btn', 'aria-pressed': 'false' }, 'Lusterko');
  const live = h('video', { class: 'rec-live', muted: true, playsinline: true, autoplay: true, 'aria-label': 'Podgląd z kamery jak w lusterku' });
  live.muted = true;
  const play = h('video', { class: 'rec-play', playsinline: true, 'aria-label': 'Twoje nagranie' });
  play.addEventListener('click', () => { if (url) play.play().catch(() => {}); });
  const playA = h('audio', { class: 'rec-play-audio' });
  const caption = h('p', { class: 'rec-cap' }, '');
  const media = h('div', { class: 'rec-media', hidden: true }, live, play, caption);
  const el = h('div', { class: 'recorder', 'data-state': 'idle' }, h('div', { class: 'rec-row' }, btnModel, btnRec, btnMirror), status,
    h('p', { class: 'rec-privacy' }, PRIVACY + ' ' + AUTO_DELETE), media);
  const set = (s, msg = '') => { mode = s; el.dataset.state = s; status.textContent = msg; };
  const showMedia = (what) => { media.hidden = !what; media.dataset.show = what || ''; live.hidden = what !== 'live'; play.hidden = what !== 'play'; caption.textContent = what === 'live' ? (mode === 'recording' ? 'Nagrywam…' : 'Lusterko') : what === 'play' ? 'Twoje nagranie' : ''; };
  const stopTracks = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; live.srcObject = null; };
  const forget = () => {
    clearTimeout(delTimer);
    for (const m of [play, playA]) { try { m.pause(); } catch { /* ignore */ } m.removeAttribute('src'); try { m.load(); } catch { /* ignore */ } }
    if (url) { URL.revokeObjectURL(url); url = null; }
  };
  const release = () => { clearTimeout(recTimer); try { if (rec && rec.state !== 'inactive') rec.stop(); } catch { /* ignore */ } rec = null; stopTracks(); };
  const mirrorOff = () => { btnMirror.setAttribute('aria-pressed', 'false'); btnMirror.textContent = 'Lusterko'; };

  async function getStream(withVideo) {
    const md = navigator.mediaDevices;
    if (withVideo) {
      try { return { s: await md.getUserMedia({ video: { facingMode: 'user', width: { ideal: 480 } }, audio: true }), video: true }; }
      catch (e) { if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') throw e; } // brak kamery -> sam dźwięk
    }
    return { s: await md.getUserMedia({ audio: true }), video: false };
  }
  const deniedMsg = (e) => (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError'
    ? 'Nie znaleziono mikrofonu ani kamerki. Ćwicz bez nagrywania – to też działa!'
    : 'Brak zgody na kamerę i mikrofon. To w porządku – możesz ćwiczyć bez nagrywania.');

  btnModel.addEventListener('click', () => onModel?.());

  btnMirror.addEventListener('click', async () => {
    if (mode === 'mirror') { stopTracks(); showMedia(null); mirrorOff(); set('idle', ''); return; }
    if (mode === 'recording') return;
    if (!navigator.mediaDevices?.getUserMedia) { set('unsupported', 'Ta przeglądarka nie pokazuje obrazu z kamery.'); return; }
    forget(); release();
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 480 } }, audio: false }); }
    catch (e) { set('denied', e?.name === 'NotAllowedError' ? 'Brak zgody na kamerkę. Możesz ćwiczyć bez lusterka.' : 'Nie znaleziono kamerki. Możesz ćwiczyć bez lusterka.'); return; }
    if (disposed || !el.isConnected) { stopTracks(); return; }
    live.srcObject = stream; live.play?.().catch(() => {});
    set('mirror', 'Popatrz, jak układasz buzię i język.'); showMedia('live');
    btnMirror.setAttribute('aria-pressed', 'true'); btnMirror.textContent = 'Zamknij lusterko';
  });

  const stopRec = () => { try { if (rec && rec.state !== 'inactive') rec.stop(); } catch { /* ignore */ } };
  btnRec.addEventListener('click', async () => {
    if (mode === 'recording') { stopRec(); return; }
    if (!supportsRecording()) { set('unsupported', 'Ta przeglądarka nie potrafi nagrywać. Ćwicz bez nagrywania – to też działa!'); return; }
    forget(); release(); mirrorOff(); showMedia(null); narrator?.cancel();
    let got;
    try { got = await getStream(true); } catch (e) { set('denied', deniedMsg(e)); return; }
    stream = got.s;
    if (disposed || !el.isConnected) { stopTracks(); return; }
    const chunks = [];
    try { rec = new MediaRecorder(stream); } catch { release(); set('unsupported', 'Nagrywanie nie jest dostępne. Ćwicz bez nagrywania.'); return; }
    const withVideo = got.video;
    rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    rec.onstop = () => {
      const type = rec?.mimeType || (withVideo ? 'video/webm' : 'audio/webm');
      release();
      if (!el.isConnected) disposed = true; // ekran opuszczony: nic nie zostaje w pamięci
      btnRec.textContent = '● Nagraj jeszcze raz';
      if (disposed) return;
      if (!chunks.length) { showMedia(null); set('idle', 'Nic się nie nagrało. Spróbuj jeszcze raz.'); return; }
      url = URL.createObjectURL(new Blob(chunks, { type }));
      const m = withVideo ? play : playA;
      const done = () => { forget(); showMedia(null); if (!disposed) set('deleted', 'Nagranie usunięte. Możesz nagrać jeszcze raz.'); };
      m.onended = done; m.onerror = done;
      m.src = url;
      if (withVideo) showMedia('play'); else showMedia(null);
      set('playing', withVideo ? 'Popatrz i posłuchaj siebie. Porównaj ze wzorem lektora.' : 'Posłuchaj siebie (bez kamerki). Porównaj ze wzorem lektora.');
      m.play().catch(() => set('ready', 'Dotknij nagrania, żeby je odtworzyć.'));
      delTimer = setTimeout(done, DELETE_AFTER_MS);
    };
    if (withVideo) { live.srcObject = stream; live.play?.().catch(() => {}); showMedia('live'); }
    rec.start(); btnRec.textContent = '■ Stop';
    set('recording', withVideo ? 'Nagrywam obraz i dźwięk… powiedz wyraźnie.' : 'Nie ma kamerki – nagrywam sam dźwięk… powiedz wyraźnie.');
    if (withVideo) caption.textContent = 'Nagrywam…';
    recTimer = setTimeout(stopRec, MAX_MS);
  });

  return { el, dispose() { disposed = true; release(); forget(); showMedia(null); } };
}
