// Lektor. Dwie warstwy:
//  1) NAGRANIA (domyślnie): audio/<id>.mp3 wygenerowane offline neuronowym głosem (tools/generate-audio.py), wskazane w audio/manifest.json,
//  2) GŁOS SYSTEMOWY (zapasowy): speechSynthesis z najlepszym dostępnym polskim głosem żeńskim.
// Gra nie wysyła żadnych własnych żądań poza własną domenę. Głosy „Online/Natural” w Edge to sprawa samej przeglądarki.
import { resolveSay, audioId } from './say.js';
import { collectSpoken, isPhoneticKind } from './spoken.js';

const PL = /^pl([-_]|$)/i;
/** Znane imiona męskich polskich głosów systemowych – spychamy je za głosy żeńskie (dziecko ma słyszeć kobietę). */
const MALE = /\b(adam|marek|jacek|krzysztof|jan|maciej|piotr|tomasz|paweł|pawel|michał|michal|zbigniew)\b/i;
const FEMALE = /\b(zofia|paulina|ewa|agnieszka|maja|zosia|julia|gosia|hanna|ania|monika)\b/i;

/**
 * Ocena głosu (większa = lepsza). Kolejność:
 *   wybór rodzica  >  pl-PL „Natural”/„Online” (np. Microsoft Zofia Online (Natural))  >  Paulina/Zofia lokalna  >  dowolny pl-PL.
 * Głosy męskie dostają duży minus (ale nadal są lepsze niż brak głosu).
 */
export function scoreVoice(v, preferredURI = null) {
  const name = v.name ?? '';
  let s = 0;
  if (preferredURI && v.voiceURI === preferredURI) s += 100000;
  if (/natural|online/i.test(name)) s += 10000;
  if (/zofia|paulina/i.test(name)) s += 1000;
  else if (FEMALE.test(name)) s += 500;
  if (/microsoft/i.test(name)) s += 50;
  if (v.localService) s += 20;
  if (v.default) s += 1;
  if (MALE.test(name) && !FEMALE.test(name)) s -= 5000;
  return s;
}
/** Polskie głosy posortowane od najlepszego (czysta funkcja – testowana). */
export function rankVoices(voices, preferredURI = null) {
  const pl = (voices ?? []).filter((v) => PL.test(v.lang ?? ''));
  return pl.map((v, i) => [v, scoreVoice(v, preferredURI), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map((x) => x[0]);
}
export const pickVoice = (voices, preferredURI = null) => rankVoices(voices, preferredURI)[0] ?? null;

/** Style wypowiedzi dla głosu systemowego. Głoski/sylaby: wolniej i głośniej; zdania: spokojniej; pochwały: pogodniej. */
export const LIVE_STYLE = {
  phonetic: { rate: 0.65, volume: 1.0, pitch: 1.12 },
  sentence: { rate: 0.85, volume: 0.9, pitch: 1.12 },
  praise: { rate: 0.9, volume: 1.0, pitch: 1.15 },
};
export const styleName = (kind) => (isPhoneticKind(kind) ? 'phonetic' : ['praise', 'finish'].includes(kind) ? 'praise' : 'sentence');
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
/** Parametry utterance: tempo = bazowe × suwak (speed), głośność = bazowa × suwak (volume), pitch bez zmian. */
export function liveParams(kind, speed = 1, volume = 1) {
  const b = LIVE_STYLE[styleName(kind)];
  return { rate: clamp(b.rate * speed, 0.1, 2), volume: clamp(b.volume * volume, 0, 1), pitch: b.pitch };
}

export class Narrator {
  constructor() {
    this.synth = globalThis.speechSynthesis ?? null;
    this.status = this.synth ? 'loading' : 'unsupported'; // loading | ready | none | unsupported   (głos systemowy)
    this.enabled = true; this.mode = 'recorded'; this.speed = 1; this.volume = 1; this.preferredURI = null;
    this.voice = null; this.plVoices = []; this.manifest = new Set(); this.kinds = new Map();
    this.token = 0; this.current = null; this.listeners = new Set(); this.blobs = new Map(); this.log = null;
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { this.listeners.forEach((f) => f(this.status)); }
  get hasClips() { return this.manifest.size > 0; }
  /** Czy da się cokolwiek usłyszeć (nagrania lub głos systemowy)? */
  get audible() { return this.enabled && (this.status === 'ready' || this.hasClips); }

  async init() {
    await this.loadManifest();
    if (!this.synth) { this.emit(); return; }
    this.refresh();
    this.synth.addEventListener?.('voiceschanged', () => this.refresh());
    for (let i = 0; i < 12 && this.status === 'loading'; i++) { await new Promise((r) => setTimeout(r, 250)); this.refresh(); }
    if (this.status === 'loading') { this.status = 'none'; this.emit(); }
  }
  refresh() {
    if (!this.synth) return;
    const all = this.synth.getVoices();
    this.plVoices = rankVoices(all, this.preferredURI);
    this.voice = this.plVoices[0] ?? null;
    const next = this.voice ? 'ready' : (this.status === 'loading' ? 'loading' : 'none');
    if (next !== this.status) { this.status = next; this.emit(); }
  }
  setPreferred(uri) { this.preferredURI = uri; if (this.synth) this.refresh(); }

  async loadManifest() {
    try {
      const res = await fetch(new URL('audio/manifest.json', document.baseURI), { cache: 'no-cache' });
      if (!res.ok) return;
      const j = await res.json();
      const clips = j?.clips ?? j;
      const ids = Array.isArray(clips) ? clips : Object.keys(clips ?? {});
      this.manifest = new Set(ids.filter((x) => /^[st]-[a-z0-9_]+$/.test(x)));
    } catch { /* brak nagrań – normalne, działa głos systemowy */ }
  }
  /** Rodzaj wypowiedzi (sound/syllable/word/sentence/praise...) – z programu gry; nieznane traktujemy jak zdanie. */
  kindOf(part) {
    if (!this.kinds.size) { try { for (const [id, s] of collectSpoken()) this.kinds.set(id, s.kind); } catch { /* ignore */ } }
    return this.kinds.get(audioId(part)) ?? (part.startsWith('#') ? 'sound' : 'sentence');
  }

  cancel() {
    this.token++;
    try { this.synth?.cancel(); } catch { /* ignore */ }
    if (this.current?.pause) { try { this.current.pause(); } catch { /* ignore */ } }
    this.current = null;
  }

  /** Czyta kolejno części (np. ['Posłuchaj.', '#m']). opts.mode: wymusza 'recorded' | 'system' (np. „Test głosek”). */
  async speak(parts, opts = {}) {
    const t = ++this.token;
    try { this.synth?.cancel(); } catch { /* ignore */ }
    if (!this.enabled && !opts.force) return;
    const list = Array.isArray(parts) ? parts : [parts];
    this.log?.push(list);
    // element listy może być tablicą = „ciasna grupa” (np. ['dwadzieścia', 'trzy', 'jabłka']): krótsze przerwy, jak w mowie ciągłej
    const seq = [];
    list.forEach((p) => (Array.isArray(p) ? p.forEach((q, i) => seq.push({ part: q, tight: i > 0 })) : seq.push({ part: p, tight: false })));
    const mode0 = opts.mode ?? this.mode;
    if (mode0 === 'recorded') for (const { part } of seq) { const id = audioId(part); if (this.manifest.has(id)) this.clipUrl(id).catch(() => {}); } // pobierz z góry, równolegle
    for (let i = 0; i < seq.length; i++) {
      if (t !== this.token) return;
      await this.one(seq[i].part, t, opts.mode ?? this.mode);
      if (t !== this.token) return;
      if (i < seq.length - 1) await new Promise((r) => setTimeout(r, seq[i + 1].tight ? 40 : 130));
    }
  }
  one(part, t, mode) {
    const id = audioId(part);
    const wantClip = this.manifest.has(id) && (mode === 'recorded' || this.status !== 'ready');
    if (wantClip) return this.clip(id, part, t);
    return this.tts(part, t);
  }

  async clipUrl(id) {
    if (this.blobs.has(id)) return this.blobs.get(id);
    // Pobieramy cały plik zwykłym fetch (bez nagłówka Range) i odtwarzamy z blob: – service worker może go wtedy
    // bezpiecznie zapisać w cache (odpowiedzi 206 się nie cache'ują) i działa to tak samo pod podścieżką /pierwsze-slowa/.
    const res = await fetch(new URL(`audio/${id}.mp3`, document.baseURI));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    // jawny typ audio/mpeg: GitHub Pages podaje „audio/mp3”, a blob z poprawnym typem odtwarza każda przeglądarka
    const url = URL.createObjectURL(new Blob([await res.arrayBuffer()], { type: 'audio/mpeg' }));
    this.blobs.set(id, url);
    return url;
  }
  clip(id, part, t) {
    return new Promise((resolve) => {
      let done = false, a = null;
      const fin = () => { if (!done) { done = true; clearTimeout(timer); resolve(); } };
      const fallback = () => { if (done) return; done = true; clearTimeout(timer); this.tts(part, t).then(resolve); };
      const timer = setTimeout(fin, 15000);
      this.clipUrl(id).then((url) => {
        if (t !== this.token) return fin();
        a = new Audio(url);
        this.current = a;
        a.volume = clamp(this.volume, 0, 1);
        a.playbackRate = clamp(this.speed, 0.5, 1.5);
        a.preservesPitch = true;
        a.onended = fin;
        a.onerror = fallback;
        a.play().catch(fallback);
      }).catch(fallback);
    });
  }
  tts(part, t) {
    return new Promise((resolve) => {
      if (this.status !== 'ready' || !this.synth || t !== this.token) return resolve();
      const text = resolveSay(part);
      const p = liveParams(this.kindOf(part), this.speed, this.volume);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice.lang; try { u.voice = this.voice; } catch { /* nieprawidłowy obiekt głosu – zostaje sam język */ }
      u.rate = p.rate; u.pitch = p.pitch; u.volume = p.volume;
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(timer); resolve(); } };
      const timer = setTimeout(fin, 2500 + (text.length * 220) / p.rate);
      u.onend = fin; u.onerror = fin;
      this.current = u; // trzymamy referencję (Chrome potrafi "zgubić" zdarzenia po GC)
      try { this.synth.speak(u); } catch { fin(); }
    });
  }
}
