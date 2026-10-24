<div align="center">

# AmmaraGames

**Langkah Kecil, Penemuan Besar! · Little Steps, Big Discoveries!**

An offline 3D learning world for preschool children aged 2 to 4+:
a whole preschool and garden to explore, 16 learning worlds, a 10-game arcade and a gentle *Jom Mengaji* Quran-learning corner.
Bahasa Melayu first, English one tap away.

![Version](https://img.shields.io/badge/version-2.0.0-ff7eb6)
![Offline](https://img.shields.io/badge/works-100%25%20offline-3aa98f)
![Single file](https://img.shields.io/badge/deploy-one%20HTML%20file-9b6bff)
![Tests](https://img.shields.io/badge/tests-unit%20%2B%20Chrome%20%2B%20Edge-4a90e2)
![Privacy](https://img.shields.io/badge/no%20tracking-no%20ads-ffb43c)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

<img src="docs/screenshots/gameplay-hall.png" alt="AmmaraGames gameplay: the main hall of the 3D preschool with learning stations" width="49%"> <img src="docs/screenshots/gameplay-playground.png" alt="AmmaraGames gameplay: the outdoor playground with slide, swings and seesaw" width="49%">

</div>

---

## Contents

1. [Highlights](#highlights)
2. [Quick start](#quick-start)
3. [The world](#the-world)
4. [Mini-Game Arcade](#mini-game-arcade)
5. [Jom Mengaji](#jom-mengaji)
6. [Narrator, music and sound](#narrator-music-and-sound)
7. [For teachers and parents](#for-teachers-and-parents)
8. [Privacy and safety](#privacy-and-safety)
9. [Deployment](#deployment)
10. [Development](#development)
11. [Quality and testing](#quality-and-testing)
12. [Known limitations](#known-limitations)
13. [Credits and licences](#credits-and-licences)

## Highlights

| | |
|---|---|
| **One file, no internet** | The whole game, including 3D engine, fonts, pictures and music, is `AmmaraGames.html` (about 1.5 MB). Double-click to play. |
| **Big 3D preschool + garden** | 11 indoor corners and 6 garden areas (120 × 44 m), with a front door, playground, sandpit, hopscotch, flower garden and a gazebo Nature Station. |
| **16 learning worlds, 392 questions** | Letters, numbers, colours, shapes, animals, fruit, vehicles, body, nature, space, hygiene, safety, feelings, patterns and more, in BM and English, chosen by age group. |
| **10 mini-games** | Ruler & straight lines, X and O, connect the dots, trace letters/numbers/Hijaiyah, memory cards, shape puzzle, find it, bead patterns, count & sort, xylophone. |
| **Jom Mengaji** | 28 Hijaiyah letters, original exercises, and 20 short surahs with verbatim Tanzil Uthmani text and an embedded Arabic font. |
| **Friendly helpers** | A star mascot, two seated robot friends who say hello, and an optional narrator voice. |
| **No pressure** | No timers, no lives, no failure screens. Mistakes are free; every effort gets encouragement. |
| **For classrooms** | Class lists on one shared laptop, per-child progress, CSV export, adult-only teacher area. |

<div align="center">
<img src="docs/screenshots/arcade.png" alt="The Mini-Game Arcade with ten game cards" width="49%"> <img src="docs/screenshots/jom-mengaji.png" alt="Jom Mengaji: Surah Al-Ikhlas in Uthmani script" width="49%">
</div>

## Quick start

1. Download **`AmmaraGames.html`** (repository root, or `dist/AmmaraGames.html`).
2. **Double-click it.** It opens in Chrome or Edge. No installation, account or internet.
3. Press **MAIN / PLAY**. Move with the arrow keys, W-A-S-D, the on-screen arrows, or tap the floor to walk there.
4. Walk to a glowing station or a place with a coloured ring, then press the big yellow button (or Enter / E).

Tip: press **F11** for full screen on a classroom projector. Sound starts after the first tap (a browser rule).

If 3D graphics are not available, the game says so and offers **card mode** with the same questions.

## The world

* **Main hall:** the four learning stations of the chosen world, an X and O floor mat, and the front door.
* **West wing corners:** Jom Mengaji, ABC & Reading (with the robot friends Robo Danial and Robo Aisyah), Mini-Game Arcade, Art, Numbers, Colours & Shapes, Animals, Music, Wardrobe & Rewards, and a cosy Rest corner.
* **Garden:** front gate and fountain, flower garden, playground (slide, swings, seesaw, climbing dome), sandpit, hopscotch lawn, picnic park with the Nature Station.
* **Never lost:** a minimap, a big map where you tap a place to walk there, "Back to start", a "Back into the Preschool" button outside, and an arrow that always points the way. The whole map is checked by a path-finding test, so there are no dead ends.

## Mini-Game Arcade

Every game has the same simple frame: **Back · Help (with narration) · Restart · Sound · Home**, round stars, a celebration, and a sticker the first time it is finished. Difficulty follows the age group (2-3, 3-4, 4+). Each game can also be found at its place in the 3D world (for example the xylophone in the Music corner, the chalkboard outside).

| Game | What children practise |
|---|---|
| Clever Ruler | straight lines from dot to dot (with an optional ruler), X marks |
| X and O | turn-taking against a kind robot, or two players |
| Connect the Dots | number order 1, 2, 3… revealing a picture |
| Trace Letters & Numbers | A-Z, a-z, 0-9 and Hijaiyah letters |
| Memory Cards | visual memory with matching pairs |
| Shape Puzzle | shape recognition by drag-and-drop (or tap-tap) |
| Find It | visual search with themed baskets |
| Bead Patterns | AB, AAB, ABC patterns |
| Count & Sort | counting to 5/10/20 and sorting by colour or kind |
| Happy Xylophone | follow a song, copy a tune, or free play |

## Jom Mengaji

* **Huruf Hijaiyah:** all 28 letters with names, dot facts and look-alike families; exercises (match the letter, how many dots, which mark) and tracing.
* **Surah Pilihan:** 20 short surahs in the school's chosen order (Al-Fatihah, An-Nas, Al-Falaq … Al-'Alaq), with the real surah numbers.
* **Text integrity:** the Quran text is the Tanzil Uthmani text, copied **verbatim** and checked automatically against the source file on every test run (137 verses, byte for byte).
* **No computer recitation:** the narrator never reads Arabic, and no recitation audio is bundled (licences not confirmed), so there is no recitation Play button.
* **Review status:** the Islamic content has **not yet been reviewed by a qualified Quran teacher**. The app says so on every Jom Mengaji screen. The review checklist is in [`research/ISLAMIC-CONTENT-REVIEW.md`](research/ISLAMIC-CONTENT-REVIEW.md).

## Narrator, music and sound

* **Narrator:** uses the voices already installed on the computer, offline only. It prefers the child's language and voices whose names usually belong to female voices, with a slightly lighter default pitch. In **Voice & Sound** you can listen to each voice, pick one, and set speed, pitch (within a natural range) and volume. If no voice exists for a language, the app says so honestly and shows the text instead.
* **Music:** synthesised live with Web Audio: cheerful playroom, garden with birdsong, chiptune arcade, a quiet calm profile for Jom Mengaji, and a reward tune. Tracks fade, never overlap, and duck while the narrator speaks.
* **Separate volumes** for music, sound effects and narrator, plus one-tap mute everywhere.

## For teachers and parents

Hold the **Cikgu / Ibu Bapa** button for 1.5 s to open the teacher area.

* **Class list:** type one first name per line; children take turns on one laptop, and the game moves to the next child at the end.
* **Progress:** per child and per station: attempts, first-try results, stars, rewards.
* **CSV export:** the station records (18 columns, unchanged since 1.0) and a separate **activity file** for mini-games, Jom Mengaji and free questions (13 columns). UTF-8 with BOM for Excel, protected against spreadsheet formula injection.
* **Customise without programming:** open `AmmaraGames.html` in Notepad or VS Code and edit the `AMMARA_CONFIG` block near the top (game title, character, colours, questions, rewards, timings). A built-in checker skips anything broken and lists it under Teacher > Info.

## Privacy and safety

* No network code: no accounts, analytics, adverts, telemetry or external links. The end-to-end tests block and count every network request (zero).
* Names and results stay in this browser's local storage on this computer. Clearing site data or a private window removes them; download the CSV after lessons.
* Use first names or nicknames only. **Delete all data** (two confirmations) is in the teacher area.

## Deployment

The build output is a single static file, so any of these work:

| Target | How |
|---|---|
| Classroom laptop / USB stick | copy `AmmaraGames.html` and double-click |
| GitHub Pages | publish the repository root (or `dist/`); the page is `AmmaraGames.html` |
| Any static host (Netlify, Vercel, S3, school intranet) | upload `dist/AmmaraGames.html`; no server code, no environment variables |

Recommended browsers: current **Chrome** or **Edge** with graphics acceleration on.

## Development

Requirements: Node.js 20+ and Chrome or Edge (for the browser tests).

```bash
npm install
npm run build            # writes AmmaraGames.html + dist/AmmaraGames.html, fails on network-looking code
npm test                 # unit tests (rules, records, layout, narrator, Quran text, icons)
npm run e2e              # original 41 end-to-end checks in Chrome   (npm run e2e:edge for Edge)
npm run e2e:upgrade      # 13 checks for the 3D world, narrator, arcade, Jom Mengaji (…:edge for Edge)
npm run play-games       # plays all ten mini-games with real mouse input and saves screenshots
npm run tour             # screenshots of every corner of the 3D world
npm run report           # regenerates TEST-REPORT.md from the last results
npm run preview          # local server on http://127.0.0.1:5500/
```

### Project structure

```
src/
  config/game-config.js     teacher-editable content: worlds, stations, questions, rewards, settings
  data/                     quran-data.js (generated from Tanzil), hijaiyah.js
  engine/
    core/                   validator, progress & CSV, collision, A* navigation grid (no browser needed)
    world/                  Three.js world: layout (single source of truth), building, zones, yard, NPCs, stations
    minigames/              logic.js (pure, unit-tested rules) + the ten game screens
    ui/                     menus, HUD, map, voice & sound panel, arcade frame, Jom Mengaji
    narrator.js, audio.js   offline voice service, synthesised music and effects
    game.js                 state machine (MAIN_MENU, PLAYROOM, QUIZ, ARCADE, MINIGAME, ISLAMIC, …)
  styles/                   main.css, upgrade.css, games.css
tests/unit, tests/e2e       Node unit tests and puppeteer browser tests
tools/                      build, tours, performance, report
research/                   content research, Islamic content review, asset manifest, upgrade report
licenses/                   third-party licences
```

## Quality and testing

See [`TEST-REPORT.md`](TEST-REPORT.md) (generated from the real runs, not typed by hand) and [`research/UPGRADE-RESEARCH-REPORT.md`](research/UPGRADE-RESEARCH-REPORT.md).

What is verified automatically: game rules, records and CSV, reachability of every place on the map, collisions, all ten games played to the end, Quran text identical to the source, narrator voice choice (with a stub speech engine), offline operation, no console errors, and layouts at phone, tablet and projector sizes, in Chrome and Edge.

What is **not** verified: how the narrator voice actually sounds on your computer (nobody listened to it), the music on real speakers, physical touch screens, other browsers, slow school laptops, real children aged 2-4, and review by a qualified Quran teacher.

## Known limitations

* The narrator depends on the voices installed on the computer; many computers have no offline Malay voice (the app then uses Indonesian if present, and says so, or shows text only).
* Weak graphics chips may run the big world slowly; the game then lowers its graphics quality automatically (Teacher > Settings > Graphics also has a Light mode).
* Tracing checks the shape, not the stroke order. Hijaiyah letter names have no audio.
* Records are per browser and per file location.

## Credits and licences

* Fredoka font: The Fredoka Project Authors, SIL Open Font License 1.1.
* Noto Naskh Arabic font: The Noto Project Authors, SIL Open Font License 1.1.
* Quran text: Tanzil Project (tanzil.net), Uthmani text, Creative Commons Attribution 3.0, used verbatim.
* Three.js: MIT licence.
* Everything else (3D world, characters, pictures, music, sounds) was created for this project. See [`research/ASSET-MANIFEST.md`](research/ASSET-MANIFEST.md) and [`licenses/`](licenses/).

Project code and original artwork: **MIT License**, © 2026 Mohamad Fildza bin Azman (see [`LICENSE`](LICENSE)). Third-party parts keep their own licences listed above.
