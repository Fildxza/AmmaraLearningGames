# One-off generator for research/objectives.json (kept so the file can be regenerated and reviewed).
import json

Q = {
    'cdc2point': ('cdc-2y', 'Points to things in a book when you ask, like "Where is the bear?"', 'related'),
    'cdc2body': ('cdc-2y', 'Points to at least two body parts when you ask him to show you', 'direct'),
    'cdc4color': ('cdc-4y', 'Names a few colors of items', 'direct'),
    'cdc4use': ('cdc-4y', 'Answers simple questions like "What is a coat for?" or "What is a crayon for?"', 'direct'),
    'cdc3hot': ('cdc-3y', 'Avoids touching hot objects, like a stove, when you warn her', 'direct'),
    'cdc4danger': ('cdc-4y', 'Avoids danger, like not jumping from tall heights at the playground', 'related'),
    'cdc4comfort': ('cdc-4y', 'Comforts others who are hurt or sad, like hugging a crying friend', 'direct'),
    'cdc4next': ('cdc-4y', 'Tells what comes next in a well-known story', 'related'),
    'cdc3action': ('cdc-3y', 'Says what action is happening in a picture or book when asked, like "running," "eating," or "playing"', 'related'),
    'cdc4helper': ('cdc-4y', 'Likes to be a "helper"', 'related'),
}
O = {}


def add(key, en, ms, domain, ages, q=None, src=None, note=''):
    e = {'description': {'en': en, 'ms': ms}, 'domain': domain, 'recommendedAges': ages, 'sources': [], 'alignment': None,
         'alignmentStrength': None, 'verification': 'designed by the build assistant; not reviewed by a teacher', 'notes': note}
    if q:
        sid, quote, strength = Q[q]
        e['sources'].append(sid)
        e['alignment'] = {'source': sid, 'quote': quote}
        e['alignmentStrength'] = strength
    for s in (src or []):
        if s not in e['sources']:
            e['sources'].append(s)
    O[key] = e


L = 'Literacy: letters'; N = 'Early maths: numbers'; C = 'Colours'; Sh = 'Early maths: shapes'; A = 'Science: animals'; F = 'Science: food and plants'; V = 'General knowledge: vehicles'
B = 'Body and senses'; OB = 'Everyday objects'; NA = 'Nature and plants'; SP = 'Space'; H = 'Hygiene'; SF = 'Safety'; EM = 'Emotions'; P = 'Patterns and matching'
ALL = ['2-3', '3-4', '4+']

add('letter-identify', 'Recognise a named capital letter among three.', 'Kenal huruf besar yang disebut antara tiga.', L, ALL, 'cdc2point')
add('letter-match', 'Match a capital letter to the same letter.', 'Padankan huruf besar dengan huruf yang sama.', L, ALL)
add('letter-case-match', 'Match a capital letter with its lower-case form.', 'Padankan huruf besar dengan huruf kecil.', L, ['3-4', '4+'])
add('letter-word-intro', 'Hear a letter paired with a familiar word (B for ball, A for ambulance).', 'Dengar huruf dipasangkan dengan perkataan biasa.', L, ['2-3'], note='First letters are checked per language by the validator.')
add('letter-sound', 'Pick the picture whose name starts with the letter.', 'Pilih gambar yang namanya bermula dengan huruf itu.', L, ['3-4', '4+'], note='The validator rejects any item where a distractor also starts with the letter in either language.')
add('count-small', 'Count a small group (1 to 5) and match it to a quantity or numeral.', 'Kira kumpulan kecil (1 hingga 5).', N, ALL, src=['brightwheel-dc', 'elof-headstart'])
add('numeral-identify', 'Recognise a numeral.', 'Kenal angka.', N, ALL, 'cdc2point')
add('numeral-quantity', 'Match a numeral or dot pattern with the group of that size.', 'Padankan angka dengan kumpulan yang sama banyak.', N, ALL, src=['elof-headstart'])
add('compare-quantity', 'Find the group with the most, fewest or the same number.', 'Cari kumpulan paling banyak, paling sedikit atau sama banyak.', N, ALL, src=['elof-headstart'])
add('number-sequence', 'Say the number that comes before or after.', 'Sebut nombor sebelum atau selepas.', N, ['3-4', '4+'], 'cdc4next')
add('color-identify', 'Find a common colour.', 'Kenal dan cari warna biasa.', C, ALL, 'cdc4color')
add('color-object', 'Say what colour a familiar object is.', 'Beritahu warna benda yang biasa dilihat.', C, ALL, 'cdc4color')
add('color-match', 'Match a crayon colour to an object of the same colour.', 'Padankan warna krayon dengan benda yang sama warna.', C, ALL, 'cdc4color')
add('color-mixing', 'Predict the colour made by mixing two paints.', 'Teka warna campuran dua cat.', C, ['3-4', '4+'], note='Standard paint mixing (red+yellow=orange, blue+yellow=green, red+blue=purple, red+white=pink); not checked against a fetched source.')
add('color-intro', 'Notice that some things have many colours (rainbow).', 'Sedar bahawa ada benda berwarna-warni.', C, ['2-3', '3-4'])
add('shape-identify', 'Name or find circle, triangle, square.', 'Kenal bulatan, segi tiga, segi empat sama.', Sh, ALL, src=['elof-headstart'])
add('shape-attribute-match', 'Match shapes by shape, ignoring colour.', 'Padankan bentuk tanpa mengambil kira warna.', Sh, ['3-4', '4+'], src=['elof-headstart'])
add('shape-special', 'Identify star, heart, oval, crescent, rectangle, hexagon.', 'Kenal bintang, hati, bujur, bulan sabit, segi empat tepat, heksagon.', Sh, ALL, src=['elof-headstart'])
add('shape-in-objects', 'Link shapes to everyday objects (clock is a circle, door is a rectangle).', 'Kaitkan bentuk dengan benda harian.', Sh, ALL, src=['elof-headstart'])
add('shape-properties', 'Count sides and corners of simple shapes.', 'Kira sisi dan bucu bentuk mudah.', Sh, ['3-4', '4+'], src=['elof-headstart'], note='Triangle 3 sides, square 4 equal sides, circle no corners: standard geometry.')
add('shape-3d-roll', 'Notice that round things roll.', 'Sedar bahawa benda bulat boleh bergolek.', Sh, ['2-3', '3-4'])
add('animal-sound', 'Match an animal to the sound it makes.', 'Padankan haiwan dengan bunyinya.', A, ALL, note='The sound word is shown as text in a speech bubble, so no audio is needed.')
add('animal-identify', 'Recognise common animals.', 'Kenal haiwan biasa.', A, ALL, 'cdc2point', src=['dbp-prpm'])
add('animal-feature', 'Link an animal to a body feature (trunk, shell, stripes, feathers).', 'Kaitkan haiwan dengan cirinya.', A, ALL, src=['dbp-prpm'])
add('animal-habitat', 'Where animals live (water, nest, hive, barn).', 'Di mana haiwan tinggal.', A, ALL)
add('fruit-identify', 'Recognise common fruits, including local ones (durian, rambutan).', 'Kenal buah biasa termasuk buah tempatan.', F, ALL, 'cdc2point')
add('veg-identify', 'Recognise common vegetables.', 'Kenal sayur biasa.', F, ALL, 'cdc2point')
add('food-sort', 'Sort food into fruit and vegetable.', 'Asingkan buah dan sayur.', F, ['3-4', '4+'], note='Everyday (kitchen) meaning of fruit and vegetable is used, not the botanical one; borderline items such as tomato are not used for sorting.')
add('produce-growth', 'Where food grows (under the ground, on a tree).', 'Di mana makanan tumbuh.', F, ['4+'])
add('food-nonfood', 'Tell food from things that are not food.', 'Bezakan makanan dengan bukan makanan.', F, ['2-3'], 'cdc2point')
add('produce-attributes', 'Describe fruit by colour, shape, taste or smell.', 'Perihal buah ikut warna, bentuk, rasa atau bau.', F, ALL)
add('vehicle-identify', 'Recognise common vehicles.', 'Kenal kenderaan biasa.', V, ALL, 'cdc2point')
add('vehicle-medium', 'Land, water or air: where vehicles travel.', 'Darat, air atau udara.', V, ALL)
add('vehicle-helpers', 'Vehicles that help people (fire engine, ambulance, tractor).', 'Kenderaan penolong.', V, ALL, 'cdc4helper')
add('vehicle-parts', 'Parts of vehicles (wheels, wings).', 'Bahagian kenderaan.', V, ['3-4', '4+'])
add('vehicle-sounds', 'Sounds linked to vehicles (siren, bell).', 'Bunyi kenderaan.', V, ['2-3', '3-4'])
add('body-identify', 'Point to named body parts.', 'Tunjuk anggota badan yang disebut.', B, ALL, 'cdc2body')
add('senses', 'Which body part we see, hear, smell, taste and touch with.', 'Pancaindera.', B, ALL)
add('body-function', 'What a body part is used for.', 'Kegunaan anggota badan.', B, ALL, 'cdc4use')
add('body-count', 'How many eyes, ears, fingers and feet we have.', 'Berapa banyak anggota badan.', B, ['3-4', '4+'])
add('object-identify', 'Recognise everyday objects.', 'Kenal benda harian.', OB, ALL, 'cdc2point')
add('object-function', 'What an everyday object is for.', 'Kegunaan benda harian.', OB, ALL, 'cdc4use')
add('object-pairs', 'Objects that go together (sock and shoe, key and lock).', 'Benda yang berpasangan.', OB, ['3-4', '4+'])
add('visual-match', 'Find the identical picture.', 'Cari gambar yang sama.', P, ALL)
add('object-odd-one-out', 'Find the item that does not belong.', 'Cari yang lain daripada yang lain.', OB, ['3-4', '4+'])
add('object-category', 'Name a category (toy).', 'Kenal kategori.', OB, ['2-3'])
add('nature-identify', 'Recognise nature things (tree, flower, rock, rainbow).', 'Kenal benda alam.', NA, ALL, 'cdc2point')
add('weather', 'Weather and what we use or see in it.', 'Cuaca.', NA, ALL)
add('plant-needs', 'What plants need to grow (water, sunlight).', 'Keperluan tumbuhan.', NA, ALL, note='Standard primary-science fact; not checked against a fetched source.')
add('plant-growth', 'Seed, sprout, flower sequence.', 'Biji, anak pokok, bunga.', NA, ['4+'], 'cdc4next')
add('day-night', 'Day and night: sun, moon, stars, sleeping.', 'Siang dan malam.', NA, ALL)
add('sky-identify', 'Recognise moon, star, sun, rocket, telescope, comet.', 'Kenal benda di langit.', SP, ALL, 'cdc2point')
add('planets', 'Earth, Mars, Saturn, Jupiter and the number of planets.', 'Planet.', SP, ALL, src=['nasa-planets', 'nasa-mars', 'nasa-saturn', 'dbp-prpm'])
add('astronaut', 'Astronauts, spacesuits, rockets, telescopes and the Moon.', 'Angkasawan.', SP, ALL)
add('sun-moon', 'The Sun is a star; the Moon goes around Earth; full moon.', 'Matahari dan bulan.', SP, ALL, note='Standard astronomy facts; not checked against a fetched source.')
add('handwashing', 'When and how to wash hands.', 'Cuci tangan.', H, ALL, src=['cdc-handwashing'])
add('toothbrushing', 'Brush teeth twice a day with a little toothpaste.', 'Gosok gigi.', H, ALL, src=['aap-toothbrushing'])
add('hair-care', 'Washing, drying and combing hair.', 'Jaga rambut.', H, ALL)
add('body-cleanliness', 'Bath, tissue, nails, clean clothes.', 'Kebersihan badan.', H, ALL, src=['cdc-handwashing'])
add('road-safety', "Red light means stop, hold an adult's hand, seat belt, helmet.", 'Keselamatan jalan raya.', SF, ALL, 'cdc4danger', src=['safekids-pedestrian'])
add('home-safety', 'Hot pots, sharp knives, medicine, sockets, fire.', 'Keselamatan di rumah.', SF, ALL, 'cdc3hot')
add('manners', 'Thank you, sorry, sharing, tidying, taking turns.', 'Adab.', 'Social skills', ALL, note='Prosocial behaviours; no punishment framing.')
add('healthy-habits', 'Sleep, water, vegetables, tidy books.', 'Tabiat sihat.', 'Healthy habits', ALL)
add('emotion-identify', 'Recognise happy, sad, angry, scared, surprised, sleepy and calm faces.', 'Kenal wajah perasaan.', EM, ALL, 'cdc3action', src=['msu-emotions'])
add('emotion-situation', 'Which feeling fits a simple situation.', 'Perasaan dalam situasi mudah.', EM, ALL, src=['msu-emotions'], note='Situations use "might feel" wording because children feel differently.')
add('emotion-regulation', 'Calming strategies: deep breaths, hug, tell a grown-up.', 'Cara bertenang.', EM, ALL, src=['msu-emotions'])
add('friendship', 'Kind responses to friends: hug, share, wave, get help, say thanks.', 'Berkawan.', EM, ALL, 'cdc4comfort')
add('shadow-match', 'Match an animal, object or fruit to its shadow.', 'Padankan dengan bayang-bayang.', P, ALL, src=['canva-worksheets'])
add('pattern-ab', 'Continue a simple repeating pattern (AB, AAA).', 'Sambung corak mudah.', P, ALL, 'cdc4next', src=['brightwheel-dc'])
add('pattern-complex', 'Continue a three-step or AAB pattern.', 'Sambung corak tiga langkah.', P, ['4+'], 'cdc4next', src=['brightwheel-dc'])
add('size-compare', 'Compare size and length (big, small, long).', 'Banding saiz dan panjang.', P, ALL, src=['brightwheel-dc'])
add('size-real-world', 'Compare real-life animal sizes when the pictures are the same size.', 'Banding saiz sebenar haiwan.', P, ['3-4', '4+'])

doc = {'_note': 'Learning objectives used by the question bank. "alignment.quote" is copied word for word from the CDC page fetched on 2026-10-24; "alignmentStrength" says whether the milestone is directly the skill ("direct") or only related ("related"). Objectives with no alignment were designed from general early-learning practice and have NOT been checked against a source.', 'objectives': O}
with open('research/objectives.json', 'w', encoding='utf-8') as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
print(len(O), 'objectives written')
