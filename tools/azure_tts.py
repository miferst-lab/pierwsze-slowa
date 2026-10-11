"""Minimalny klient Azure Speech (REST) z twardym limitem znaków, cache po haszu SSML i bez pętli ponowień.

Klucz TYLKO ze zmiennej środowiskowej AZURE_SPEECH_KEY (nigdy do plików/logów). Region: AZURE_SPEECH_REGION (domyślnie northeurope).
Limit: abort, gdy suma znaków tekstu w jednym uruchomieniu przekroczy CHAR_CAP (4500) – chroni darmowy poziom F0.
"""
import hashlib, json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path

CHAR_CAP = 4500
FORMAT = 'audio-24khz-48kbitrate-mono-mp3'
CACHE = Path(os.environ.get('PS_AZURE_CACHE', '~/.cache/pierwsze-slowa-azure')).expanduser()
UA = 'pierwsze-slowa-audio-generator/1.0'


class AzureStop(Exception):
    pass


def text_chars(ssml):
    """Liczba znaków tekstu (bez znaczników) – tak liczy Azure; zawartość <phoneme> liczymy też."""
    return len(re.sub(r'<[^>]+>', '', ssml).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').strip())


class Azure:
    def __init__(self):
        self.key = os.environ.get('AZURE_SPEECH_KEY')
        if not self.key: raise AzureStop('brak zmiennej AZURE_SPEECH_KEY')
        region = os.environ.get('AZURE_SPEECH_REGION', 'northeurope')
        self.url = f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1'
        self.used = 0; self.requests = 0; self.cached = 0
        CACHE.mkdir(parents=True, exist_ok=True)

    def synth(self, ssml):
        """-> bajty mp3 (24 kHz, 48 kb/s, mono). Z cache, jeśli ten sam SSML już był."""
        h = hashlib.sha256((FORMAT + ssml).encode()).hexdigest()
        f = CACHE / (h + '.mp3')
        if f.exists():
            self.cached += 1; return f.read_bytes()
        n = text_chars(ssml)
        if self.used + n > CHAR_CAP: raise AzureStop(f'limit znaków {CHAR_CAP} przekroczony ({self.used}+{n}) – przerywam')
        req = urllib.request.Request(self.url, data=ssml.encode('utf-8'), method='POST', headers={
            'Ocp-Apim-Subscription-Key': self.key, 'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': FORMAT, 'User-Agent': UA})
        self.used += n; self.requests += 1
        try:
            with urllib.request.urlopen(req, timeout=60) as r: data = r.read()
        except urllib.error.HTTPError as e:
            body = ''
            try: body = e.read(300).decode('utf-8', 'replace')
            except Exception: pass
            raise AzureStop(f'HTTP {e.code} z Azure ({e.reason}) {body} – zatrzymuję bez ponawiania')
        except Exception as e:
            raise AzureStop(f'błąd sieci: {type(e).__name__}')
        if len(data) < 500: raise AzureStop('podejrzanie krótka odpowiedź Azure')
        f.write_bytes(data)
        ledger = CACHE / 'ledger.json'
        L = json.loads(ledger.read_text()) if ledger.exists() else {'chars': 0, 'requests': 0}
        L['chars'] += n; L['requests'] += 1; ledger.write_text(json.dumps(L))
        return data

    def total_ever(self):
        l = CACHE / 'ledger.json'
        return json.loads(l.read_text())['chars'] if l.exists() else 0


def esc(t): return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def ssml(voice, inner, lang='pl-PL'):
    return f"<speak version='1.0' xml:lang='{lang}' xmlns='http://www.w3.org/2001/10/synthesis'><voice name='{voice}'>{inner}</voice></speak>"


def prosody(text, rate=None, pitch=None, volume=None):
    a = ''.join(f" {k}='{v}'" for k, v in (('rate', rate), ('pitch', pitch), ('volume', volume)) if v)
    return f"<prosody{a}>{esc(text)}</prosody>" if a else esc(text)
