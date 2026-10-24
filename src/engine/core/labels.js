// Words shown under answer pictures. Built-in picture patterns get their
// label from the vocabulary (answerChoices) so teachers can rename anything.

const NUM_WORDS = {
  ms: ['sifar', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'lapan', 'sembilan', 'sepuluh'],
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
};
const SIZE_WORDS = {
  size: { ms: { s: 'kecil', m: 'sederhana', l: 'besar' }, en: { s: 'Small', m: 'Medium', l: 'Big' } },
  len: { ms: { s: 'pendek', m: 'sederhana', l: 'panjang' }, en: { s: 'Short', m: 'Medium', l: 'Long' } }
};
const WORDS = {
  ball: { ms: 'Bola', en: 'ball' }, crayon: { ms: 'Krayon', en: 'crayon' }, dots: { ms: 'titik', en: 'dots' },
  shadow: { ms: 'Bayang', en: 'shadow' }
};

// Pick the text for `lang` from { ms, en }, falling back to the first available language.
export function tr(obj, lang, fallback = 'ms') {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj[lang] === 'string' && obj[lang]) return obj[lang];
  if (typeof obj[fallback] === 'string' && obj[fallback]) return obj[fallback];
  const any = Object.values(obj).find((v) => typeof v === 'string' && v);
  return any || '';
}

const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const upperFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function choiceLabel(key, lang, vocab, fallback = 'ms') {
  if (vocab[key]) return tr(vocab[key], lang, fallback);
  const [head, a, b] = key.split(':');
  const word = (k) => (vocab[k] ? tr(vocab[k], lang, fallback) : k);
  const color = (c) => word('color:' + c);
  const L = lang === 'ms' ? 'ms' : 'en';
  switch (head) {
    case 'letter': return a;
    case 'num': return NUM_WORDS[L] && NUM_WORDS[L][+a] ? `${a} (${NUM_WORDS[L][+a]})` : a;
    case 'dots': return L === 'ms' ? `${a} ${WORDS.dots.ms}` : `${a} ${WORDS.dots.en}`;
    case 'count': {
      const n = +b; const item = vocab[a] || {};
      if (L === 'ms') return `${n} ${lower(tr(item, 'ms', fallback))}`;
      const en = tr(item, lang, fallback);
      return `${n} ${n === 1 ? lower(en) : (item.enPlural || lower(en) + 's')}`;
    }
    case 'ball': return L === 'ms' ? `Bola ${lower(color(a))}` : `${color(a)} ball`;
    case 'crayon': return L === 'ms' ? `Krayon ${lower(color(a))}` : `${color(a)} crayon`;
    case 'paint': return color(a);
    case 'shape': {
      const shape = word('shape:' + a);
      if (!b) return shape;
      return L === 'ms' ? `${shape} ${lower(color(b))}` : `${color(b)} ${lower(shape)}`;
    }
    case 'size': case 'len': {
      const sw = SIZE_WORDS[head][L][b];
      return L === 'ms' ? `${word(a)} ${sw}` : `${sw} ${lower(word(a))}`;
    }
    case 'shadow': return L === 'ms' ? `Bayang ${lower(word(a))}` : `${word(a)} shadow`;
    case 'mix': return key;
    case 'bubble': return a;
    default: return upperFirst(key);
  }
}
