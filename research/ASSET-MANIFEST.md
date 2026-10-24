# Asset manifest (AmmaraGames 2.0)

Written for: anyone checking what is inside `AmmaraGames.html` and under which licence, before distributing it.

Everything below is inside the single offline file. Nothing is downloaded at run time (the build fails a check if it finds network-looking code, and the end-to-end tests block and count every network request).

| Asset | Origin | Licence | Where | Notes |
|---|---|---|---|---|
| Fredoka (variable, Latin) | The Fredoka Project Authors, via `@fontsource-variable/fredoka` 5.3.0 | SIL OFL 1.1 | embedded as base64 woff2 | `licenses/OFL-1.1-Fredoka.txt` |
| Noto Naskh Arabic 500 + 700 (Arabic subset) | The Noto Project Authors, via `@fontsource/noto-naskh-arabic` 5.3.0 | SIL OFL 1.1 | embedded as base64 woff2, family name `AG Naskh` | `licenses/OFL-1.1-NotoNaskhArabic.txt`. Covers the Quranic marks used by the 20 surahs (checked with fontTools during development). |
| Quran text, 20 surahs (137 verses) | Tanzil Project, Uthmani text 1.1 | CC BY 3.0 + Tanzil terms (verbatim only) | `src/data/quran-data.js` | `licenses/TANZIL-QURAN-TEXT-NOTICE.txt`; see `research/ISLAMIC-CONTENT-REVIEW.md` |
| Three.js 0.186.1 | three.js authors | MIT | bundled engine | `licenses/MIT-three.js.txt` |
| 3D world: building, 11 indoor corners, garden, playground, robots, furniture, trees | made in code for this project (`src/engine/world/*`) | project | built at start-up | no models or textures are downloaded; textures are painted on canvases |
| Pictures (~300 SVG icons, letters, shapes) | drawn in code for this project (`src/engine/art/*`) | project | built at run time | |
| Music and sound effects | synthesised with Web Audio for this project (`src/engine/audio.js`) | project | generated live | six music profiles: playroom (cheerful/calm), garden, arcade, Islamic-calm, reward |
| Hijaiyah letter data, exercises | written for this project (`src/data/hijaiyah.js`) | project | | awaiting qualified review |
| Narrator voices | **not included**: the browser's installed offline voices are used | owned by the operating system vendor | | only voices with `localService === true` are used |

## Deliberately not included

| Item | Why |
|---|---|
| Quran recitation recordings | redistribution permission not confirmed |
| Quran translation (Malay) | available licence is non-commercial only |
| Online / cloud text-to-speech | the app must work offline and must not send text anywhere |
| Recorded letter pronunciations | no verified recordings |
| Any analytics, adverts, external links | child privacy |
