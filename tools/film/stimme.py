# KC-CLUB-FILME-NEU: Sprecher für die Erklärfilme – Piper-Stimme de_DE-thorsten-medium (Datensatz CC0, Piper MIT), offline.
# Aufruf (von gemeinsam.mjs): python3 tools/film/stimme.py <liste.json>   – liste.json: [{"datei": "...wav", "text": "..."}]
# Voraussetzung: pip install piper-tts; Stimmmodell stimmen/de_DE-thorsten-medium.onnx (liegt in der Club-App).
import json, os, sys, wave
from piper import PiperVoice, SynthesisConfig
wurzel = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
modell = os.environ.get("FILM_STIMME", os.path.join(wurzel, "stimmen", "de_DE-thorsten-medium.onnx"))
v = PiperVoice.load(modell)
cfg = SynthesisConfig(length_scale=0.9)
for e in json.load(open(sys.argv[1], encoding="utf-8")):
    with wave.open(e["datei"], "wb") as w:
        v.synthesize_wav(e["text"], w, syn_config=cfg)
