# Jom Mengaji: Islamic content review record

Written for: the teacher, parent or qualified Quran teacher (*ustaz / ustazah*) who will check this content before it is presented to children as religiously verified.

**Overall status: NOT YET RELIGIOUSLY VERIFIED.** The developer checked the Quran text mechanically against its source (details below). No qualified reviewer has checked any of the Islamic content. Every Jom Mengaji screen shows this in a note at the bottom.

## 1. What is in the app

| Part | Where | Status |
|---|---|---|
| Quran text of 20 short surahs | `src/data/quran-data.js` (generated, do not edit) | Verbatim copy of the Tanzil Uthmani text. Machine-checked, see section 2. **Awaiting human review of how it is displayed.** |
| Bismillah heading | `BISMILLAH` = Tanzil 1:1 | Shown above surahs other than Al-Fatihah. In Al-Fatihah, the Bismillah is verse 1 (as in the Tanzil text). |
| Surah names | `display` (Malay/Latin spelling chosen by the developer), `ar` (Tanzil metadata) | Latin spellings are common forms and need review. |
| 28 Hijaiyah letters | `src/data/hijaiyah.js` | Developer-written: letter names in common Malay spelling, dot counts and positions, look-alike families. **Awaiting review.** |
| Harakat (8 marks) | `src/data/hijaiyah.js` | Names and simple descriptions ("bunyi a"). **Awaiting review.** |
| Exercises | `src/engine/ui/islamic.js` | Original exercises (match the letter, which letter has N dots, which syllable has a given mark, tracing). Inspired by the step-by-step idea of Iqra' books; no Iqra' page, wording or artwork was copied. |
| Recitation audio | none | **Not included** (section 4). There is no Play button for recitation anywhere. |
| Translation / meaning | none | **Not included** (section 5). |

## 2. How the Quran text was obtained and checked

* **Source:** Tanzil Project, Quran text type *Uthmani*, plain text with `sura|aya|text` lines, downloaded 2026-10-25 from tanzil.net. The file is kept unchanged in `research/sources/tanzil/quran-uthmani.txt` (SHA-256 `6933e133…ec5f`, recorded in `QURAN_SOURCE.fileSha256`).
* **Licence:** Creative Commons Attribution 3.0 with the Tanzil terms: verbatim copies allowed, **changing the text is not allowed**, the source must be named with a link to tanzil.net, and the copyright notice must be kept. The full notice is kept in `QURAN_NOTICE`, in `licenses/TANZIL-QURAN-TEXT-NOTICE.txt` and in the licence block at the end of `AmmaraGames.html`. Each surah screen and the "About this content" screen name the source.
* **Generator:** `tools/build-quran-data.mjs` copies the 137 verses of the 20 surahs and records a SHA-256 hash per surah. It never edits a character.
* **Automatic checks** (`tests/unit/quran.test.mjs`, run on every `npm test`):
  1. the source file hash equals the hash recorded at download; the file has all 6,236 verses;
  2. the 20 surahs are in the school's display order with their real numbers and verse counts;
  3. every verse in the app is byte-for-byte identical to the source file;
  4. the Bismillah split of verse 1 is lossless (`prefix + " " + body === text`);
  5. the per-surah hashes match;
  6. the Jom Mengaji screen code never passes verse text to the narrator.
* **End-to-end check:** `tests/e2e/run-e2e-upgrade.mjs` (U10) opens surahs 1, 112 and 96 in a real browser and compares the displayed text with the data, checks the Bismillah heading and the embedded Arabic font, checks that no recitation button exists, and checks that nothing in Arabic script was sent to the speech engine.
* **Independent comparison:** the same 137 verses were fetched once from the quran.com API (Uthmani) and compared (`research/islamic/crosscheck.json`, not bundled). Result: **136 of 137 verses identical; 0 differences in the consonant skeleton.** The one difference is in marks only.

### Known source detail (not changed)

In the Tanzil file, verse **97:1** (Al-Qadr) starts with a Bismillah whose first letter carries a *shaddah* (`بِّسْمِ`) where the other surahs have `بِسْمِ`. Because the text may not be changed, the app keeps it as is. It affects display only in this way: Al-Qadr shows the standard Bismillah heading (from 1:1) and then the verse body after the Bismillah. **Reviewer: please confirm this display is acceptable.**

## 3. Display sequence

The list follows the order requested by the school: Al-Fatihah (1), An-Nas (114), Al-Falaq (113), Al-Ikhlas (112), Al-Masad (111), An-Nasr (110), Al-Kafirun (109), Al-Kawthar (108), Al-Ma'un (107), Quraysh (106), Al-Fil (105), Al-Humazah (104), Al-'Asr (103), At-Takathur (102), Al-Qari'ah (101), Al-'Adiyat (100), Az-Zalzalah (99), Al-Bayyinah (98), Al-Qadr (97), Al-'Alaq (96). The screen says that this is the school's sequence and not the order of the Mushaf, and shows each real surah number.

## 4. Recitation audio: not included

No recording could be confirmed as licensed for redistribution inside an offline file, so none is bundled. The app never uses text-to-speech or a pitch-changed narrator voice for Quran text. The narrator also refuses any text in Arabic script by itself (`narrator.js`, unit-tested), so Hijaiyah letter names are not spoken either. Screens say: "Letter sounds and Quran recitation are not included. Please ask a teacher or parent to say them together."

To add recitation later: obtain written permission (or a licence that allows offline redistribution) for specific files, record the licence in `research/ASSET-MANIFEST.md`, have a qualified reviewer approve the reciter and the files, and then add a player.

## 5. Translation: not included

The Tanzil Malay translation (Basmeih) is offered for non-commercial use only, which does not fit an app that may be distributed by schools without further checks, so it is not bundled. The surah screen has room for a meaning line that only appears if a licensed, reviewed translation is added to the data.

## 6. What the reviewer is asked to check

- [ ] Arabic display of each of the 20 surahs (font, marks, verse markers), especially 97:1.
- [ ] The display order and the Malay/Latin surah names.
- [ ] Letter names (e.g. Tha / Tha (tebal), Ha / Ha (hujung)), dots facts and families in `hijaiyah.js`.
- [ ] Harakat names and the simple sound descriptions.
- [ ] The exercises are suitable for ages 2-4+ and teach nothing incorrect.
- [ ] The notes shown to parents (no audio, not yet reviewed).

Reviewer name, qualification, date and decision: *(empty: not yet reviewed)*.
