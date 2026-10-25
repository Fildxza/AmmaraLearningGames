// Picture books sold at the bookshop (Kedai Buku) and shown at the cinema.
//
// Sources and licences:
//   * Fables of Aesop (Greece, about 600 BC): public domain. Retold here in our own short words for ages 2-6.
//   * Sang Kancil stories: traditional Malay folk tales, public domain. Retold here in our own words.
//   * Knowledge books: original text written for AmmaraGames from general, well-established facts.
// Every page: { text: { ms, en }, art: icon key or [icon keys] (shown side by side) }.
const T = (ms, en) => ({ ms, en });
const AESOP = T('Dongeng Aesop (domain awam), diceritakan semula untuk AmmaraGames', "Aesop's Fables (public domain), retold for AmmaraGames");
const KANCIL = T('Cerita rakyat Melayu (domain awam), diceritakan semula untuk AmmaraGames', 'Malay folk tale (public domain), retold for AmmaraGames');
const OWN = T('Teks asli AmmaraGames (pengetahuan am)', 'Original AmmaraGames text (general knowledge)');

export const BOOKS = [
  // ------------------------------------------------------------------ stories
  { id: 'bk-hare', kind: 'story', price: 3, cover: 'rabbit', color: '#ff9fc8', source: AESOP,
    title: T('Arnab dan Kura-kura', 'The Hare and the Tortoise'),
    moral: T('Perlahan tetapi tidak berhenti, kita boleh berjaya.', 'Slow and steady, we can get there.'),
    pages: [
      { art: ['rabbit', 'turtle'], text: T('Arnab suka berlari laju. "Saya paling laju!" katanya.', 'Hare loved to run fast. "I am the fastest!" he said.') },
      { art: 'turtle', text: T('Kura-kura berkata, "Mari kita berlumba."', 'Tortoise said, "Let us have a race."') },
      { art: 'rabbit', text: T('Arnab berlari jauh ke depan. Dia rasa mengantuk, lalu tidur di bawah pokok.', 'Hare ran far ahead. He felt sleepy and took a nap under a tree.') },
      { art: 'turtle', text: T('Kura-kura berjalan perlahan-lahan, terus dan terus, tidak berhenti.', 'Tortoise walked slowly, on and on, and never stopped.') },
      { art: ['turtle', 'star'], text: T('Apabila Arnab bangun, Kura-kura sudah sampai ke garisan penamat!', 'When Hare woke up, Tortoise had already reached the finish line!') }
    ] },
  { id: 'bk-lion', kind: 'story', price: 3, cover: 'lion', color: '#ffc24a', source: AESOP,
    title: T('Singa dan Tikus', 'The Lion and the Mouse'),
    moral: T('Kawan yang kecil pun boleh menolong kita.', 'Even a small friend can help us.'),
    pages: [
      { art: ['lion', 'mouse'], text: T('Seekor singa sedang tidur. Seekor tikus kecil terpanjat ke atas hidungnya.', 'A lion was asleep. A little mouse climbed onto his nose.') },
      { art: 'lion', text: T('Singa terjaga dan menangkap tikus itu. "Tolong lepaskan saya," kata tikus. "Satu hari saya akan menolong kamu."', 'The lion woke and caught the mouse. "Please let me go," said the mouse. "One day I will help you."') },
      { art: 'face_happy', text: T('Singa ketawa, tetapi dia baik hati. Dia melepaskan tikus itu.', 'The lion laughed, but he was kind. He let the mouse go.') },
      { art: 'face_sad', text: T('Beberapa hari kemudian, singa terperangkap dalam jaring.', 'Some days later, the lion was caught in a net.') },
      { art: ['mouse', 'lion'], text: T('Tikus datang dan menggigit tali jaring sehingga putus. Singa bebas! Sekarang mereka berkawan.', 'The mouse came and chewed the ropes until they broke. The lion was free! Now they are friends.') }
    ] },
  { id: 'bk-ant', kind: 'story', price: 3, cover: 'ant', color: '#8fd45e', source: AESOP,
    title: T('Semut dan Belalang', 'The Ant and the Grasshopper'),
    moral: T('Bersedia awal itu bijak.', 'It is wise to get ready early.'),
    pages: [
      { art: ['grasshopper', 'sun'], text: T('Pada musim panas, Belalang bermain dan menyanyi sepanjang hari.', 'In summer, Grasshopper played and sang all day.') },
      { art: ['ant', 'seed'], text: T('Semut pula sibuk mengangkut makanan ke rumahnya.', 'Ant was busy carrying food to her home.') },
      { art: 'face_happy', text: T('"Mari bermain!" kata Belalang. "Saya sedang menyimpan makanan," jawab Semut.', '"Come and play!" said Grasshopper. "I am saving food," said Ant.') },
      { art: ['grasshopper', 'snow'], text: T('Musim sejuk tiba. Belalang tiada makanan dan berasa lapar.', 'Winter came. Grasshopper had no food and felt hungry.') },
      { art: ['bowl', 'face_happy'], text: T('Semut yang baik hati berkongsi makanannya. Belalang berjanji akan bersedia lebih awal.', 'Kind Ant shared her food. Grasshopper promised to get ready early next time.') }
    ] },
  { id: 'bk-crow', kind: 'story', price: 3, cover: 'bird', color: '#7fcbff', source: AESOP,
    title: T('Burung Gagak yang Bijak', 'The Clever Crow'),
    moral: T('Jangan putus asa. Fikir dan cuba lagi.', 'Do not give up. Think and try again.'),
    pages: [
      { art: 'sun', text: T('Hari sangat panas. Seekor burung gagak berasa sangat dahaga.', 'It was a very hot day. A crow was very thirsty.') },
      { art: 'water_glass', text: T('Dia jumpa sebuah balang. Airnya ada di bawah sekali, paruhnya tidak sampai.', 'He found a jar. The water was at the very bottom, and his beak could not reach it.') },
      { art: 'rock', text: T('Gagak berfikir. Dia mengambil batu kecil dan memasukkannya ke dalam balang, satu demi satu.', 'The crow thought hard. He picked up small stones and dropped them into the jar, one by one.') },
      { art: ['water_drop', 'bird'], text: T('Air naik sedikit demi sedikit, sehingga gagak dapat minum. Bijaknya!', 'Little by little the water rose, until the crow could drink. How clever!') }
    ] },
  { id: 'bk-wind', kind: 'story', price: 3, cover: 'sun', color: '#ffd65a', source: AESOP,
    title: T('Angin dan Matahari', 'The Wind and the Sun'),
    moral: T('Lemah lembut lebih hebat daripada kasar.', 'Being gentle works better than being rough.'),
    pages: [
      { art: ['cloud', 'sun'], text: T('Angin dan Matahari bertanding. "Siapa boleh buat lelaki itu buka jaketnya?"', 'The Wind and the Sun had a contest. "Who can make that man take off his coat?"') },
      { art: 'cloud', text: T('Angin meniup dengan kuat. Lelaki itu memegang jaketnya lebih erat.', 'The Wind blew hard. The man held his coat even tighter.') },
      { art: 'sun', text: T('Matahari pula bersinar dengan lembut dan hangat.', 'Then the Sun shone gently and warmly.') },
      { art: ['face_happy', 'clean_clothes'], text: T('Lelaki itu berasa panas dan membuka jaketnya. Matahari menang!', 'The man felt warm and took off his coat. The Sun won!') }
    ] },
  { id: 'bk-dog', kind: 'story', price: 3, cover: 'dog', color: '#e8c39a', source: AESOP,
    title: T('Anjing dan Bayang-bayang', 'The Dog and His Reflection'),
    moral: T('Bersyukurlah dengan apa yang kita ada.', 'Be happy with what you have.'),
    pages: [
      { art: 'dog', text: T('Seekor anjing mendapat seketul tulang. Dia berjalan pulang melintasi jambatan.', 'A dog got a bone. He walked home across a bridge.') },
      { art: 'water_drop', text: T('Dia melihat ke dalam sungai dan nampak seekor anjing lain dengan tulang yang lebih besar.', 'He looked into the river and saw another dog with a bigger bone.') },
      { art: 'face_surprised', text: T('Dia menyalak untuk merampas tulang itu, dan tulangnya sendiri jatuh ke dalam air!', 'He barked to grab it, and his own bone fell into the water!') },
      { art: 'face_sad', text: T('Rupa-rupanya itu bayang-bayangnya sendiri. Sekarang dia tiada tulang langsung.', 'It was only his own reflection. Now he had no bone at all.') }
    ] },
  { id: 'bk-kancil', kind: 'story', price: 4, cover: 'mousedeer', color: '#b8d48a', source: KANCIL,
    title: T('Sang Kancil dan Buaya', 'Mousedeer and the Crocodiles'),
    moral: T('Gunakan akal untuk menyelesaikan masalah.', 'Use your clever mind to solve problems.'),
    pages: [
      { art: 'mousedeer', text: T('Sang Kancil ingin makan buah-buahan di seberang sungai.', 'Mousedeer wanted to eat the fruit on the other side of the river.') },
      { art: 'crocodile', text: T('Tetapi sungai itu dalam, dan banyak buaya di dalamnya.', 'But the river was deep, and many crocodiles lived in it.') },
      { art: ['mousedeer', 'crocodile'], text: T('"Raja mahu tahu berapa ekor buaya di sungai ini. Berbarislah, saya akan kira!" kata Sang Kancil.', '"The King wants to know how many crocodiles live here. Line up, and I will count you!" said Mousedeer.') },
      { art: 'count:crocodile:5', text: T('Buaya-buaya berbaris. Sang Kancil melompat di atas belakang mereka: satu, dua, tiga, empat, lima…', 'The crocodiles lined up. Mousedeer hopped on their backs: one, two, three, four, five…') },
      { art: ['mousedeer', 'banana'], text: T('Dia sampai ke seberang dan menikmati buah-buahan. Sang Kancil memang bijak!', 'He reached the other side and enjoyed the fruit. Mousedeer is so clever!') }
    ] },
  // ------------------------------------------------------------------ knowledge
  { id: 'bk-planet', kind: 'know', price: 2, cover: 'saturn', color: '#4a5bb5', source: OWN,
    title: T('Planet Kita', 'Our Planets'),
    pages: [
      { art: 'sun', text: T('Matahari ialah sebuah bintang. Ia memberi kita cahaya dan haba.', 'The Sun is a star. It gives us light and heat.') },
      { art: 'earth', text: T('Kita tinggal di planet Bumi. Bumi ada daratan, laut dan udara.', 'We live on planet Earth. Earth has land, seas and air.') },
      { art: 'moon_full', text: T('Bulan mengelilingi Bumi. Bulan tidak bercahaya sendiri; ia memantulkan cahaya Matahari.', 'The Moon goes around the Earth. It does not make its own light; it reflects sunlight.') },
      { art: 'mars', text: T('Marikh ialah planet merah.', 'Mars is the red planet.') },
      { art: 'saturn', text: T('Zuhal mempunyai gelang yang cantik.', 'Saturn has beautiful rings.') },
      { art: 'jupiter', text: T('Musytari ialah planet yang paling besar.', 'Jupiter is the biggest planet.') }
    ] },
  { id: 'bk-mywild', kind: 'know', price: 2, cover: 'tiger', color: '#3fa64a', source: OWN,
    title: T('Haiwan Malaysia', 'Animals of Malaysia'),
    pages: [
      { art: 'tiger', text: T('Harimau Malaya ialah haiwan kebangsaan Malaysia. Ia tinggal di hutan.', 'The Malayan tiger is the national animal of Malaysia. It lives in the forest.') },
      { art: 'orangutan', text: T('Di Malaysia, orang utan tinggal di hutan Sabah dan Sarawak.', 'In Malaysia, orangutans live in the forests of Sabah and Sarawak.') },
      { art: 'hornbill', text: T('Burung enggang mempunyai paruh yang besar. Sarawak digelar Bumi Kenyalang.', 'The hornbill has a very big beak. Sarawak is called the Land of the Hornbills.') },
      { art: 'turtle', text: T('Penyu datang ke pantai untuk bertelur di dalam pasir.', 'Sea turtles come to the beach to lay their eggs in the sand.') },
      { art: 'mousedeer', text: T('Kancil ialah rusa yang sangat kecil dan pandai bersembunyi.', 'The mousedeer is a very small deer that is good at hiding.') }
    ] },
  { id: 'bk-body', kind: 'know', price: 2, cover: 'kid_face', color: '#ff9fb6', source: OWN,
    title: T('Badan Saya', 'My Body'),
    pages: [
      { art: 'eye', text: T('Mata untuk melihat.', 'Eyes help us see.') },
      { art: 'ear', text: T('Telinga untuk mendengar.', 'Ears help us hear.') },
      { art: 'nose', text: T('Hidung untuk menghidu bau.', 'Our nose helps us smell.') },
      { art: 'tongue', text: T('Lidah untuk merasa makanan: manis, masin, masam.', 'Our tongue tastes food: sweet, salty, sour.') },
      { art: 'hand', text: T('Tangan untuk menyentuh dan memegang. Itulah lima deria kita!', 'Hands help us touch and hold. These are our five senses!') },
      { art: 'face_happy', text: T('Jantung kita berdegup setiap masa untuk mengepam darah ke seluruh badan.', 'Our heart beats all the time, pumping blood around our body.') }
    ] },
  { id: 'bk-road', kind: 'know', price: 2, cover: 'traffic_red', color: '#ff6b6b', source: OWN,
    title: T('Selamat di Jalan Raya', 'Safe on the Road'),
    pages: [
      { art: 'adult', text: T('Pegang tangan orang dewasa apabila berjalan di tepi jalan.', 'Hold a grown-up\'s hand when walking near the road.') },
      { art: 'zebra_crossing', text: T('Lintas jalan di lintasan zebra.', 'Cross the road at the zebra crossing.') },
      { art: 'eye', text: T('Di Malaysia, kereta bergerak di sebelah kiri. Lihat kanan, kiri, dan kanan sekali lagi sebelum melintas.', 'In Malaysia, cars drive on the left. Look right, left, and right again before crossing.') },
      { art: ['traffic_red', 'traffic_green'], text: T('Merah bermaksud berhenti. Hijau bermaksud jalan.', 'Red means stop. Green means go.') },
      { art: 'seatbelt', text: T('Pakai tali pinggang keledar di dalam kereta.', 'Wear your seat belt in the car.') },
      { art: 'helmet', text: T('Pakai topi keledar apabila naik basikal.', 'Wear a helmet when you ride a bicycle.') }
    ] },
  { id: 'bk-fruit', kind: 'know', price: 2, cover: 'durian', color: '#ffd65a', source: OWN,
    title: T('Buah-buahan Malaysia', 'Fruits of Malaysia'),
    pages: [
      { art: 'durian', text: T('Durian digelar Raja Buah. Kulitnya berduri dan baunya kuat.', 'Durian is called the King of Fruits. It has a spiky skin and a strong smell.') },
      { art: 'rambutan', text: T('Rambutan berbulu merah, tetapi isinya putih dan manis.', 'Rambutan is red and hairy outside, white and sweet inside.') },
      { art: 'banana', text: T('Pisang memberi kita tenaga.', 'Bananas give us energy.') },
      { art: 'pineapple', text: T('Nanas ada daun yang tajam di atas kepalanya.', 'A pineapple has spiky leaves on top.') },
      { art: 'coconut', text: T('Air kelapa sejuk dan menyegarkan.', 'Coconut water is cool and refreshing.') }
    ] },
  { id: 'bk-negaraku', kind: 'know', price: 3, cover: 'flag_my', color: '#1b2a8f', source: OWN,
    title: T('Malaysia Negaraku', 'Malaysia, My Country'),
    pages: [
      { art: 'flag_my', text: T('Bendera Malaysia dipanggil Jalur Gemilang. Ia ada 14 jalur merah dan putih.', 'The flag of Malaysia is called Jalur Gemilang. It has 14 red and white stripes.') },
      { art: 'flag_my', text: T('Di atasnya ada bulan sabit dan bintang berwarna kuning.', 'It has a yellow crescent moon and a yellow star.') },
      { art: 'hibiscus', text: T('Bunga Raya ialah bunga kebangsaan Malaysia.', 'The hibiscus (Bunga Raya) is the national flower of Malaysia.') },
      { art: 'tiger', text: T('Harimau Malaya ialah haiwan kebangsaan.', 'The Malayan tiger is the national animal.') },
      { art: 'star', text: T('Ibu negara Malaysia ialah Kuala Lumpur.', 'The capital city of Malaysia is Kuala Lumpur.') },
      { art: ['flag_my', 'face_happy'], text: T('Hari Kebangsaan disambut setiap 31 Ogos. Merdeka!', 'National Day is celebrated every 31 August. Merdeka!') }
    ] },
  { id: 'bk-manners', kind: 'know', price: 2, cover: 'act_thanks', color: '#6fdcb4', source: OWN,
    title: T('Adab Harian', 'Good Manners Every Day'),
    pages: [
      { art: 'act_wave', text: T('Ucapkan salam apabila berjumpa orang.', 'Greet people when you meet them.') },
      { art: 'act_thanks', text: T('Ucapkan terima kasih apabila orang menolong kita.', 'Say thank you when someone helps you.') },
      { art: 'act_sorry', text: T('Minta maaf apabila kita tersilap.', 'Say sorry when you make a mistake.') },
      { art: 'act_share', text: T('Kongsi mainan dengan kawan-kawan.', 'Share your toys with your friends.') },
      { art: 'act_wash_hands', text: T('Basuh tangan sebelum makan.', 'Wash your hands before eating.') },
      { art: 'act_turns', text: T('Beratur dan tunggu giliran dengan sabar.', 'Line up and wait for your turn patiently.') }
    ] },
  { id: 'bk-recycle', kind: 'know', price: 2, cover: 'recycle', color: '#4cc46a', source: OWN,
    title: T('Jom Kitar Semula', "Let's Recycle"),
    pages: [
      { art: 'recycle', text: T('Kitar semula bermaksud barang lama dijadikan barang baharu.', 'Recycling means old things are made into new things.') },
      { art: ['bin_paper', 'paper'], text: T('Kertas dan kotak masuk ke tong biru.', 'Paper and boxes go in the blue bin.') },
      { art: ['bin_plastic', 'soda'], text: T('Botol plastik dan tin masuk ke tong oren.', 'Plastic bottles and cans go in the orange bin.') },
      { art: ['bin_glass', 'water_glass'], text: T('Kaca masuk ke tong perang.', 'Glass goes in the brown bin.') },
      { art: ['tap', 'lamp'], text: T('Tutup paip dan suis lampu untuk menjimatkan air dan elektrik.', 'Turn off the tap and the lights to save water and electricity.') }
    ] },
  { id: 'bk-dino', kind: 'know', price: 3, cover: 'trex', color: '#ff9a3c', source: OWN,
    title: T('Dunia Dinosaur', 'The World of Dinosaurs'),
    pages: [
      { art: 'dinosaur', text: T('Dinosaur hidup lama dahulu, sebelum ada manusia.', 'Dinosaurs lived a very long time ago, before there were people.') },
      { art: 'trex', text: T('Tyrannosaurus rex mempunyai gigi yang besar dan tajam. Ia makan daging.', 'Tyrannosaurus rex had big, sharp teeth. It ate meat.') },
      { art: 'dinosaur', text: T('Ada dinosaur berleher panjang yang makan daun di pokok yang tinggi.', 'Some dinosaurs had long necks and ate leaves from tall trees.') },
      { art: 'egg', text: T('Dinosaur menetas daripada telur.', 'Dinosaurs hatched from eggs.') },
      { art: 'rock', text: T('Hari ini kita boleh melihat tulang dinosaur, dipanggil fosil, di muzium.', 'Today we can see dinosaur bones, called fossils, in museums.') },
      { art: 'bird', text: T('Burung ialah saudara dinosaur!', 'Birds are relatives of the dinosaurs!') }
    ] },
  { id: 'bk-sea', kind: 'know', price: 3, cover: 'whale', color: '#4fb8e8', source: OWN,
    title: T('Hidupan Laut', 'Life in the Sea'),
    pages: [
      { art: 'fish', text: T('Ikan bernafas dalam air menggunakan insang.', 'Fish breathe under water with their gills.') },
      { art: 'whale', text: T('Paus biru ialah haiwan yang paling besar di dunia.', 'The blue whale is the biggest animal in the world.') },
      { art: 'octopus', text: T('Sotong kurita ada lapan lengan.', 'An octopus has eight arms.') },
      { art: 'starfish', text: T('Tapak sulaiman berbentuk bintang dan tinggal di dasar laut.', 'A starfish is shaped like a star and lives on the sea floor.') },
      { art: 'crab', text: T('Ketam berjalan ke tepi dan ada dua penyepit.', 'A crab walks sideways and has two claws.') },
      { art: 'turtle', text: T('Penyu berenang jauh di lautan dan kembali ke pantai untuk bertelur.', 'Sea turtles swim far across the ocean and come back to the beach to lay eggs.') }
    ] },
  { id: 'bk-time', kind: 'know', price: 2, cover: 'clock', color: '#9b6bff', source: OWN,
    title: T('Pukul Berapa?', 'What Time Is It?'),
    pages: [
      { art: 'clock', text: T('Jam ada jarum pendek dan jarum panjang. Jarum pendek menunjukkan jam.', 'A clock has a short hand and a long hand. The short hand shows the hour.') },
      { art: 'scene_day', text: T('Pagi: kita bangun, mandi dan bersarapan.', 'Morning: we wake up, wash and eat breakfast.') },
      { art: 'sun', text: T('Tengah hari: Matahari tinggi di langit. Masa untuk makan tengah hari.', 'Noon: the Sun is high in the sky. Time for lunch.') },
      { art: 'scene_night', text: T('Malam: langit gelap, bulan dan bintang keluar. Masa untuk tidur.', 'Night: the sky is dark, the Moon and stars come out. Time to sleep.') },
      { art: 'num:7', text: T('Satu minggu ada 7 hari. Satu hari ada 24 jam.', 'A week has 7 days. A day has 24 hours.') }
    ] },
  { id: 'bk-butterfly', kind: 'know', price: 2, cover: 'butterfly', color: '#b79cff', source: OWN,
    title: T('Kitaran Hidup Rama-rama', 'How a Butterfly Grows'),
    pages: [
      { art: 'leaf', text: T('Rama-rama bertelur di atas daun.', 'A butterfly lays tiny eggs on a leaf.') },
      { art: 'caterpillar', text: T('Seekor ulat beluncas keluar dan makan banyak daun.', 'A caterpillar hatches and eats lots of leaves.') },
      { art: 'cocoon', text: T('Ulat membuat kepompong dan berehat di dalamnya.', 'The caterpillar makes a chrysalis and rests inside.') },
      { art: 'butterfly', text: T('Akhirnya, seekor rama-rama yang cantik keluar dan terbang!', 'At last, a beautiful butterfly comes out and flies away!') },
      { art: 'flower', text: T('Rama-rama menghisap madu bunga dan merasa dengan kakinya.', 'Butterflies drink nectar from flowers and taste with their feet.') }
    ] },
  { id: 'bk-helpers', kind: 'know', price: 2, cover: 'fire_truck', color: '#ff8a5a', source: OWN,
    title: T('Mereka Membantu Kita', 'People Who Help Us'),
    pages: [
      { art: 'hospital', text: T('Doktor dan jururawat merawat orang yang sakit.', 'Doctors and nurses look after people who are ill.') },
      { art: 'fire_truck', text: T('Ahli bomba memadam kebakaran. Dalam kecemasan, orang dewasa boleh menelefon 999.', 'Firefighters put out fires. In an emergency, a grown-up can call 999.') },
      { art: 'police_car', text: T('Polis menjaga keselamatan kita.', 'The police keep us safe.') },
      { art: 'book', text: T('Cikgu mengajar kita membaca, menulis dan mengira.', 'Teachers help us read, write and count.') },
      { art: 'letter_mail', text: T('Posmen menghantar surat dan bungkusan.', 'Postal workers deliver letters and parcels.') },
      { art: 'tractor', text: T('Petani menanam padi dan sayur untuk kita makan.', 'Farmers grow rice and vegetables for us to eat.') }
    ] },
  { id: 'bk-money', kind: 'know', price: 2, cover: 'piggy_bank', color: '#ffb43c', source: OWN,
    title: T('Duit dan Tabung', 'Money and Saving'),
    pages: [
      { art: 'coin', text: T('Kita guna duit untuk membeli barang.', 'We use money to buy things.') },
      { art: 'count:coin:3', text: T('Kira syiling sebelum membayar: satu, dua, tiga.', 'Count the coins before you pay: one, two, three.') },
      { art: 'piggy_bank', text: T('Simpan sedikit duit di dalam tabung setiap hari.', 'Put a little money in your piggy bank every day.') },
      { art: 'gift', text: T('Lama-kelamaan, duit simpanan boleh membeli sesuatu yang istimewa.', 'Little by little, your savings can buy something special.') },
      { art: 'act_share', text: T('Kita juga boleh bersedekah untuk menolong orang lain.', 'We can also give some to help other people.') }
    ] }
];
export const bookById = Object.fromEntries(BOOKS.map((b) => [b.id, b]));
