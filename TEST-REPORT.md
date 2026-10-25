# AmmaraGames: test report

Generated 2026-10-25T21:49:46.541Z by `npm run report` from the raw results of the last runs. Nothing in this file is typed by hand except the sections marked "(written by hand)".

## Environment

* Machine: Windows 11, Intel Core i7-8565U (4 cores), Intel UHD Graphics 620, 8 GB RAM. This laptop was busy with other work during the runs, so frame rates in the e2e runs are lower than an idle machine.
* Chrome: Chrome/156.0.8078.48
* Edge: Edg/156.0.4314.42
* Browsers were driven with puppeteer-core in headless mode with the real GPU. The game file was opened as `file:///…/AmmaraGames.html` (double-click equivalent). Offline mode was switched on and every non-file request was blocked and counted.

## Summary

| Suite | Result |
|---|---|
| Unit tests (`npm test`) | 98 of 98 passed, 0 failed |
| End-to-end, Chrome | 41 passed, 0 failed |
| End-to-end, Edge | 41 passed, 0 failed |
| Upgrade checks (2.0), Chrome | 13 passed, 0 failed |
| Upgrade checks (2.0), Edge | 13 passed, 0 failed |
| Kid Lock / web app checks, Chrome | 9 passed, 0 failed |
| Kid Lock / web app checks, Edge | 9 passed, 0 failed |
| Town checks (2.1–2.2), Chrome | 23 passed, 0 failed |
| Town checks (2.1–2.2), Edge | 23 passed, 0 failed |
| Picture audit (every picture the game can show) | 513 pictures, 0 problems |

## Upgrade checks: 3D world, narrator, arcade, Jom Mengaji (2.0)

From `tests/e2e/run-e2e-upgrade.mjs`. The speech engine is replaced by a recording stub with four fake voices (two English, one offline Malay, one online Malay), so these checks prove which voice and settings the game *chooses*; they do not prove how any real voice sounds.

| Id | Check | Chrome | Edge | What was measured (Chrome) |
|---|---|---|---|---|
| U1 | Opens offline and shows the new menu buttons (arcade, Jom Mengaji, voice settings) | PASS | PASS | menu ok |
| U2 | The 3D world is a whole preschool + garden: 17 areas, door, robot friends seated | PASS | PASS | 17 areas, map 4200 x 4200 m, robots stay seated |
| U3 | Every indoor corner and garden area can be visited, with its own music | PASS | PASS | mengaji:islamic:32fps arcade:arcade:29fps music:playroom:28fps rest:calm:24fps gate:yard:23fps playground:yard:22fps |
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

## Kid Lock and installable web app (2.0)

From `tests/e2e/run-e2e-lock.mjs`: the built `dist/` folder is served over http under a sub-path (like GitHub Pages), the service worker caches it, then the network is switched off and the game still opens. Touch events are simulated with the browser's touch API, not a physical screen.

| Id | Check | Chrome | Edge | What was measured (Chrome) |
|---|---|---|---|---|
| L1 | Served over http: manifest, icons and service worker are found and the worker takes control | PASS | PASS | manifest ok, cache ammaragames-9b56a39d0b |
| L2 | Offline: after one visit the game opens with the network switched off | PASS | PASS | opened offline from the service-worker cache |
| L3 | Ghost touches: edge and palm touches are ignored, a normal tap works | PASS | PASS | 3 edge touches ignored ({"edge":3}), normal tap passed |
| L4 | Zoom, refresh, print and long-press menu are blocked | PASS | PASS | F5, Ctrl+R, Ctrl+P, Ctrl+zoom, context menu, Ctrl+wheel blocked |
| L5 | Full screen starts on the first tap (and the lock can be turned off by an adult) | PASS | PASS | full-screen requested 1x, active=true |
| L6 | Reload in the middle of play carries on in the same place (no menu, same child, same spot) | PASS | PASS | back in art at -26.5, 1.9 as Pemain |
| L7 | Reload inside the arcade returns to the arcade; going Home on purpose clears the resume | PASS | PASS | arcade resumed; menu stays menu after leaving on purpose |
| L8 | Adult switch: turning Kid Lock off in Teacher > Settings stops the blocking and the resume | PASS | PASS | lock off: shortcuts free, resume cleared |
| L9 | No JavaScript errors during the lock and web-app flows | PASS | PASS | console errors 0 |

## Town: Bandar Ceria, highway, train, shops and books (2.1–2.2)

From `tests/e2e/run-e2e-city.mjs` with real keyboard input: the child rides a unicorn, drives a car, calls and rides a bus to the next stop, waits for and rides the elevated train to the next station, greets a school child, opens landmark quizzes, travels with the town map, comes home with one button, picks up a coin, buys and reads a picture book aloud to the end, buys clothes that are worn at once, is told kindly when coins are short, eats a lollipop (with a teeth tip), reads a fact board, rides the roller coaster, sees cars stop at red lights, reads the real-time clock and watches a story at the cinema. The plan itself (lots, colliders, routes, highway lanes, train line and pillars, pavement coins and trees, traffic-light phases, the roller-coaster track, the map groups) is covered by `tests/unit/city.test.mjs`, and the books, facts, shops and coin records by `tests/unit/town-content.test.mjs`.

| Id | Check | Chrome | Edge | What was measured (Chrome) |
|---|---|---|---|---|
| C1 | The town is big (over 4 km x 4 km) and alive: traffic, school children and buses | PASS | PASS | 4200 x 4200 m (17.6 km²), 36 cars, 64 children, 4 buses, 10 squares loaded |
| C2 | Out of the garden gate into the town: campus area, then a street with town music | PASS | PASS | city-shophouse with "town" music |
| C3 | Ride a unicorn from the stable: it is faster than walking, and getting off is safe | PASS | PASS | rode 11.8 m in 1.8 s, got off |
| C4 | Drive a car out of the car park onto the road | PASS | PASS | drove 25.3 m (to -83, 61) |
| C5 | Call the bus at the preschool stop, ride it to the next stop and get off there | PASS | PASS | rode from tadika to pasar, got off at the stop |
| C6 | Say hello to a school child walking on the pavement | PASS | PASS | they said "Hai! Saya nak pergi sekolah!" |
| C7 | Landmarks: own area, music and learning place (mosque, zoo quiz) | PASS | PASS | mosque: islamic music; zoo: "Soalan haiwan!" opened a question |
| C8 | Town map: opens on the town tab, lists every landmark, and a tap travels there | PASS | PASS | 49 places listed, trip to the theme park ok |
| C9 | The "back to preschool" button brings the child home from anywhere in the town | PASS | PASS | home at 11.8, -1.0 (indoor) |
| C10 | Streaming: far corners load and unload; frame cost stays bounded | PASS | PASS | city-park:13sq/123calls/29fps city-forest:11sq/122calls/51fps city-beach:9sq/115calls/53fps city-beach:11sq/128calls/51fps city-terrace:9sq/151calls/51fps city-campus:12s |
| C12 | The highway: four lanes with fast cars, its own area, lamps and signs | PASS | PASS | 24 highway cars, area "city-highway" |
| C13 | Train: wait at Stesen Tadika, the train comes, ride the elevated line to the next station, get off there | PASS | PASS | waited 29 s, rode to stn-barat, got off at its ticket spot |
| C14 | The two trains keep going round and never run into each other | PASS | PASS | closest 611 m apart |
| C15 | Coins on the pavement: arriving on one picks it up and the counter goes up | PASS | PASS | coins 5 -> 6; 186 coins near the child |
| C16 | Bookshop: buy a picture book with coins, it opens, read it to the end (+1 coin), it is in My Bag | PASS | PASS | paid 2 coins, read 5 pages aloud, +1 coin, book kept in My Bag |
| C17 | Boutique: clothes bought with coins are worn straight away | PASS | PASS | red cap bought and worn |
| C18 | Sweet shop: not enough coins says so kindly; a lollipop can be bought and eaten (with a teeth tip) | PASS | PASS | "Manisnya! Makan sedikit sahaja, dan jangan lupa gosok gigi." |
| C19 | Fact board: reading it the first time gives a coin, the second time not | PASS | PASS | coins 1 -> 2, then no more |
| C20 | Roller coaster: get in at the station, ride one full lap up and down, get out by itself | PASS | PASS | highest point 11.2 m, back on the ground at 504, 223 |
| C21 | Traffic lights change colour and town cars stop at red | PASS | PASS | 52 traffic lights nearby, up to 18 cars waiting at red |
| C22 | Clock tower shows the real time; the cinema shows a story | PASS | PASS | clock 5:29; cinema story opened |
| C23 | Busy streets: more cars, school children and grown-ups; the town map lists every place in groups | PASS | PASS | 36 cars, 64 people; map: 5 groups, 49 places |
| C11 | No errors, no network requests, no collision violations | PASS | PASS | clean |

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
| 1 | The HTML file opens locally (file://) and leaves the loading screen | PASS | ready in 8166 ms |
| 3 | Main menu renders (logo, PLAY, worlds, teacher, sound, language, age) | PASS | title=AmmaraGames |
| 4 | 3D scene initialises (WebGL renderer, meshes, draw calls) | PASS | meshes=1653 calls=470 canvas=1366x768 |
| 20.1 | Audio waits for a user gesture (no autoplay before interaction) | PASS | {"state":"not-started","available":true,"music":false,"scene":"playroom","song":"cheerful"} |
| 4.1 | PLAY starts the default adventure in the 3D playroom | PASS | run=R1 audio=running music=true |
| 20.2 | Music starts after the first tap and plays through Web Audio | PASS | {"state":"running","available":true,"music":true,"scene":"playroom","song":"cheerful"} |
| 5 | Character moves with arrow keys and WASD in all four directions | PASS | ArrowUp:2.13 ArrowDown:1.89 ArrowLeft:2.05 ArrowRight:2.06 KeyW:2.29 KeyS:2.04 KeyA:2.13 KeyD:1.97 |
| 6 | On-screen D-pad buttons move the character (pointer press and hold) | PASS | up:2.05 down:2.04 left:2.04 right:2.04 |
| 7 | Collision: walls, furniture and stations cannot be walked through | PASS | left=-2099.55 cabinet z>=-8.25 station gap ok, violations=0, maxPenetration=0.0000 |
| 8 | Camera follows the player smoothly (no snapping, per-frame measurement) | PASS | 47 frames: camera moved 4.25 m, fastest 4.3 m/s (player 4.4), trailing 3.83 m |
| 10 | INTERACT appears near station 1 and opens the correct quiz | PASS | quiz abc-01, header "Stesen 1" |
| 11 | All three answer options are present, enabled and labelled with pictures | PASS | C / B / A |
| 12 | Correct answer: celebration, quiz closes by itself in about 1 s, reward is worn | PASS | answer letter:A; quiz closed after ~1151 ms; bow worn; stars 1 |
| 13 | Wrong answer keeps the quiz open, dims that choice, shows a gentle hint | PASS | hint: "Hampir! Cuba lagi 💛 Kira dengan jari: satu… dua!" |
| 14 | No penalty: stars and progress unchanged by mistakes; attempts are counted | PASS | station 2: attempts=2, firstTry=false, stars 1→2 |
| 9 | Every station is reachable (keyboard steering and tap-to-walk) | PASS | station 3 reached by tap-to-walk (auto-opened its quiz); station 4 by keyboard |
| 15 | All four default stations can be completed | PASS | run R1 complete; attempts 1,2,1,1 |
| 16 | Final celebration screen with stars and earned rewards | PASS | Syabas, Pemain!; 4 stars; rewards worn: partyHat, bow, starGlasses, backpack |
| 17 | World selection works and loads that world’s stations and questions | PASS | 16 worlds listed; animals questions ani-01,ani-12,twn-27,ani-29 |
| 17.1 | Age selection changes the question pool (4+ gets harder questions) | PASS | 2-3 run ok=true; 4+ numbers run: twn-20,num-11,num-20,num-24 |
| 18 | Rewards inventory (sticker book) shows earned items | PASS | 0 daripada 52 pelekat ·  4 bintang |
| 19 | Customisation really changes the 3D character | PASS | hat off/on, hijab/pigtails, sky dress — meshes 52→1933 |
| 20 | Sound and music can be muted and the choice is saved | PASS | mute + unmute + music toggle, saved in local storage |
| 27.1 | Finish early asks for confirmation; cancel keeps playing; confirm saves partial score | PASS | run R3 saved as ended-early |
| 22 | Teacher area behind a press-and-hold gate; class list session starts | PASS | 4 nama sedia. 2 baris kosong diabaikan. 0 nama berulang ditanda. / Sesi dimulakan untuk 4 murid. |
| 23 | Learner list, switching learner, and accurate per-learner scores | PASS | learners: Ali, Siti, =CMD(), +evil; Ali station 1 attempts=2 |
| 24 | Next learner via the decision screen; records never mix | PASS | Ali: 2 attempts, not first try, 1 star / Siti: 1 attempt, first try, 1 star |
| 25 | CSV export downloads a real file (UTF-8 with BOM, 18 columns, all rows) | PASS | AmmaraGames_rekod_all_2026-10-26_0513.csv: 20 rows; "20 baris disimpan ke fail AmmaraGames_rekod_all_2026-10-26_0513.csv." |
| 26 | CSV protects names starting with = + - @ (formula injection) and quotes fields | PASS | AmmaraGames_rekod_session_2026-10-26_0513.csv: '=CMD() exported as "'=CMD()", no cell starts with = + - @ |
| 27 | Reset and delete-all ask for confirmation (cancel keeps data, confirm clears) | PASS | reset cancel ok; delete needs two confirmations; storage emptied |
| 21.1 | Settings and info tabs render (privacy text, diagnostics, storage status) | PASS | info shows 513 valid questions and storage status |
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

* Idle playroom (`npm run perf`, headless Chrome and Edge, medium quality): about 38-39 fps, 362 draw calls, about 830k triangles (the 2.0 preschool alone was 219 calls and 216k triangles; the town around it adds the rest). In the middle of the busy town (shophouses, funfair, mall) the tours measured 190-340 draw calls, 0.5-0.85 million triangles and 43-60 fps. During the e2e runs the same machine dropped to 4-28 fps because the test runner, two browsers and other programs competed for the CPU and GPU, and the character wears dozens of accessories at that moment; the movement checks (test 5) are timing-based and failed once or twice under that load before passing again on a quiet machine.
* Adaptive quality (`node tools/adaptive-check.mjs`): with the CPU slowed 6 times the game switched itself to low quality (shadows off) after about 19 seconds. It was not tested on a real slow school laptop.

## Visual review

Screenshots of every screen are in `qa/screenshots/chrome` and `qa/screenshots/edge` (main menu, playroom, near station, quiz, wrong answer, celebration, session complete, world select, animals world, sticker book, wardrobe, finish-early confirmation, teacher area tabs, resize tests, English quiz, pause menu, no-WebGL card mode). Visual defects found and fixed during review (written by hand): menu overlapped by the 3D scene, HUD buttons off-screen on phones, unfriendly "angry" zebra, unrecognisable fork, letters with closed counters, quiz picture revealing the answer, next station out of view, furniture wedges that could pin the character, D-pad blocked by the tutorial layer.

## NOT TESTED (written by hand)

* **Kid Lock on real devices.** Android Screen Pinning, iPad Guided Access, Windows kiosk mode, installing the app on a phone/tablet, and a real palm on a real screen were not tried; edge/palm touches were simulated.
* **Real touch screens and tablets.** Pointer presses and tap-to-walk were tested with a mouse. Pointer events are the same API, but no physical touch device was used.
* **Real speakers.** The Web Audio graph was confirmed running (state "running", music playing) and the mute logic was tested, but nobody listened to the music or effects, so loudness, pleasantness and balance are unverified.
* **The narrator's real voice.** Voice choice, settings, mute, queueing and the Arabic refusal were tested with a stub; nobody listened to a real voice, so whether it sounds cute, friendly or female is not verified. Choose a voice by ear in Voice & Sound.
* **Islamic content review.** The Quran text is machine-verified against Tanzil; no qualified Quran teacher has reviewed the content (see research/ISLAMIC-CONTENT-REVIEW.md).
* **Other browsers** (Firefox, Safari, older Chrome/Edge) and other operating systems.
* **A slow school laptop with an integrated GPU older than the one used here**, and projector resolutions other than the sizes listed in test 28.
* **Screen readers**, high-contrast mode and keyboard-only use of the child screens beyond the arrow/WASD/Enter/Esc/1-3 keys that were exercised.
* **Shopping and reading with real children.** Prices, coins and the book reader were tested by the automated session only; nobody aged 2-4 has used the shops or listened to the books, and the retold stories have not been reviewed by a teacher.
* **The town over a long time.** Each ride and trip was tested once per run; nobody drove around the whole 4.2 km town for an hour, and the town was only run on the laptop above.
* **Long sessions** (hours) and very large classes (the class list was tested with 4 names; the limit is 60).
* **Real children.** Nobody aged 2-4 has played the game or the ten mini-games; difficulty, wording and the length of the tutorial are unvalidated.
* **Content review** by a teacher and a native Bahasa Melayu speaker (see `research/RESEARCH-REPORT.md`).
