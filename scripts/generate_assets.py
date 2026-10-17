#!/usr/bin/env python3
"""
Generator for Dapur Ceria Inara offline voice clips (.m4a via macOS `say` + `afconvert`)
and PWA PNG icons (`assets/icons/`).
"""
import os
import subprocess
import tempfile
import struct
import zlib
import math
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
ICONS_DIR = os.path.join(BASE_DIR, "assets", "icons")


def ensure_dirs():
    for sub in ["id", "en", "ja"]:
        os.makedirs(os.path.join(AUDIO_DIR, sub), exist_ok=True)
    os.makedirs(ICONS_DIR, exist_ok=True)


def id_number_text(n: int) -> str:
    units = [
        "nol", "satu", "dua", "tiga", "empat",
        "lima", "enam", "tujuh", "delapan", "sembilan",
        "sepuluh", "sebelas"
    ]
    if n < 12:
        return units[n]
    if n < 20:
        return f"{units[n - 10]} belas"
    if n < 100:
        tens = n // 10
        rem = n % 10
        if rem == 0:
            return f"{units[tens]} puluh"
        return f"{units[tens]} puluh {units[rem]}"
    if n == 100:
        return "seratus"
    return str(n)


def synth_one(task):
    voice, rate, text, out_path = task
    if os.path.exists(out_path) and os.path.getsize(out_path) > 500:
        return out_path
    with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as tmp:
        aiff_path = tmp.name
    try:
        subprocess.run(
            ["/usr/bin/say", "-v", voice, "-r", str(rate), "-o", aiff_path, text],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                "/usr/bin/afconvert",
                "-f", "m4af",
                "-d", "aac",
                "-b", "32000",
                "-c", "1",
                aiff_path,
                out_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    finally:
        if os.path.exists(aiff_path):
            os.remove(aiff_path)
    return out_path


def build_audio_tasks():
    tasks = []
    # 1. Indonesian numbers 0..100
    for n in range(0, 101):
        txt = id_number_text(n)
        out = os.path.join(AUDIO_DIR, "id", f"num_{n}.m4a")
        tasks.append(("Damayanti", 165, txt, out))

    # 2. Indonesian letters A..Z
    id_letter_phonetics = {
        "a": "a", "b": "be", "c": "ce", "d": "de", "e": "e",
        "f": "ef", "g": "ge", "h": "ha", "i": "i", "j": "je",
        "k": "ka", "l": "el", "m": "em", "n": "en", "o": "o",
        "p": "pe", "q": "ki", "r": "er", "s": "es", "t": "te",
        "u": "u", "v": "ve", "w": "we", "x": "eks", "y": "ye", "z": "zet"
    }
    for ch, pron in id_letter_phonetics.items():
        out = os.path.join(AUDIO_DIR, "id", f"letter_{ch}.m4a")
        tasks.append(("Damayanti", 155, pron, out))

    # 3. Indonesian phrases, math operators, and family words
    id_phrases = {
        "op_plus": "ditambah",
        "op_minus": "dikurangi",
        "op_equals": "sama dengan",
        "welcome": "Halo Koki Inara! Yuk kita masak dan belajar bersama Abi dan Umi!",
        "stage_cut": "Tahap satu! Ketuk bahan makanan untuk memotong sambil membaca suku katanya ya, Inara!",
        "stage_count": "Tahap dua! Yuk kita masukkan dan hitung bahan makanannya bersama-sama!",
        "stage_count_tens": "Tahap dua! Gunakan keranjang puluhan dan bahan satuan supaya cepat dan pintar!",
        "stage_math_add": "Sekarang tantangan tambah bahan! Yuk kita hitung jumlah semuanya di mangkuk!",
        "stage_math_sub": "Eh, lihat! Mochi Kucing ikut mencicipi makanan! Sisa berapa ya sekarang?",
        "stage_bubble": "Tahap tiga! Ketuk gelembung huruf yang menyala untuk mengeja kata!",
        "stage_trace": "Tahap empat! Ikuti bintang berkilau dengan jari Inara untuk melukis di atas saus!",
        "stage_eat": "Hore! Masakan Koki Inara sudah matang! Ketuk makanannya untuk menyuapi pelanggan!",
        "praise_abi": "MasyaAllah, pintar sekali Inara anak Abi! Masakan Inara lezat sekali!",
        "praise_umi": "Alhamdulillah, hebat sekali Inara sayang! Umi bangga sekali sama Koki Inara!",
        "praise_mochi": "Meong! Nyam nyam, masakan Koki Inara paling enak sedunia!",
        "praise_bobo": "Hore! Wortel dan masakan buatan Inara bikin Bobo Kelinci semangat melompat!",
        "praise_kuma": "Hmm, harum dan lezat sekali! Terima kasih ya Koki Inara yang baik hati!",
        "try_again": "Hampir tepat! Yuk coba ketuk yang berkilau ya, Inara sayang!",
        "great_job": "Hebat sekali Koki Inara! Bintang untuk Inara!",
        "hundred_party": "Seratus! Wah, Koki Inara sudah pintar berhitung sampai seratus!",
        "sleepy_kitchen": "Wah, dapurnya sudah mengantuk, Inara sayang. Besok kita masak lagi ya bersama Abi dan Umi! Selamat istirahat!",
        "word_inara": "I, NA, RA. Inara!",
        "word_abi": "A, BI. Abi!",
        "word_umi": "U, MI. Umi!",
        "word_sayang": "SA, YANG. Sayang!",
        "basket_ten": "Sepuluh!",
    }
    for key, text in id_phrases.items():
        out = os.path.join(AUDIO_DIR, "id", f"{key}.m4a")
        tasks.append(("Damayanti", 165, text, out))

    # 4. English numbers 0..100 & operators
    for n in range(0, 101):
        out = os.path.join(AUDIO_DIR, "en", f"num_{n}.m4a")
        tasks.append(("Samantha", 165, str(n), out))

    en_phrases = {
        "op_plus": "plus",
        "op_minus": "minus",
        "op_equals": "equals",
        "great_job": "Wonderful job, Chef Inara!",
        "hundred_party": "One hundred! Amazing job, Chef Inara!",
    }
    for key, text in en_phrases.items():
        out = os.path.join(AUDIO_DIR, "en", f"{key}.m4a")
        tasks.append(("Samantha", 165, text, out))

    # 5. Japanese numbers (0..20, 30..100) & phrases
    ja_nums = {
        0: "ゼロ",
        1: "いち", 2: "に", 3: "さん", 4: "よん", 5: "ご",
        6: "ろく", 7: "なな", 8: "はち", 9: "きゅう", 10: "じゅう",
        11: "じゅういち", 12: "じゅうに", 13: "じゅうさん", 14: "じゅうよん", 15: "じゅうご",
        16: "じゅうろく", 17: "じゅうなな", 18: "じゅうはち", 19: "じゅうきゅう", 20: "にじゅう",
        30: "さんじゅう", 40: "よんじゅう", 50: "ごじゅう", 60: "ろくじゅう",
        70: "ななじゅう", 80: "はちじゅう", 90: "きゅうじゅう", 100: "ひゃく"
    }
    for n, txt in ja_nums.items():
        out = os.path.join(AUDIO_DIR, "ja", f"num_{n}.m4a")
        tasks.append(("Kyoko", 160, txt, out))

    ja_phrases = {
        "itadakimasu": "いただきます！",
        "oishii": "おいしい！イナラちゃん、すごい！",
        "sugoi": "すごい！よくできました！",
        "arigatou": "ありがとう、イナラシェフ！",
        "konnichiwa": "こんにちは、イナラちゃん！",
    }
    for key, txt in ja_phrases.items():
        out = os.path.join(AUDIO_DIR, "ja", f"{key}.m4a")
        tasks.append(("Kyoko", 160, txt, out))

    return tasks


def create_png_icon(filename: str, size: int, maskable: bool = False):
    """
    Generates a cheerful pastel Chef Hat + Heart + Star icon in pure Python PNG format
    so there are zero external imaging library dependencies.
    """
    width = height = size
    pixels = bytearray(width * height * 4)

    cx = width / 2.0
    cy = height / 2.0
    r_max = width / 2.0

    for y in range(height):
        for x in range(width):
            idx = (y * width + x) * 4
            # Normalized coords -1..1
            nx = (x - cx) / r_max
            ny = (y - cy) / r_max
            dist = math.hypot(nx, ny)

            # Rounded rect / circle mask for non-maskable
            if not maskable:
                # Superellipse (squircle)
                sq = abs(nx) ** 4.5 + abs(ny) ** 4.5
                if sq > 0.94:
                    pixels[idx:idx+4] = bytes([0, 0, 0, 0])
                    continue

            # Warm pastel radial gradient background (strawberry cream to peach-pink)
            t = min(1.0, dist / 1.2)
            r = int(255 - t * 18)
            g = int(138 - t * 35)
            b = int(168 - t * 20)

            # Soft inner cream circle badge
            if dist < 0.72:
                r, g, b = 255, 248, 240
            elif dist < 0.76:
                r, g, b = 255, 210, 125

            # Chef hat clouds (top center)
            # Three overlapping circles for the puff + headband rectangle
            c1 = math.hypot(nx - 0.0, ny + 0.25) < 0.22
            c2 = math.hypot(nx + 0.18, ny + 0.18) < 0.17
            c3 = math.hypot(nx - 0.18, ny + 0.18) < 0.17
            band = (-0.24 <= nx <= 0.24) and (-0.02 <= ny <= 0.14)
            band_stripe = (-0.24 <= nx <= 0.24) and (0.04 <= ny <= 0.09)

            if c1 or c2 or c3 or band:
                r, g, b = 255, 255, 255
                if band_stripe:
                    r, g, b = 255, 111, 145

            # Cute smiling face / rosy cheeks below hat
            cheek_l = math.hypot(nx + 0.20, ny - 0.30) < 0.065
            cheek_r = math.hypot(nx - 0.20, ny - 0.30) < 0.065
            eye_l = math.hypot(nx + 0.12, ny - 0.22) < 0.038
            eye_r = math.hypot(nx - 0.12, ny - 0.22) < 0.038
            smile_dist = math.hypot(nx, ny - 0.24)
            smile = (0.08 <= smile_dist <= 0.115) and (ny > 0.25)

            if cheek_l or cheek_r:
                r, g, b = 255, 168, 188
            if eye_l or eye_r or smile:
                r, g, b = 92, 55, 76

            # Golden star on top of hat
            if math.hypot(nx, ny + 0.24) < 0.075:
                r, g, b = 255, 200, 61

            pixels[idx:idx+4] = bytes([r, g, b, 255])

    def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk = chunk_type + data
        return struct.pack("!I", len(data)) + chunk + struct.pack("!I", zlib.crc32(chunk) & 0xFFFFFFFF)

    raw_rows = bytearray()
    stride = width * 4
    for y in range(height):
        raw_rows.append(0)  # Filter type 0 (None)
        raw_rows.extend(pixels[y * stride : (y + 1) * stride])

    ihdr = struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_rows), 9)
    png_bytes = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", idat) + png_chunk(b"IEND", b"")

    with open(filename, "wb") as f:
        f.write(png_bytes)


def build_word_and_syllable_tasks():
    words_syllables = {
        "inara": ("Inara", "Chef Inara", ["I", "NA", "RA"]),
        "abi": ("Abi", "Daddy Abi", ["A", "BI"]),
        "umi": ("Umi", "Mommy Umi", ["U", "MI"]),
        "sayang": ("Sayang", "Love", ["SA", "YANG"]),
        "koki": ("Koki", "Chef", ["KO", "KI"]),
        "dapur": ("Dapur", "Kitchen", ["DA", "PUR"]),
        "cinta": ("Cinta", "Love", ["CIN", "TA"]),
        "pintar": ("Pintar", "Smart", ["PIN", "TAR"]),
        "roti": ("Roti", "Bread", ["RO", "TI"]),
        "susu": ("Susu", "Milk", ["SU", "SU"]),
        "telur": ("Telur", "Egg", ["TE", "LUR"]),
        "nasi": ("Nasi", "Rice", ["NA", "SI"]),
        "madu": ("Madu", "Honey", ["MA", "DU"]),
        "ayam": ("Ayam", "Chicken", ["A", "YAM"]),
        "bubur": ("Bubur", "Porridge", ["BU", "BUR"]),
        "mentega": ("Mentega", "Butter", ["MEN", "TE", "GA"]),
        "keju": ("Keju", "Cheese", ["KE", "JU"]),
        "gula": ("Gula", "Sugar", ["GU", "LA"]),
        "bolu": ("Bolu", "Sponge Cake", ["BO", "LU"]),
        "donat": ("Donat", "Donut", ["DO", "NAT"]),
        "cokelat": ("Cokelat", "Chocolate", ["CO", "KE", "LAT"]),
        "eskrim": ("Es krim", "Ice Cream", ["ES", "KRIM"]),
        "biskuit": ("Biskuit", "Cookie", ["BIS", "KU", "IT"]),
        "tepung": ("Tepung", "Flour", ["TE", "PUNG"]),
        "vanila": ("Vanila", "Vanilla", ["VA", "NI", "LA"]),
        "tomat": ("Tomat", "Tomato", ["TO", "MAT"]),
        "wortel": ("Wortel", "Carrot", ["WOR", "TEL"]),
        "sosis": ("Sosis", "Sausage", ["SO", "SIS"]),
        "jamur": ("Jamur", "Mushroom", ["JA", "MUR"]),
        "kentang": ("Kentang", "Potato", ["KEN", "TANG"]),
        "bayam": ("Bayam", "Spinach", ["BA", "YAM"]),
        "jagung": ("Jagung", "Corn", ["JA", "GUNG"]),
        "daging": ("Daging", "Beef Meat", ["DA", "GING"]),
        "brokoli": ("Brokoli", "Broccoli", ["BRO", "KO", "LI"]),
        "bawang": ("Bawang", "Onion", ["BA", "WANG"]),
        "pizza": ("Pizza", "Pizza", ["PIZ", "ZA"]),
        "burger": ("Burger", "Burger", ["BUR", "GER"]),
        "apel": ("Apel", "Apple", ["A", "PEL"]),
        "pisang": ("Pisang", "Banana", ["PI", "SANG"]),
        "jeruk": ("Jeruk", "Orange", ["JE", "RUK"]),
        "mangga": ("Mangga", "Mango", ["MANG", "GA"]),
        "stroberi": ("Stroberi", "Strawberry", ["STRO", "BE", "RI"]),
        "anggur": ("Anggur", "Grapes", ["ANG", "GUR"]),
        "semangka": ("Semangka", "Watermelon", ["SE", "MANG", "KA"]),
        "melon": ("Melon", "Melon", ["ME", "LON"]),
        "nanas": ("Nanas", "Pineapple", ["NA", "NAS"]),
        "pepaya": ("Pepaya", "Papaya", ["PE", "PA", "YA"]),
        "alpukat": ("Alpukat", "Avocado", ["AL", "PU", "KAT"]),
        "kelapa": ("Kelapa", "Coconut", ["KE", "LA", "PA"]),
        "ceri": ("Ceri", "Cherry", ["CE", "RI"]),
        "kiwi": ("Kiwi", "Kiwi", ["KI", "WI"]),
        "lemon": ("Lemon", "Lemon", ["LE", "MON"]),
        "ikan": ("Ikan", "Fish", ["I", "KAN"]),
        "udang": ("Udang", "Shrimp", ["U", "DANG"]),
        "tahu": ("Tahu", "Tofu", ["TA", "HU"]),
        "nori": ("Nori", "Seaweed", ["NO", "RI"]),
        "ramen": ("Ramen", "Ramen Noodles", ["RA", "MEN"]),
        "sushi": ("Sushi", "Sushi", ["SU", "SHI"]),
        "bento": ("Bento", "Bento Box", ["BEN", "TO"]),
        "onigiri": ("Onigiri", "Rice Ball", ["O", "NI", "GI", "RI"]),
        "takoyaki": ("Takoyaki", "Octopus Ball", ["TA", "KO", "YA", "KI"]),
        "satu": ("Satu", "One", ["SA", "TU"]),
        "dua": ("Dua", "Two", ["DU", "A"]),
        "tiga": ("Tiga", "Three", ["TI", "GA"]),
        "empat": ("Empat", "Four", ["EM", "PAT"]),
        "lima": ("Lima", "Five", ["LI", "MA"]),
        "sepuluh": ("Sepuluh", "Ten", ["SE", "PU", "LUH"]),
        "seratus": ("Seratus", "One Hundred", ["SE", "RA", "TUS"]),
        "merah": ("Merah", "Red", ["ME", "RAH"]),
        "kuning": ("Kuning", "Yellow", ["KU", "NING"]),
        "hijau": ("Hijau", "Green", ["HI", "JAU"]),
        "biru": ("Biru", "Blue", ["BI", "RU"]),
        "ungu": ("Ungu", "Purple", ["U", "NGU"]),
        "sendok": ("Sendok", "Spoon", ["SEN", "DOK"]),
        "piring": ("Piring", "Plate", ["PI", "RING"]),
        "cangkir": ("Cangkir", "Cup", ["CANG", "KIR"]),
        "manis": ("Manis", "Sweet", ["MA", "NIS"]),
        "yoghurt": ("Yoghurt", "Yogurt", ["YOG", "HURT"]),
        "zaitun": ("Zaitun", "Olive", ["ZAI", "TUN"]),
        "foto": ("Foto", "Photo", ["FO", "TO"]),
        "quran": ("Quran", "Quran", ["QUR", "AN"]),
        "xilofon": ("Xilofon", "Xylophone", ["XI", "LO", "FON"]),
    }
    extra_tasks = []
    # Also include common custom family syllables (KA-KAK, NE-NEK, A-DEK, PA-MAN, TAN-TE, BUNG-SU)
    syllable_set = {"kak", "nek", "dek", "man", "tan", "bung"}
    for wid, (wtext, entext, syls) in words_syllables.items():
        out_w = os.path.join(AUDIO_DIR, "id", f"word_{wid}.m4a")
        extra_tasks.append(("Damayanti", 160, wtext, out_w))
        out_en = os.path.join(AUDIO_DIR, "en", f"word_{wid}.m4a")
        extra_tasks.append(("Samantha", 165, entext, out_en))
        for s in syls:
            syllable_set.add(s.lower())

    # Also generate common custom family words in ID
    family_custom_words = {
        "cust_kakak": "Kakak",
        "cust_nenek": "Nenek",
        "cust_kakek": "Kakek",
        "cust_adek": "Adek",
        "cust_paman": "Paman",
        "cust_tante": "Tante",
    }
    for cwid, cwtext in family_custom_words.items():
        out_cw = os.path.join(AUDIO_DIR, "id", f"word_{cwid}.m4a")
        extra_tasks.append(("Damayanti", 160, cwtext, out_cw))

    for syl in sorted(syllable_set):
        out_s = os.path.join(AUDIO_DIR, "id", f"syl_{syl}.m4a")
        extra_tasks.append(("Damayanti", 150, syl, out_s))

    return extra_tasks


def main():
    ensure_dirs()
    print("Generating PWA icons...")
    create_png_icon(os.path.join(ICONS_DIR, "icon-192.png"), 192, maskable=False)
    create_png_icon(os.path.join(ICONS_DIR, "icon-512.png"), 512, maskable=False)
    create_png_icon(os.path.join(ICONS_DIR, "icon-maskable-512.png"), 512, maskable=True)
    create_png_icon(os.path.join(ICONS_DIR, "apple-touch-icon.png"), 180, maskable=False)

    tasks = build_audio_tasks() + build_word_and_syllable_tasks()
    print(f"Generating {len(tasks)} offline voice clips (.m4a)...")
    done = 0
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = [pool.submit(synth_one, t) for t in tasks]
        for fut in as_completed(futures):
            fut.result()
            done += 1
            if done % 50 == 0 or done == len(tasks):
                print(f"  Progress: {done}/{len(tasks)} clips generated")
    print("All assets generated successfully!")


if __name__ == "__main__":
    main()

