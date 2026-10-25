// The town's shops and what they sell, priced in coins (1 to 6, so a 2-4 year old can count them).
// kind: 'book' (opens in the reader), 'food' (eat it: a cheerful healthy tip), 'wear' (unlocks a wardrobe item),
//       'toy' (play with it: a short happy line), 'pet' (feed a pet: a tip about caring for animals).
import { BOOKS } from './books.js';

const T = (ms, en) => ({ ms, en });
const I = (id, kind, icon, name, price, extra = {}) => Object.assign({ id, kind, icon, name, price }, extra);

const FOOD_TIPS = {
  fruit: T('Buah-buahan penuh dengan vitamin. Sedapnya!', 'Fruit is full of vitamins. Yummy!'),
  veg: T('Sayur-sayuran membuatkan badan kita kuat.', 'Vegetables make our body strong.'),
  milk: T('Susu baik untuk tulang dan gigi.', 'Milk is good for our bones and teeth.'),
  water: T('Air kosong ialah minuman yang paling baik.', 'Plain water is the best drink.'),
  sweet: T('Manisnya! Makan sedikit sahaja, dan jangan lupa gosok gigi.', 'So sweet! Just a little, and remember to brush your teeth.'),
  meal: T('Basuh tangan, baca doa, dan makan perlahan-lahan.', 'Wash your hands, say a prayer, and eat slowly.'),
  drink: T('Minum perlahan-lahan. Segarnya!', 'Drink slowly. So refreshing!'),
  bread: T('Roti memberi kita tenaga untuk bermain.', 'Bread gives us energy to play.')
};

export const SHOPS = {
  books: { name: T('Kedai Buku', 'Bookshop'), icon: 'book', color: '#9b6bff',
    greet: T('Selamat datang! Pilih buku untuk dibaca.', 'Welcome! Choose a book to read.'),
    items: BOOKS.map((b) => I('buy-' + b.id, 'book', b.cover, b.title, b.price, { book: b.id })) },
  candy: { name: T('Kedai Gula-gula', 'Sweet Shop'), icon: 'lollipop', color: '#ff8fc0',
    greet: T('Gula-gula yang manis! Makan sedikit sahaja ya.', 'Sweet treats! Just a little, OK?'),
    items: [
      I('lollipop', 'food', 'lollipop', T('Lolipop', 'Lollipop'), 1, { tip: FOOD_TIPS.sweet }),
      I('candy', 'food', 'candy', T('Gula-gula', 'Sweet'), 1, { tip: FOOD_TIPS.sweet }),
      I('cookie', 'food', 'cookie', T('Biskut Coklat', 'Chocolate Cookie'), 1, { tip: FOOD_TIPS.sweet }),
      I('donut', 'food', 'donut', T('Donut', 'Doughnut'), 2, { tip: FOOD_TIPS.sweet }),
      I('cotton', 'food', 'cotton_candy', T('Gula-gula Kapas', 'Candy Floss'), 2, { tip: FOOD_TIPS.sweet }),
      I('cake', 'food', 'cake', T('Kek Hari Jadi', 'Birthday Cake'), 3, { tip: FOOD_TIPS.sweet })
    ] },
  clothes: { name: T('Butik Ceria', 'Happy Boutique'), icon: 'dress', color: '#ff7eb6',
    greet: T('Baju dan aksesori yang comel! Pilih yang kamu suka.', 'Cute clothes and accessories! Choose your favourite.'),
    items: [
      I('w-navy', 'wear', 'dress', T('Baju Biru Laut', 'Navy Dress'), 4, { reward: 'outfit_navy' }),
      I('w-teal', 'wear', 'dress', T('Baju Biru Firus', 'Teal Dress'), 4, { reward: 'outfit_teal' }),
      I('w-lime', 'wear', 'dress', T('Baju Hijau Limau', 'Lime Dress'), 4, { reward: 'outfit_lime' }),
      I('w-purple', 'wear', 'dress', T('Baju Ungu', 'Purple Dress'), 4, { reward: 'outfit_purple' }),
      I('w-capred', 'wear', 'hat', T('Topi Merah', 'Red Cap'), 3, { reward: 'cap_red' }),
      I('w-bowblue', 'wear', 'party_hat', T('Reben Biru', 'Blue Bow'), 3, { reward: 'bow_blue' }),
      I('w-crownsilver', 'wear', 'star', T('Mahkota Perak', 'Silver Crown'), 6, { reward: 'crown_silver' }),
      I('w-glasspink', 'wear', 'eye', T('Cermin Mata Merah Jambu', 'Pink Glasses'), 3, { reward: 'glasses_pink' }),
      I('w-capeblue', 'wear', 'shirt', T('Jubah Biru', 'Blue Cape'), 5, { reward: 'cape_blue' }),
      I('w-wingspink', 'wear', 'butterfly', T('Sayap Merah Jambu', 'Pink Wings'), 5, { reward: 'wings_pink' }),
      I('w-backpack', 'wear', 'bag', T('Beg Galas Hijau', 'Green Backpack'), 4, { reward: 'backpack_green' })
    ] },
  toys: { name: T('Kedai Mainan', 'Toy Shop'), icon: 'teddy', color: '#ff9ad5',
    greet: T('Jom pilih mainan!', "Let's choose a toy!"),
    items: [
      I('t-balloon-blue', 'wear', 'ball:blue', T('Belon Biru', 'Blue Balloon'), 2, { reward: 'balloon_blue' }),
      I('t-balloon-yellow', 'wear', 'ball:yellow', T('Belon Kuning', 'Yellow Balloon'), 2, { reward: 'balloon_yellow' }),
      I('t-wand', 'wear', 'star', T('Tongkat Ajaib Merah Jambu', 'Pink Magic Wand'), 3, { reward: 'wand_pink' }),
      I('t-ball', 'toy', 'ball', T('Bola', 'Ball'), 2, { tip: T('Jom tendang bola di taman!', "Let's kick the ball in the park!") }),
      I('t-kite', 'toy', 'kite', T('Layang-layang', 'Kite'), 3, { tip: T('Layang-layang terbang tinggi apabila angin bertiup!', 'The kite flies high when the wind blows!') }),
      I('t-teddy', 'toy', 'teddy', T('Beruang Teddy', 'Teddy Bear'), 4, { tip: T('Peluk teddy! Teddy suka kamu.', 'Hug the teddy! Teddy loves you.') }),
      I('t-car', 'toy', 'car', T('Kereta Mainan', 'Toy Car'), 3, { tip: T('Vroom vroom! Pandu dengan berhati-hati.', 'Vroom vroom! Drive carefully.') })
    ] },
  food: { name: T('Medan Selera', 'Food Court'), icon: 'rice_plate', color: '#ff9a3c',
    greet: T('Lapar? Jom makan!', 'Hungry? Let us eat!'),
    items: [
      I('nasilemak', 'food', 'rice_plate', T('Nasi Lemak', 'Nasi Lemak'), 3, { tip: FOOD_TIPS.meal }),
      I('roti', 'food', 'bread', T('Roti Canai', 'Roti Canai'), 2, { tip: FOOD_TIPS.meal }),
      I('satay', 'food', 'satay', T('Sate', 'Satay'), 3, { tip: FOOD_TIPS.meal }),
      I('mee', 'food', 'noodles', T('Mee Sup', 'Noodle Soup'), 3, { tip: FOOD_TIPS.meal }),
      I('juice', 'food', 'juice', T('Jus Oren', 'Orange Juice'), 2, { tip: FOOD_TIPS.drink }),
      I('kelapa', 'food', 'coconut', T('Air Kelapa', 'Coconut Water'), 2, { tip: FOOD_TIPS.drink }),
      I('tembikai', 'food', 'watermelon', T('Tembikai', 'Watermelon'), 1, { tip: FOOD_TIPS.fruit }),
      I('aiskrim', 'food', 'ice_cream', T('Aiskrim', 'Ice Cream'), 2, { tip: FOOD_TIPS.sweet })
    ] },
  grocery: { name: T('Pasar Raya', 'Supermarket'), icon: 'shopping_bag', color: '#4cc46a',
    greet: T('Selamat datang ke Pasar Raya! Kira syiling kamu.', 'Welcome to the supermarket! Count your coins.'),
    items: [
      I('g-apple', 'food', 'apple', T('Epal', 'Apple'), 1, { tip: FOOD_TIPS.fruit }),
      I('g-banana', 'food', 'banana', T('Pisang', 'Banana'), 1, { tip: FOOD_TIPS.fruit }),
      I('g-orange', 'food', 'orange', T('Oren', 'Orange'), 1, { tip: FOOD_TIPS.fruit }),
      I('g-grapes', 'food', 'grapes', T('Anggur', 'Grapes'), 2, { tip: FOOD_TIPS.fruit }),
      I('g-carrot', 'food', 'carrot', T('Lobak Merah', 'Carrot'), 1, { tip: FOOD_TIPS.veg }),
      I('g-broccoli', 'food', 'broccoli', T('Brokoli', 'Broccoli'), 1, { tip: FOOD_TIPS.veg }),
      I('g-milk', 'food', 'milk_box', T('Susu', 'Milk'), 2, { tip: FOOD_TIPS.milk }),
      I('g-bread', 'food', 'bread', T('Roti', 'Bread'), 2, { tip: FOOD_TIPS.bread }),
      I('g-egg', 'food', 'egg', T('Telur', 'Egg'), 1, { tip: T('Telur memberi kita protein untuk membesar.', 'Eggs give us protein to grow.') }),
      I('g-water', 'food', 'water_glass', T('Air Mineral', 'Bottled Water'), 1, { tip: FOOD_TIPS.water })
    ] },
  funfair: { name: T('Gerai Pesta Ria', 'Funfair Stall'), icon: 'popcorn', color: '#ff6fa8',
    greet: T('Seronoknya pesta ria! Nak snek?', 'Fun at the fair! Want a snack?'),
    items: [
      I('f-popcorn', 'food', 'popcorn', T('Bertih Jagung', 'Popcorn'), 2, { tip: FOOD_TIPS.sweet }),
      I('f-cotton', 'food', 'cotton_candy', T('Gula-gula Kapas', 'Candy Floss'), 2, { tip: FOOD_TIPS.sweet }),
      I('f-icecream', 'food', 'ice_cream', T('Aiskrim', 'Ice Cream'), 2, { tip: FOOD_TIPS.sweet }),
      I('f-juice', 'food', 'juice', T('Jus Buah', 'Fruit Juice'), 2, { tip: FOOD_TIPS.drink }),
      I('f-balloon', 'wear', 'ball:yellow', T('Belon Kuning', 'Yellow Balloon'), 2, { reward: 'balloon_yellow' })
    ] },
  pets: { name: T('Kedai Haiwan', 'Pet Shop'), icon: 'cat', color: '#ffb43c',
    greet: T('Haiwan peliharaan perlukan makanan, air dan kasih sayang.', 'Pets need food, water and love.'),
    items: [
      I('p-catfood', 'pet', 'pet_food', T('Makanan Kucing', 'Cat Food'), 2, { pet: 'cat', tip: T('Kucing gembira! Beri air bersih juga ya.', 'The cat is happy! Give it clean water too.') }),
      I('p-dogfood', 'pet', 'pet_food', T('Makanan Anjing', 'Dog Food'), 2, { pet: 'dog', tip: T('Anjing suka berjalan-jalan setiap hari.', 'Dogs love a walk every day.') }),
      I('p-fishfood', 'pet', 'fish', T('Makanan Ikan', 'Fish Food'), 1, { pet: 'fish', tip: T('Beri ikan makan sedikit sahaja, dua kali sehari.', 'Feed fish just a little, twice a day.') }),
      I('p-rabbitfood', 'pet', 'carrot', T('Lobak untuk Arnab', 'Carrot for the Rabbit'), 1, { pet: 'rabbit', tip: T('Arnab suka sayur dan rumput.', 'Rabbits like vegetables and hay.') }),
      I('p-birdseed', 'pet', 'seed', T('Biji untuk Burung', 'Bird Seed'), 1, { pet: 'bird', tip: T('Burung makan biji-bijian dan suka bernyanyi.', 'Birds eat seeds and love to sing.') })
    ] }
};
export const SHOP_IDS = Object.keys(SHOPS);
export const itemById = Object.fromEntries(Object.values(SHOPS).flatMap((s) => s.items.map((it) => [it.id, it])));
export const COIN_RULES = { quiz: 2, fact: 1, book: 1, pickup: 1, startingCoins: 5 };
