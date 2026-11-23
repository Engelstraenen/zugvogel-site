# PROJEKT-MASTERFILE – ZUGVOGEL
Gilt zusätzlich zur globalen Masterfile (~/.claude/CLAUDE.md).

## 1. Ziel und Endprodukt
Muster-/Demo-Webseite für Umzugsfirmen (fiktive Marke ZUGVOGEL Umzüge), gleiche Liga wie WARMHERZ, FARBKANTE, LICHTBOGEN.
Modern, cool, praxisnah; löst echte Probleme von Umzugsfirmen:
- Unklares Volumen / Besichtigungsfahrten → Umzugsrechner (m³ + Festpreis) und Video-/Foto-Besichtigung per Handy
- Preisvergleich/Rätselraten → Festpreis-Anfrage in 2 Minuten
- Halteverbotszone → Service-Kapitel mit Ablauf
- Kunden-Nervosität am Umzugstag → Termin-Kalender, Live-Status „Team unterwegs“
- Personalmangel (Möbelpacker, Fahrer C1/CE) → Recruiting-Kapitel, Bewerbung in 60 Sekunden
- Vertrauen → Bewertungsbereich (bewegt, keine erfundenen Noten bei echtem Kunden)

## 2. Qualitätsanspruch & Referenzen
Aufbau wie FLUTLICHT27: Film-Kapitel (Scroll spult Video, Vorher → Arbeit → Ergebnis) im Wechsel mit Motion-Design-Kapiteln.
Leitmotiv = Profi-Situation: Möbellift am Fenster, LKW-Laderaum/Ladungssicherung, Profi-Packen mit Möbeldecken.
Mobil-Prüfung in 4 Größen + Kopfzeile 1081–1600 px.

## 3. Regeln für dieses Projekt
Medien gratis über sjinn.ai Unlimited (Chrome). Bezahlte Endrender nur nach OK.

## 4. Skills, Plugins, Agenten, MCP
| Name | wofür |
|---|---|
| claude-in-chrome | sjinn.ai |
| hyperframes (erst bei Bau, falls Motion-Clips) | Motion Design |

## 5. Zugänge
sjinn.ai (Chrome, eingeloggt) ✅ · GitHub Engelstraenen (gh) – beim Deploy prüfen

## 6. Workflow & Freigabepunkte
1. 3 Design-Varianten als Storyboard (konzepte/) → Eugen wählt
2. First Frames 4K → Drafts → Bau → Mobil-Check → GitHub Pages

## 7. Befehle
- Vorschau: `python3 tools/serve.py 4395` → http://localhost:4395/ (Port 4395, 4381/4391 sind von anderen Sitzungen belegt; vorher `<title>` per curl prüfen)
- Bilder: `python3 tools/assets.py` (assets-roh/img/zv-*.jpg → site/assets/img/*.webp, 3840 + 1800 px, mit Cache)
- Filme: `python3 tools/video.py <roh.mp4> lift|sofa|crew` (All-Intra, Desktop/Hochkant/Quer, trägt vid.js ein)
- Prüfen: `python3 tools/desk_check.py 1440x900`, `python3 tools/mobil_check.py http://localhost:4395/`
- Veröffentlichen: `git subtree split --prefix site -b gh-pages && git push -f origin gh-pages` → https://engelstraenen.github.io/zugvogel-site/

## 8. Offene Fragen
- Endrender 2K (MiniMax H3) braucht Credits: Guthaben 23.11. nur 38 Credits.

## 9. Entschieden
- 23.11.2026: Farbwelt Tanne & Messing (--bg #0d1915, --or #d8b260) statt Nachtblau/Orange. Blau nur noch per ?farbe=blau. Eingetragen in Dokumente/FARBWELTEN.md.
- 23.11.2026: Eugen wählt Variante 1 „Möbellift“ (Nachtblau + Signalorange). Repo Engelstraenen/zugvogel-site, Pages über gh-pages.
- 23.11.2026: Projektname/Marke ZUGVOGEL. Storyboards 3x3, Nano Banana 2.1, 16:9, 4K, Prompts in `konzepte/prompts.md`.

## 10. Ablage
konzepte/ (Storyboards + Prompts) · tools/ (sjinn_queue.js, jobs.json) · site/ · assets-roh/ · verlauf/
