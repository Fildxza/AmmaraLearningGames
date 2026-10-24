// Hijaiyah (Arabic alphabet) data for the "Jom Mengaji" learning centre and the tracing game.
//
// CONTENT-REVIEW STATUS: reviewReady (written by the developer from standard teaching material, NOT yet checked by a
// qualified Quran teacher). Letter shapes are the Unicode letters rendered by the embedded Noto Naskh Arabic font.
// Names are the common Malay spellings; pronunciation audio is NOT included and the narrator never reads Arabic.
// `dots` / `dotsPos` only describe what is drawn on the letter (a visual fact children use to tell letters apart).
export const HIJAIYAH_REVIEW = { status: 'developer-written-awaiting-qualified-review', note: 'Letter names, order, dot facts and families must be confirmed by a qualified Quran teacher before the content is called religiously verified.' };

// order = the normal alphabet order (Alif to Ya)
export const HIJAIYAH = [
  { n: 1, ar: 'ا', name: 'Alif', dots: 0, dotsPos: null, family: 'alif' },
  { n: 2, ar: 'ب', name: 'Ba', dots: 1, dotsPos: 'below', family: 'ba' },
  { n: 3, ar: 'ت', name: 'Ta', dots: 2, dotsPos: 'above', family: 'ba' },
  { n: 4, ar: 'ث', name: 'Tha', dots: 3, dotsPos: 'above', family: 'ba' },
  { n: 5, ar: 'ج', name: 'Jim', dots: 1, dotsPos: 'below', family: 'jim' },
  { n: 6, ar: 'ح', name: 'Ha', dots: 0, dotsPos: null, family: 'jim' },
  { n: 7, ar: 'خ', name: 'Kha', dots: 1, dotsPos: 'above', family: 'jim' },
  { n: 8, ar: 'د', name: 'Dal', dots: 0, dotsPos: null, family: 'dal' },
  { n: 9, ar: 'ذ', name: 'Dzal', dots: 1, dotsPos: 'above', family: 'dal' },
  { n: 10, ar: 'ر', name: 'Ra', dots: 0, dotsPos: null, family: 'ra' },
  { n: 11, ar: 'ز', name: 'Zai', dots: 1, dotsPos: 'above', family: 'ra' },
  { n: 12, ar: 'س', name: 'Sin', dots: 0, dotsPos: null, family: 'sin' },
  { n: 13, ar: 'ش', name: 'Syin', dots: 3, dotsPos: 'above', family: 'sin' },
  { n: 14, ar: 'ص', name: 'Sad', dots: 0, dotsPos: null, family: 'sad' },
  { n: 15, ar: 'ض', name: 'Dad', dots: 1, dotsPos: 'above', family: 'sad' },
  { n: 16, ar: 'ط', name: 'Tha (tebal)', dots: 0, dotsPos: null, family: 'tha' },
  { n: 17, ar: 'ظ', name: 'Zha', dots: 1, dotsPos: 'above', family: 'tha' },
  { n: 18, ar: 'ع', name: "'Ain", dots: 0, dotsPos: null, family: 'ain' },
  { n: 19, ar: 'غ', name: 'Ghain', dots: 1, dotsPos: 'above', family: 'ain' },
  { n: 20, ar: 'ف', name: 'Fa', dots: 1, dotsPos: 'above', family: 'fa' },
  { n: 21, ar: 'ق', name: 'Qaf', dots: 2, dotsPos: 'above', family: 'fa' },
  { n: 22, ar: 'ك', name: 'Kaf', dots: 0, dotsPos: null, family: 'kaf' },
  { n: 23, ar: 'ل', name: 'Lam', dots: 0, dotsPos: null, family: 'lam' },
  { n: 24, ar: 'م', name: 'Mim', dots: 0, dotsPos: null, family: 'mim' },
  { n: 25, ar: 'ن', name: 'Nun', dots: 1, dotsPos: 'above', family: 'nun' },
  { n: 26, ar: 'و', name: 'Wau', dots: 0, dotsPos: null, family: 'wau' },
  { n: 27, ar: 'ه', name: 'Ha (hujung)', dots: 0, dotsPos: null, family: 'ha' },
  { n: 28, ar: 'ي', name: 'Ya', dots: 2, dotsPos: 'below', family: 'ya' }
];
export const HIJAIYAH_BY_CHAR = Object.fromEntries(HIJAIYAH.map((l) => [l.ar, l]));

// Letters that look alike and differ by dots (groups for the "same shape, different dots" exercise)
export const FAMILIES = [
  { id: 'ba', letters: ['ب', 'ت', 'ث'] },
  { id: 'jim', letters: ['ج', 'ح', 'خ'] },
  { id: 'dal', letters: ['د', 'ذ'] },
  { id: 'ra', letters: ['ر', 'ز'] },
  { id: 'sin', letters: ['س', 'ش'] },
  { id: 'sad', letters: ['ص', 'ض'] },
  { id: 'tha', letters: ['ط', 'ظ'] },
  { id: 'ain', letters: ['ع', 'غ'] },
  { id: 'fa', letters: ['ف', 'ق'] }
];

// Harakat (short-vowel and other marks). The mark is drawn on a carrier letter; the base is ب (Ba).
export const HARAKAT = [
  { id: 'fathah', mark: 'َ', name: { ms: 'Fathah', en: 'Fathah' }, sound: { ms: 'bunyi "a" (garisan di atas)', en: 'an "a" sound (a stroke above)' } },
  { id: 'kasrah', mark: 'ِ', name: { ms: 'Kasrah', en: 'Kasrah' }, sound: { ms: 'bunyi "i" (garisan di bawah)', en: 'an "i" sound (a stroke below)' } },
  { id: 'dammah', mark: 'ُ', name: { ms: 'Dammah', en: 'Dammah' }, sound: { ms: 'bunyi "u" (seperti huruf wau kecil di atas)', en: 'a "u" sound (a little wau above)' } },
  { id: 'sukun', mark: 'ْ', name: { ms: 'Sukun', en: 'Sukun' }, sound: { ms: 'huruf mati (bulatan kecil di atas)', en: 'no vowel (a small circle above)' } },
  { id: 'shaddah', mark: 'ّ', name: { ms: 'Syaddah', en: 'Shaddah' }, sound: { ms: 'huruf ditekan, dibaca dua kali', en: 'a doubled letter' } },
  { id: 'fathatan', mark: 'ً', name: { ms: 'Fathatan', en: 'Fathatan' }, sound: { ms: 'tanwin: bunyi "an"', en: 'tanwin: an "an" ending' } },
  { id: 'kasratan', mark: 'ٍ', name: { ms: 'Kasratan', en: 'Kasratan' }, sound: { ms: 'tanwin: bunyi "in"', en: 'tanwin: an "in" ending' } },
  { id: 'dammatan', mark: 'ٌ', name: { ms: 'Dammatan', en: 'Dammatan' }, sound: { ms: 'tanwin: bunyi "un"', en: 'tanwin: a "un" ending' } }
];

/** A letter with a mark drawn on it, e.g. letterWith('ب', 'fathah') -> بَ */
export const letterWith = (ar, harakatId) => ar + (HARAKAT.find((h) => h.id === harakatId) || { mark: '' }).mark;

/**
 * Original learning stages (inspired by the step-by-step idea of Iqra' books, but the exercises are our own).
 * kind: which exercise screen to use.
 */
export const STAGES = [
  { id: 'letters', kind: 'letters', title: { ms: 'Kenal Huruf', en: 'Meet the Letters' }, blurb: { ms: '28 huruf hijaiyah, satu demi satu.', en: 'The 28 Hijaiyah letters, one by one.' }, icon: 'letter:A' },
  { id: 'match', kind: 'match', title: { ms: 'Padan Huruf', en: 'Match the Letters' }, blurb: { ms: 'Cari huruf yang sama.', en: 'Find the matching letter.' }, icon: 'shape:star:yellow' },
  { id: 'dots', kind: 'dots', title: { ms: 'Berapa Titik?', en: 'How Many Dots?' }, blurb: { ms: 'Huruf yang serupa tetapi titiknya berbeza.', en: 'Letters that look alike but have different dots.' }, icon: 'dots:3' },
  { id: 'harakat', kind: 'harakat', title: { ms: 'Baris Huruf', en: 'Marks on Letters' }, blurb: { ms: 'Fathah, kasrah, dammah dan lain-lain.', en: 'Fathah, kasrah, dammah and more.' }, icon: 'star' },
  { id: 'trace', kind: 'trace', title: { ms: 'Surih Huruf', en: 'Trace the Letters' }, blurb: { ms: 'Surih huruf hijaiyah dengan jari.', en: 'Trace Hijaiyah letters with a finger.' }, icon: 'pencil' }
];
