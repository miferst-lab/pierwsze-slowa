// „Nagraj siebie” i „Lusterko”: kamera + mikrofon WYŁĄCZNIE lokalnie, bez wysyłania i bez zapisu.
// - Lusterko: podgląd z kamery (odbity jak w lustrze), bez nagrywania.
// - Nagraj siebie: obraz + dźwięk do 8 s (bez kamery: sam dźwięk), potem jednorazowe odtworzenie obok wzoru lektora
//   i AUTOMATYCZNE usunięcie: zwalniamy blob: URL po obejrzeniu, najpóźniej po 60 s albo przy wyjściu z kroku.
// - Wszystkie ścieżki kamery/mikrofonu są zatrzymywane, gdy nie są potrzebne. Brak automatycznej oceny wymowy.
import { h } from '../../js/core/ui.js';

export const PRIVACY = 'Kamera i mikrofon działają tylko na tym urządzeniu. Nic nie jest wysyłane ani zapisywane.';
export const AUTO_DELETE = 'Nagranie zniknie samo po obejrzeniu (najpóźniej po minucie albo po wyjściu z ekranu).';
export const MAX_MS = 8000, DELETE_AFTER_MS = 60000;
export const MIME_CANDIDATES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
export const AUDIO_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
/** Pierwszy typ wspierany przez MediaRecorder.isTypeSupported; '' = bez mimeType (przeglądarka wybierze sama). */
export function pickMimeType(MR, withVideo = true) {
  if (!MR || typeof MR.isTypeSupported !== 'function') return '';
  for (const t of withVideo ? MIME_CANDIDATES : AUDIO_MIME_CANDIDATES) { try { if (MR.isTypeSupported(t)) return t; } catch { /* ignore */ } }
  return '';
}
/** Tworzy MediaRecorder: z wybranym typem, a gdy konstruktor go odrzuci – bez opcji. */
export function makeRecorder(MR, stream, withVideo) {
  const mimeType = pickMimeType(MR, withVideo);
  if (mimeType) { try { return new MR(stream, { mimeType }); } catch (e) { console.warn('[nagraj] MediaRecorder z', mimeType, 'odrzucony:', e?.name, e?.message); } }
  return new MR(stream);
}
const LOOSE_VIDEO = { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } };
/** Kolejne próby getUserMedia (luźne ograniczenia -> video:true -> sam dźwięk -> sam obraz). */
export const STREAM_ATTEMPTS = [
  { c: { video: LOOSE_VIDEO, audio: true }, video: true, audio: true },
  { c: { video: true, audio: true }, video: true, audio: true },
  { c: { audio: true }, video: false, audio: true },
  { c: { video: true }, video: true, audio: false },
];
/** Zwraca { s, video, audio, errors } albo rzuca ostatni (najważniejszy) błąd z polem .attempts. Zgoda odrzucona = stop od razu. */
export async function acquireStream(md, attempts = STREAM_ATTEMPTS) {
  const errors = [];
  for (const a of attempts) {
    try {
      const s = await md.getUserMedia(a.c);
      const video = a.video && s.getVideoTracks?.().length > 0, audio = a.audio && s.getAudioTracks?.().length > 0;
      return { s, video: video ?? a.video, audio: audio ?? a.audio, errors };
    } catch (e) {
      errors.push(e); console.warn('[nagraj] getUserMedia', JSON.stringify(a.c), '->', e?.name, e?.message);
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') break;
    }
  }
  // najbardziej pouczający błąd: odmowa > zajęte urządzenie > reszta > brak urządzenia
  const rank = (e) => ({ NotAllowedError: 5, SecurityError: 5, NotReadableError: 4, AbortError: 3, OverconstrainedError: 1, NotFoundError: 0 }[e?.name] ?? 2);
  const err = errors.slice().sort((x, y) => rank(y) - rank(x))[0] || new Error('getUserMedia');
  err.attempts = errors.map((e) => e?.name); throw err;
}
/** Przyjazny komunikat (po polsku) dla błędu; what = 'rec' | 'mirror'. */
export function describeError(e, what = 'rec') {
  const n = e?.name || 'Error';
  const dev = what === 'mirror' ? 'kamerki' : 'kamerki i mikrofonu';
  const tail = what === 'mirror' ? ' Możesz ćwiczyć bez lusterka.' : ' Możesz ćwiczyć bez nagrywania – to też działa!';
  const msg = {
    NotAllowedError: `Przeglądarka nie pozwoliła użyć ${dev}. Kliknij ikonę kłódki/kamery przy adresie strony, wybierz „Zezwalaj” i spróbuj ponownie. W Windows sprawdź też: Ustawienia → Prywatność → Kamera/Mikrofon.`,
    SecurityError: `Ta strona nie może użyć ${dev} (ustawienia bezpieczeństwa przeglądarki).`,
    NotReadableError: 'Kamerka albo mikrofon są zajęte przez inny program (np. Teams, Zoom, aplikacja Aparat). Zamknij go i spróbuj jeszcze raz.',
    AbortError: 'Kamerka albo mikrofon nie dały się uruchomić (może są zajęte przez inny program). Spróbuj jeszcze raz.',
    NotFoundError: what === 'mirror' ? 'Nie znaleziono kamerki.' : 'Nie znaleziono kamerki ani mikrofonu. Sprawdź, czy są podłączone.',
    OverconstrainedError: 'Kamerka nie obsługuje wymaganych ustawień obrazu.',
    NotSupportedError: 'Ta przeglądarka nie potrafi tu nagrywać.',
    PlayError: 'Nagranie gotowe – dotknij go, żeby odtworzyć.',
  }[n] || (what === 'mirror' ? 'Nie udało się włączyć lusterka.' : 'Nie udało się uruchomić nagrywania.');
  return { text: msg + (n === 'PlayError' ? '' : tail), code: n };
}
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
  const play = h('video', { class: 'rec-play', playsinline: true, preload: 'auto', 'aria-label': 'Twoje nagranie' });
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

  // komunikat + nazwa błędu małym drukiem (diagnostyka) + log w konsoli
  const fail = (state, e, what = 'rec') => {
    const d = describeError(e, what);
    console.warn('[nagraj]', what, d.code, e?.message || '', e?.attempts ? 'próby: ' + e.attempts.join(', ') : '', e);
    set(state, d.text); status.append(' ', h('small', { class: 'rec-err' }, `(${[...new Set([d.code, ...(e?.attempts || [])])].join(', ')})`));
  };
  btnModel.addEventListener('click', () => onModel?.());

  btnMirror.addEventListener('click', async () => {
    if (mode === 'mirror') { stopTracks(); showMedia(null); mirrorOff(); set('idle', ''); return; }
    if (mode === 'recording') return;
    if (!navigator.mediaDevices?.getUserMedia) { set('unsupported', 'Ta przeglądarka nie pokazuje obrazu z kamery.'); return; }
    forget(); release();
    try { stream = (await acquireStream(navigator.mediaDevices, [{ c: { video: LOOSE_VIDEO, audio: false }, video: true }, { c: { video: true }, video: true }])).s; }
    catch (e) { fail('denied', e, 'mirror'); return; }
    if (disposed || !el.isConnected) { stopTracks(); return; }
    live.srcObject = stream; Promise.resolve(live.play?.()).catch((e) => console.warn('[lusterko] play():', e?.name));
    set('mirror', 'Popatrz, jak układasz buzię i język.'); showMedia('live');
    btnMirror.setAttribute('aria-pressed', 'true'); btnMirror.textContent = 'Zamknij lusterko';
  });

  const stopRec = () => { try { if (rec && rec.state !== 'inactive') rec.stop(); } catch { /* ignore */ } };
  btnRec.addEventListener('click', async () => {
    if (mode === 'recording') { stopRec(); return; }
    if (!supportsRecording()) { set('unsupported', 'Ta przeglądarka nie potrafi nagrywać. Ćwicz bez nagrywania – to też działa!'); return; }
    forget(); narrator?.cancel();
    // (e) Lusterko już trzyma kamerkę: używamy tego samego strumienia (+ dokładamy mikrofon), zamiast otwierać drugi
    let got = null;
    const reuse = mode === 'mirror' && stream && stream.getVideoTracks().some((t) => t.readyState === 'live') ? stream : null;
    if (reuse) {
      stream = null; live.srcObject = null;
      let audio = null;
      try { audio = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { console.warn('[nagraj] mikrofon przy lusterku:', e?.name, e?.message); }
      const tracks = [...reuse.getVideoTracks(), ...(audio ? audio.getAudioTracks() : [])];
      got = { s: typeof MediaStream === 'function' ? new MediaStream(tracks) : reuse, video: true, audio: !!audio };
      if (got.s !== reuse) reuse.getAudioTracks().forEach((t) => t.stop());
    } else {
      release();
      try { got = await acquireStream(navigator.mediaDevices); } catch (e) { mirrorOff(); showMedia(null); fail('denied', e); return; }
    }
    mirrorOff(); showMedia(null);
    stream = got.s;
    if (disposed || !el.isConnected) { stopTracks(); return; }
    const withVideo = got.video;
    const chunks = [];
    // (a) typ nagrania tylko spośród wspieranych; (f) każdy etap ma własną obsługę błędu
    try { rec = makeRecorder(MediaRecorder, stream, withVideo); } catch (e) { release(); fail('unsupported', e); return; }
    rec.ondataavailable = (e) => { try { if (e.data?.size) chunks.push(e.data); } catch (err) { console.warn('[nagraj] dataavailable', err); } };
    rec.onerror = (ev) => { const e = ev?.error || ev; console.error('[nagraj] MediaRecorder error', e?.name, e); };
    rec.onstop = () => {
      try {
        const type = (rec?.mimeType || (withVideo ? 'video/webm' : 'audio/webm')).split(';')[0];
        release();
        if (!el.isConnected) disposed = true; // ekran opuszczony: nic nie zostaje w pamięci
        btnRec.textContent = '● Nagraj jeszcze raz';
        if (disposed) return;
        if (!chunks.length) { showMedia(null); set('idle', 'Nic się nie nagrało. Spróbuj jeszcze raz.'); return; }
        url = URL.createObjectURL(new Blob(chunks, { type }));
        const m = withVideo ? play : playA;
        const done = () => { forget(); showMedia(null); if (!disposed) set('deleted', 'Nagranie usunięte. Możesz nagrać jeszcze raz.'); };
        m.onended = done; m.onerror = () => { console.error('[nagraj] odtwarzanie:', m.error?.code, m.error?.message); done(); };
        m.src = url;
        if (withVideo) showMedia('play'); else showMedia(null);
        set('playing', withVideo ? 'Popatrz i posłuchaj siebie. Porównaj ze wzorem lektora.' : 'Posłuchaj siebie (bez kamerki). Porównaj ze wzorem lektora.');
        // autoodtwarzanie może być zablokowane – to NIE jest błąd nagrywania
        Promise.resolve(m.play?.()).catch((e) => { console.warn('[nagraj] play() odrzucone:', e?.name); set('ready', 'Nagranie gotowe – dotknij go, żeby je odtworzyć.'); });
        delTimer = setTimeout(done, DELETE_AFTER_MS);
      } catch (e) { console.error('[nagraj] onstop', e); fail('idle', e); }
    };
    if (withVideo) { live.srcObject = stream; live.muted = true; live.playsInline = true; Promise.resolve(live.play?.()).catch((e) => console.warn('[nagraj] podgląd play():', e?.name)); showMedia('live'); }
    try { rec.start(1000); } catch (e) { release(); showMedia(null); fail('unsupported', e); return; }
    btnRec.textContent = '■ Stop';
    set('recording', withVideo ? (got.audio ? 'Nagrywam obraz i dźwięk… powiedz wyraźnie.' : 'Nie ma mikrofonu – nagrywam sam obraz.') : 'Nie ma kamerki – nagrywam sam dźwięk… powiedz wyraźnie.');
    if (withVideo) caption.textContent = 'Nagrywam…';
    recTimer = setTimeout(stopRec, MAX_MS);
  });

  return { el, dispose() { disposed = true; release(); forget(); showMedia(null); } };
}
