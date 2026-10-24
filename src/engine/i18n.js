// Interface text. Content text (questions, worlds, rewards) lives in the teacher config.
// To add a language: copy the `en` block, translate it, and add the code to availableLanguages
// (or provide it as `uiText: { xx: { ... } }` inside the config).

import { UPGRADE_STRINGS } from './i18n-v2.js';

export const STRINGS = {
  ms: {
    langName: 'Bahasa Melayu',
    loading: 'Sedang menyediakan bilik permainan…',
    loadSteps: ['Melukis lantai kayu…', 'Menyusun mainan…', 'Menggantung bendera…', 'Hampir siap!'],
    welcome: 'Jom belajar sambil bermain!',
    play: 'MAIN',
    continuePlay: 'SAMBUNG',
    worlds: 'Pilih Dunia',
    teacher: 'Cikgu / Ibu Bapa',
    collection: 'Koleksi',
    soundOn: 'Bunyi hidup', soundOff: 'Bunyi senyap', music: 'Muzik',
    language: 'Bahasa', age: 'Umur',
    playingAs: 'Pemain',
    // tutorial
    tutMove: 'Gerak dengan anak panah!', tutFollow: 'Ikut anak panah kuning ke bintang!', tutPress: 'Tekan untuk main!', skip: 'Langkau', gotIt: 'Faham!',
    // hud
    interact: 'MAIN!', camNear: 'Dekat', camNormal: 'Biasa', camFar: 'Jauh',
    followHint: 'Ikut anak panah kuning ⭐ ke stesen!',
    stationDone: 'Sudah siap! ⭐', stationLocked: 'Pergi ke Stesen {n} dulu!', allDoneHint: 'Semua stesen siap!',
    pause: 'Rehat', home: 'Menu', finishEarly: 'Tamat', stars: 'Bintang', station: 'Stesen',
    // pause
    paused: 'Rehat sekejap', resume: 'Sambung main', backToMenu: 'Menu utama', chooseWorld: 'Pilih dunia',
    // quiz
    quizStation: 'Stesen {n}', listen: 'Dengar soalan', notNow: 'Nanti dulu', keepGoing: 'Teruskan',
    praise: ['Betul!', 'Hebat!', 'Pandai!', 'Syabas!', 'Bagus sekali!'],
    tryAgain: ['Hampir! Cuba lagi 💛', 'Tak apa, cuba sekali lagi!', 'Cuba lagi, kamu boleh!'],
    gotReward: 'Kamu dapat {reward}!', alreadyReward: 'Kamu sudah ada {reward}. Tambah satu bintang!', starEarned: '+1 bintang!',
    nextStation: 'Seterusnya: Stesen {n}',
    // session complete
    wellDone: 'Syabas, {name}!', allStations: 'Semua stesen sudah siap!',
    stoppedTitle: 'Bagus, {name}!', stoppedText: 'Kita berhenti dulu. Markah sudah disimpan.',
    youEarned: 'Hadiah hari ini', playAgain: 'Main lagi', nextLearner: 'Murid seterusnya: {name}', everyoneDone: 'Semua murid sudah bermain!',
    classProgress: '{done} daripada {total} murid selesai', downloadCsv: 'Muat turun CSV',
    // worlds
    featured: 'Mula di sini', back: 'Kembali', stationsDone: '{n}/4 stesen',
    // collection
    myCollection: 'Koleksi Saya', stickerBook: 'Buku Pelekat', wardrobe: 'Almari Baju',
    slot_head: 'Kepala', slot_hair: 'Rambut', slot_face: 'Muka', slot_back: 'Belakang', slot_hand: 'Tangan', slot_outfit: 'Baju', slot_style: 'Gaya rambut',
    none: 'Tiada', lockedItem: 'Kumpul di stesen!', done: 'Siap!', wearing: 'Dipakai', starsTotal: '{n} bintang',
    hair_pigtails: 'Tocang', hair_bun: 'Sanggul', hair_short: 'Pendek', hair_hijab: 'Tudung', stickersCount: '{n} daripada {total} pelekat',
    // adult gate
    adultTitle: 'Untuk cikgu dan ibu bapa', adultHold: 'Tekan dan tahan butang ini', adultHoldBtn: 'Tahan untuk masuk', cancel: 'Batal',
    // teacher area
    teacherTitle: 'Kawasan Cikgu & Ibu Bapa', exit: 'Keluar',
    tabSession: 'Sesi', tabLearners: 'Murid', tabRecords: 'Rekod', tabExport: 'Eksport', tabSettings: 'Tetapan', tabInfo: 'Info & Privasi',
    currentSession: 'Sesi semasa', mode: 'Mod', started: 'Dimulakan', applyNext: 'Berkuat kuasa untuk permainan seterusnya.', noSession: 'Tiada sesi aktif. Mulakan sesi baharu di bawah.',
    modeSingle: 'Murid Tunggal', modeClass: 'Senarai Kelas (kongsi 1 laptop)',
    singleName: 'Nama murid (pilihan)', classNames: 'Nama murid — satu nama setiap baris', namesPlaceholder: 'Contoh:\nAisyah\nDaniel\nMei Ling\nKavin',
    world: 'Dunia', reuseProfiles: 'Guna semula profil dengan nama yang sama (simpan hadiah murid)',
    startSession: 'Mula sesi', startAndPlay: 'Mula & main sekarang', sessionStarted: 'Sesi dimulakan untuk {n} murid.',
    namesInfo: '{n} nama sedia. {e} baris kosong diabaikan. {d} nama berulang ditanda.', namesNone: 'Sila taip sekurang-kurangnya satu nama.',
    namesLimit: 'Hanya {max} murid pertama digunakan.',
    endSession: 'Tamatkan sesi', confirmEndSessionTitle: 'Tamatkan sesi ini?', confirmEndSessionText: 'Murid yang belum selesai akan ditanda "tamat awal". Semua rekod disimpan.',
    confirmReplaceTitle: 'Mulakan sesi baharu?', confirmReplaceText: 'Sesi semasa akan ditamatkan. Rekodnya tetap disimpan untuk CSV.',
    colName: 'Nama', colProgress: 'Kemajuan', colStars: 'Bintang', colFirstTry: 'Betul kali pertama', colAttempts: 'Cubaan', colStatus: 'Status', colWorld: 'Dunia', colStation: 'Stesen', colQuestion: 'Soalan', colReward: 'Hadiah',
    nowPlaying: 'Sedang main', finished: 'Selesai', waiting: 'Menunggu', switchTo: 'Tukar ke murid ini', resetLearner: 'Set semula', finishLearner: 'Tamat murid ini',
    confirmResetTitle: 'Set semula {name}?', confirmResetText: 'Permainan semasa {name} akan dimulakan semula. Rekod lama kekal dalam CSV.',
    noRecords: 'Belum ada rekod.', allLearners: 'Semua murid', completionRate: 'Kadar siap', avgAttempts: 'Purata cubaan setiap stesen', firstTryRate: 'Betul kali pertama',
    csvSession: 'Muat turun CSV (sesi ini)', csvAll: 'Muat turun CSV (semua rekod)',
    csvNote: 'Fail CSV (UTF-8) dibuka terus dalam Excel. Nama yang bermula dengan = + - @ dilindungi secara automatik.',
    csvDone: '{n} baris disimpan ke fail {file}.', csvNone: 'Tiada rekod untuk dimuat turun lagi.', csvFailed: 'Muat turun CSV gagal: {msg}',
    clearAll: 'Padam semua data', confirmClearTitle: 'Padam semua data murid?', confirmClearText: 'Semua nama, markah dan hadiah pada komputer ini akan dipadam. Muat turun CSV dahulu jika perlu.',
    confirmClearTitle2: 'Betul-betul pasti?', confirmClearText2: 'Tindakan ini tidak boleh dibatalkan.', cleared: 'Semua data telah dipadam.',
    setLanguage: 'Bahasa', setAge: 'Umur pemain', setSound: 'Bunyi', setMusic: 'Muzik latar', setMusicStyle: 'Jenis muzik', musicCheerful: 'Ceria', musicCalm: 'Tenang',
    setMusicVol: 'Kekuatan muzik', setSfxVol: 'Kekuatan bunyi kesan', setMotion: 'Kurangkan pergerakan', motionAuto: 'Ikut komputer', motionOn: 'Ya', motionOff: 'Tidak',
    setRead: 'Bacakan soalan (jika suara tersedia)', setAutoClose: 'Tutup kuiz selepas jawapan betul', seconds: '{n} saat', setCamera: 'Jarak kamera',
    setQuality: 'Kualiti grafik', qualityAuto: 'Automatik', qualityHigh: 'Tinggi', qualityLow: 'Ringan (laptop perlahan)',
    showTutorialAgain: 'Tunjuk tutorial semula', tutorialWillShow: 'Tutorial akan dipaparkan semasa main seterusnya.', voiceNone: 'Tiada suara luar talian untuk bahasa ini pada komputer ini.', voiceFound: 'Suara: {name}',
    privacyTitle: 'Privasi', privacy: [
      'Semua nama dan markah disimpan pada komputer ini sahaja (storan pelayar). Tiada apa-apa dihantar ke internet.',
      'Permainan ini tiada iklan, tiada penjejak dan tiada akaun.',
      'Gunakan nama panggilan sahaja. Tidak perlu nombor kad pengenalan atau maklumat peribadi lain.',
      'Membersihkan data pelayar (cookies/site data) atau mod inkognito akan memadam rekod. Satu fail HTML tidak dapat menjamin storan kekal — muat turun CSV selalu.',
      'Rekod hanya dikongsi di komputer dan pelayar yang sama.'
    ],
    storageOk: 'Storan tempatan: berfungsi.', storageBad: 'Storan tempatan: TIDAK tersedia. Rekod hanya kekal sehingga halaman ditutup.',
    diagnostics: 'Diagnostik', configSummary: '{q} soalan sah dalam {w} dunia. {s} soalan dilangkau.', configProblems: 'Masalah konfigurasi', configWarnings: 'Amaran ({n})', noProblems: 'Tiada masalah ditemui.',
    errorLog: 'Log ralat sesi ini', version: 'Versi', offlineNote: 'Permainan ini berfungsi tanpa internet. Semua grafik, bunyi dan fon ada di dalam fail ini.',
    attributions: 'Fon Fredoka © The Fredoka Project Authors, Lesen SIL Open Font 1.1. Grafik 3D (Three.js © pengarang three.js, lesen MIT). Semua gambar dan muzik dicipta khas untuk permainan ini.',
    // dialogs
    yes: 'Ya', no: 'Tidak', confirm: 'Ya', ok: 'OK',
    confirmFinishTitle: 'Tamat sekarang?', confirmFinishText: 'Markah setakat ini akan disimpan.', confirmFinishYes: 'Ya, tamat', confirmFinishNo: 'Terus main',
    confirmHomeTitle: 'Balik ke menu utama?', confirmHomeText: 'Kemajuan disimpan. Kamu boleh sambung kemudian.',
    // errors
    storageWarn: 'Storan pelayar tidak tersedia. Kemajuan hanya disimpan sehingga halaman ditutup.',
    audioWarn: 'Bunyi tidak tersedia pada pelayar ini. Permainan tetap boleh dimainkan.',
    configWarn: 'Ada {n} masalah dalam fail konfigurasi. Lihat Cikgu / Ibu Bapa > Info.',
    webglTitle: 'Grafik 3D tidak dapat dimulakan',
    webglText: 'Pelayar atau komputer ini tidak menyokong WebGL, atau ia dimatikan. Cuba Chrome atau Edge terkini dan hidupkan "Use graphics acceleration". Sementara itu, main dalam mod kad.',
    playCards: 'Main mod kad (tanpa 3D)', cardMode: 'Mod Kad', tapStation: 'Tekan stesen yang bersinar!',
    somethingWrong: 'Alamak! Sesuatu tidak kena, tetapi permainan diteruskan.',
    // csv
    csvHeaders: ['Murid', 'ID sesi', 'Tarikh sesi', 'Mod', 'Main ke-', 'Kumpulan umur', 'Dunia', 'No. stesen', 'Stesen', 'ID soalan', 'Soalan',
      'Bilangan cubaan', 'Betul kali pertama', 'Status', 'Bintang', 'Hadiah', 'Jawapan betul', 'Masa selesai'],
    statusComplete: 'Selesai', statusEndedEarly: 'Tamat awal', statusReset: 'Set semula', statusInProgress: 'Sedang dicuba', statusNotStarted: 'Belum mula',
    csvFile: 'AmmaraGames_rekod'
  },

  en: {
    langName: 'English',
    loading: 'Getting the playroom ready…',
    loadSteps: ['Painting the wooden floor…', 'Tidying the toys…', 'Hanging the bunting…', 'Almost ready!'],
    welcome: 'Let’s learn and play!',
    play: 'PLAY',
    continuePlay: 'CONTINUE',
    worlds: 'Choose a World',
    teacher: 'Teacher / Parent',
    collection: 'Collection',
    soundOn: 'Sound on', soundOff: 'Sound off', music: 'Music',
    language: 'Language', age: 'Age',
    playingAs: 'Player',
    tutMove: 'Move with the arrows!', tutFollow: 'Follow the yellow arrow to the star!', tutPress: 'Press to play!', skip: 'Skip', gotIt: 'Got it!',
    interact: 'PLAY!', camNear: 'Near', camNormal: 'Normal', camFar: 'Far',
    followHint: 'Follow the yellow arrow ⭐ to the station!',
    stationDone: 'All done here! ⭐', stationLocked: 'Go to Station {n} first!', allDoneHint: 'Every station is done!',
    pause: 'Pause', home: 'Menu', finishEarly: 'Finish', stars: 'Stars', station: 'Station',
    paused: 'Little break', resume: 'Keep playing', backToMenu: 'Main menu', chooseWorld: 'Choose a world',
    quizStation: 'Station {n}', listen: 'Hear the question', notNow: 'Not now', keepGoing: 'Continue',
    praise: ['Correct!', 'Great job!', 'Well done!', 'Super!', 'Amazing!'],
    tryAgain: ['So close! Try again 💛', 'That’s okay, try once more!', 'Try again, you can do it!'],
    gotReward: 'You got {reward}!', alreadyReward: 'You already have {reward}. Here is an extra star!', starEarned: '+1 star!',
    nextStation: 'Next: Station {n}',
    wellDone: 'Well done, {name}!', allStations: 'You finished every station!',
    stoppedTitle: 'Nice work, {name}!', stoppedText: 'We stopped for now. Your score is saved.',
    youEarned: 'Today’s rewards', playAgain: 'Play again', nextLearner: 'Next learner: {name}', everyoneDone: 'Everyone has played!',
    classProgress: '{done} of {total} learners finished', downloadCsv: 'Download CSV',
    featured: 'Start here', back: 'Back', stationsDone: '{n}/4 stations',
    myCollection: 'My Collection', stickerBook: 'Sticker Book', wardrobe: 'Wardrobe',
    slot_head: 'Head', slot_hair: 'Hair', slot_face: 'Face', slot_back: 'Back', slot_hand: 'Hand', slot_outfit: 'Dress', slot_style: 'Hairstyle',
    none: 'None', lockedItem: 'Win it at a station!', done: 'Done!', wearing: 'Wearing', starsTotal: '{n} stars',
    hair_pigtails: 'Pigtails', hair_bun: 'Bun', hair_short: 'Short', hair_hijab: 'Hijab', stickersCount: '{n} of {total} stickers',
    adultTitle: 'For teachers and parents', adultHold: 'Press and hold this button', adultHoldBtn: 'Hold to enter', cancel: 'Cancel',
    teacherTitle: 'Teacher & Parent Area', exit: 'Exit',
    tabSession: 'Session', tabLearners: 'Learners', tabRecords: 'Records', tabExport: 'Export', tabSettings: 'Settings', tabInfo: 'Info & Privacy',
    currentSession: 'Current session', mode: 'Mode', started: 'Started', applyNext: 'Applies from the next game.', noSession: 'No active session. Start a new one below.',
    modeSingle: 'Single learner', modeClass: 'Class list (shared laptop)',
    singleName: 'Learner name (optional)', classNames: 'Learner names — one name per line', namesPlaceholder: 'Example:\nAisyah\nDaniel\nMei Ling\nKavin',
    world: 'World', reuseProfiles: 'Reuse profiles with the same name (keeps their rewards)',
    startSession: 'Start session', startAndPlay: 'Start & play now', sessionStarted: 'Session started for {n} learner(s).',
    namesInfo: '{n} names ready. {e} blank line(s) ignored. {d} repeated name(s) numbered.', namesNone: 'Please type at least one name.',
    namesLimit: 'Only the first {max} learners are used.',
    endSession: 'End session', confirmEndSessionTitle: 'End this session?', confirmEndSessionText: 'Learners who have not finished are marked "ended early". All records are kept.',
    confirmReplaceTitle: 'Start a new session?', confirmReplaceText: 'The current session will end. Its records are kept for the CSV.',
    colName: 'Name', colProgress: 'Progress', colStars: 'Stars', colFirstTry: 'Right first time', colAttempts: 'Attempts', colStatus: 'Status', colWorld: 'World', colStation: 'Station', colQuestion: 'Question', colReward: 'Reward',
    nowPlaying: 'Playing now', finished: 'Finished', waiting: 'Waiting', switchTo: 'Switch to this learner', resetLearner: 'Reset', finishLearner: 'Finish this learner',
    confirmResetTitle: 'Reset {name}?', confirmResetText: '{name}’s current game will restart. Old records stay in the CSV.',
    noRecords: 'No records yet.', allLearners: 'All learners', completionRate: 'Completion', avgAttempts: 'Average attempts per station', firstTryRate: 'Right first time',
    csvSession: 'Download CSV (this session)', csvAll: 'Download CSV (all records)',
    csvNote: 'The CSV file (UTF-8) opens directly in Excel. Names starting with = + - @ are protected automatically.',
    csvDone: '{n} rows saved to {file}.', csvNone: 'There are no records to download yet.', csvFailed: 'CSV download failed: {msg}',
    clearAll: 'Delete all data', confirmClearTitle: 'Delete all learner data?', confirmClearText: 'All names, scores and rewards on this computer will be deleted. Download a CSV first if you need it.',
    confirmClearTitle2: 'Are you completely sure?', confirmClearText2: 'This cannot be undone.', cleared: 'All data has been deleted.',
    setLanguage: 'Language', setAge: 'Player age', setSound: 'Sound', setMusic: 'Background music', setMusicStyle: 'Music style', musicCheerful: 'Cheerful', musicCalm: 'Calm',
    setMusicVol: 'Music volume', setSfxVol: 'Sound effects volume', setMotion: 'Reduce motion', motionAuto: 'Follow computer', motionOn: 'Yes', motionOff: 'No',
    setRead: 'Read questions aloud (if a voice is available)', setAutoClose: 'Close the quiz after a correct answer', seconds: '{n} s', setCamera: 'Camera distance',
    setQuality: 'Graphics quality', qualityAuto: 'Automatic', qualityHigh: 'High', qualityLow: 'Light (slow laptops)',
    showTutorialAgain: 'Show the tutorial again', tutorialWillShow: 'The tutorial will show next time you play.', voiceNone: 'No offline voice for this language on this computer.', voiceFound: 'Voice: {name}',
    privacyTitle: 'Privacy', privacy: [
      'All names and scores stay on this computer only (browser storage). Nothing is sent to the internet.',
      'No adverts, no trackers and no accounts.',
      'Use first names or nicknames only. No ID numbers or other personal details are needed.',
      'Clearing browser data (cookies/site data) or using a private window deletes the records. A single HTML file cannot guarantee permanent storage — download a CSV often.',
      'Records are only shared on the same computer and browser.'
    ],
    storageOk: 'Local storage: working.', storageBad: 'Local storage: NOT available. Records last only until this page is closed.',
    diagnostics: 'Diagnostics', configSummary: '{q} valid questions in {w} worlds. {s} question(s) skipped.', configProblems: 'Configuration problems', configWarnings: 'Warnings ({n})', noProblems: 'No problems found.',
    errorLog: 'Error log (this visit)', version: 'Version', offlineNote: 'This game works without internet. All graphics, sounds and fonts are inside this file.',
    attributions: 'Fredoka font © The Fredoka Project Authors, SIL Open Font License 1.1. 3D graphics by Three.js (© three.js authors, MIT licence). All pictures and music were made for this game.',
    yes: 'Yes', no: 'No', confirm: 'Yes', ok: 'OK',
    confirmFinishTitle: 'Finish now?', confirmFinishText: 'Your score so far will be saved.', confirmFinishYes: 'Yes, finish', confirmFinishNo: 'Keep playing',
    confirmHomeTitle: 'Back to the main menu?', confirmHomeText: 'Your progress is saved. You can continue later.',
    storageWarn: 'Browser storage is not available. Progress is kept only until this page is closed.',
    audioWarn: 'Sound is not available in this browser. The game still works.',
    configWarn: 'There are {n} problem(s) in the configuration file. See Teacher / Parent > Info.',
    webglTitle: '3D graphics could not start',
    webglText: 'This browser or computer does not support WebGL, or it is switched off. Try the latest Chrome or Edge and turn on "Use graphics acceleration". Meanwhile, play in card mode.',
    playCards: 'Play card mode (no 3D)', cardMode: 'Card Mode', tapStation: 'Tap the glowing station!',
    somethingWrong: 'Oops! Something went wrong, but the game carries on.',
    csvHeaders: ['Learner', 'Session ID', 'Session date', 'Mode', 'Play no.', 'Age group', 'World', 'Station no.', 'Station', 'Question ID', 'Question',
      'Attempts', 'Correct on first try', 'Status', 'Stars earned', 'Reward', 'Correct answer', 'Completed at'],
    statusComplete: 'Complete', statusEndedEarly: 'Ended early', statusReset: 'Reset', statusInProgress: 'In progress', statusNotStarted: 'Not started',
    csvFile: 'AmmaraGames_records'
  }
};

for (const code of Object.keys(UPGRADE_STRINGS)) Object.assign(STRINGS[code] || (STRINGS[code] = {}), UPGRADE_STRINGS[code]);

let lang = 'ms';
let extra = {};
export function setLang(l) { lang = l; }
export function getLang() { return lang; }
export function addStrings(obj) { extra = obj || {}; }

// t('key', { n: 2 }) → text in the current language with {placeholders} filled in.
export function t(key, vars) {
  const table = Object.assign({}, STRINGS.en, STRINGS[lang] || {}, (extra && extra[lang]) || {});
  let s = table[key];
  if (s === undefined) return key;
  if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  return s;
}
export function tAll() { return Object.assign({}, STRINGS.en, STRINGS[lang] || {}, (extra && extra[lang]) || {}); }
