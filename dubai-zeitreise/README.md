# Die Einladung · Dubai 1971 → 2071

Ein kurzes Zeitreise-Spiel für Browser und Handy (ca. 10–15 Minuten).

**Story:** Dubai, 2. Dezember 1971 – der Tag, an dem sich sechs Emirate zu den VAE vereinen.
Die 12-jährige Mariam hat am Morgen eine Einladung an die Menschen in 100 Jahren geschrieben
und unter dem Windturm vergraben. Mittags landet im Innenhof eine Zeitkapsel – mit einer
Gegen-Einladung ihrer Urenkelin Noor zur **100-Jahr-Feier der VAE am 2. Dezember 2071 um 20:00 Uhr**.
Die Kapsel hat aber keine Energie mehr, und das Feuerwerk wartet nicht.

## Ablauf

| Kapitel | Spielart | Worum es geht |
|---|---|---|
| **1971** – Innenhof, Souk, Creek | Point-and-Click | Eine Tauschkette (Datteln → Kardamom → Gahwa → Perle, Hammer → Kupferspule, Großvaters Radio) bringt die Zeitkapsel wieder zum Laufen |
| **Zeittunnel** | Ausweich-Minispiel | Zeitsplittern ausweichen, goldene Jahresringe sammeln (jeder Ring = +1 Sekunde für 2071) |
| **2071** – derselbe Innenhof | Point-and-Click | Mariams Brief liegt hier im Museum; der Roboter NOVA erklärt den Weg |
| **Skyway** | Jump'n'Run gegen die Uhr | Über die Dächer zur Union Sky Plaza, bevor um 20:00 Uhr das Feuerwerk beginnt |
| **Finale** | – | Mariam trifft Noor, und das Feuerwerk schreibt „100“ in den Himmel |

## Steuerung

- **Handy:** Antippen zum Laufen und Benutzen; im Tunnel den Finger ziehen; im Skyway die Tasten ◀ ▶ ▲ unten.
- **Rechner:** Maus oder ← → / A D, Leertaste bzw. ↑ zum Springen, Leertaste/Enter für Dialoge.
- Oben rechts: **?** Tipp · 🔊 Ton · **DE/EN** Sprache · ⛶ Vollbild.
- Der Spielstand wird automatisch im Browser gespeichert („Weiterspielen“).

## Starten

Es gibt keinen Build-Schritt und keine Abhängigkeiten, nur HTML, CSS und JavaScript.
Grafik und Ton werden komplett im Code erzeugt.

```bash
cd dubai-zeitreise
python3 -m http.server 8000
# → http://localhost:8000 im Browser öffnen
```

Auf dem Handy kann man es über „Zum Startbildschirm hinzufügen“ als App installieren (PWA, läuft danach auch offline).
Zum Veröffentlichen reicht jeder statische Host, z. B. GitHub Pages.

## Aufbau

```
index.html            Seite + Overlays (HUD, Dialog, Inventar, Touch-Tasten)
css/style.css         Layout, skaliert mit der Spielfläche (960×540 logisch)
js/i18n.js            Alle Texte auf Deutsch und Englisch
js/engine.js          Canvas-Skalierung, Eingabe, Dialoge, Inventar, Spielstand, Tipps
js/audio.js           Soundeffekte + generative Musik (WebAudio)
js/art.js             Prozedurale Grafik: Figuren, Windturm, Dhau, Türme, Zeitkapsel
js/scenes.js          Point-and-Click-Szenen und Rätsel-Logik
js/tunnel.js          Zeittunnel-Minispiel
js/runner.js          Skyway-Jump'n'Run
js/finale.js          Finale mit Feuerwerk
js/main.js            Titelbild, Intro, Start
```
