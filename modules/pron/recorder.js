// „Nagraj siebie”: nagranie z mikrofonu WYŁĄCZNIE lokalnie. Nic nie jest wysyłane ani zapisywane trwale:
// dźwięk trzymamy tylko w pamięci jako blob: URL i zwalniamy go przy opuszczeniu ekranu (dispose).
// Brak automatycznej oceny wymowy – dziecko lub rodzic oceniają sami.
import { h } from '../../js/core/ui.js';

export const PRIVACY = 'Nagranie zostaje tylko na tym urządzeniu, w pamięci przeglądarki. Nic nie jest wysyłane ani zapisywane – znika po wyjściu z tego ekranu.';
export const supportsRecording = () => !!(globalThis.navigator?.mediaDevices?.getUserMedia && globalThis.MediaRecorder);
const MAX_MS = 8000;

/** onModel: odtwarza wzór lektora (Azure) obok nagrania. Zwraca { el, dispose }. */
export function createRecorder({ onModel, narrator }) {
  let stream = null, rec = null, url = null, timer = 0, audio = null, disposed = false;
  const status = h('p', { class: 'rec-status', role: 'status', 'aria-live': 'polite' }, '');
  const btnRec = h('button', { class: 'btn small', type: 'button', id: 'rec-btn', 'data-rec': 'start' }, '● Nagraj siebie');
  const btnMine = h('button', { class: 'btn small', type: 'button', id: 'rec-play', hidden: true }, '▶ Twoje nagranie');
  const btnModel = h('button', { class: 'btn small', type: 'button', id: 'rec-model' }, '▶ Wzór lektora');
  const note = h('p', { class: 'rec-privacy' }, PRIVACY);
  const el = h('div', { class: 'recorder', 'data-state': 'idle' }, h('div', { class: 'rec-row' }, btnModel, btnRec, btnMine), status, note);
  const set = (s, msg = '') => { el.dataset.state = s; status.textContent = msg; };
  const release = () => { clearTimeout(timer); try { if (rec && rec.state !== 'inactive') rec.stop(); } catch { /* ignore */ } stream?.getTracks().forEach((t) => t.stop()); stream = null; rec = null; };
  const forget = () => { if (url) { URL.revokeObjectURL(url); url = null; } if (audio) { try { audio.pause(); } catch { /* ignore */ } audio = null; } btnMine.hidden = true; };

  btnModel.addEventListener('click', () => onModel?.());
  btnMine.addEventListener('click', () => { if (!url) return; narrator?.cancel(); audio?.pause(); audio = new Audio(url); audio.play().catch(() => set('error', 'Nie udało się odtworzyć nagrania.')); });
  const stop = () => { try { if (rec && rec.state !== 'inactive') rec.stop(); } catch { /* ignore */ } };
  btnRec.addEventListener('click', async () => {
    if (el.dataset.state === 'recording') { stop(); return; }
    if (!supportsRecording()) { set('unsupported', 'Ta przeglądarka nie potrafi nagrywać dźwięku. Ćwicz bez nagrywania – to też działa!'); return; }
    forget(); narrator?.cancel();
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { set('denied', e?.name === 'NotFoundError' ? 'Nie znaleziono mikrofonu. Ćwicz bez nagrywania – to też działa!' : 'Brak zgody na mikrofon. To w porządku – możesz ćwiczyć bez nagrywania.'); return; }
    if (disposed) { release(); return; }
    const chunks = [];
    try { rec = new MediaRecorder(stream); } catch { release(); set('unsupported', 'Nagrywanie nie jest dostępne. Ćwicz bez nagrywania.'); return; }
    rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    rec.onstop = () => {
      const type = rec?.mimeType || 'audio/webm'; release();
      if (!el.isConnected) disposed = true; // ekran już opuszczony: nic nie zostaje w pamięci
      if (disposed || !chunks.length) { if (!disposed) set('idle', 'Nic nie nagrało się. Spróbuj jeszcze raz.'); btnRec.textContent = '● Nagraj siebie'; return; }
      url = URL.createObjectURL(new Blob(chunks, { type }));
      btnMine.hidden = false; btnRec.textContent = '● Nagraj jeszcze raz'; btnRec.dataset.rec = 'start';
      set('recorded', 'Posłuchaj siebie i porównaj ze wzorem. Sam(a) oceń, jak ci poszło.');
    };
    rec.start(); btnRec.textContent = '■ Stop'; btnRec.dataset.rec = 'stop'; set('recording', 'Nagrywam… powiedz głośno i wyraźnie.');
    timer = setTimeout(stop, MAX_MS);
  });
  return { el, dispose() { disposed = true; release(); forget(); } };
}
