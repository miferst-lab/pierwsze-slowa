#!/usr/bin/env python3
"""Generuje nagrania lektora (audio/<id>.mp3 + audio/manifest.json) głosem Azure Neural TTS pl-PL-ZofiaNeural (REST).

Klucz: zmienna środowiskowa AZURE_SPEECH_KEY (region AZURE_SPEECH_REGION, domyślnie northeurope). Klucza nigdy nie zapisujemy.
Darmowy poziom F0: twardy limit 4500 znaków tekstu na uruchomienie, cache odpowiedzi po haszu SSML (~/.cache/pierwsze-slowa-azure),
zero ponowień przy błędzie (HTTP 401/403/429 -> stop). Zdania „Przeczytaj wszystko” (sklejone czytanki) składamy z już pobranych
nagrań pojedynczych zdań – bez dodatkowych znaków.

  export AZURE_SPEECH_KEY=...           # nie wpisuj do plików ani do historii poleceń współdzielonej z innymi
  python3 tools/generate-audio.py [--only s-m,t-mama] [--force] [--voice pl-PL-ZofiaNeural]

Wymaga: python3 + numpy, scipy, librosa, soundfile, pyloudnorm; ffmpeg (libmp3lame, rubberband); node.
Zapasowy, w pełni offline generator (Piper-podobny VITS, licencja BSD-3): tools/generate-audio-offline.py.
"""
import argparse, importlib.util, json, re, subprocess, sys, tempfile, warnings
from pathlib import Path

warnings.filterwarnings('ignore')
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from azure_tts import Azure, AzureStop, ssml, prosody, esc, text_chars  # noqa: E402

_spec = importlib.util.spec_from_file_location('piper_gen', HERE / 'generate-audio-offline.py')
g = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(g)   # wspólne: pomiary, normalizacja, mp3, raport
g.SR = 24000
g.MP3_KBPS = '48k'
import numpy as np  # noqa: E402

ROOT, AUDIO = g.ROOT, g.AUDIO
VOICE = 'pl-PL-ZofiaNeural'
# styl SSML <prosody>; głoski/sylaby -25% i głośno; zdania -8%; pochwały pitch +6%, rate -3%
STYLE = {
    'sound': dict(rate='-25%', volume='+100%'), 'syllable': dict(rate='-25%', volume='loud'),
    'word': dict(rate='-8%'), 'sentence': dict(rate='-8%'), 'instruction': dict(rate='-8%'), 'parent': dict(rate='-8%'),
    'praise': dict(rate='-3%', pitch='+6%'), 'finish': dict(rate='-3%', pitch='+6%'), 'retry': dict(rate='-5%', pitch='+2%'),
}
PHON = {kind for kind in ('sound', 'syllable')}
# Głoski przez <phoneme alphabet='ipa'> (Azure oddaje wtedy samą głoskę, bez samogłoski nośnej).
IPA = {'a': 'a', 'o': 'ɔ', 'e': 'ɛ', 'u': 'u', 'i': 'i', 'y': 'ɨ', 'ą': 'ɔ̃', 'ę': 'ɛ̃', 'ó': 'u',
       'm': 'm', 'n': 'n', 'ń': 'ɲ', 'l': 'l', 'ł': 'w', 'r': 'r', 'j': 'j', 'f': 'f', 's': 's', 'ś': 'ɕ', 'sz': 'ʂ', 'ch': 'x', 'h': 'x',
       'z': 'z', 'ź': 'ʑ', 'ż': 'ʐ', 'rz': 'ʐ', 'w': 'v', 't': 't', 'k': 'k', 'd': 'd', 'p': 'p', 'b': 'b', 'g': 'ɡ',
       'c': 'ts', 'cz': 'tʂ', 'dz': 'dz', 'dź': 'dʑ', 'dż': 'dʐ', 'ć': 'tɕ'}
# Głoski ciągłe: Azure daje ~0,25–0,35 s, więc przedłużamy je rubberbandem (steady-state) do ok. 0,7 s (samogłoski ok. 0,45 s).
SUSTAIN = {**{k: 0.70 for k in ['m', 'n', 'ń', 'l', 'ł', 'r', 'j', 'f', 's', 'ś', 'sz', 'ch', 'h', 'z', 'ź', 'ż', 'rz', 'w']},
           **{k: 0.45 for k in ['a', 'o', 'e', 'u', 'i', 'y', 'ą', 'ę', 'ó']}}


def decode(data):
    with tempfile.NamedTemporaryFile(suffix='.mp3') as t:
        t.write(data); t.flush()
        out = subprocess.run(['ffmpeg', '-v', 'error', '-i', t.name, '-f', 'f32le', '-ac', '1', '-ar', str(g.SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).copy()


def stretch(w, target):
    import soundfile as sf
    f = target / (len(w) / g.SR)
    if f <= 1.05: return w
    f = min(f, 3.0)
    with tempfile.TemporaryDirectory() as td:
        a, b = Path(td) / 'a.wav', Path(td) / 'b.wav'
        sf.write(a, w, g.SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(a), '-af', f'rubberband=tempo={1 / f}:transients=smooth:detector=soft', str(b)], check=True)
        y, _ = sf.read(b, dtype='float32')
    return y


def build_ssml(voice, kind, part):
    if kind == 'sound':
        k = part[1:]
        inner = f"<phoneme alphabet='ipa' ph='{IPA[k]}'>{esc(k)}</phoneme>"
        a = ''.join(f" {n}='{v}'" for n, v in STYLE['sound'].items())
        return ssml(voice, f'<prosody{a}>{inner}</prosody>')
    text = part
    if kind in ('praise', 'finish', 'retry') and not text.rstrip().endswith(('!', '?', '.')): text += '!'
    return ssml(voice, prosody(text, **STYLE[kind]))


def join_clips(parts_ids, paths_gap=0.28):
    ws = []
    for pid in parts_ids:
        ws.append(g.decode_mp3(AUDIO / f'{pid}.mp3')); ws.append(np.zeros(int(paths_gap * g.SR), np.float32))
    return np.concatenate(ws[:-1])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--only'); ap.add_argument('--force', action='store_true'); ap.add_argument('--voice', default=VOICE)
    args = ap.parse_args()
    items = json.loads(subprocess.run(['node', str(ROOT / 'tools/list-audio-ids.mjs'), '--json'], capture_output=True, text=True, check=True, cwd=ROOT).stdout)
    only = set(args.only.split(',')) if args.only else None
    AUDIO.mkdir(exist_ok=True)
    rp = ROOT / 'docs' / 'audio-report.json'
    old = json.loads(rp.read_text()).get('details', {}) if rp.exists() else {}
    az = Azure()
    by_id = {i['id']: i for i in items}
    sent_ids = {}
    for i in items:
        if i['kind'] == 'sentence': sent_ids[i['part']] = i['id']
    report = {}
    # kolejność: najpierw wszystko, co pobieramy z Azure; sklejone czytanki na końcu
    def joined_parts(it):
        if it['kind'] != 'sentence': return None
        subs = re.split(r'(?<=[.!?])\s+', it['part'].strip())
        return [sent_ids[s] for s in subs] if len(subs) > 1 and all(s in sent_ids for s in subs) else None
    todo = sorted(items, key=lambda it: joined_parts(it) is not None)
    try:
        for it in todo:
            id_, part, kind = it['id'], it['part'], it['kind']
            if only and id_ not in only: continue
            path = AUDIO / f'{id_}.mp3'
            if path.exists() and not args.force and not only and id_ in old and old[id_].get('engine') == 'azure':
                report[id_] = old[id_]; continue
            jp = joined_parts(it)
            if jp:
                w = join_clips(jp); raw = None
            else:
                w = decode(az.synth(build_ssml(args.voice, kind, part)))
                w = w  # surowy dźwięk Azure
                raw = round(float(np.abs(w).max()), 3)
                w = g.trim_and_fade(w, top_db=40)
                if kind == 'sound' and part[1:] in SUSTAIN: w = stretch(w, SUSTAIN[part[1:]])
            if jp: w = g.trim_and_fade(w, top_db=40)
            phon = kind in PHON
            target = g.LUFS_PHON if phon else g.LUFS_TEXT
            lufs = g.loudness(w); gain = float(np.clip(target - lufs, -20, 34))
            limit = g.PEAK_LIMIT
            for _ in range(6):
                w2 = (w * 10 ** (gain / 20)).astype(np.float32)
                g.encode_mp3(w2, path, limit)
                dec = g.decode_mp3(path)
                if 20 * np.log10(float(np.abs(dec).max()) + 1e-9) <= -0.8: break
                limit *= 0.9
            f = g.feats(dec)
            report[id_] = dict(kind=kind, text=part, engine='azure', dur=round(len(dec) / g.SR, 2), bytes=path.stat().st_size, lufs=round(g.loudness(dec), 1), target=target,
                               raw=raw, peak=round(20 * np.log10(float(np.abs(dec).max()) + 1e-9), 1), gain=round(gain, 1), **f)
            print(f"{id_:48s} {kind:11s} {report[id_]['dur']:5.2f}s {report[id_]['lufs']:6.1f} LUFS  [znaki: {az.used}]", flush=True)
    except AzureStop as e:
        print('\nSTOP:', e, file=sys.stderr)
        print(f'Użyte znaki w tym uruchomieniu: {az.used}, żądań: {az.requests}, z cache: {az.cached}', file=sys.stderr)
        sys.exit(2)
    ids = set(by_id)
    prev = dict(old); prev.update(report)
    keep = {k: v for k, v in prev.items() if k in ids and (AUDIO / f'{k}.mp3').exists()}
    for p in AUDIO.glob('*.mp3'):
        if p.stem not in ids: p.unlink(); print('usunięto nieużywany plik', p.name)
    manifest = dict(voice=f'Microsoft Azure Neural TTS {args.voice} (głos syntetyczny)', format='mp3 mono 24 kHz 48 kbps',
                    clips={k: dict(kind=c['kind'], dur=c['dur'], bytes=c['bytes']) for k, c in sorted(keep.items())})
    (AUDIO / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n')
    total = sum(c['bytes'] for c in keep.values())
    rep = dict(total_bytes=total, clips=len(keep), azure_chars_this_run=az.used, azure_requests_this_run=az.requests, azure_chars_ever=az.total_ever(),
               suspicious=g.flags(keep), details=keep)
    (ROOT / 'docs').mkdir(exist_ok=True)
    rp.write_text(json.dumps(rep, ensure_ascii=False, indent=1) + '\n')
    print(f'\nGotowe: {len(keep)} nagrań, {total / 1e6:.2f} MB; znaki Azure w tym uruchomieniu: {az.used} (żądań {az.requests}, z cache {az.cached}); podejrzane: {len(rep["suspicious"])}')


if __name__ == '__main__':
    main()
