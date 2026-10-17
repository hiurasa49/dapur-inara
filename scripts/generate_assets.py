#!/usr/bin/env python3
"""
Generator for Dapur Ceria Inara V2 offline voice clips via Microsoft Edge-TTS
- Indonesian: id-ID-GadisNeural (cheerful, soft, expressive cartoon child tone)
- English: en-US-AnaNeural (cheerful English child tone)
- Japanese: ja-JP-NanamiNeural (friendly Japanese anime tone)
Audio files are converted to high-efficiency offline .m4a (AAC) via macOS afconvert.
Also generates PWA icons and automatically synchronizes sw.js precache list.
"""
import os
import sys
import subprocess
import tempfile
import struct
import zlib
import math
import asyncio
import argparse
import edge_tts

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
ICONS_DIR = os.path.join(BASE_DIR, "assets", "icons")
SW_PATH = os.path.join(BASE_DIR, "sw.js")

VOICE_ID = "id-ID-GadisNeural"
VOICE_EN = "en-US-AnaNeural"
VOICE_JA = "ja-JP-NanamiNeural"


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


async def synth_task(voice: str, text: str, out_path: str, sem: asyncio.Semaphore, force: bool = False):
    if not force and os.path.exists(out_path) and os.path.getsize(out_path) > 500:
        return out_path

    async with sem:
        for attempt in range(4):
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp_mp3 = tmp.name
            try:
                comm = edge_tts.Communicate(text, voice)
                await comm.save(tmp_mp3)
                if os.path.exists(tmp_mp3) and os.path.getsize(tmp_mp3) > 100:
                    subprocess.run(
                        [
                            "/usr/bin/afconvert",
                            "-f", "m4af",
                            "-d", "aac",
                            "-b", "32000",
                            "-c", "1",
                            tmp_mp3,
                            out_path,
                        ],
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    return out_path
            except Exception as e:
                if attempt == 3:
                    print(f"Error synthesizing '{text}' ({voice}): {e}", file=sys.stderr)
                    return None
                await asyncio.sleep(0.6 * (attempt + 1))
            finally:
                if os.path.exists(tmp_mp3):
                    os.remove(tmp_mp3)
    return out_path


def build_audio_tasks():
    tasks = []
    # 1. Indonesian numbers 0..100
    for n in range(0, 101):
        txt = id_number_text(n)
        out = os.path.join(AUDIO_DIR, "id", f"num_{n}.m4a")
        tasks.append((VOICE_ID, txt, out))

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
        tasks.append((VOICE_ID, pron, out))

    # 3. Indonesian phrases, math operators, customer praises & Sheriff Labrador
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
        "praise_labrador": "Mantap Chef Inara! Misi memasak berhasil!",
        "greet_labrador": "Halo Chef Inara! Sheriff Labrador sedang berpatroli dan ingin memesan makanan sehat!",
        "labrador_badge": "Ini Lencana Patroli Polisi untuk Chef Inara yang hebat!",
        "siren": "Nii noo nii noo! Mobil patroli Sheriff Labrador datang!",
        "try_again": "Hampir tepat! Yuk coba ketuk yang berkilau ya, Inara sayang!",
        "great_job": "Hebat sekali Koki Inara! Bintang untuk Inara!",
        "hundred_party": "Seratus! Wah, Koki Inara sudah pintar berhitung sampai seratus!",
        "sleepy_kitchen": "Wah, dapurnya sudah mengantuk, Inara sayang. Besok kita masak lagi ya bersama Abi dan Umi! Selamat istirahat!",
        "basket_ten": "Sepuluh!",
    }
    for key, text in id_phrases.items():
        out = os.path.join(AUDIO_DIR, "id", f"{key}.m4a")
        tasks.append((VOICE_ID, text, out))

    # 4. English numbers 0..100 & operators
    for n in range(0, 101):
        out = os.path.join(AUDIO_DIR, "en", f"num_{n}.m4a")
        tasks.append((VOICE_EN, str(n), out))

    en_phrases = {
        "op_plus": "plus",
        "op_minus": "minus",
        "op_equals": "equals",
        "great_job": "Wonderful job, Chef Inara!",
        "hundred_party": "One hundred! Amazing job, Chef Inara!",
        "praise_labrador": "Great job Chef Inara! Cooking mission accomplished!",
        "greet_labrador": "Hello Chef Inara! Sheriff Labrador on patrol ordering healthy food!",
        "labrador_badge": "Here is the Police Patrol Badge for wonderful Chef Inara!",
    }
    for key, text in en_phrases.items():
        out = os.path.join(AUDIO_DIR, "en", f"{key}.m4a")
        tasks.append((VOICE_EN, text, out))

    # 5. Japanese numbers & phrases
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
        tasks.append((VOICE_JA, txt, out))

    ja_phrases = {
        "itadakimasu": "いただきます！",
        "oishii": "おいしい！イナラちゃん、すごい！",
        "sugoi": "すごい！よくできました！",
        "arigatou": "ありがとう、イナラシェフ！",
        "konnichiwa": "こんにちは、イナラちゃん！",
    }
    for key, txt in ja_phrases.items():
        out = os.path.join(AUDIO_DIR, "ja", f"{key}.m4a")
        tasks.append((VOICE_JA, txt, out))

    return tasks


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
        "labrador": ("Sheriff Labrador", "Sheriff Labrador", ["LA", "BRA", "DOR"]),
        "polisi": ("Polisi", "Police", ["PO", "LI", "SI"]),
        "patroli": ("Patroli", "Patrol", ["PA", "TRO", "LI"]),
    }
    extra_tasks = []
    syllable_set = {"kak", "nek", "dek", "man", "tan", "bung", "la", "bra", "dor", "po", "li", "si", "pa", "tro"}
    for wid, (wtext, entext, syls) in words_syllables.items():
        out_w = os.path.join(AUDIO_DIR, "id", f"word_{wid}.m4a")
        extra_tasks.append((VOICE_ID, wtext, out_w))
        out_en = os.path.join(AUDIO_DIR, "en", f"word_{wid}.m4a")
        extra_tasks.append((VOICE_EN, entext, out_en))
        for s in syls:
            syllable_set.add(s.lower())

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
        extra_tasks.append((VOICE_ID, cwtext, out_cw))

    for syl in sorted(syllable_set):
        out_s = os.path.join(AUDIO_DIR, "id", f"syl_{syl}.m4a")
        extra_tasks.append((VOICE_ID, syl, out_s))

    return extra_tasks


def create_png_icon(filename: str, size: int, maskable: bool = False):
    width = height = size
    pixels = bytearray(width * height * 4)

    cx = width / 2.0
    cy = height / 2.0
    r_max = width / 2.0

    for y in range(height):
        for x in range(width):
            idx = (y * width + x) * 4
            nx = (x - cx) / r_max
            ny = (y - cy) / r_max
            dist = math.hypot(nx, ny)

            if not maskable:
                sq = abs(nx) ** 4.5 + abs(ny) ** 4.5
                if sq > 0.94:
                    pixels[idx:idx+4] = bytes([0, 0, 0, 0])
                    continue

            t = min(1.0, dist / 1.2)
            r = int(255 - t * 18)
            g = int(138 - t * 35)
            b = int(168 - t * 20)

            if dist < 0.72:
                r, g, b = 255, 248, 240
            elif dist < 0.76:
                r, g, b = 255, 210, 125

            c1 = math.hypot(nx - 0.0, ny + 0.25) < 0.22
            c2 = math.hypot(nx + 0.18, ny + 0.18) < 0.17
            c3 = math.hypot(nx - 0.18, ny + 0.18) < 0.17
            band = (-0.24 <= nx <= 0.24) and (-0.02 <= ny <= 0.14)
            band_stripe = (-0.24 <= nx <= 0.24) and (0.04 <= ny <= 0.09)

            if c1 or c2 or c3 or band:
                r, g, b = 255, 255, 255
                if band_stripe:
                    r, g, b = 255, 111, 145

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

            if math.hypot(nx, ny + 0.24) < 0.075:
                r, g, b = 255, 200, 61

            pixels[idx:idx+4] = bytes([r, g, b, 255])

    def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk = chunk_type + data
        return struct.pack("!I", len(data)) + chunk + struct.pack("!I", zlib.crc32(chunk) & 0xFFFFFFFF)

    raw_rows = bytearray()
    stride = width * 4
    for y in range(height):
        raw_rows.append(0)
        raw_rows.extend(pixels[y * stride : (y + 1) * stride])

    ihdr = struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_rows), 9)
    png_bytes = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", idat) + png_chunk(b"IEND", b"")

    with open(filename, "wb") as f:
        f.write(png_bytes)


def update_service_worker():
    """Scans all assets and updates sw.js with fresh precache list and bumped version."""
    if not os.path.exists(SW_PATH):
        return

    audio_files = []
    for root, _, files in os.walk(AUDIO_DIR):
        for f in files:
            if f.endswith(".m4a"):
                rel = os.path.relpath(os.path.join(root, f), BASE_DIR)
                audio_files.append("./" + rel)
    audio_files.sort()

    static_assets = [
        "./",
        "./index.html",
        "./manifest.json",
        "./css/styles.css",
        "./js/data.js",
        "./js/svg-assets.js",
        "./js/audio.js",
        "./js/app.js",
        "./assets/icons/apple-touch-icon.png",
        "./assets/icons/icon-192.png",
        "./assets/icons/icon-512.png",
        "./assets/icons/icon-maskable-512.png",
    ]

    all_precache = static_assets + audio_files
    precache_js = ",\n".join(f'  "{p}"' for p in all_precache)

    sw_content = f"""/**
 * ============================================================================
 * SERVICE WORKER — DAPUR CERIA INARA V2 (100% OFFLINE-FIRST CACHE)
 * ============================================================================
 * Pre-caches HTML, CSS, JS, SVG assets, Icons, and all {len(audio_files)} Edge-TTS voice clips (.m4a)
 * so Chef Inara can play on her Android tablet with Airplane Mode ON (zero lag, zero internet).
 */

const CACHE_NAME = "inara-dapur-ceria-v2.0.0";

const PRECACHE_ASSETS = [
{precache_js}
];

self.addEventListener("install", (event) => {{
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
}});

self.addEventListener("activate", (event) => {{
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {{
            if (key !== CACHE_NAME) {{
              return caches.delete(key);
            }}
          }})
        )
      )
      .then(() => self.clients.claim())
  );
}});

self.addEventListener("fetch", (event) => {{
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {{
      if (cached) return cached;
      return fetch(req)
        .then((response) => {{
          if (!response || response.status !== 200 || response.type !== "basic") {{
            return response;
          }}
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {{
            cache.put(req, toCache);
          }});
          return response;
        }})
        .catch(() => {{
          if (req.mode === "navigate") {{
            return caches.match("./index.html");
          }}
        }});
    }})
  );
}});
"""
    with open(SW_PATH, "w", encoding="utf-8") as f:
        f.write(sw_content)
    print(f"Updated sw.js with {len(all_precache)} precached assets (version v2.0.0)")


async def async_main(force=False, concurrency=10):
    ensure_dirs()
    print("Generating PWA icons...")
    create_png_icon(os.path.join(ICONS_DIR, "icon-192.png"), 192, maskable=False)
    create_png_icon(os.path.join(ICONS_DIR, "icon-512.png"), 512, maskable=False)
    create_png_icon(os.path.join(ICONS_DIR, "icon-maskable-512.png"), 512, maskable=True)
    create_png_icon(os.path.join(ICONS_DIR, "apple-touch-icon.png"), 180, maskable=False)

    tasks = build_audio_tasks() + build_word_and_syllable_tasks()
    print(f"Generating/Refreshing {len(tasks)} Edge-TTS voice clips (.m4a) with concurrency={concurrency} (force={force})...")

    sem = asyncio.Semaphore(concurrency)
    done = 0
    total = len(tasks)

    coros = [synth_task(v, txt, out, sem, force=force) for (v, txt, out) in tasks]
    for fut in asyncio.as_completed(coros):
        await fut
        done += 1
        if done % 50 == 0 or done == total:
            print(f"  Progress: {done}/{total} clips generated")

    print("All voice clips generated successfully!")
    update_service_worker()


def main():
    parser = argparse.ArgumentParser(description="Generate Dapur Inara V2 Assets")
    parser.add_argument("--force", action="store_true", help="Force regenerate all audio files with Edge-TTS")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent edge-tts connections")
    args = parser.parse_args()

    asyncio.run(async_main(force=args.force, concurrency=args.concurrency))


if __name__ == "__main__":
    main()
