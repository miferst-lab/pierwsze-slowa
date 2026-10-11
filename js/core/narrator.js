// Lektor: Web Speech API (speechSynthesis) z polskim głosem + zaczep na nagrania (audio/manifest.json).
import { resolveSay, audioId } from './say.js';

/** Wybór głosu (czysta funkcja – testowana): preferuje głosy LOKALNE (działają offline i nie łączą się z siecią). */
export function pickVoice(voices, preferredURI = null) {
  const pl = (voices ?? []).filter((v) => /^pl([-_]|$)/i.test(v.lang ?? ''));
  if (!pl.length) return null;
  const score = (v) => (v.voiceURI === preferredURI ? 1000 : 0) + (v.localService ? 100 : 0) + (/zofia|paulina|microsoft/i.test(v.name) ? 10 : 0) + (/online|natural/i.test(v.name) && !v.localService ? -20 : 0) + (v.default ? 1 : 0);
  return [...pl].sort((a, b) => score(b) - score(a))[0];
}

export class Narrator {
  constructor() {
    this.synth = globalThis.speechSynthesis ?? null;
    this.status = this.synth ? 'loading' : 'unsupported'; // loading | ready | none | unsupported
    this.enabled = true; this.rate = 0.8; this.preferredURI = null;
    this.voice = null; this.plVoices = []; this.manifest = new Set();
    this.token = 0; this.current = null; this.listeners = new Set();
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { this.listeners.forEach((f) => f(this.status)); }
  /** Czy da się cokolwiek usłyszeć (głos lub nagrania)? */
  get audible() { return this.enabled && (this.status === 'ready' || this.manifest.size > 0); }

  async init() {
    await this.loadManifest();
    if (!this.synth) { this.emit(); return; }
    this.refresh();
    this.synth.addEventListener?.('voiceschanged', () => this.refresh());
    for (let i = 0; i < 12 && this.status === 'loading'; i++) { await new Promise((r) => setTimeout(r, 250)); this.refresh(); }
    if (this.status === 'loading') { this.status = 'none'; this.emit(); }
  }
  refresh() {
    const all = this.synth.getVoices();
    this.plVoices = all.filter((v) => /^pl([-_]|$)/i.test(v.lang ?? ''));
    this.voice = pickVoice(all, this.preferredURI);
    const next = this.voice ? 'ready' : (this.status === 'loading' ? 'loading' : 'none');
    if (next !== this.status) { this.status = next; this.emit(); }
  }
  setPreferred(uri) { this.preferredURI = uri; if (this.synth) this.refresh(); }
  async loadManifest() {
    try {
      const res = await fetch('audio/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const j = await res.json();
      const ids = Array.isArray(j) ? j : Object.keys(j ?? {});
      this.manifest = new Set(ids.filter((x) => /^[st]-[a-z0-9_]+$/.test(x)));
    } catch { /* brak nagrań – normalne */ }
  }

  cancel() { this.token++; try { this.synth?.cancel(); } catch { /* ignore */ } this.current?.pause?.(); this.current = null; }

  /** Czyta kolejno części (np. ['Posłuchaj', '#m']). Zwraca Promise na koniec. */
  async speak(parts) {
    const t = ++this.token;
    try { this.synth?.cancel(); } catch { /* ignore */ }
    if (!this.enabled) return;
    const list = Array.isArray(parts) ? parts : [parts];
    for (const part of list) {
      if (t !== this.token) return;
      await this.one(part, t);
      if (t !== this.token) return;
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  one(part, t) {
    const id = audioId(part);
    if (this.manifest.has(id)) {
      return new Promise((resolve) => {
        const a = new Audio(`audio/${id}.mp3`);
        this.current = a;
        a.onended = resolve;
        a.onerror = () => this.tts(part, t).then(resolve);
        a.play().catch(() => this.tts(part, t).then(resolve));
      });
    }
    return this.tts(part, t);
  }
  tts(part, t) {
    return new Promise((resolve) => {
      if (this.status !== 'ready' || !this.synth || t !== this.token) return resolve();
      const text = resolveSay(part);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice.lang; try { u.voice = this.voice; } catch { /* nieprawidłowy obiekt głosu – zostaje sam język */ } u.rate = this.rate; u.pitch = 1.05; u.volume = 1;
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(timer); resolve(); } };
      const timer = setTimeout(fin, 2500 + (text.length * 220) / this.rate);
      u.onend = fin; u.onerror = fin;
      this.current = u; // trzymamy referencję (Chrome potrafi "zgubić" zdarzenia po GC)
      try { this.synth.speak(u); } catch { fin(); }
    });
  }
}
