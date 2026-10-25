# AmmaraGames 2.0 / 2.1: upgrade research and design report

Written for: the project owner and future developers. It records what was decided, why, and what is still open.

## 0. Change summary (2.0.0 → 2.1.0): the town

* **Bandar Ceria**, a town of 4.2 × 4.2 km (17.6 km²) around the preschool: streets every 120 m, 1,054 blocks, 4,637 buildings (towers, shops, flats, houses), parks, a little forest, hills, a beach and the sea. All of it is generated from one pure data module (`src/engine/city/plan.js`), the same on every computer, so the builder, collisions, traffic, maps and unit tests read one plan.
* **22 landmarks** with 43 learning places (quiz boards, mini-games, Jom Mengaji at the mosque, bus stops, train stations), using the existing questions and games.
* **Rides:** unicorns (walking-style control) and open toy cars (steering-style control); 143 of them across the town. **Buses** on 3 routes with 11 stops; the child calls the bus at a stop and gets off at any stop.
* **Highway (Lebuhraya Ceria):** the street at z = -660 became a 4-lane divided highway across the whole town and on into the hills, with a planted middle and barrier, lane markings, tall lamps, green direction signs, traffic lights at every crossing and its own fast traffic (fast lane by the middle, slow lane by the kerb; town cars use the slow lane).
* **Elevated train (Kereta Api Ceria):** a 3,559 m loop about 9 m up, on 86 pillars in the street middles (one side runs along the highway's middle), with round corners, and two 3-car trains that stop at 4 stations. Each station has a hall, a lift tower, a raised platform with canopy, a "take the train" spot and a vehicle/road-safety quiz.
* **Life:** 26 town cars (keep left, stop for children and for the car ahead), 24 highway cars, 46 school children on the pavements who wave and answer a hello, 4 buses plus the one a child calls, 2 trains.
* **Maps:** the corner map shows the streets around the child in town; the big map has a Town tab with every landmark as a quick-trip button; "Back to the preschool" works from anywhere.
* **Pictures:** an automatic audit renders every picture the game can show (442) and flags empty or "?" boxes; colour-word answers and locked stickers/clothes that looked like empty boxes were fixed.
* **Questions:** 61 new town-themed questions (road safety, vehicles, zoo, market, space, manners…), 453 in total.

| Topic | Decision | Reason |
|---|---|---|
| Town size | 4.2 × 4.2 km | the owner asked for "half of GTA San Andreas" (a 6 × 6 km map square); 17.6 km² is about half of that while one laptop can still stream it |
| Streaming | 240 m squares built within 300 m of the child and removed beyond 430 m; one merged mesh + outline per square | about 100–300 draw calls anywhere in town, same range as the preschool |
| Traffic side | keep left | Malaysia |
| Highway at street level | crossings with traffic lights instead of ramps | collisions are 2D; an at-grade divided road can be driven, walked and tested with the same rules |
| Train on a viaduct | track 9 m up over street middles, pillars ≥ 16 m from any crossing and clear of the lanes | the train never meets road traffic; nothing has to be demolished for it; unit-tested |
| Boarding the bus / train | the child waits at the stop and is placed in the seat when it stops | no stairs or doors for 2–4 year olds; if both trains are far, the one out of sight is brought round (waits are about 30 s) |
| Camera in town | always looks from the south like the preschool; never through a tall building (it looks down more steeply), stays under the train deck and platforms | a fixed direction keeps the arrow keys simple for small children |
| Station facing north | its ticket spot is beside the lift, not behind the hall | otherwise the hall would hide the child from the camera |

## 1. Change summary (1.0.0 → 2.0.0)

* **3D world:** the single playroom became a whole preschool (main hall + 10 activity corners in a west wing: Jom Mengaji, ABC & Reading, Arcade, Art, Numbers, Colours & Shapes, Animals, Music, Wardrobe & Rewards, Rest) and an outdoor garden (front gate with fountain, flower garden, playground with slide/swings/seesaw/climbing dome, sandpit, hopscotch lawn, picnic park with a gazebo Nature Station). 17 areas, 120 × 44 m, 23 interactive places.
* **Navigation:** a front door that opens as the child approaches; "Back into the Preschool" button and an arrow to the door when outside; a minimap and a big tap-to-walk map with "Back to start"; path-finding (A*) for tap-to-walk; area banners; no dead ends (unit-tested with a navigation grid).
* **Two robot friends** (Robo Danial and Robo Aisyah), always seated, with breathing, blinking, head-turning and a wave; they greet in the current language.
* **Narrator service** with real offline voice enumeration, ranking, a settings panel (voice per language, preview, speed, limited pitch, volume, on/off), mute, queue and stop-on-screen-change, music ducking, and honest status messages.
* **Music profiles** per place (playroom, garden with birdsong, arcade, quiet Islamic-calm, reward) with fade-out/fade-in switching; separate music / effects / narrator volumes.
* **Mini-Game Arcade** with 10 games (Clever Ruler, X and O, Connect the Dots, Trace Letters & Numbers incl. Hijaiyah, Memory Cards, Shape Puzzle, Find It, Bead Patterns, Count & Sort, Happy Xylophone), three levels by age group, shared frame (Back, Home, Help with narration, Restart, Sound), stickers, activity records. Each game can also be started from its place in the 3D world.
* **Jom Mengaji** centre: 28 Hijaiyah letters with dots and families, 4 original exercise types, tracing, and a library of 20 short surahs from the Tanzil Uthmani text.
* **Records:** a separate activity list and activity CSV (13 columns); the original 18-column station CSV is unchanged. Records from 1.0.0 load without loss.
* **Performance:** per-area merging with vertex colours, area culling, shadow window that follows the child, fewer triangles on small parts; the bigger world renders at about the same cost as the 1.0.0 room on the test laptop.
* **Fix found on the way:** several icons in the picture library produced duplicate SVG attributes. Browsers silently ignored the second value in the page, but standalone SVG images (used for 3D textures) failed to load. The helpers now replace attributes instead of repeating them; a unit test guards all icons.

## 2. Decisions

| Topic | Decision | Reason |
|---|---|---|
| Engine | kept Three.js + plain JS, single HTML | requirement: no engine migration, offline single file |
| World size vs. speed | one draw call group per area, culled beyond 30 m; shadows only from areas within 15 m | the 1.0.0 room already used ~220 draw calls; the new world stays in the same range |
| Door | door collider is switched off only while the leaves are open; tap-to-walk paths treat the door as open | a child can never be trapped half-way |
| Narrator voice | only `localService` voices; ranking prefers the exact language, then voice names that are usually female, then the browser default; Indonesian as a labelled substitute for Malay | offline and privacy; the Web Speech API does not expose gender, so "likely female" is only a name-based guess and is shown as a guess |
| Narrator pitch | default 1.15, limited to 0.9–1.3 | higher pitch sounds lighter, but far outside this range voices become unnatural |
| Quran and TTS | narrator refuses any Arabic script | Quran must never be recited by a computer voice; letter names in Arabic are not spoken either |
| Recitation audio / translation | not included | licences could not be confirmed (see ISLAMIC-CONTENT-REVIEW.md) |
| Arabic font | Noto Naskh Arabic (OFL), embedded | correct rendering of Uthmani marks offline; Amiri Quran and Scheherazade New were also evaluated |
| Rewards from games | one sticker per game, given once; no streaks, timers or scores | avoid encouraging endless play; no pressure |

## 3. Testing done

* Unit tests: 62 (`npm test`), including the Quran verbatim checks, narrator ranking and Arabic refusal, game rules, layout reachability and icon XML validity.
* End-to-end: the original 41 checks (unchanged) plus 13 upgrade checks (`tests/e2e/run-e2e-upgrade.mjs`), in Chrome 156 and Edge 156 on Windows 11, offline, with real mouse input. All ten games are played to the end automatically. See `TEST-REPORT.md` for the latest numbers.
* Screenshots of every area and game were inspected by the developer (`tools/tour.mjs`, `tools/play-games.mjs`, `tools/islamic-tour.mjs`).
* 2.1 (town): 16 unit tests of the town plan (`tests/unit/city.test.mjs`: lots, colliders, landmarks, rides, bus routes and stops, districts, highway lanes and lights, train loop, pillars, stations) and 14 browser checks (`tests/e2e/run-e2e-city.mjs`: size, streaming, unicorn, car, bus and train rides, greeting a child, landmark music and quiz, town map trips, highway, two trains never meeting). Town screenshots from `tools/city-tour.mjs` were inspected; problems found and fixed that way: empty-looking pink landmark squares, a lamp and a traffic light on the same corner, a bus stop placed in a crossing, and the camera ending inside towers, the train deck or a station canopy. Two checks of the original 41-check suite had the 2.0 content written into them (animal-world question ids must start with `ani-`; the info page must say 392 questions); with the new town questions they now check the rule itself (the questions belong to that world's stations; the info page shows the real number of questions).

## 4. What was NOT verified

* **Nobody listened to the narrator voice.** Tests use a mocked speech engine; which voice a school laptop has, and whether it sounds cute, depends on that computer. Choose a voice in *Voice & Sound* after listening.
* Nobody listened to the new music profiles on real speakers.
* No qualified Quran teacher has reviewed the Islamic content.
* No real children have played the new world or games; no physical touch screen was used (touch is simulated by pointer events).
* Frame rate was measured on one laptop (i7-8565U, integrated GPU) in headless Chrome only.

## 5. Known issues

1. On weak integrated GPUs the large world may drop below 30 fps; the game then switches to the light quality setting by itself (shadows off).
2. Tracing checks the shape is covered, not the stroke order.
3. Hijaiyah letter names have no audio; a teacher or parent should say them.
4. In 3D, front-row corner signs are low boards at the open front; very small screens may show them cut at the bottom edge.
5. Browser storage is per browser and per file location (unchanged from 1.0.0); download the CSV files after lessons.
6. Town traffic lights do not change; cars simply give way and always stop for children. Highway cars are only simulated within about 500 m of the child.
7. Between rows of tall towers the town camera can show a narrow street view; it never looks through walls.
