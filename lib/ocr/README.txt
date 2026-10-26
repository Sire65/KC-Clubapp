Texterkennung und QR-Lesen für „Einlesen“ (2.669.0 KC-CLUB-ERKENNUNG-DATEI) – alles läuft auf dem Gerät, nichts geht an fremde Server.
- tesseract.min.js, worker.min.js: tesseract.js 7.0.0 (Apache-2.0), unverändert aus npm
- tesseract-core-lstm.wasm.js: tesseract.js-core 6.1.2 (Apache-2.0), unverändert
- deu.traineddata.gz: @tesseract.js-data/deu 1.0.0, 4.0.0_best_int (MIT bzw. Apache-2.0 Tesseract-Daten), unverändert
- jsQR.js: jsQR 1.4.0 (Apache-2.0), unverändert – QR-Lesen, wenn das Gerät keinen BarcodeDetector hat
Wird nur geladen, wenn beim Einlesen ein Foto erkannt werden soll (einmalig ca. 5 MB).
