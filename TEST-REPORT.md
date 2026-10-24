# AmmaraGames: test report

Generated 2026-10-24T20:50:35.758Z by `npm run report` from the raw results of the last runs. Nothing in this file is typed by hand except the sections marked "(written by hand)".

## Environment

* Machine: Windows 11, Intel Core i7-8565U (4 cores), Intel UHD Graphics 620, 8 GB RAM. This laptop was busy with other work during the runs, so frame rates in the e2e runs are lower than an idle machine.
* Chrome: Chrome/156.0.8078.48
* Edge: Edg/156.0.4314.42
* Browsers were driven with puppeteer-core in headless mode with the real GPU. The game file was opened as `file:///…/AmmaraGames.html` (double-click equivalent). Offline mode was switched on and every non-file request was blocked and counted.

## Summary

| Suite | Result |
|---|---|
| Unit tests (`npm test`) | 62 of 62 passed, 0 failed |
| End-to-end, Chrome | 41 passed, 0 failed |
| End-to-end, Edge | 41 passed, 0 failed |
| Upgrade checks (2.0), Chrome | 13 passed, 0 failed |
| Upgrade checks (2.0), Edge | 13 passed, 0 failed |

## Upgrade checks: 3D world, narrator, arcade, Jom Mengaji (2.0)

From `tests/e2e/run-e2e-upgrade.mjs`. The speech engine is replaced by a recording stub with four fake voices (two English, one offline Malay, one online Malay), so these checks prove which voice and settings the game *chooses*; they do not prove how any real voice sounds.

| Id | Check | Chrome | Edge | What was measured (Chrome) |
|---|---|---|---|---|
| U1 | Opens offline and shows the new menu buttons (arcade, Jom Mengaji, voice settings) | PASS | PASS | menu ok |
| U2 | The 3D world is a whole preschool + garden: 17 areas, door, robot friends seated | PASS | PASS | 17 areas, map 120 x 44 m, robots stay seated |
| U3 | Every indoor corner and garden area can be visited, with its own music | PASS | PASS | mengaji:islamic:42fps arcade:arcade:36fps music:playroom:36fps rest:calm:41fps gate:yard:44fps playground:yard:39fps |
| U4 | Walking out of the front door and back in (door opens, "back inside" button, guide arrow) | PASS | PASS | out through the door and back, no collision problems |
| U5 | Robot friend says hello with the narrator (Malay voice, offline only) | PASS | PASS | "Hai! Jom belajar bersama!" by Microsoft Rizwan - Malay (Malaysia), pitch 1.15 |
| U6 | Voice & Sound panel: real voice list, honest labels, preview, sliders, mute | PASS | PASS | voices listed, preview used Zira, mute works |
| U7 | Map: opens, and tapping "front door" walks there | PASS | PASS | walked to the front door from the map |
| U8 | Mini-game arcade: all 10 games can be played to the end (mouse/touch-style input) | PASS | PASS | 10 games finished, 10 stickers |
| U9 | Every game is recorded for the teacher (separate from the station records) | PASS | PASS | 10 activity records |
| U10 | Jom Mengaji: 20 surahs in the school order with real numbers; text identical to the Tanzil data | PASS | PASS | 1:7 ayat, 112:4 ayat, 96:19 ayat; no recitation button; nothing Arabic spoken |
| U11 | Jom Mengaji exercises can be completed (letters, dots, marks) and are recorded | PASS | PASS | match, dots, harakat finished |
| U12 | Phone-size screens: arcade, a game and the Islamic centre stay on screen | PASS | PASS | 390x844, 844x390, 1024x600 ok |
| U13 | No JavaScript errors and no network requests during all of the above | PASS | PASS | console errors 0; external requests 0 |

## Specification checklist (section 17)

| # | Check | Chrome | Edge | Test ids |
|---|---|---|---|---|
| 1 | The HTML file opens locally | PASS | PASS | 1 |
| 2 | The game works without internet access | PASS | PASS | 2 |
| 3 | The main menu renders correctly | PASS | PASS | 3 |
| 4 | The 3D scene initialises successfully | PASS | PASS | 4 |
| 5 | The character moves using arrow keys and WASD | PASS | PASS | 5 |
| 6 | On-screen movement controls work | PASS | PASS | 6 |
| 7 | Collision prevents movement through walls and furniture | PASS | PASS | 7 |
| 8 | The camera follows smoothly | PASS | PASS | 8 |
| 9 | Each learning station is reachable | PASS | PASS | 9 |
| 10 | The interaction button opens the correct quiz | PASS | PASS | 10 |
| 11 | All three answer options are selectable | PASS | PASS | 11 |
| 12 | Correct answers trigger the appropriate reward | PASS | PASS | 12 |
| 13 | Incorrect answers allow another attempt | PASS | PASS | 13 |
| 14 | No incorrect-answer penalty is applied | PASS | PASS | 14 |
| 15 | All four default stations can be completed | PASS | PASS | 15 |
| 16 | The final celebration appears | PASS | PASS | 16 |
| 17 | World selection works | PASS | PASS | 17, 17.1 |
| 18 | The rewards inventory displays earned items | PASS | PASS | 18 |
| 19 | Character customisation updates the character | PASS | PASS | 19 |
| 20 | Music and sound effects can be muted | PASS | PASS | 20, 20.1, 20.2 |
| 21 | Audio failures do not break gameplay | PASS | PASS | 21 |
| 22 | Learner selection works | PASS | PASS | 22 |
| 23 | Scores and attempt counts are accurate | PASS | PASS | 23 |
| 24 | Moving between learners does not mix records | PASS | PASS | 24 |
| 25 | CSV export downloads a valid file | PASS | PASS | 25 |
| 26 | CSV encoding and formula-injection protection work | PASS | PASS | 26 |
| 27 | Reset and exit confirmations work | PASS | PASS | 27, 27.1 |
| 28 | Window resizing does not break the interface | PASS | PASS | 28 |
| 29 | No uncaught JavaScript errors in the tested flows | PASS | PASS | 29 |
| 30 | No external requests are required during offline gameplay | PASS | PASS | 2 |

## Additional tests

| Id | Test | Chrome | Edge |
|---|---|---|---|
| 4.1 | PLAY starts the default adventure in the 3D playroom | PASS | PASS |
| 21.1 | Settings and info tabs render (privacy text, diagnostics, storage status) | PASS | PASS |
| 36 | Persistence: reloading keeps settings and the class session | PASS | PASS |
| 31 | Reduced-motion preference is respected | PASS | PASS |
| 33 | Language switch to English changes menu, quiz text and picture labels | PASS | PASS |
| 34 | Tutorial is skippable and does not come back | PASS | PASS |
| 35 | Pause menu: resume, Escape and return-to-menu work; movement is frozen while paused | PASS | PASS |
| 32 | Without WebGL a helpful message appears and card mode is playable | PASS | PASS |

## Detail of the Chrome run

| Id | Test | Result | What was measured |
|---|---|---|---|
| 1 | The HTML file opens locally (file://) and leaves the loading screen | PASS | ready in 5525 ms |
| 3 | Main menu renders (logo, PLAY, worlds, teacher, sound, language, age) | PASS | title=AmmaraGames |
| 4 | 3D scene initialises (WebGL renderer, meshes, draw calls) | PASS | meshes=421 calls=249 canvas=1366x768 |
| 20.1 | Audio waits for a user gesture (no autoplay before interaction) | PASS | {"state":"not-started","available":true,"music":false,"scene":"playroom","song":"cheerful"} |
| 4.1 | PLAY starts the default adventure in the 3D playroom | PASS | run=R1 audio=running music=true |
| 20.2 | Music starts after the first tap and plays through Web Audio | PASS | {"state":"running","available":true,"music":true,"scene":"playroom","song":"cheerful"} |
| 5 | Character moves with arrow keys and WASD in all four directions | PASS | ArrowUp:2.03 ArrowDown:2.13 ArrowLeft:2.04 ArrowRight:2.04 KeyW:2.05 KeyS:2.05 KeyA:1.97 KeyD:1.97 |
| 6 | On-screen D-pad buttons move the character (pointer press and hold) | PASS | up:2.05 down:2.04 left:1.96 right:2.05 |
| 7 | Collision: walls, furniture and stations cannot be walked through | PASS | left=-57.55 cabinet z>=-8.25 station gap ok, violations=0, maxPenetration=0.0000 |
| 8 | Camera follows the player smoothly (no snapping, per-frame measurement) | PASS | 60 frames: camera moved 4.06 m, fastest 4.3 m/s (player 4.4), trailing 3.80 m |
| 10 | INTERACT appears near station 1 and opens the correct quiz | PASS | quiz abc-01, header "Stesen 1" |
| 11 | All three answer options are present, enabled and labelled with pictures | PASS | C / B / A |
| 12 | Correct answer: celebration, quiz closes by itself in about 1 s, reward is worn | PASS | answer letter:A; quiz closed after ~1246 ms; bow worn; stars 1 |
| 13 | Wrong answer keeps the quiz open, dims that choice, shows a gentle hint | PASS | hint: "Hampir! Cuba lagi 💛 Kira dengan jari: satu… dua!" |
| 14 | No penalty: stars and progress unchanged by mistakes; attempts are counted | PASS | station 2: attempts=2, firstTry=false, stars 1→2 |
| 9 | Every station is reachable (keyboard steering and tap-to-walk) | PASS | station 3 reached by tap-to-walk (auto-opened its quiz); station 4 by keyboard |
| 15 | All four default stations can be completed | PASS | run R1 complete; attempts 1,2,1,1 |
| 16 | Final celebration screen with stars and earned rewards | PASS | Syabas, Pemain!; 4 stars; rewards worn: partyHat, bow, starGlasses, backpack |
| 17 | World selection works and loads that world’s stations and questions | PASS | 16 worlds listed; animals questions ani-01,ani-12,ani-21,ani-29 |
| 17.1 | Age selection changes the question pool (4+ gets harder questions) | PASS | 2-3 run ok=true; 4+ numbers run: num-07,num-11,num-20,num-24 |
| 18 | Rewards inventory (sticker book) shows earned items | PASS | 0 daripada 52 pelekat ·  4 bintang |
| 19 | Customisation really changes the 3D character | PASS | hat off/on, hijab/pigtails, sky dress — meshes 52→450 |
| 20 | Sound and music can be muted and the choice is saved | PASS | mute + unmute + music toggle, saved in local storage |
| 27.1 | Finish early asks for confirmation; cancel keeps playing; confirm saves partial score | PASS | run R3 saved as ended-early |
| 22 | Teacher area behind a press-and-hold gate; class list session starts | PASS | 4 nama sedia. 2 baris kosong diabaikan. 0 nama berulang ditanda. / Sesi dimulakan untuk 4 murid. |
| 23 | Learner list, switching learner, and accurate per-learner scores | PASS | learners: Ali, Siti, =CMD(), +evil; Ali station 1 attempts=2 |
| 24 | Next learner via the decision screen; records never mix | PASS | Ali: 2 attempts, not first try, 1 star / Siti: 1 attempt, first try, 1 star |
| 25 | CSV export downloads a real file (UTF-8 with BOM, 18 columns, all rows) | PASS | AmmaraGames_rekod_all_2026-10-25_0439.csv: 20 rows; "20 baris disimpan ke fail AmmaraGames_rekod_all_2026-10-25_0439.csv." |
| 26 | CSV protects names starting with = + - @ (formula injection) and quotes fields | PASS | AmmaraGames_rekod_session_2026-10-25_0439.csv: '=CMD() exported as "'=CMD()", no cell starts with = + - @ |
| 27 | Reset and delete-all ask for confirmation (cancel keeps data, confirm clears) | PASS | reset cancel ok; delete needs two confirmations; storage emptied |
| 21.1 | Settings and info tabs render (privacy text, diagnostics, storage status) | PASS | info shows 392 valid questions and storage status |
| 28 | Window resizing keeps menus, HUD and quiz on screen | PASS | 1920x1080: hud ok canvas ok; 1280x720: hud ok canvas ok; 1024x600: hud ok canvas ok; 800x1280: hud ok canvas ok; 844x390: hud ok canvas ok; 390x844: hud ok canv |
| 2 | Works offline: page ran with network disabled; no external request attempted | PASS | offline mode on for the whole run; 0 external requests |
| 29 | No uncaught JavaScript errors during the tested flows | PASS | console errors 0; warnings 0 |
| 36 | Persistence: reloading keeps settings and the class session | PASS | session S1, 1 runs restored |
| 21 | Game still works when Web Audio is unavailable | PASS | audio=unavailable; quiz completed; toast: Bunyi tidak tersedia pada pelayar ini. Permainan tetap boleh dimainkan. / Kamu dapat Reben |
| 31 | Reduced-motion preference is respected | PASS | body.reduced-motion set from prefers-reduced-motion |
| 33 | Language switch to English changes menu, quiz text and picture labels | PASS | "Which one is the letter A?" / C, B, A |
| 34 | Tutorial is skippable and does not come back | PASS | skip saved; not shown again after reload; language stayed English: Finish |
| 35 | Pause menu: resume, Escape and return-to-menu work; movement is frozen while paused | PASS | frozen while paused; home returns to the main menu with the 3D mode set to menu |
| 32 | Without WebGL a helpful message appears and card mode is playable | PASS | message shown; station 1 completed in card mode |

## Performance (measured, Chrome headless on the machine above)

* Idle playroom (`npm run perf`): about 43-47 fps at the default medium quality, 219 draw calls, about 216k triangles; about 47 fps at low quality (133 draw calls). During the e2e run the same machine dropped to 12-28 fps because the test runner, the browser and other programs competed for the CPU and GPU.
* Adaptive quality (`node tools/adaptive-check.mjs`): with the CPU slowed 6 times the game switched itself to low quality (shadows off) after about 19 seconds. It was not tested on a real slow school laptop.

## Visual review

Screenshots of every screen are in `qa/screenshots/chrome` and `qa/screenshots/edge` (main menu, playroom, near station, quiz, wrong answer, celebration, session complete, world select, animals world, sticker book, wardrobe, finish-early confirmation, teacher area tabs, resize tests, English quiz, pause menu, no-WebGL card mode). Visual defects found and fixed during review (written by hand): menu overlapped by the 3D scene, HUD buttons off-screen on phones, unfriendly "angry" zebra, unrecognisable fork, letters with closed counters, quiz picture revealing the answer, next station out of view, furniture wedges that could pin the character, D-pad blocked by the tutorial layer.

## NOT TESTED (written by hand)

* **Real touch screens and tablets.** Pointer presses and tap-to-walk were tested with a mouse. Pointer events are the same API, but no physical touch device was used.
* **Real speakers.** The Web Audio graph was confirmed running (state "running", music playing) and the mute logic was tested, but nobody listened to the music or effects, so loudness, pleasantness and balance are unverified.
* **The narrator's real voice.** Voice choice, settings, mute, queueing and the Arabic refusal were tested with a stub; nobody listened to a real voice, so whether it sounds cute, friendly or female is not verified. Choose a voice by ear in Voice & Sound.
* **Islamic content review.** The Quran text is machine-verified against Tanzil; no qualified Quran teacher has reviewed the content (see research/ISLAMIC-CONTENT-REVIEW.md).
* **Other browsers** (Firefox, Safari, older Chrome/Edge) and other operating systems.
* **A slow school laptop with an integrated GPU older than the one used here**, and projector resolutions other than the sizes listed in test 28.
* **Screen readers**, high-contrast mode and keyboard-only use of the child screens beyond the arrow/WASD/Enter/Esc/1-3 keys that were exercised.
* **Long sessions** (hours) and very large classes (the class list was tested with 4 names; the limit is 60).
* **Real children.** Nobody aged 2-4 has played the game or the ten mini-games; difficulty, wording and the length of the tutorial are unvalidated.
* **Content review** by a teacher and a native Bahasa Melayu speaker (see `research/RESEARCH-REPORT.md`).
