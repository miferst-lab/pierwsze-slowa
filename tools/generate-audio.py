#!/usr/bin/env python3
"""Generuje nagrania lektora (audio/<id>.mp3 + audio/manifest.json) offline, lokalnym neuronowym TTS.

GŁOS: NeonGeckoCom/tts-vits-mai-pl  (Coqui VITS, pojedyncza kobieta, polski; ~22,05 kHz)
  licencja modelu: BSD-3-Clause  https://huggingface.co/neongeckocom/tts-vits-mai-pl  (pole `license: bsd-3-clause`)
  dane treningowe: M-AILABS Speech Dataset (pl_PL), licencja BSD-podobna z wyraźnym „including any commercial use”
  (https://github.com/imdatceleste/m-ailabs-dataset). Zob. audio/VOICE-LICENSE.md. Modelu NIE ma w repozytorium.

Użycie (patrz README.md, rozdział „Nagrania lektora”):
  python3 -m venv .venv-tts && . .venv-tts/bin/activate
  pip install --extra-index-url https://download.pytorch.org/whl/cpu torch torchaudio coqui-tts torchcodec \
      "transformers>=4.57,<5" huggingface_hub pyloudnorm soundfile librosa scipy numpy
  python tools/generate-audio.py --download            # pobiera model do ~/.cache/pierwsze-slowa-tts (ok. 110 MB)
  python tools/generate-audio.py [--only s-m,t-mama] [--force] [--model-dir DIR]

Wymaga: ffmpeg (z libmp3lame i rubberband) oraz node (lista wypowiedzi: tools/list-audio-ids.mjs).
Wypowiedzi pochodzą z js/core/spoken.js – każde nowe zdanie w grze dostaje nagranie po ponownym uruchomieniu skryptu.
"""
import argparse, json, os, subprocess, sys, tempfile, warnings, zlib
from pathlib import Path

warnings.filterwarnings('ignore')
ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'audio'
HF_REPO = 'neongeckocom/tts-vits-mai-pl'
SR = 22050
HOP = 256            # krok ramki modelu (próbki) – do przeliczania czasu trwania tokenów
LUFS_TEXT = -16.0    # zdania, słowa, polecenia, pochwały
LUFS_PHON = -13.0    # głoski i sylaby: +3 dB
PEAK_LIMIT = 0.85    # ok. -1,4 dBFS (limiter; zapas na przesterowanie przy kodowaniu mp3)
MP3_KBPS = '56k'

# ---------------------------------------------------------------------------------------------
# Parametry stylu (VITS): length_scale (>1 = wolniej), noise_scale (zmienność), noise_scale_dp (zmienność rytmu),
# pitch (mnożnik; >1 = wyżej, przez rubberband), gain_db – dodatkowe wzmocnienie względem celu LUFS.
STYLE = {
    'instruction': dict(ls=1.10, ns=0.35, nw=0.35, pitch=1.03),
    'sentence':    dict(ls=1.12, ns=0.35, nw=0.35, pitch=1.03),
    'word':        dict(ls=1.20, ns=0.35, nw=0.35, pitch=1.03),
    'syllable':    dict(ls=1.55, ns=0.30, nw=0.30, pitch=1.03, phon=True),
    'sound':       dict(ls=1.0,  ns=0.30, nw=0.30, pitch=1.03, phon=True),   # specjalne przepisy poniżej
    'praise':      dict(ls=0.95, ns=0.60, nw=0.60, pitch=1.10),              # jaśniej, weselej
    'finish':      dict(ls=0.97, ns=0.55, nw=0.55, pitch=1.08),
    'retry':       dict(ls=1.08, ns=0.45, nw=0.45, pitch=1.05),              # ciepło, spokojnie
    'parent':      dict(ls=1.05, ns=0.35, nw=0.35, pitch=1.03),
}
# ---------------------------------------------------------------------------------------------
# PRZEPISY NA GŁOSKI. Model czyta literę po literze, więc „mmm”, „sss” podany jako tekst daje szum (hałas
# losowy: model „zgaduje” nazwy liter). Dlatego głoskę wycinamy z NOŚNIKA (np. „ma”) i wydłużamy
# bezpośrednio w modelu: podajemy własne czasy trwania tokenów (aux_input['durations']), a po wygenerowaniu
# wycinamy tylko token spółgłoski.
#   S  - spółgłoska ciągła: token(y) spółgłoski wydłużone do `target` s, reszta nośnika skrócona i odcięta
#   V  - samogłoska: nazwa litery = głoska; wydłużona umiarkowanie (zbyt długi sustain zlewa samogłoski)
#   P  - zwarta/zwarto-szczelinowa: nośnik „Cy” z krótką samogłoską (ty, ky...), jak dotychczasowa tabela SAY
#   VF - szczelinowa dźwięczna (z, ż, ź, w): model nie umie utrzymać dźwięczności szumu, więc miksujemy
#        bzyczenie (dolnoprzepustowo z „buzz”) z szumem (górnoprzepustowo z „noise”, modulowanym ~200 Hz)
#   COPY - ta sama głoska co inna (ó=u, rz=ż, h=ch)
# eq=(lo,hi) Hz: pasmo (filtr), nadaje szczelinowym różne barwy (s wyżej, sz niżej, ch najniżej) – inaczej model
# renderuje je podobnie.
SOUNDS = {
    'a': dict(r='V', text='a'), 'o': dict(r='V', text='o'), 'e': dict(r='V', text='e'), 'u': dict(r='V', text='u'),
    'i': dict(r='V', text='i'), 'y': dict(r='V', text='y'), 'ą': dict(r='V', text='ą'), 'ę': dict(r='V', text='ę'),
    'ó': dict(r='COPY', of='u'),
    'm': dict(r='S', text='ma', chars=[0]), 'n': dict(r='S', text='na', chars=[0]), 'ń': dict(r='S', text='ńa', chars=[0]),
    'l': dict(r='S', text='la', chars=[0]), 'ł': dict(r='S', text='ła', chars=[0]), 'r': dict(r='S', text='ra', chars=[0]),
    'j': dict(r='S', text='ja', chars=[0]),
    'f': dict(r='NOISE', lo=1100, hi=9500),   # model oddaje „f” zdźwięcznione: syntetyczny szum szerokopasmowy
    's': dict(r='S', text='sa', chars=[0], eq=(4000, 10500)),
    'ś': dict(r='S', text='śa', chars=[0], eq=(2800, 8000)),
    'sz': dict(r='S', text='sza', chars=[0, 1], weights=[.97, .03], eq=(1500, 5500)),
    'ch': dict(r='S', text='cha', chars=[0, 1], weights=[.97, .03], eq=(800, 4000)),
    'h': dict(r='COPY', of='ch'),
    'z': dict(r='VF', buzz='za', noise='s'), 'ź': dict(r='VF', buzz='źa', noise='ś'),
    'ż': dict(r='VF', buzz='ża', noise='sz'), 'rz': dict(r='COPY', of='ż'),
    'w': dict(r='VF', buzz='za', noise='f'),
    't': dict(r='P', text='ty'), 'k': dict(r='P', text='ky', alts=['ke', 'ko', 'ka', 'ku', 'ki']), 'd': dict(r='P', text='dy'), 'p': dict(r='P', text='py'),
    'b': dict(r='P', text='by'), 'g': dict(r='P', text='gy'), 'c': dict(r='P', text='cy'),
    'cz': dict(r='P', text='czy', chars=[0, 1]), 'dz': dict(r='P', text='dzy', chars=[0, 1]),
    'dź': dict(r='P', text='dźi', chars=[0, 1], alts=['dźy', 'dźe']), 'dż': dict(r='P', text='dży', chars=[0, 1]), 'ć': dict(r='P', text='ći'),
}
SUSTAIN_S = 0.70      # s: długość głoski ciągłej
SUSTAIN_V = 0.42      # s: długość samogłoski
# Oczekiwania do kontroli „na ucho maszyny” (cechy widma): centroid Hz, zcr (przejścia przez zero), voicing (0-1)
EXPECT = {
    'vowel':   dict(voi=(0.45, 1.0), zcr=(0, 0.12)),
    'voiced':  dict(voi=(0.60, 1.0), zcr=(0, 0.12)),            # m n ń l ł r j
    'noise':   dict(voi=(0.0, 0.65), zcr=(0.12, 1.0)),          # f s ś sz ch
    'vfric':   dict(zcr=(0.05, 1.0)),                           # z ź ż w: bzyczenie + szum
    'plosive': dict(),                                           # t k d p b g c cz dz dź dż ć: tylko czas/głośność
}
CLASS = {**{k: 'vowel' for k in 'aoeuiyąęó'}, **{k: 'voiced' for k in ['m', 'n', 'ń', 'l', 'ł', 'r', 'j']},
         **{k: 'noise' for k in ['f', 's', 'ś', 'sz', 'ch', 'h']}, **{k: 'vfric' for k in ['z', 'ź', 'ż', 'rz', 'w']},
         **{k: 'plosive' for k in ['t', 'k', 'd', 'p', 'b', 'g', 'c', 'cz', 'dz', 'dź', 'dż', 'ć']}}
# oczekiwana kolejność jasności szczelinowych (centroid): s > ś > sz > ch
CENTROID_ORDER = ['s', 'ś', 'sz', 'ch']


def die(msg):
    print('BŁĄD:', msg, file=sys.stderr); sys.exit(1)


def ensure_model(model_dir, download):
    mdir = Path(model_dir).expanduser()
    need = ['config.json', 'model_file.pth.tar', 'speaker_ids.json', 'language_ids.json']
    if download or not all((mdir / f).exists() for f in need):
        if not download:
            die(f'brak modelu w {mdir}. Uruchom z --download (pobiera {HF_REPO}, licencja BSD-3-Clause).')
        from huggingface_hub import hf_hub_download
        mdir.mkdir(parents=True, exist_ok=True)
        for f in need:
            p = hf_hub_download(HF_REPO, f); (mdir / f).write_bytes(Path(p).read_bytes())
    cfg = json.loads((mdir / 'config.json').read_text())
    # checkpoint ma osadzenia mówcy/języka, a config nie wskazuje plików -> uzupełniamy (lokalna kopia)
    cfg['model_args'].update(num_speakers=1, speakers_file=str(mdir / 'speaker_ids.json'), language_ids_file=str(mdir / 'language_ids.json'))
    cfg.update(speakers_file=str(mdir / 'speaker_ids.json'), language_ids_file=str(mdir / 'language_ids.json'), num_speakers=1)
    (mdir / 'config.local.json').write_text(json.dumps(cfg))
    return mdir


class Voice:
    def __init__(self, mdir):
        import numpy as np, torch
        from TTS.api import TTS
        self.np, self.torch = np, torch
        t = TTS(model_path=str(mdir / 'model_file.pth.tar'), config_path=str(mdir / 'config.local.json'))
        self.m = t.synthesizer.tts_model
        self.tok = self.m.tokenizer

    def run(self, text, ls=1.0, ns=0.3, nw=0.3, dur_fn=None, seed=0):
        """-> (wav float32, spans[(start,end) próbki na token]); dur_fn(d_frames, n_tokens) -> nowe czasy (ramki)."""
        np, torch = self.np, self.torch
        m = self.m
        m.length_scale, m.inference_noise_scale, m.inference_noise_scale_dp = ls, ns, nw
        ids = self.tok.text_to_ids(text)
        x = torch.LongTensor(ids).unsqueeze(0)
        aux = {'x_lengths': torch.LongTensor([len(ids)]), 'speaker_ids': torch.LongTensor([0]), 'language_ids': torch.LongTensor([0]), 'd_vectors': None, 'durations': None}
        with torch.no_grad():
            torch.manual_seed(seed)
            o = m.inference(x, aux_input=aux)
            d = o['durations'].squeeze().numpy()
            if dur_fn is not None:
                d2 = np.maximum(1, np.round(dur_fn(d.copy())))
                aux['durations'] = torch.tensor(d2, dtype=torch.float32).reshape(1, -1)
                torch.manual_seed(seed)
                o = m.inference(x, aux_input=aux)
                d = o['durations'].squeeze().numpy()
        wav = o['model_outputs'].squeeze().numpy().astype(np.float32)
        cum = np.concatenate([[0], np.cumsum(d)]) * HOP
        return wav, [(int(cum[i]), int(cum[i + 1])) for i in range(len(d))]


def frames(sec): return max(1, int(round(sec * SR / HOP)))


def durfn(kind, chars, target=None, weights=None, vowel_cap=7):
    """Czasy tokenów: ids = [blank, c0, blank, c1, ..., blank]; znak i leży na pozycji 1+2i."""
    def fn(d):
        for i in range(len(d)):
            ci = (i - 1) // 2 if i % 2 == 1 else None
            if ci is None: d[i] = max(1, min(d[i], 2)); continue
            if kind == 'S':
                d[i] = max(1, frames(target) * (weights[chars.index(ci)] if ci in chars else 0)) if ci in chars else 2
            elif kind == 'V':
                d[i] = frames(target) if ci in chars else 2
            else:  # P
                d[i] = d[i] if ci in chars else min(d[i], vowel_cap)
        return d
    return fn


def render_sound_once(voice, key, text, seed):
    import numpy as np
    spec = SOUNDS[key]; r = spec['r']; n = len(text)
    if r == 'V':
        w, sp = voice.run(text + ' ' + text, dur_fn=durfn('V', [0], SUSTAIN_V), seed=seed)
        return w[sp[0][0]:sp[2 * n][1]]
    if r == 'S':
        chars = spec['chars']; weights = spec.get('weights') or [1 / len(chars)] * len(chars)
        w, sp = voice.run(text + ' ' + text, dur_fn=durfn('S', chars, SUSTAIN_S, weights), seed=seed)
        out = w[sp[2 * min(chars)][0]:sp[2 * max(chars) + 2][0]]
        return bandpass(out, *spec['eq']) if 'eq' in spec else out
    chars = spec.get('chars', [0])           # P
    w, sp = voice.run(text + ' ' + text, dur_fn=durfn('P', chars), seed=seed)
    return w[:sp[2 * n][1]]


def sound_ok(key, w):
    """Bramka jakości dla jednej głoski: dość głośno i cechy widma zgodne z klasą głoski."""
    cls = CLASS.get(key)
    if loudness(w) < (-45 if cls == 'noise' else -36): return False
    f = feats(w)
    for feat, fk in (('voi', 'voicing'), ('zcr', 'zcr')):
        rng = EXPECT.get(cls, {}).get(feat)
        if rng and not rng[0] <= f[fk] <= rng[1]: return False
    return True


def render_sound(voice, key, seed, cache):
    spec = SOUNDS[key]; r = spec['r']
    if r == 'COPY': return render_sound(voice, spec['of'], seed, cache)
    if key in cache: return cache[key]
    if r == 'NOISE':
        out = synth_noise(spec['lo'], spec['hi'], SUSTAIN_S, seed)
    elif r == 'VF':
        out = mix_voiced_fricative(render_sound_text(voice, spec['buzz'], seed), render_sound(voice, spec['noise'], seed, cache))
    else:
        best, bestl = None, -999
        for text in [spec['text']] + spec.get('alts', []):
            for k in range(3):
                out = render_sound_once(voice, key, text, seed + k)
                if sound_ok(key, out): best = out; break
                l = loudness(out)
                if best is None or l > bestl: best, bestl = out, l
            else:
                continue
            break
        out = best
    cache[key] = out
    return out


def synth_noise(lo, hi, dur, seed):
    """Szum Gaussa w paśmie [lo, hi] z łagodną obwiednią (głoska „f”: szerokie, płaskie widmo)."""
    import numpy as np
    from scipy.signal import sosfiltfilt
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(int(dur * SR)).astype(np.float32)
    x = sosfiltfilt(sos('bandpass', [lo, hi]), x)
    t = np.linspace(0, 1, len(x)); env = np.minimum(1, np.minimum(t / 0.08, (1 - t) / 0.12)) * (0.9 + 0.1 * np.sin(2 * np.pi * 3 * t))
    return (x * env / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.1).astype(np.float32)


def render_sound_text(voice, carrier, seed):
    """Zdźwięczona część „bzyczenia”: pierwszy token nośnika wydłużony (jak S), bez EQ."""
    w, sp = voice.run(carrier + ' ' + carrier, dur_fn=durfn('S', [0], SUSTAIN_S, [1.0]), seed=seed)
    return w[sp[0][0]:sp[2][0]]


def sos(kind, fc, order=4):
    from scipy.signal import butter
    return butter(order, fc, btype=kind, fs=SR, output='sos')


def bandpass(w, lo, hi):
    from scipy.signal import sosfiltfilt
    import numpy as np
    return sosfiltfilt(sos('bandpass', [lo, min(hi, SR / 2 - 100)]), w).astype(np.float32)


def mix_voiced_fricative(buzz, noise, f0=205.0):
    """Dźwięczna szczelinowa = dolne pasmo bzyczenia + szum z modulacją amplitudy ~f0 (jak prawdziwe z, ż, w)."""
    import numpy as np
    from scipy.signal import sosfiltfilt
    n = min(len(buzz), len(noise))
    lo = sosfiltfilt(sos('lowpass', 900), buzz[:n])
    hi = sosfiltfilt(sos('highpass', 2200), noise[:n])
    t = np.arange(n) / SR
    am = 0.65 + 0.35 * np.cos(2 * np.pi * f0 * t)
    rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-9)
    lo = lo / rms(lo); hi = hi / rms(hi)
    return ((1.0 * lo + 0.55 * hi * am) / 1.6).astype(np.float32)


def trim_and_fade(w, head=0.03, tail=0.09, top_db=42, fade_in=0.012, fade_out=0.035):
    import numpy as np, librosa
    y, idx = librosa.effects.trim(w, top_db=top_db, frame_length=512, hop_length=128)
    y = y.copy()
    fi, fo = int(fade_in * SR), int(fade_out * SR)
    if len(y) > fi + fo:
        y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
    return np.concatenate([np.zeros(int(head * SR), np.float32), y, np.zeros(int(tail * SR), np.float32)])


def pitch_shift(w, factor):
    """rubberband (ffmpeg) – zmienia wysokość bez zmiany tempa; factor=1.10 ≈ +1,65 półtonu."""
    import numpy as np, soundfile as sf
    if abs(factor - 1) < 1e-3: return w
    with tempfile.TemporaryDirectory() as td:
        a, b = Path(td) / 'a.wav', Path(td) / 'b.wav'
        sf.write(a, w, SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(a), '-af', f'rubberband=pitch={factor}:pitchq=quality', str(b)], check=True)
        y, _ = sf.read(b, dtype='float32')
    return y


def loudness(w):
    import numpy as np, pyloudnorm as pyln
    x = w if len(w) >= int(0.5 * SR) else np.concatenate([w, np.zeros(int(0.5 * SR) - len(w), np.float32)])
    return float(pyln.Meter(SR).integrated_loudness(x))


def encode_mp3(w, path, limit=PEAK_LIMIT):
    import soundfile as sf
    with tempfile.TemporaryDirectory() as td:
        a = Path(td) / 'a.wav'; sf.write(a, w, SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(a), '-af', f'alimiter=limit={limit}:attack=2:release=40:level=disabled',
                        '-ac', '1', '-ar', str(SR), '-c:a', 'libmp3lame', '-b:a', MP3_KBPS, '-write_xing', '0', str(path)], check=True)


def decode_mp3(path):
    import numpy as np
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32)


def feats(w):
    import numpy as np, librosa
    S = np.abs(librosa.stft(w, n_fft=1024, hop_length=256))
    cen = librosa.feature.spectral_centroid(S=S, sr=SR)[0]
    rms = librosa.feature.rms(S=S, frame_length=1024)[0]
    act = rms > 0.1 * rms.max()
    zc = librosa.feature.zero_crossing_rate(w, frame_length=1024, hop_length=256)[0]
    n = int(0.04 * SR); lo, hi = int(SR / 450), int(SR / 70); vals = []
    for s in range(0, len(w) - n, n // 2):
        x = w[s:s + n] - w[s:s + n].mean(); e = (x * x).sum()
        if e < 1e-6: continue
        ac = np.correlate(x, x, 'full')[n - 1:]; vals.append(ac[lo:hi].max() / ac[0])
    return dict(centroid=int(np.median(cen[act])) if act.any() else 0, zcr=round(float(np.median(zc[act])) if act.any() else 0, 3),
                voicing=round(float(np.median(vals)) if vals else 0, 2))


MIN_RAW_LUFS = -36.0  # surowa głośność (przed normalizacją) poniżej tego = podejrzanie cichy render
MIN_RAW_PEAK = 0.08   # surowy szczyt poniżej tego = model „zgubił” bardzo krótki tekst (prawie cisza/szum)
LS_TRY = [1.0, 1.0, 0.85, 0.85, 1.2, 1.2]   # kolejne próby: inne tempo = inny render
TEXT_OVERRIDE = {'w': 'we', 'z': 'ze'}   # samotny przyimek „w”/„z”: model nie czyta pojedynczej litery


def render_text(voice, text, st, seed):
    """Zwykły tekst. Bardzo krótkie wypowiedzi (sylaba, krótkie słowo) renderujemy w kontekście „X X” i bierzemy
    pierwsze X: pojedynczy krótki tekst model często oddaje prawie ciszą (szczyt < 0,03). Bramka jakości: gdy surowy
    szczyt < MIN_RAW_PEAK, próbujemy innego trybu i ziarna."""
    import numpy as np
    text = TEXT_OVERRIDE.get(text.lower(), text)
    short = ' ' not in text and len(text) <= 4
    best, bestpk, bestraw = None, -999, 0
    for attempt in range(6):
        use_ctx = short if attempt % 2 == 0 else not short
        sd = seed + attempt // 2
        if use_ctx:
            n = len(text)
            w, sp = voice.run(text + ' ' + text, ls=st['ls'] * LS_TRY[attempt], ns=st['ns'], nw=st['nw'], seed=sd)
            w = w[:sp[2 * n][1]]
        else:
            w, _ = voice.run(text, ls=st['ls'] * LS_TRY[attempt], ns=st['ns'], nw=st['nw'], seed=sd)
        pk = float(np.abs(w).max()); score = loudness(trim_and_fade(w))
        if score > bestpk: best, bestpk, bestraw = w, score, pk
        if pk >= MIN_RAW_PEAK and score >= MIN_RAW_LUFS: break
    return best, bestraw


def build(args):
    import numpy as np
    ids = json.loads(subprocess.run(['node', str(ROOT / 'tools/list-audio-ids.mjs'), '--json'], capture_output=True, text=True, check=True, cwd=ROOT).stdout)
    only = set(args.only.split(',')) if args.only else None
    mdir = ensure_model(args.model_dir, args.download)
    voice = Voice(mdir)
    AUDIO.mkdir(exist_ok=True)
    cache, report = {}, {}
    rp = ROOT / 'docs' / 'audio-report.json'
    old_clips = json.loads(rp.read_text()).get('details', {}) if rp.exists() else {}   # metryki poprzedniego przebiegu
    for it in ids:
        id_, part, kind = it['id'], it['part'], it['kind']
        path = AUDIO / f'{id_}.mp3'
        if only and id_ not in only: continue
        if path.exists() and not args.force and not only and id_ in old_clips:
            report[id_] = old_clips[id_]; continue
        seed = zlib.crc32(id_.encode()) & 0x7fffffff
        st = STYLE[kind]
        rawpk = None
        if kind == 'sound':
            key = part[1:]
            w = render_sound(voice, key, seed, cache)
            w = pitch_shift(w, st['pitch']) if SOUNDS[key]['r'] not in ('VF',) and CLASS.get(key) != 'noise' else w
        else:
            text = part
            if kind in ('praise', 'finish', 'retry') and not text.rstrip().endswith(('!', '?', '.')): text += '!'
            w, rawpk = render_text(voice, text, st, seed)
            w = pitch_shift(w, st['pitch'])
        w = trim_and_fade(w)
        target = LUFS_PHON if st.get('phon') else LUFS_TEXT
        lufs = loudness(w)
        gain = np.clip(target - lufs, -20, 30)      # górny limit chroni przed dopompowaniem samego szumu
        limit = PEAK_LIMIT
        for _ in range(6):   # po mp3 szczyt może przekroczyć limiter (szum wysokich częstotliwości): obniżamy limit, aż będzie zapas
            w2 = (w * 10 ** (gain / 20)).astype(np.float32)
            encode_mp3(w2, path, limit)
            dec = decode_mp3(path)
            if 20 * np.log10(float(np.abs(dec).max()) + 1e-9) <= -0.8: break
            limit *= 0.9
        f = feats(dec)
        pk = float(np.abs(dec).max())
        report[id_] = dict(kind=kind, text=part, dur=round(len(dec) / SR, 2), bytes=path.stat().st_size, lufs=round(loudness(dec), 1),
                           target=target, raw=None if rawpk is None else round(rawpk, 3), peak=round(20 * np.log10(pk + 1e-9), 1), gain=round(float(gain), 1), **f)
        print(f'{id_:48s} {kind:11s} {report[id_]["dur"]:5.2f}s  {report[id_]["lufs"]:6.1f} LUFS  peak {report[id_]["peak"]:5.1f} dB', flush=True)
    return report


def flags(clips):
    """Podejrzane nagrania (kontrola cech widma – nie zastępuje odsłuchu)."""
    out = []
    order = {}
    for id_, c in clips.items():
        why = []
        if c['dur'] < 0.12 or c['dur'] > 12: why.append(f'dziwny czas {c["dur"]} s')
        if c['lufs'] < -30: why.append('prawie cisza')
        if c['peak'] > -0.3: why.append('możliwe przesterowanie')
        if c.get('raw') is not None and c['raw'] < MIN_RAW_PEAK: why.append(f'surowy szczyt {c["raw"]} – model oddał bardzo cicho (możliwy szum)')
        if c['gain'] >= 24: why.append(f'wzmocnienie +{c["gain"]} dB (surowy sygnał bardzo cichy)')
        if abs(c['lufs'] - c['target']) > 3.0 and c['dur'] >= 0.4: why.append(f'głośność {c["lufs"]} LUFS daleko od celu {c["target"]}')
        if c['kind'] == 'sound':
            k = c['text'][1:]; cls = CLASS.get(k); exp = EXPECT.get(cls, {})
            for feat, (lo, hi) in exp.items():
                key = {'voi': 'voicing', 'zcr': 'zcr'}[feat]
                if not lo <= c[key] <= hi: why.append(f'{key}={c[key]} poza {lo}-{hi} (klasa {cls})')
            if cls in ('vowel', 'voiced', 'noise', 'vfric') and c['dur'] < 0.3: why.append('głoska ciągła krótsza niż 0,3 s')
            order[k] = c['centroid']
        if why: out.append(dict(id=id_, text=c['text'], kind=c['kind'], reasons=why))
    cs = [order.get(k) for k in CENTROID_ORDER]
    if all(cs) and not all(cs[i] > cs[i + 1] for i in range(len(cs) - 1)):
        out.append(dict(id='(porządek szczelinowych)', text=str(dict(zip(CENTROID_ORDER, cs))), kind='sound', reasons=['oczekiwano s > ś > sz > ch wg centroidu widma']))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--model-dir', default=os.environ.get('PS_TTS_MODEL', '~/.cache/pierwsze-slowa-tts'))
    ap.add_argument('--download', action='store_true', help=f'pobierz model {HF_REPO} (BSD-3-Clause)')
    ap.add_argument('--only', help='lista id po przecinku (regeneruje tylko te)')
    ap.add_argument('--force', action='store_true', help='wygeneruj wszystko od nowa')
    args = ap.parse_args()
    clips = build(args)
    # manifest: tylko pliki, które istnieją i są na liście; zachowujemy wpisy dla niepodanych w --only
    keep = {}
    ids = {i['id'] for i in json.loads(subprocess.run(['node', str(ROOT / 'tools/list-audio-ids.mjs'), '--json'], capture_output=True, text=True, check=True, cwd=ROOT).stdout)}
    prev = json.loads(rp.read_text()).get('details', {}) if (rp := ROOT / 'docs' / 'audio-report.json').exists() else {}
    prev.update(clips)
    for id_, c in prev.items():
        if id_ in ids and (AUDIO / f'{id_}.mp3').exists(): keep[id_] = c
    for p in AUDIO.glob('*.mp3'):
        if p.stem not in ids: p.unlink(); print('usunięto nieużywany plik', p.name)
    manifest = dict(voice='NeonGeckoCom/tts-vits-mai-pl (BSD-3-Clause)', format='mp3 mono 22.05 kHz 56 kbps',
                    clips={k: dict(kind=c['kind'], dur=c['dur'], bytes=c['bytes']) for k, c in sorted(keep.items())})
    (AUDIO / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n')
    total = sum(c['bytes'] for c in keep.values())
    rep = dict(total_bytes=total, clips=len(keep), suspicious=flags(keep), details=keep)
    (ROOT / 'docs').mkdir(exist_ok=True)
    (ROOT / 'docs' / 'audio-report.json').write_text(json.dumps(rep, ensure_ascii=False, indent=1) + '\n')
    print(f'\nGotowe: {len(keep)} nagrań, {total / 1e6:.2f} MB; podejrzane: {len(rep["suspicious"])} (docs/audio-report.json)')


if __name__ == '__main__':
    main()
