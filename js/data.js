/**
 * Dapur Ceria Inara — Complete Curriculum & Game Content Database
 * Covers:
 * - 5 Progressive Worlds (Kedai Level 1-5) & 25 Unique Menus
 * - 38+ Ingredients & 75+ Indonesian Syllable Words (BA-CA)
 * - Numbers 1-100 Trilingual Engine (Indonesian, English, Japanese)
 * - Visual Addition (+) & Mochi Cat Subtraction (-) Problem Generator
 * - A-Z Phonics & Multi-Stroke Tracing Checkpoints (Letters, 0-100 Numbers, INARA/ABI/UMI)
 * - 54 Collectible Stickers & Chef Inara Wardrobe Customization
 */

window.INARA_DATA = (function () {
  // =========================================================================
  // 1. TRILINGUAL NUMBER ENGINE (0 - 100)
  // =========================================================================
  const ID_UNITS = [
    "Nol", "Satu", "Dua", "Tiga", "Empat",
    "Lima", "Enam", "Tujuh", "Delapan", "Sembilan",
    "Sepuluh", "Sebelas"
  ];

  const EN_UNITS = [
    "Zero", "One", "Two", "Three", "Four",
    "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];

  const EN_TENS = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const JA_UNITS_ROMAJI = [
    "Zero", "Ichi", "Ni", "San", "Yon",
    "Go", "Roku", "Nana", "Hachi", "Kyuu", "Juu"
  ];

  const JA_UNITS_KANA = [
    "ゼロ", "いち", "に", "さん", "よん",
    "ご", "ろく", "なな", "はち", "きゅう", "じゅう"
  ];

  function numberToIndonesian(n) {
    n = Math.max(0, Math.min(100, Math.round(n)));
    if (n < 12) return ID_UNITS[n];
    if (n < 20) return ID_UNITS[n - 10] + " Belas";
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const rem = n % 10;
      return rem === 0 ? `${ID_UNITS[tens]} Puluh` : `${ID_UNITS[tens]} Puluh ${ID_UNITS[rem]}`;
    }
    return "Seratus";
  }

  function numberToEnglish(n) {
    n = Math.max(0, Math.min(100, Math.round(n)));
    if (n < 20) return EN_UNITS[n];
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const rem = n % 10;
      return rem === 0 ? EN_TENS[tens] : `${EN_TENS[tens]}-${EN_UNITS[rem]}`;
    }
    return "One Hundred";
  }

  function numberToJapanese(n) {
    n = Math.max(0, Math.min(100, Math.round(n)));
    if (n <= 10) {
      return { romaji: JA_UNITS_ROMAJI[n], kana: JA_UNITS_KANA[n] };
    }
    if (n < 20) {
      const rem = n % 10;
      return {
        romaji: `Juu-${JA_UNITS_ROMAJI[rem]}`,
        kana: `じゅう${JA_UNITS_KANA[rem]}`
      };
    }
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const rem = n % 10;
      const tensRomaji = `${JA_UNITS_ROMAJI[tens]}-juu`;
      const tensKana = `${JA_UNITS_KANA[tens]}じゅう`;
      if (rem === 0) return { romaji: tensRomaji, kana: tensKana };
      return {
        romaji: `${tensRomaji} ${JA_UNITS_ROMAJI[rem]}`,
        kana: `${tensKana}${JA_UNITS_KANA[rem]}`
      };
    }
    return { romaji: "Hyaku", kana: "ひゃく" };
  }

  function getNumberInfo(n) {
    const num = Math.max(0, Math.min(100, Math.round(n)));
    const ja = numberToJapanese(num);
    const tensCount = num === 100 ? 10 : Math.floor(num / 10);
    const unitsCount = num === 100 ? 0 : num % 10;
    return {
      value: num,
      id: numberToIndonesian(num),
      en: numberToEnglish(num),
      jaRomaji: ja.romaji,
      jaKana: ja.kana,
      tensCount,
      unitsCount
    };
  }

  // =========================================================================
  // 2. CUSTOMERS (PELANGGAN SPESIAL INARA)
  // =========================================================================
  const CUSTOMERS = [
    {
      id: "abi",
      name: "Abi",
      title: "Abi Tercinta",
      emoji: "👨🏻‍🍳",
      color: "#4ECDC4",
      bgLight: "#E6FAF8",
      voiceKey: "praise_abi",
      greeting: "Halo anak pintar Abi! Abi lapar nih, bikinin masakan spesial buatan Koki Inara ya!",
      praise: "MasyaAllah, pintar sekali Inara anak Abi! Masakan Inara lezat sekali!",
      praiseEn: "Wonderful job, Chef Inara! Abi loves your cooking!"
    },
    {
      id: "umi",
      name: "Umi",
      title: "Umi Sayang",
      emoji: "🧕🏻",
      color: "#FF6F91",
      bgLight: "#FFF0F4",
      voiceKey: "praise_umi",
      greeting: "Assalamualaikum Koki Inara sayang! Yuk kita masak makanan sehat bersama Umi!",
      praise: "Alhamdulillah, hebat sekali Inara sayang! Umi bangga sekali sama Koki Inara!",
      praiseEn: "Amazing job, sweetheart! Umi is so proud of you!"
    },
    {
      id: "mochi",
      name: "Mochi Kucing",
      title: "Mochi si Kucing Koki",
      emoji: "🐱",
      color: "#FFB347",
      bgLight: "#FFF7E8",
      voiceKey: "praise_mochi",
      greeting: "Meong! Halo Koki Inara! Perut Mochi keroncongan nih, masak yuk!",
      praise: "Meong! Nyam nyam, masakan Koki Inara paling enak sedunia!",
      praiseEn: "Meow! Yummy! Chef Inara is the best chef in the world!"
    },
    {
      id: "bobo",
      name: "Bobo Kelinci",
      title: "Bobo si Kelinci Ceria",
      emoji: "🐰",
      color: "#A78BFA",
      bgLight: "#F3EFFE",
      voiceKey: "praise_bobo",
      greeting: "Hop hop! Halo Inara! Bobo mau pesan makanan sehat buatanmu!",
      praise: "Hore! Masakan buatan Inara bikin Bobo Kelinci semangat melompat!",
      praiseEn: "Hooray! Your yummy food makes Bobo Bunny jump for joy!"
    },
    {
      id: "kuma",
      name: "Kuma Beruang",
      title: "Kuma si Beruang Madu",
      emoji: "🐻",
      color: "#F59E0B",
      bgLight: "#FEF6E4",
      voiceKey: "praise_kuma",
      greeting: "Halo Koki Inara! Kuma mencium aroma harum dari dapur Inara nih!",
      praise: "Hmm, harum dan lezat sekali! Terima kasih ya Koki Inara yang baik hati!",
      praiseEn: "Mmm, so delicious! Thank you, kind Chef Inara!"
    },
    {
      id: "labrador",
      name: "Sheriff Labrador",
      title: "Sheriff Labrador (Polisi Ramah)",
      emoji: "🐕",
      color: "#1E40AF",
      bgLight: "#EFF6FF",
      voiceKey: "praise_labrador",
      greetKey: "greet_labrador",
      badgeKey: "labrador_badge",
      greeting: "Halo Chef Inara! Sheriff Labrador sedang berpatroli dan ingin memesan makanan sehat!",
      praise: "Mantap Chef Inara! Misi memasak berhasil!",
      praiseEn: "Great job Chef Inara! Cooking mission accomplished!"
    }
  ];

  // =========================================================================
  // 3. 38+ INGREDIENTS & 75+ SYLLABLE WORDS (BA-CA)
  // =========================================================================
  const WORDS_DB = [
    // --- Kategori Spesial Keluarga ---
    { id: "inara", word: "INARA", syllables: ["I", "NA", "RA"], en: "Chef Inara", ja: "イナラ (Inara)", emoji: "👧🏻", color: "#FF6F91", category: "keluarga", isIngredient: false },
    { id: "abi", word: "ABI", syllables: ["A", "BI"], en: "Daddy Abi", ja: "アビ (Otousan)", emoji: "👨🏻", color: "#4ECDC4", category: "keluarga", isIngredient: false },
    { id: "umi", word: "UMI", syllables: ["U", "MI"], en: "Mommy Umi", ja: "ウミ (Okaasan)", emoji: "🧕🏻", color: "#FF8FAB", category: "keluarga", isIngredient: false },
    { id: "sayang", word: "SAYANG", syllables: ["SA", "YANG"], en: "Love / Dear", ja: "だいすき (Daisuki)", emoji: "💖", color: "#FF5D8F", category: "keluarga", isIngredient: false },
    { id: "koki", word: "KOKI", syllables: ["KO", "KI"], en: "Chef", ja: "シェフ (Shefu)", emoji: "👩🏻‍🍳", color: "#FFB703", category: "keluarga", isIngredient: false },
    { id: "dapur", word: "DAPUR", syllables: ["DA", "PUR"], en: "Kitchen", ja: "キッチン (Kicchin)", emoji: "🏠", color: "#FB8500", category: "keluarga", isIngredient: false },
    { id: "cinta", word: "CINTA", syllables: ["CIN", "TA"], en: "Love", ja: "あい (Ai)", emoji: "💝", color: "#FF4D6D", category: "keluarga", isIngredient: false },
    { id: "pintar", word: "PINTAR", syllables: ["PIN", "TAR"], en: "Smart", ja: "かしこい (Kashikoi)", emoji: "🌟", color: "#F59E0B", category: "keluarga", isIngredient: false },

    // --- Bahan Masakan Level 1: Sarapan ---
    { id: "roti", word: "ROTI", syllables: ["RO", "TI"], en: "Bread", ja: "パン (Pan)", emoji: "🍞", color: "#DDA15E", category: "sarapan", isIngredient: true },
    { id: "susu", word: "SUSU", syllables: ["SU", "SU"], en: "Milk", ja: "ミルク (Miruku)", emoji: "🥛", color: "#64B5F6", category: "sarapan", isIngredient: true },
    { id: "telur", word: "TELUR", syllables: ["TE", "LUR"], en: "Egg", ja: "たまご (Tamago)", emoji: "🥚", color: "#FFB703", category: "sarapan", isIngredient: true },
    { id: "nasi", word: "NASI", syllables: ["NA", "SI"], en: "Rice", ja: "ごはん (Gohan)", emoji: "🍚", color: "#90A4AE", category: "sarapan", isIngredient: true },
    { id: "madu", word: "MADU", syllables: ["MA", "DU"], en: "Honey", ja: "はちみつ (Hachimitsu)", emoji: "🍯", color: "#F59E0B", category: "sarapan", isIngredient: true },
    { id: "ayam", word: "AYAM", syllables: ["A", "YAM"], en: "Chicken", ja: "チキン (Chikin)", emoji: "🍗", color: "#E07A5F", category: "sarapan", isIngredient: true },
    { id: "bubur", word: "BUBUR", syllables: ["BU", "BUR"], en: "Porridge", ja: "おかゆ (Okayu)", emoji: "🥣", color: "#F4A261", category: "sarapan", isIngredient: true },
    { id: "mentega", word: "MENTEGA", syllables: ["MEN", "TE", "GA"], en: "Butter", ja: "バター (Bataa)", emoji: "🧈", color: "#FFD166", category: "sarapan", isIngredient: true },

    // --- Bahan Masakan Level 2: Toko Kue & Es Krim ---
    { id: "keju", word: "KEJU", syllables: ["KE", "JU"], en: "Cheese", ja: "チーズ (Chiizu)", emoji: "🧀", color: "#FFC300", category: "kue", isIngredient: true },
    { id: "gula", word: "GULA", syllables: ["GU", "LA"], en: "Sugar", ja: "さとう (Satou)", emoji: "🍬", color: "#EC4899", category: "kue", isIngredient: true },
    { id: "bolu", word: "BOLU", syllables: ["BO", "LU"], en: "Sponge Cake", ja: "ケーキ (Keeki)", emoji: "🍰", color: "#F472B6", category: "kue", isIngredient: true },
    { id: "donat", word: "DONAT", syllables: ["DO", "NAT"], en: "Donut", ja: "ドーナツ (Doonatsu)", emoji: "🍩", color: "#D97706", category: "kue", isIngredient: true },
    { id: "cokelat", word: "COKELAT", syllables: ["CO", "KE", "LAT"], en: "Chocolate", ja: "チョコ (Choko)", emoji: "🍫", color: "#7F4F24", category: "kue", isIngredient: true },
    { id: "eskrim", word: "ESKRIM", syllables: ["ES", "KRIM"], en: "Ice Cream", ja: "アイス (Aisu)", emoji: "🍨", color: "#F472B6", category: "kue", isIngredient: true },
    { id: "biskuit", word: "BISKUIT", syllables: ["BIS", "KU", "IT"], en: "Cookie", ja: "クッキー (Kukkii)", emoji: "🍪", color: "#B45309", category: "kue", isIngredient: true },
    { id: "tepung", word: "TEPUNG", syllables: ["TE", "PUNG"], en: "Flour", ja: "こむぎこ (Komugiko)", emoji: "🌾", color: "#EAB308", category: "kue", isIngredient: true },
    { id: "vanila", word: "VANILA", syllables: ["VA", "NI", "LA"], en: "Vanilla", ja: "バニラ (Banira)", emoji: "🌼", color: "#FBBF24", category: "kue", isIngredient: true },

    // --- Bahan Masakan Level 3: Pizza, Burger & Sayur ---
    { id: "tomat", word: "TOMAT", syllables: ["TO", "MAT"], en: "Tomato", ja: "トマト (Tomato)", emoji: "🍅", color: "#EF4444", category: "sayur", isIngredient: true },
    { id: "wortel", word: "WORTEL", syllables: ["WOR", "TEL"], en: "Carrot", ja: "にんじん (Ninjin)", emoji: "🥕", color: "#F97316", category: "sayur", isIngredient: true },
    { id: "sosis", word: "SOSIS", syllables: ["SO", "SIS"], en: "Sausage", ja: "ソーセージ (Sooseeji)", emoji: "🌭", color: "#DC2626", category: "sayur", isIngredient: true },
    { id: "jamur", word: "JAMUR", syllables: ["JA", "MUR"], en: "Mushroom", ja: "きのこ (Kinoko)", emoji: "🍄", color: "#A855F7", category: "sayur", isIngredient: true },
    { id: "kentang", word: "KENTANG", syllables: ["KEN", "TANG"], en: "Potato", ja: "ポテト (Poteto)", emoji: "🥔", color: "#CA8A04", category: "sayur", isIngredient: true },
    { id: "bayam", word: "BAYAM", syllables: ["BA", "YAM"], en: "Spinach", ja: "ほうれんそう (Hourensou)", emoji: "🥬", color: "#16A34A", category: "sayur", isIngredient: true },
    { id: "jagung", word: "JAGUNG", syllables: ["JA", "GUNG"], en: "Corn", ja: "コーン (Koon)", emoji: "🌽", color: "#EAB308", category: "sayur", isIngredient: true },
    { id: "daging", word: "DAGING", syllables: ["DA", "GING"], en: "Beef Meat", ja: "おにく (Oniku)", emoji: "🥩", color: "#B91C1C", category: "sayur", isIngredient: true },
    { id: "brokoli", word: "BROKOLI", syllables: ["BRO", "KO", "LI"], en: "Broccoli", ja: "ブロッコリー (Burokkorii)", emoji: "🥦", color: "#15803D", category: "sayur", isIngredient: true },
    { id: "bawang", word: "BAWANG", syllables: ["BA", "WANG"], en: "Onion", ja: "たまねぎ (Tamanegi)", emoji: "🧅", color: "#9333EA", category: "sayur", isIngredient: true },
    { id: "pizza", word: "PIZZA", syllables: ["PIZ", "ZA"], en: "Pizza", ja: "ピザ (Piza)", emoji: "🍕", color: "#EA580C", category: "sayur", isIngredient: true },
    { id: "burger", word: "BURGER", syllables: ["BUR", "GER"], en: "Burger", ja: "バーガー (Baagaa)", emoji: "🍔", color: "#D97706", category: "sayur", isIngredient: true },

    // --- Bahan Masakan Level 4: Buah & Warna ---
    { id: "apel", word: "APEL", syllables: ["A", "PEL"], en: "Apple", ja: "りんご (Ringo)", emoji: "🍎", color: "#EF4444", category: "buah", isIngredient: true },
    { id: "pisang", word: "PISANG", syllables: ["PI", "SANG"], en: "Banana", ja: "バナナ (Banana)", emoji: "🍌", color: "#FACC15", category: "buah", isIngredient: true },
    { id: "jeruk", word: "JERUK", syllables: ["JE", "RUK"], en: "Orange", ja: "オレンジ (Orenji)", emoji: "🍊", color: "#FB923C", category: "buah", isIngredient: true },
    { id: "mangga", word: "MANGGA", syllables: ["MANG", "GA"], en: "Mango", ja: "マンゴー (Mangoo)", emoji: "🥭", color: "#F59E0B", category: "buah", isIngredient: true },
    { id: "stroberi", word: "STROBERI", syllables: ["STRO", "BE", "RI"], en: "Strawberry", ja: "いちご (Ichigo)", emoji: "🍓", color: "#F43F5E", category: "buah", isIngredient: true },
    { id: "anggur", word: "ANGGUR", syllables: ["ANG", "GUR"], en: "Grapes", ja: "ぶどう (Budou)", emoji: "🍇", color: "#8B5CF6", category: "buah", isIngredient: true },
    { id: "semangka", word: "SEMANGKA", syllables: ["SE", "MANG", "KA"], en: "Watermelon", ja: "すいか (Suika)", emoji: "🍉", color: "#10B981", category: "buah", isIngredient: true },
    { id: "melon", word: "MELON", syllables: ["ME", "LON"], en: "Melon", ja: "メロン (Meron)", emoji: "🍈", color: "#84CC16", category: "buah", isIngredient: true },
    { id: "nanas", word: "NANAS", syllables: ["NA", "NAS"], en: "Pineapple", ja: "パイナップル (Painappuru)", emoji: "🍍", color: "#EAB308", category: "buah", isIngredient: true },
    { id: "pepaya", word: "PEPAYA", syllables: ["PE", "PA", "YA"], en: "Papaya", ja: "パパイヤ (Papaiya)", emoji: "🧡", color: "#F97316", category: "buah", isIngredient: true },
    { id: "alpukat", word: "ALPUKAT", syllables: ["AL", "PU", "KAT"], en: "Avocado", ja: "アボカド (Abokado)", emoji: "🥑", color: "#65A30D", category: "buah", isIngredient: true },
    { id: "kelapa", word: "KELAPA", syllables: ["KE", "LA", "PA"], en: "Coconut", ja: "ココナッツ (Kokonattsu)", emoji: "🥥", color: "#0D9488", category: "buah", isIngredient: true },
    { id: "ceri", word: "CERI", syllables: ["CE", "RI"], en: "Cherry", ja: "さくらんぼ (Sakuranbo)", emoji: "🍒", color: "#E11D48", category: "buah", isIngredient: true },
    { id: "kiwi", word: "KIWI", syllables: ["KI", "WI"], en: "Kiwi", ja: "キウイ (Kiui)", emoji: "🥝", color: "#4D7C0F", category: "buah", isIngredient: true },
    { id: "lemon", word: "LEMON", syllables: ["LE", "MON"], en: "Lemon", ja: "レモン (Remon)", emoji: "🍋", color: "#EAB308", category: "buah", isIngredient: true },

    // --- Bahan Masakan Level 5: Bento & Ramen Jepang ---
    { id: "ikan", word: "IKAN", syllables: ["I", "KAN"], en: "Fish", ja: "さかな (Sakana)", emoji: "🐟", color: "#3B82F6", category: "jepang", isIngredient: true },
    { id: "udang", word: "UDANG", syllables: ["U", "DANG"], en: "Shrimp", ja: "えび (Ebi)", emoji: "🍤", color: "#F97316", category: "jepang", isIngredient: true },
    { id: "tahu", word: "TAHU", syllables: ["TA", "HU"], en: "Tofu", ja: "とうふ (Toufu)", emoji: "🧈", color: "#F59E0B", category: "jepang", isIngredient: true },
    { id: "nori", word: "NORI", syllables: ["NO", "RI"], en: "Seaweed", ja: "のり (Nori)", emoji: "🍙", color: "#065F46", category: "jepang", isIngredient: true },
    { id: "ramen", word: "RAMEN", syllables: ["RA", "MEN"], en: "Ramen Noodles", ja: "ラーメン (Raamen)", emoji: "🍜", color: "#EA580C", category: "jepang", isIngredient: true },
    { id: "sushi", word: "SUSHI", syllables: ["SU", "SHI"], en: "Sushi", ja: "すし (Sushi)", emoji: "🍣", color: "#EF4444", category: "jepang", isIngredient: true },
    { id: "bento", word: "BENTO", syllables: ["BEN", "TO"], en: "Bento Box", ja: "べんとう (Bentou)", emoji: "🍱", color: "#EC4899", category: "jepang", isIngredient: true },
    { id: "onigiri", word: "ONIGIRI", syllables: ["O", "NI", "GI", "RI"], en: "Rice Ball", ja: "おにぎり (Onigiri)", emoji: "🍙", color: "#10B981", category: "jepang", isIngredient: true },
    { id: "takoyaki", word: "TAKOYAKI", syllables: ["TA", "KO", "YA", "KI"], en: "Octopus Ball", ja: "たこやき (Takoyaki)", emoji: "🐙", color: "#D97706", category: "jepang", isIngredient: true },

    // --- Kosakata Angka, Warna & Alat Dapur Tambahan (Total 75+ Kata) ---
    { id: "satu", word: "SATU", syllables: ["SA", "TU"], en: "One", ja: "いち (Ichi)", emoji: "1️⃣", color: "#EF4444", category: "angka_warna", isIngredient: false },
    { id: "dua", word: "DUA", syllables: ["DU", "A"], en: "Two", ja: "に (Ni)", emoji: "2️⃣", color: "#F97316", category: "angka_warna", isIngredient: false },
    { id: "tiga", word: "TIGA", syllables: ["TI", "GA"], en: "Three", ja: "さん (San)", emoji: "3️⃣", color: "#EAB308", category: "angka_warna", isIngredient: false },
    { id: "empat", word: "EMPAT", syllables: ["EM", "PAT"], en: "Four", ja: "よん (Yon)", emoji: "4️⃣", color: "#10B981", category: "angka_warna", isIngredient: false },
    { id: "lima", word: "LIMA", syllables: ["LI", "MA"], en: "Five", ja: "ご (Go)", emoji: "5️⃣", color: "#3B82F6", category: "angka_warna", isIngredient: false },
    { id: "sepuluh", word: "SEPULUH", syllables: ["SE", "PU", "LUH"], en: "Ten", ja: "じゅう (Juu)", emoji: "🔟", color: "#8B5CF6", category: "angka_warna", isIngredient: false },
    { id: "seratus", word: "SERATUS", syllables: ["SE", "RA", "TUS"], en: "One Hundred", ja: "ひゃく (Hyaku)", emoji: "💯", color: "#EC4899", category: "angka_warna", isIngredient: false },
    { id: "merah", word: "MERAH", syllables: ["ME", "RAH"], en: "Red", ja: "あか (Aka)", emoji: "🔴", color: "#EF4444", category: "angka_warna", isIngredient: false },
    { id: "kuning", word: "KUNING", syllables: ["KU", "NING"], en: "Yellow", ja: "きいろ (Kiiro)", emoji: "🟡", color: "#EAB308", category: "angka_warna", isIngredient: false },
    { id: "hijau", word: "HIJAU", syllables: ["HI", "JAU"], en: "Green", ja: "みどり (Midori)", emoji: "🟢", color: "#10B981", category: "angka_warna", isIngredient: false },
    { id: "biru", word: "BIRU", syllables: ["BI", "RU"], en: "Blue", ja: "あお (Ao)", emoji: "🔵", color: "#3B82F6", category: "angka_warna", isIngredient: false },
    { id: "ungu", word: "UNGU", syllables: ["U", "NGU"], en: "Purple", ja: "むらさき (Murasaki)", emoji: "🟣", color: "#8B5CF6", category: "angka_warna", isIngredient: false },
    { id: "sendok", word: "SENDOK", syllables: ["SEN", "DOK"], en: "Spoon", ja: "スプーン (Supuun)", emoji: "🥄", color: "#64748B", category: "angka_warna", isIngredient: false },
    { id: "piring", word: "PIRING", syllables: ["PI", "RING"], en: "Plate", ja: "おさら (Osara)", emoji: "🍽️", color: "#0EA5E9", category: "angka_warna", isIngredient: false },
    { id: "cangkir", word: "CANGKIR", syllables: ["CANG", "KIR"], en: "Cup", ja: "コップ (Koppu)", emoji: "☕", color: "#EC4899", category: "angka_warna", isIngredient: false },
    { id: "manis", word: "MANIS", syllables: ["MA", "NIS"], en: "Sweet", ja: "あまい (Amai)", emoji: "🍭", color: "#EC4899", category: "kue", isIngredient: false },
    { id: "yoghurt", word: "YOGHURT", syllables: ["YOG", "HURT"], en: "Yogurt", ja: "ヨーグルト (Yooguruto)", emoji: "🥣", color: "#06B6D4", category: "buah", isIngredient: true },
    { id: "zaitun", word: "ZAITUN", syllables: ["ZAI", "TUN"], en: "Olive", ja: "オリーブ (Oriibu)", emoji: "🫒", color: "#65A30D", category: "sayur", isIngredient: true },
    { id: "foto", word: "FOTO", syllables: ["FO", "TO"], en: "Photo", ja: "しゃしん (Shashin)", emoji: "📷", color: "#3B82F6", category: "keluarga", isIngredient: false },
    { id: "quran", word: "QURAN", syllables: ["QUR", "AN"], en: "Quran", ja: "クルアーン (Kuruaan)", emoji: "📖", color: "#10B981", category: "keluarga", isIngredient: false },
    { id: "xilofon", word: "XILOFON", syllables: ["XI", "LO", "FON"], en: "Xylophone", ja: "シロフォン (Shirofon)", emoji: "🎶", color: "#8B5CF6", category: "angka_warna", isIngredient: false }
  ];

  // =========================================================================
  // 4. 5 PROGRESSIVE WORLDS (KEDAI LEVEL 1-5) & 25 UNIQUE MENUS
  // =========================================================================
  const WORLDS = [
    {
      level: 1,
      id: "kedai_1",
      name: "Dapur Sarapan Inara",
      subtitle: "Angka 1–10 • Suku Kata Keluarga & Dasar",
      icon: "🏠",
      unlockStars: 0,
      themeColor: "#FF6F91",
      bgGradient: "linear-gradient(135deg, #FFF0F3 0%, #FFE3EC 100%)",
      numberRange: [1, 10],
      hasMathOps: false,
      mathMax: 5,
      defaultCustomer: "abi",
      menus: [
        {
          id: "menu_1",
          number: 1,
          name: "Roti Bakar Cokelat",
          en: "Chocolate Toast",
          emoji: "🍞",
          color: "#D97706",
          ingredients: ["roti", "cokelat", "mentega", "susu"],
          spellPool: ["ROTI", "INARA", "ABI", "SUSU"]
        },
        {
          id: "menu_2",
          number: 2,
          name: "Susu Hangat Madu",
          en: "Warm Honey Milk",
          emoji: "🥛",
          color: "#3B82F6",
          ingredients: ["susu", "madu", "gula"],
          spellPool: ["SUSU", "MADU", "UMI", "INARA"]
        },
        {
          id: "menu_3",
          number: 3,
          name: "Telur Dadar Senyum",
          en: "Smiley Omelette",
          emoji: "🍳",
          color: "#F59E0B",
          ingredients: ["telur", "keju", "tomat", "mentega"],
          spellPool: ["TELUR", "KEJU", "ABI", "SAYANG"]
        },
        {
          id: "menu_4",
          number: 4,
          name: "Bubur Ayam Hangat",
          en: "Warm Chicken Porridge",
          emoji: "🥣",
          color: "#EA580C",
          ingredients: ["bubur", "ayam", "telur", "bawang"],
          spellPool: ["BUBUR", "AYAM", "UMI", "INARA"]
        },
        {
          id: "menu_5",
          number: 5,
          name: "Nasi Goreng Spesial",
          en: "Special Fried Rice",
          emoji: "🍛",
          color: "#E11D48",
          ingredients: ["nasi", "telur", "ayam", "sosis"],
          spellPool: ["NASI", "AYAM", "KOKI", "INARA"]
        }
      ]
    },
    {
      level: 2,
      id: "kedai_2",
      name: "Toko Kue & Es Krim Pastel",
      subtitle: "Angka 11–20 • Penjumlahan Awal (+) s.d. 6",
      icon: "🧁",
      unlockStars: 3,
      themeColor: "#EC4899",
      bgGradient: "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)",
      numberRange: [11, 20],
      hasMathOps: true,
      allowedOps: ["+"],
      mathMax: 6,
      defaultCustomer: "umi",
      menus: [
        {
          id: "menu_6",
          number: 6,
          name: "Kue Ulang Tahun Umi",
          en: "Umi's Birthday Cake",
          emoji: "🎂",
          color: "#EC4899",
          ingredients: ["bolu", "stroberi", "cokelat", "gula"],
          spellPool: ["BOLU", "UMI", "SAYANG", "GULA"]
        },
        {
          id: "menu_7",
          number: 7,
          name: "Es Krim 3 Scoop Ceria",
          en: "Happy 3-Scoop Ice Cream",
          emoji: "🍨",
          color: "#8B5CF6",
          ingredients: ["eskrim", "stroberi", "cokelat", "vanila", "ceri"],
          spellPool: ["ESKRIM", "CERI", "MANIS", "INARA"]
        },
        {
          id: "menu_8",
          number: 8,
          name: "Donat Meses Pelangi",
          en: "Rainbow Sprinkle Donut",
          emoji: "🍩",
          color: "#F59E0B",
          ingredients: ["donat", "cokelat", "gula", "susu"],
          spellPool: ["DONAT", "GULA", "SUSU", "ABI"]
        },
        {
          id: "menu_9",
          number: 9,
          name: "Cupcake Stroberi",
          en: "Strawberry Cupcake",
          emoji: "🧁",
          color: "#F43F5E",
          ingredients: ["stroberi", "tepung", "mentega", "madu"],
          spellPool: ["MADU", "BOLU", "CERI", "UMI"]
        },
        {
          id: "menu_10",
          number: 10,
          name: "Pancake Madu Lembut",
          en: "Fluffy Honey Pancake",
          emoji: "🥞",
          color: "#D97706",
          ingredients: ["madu", "tepung", "telur", "mentega", "pisang"],
          spellPool: ["MADU", "TELUR", "ROTI", "INARA"]
        }
      ]
    },
    {
      level: 3,
      id: "kedai_3",
      name: "Restoran Pizza & Burger Abi",
      subtitle: "Angka 21–50 • Tambah (+) & Kurang (-) s.d. 10",
      icon: "🍕",
      unlockStars: 7,
      themeColor: "#F97316",
      bgGradient: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
      numberRange: [21, 50],
      hasMathOps: true,
      allowedOps: ["+", "-"],
      mathMax: 10,
      hasOvenDial: true,
      defaultCustomer: "abi",
      menus: [
        {
          id: "menu_11",
          number: 11,
          name: "Pizza Keju Lumer Abi",
          en: "Abi's Melty Cheese Pizza",
          emoji: "🍕",
          color: "#EA580C",
          ingredients: ["pizza", "keju", "tomat", "jamur", "sosis"],
          spellPool: ["PIZZA", "KEJU", "TOMAT", "ABI"]
        },
        {
          id: "menu_12",
          number: 12,
          name: "Burger Daging Sehat",
          en: "Healthy Beef Burger",
          emoji: "🍔",
          color: "#D97706",
          ingredients: ["burger", "daging", "keju", "tomat", "bayam"],
          spellPool: ["BURGER", "DAGING", "KEJU", "ROTI"]
        },
        {
          id: "menu_13",
          number: 13,
          name: "Spaghetti Saus Tomat",
          en: "Tomato Sauce Spaghetti",
          emoji: "🍝",
          color: "#DC2626",
          ingredients: ["tomat", "keju", "daging", "jamur"],
          spellPool: ["TOMAT", "SOSIS", "JAMUR", "INARA"]
        },
        {
          id: "menu_14",
          number: 14,
          name: "Sup Sayur Hangat",
          en: "Warm Veggie Soup",
          emoji: "🍲",
          color: "#16A34A",
          ingredients: ["wortel", "kentang", "brokoli", "jagung", "bayam"],
          spellPool: ["WORTEL", "BAYAM", "JAGUNG", "UMI"]
        },
        {
          id: "menu_15",
          number: 15,
          name: "Kentang Panggang Keju",
          en: "Cheesy Baked Potato",
          emoji: "🍟",
          color: "#EAB308",
          ingredients: ["kentang", "keju", "mentega", "jagung"],
          spellPool: ["KENTANG", "KEJU", "SOSIS", "ABI"]
        }
      ]
    },
    {
      level: 4,
      id: "kedai_4",
      name: "Kedai Jus & Buah Segar Umi",
      subtitle: "Angka 51–80 • Bilingual Buah • Hitung +/- s.d. 15",
      icon: "🍓",
      unlockStars: 12,
      themeColor: "#10B981",
      bgGradient: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
      numberRange: [51, 80],
      hasMathOps: true,
      allowedOps: ["+", "-"],
      mathMax: 15,
      hasOvenDial: true,
      defaultCustomer: "bobo",
      menus: [
        {
          id: "menu_16",
          number: 16,
          name: "Jus Pelangi Segar",
          en: "Fresh Rainbow Juice",
          emoji: "🍹",
          color: "#F43F5E",
          ingredients: ["stroberi", "jeruk", "mangga", "kiwi", "anggur"],
          spellPool: ["JERUK", "APEL", "MANGGA", "MERAH"]
        },
        {
          id: "menu_17",
          number: 17,
          name: "Sate Buah Cokelat",
          en: "Chocolate Fruit Skewer",
          emoji: "🍡",
          color: "#8B5CF6",
          ingredients: ["pisang", "stroberi", "melon", "cokelat", "anggur"],
          spellPool: ["PISANG", "MELON", "CERI", "MANIS"]
        },
        {
          id: "menu_18",
          number: 18,
          name: "Salad Buah Yoghurt",
          en: "Yogurt Fruit Salad",
          emoji: "🥗",
          color: "#10B981",
          ingredients: ["apel", "semangka", "nanas", "kiwi", "susu"],
          spellPool: ["APEL", "NANAS", "KIWI", "HIJAU"]
        },
        {
          id: "menu_19",
          number: 19,
          name: "Puding Mangga Manis",
          en: "Sweet Mango Pudding",
          emoji: "🍮",
          color: "#F59E0B",
          ingredients: ["mangga", "susu", "madu", "ceri"],
          spellPool: ["MANGGA", "MADU", "KUNING", "UMI"]
        },
        {
          id: "menu_20",
          number: 20,
          name: "Smoothie Pisang Susu",
          en: "Banana Milk Smoothie",
          emoji: "🍌",
          color: "#EAB308",
          ingredients: ["pisang", "alpukat", "susu", "madu", "kelapa"],
          spellPool: ["PISANG", "SUSU", "KELAPA", "INARA"]
        }
      ]
    },
    {
      level: 5,
      id: "kedai_5",
      name: "Kedai Bento & Ramen Jepang",
      subtitle: "Angka 81–100 (Seratus!) • Bahasa Jepang • Master +/-",
      icon: "🍱",
      unlockStars: 18,
      themeColor: "#8B5CF6",
      bgGradient: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
      numberRange: [81, 100],
      hasMathOps: true,
      allowedOps: ["+", "-"],
      mathMax: 30,
      hasOvenDial: true,
      isJapaneseWorld: true,
      defaultCustomer: "mochi",
      menus: [
        {
          id: "menu_21",
          number: 21,
          name: "Bento Kucing Kawaii",
          en: "Kawaii Cat Bento Box",
          emoji: "🍱",
          color: "#EC4899",
          ingredients: ["bento", "nasi", "ikan", "telur", "brokoli"],
          spellPool: ["BENTO", "IKAN", "NASI", "INARA"]
        },
        {
          id: "menu_22",
          number: 22,
          name: "Ramen Telur Hangat",
          en: "Warm Egg Ramen",
          emoji: "🍜",
          color: "#EA580C",
          ingredients: ["ramen", "telur", "udang", "nori", "jagung"],
          spellPool: ["RAMEN", "TELUR", "UDANG", "NORI"]
        },
        {
          id: "menu_23",
          number: 23,
          name: "Sushi Tamago Manis",
          en: "Sweet Tamago Sushi",
          emoji: "🍣",
          color: "#EF4444",
          ingredients: ["sushi", "ikan", "telur", "nori", "nasi"],
          spellPool: ["SUSHI", "IKAN", "NORI", "ABI"]
        },
        {
          id: "menu_24",
          number: 24,
          name: "Onigiri Nori Lucu",
          en: "Cute Nori Onigiri",
          emoji: "🍙",
          color: "#10B981",
          ingredients: ["onigiri", "nasi", "nori", "ikan"],
          spellPool: ["NORI", "NASI", "TAHU", "UMI"]
        },
        {
          id: "menu_25",
          number: 25,
          name: "Takoyaki Saus Spesial",
          en: "Special Sauce Takoyaki",
          emoji: "🐙",
          color: "#D97706",
          ingredients: ["takoyaki", "udang", "tepung", "telur", "keju"],
          spellPool: ["UDANG", "TAHU", "KEJU", "SERATUS"]
        }
      ]
    }
  ];

  // =========================================================================
  // 5. PHONICS LETTERS A-Z & VECTOR TRACING CHECKPOINTS
  // =========================================================================
  const LETTERS_DB = [
    { letter: "A", pron: "a", word: "APEL", syllables: ["A", "PEL"], emoji: "🍎", points: [[20, 82], [35, 48], [50, 18], [65, 48], [80, 82], [32, 58], [68, 58]] },
    { letter: "B", pron: "be", word: "BOLU", syllables: ["BO", "LU"], emoji: "🍰", points: [[28, 18], [28, 50], [28, 82], [58, 25], [65, 38], [32, 50], [68, 65], [55, 82]] },
    { letter: "C", pron: "ce", word: "CERI", syllables: ["CE", "RI"], emoji: "🍒", points: [[72, 26], [48, 18], [26, 35], [22, 55], [28, 76], [52, 84], [74, 74]] },
    { letter: "D", pron: "de", word: "DONAT", syllables: ["DO", "NAT"], emoji: "🍩", points: [[28, 18], [28, 50], [28, 82], [55, 22], [74, 42], [72, 65], [52, 82]] },
    { letter: "E", pron: "e", word: "ESKRIM", syllables: ["ES", "KRIM"], emoji: "🍨", points: [[28, 18], [28, 50], [28, 82], [68, 18], [62, 50], [68, 82]] },
    { letter: "F", pron: "ef", word: "FOTO", syllables: ["FO", "TO"], emoji: "📷", points: [[30, 82], [30, 50], [30, 18], [70, 18], [62, 50]] },
    { letter: "G", pron: "ge", word: "GULA", syllables: ["GU", "LA"], emoji: "🍬", points: [[70, 26], [45, 18], [24, 38], [24, 65], [48, 82], [72, 72], [72, 52], [52, 52]] },
    { letter: "H", pron: "ha", word: "HIJAU", syllables: ["HI", "JAU"], emoji: "🟢", points: [[28, 18], [28, 50], [28, 82], [50, 50], [72, 18], [72, 50], [72, 82]] },
    { letter: "I", pron: "i", word: "INARA", syllables: ["I", "NA", "RA"], emoji: "👧🏻", points: [[32, 18], [68, 18], [50, 35], [50, 62], [32, 82], [68, 82]] },
    { letter: "J", pron: "je", word: "JERUK", syllables: ["JE", "RUK"], emoji: "🍊", points: [[35, 18], [65, 18], [58, 45], [56, 72], [40, 82], [25, 68]] },
    { letter: "K", pron: "ka", word: "KEJU", syllables: ["KE", "JU"], emoji: "🧀", points: [[28, 18], [28, 50], [28, 82], [68, 20], [42, 50], [70, 82]] },
    { letter: "L", pron: "el", word: "LEMON", syllables: ["LE", "MON"], emoji: "🍋", points: [[30, 18], [30, 48], [30, 82], [52, 82], [72, 82]] },
    { letter: "M", pron: "em", word: "MADU", syllables: ["MA", "DU"], emoji: "🍯", points: [[22, 82], [22, 22], [50, 56], [78, 22], [78, 82]] },
    { letter: "N", pron: "en", word: "NASI", syllables: ["NA", "SI"], emoji: "🍚", points: [[26, 82], [26, 20], [50, 50], [74, 82], [74, 20]] },
    { letter: "O", pron: "o", word: "ONIGIRI", syllables: ["O", "NI", "GI", "RI"], emoji: "🍙", points: [[50, 18], [25, 38], [25, 65], [50, 84], [75, 65], [75, 38], [50, 18]] },
    { letter: "P", pron: "pe", word: "PISANG", syllables: ["PI", "SANG"], emoji: "🍌", points: [[28, 82], [28, 50], [28, 18], [60, 20], [70, 36], [58, 52], [30, 52]] },
    { letter: "Q", pron: "ki", word: "QURAN", syllables: ["QUR", "AN"], emoji: "📖", points: [[50, 18], [25, 42], [30, 74], [58, 80], [74, 52], [58, 64], [78, 84]] },
    { letter: "R", pron: "er", word: "ROTI", syllables: ["RO", "TI"], emoji: "🍞", points: [[28, 82], [28, 18], [62, 22], [68, 38], [32, 50], [70, 82]] },
    { letter: "S", pron: "es", word: "SUSU", syllables: ["SU", "SU"], emoji: "🥛", points: [[68, 24], [42, 18], [28, 34], [50, 50], [72, 66], [55, 82], [28, 76]] },
    { letter: "T", pron: "te", word: "TOMAT", syllables: ["TO", "MAT"], emoji: "🍅", points: [[24, 20], [50, 20], [76, 20], [50, 48], [50, 82]] },
    { letter: "U", pron: "u", word: "UMI", syllables: ["U", "MI"], emoji: "🧕🏻", points: [[26, 20], [26, 60], [40, 80], [60, 80], [74, 60], [74, 20]] },
    { letter: "V", pron: "ve", word: "VANILA", syllables: ["VA", "NI", "LA"], emoji: "🌼", points: [[24, 20], [37, 52], [50, 82], [63, 52], [76, 20]] },
    { letter: "W", pron: "we", word: "WORTEL", syllables: ["WOR", "TEL"], emoji: "🥕", points: [[18, 22], [32, 80], [50, 46], [68, 80], [82, 22]] },
    { letter: "X", pron: "eks", word: "XILOFON", syllables: ["XI", "LO", "FON"], emoji: "🎶", points: [[25, 20], [50, 50], [75, 80], [75, 20], [25, 80]] },
    { letter: "Y", pron: "ye", word: "YOGHURT", syllables: ["YOG", "HURT"], emoji: "🥣", points: [[25, 20], [50, 50], [75, 20], [50, 66], [50, 84]] },
    { letter: "Z", pron: "zet", word: "ZAITUN", syllables: ["ZAI", "TUN"], emoji: "🫒", points: [[25, 22], [75, 22], [50, 52], [25, 82], [75, 82]] }
  ];

  // Single-digit stroke paths (normalized 0..100 X, 0..100 Y)
  const DIGIT_PATHS = {
    "0": [[50, 18], [26, 38], [26, 65], [50, 82], [74, 65], [74, 38], [50, 18]],
    "1": [[36, 28], [52, 18], [52, 45], [52, 68], [52, 82]],
    "2": [[28, 30], [52, 18], [72, 32], [55, 55], [28, 82], [74, 82]],
    "3": [[28, 24], [58, 18], [68, 36], [46, 50], [70, 66], [55, 82], [28, 76]],
    "4": [[62, 18], [26, 58], [74, 58], [62, 42], [62, 82]],
    "5": [[68, 20], [32, 20], [30, 48], [60, 48], [70, 68], [50, 82], [28, 76]],
    "6": [[64, 20], [36, 36], [28, 64], [50, 82], [70, 68], [55, 50], [32, 56]],
    "7": [[26, 22], [52, 22], [74, 22], [58, 52], [42, 82]],
    "8": [[50, 18], [30, 32], [50, 50], [70, 68], [50, 82], [30, 68], [70, 32], [50, 18]],
    "9": [[68, 36], [48, 18], [30, 34], [48, 50], [68, 38], [64, 65], [42, 82]]
  };

  /**
   * Builds normalized (0..100, 0..100) checkpoints for any target:
   * - Single letter 'A'..'Z'
   * - Number 0..100 (supports 1-digit, 2-digit, and 3-digit '100' side-by-side!)
   * - Short words like 'INARA', 'ABI', 'UMI'
   */
  function getTracingPointsForTarget(targetStr) {
    const str = String(targetStr).toUpperCase().trim();

    // 1. Single Letter A-Z
    if (str.length === 1 && LETTERS_DB.some((l) => l.letter === str)) {
      const found = LETTERS_DB.find((l) => l.letter === str);
      return found.points.map(([x, y]) => ({ x, y }));
    }

    // 2. Single Digit 0-9
    if (str.length === 1 && DIGIT_PATHS[str]) {
      return DIGIT_PATHS[str].map(([x, y]) => ({ x, y }));
    }

    // 3. Multi-character (2-digit numbers 10-99, 100, or ABI / UMI / INARA)
    const chars = str.split("");
    const count = chars.length;
    const allPoints = [];
    const marginX = count >= 4 ? 5 : 8;
    const usableW = 100 - marginX * 2;
    const slotW = usableW / count;

    chars.forEach((ch, idx) => {
      let basePts = DIGIT_PATHS[ch];
      if (!basePts) {
        const lObj = LETTERS_DB.find((l) => l.letter === ch);
        basePts = lObj ? lObj.points : [[50, 20], [50, 80]];
      }
      // For multi-char words (>2 chars), sample up to 4 key points per char so it's fun & ergonomic
      let sampled = basePts;
      if (count >= 3 && basePts.length > 4) {
        sampled = [
          basePts[0],
          basePts[Math.floor(basePts.length / 3)],
          basePts[Math.floor((basePts.length * 2) / 3)],
          basePts[basePts.length - 1]
        ];
      }
      sampled.forEach(([px, py]) => {
        const mappedX = marginX + idx * slotW + ((px - 15) / 70) * (slotW * 0.82) + slotW * 0.09;
        const mappedY = py;
        allPoints.push({
          x: Math.max(8, Math.min(92, Math.round(mappedX))),
          y: Math.max(15, Math.min(85, Math.round(mappedY)))
        });
      });
    });

    return allPoints;
  }

  // =========================================================================
  // 6. PROCEDURAL MATH GENERATOR (+ ADDITION & - MOCHI SUBTRACTION)
  // =========================================================================
  function generateMathProblem(levelOrMode, ingredientObj, forcedOp = null) {
    // Determine mode & max range
    let op = forcedOp || "+";
    let a = 2;
    let b = 1;
    let answer = 3;

    const ing = ingredientObj || { word: "DONAT", emoji: "🍩", en: "Donut" };

    if (levelOrMode === "easy_add" || (levelOrMode === 2 && op !== "-")) {
      op = "+";
      a = 1 + Math.floor(Math.random() * 3); // 1..3
      b = 1 + Math.floor(Math.random() * 3); // 1..3
      answer = a + b;
    } else if (levelOrMode === "easy_sub" || (levelOrMode === 2 && op === "-")) {
      op = "-";
      a = 3 + Math.floor(Math.random() * 4); // 3..6
      b = 1 + Math.floor(Math.random() * (a - 1)); // 1..a-1
      answer = a - b;
    } else if (levelOrMode === "medium_mix" || levelOrMode === 3) {
      op = forcedOp || (Math.random() < 0.5 ? "+" : "-");
      if (op === "+") {
        a = 2 + Math.floor(Math.random() * 5); // 2..6
        b = 1 + Math.floor(Math.random() * Math.min(4, 10 - a)); // sum <= 10
        answer = a + b;
      } else {
        a = 4 + Math.floor(Math.random() * 6); // 4..9
        b = 1 + Math.floor(Math.random() * Math.min(4, a - 1));
        answer = a - b;
      }
    } else if (levelOrMode === 4) {
      op = forcedOp || (Math.random() < 0.5 ? "+" : "-");
      if (op === "+") {
        a = 4 + Math.floor(Math.random() * 6); // 4..9
        const maxB = Math.min(6, 15 - a);
        b = 2 + Math.floor(Math.random() * Math.max(1, maxB - 1)); // sum <= 15
        answer = a + b;
      } else {
        a = 6 + Math.floor(Math.random() * 9); // 6..14
        b = 2 + Math.floor(Math.random() * Math.min(5, a - 2)); // 2..6
        answer = a - b;
      }
    } else {
      // Level 5 or "master_mix" — includes tens + units (e.g., 20+5=25, 15-5=10)
      const useTens = Math.random() < 0.5;
      op = forcedOp || (Math.random() < 0.55 ? "+" : "-");
      if (useTens && op === "+") {
        a = (1 + Math.floor(Math.random() * 2)) * 10; // 10 or 20
        b = 1 + Math.floor(Math.random() * 9); // 1..9
        answer = a + b;
      } else if (useTens && op === "-") {
        const baseTen = (1 + Math.floor(Math.random() * 2)) * 10; // 10 or 20
        b = 2 + Math.floor(Math.random() * 7); // 2..8 (e.g. 15-5=10, 25-5=20)
        a = baseTen + b;
        answer = baseTen;
      } else if (op === "+") {
        a = 6 + Math.floor(Math.random() * 7); // 6..12
        b = 3 + Math.floor(Math.random() * 6); // 3..8
        answer = a + b;
      } else {
        a = 8 + Math.floor(Math.random() * 8); // 8..15
        b = 2 + Math.floor(Math.random() * 5); // 2..6
        answer = a - b;
      }
    }

    // Generate 3 distinct choices (1 correct + 2 close child-friendly options)
    const choicesSet = new Set([answer]);
    const offsets = [-2, -1, 1, 2, 3, -3];
    for (const off of offsets) {
      if (choicesSet.size >= 3) break;
      const cand = answer + off;
      if (cand >= 1 && cand <= 100) choicesSet.add(cand);
    }
    const choices = Array.from(choicesSet).sort((x, y) => x - y);

    return {
      op,
      a,
      b,
      answer,
      choices,
      ingredient: ing,
      storyId:
        op === "+"
          ? `Di mangkuk ada ${a} ${ing.word}. Yuk tambah ${b} ${ing.word} lagi! Jadi berapa semuanya?`
          : `Di piring ada ${a} ${ing.word}. Nyam! Mochi Kucing mencicipi ${b} ${ing.word}! Sisa berapa sekarang?`
    };
  }

  // =========================================================================
  // 7. 54 COLLECTIBLE STICKERS & CHEF INARA WARDROBE
  // =========================================================================
  const STICKERS = [
    // Keluarga & Teman (8)
    { id: "stk_inara", name: "Koki Inara", emoji: "👧🏻", category: "Keluarga" },
    { id: "stk_abi", name: "Abi Hebat", emoji: "👨🏻‍🍳", category: "Keluarga" },
    { id: "stk_umi", name: "Umi Sayang", emoji: "🧕🏻", category: "Keluarga" },
    { id: "stk_mochi", name: "Mochi Kucing", emoji: "🐱", category: "Keluarga" },
    { id: "stk_bobo", name: "Bobo Kelinci", emoji: "🐰", category: "Keluarga" },
    { id: "stk_kuma", name: "Kuma Beruang", emoji: "🐻", category: "Keluarga" },
    { id: "stk_heart", name: "Hati Sayang", emoji: "💖", category: "Keluarga" },
    { id: "stk_crown", name: "Mahkota Koki", emoji: "👑", category: "Keluarga" },
    // Sarapan & Kue (12)
    { id: "stk_roti", name: "Roti Bakar", emoji: "🍞", category: "Kue & Sarapan" },
    { id: "stk_susu", name: "Susu Hangat", emoji: "🥛", category: "Kue & Sarapan" },
    { id: "stk_telur", name: "Telur Senyum", emoji: "🍳", category: "Kue & Sarapan" },
    { id: "stk_bubur", name: "Bubur Ayam", emoji: "🥣", category: "Kue & Sarapan" },
    { id: "stk_nasgor", name: "Nasi Goreng", emoji: "🍛", category: "Kue & Sarapan" },
    { id: "stk_kue", name: "Kue Ulang Tahun", emoji: "🎂", category: "Kue & Sarapan" },
    { id: "stk_eskrim", name: "Es Krim Ceria", emoji: "🍨", category: "Kue & Sarapan" },
    { id: "stk_donat", name: "Donat Pelangi", emoji: "🍩", category: "Kue & Sarapan" },
    { id: "stk_cupcake", name: "Cupcake Manis", emoji: "🧁", category: "Kue & Sarapan" },
    { id: "stk_pancake", name: "Pancake Madu", emoji: "🥞", category: "Kue & Sarapan" },
    { id: "stk_cokelat", name: "Cokelat Lezat", emoji: "🍫", category: "Kue & Sarapan" },
    { id: "stk_madu", name: "Stoples Madu", emoji: "🍯", category: "Kue & Sarapan" },
    // Pizza, Sayur & Buah (14)
    { id: "stk_pizza", name: "Pizza Abi", emoji: "🍕", category: "Pizza & Buah" },
    { id: "stk_burger", name: "Burger Sehat", emoji: "🍔", category: "Pizza & Buah" },
    { id: "stk_spaghetti", name: "Spaghetti Tomat", emoji: "🍝", category: "Pizza & Buah" },
    { id: "stk_sup", name: "Sup Sayur", emoji: "🍲", category: "Pizza & Buah" },
    { id: "stk_kentang", name: "Kentang Keju", emoji: "🍟", category: "Pizza & Buah" },
    { id: "stk_keju", name: "Keju Lumer", emoji: "🧀", category: "Pizza & Buah" },
    { id: "stk_wortel", name: "Wortel Bobo", emoji: "🥕", category: "Pizza & Buah" },
    { id: "stk_stroberi", name: "Stroberi Segar", emoji: "🍓", category: "Pizza & Buah" },
    { id: "stk_mangga", name: "Mangga Manis", emoji: "🥭", category: "Pizza & Buah" },
    { id: "stk_pisang", name: "Pisang Kuning", emoji: "🍌", category: "Pizza & Buah" },
    { id: "stk_apel", name: "Apel Merah", emoji: "🍎", category: "Pizza & Buah" },
    { id: "stk_semangka", name: "Semangka Segar", emoji: "🍉", category: "Pizza & Buah" },
    { id: "stk_jus", name: "Jus Pelangi", emoji: "🍹", category: "Pizza & Buah" },
    { id: "stk_puding", name: "Puding Umi", emoji: "🍮", category: "Pizza & Buah" },
    // Bento Jepang (8)
    { id: "stk_bento", name: "Bento Kawaii", emoji: "🍱", category: "Bento Jepang" },
    { id: "stk_ramen", name: "Ramen Hangat", emoji: "🍜", category: "Bento Jepang" },
    { id: "stk_sushi", name: "Sushi Tamago", emoji: "🍣", category: "Bento Jepang" },
    { id: "stk_onigiri", name: "Onigiri Lucu", emoji: "🍙", category: "Bento Jepang" },
    { id: "stk_takoyaki", name: "Takoyaki", emoji: "🐙", category: "Bento Jepang" },
    { id: "stk_udang", name: "Tempura Udang", emoji: "🍤", category: "Bento Jepang" },
    { id: "stk_sakura", name: "Bunga Sakura", emoji: "🌸", category: "Bento Jepang" },
    { id: "stk_dango", name: "Sate Dango", emoji: "🍡", category: "Bento Jepang" },
    // Bintang Angka & Juara (12)
    { id: "stk_num10", name: "Juara Angka 10", emoji: "🔟", category: "Bintang Juara" },
    { id: "stk_num20", name: "Bintang 20", emoji: "🌟", category: "Bintang Juara" },
    { id: "stk_num50", name: "Kapten Angka 50", emoji: "🏅", category: "Bintang Juara" },
    { id: "stk_num80", name: "Master Angka 80", emoji: "🎖️", category: "Bintang Juara" },
    { id: "stk_num100", name: "Juara Seratus 100!", emoji: "💯", category: "Bintang Juara" },
    { id: "stk_plus", name: "Jagoan Tambah (+)", emoji: "➕", category: "Bintang Juara" },
    { id: "stk_minus", name: "Jagoan Kurang (-)", emoji: "➖", category: "Bintang Juara" },
    { id: "stk_abc", name: "Pintar Huruf A-Z", emoji: "🔤", category: "Bintang Juara" },
    { id: "stk_baca", name: "Ratu Baca BA-CA", emoji: "📚", category: "Bintang Juara" },
    { id: "stk_trace", name: "Pelukis Saus", emoji: "🎨", category: "Bintang Juara" },
    { id: "stk_trophy", name: "Piala Koki Utama", emoji: "🏆", category: "Bintang Juara" },
    { id: "stk_rainbow", name: "Pelangi Ceria", emoji: "🌈", category: "Bintang Juara" },
    // Karakter Tamu Spesial: Sheriff Labrador
    { id: "stk_labrador", name: "Sheriff Labrador", emoji: "🐕", category: "Keluarga" },
    { id: "stk_police_badge", name: "Lencana Patroli Polisi", emoji: "🛡️", category: "Bintang Juara" }
  ];

  const WARDROBE = {
    hatColors: [
      { id: "white", name: "Putih Klasik", color: "#FFFFFF", band: "#FF6F91" },
      { id: "pink", name: "Pink Stroberi", color: "#FFD6E4", band: "#EC4899" },
      { id: "mint", name: "Mint Segar", color: "#D8F8F2", band: "#10B981" },
      { id: "lavender", name: "Ungu Lavender", color: "#EDE9FE", band: "#8B5CF6" },
      { id: "sunny", name: "Kuning Madu", color: "#FEF3C7", band: "#F59E0B" },
      { id: "sky", name: "Biru Langit", color: "#E0F2FE", band: "#0284C7" }
    ],
    apronColors: [
      { id: "pink", name: "Celemek Pink", color: "#FF6F91", pocket: "#FFE5EC" },
      { id: "mint", name: "Celemek Mint", color: "#2EC4B6", pocket: "#E0FBF8" },
      { id: "purple", name: "Celemek Ungu", color: "#A78BFA", pocket: "#F3EFFE" },
      { id: "orange", name: "Celemek Jeruk", color: "#FB8500", pocket: "#FFF3E0" },
      { id: "yellow", name: "Celemek Bintang", color: "#FFB703", pocket: "#FFF9DB" },
      { id: "red", name: "Celemek Ceri", color: "#EF4444", pocket: "#FEE2E2" }
    ],
    accessories: [
      { id: "star", name: "Bintang Koki", emoji: "⭐" },
      { id: "crown", name: "Mahkota Puteri", emoji: "👑" },
      { id: "ribbon", name: "Pita Manis", emoji: "🎀" },
      { id: "cat_ears", name: "Bando Mochi", emoji: "🐱" },
      { id: "sakura", name: "Bunga Sakura", emoji: "🌸" },
      { id: "heart", name: "Pin Hati Umi", emoji: "💖" }
    ]
  };

  const CHEF_RANKS = [
    { minStars: 0, title: "Koki Cilik Inara", badge: "🥄" },
    { minStars: 3, title: "Koki Kue Ceria", badge: "🧁" },
    { minStars: 7, title: "Koki Pizza Pintar", badge: "🍕" },
    { minStars: 12, title: "Koki Bintang Keluarga", badge: "🌟" },
    { minStars: 18, title: "Master Chef Seratus 100!", badge: "👑" }
  ];

  let customWordsRegistry = [];

  function registerCustomWords(list) {
    customWordsRegistry = Array.isArray(list) ? list : [];
  }

  function getWordById(id) {
    return (
      customWordsRegistry.find((w) => w.id === id) ||
      WORDS_DB.find((w) => w.id === id) ||
      WORDS_DB[0]
    );
  }

  function getWordByString(str) {
    const up = String(str).toUpperCase().trim();
    return (
      customWordsRegistry.find((w) => w.word === up) ||
      WORDS_DB.find((w) => w.word === up) || {
        id: up.toLowerCase(),
        word: up,
        syllables: [up],
        en: up,
        ja: up,
        emoji: "✨",
        color: "#FF6F91",
        category: "custom"
      }
    );
  }

  return {
    WORLDS,
    CUSTOMERS,
    WORDS_DB,
    LETTERS_DB,
    DIGIT_PATHS,
    STICKERS,
    WARDROBE,
    CHEF_RANKS,
    numberToIndonesian,
    numberToEnglish,
    numberToJapanese,
    getNumberInfo,
    getTracingPointsForTarget,
    generateMathProblem,
    registerCustomWords,
    getWordById,
    getWordByString
  };
})();
