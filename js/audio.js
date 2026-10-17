/**
 * Dapur Ceria Inara — Trilingual Offline-Ready Audio, SFX & Parent Voice Recorder Engine
 * Features:
 * 1. Web Audio API Synthesizer for tactile child-friendly SFX & lullaby
 * 2. Pre-generated local .m4a voice clip sequencer (0-100 ID/EN/JA, letters A-Z, 75+ words, 110+ syllables, math equations)
 * 3. IndexedDB + MediaRecorder for real Abi & Umi voice recordings
 * 4. Web Speech API fallback for custom parent-created words
 */

window.INARA_AUDIO = (function () {
  let audioCtx = null;
  let isMuted = false;
  let bgmEnabled = false;
  let bgmInterval = null;
  let currentAudioEl = null;
  let playbackToken = 0;

  // IndexedDB for Parent Voice Recordings
  const DB_NAME = "InaraVoiceDB";
  const STORE_NAME = "recordings";
  let dbInstance = null;
  const memoryVoiceCache = {}; // slotKey -> ObjectURL

  function getAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // =========================================================================
  // 1. INDEXEDDB VOICE RECORDER STORAGE (STUDIO SUARA ABI & UMI)
  // =========================================================================
  function initVoiceDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = (e) => {
        dbInstance = e.target.result;
        preloadCustomRecordings().then(() => resolve(dbInstance));
      };
      req.onerror = () => resolve(null);
    });
  }

  function preloadCustomRecordings() {
    return new Promise((resolve) => {
      if (!dbInstance) {
        resolve();
        return;
      }
      try {
        const tx = dbInstance.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const slots = ["praise_abi", "praise_umi", "greet_inara", "math_bravo"];
        let pending = slots.length;
        slots.forEach((slot) => {
          const getReq = store.get(slot);
          getReq.onsuccess = () => {
            if (getReq.result instanceof Blob) {
              if (memoryVoiceCache[slot]) URL.revokeObjectURL(memoryVoiceCache[slot]);
              memoryVoiceCache[slot] = URL.createObjectURL(getReq.result);
            }
            pending--;
            if (pending === 0) resolve();
          };
          getReq.onerror = () => {
            pending--;
            if (pending === 0) resolve();
          };
        });
      } catch (err) {
        resolve();
      }
    });
  }

  function saveCustomRecording(slotKey, blob) {
    return new Promise((resolve, reject) => {
      if (memoryVoiceCache[slotKey]) {
        URL.revokeObjectURL(memoryVoiceCache[slotKey]);
      }
      memoryVoiceCache[slotKey] = URL.createObjectURL(blob);
      if (!dbInstance) {
        resolve(true);
        return;
      }
      try {
        const tx = dbInstance.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(blob, slotKey);
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e);
      } catch (err) {
        reject(err);
      }
    });
  }

  function deleteCustomRecording(slotKey) {
    return new Promise((resolve) => {
      if (memoryVoiceCache[slotKey]) {
        URL.revokeObjectURL(memoryVoiceCache[slotKey]);
        delete memoryVoiceCache[slotKey];
      }
      if (!dbInstance) {
        resolve(true);
        return;
      }
      try {
        const tx = dbInstance.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(slotKey);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  function hasCustomRecording(slotKey) {
    return Boolean(memoryVoiceCache[slotKey]);
  }

  // =========================================================================
  // 2. WEB AUDIO SYNTHESIZER SOUND EFFECTS (SFX)
  // =========================================================================
  function playTone(freq, type = "sine", duration = 0.15, startTimeOffset = 0, gainVal = 0.22, slideToFreq = null) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + startTimeOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideToFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
      }
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }

  function playTap() {
    playTone(520, "sine", 0.09, 0, 0.2, 680);
  }

  function playChop() {
    // Crisp wooden cutting board chop
    playTone(190, "triangle", 0.08, 0, 0.3, 85);
    playTone(640, "sine", 0.11, 0.03, 0.22, 880);
  }

  function playPop() {
    playTone(380, "sine", 0.12, 0, 0.26, 840);
  }

  function playBasketDrop() {
    // Cheerful chord for +10 Basket
    playTone(440, "triangle", 0.14, 0, 0.24, 523.25);
    playTone(554.37, "triangle", 0.16, 0.05, 0.24, 659.25);
    playTone(659.25, "sine", 0.22, 0.1, 0.26, 880);
  }

  function playMochiBite() {
    // Cute double crunch when Mochi eats food in subtraction
    playTone(320, "sawtooth", 0.09, 0, 0.16, 180);
    playTone(420, "triangle", 0.1, 0.11, 0.18, 220);
    playTone(580, "sine", 0.15, 0.22, 0.2, 740);
  }

  function playSparkle(stepIndex = 0) {
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
    const freq = scale[stepIndex % scale.length];
    playTone(freq, "sine", 0.18, 0, 0.22, freq * 1.15);
  }

  function playGentleHint() {
    // Soft non-punishing wobble sound
    playTone(340, "sine", 0.14, 0, 0.16, 290);
    playTone(290, "sine", 0.16, 0.12, 0.16, 330);
  }

  function playFanfare() {
    const notes = [
      [523.25, 0.0, 0.15],
      [659.25, 0.12, 0.15],
      [783.99, 0.24, 0.15],
      [1046.5, 0.36, 0.38]
    ];
    notes.forEach(([f, offset, dur]) => {
      playTone(f, "triangle", dur, offset, 0.25);
    });
  }

  function playPoliceSiren() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";

      // Two-tone cheerful cartoon police siren
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(920, now + 0.26);
      osc.frequency.linearRampToValueAtTime(650, now + 0.52);
      osc.frequency.linearRampToValueAtTime(920, now + 0.78);
      osc.frequency.linearRampToValueAtTime(650, now + 1.04);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.setValueAtTime(0.22, now + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.22);
    } catch (e) {}
  }

  function playSleepyLullaby() {
    const notes = [
      [659.25, 0.0, 0.45],
      [587.33, 0.5, 0.45],
      [523.25, 1.0, 0.65],
      [392.0, 1.7, 0.55],
      [523.25, 2.3, 0.8]
    ];
    notes.forEach(([f, offset, dur]) => {
      playTone(f, "sine", dur, offset, 0.15);
    });
  }

  function toggleBgm(forceState) {
    bgmEnabled = typeof forceState === "boolean" ? forceState : !bgmEnabled;
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
    if (bgmEnabled && !isMuted) {
      const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 659.25, 523.25];
      let idx = 0;
      bgmInterval = setInterval(() => {
        if (!isMuted && bgmEnabled) {
          playTone(melody[idx % melody.length], "sine", 0.22, 0, 0.045);
          idx++;
        }
      }, 650);
    }
    return bgmEnabled;
  }

  // =========================================================================
  // 3. VOICE CLIP & SEQUENCER ENGINE (.M4A + INDEXEDDB + WEB SPEECH FALLBACK)
  // =========================================================================
  function stopSpeech() {
    playbackToken++;
    if (currentBufferSource) {
      try {
        currentBufferSource.stop();
      } catch (e) {}
      currentBufferSource = null;
    }
    if (currentAudioEl) {
      try {
        currentAudioEl.pause();
        currentAudioEl.currentTime = 0;
      } catch (e) {}
      currentAudioEl = null;
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  const audioBufferCache = new Map();
  let currentBufferSource = null;

  async function getAudioBuffer(url) {
    if (audioBufferCache.has(url)) {
      return audioBufferCache.get(url);
    }
    const ctx = getAudioContext();
    if (!ctx || !window.fetch) return null;
    try {
      let resp = await fetch(url);
      if (!resp.ok && url.endsWith(".m4a")) {
        resp = await fetch(url.replace(/\.m4a$/, ".mp3"));
      } else if (!resp.ok && url.endsWith(".mp3")) {
        resp = await fetch(url.replace(/\.mp3$/, ".m4a"));
      }
      if (!resp.ok) return null;
      const arrayBuf = await resp.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      audioBufferCache.set(url, audioBuf);
      return audioBuf;
    } catch (e) {
      return null;
    }
  }

  function playSingleAudioUrl(url, token) {
    return new Promise(async (resolve) => {
      if (isMuted || token !== playbackToken) {
        resolve(false);
        return;
      }

      // Fast-path: Web Audio API Buffer playback (0ms latency, zero lag)
      const ctx = getAudioContext();
      const canUseWebAudio = ctx && window.fetch && window.location && window.location.protocol !== "file:";

      if (canUseWebAudio) {
        try {
          if (ctx.state === "suspended") {
            try { await ctx.resume(); } catch (e) {}
          }
          if (ctx.state === "running") {
            const buf = await getAudioBuffer(url);
            if (buf && token === playbackToken && !isMuted) {
              const source = ctx.createBufferSource();
              source.buffer = buf;
              source.connect(ctx.destination);
              currentBufferSource = source;
              let settled = false;
              let safetyTimer = null;
              const finish = (ok) => {
                if (!settled) {
                  settled = true;
                  if (safetyTimer) clearTimeout(safetyTimer);
                  if (currentBufferSource === source) currentBufferSource = null;
                  resolve(ok);
                }
              };
              source.onended = () => finish(true);
              safetyTimer = setTimeout(() => finish(true), ((buf.duration || 1) + 0.4) * 1000);
              source.start(0);
              return;
            }
          }
        } catch (e) {}
      }

      // HTML5 Audio fallback & Test Harness mock compatibility
      const audio = new Audio(url);
      currentAudioEl = audio;
      let settled = false;
      const finish = (ok) => {
        if (!settled) {
          settled = true;
          if (currentAudioEl === audio) currentAudioEl = null;
          resolve(ok);
        }
      };
      audio.onended = () => finish(true);
      audio.onerror = () => {
        const altUrl = url.endsWith(".mp3")
          ? url.replace(/\.mp3$/, ".m4a")
          : url.endsWith(".m4a")
          ? url.replace(/\.m4a$/, ".mp3")
          : null;
        if (altUrl) {
          const altAudio = new Audio(altUrl);
          currentAudioEl = altAudio;
          altAudio.onended = () => finish(true);
          altAudio.onerror = () => finish(false);
          altAudio.play().catch(() => finish(false));
        } else {
          finish(false);
        }
      };
      audio.play().catch(() => finish(false));
    });
  }

  function speakViaWebSpeech(text, lang = "id-ID", token = playbackToken) {
    return new Promise((resolve) => {
      if (isMuted || token !== playbackToken || !window.speechSynthesis) {
        resolve(false);
        return;
      }
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang;
        utter.rate = 0.95;
        utter.pitch = 1.08;
        utter.onend = () => resolve(true);
        utter.onerror = () => resolve(false);
        window.speechSynthesis.speak(utter);
      } catch (e) {
        resolve(false);
      }
    });
  }

  /**
   * Executes a sequence of audio items in order.
   * Each item can be:
   * - { type: 'custom', slot: 'praise_abi' }
   * - { type: 'file', path: 'assets/audio/id/num_5.m4a', fallbackText: 'Lima', lang: 'id-ID' }
   * - { type: 'tts', text: 'Halo Inara', lang: 'id-ID' }
   * - { type: 'pause', ms: 180 }
   */
  let lastSequence = [];
  function getLastSequence() {
    return lastSequence;
  }

  async function playSequence(items) {
    lastSequence = Array.isArray(items) ? items.slice() : [];
    if (isMuted) return;
    stopSpeech();
    const myToken = playbackToken;

    for (const item of items) {
      if (myToken !== playbackToken) return;
      if (!item) continue;

      if (item.type === "pause") {
        await new Promise((r) => setTimeout(r, item.ms || 150));
        continue;
      }

      if (item.type === "custom" && item.slot && memoryVoiceCache[item.slot]) {
        const ok = await playSingleAudioUrl(memoryVoiceCache[item.slot], myToken);
        if (ok) continue;
      }

      if (item.type === "file" && item.path) {
        const ok = await playSingleAudioUrl(item.path, myToken);
        if (!ok && item.fallbackText) {
          await speakViaWebSpeech(item.fallbackText, item.lang || "id-ID", myToken);
        }
        continue;
      }

      if (item.type === "tts" && item.text) {
        await speakViaWebSpeech(item.text, item.lang || "id-ID", myToken);
      }
    }
  }

  // Helper to build Japanese number audio file items (0..100)
  function getJapaneseNumberItems(n) {
    const direct = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const info = window.INARA_DATA.getNumberInfo(n);
    if (direct.includes(n)) {
      return [{ type: "file", path: `assets/audio/ja/num_${n}.m4a`, fallbackText: info.jaKana, lang: "ja-JP" }];
    }
    const tens = Math.floor(n / 10) * 10;
    const rem = n % 10;
    return [
      { type: "file", path: `assets/audio/ja/num_${tens}.m4a`, fallbackText: info.jaKana, lang: "ja-JP" },
      { type: "file", path: `assets/audio/ja/num_${rem}.m4a`, fallbackText: "", lang: "ja-JP" }
    ];
  }

  /**
   * Speaks a number 0..100 with configurable Bilingual/Trilingual Echo
   * @param {number} n - number 0..100
   * @param {Object} opts - { echoEn: boolean, echoJa: boolean, onlyLang: 'id'|'en'|'ja' }
   */
  function speakNumber(n, opts = {}) {
    const num = Math.max(0, Math.min(100, Math.round(n)));
    const info = window.INARA_DATA.getNumberInfo(num);
    const seq = [];

    if (opts.onlyLang === "en") {
      seq.push({ type: "file", path: `assets/audio/en/num_${num}.m4a`, fallbackText: info.en, lang: "en-US" });
    } else if (opts.onlyLang === "ja") {
      seq.push(...getJapaneseNumberItems(num));
    } else {
      seq.push({ type: "file", path: `assets/audio/id/num_${num}.mp3`, fallbackText: info.id, lang: "id-ID" });
      if (opts.echoEn) {
        seq.push({ type: "pause", ms: 160 });
        seq.push({ type: "file", path: `assets/audio/en/num_${num}.m4a`, fallbackText: info.en, lang: "en-US" });
      }
      if (opts.echoJa) {
        seq.push({ type: "pause", ms: 160 });
        seq.push(...getJapaneseNumberItems(num));
      }
    }

    return playSequence(seq);
  }

  /**
   * Speaks a complete math equation: e.g. "Tiga ditambah Dua sama dengan Lima! Three plus Two equals Five!"
   */
  function speakMathEquation(a, op, b, answer, includeEnglish = true) {
    const opKey = op === "+" ? "op_plus" : "op_minus";
    const opTextId = op === "+" ? "ditambah" : "dikurangi";
    const opTextEn = op === "+" ? "plus" : "minus";

    const seq = [];
    if (hasCustomRecording("math_bravo")) {
      seq.push({ type: "custom", slot: "math_bravo" });
      seq.push({ type: "pause", ms: 180 });
    }

    seq.push(
      { type: "file", path: `assets/audio/id/num_${a}.mp3`, fallbackText: String(a), lang: "id-ID" },
      { type: "file", path: `assets/audio/id/${opKey}.mp3`, fallbackText: opTextId, lang: "id-ID" },
      { type: "file", path: `assets/audio/id/num_${b}.mp3`, fallbackText: String(b), lang: "id-ID" },
      { type: "file", path: `assets/audio/id/op_equals.mp3`, fallbackText: "sama dengan", lang: "id-ID" },
      { type: "file", path: `assets/audio/id/num_${answer}.mp3`, fallbackText: String(answer), lang: "id-ID" }
    );

    if (includeEnglish) {
      seq.push(
        { type: "pause", ms: 220 },
        { type: "file", path: `assets/audio/en/num_${a}.m4a`, fallbackText: String(a), lang: "en-US" },
        { type: "file", path: `assets/audio/en/${opKey}.m4a`, fallbackText: opTextEn, lang: "en-US" },
        { type: "file", path: `assets/audio/en/num_${b}.m4a`, fallbackText: String(b), lang: "en-US" },
        { type: "file", path: `assets/audio/en/op_equals.m4a`, fallbackText: "equals", lang: "en-US" },
        { type: "file", path: `assets/audio/en/num_${answer}.m4a`, fallbackText: String(answer), lang: "en-US" }
      );
    }

    return playSequence(seq);
  }

  function speakSyllable(syl) {
    const clean = String(syl).toLowerCase().trim();
    return playSequence([
      { type: "file", path: `assets/audio/id/syl_${clean}.mp3`, fallbackText: clean, lang: "id-ID" }
    ]);
  }

  function speakWord(wordObj, includeEcho = true) {
    if (!wordObj) return;
    const wid = String(wordObj.id || wordObj.word || "").toLowerCase().trim();
    const seq = [
      { type: "file", path: `assets/audio/id/word_${wid}.mp3`, fallbackText: wordObj.word, lang: "id-ID" }
    ];
    if (includeEcho && wordObj.en) {
      seq.push({ type: "pause", ms: 180 });
      seq.push({
        type: "file",
        path: `assets/audio/en/word_${wid}.m4a`,
        fallbackText: wordObj.en,
        lang: "en-US"
      });
    }
    return playSequence(seq);
  }

  function speakSyllablesThenWord(wordObj, includeEcho = true) {
    if (!wordObj) return;
    const seq = [];
    (wordObj.syllables || []).forEach((s) => {
      const clean = String(s).toLowerCase().trim();
      seq.push({ type: "file", path: `assets/audio/id/syl_${clean}.mp3`, fallbackText: clean, lang: "id-ID" });
      seq.push({ type: "pause", ms: 90 });
    });
    const wid = String(wordObj.id || wordObj.word || "").toLowerCase().trim();
    seq.push({ type: "pause", ms: 120 });
    seq.push({ type: "file", path: `assets/audio/id/word_${wid}.mp3`, fallbackText: wordObj.word, lang: "id-ID" });
    if (includeEcho && wordObj.en) {
      seq.push({ type: "pause", ms: 180 });
      seq.push({
        type: "file",
        path: `assets/audio/en/word_${wid}.m4a`,
        fallbackText: wordObj.en,
        lang: "en-US"
      });
    }
    return playSequence(seq);
  }

  function speakLetter(letterOrTarget, echoOpts = {}) {
    const raw = String(letterOrTarget || "").trim();
    const ch = raw.toLowerCase();
    if (/^[a-z]$/.test(ch)) {
      return playSequence([
        { type: "file", path: `assets/audio/id/letter_${ch}.mp3`, fallbackText: ch, lang: "id-ID" }
      ]);
    }
    if (/^\d+$/.test(ch)) {
      return speakNumber(parseInt(ch, 10), {
        echoEn: Boolean(echoOpts.echoEn),
        echoJa: Boolean(echoOpts.echoJa)
      });
    }
    if (raw.length > 1 && window.INARA_DATA) {
      const wordObj = window.INARA_DATA.getWordByString(raw);
      return speakSyllablesThenWord(wordObj, Boolean(echoOpts.echoEn));
    }
  }

  const STICKER_AUDIO_MAP = {
    stk_inara: { type: "word", id: "inara" },
    stk_abi: { type: "word", id: "abi" },
    stk_umi: { type: "word", id: "umi" },
    stk_mochi: { type: "phrase", key: "praise_mochi" },
    stk_bobo: { type: "phrase", key: "praise_bobo" },
    stk_kuma: { type: "phrase", key: "praise_kuma" },
    stk_heart: { type: "word", id: "sayang" },
    stk_crown: { type: "word", id: "koki" },
    stk_roti: { type: "word", id: "roti" },
    stk_susu: { type: "word", id: "susu" },
    stk_telur: { type: "word", id: "telur" },
    stk_bubur: { type: "word", id: "bubur" },
    stk_nasgor: { type: "word", id: "nasi" },
    stk_kue: { type: "word", id: "bolu" },
    stk_eskrim: { type: "word", id: "eskrim" },
    stk_donat: { type: "word", id: "donat" },
    stk_cupcake: { type: "word", id: "stroberi" },
    stk_pancake: { type: "word", id: "madu" },
    stk_cokelat: { type: "word", id: "cokelat" },
    stk_madu: { type: "word", id: "madu" },
    stk_pizza: { type: "word", id: "pizza" },
    stk_burger: { type: "word", id: "burger" },
    stk_spaghetti: { type: "word", id: "tomat" },
    stk_sup: { type: "word", id: "wortel" },
    stk_kentang: { type: "word", id: "kentang" },
    stk_keju: { type: "word", id: "keju" },
    stk_wortel: { type: "word", id: "wortel" },
    stk_stroberi: { type: "word", id: "stroberi" },
    stk_mangga: { type: "word", id: "mangga" },
    stk_pisang: { type: "word", id: "pisang" },
    stk_apel: { type: "word", id: "apel" },
    stk_semangka: { type: "word", id: "semangka" },
    stk_jus: { type: "word", id: "jeruk" },
    stk_puding: { type: "word", id: "mangga" },
    stk_bento: { type: "word", id: "bento" },
    stk_ramen: { type: "word", id: "ramen" },
    stk_sushi: { type: "word", id: "sushi" },
    stk_onigiri: { type: "word", id: "onigiri" },
    stk_takoyaki: { type: "word", id: "takoyaki" },
    stk_udang: { type: "word", id: "udang" },
    stk_sakura: { type: "ja", key: "sugoi" },
    stk_dango: { type: "ja", key: "oishii" },
    stk_num10: { type: "num", val: 10 },
    stk_num20: { type: "num", val: 20 },
    stk_num50: { type: "num", val: 50 },
    stk_num80: { type: "num", val: 80 },
    stk_num100: { type: "num", val: 100 },
    stk_plus: { type: "phrase", key: "op_plus" },
    stk_minus: { type: "phrase", key: "op_minus" },
    stk_abc: { type: "word", id: "pintar" },
    stk_baca: { type: "word", id: "pintar" },
    stk_trace: { type: "phrase", key: "great_job" },
    stk_trophy: { type: "phrase", key: "great_job" },
    stk_rainbow: { type: "word", id: "merah" },
    stk_labrador: { type: "phrase", key: "praise_labrador" },
    stk_police_badge: { type: "phrase", key: "labrador_badge" }
  };

  function speakSticker(stkId, echoEn = true) {
    const mapped = STICKER_AUDIO_MAP[stkId];
    if (!mapped) return speakPhrase("great_job");
    if (mapped.type === "word" && window.INARA_DATA) {
      return speakWord(window.INARA_DATA.getWordById(mapped.id), echoEn);
    }
    if (mapped.type === "num") {
      return speakNumber(mapped.val, { echoEn });
    }
    if (mapped.type === "ja") {
      return speakJapanesePhrase(mapped.key);
    }
    return speakPhrase(mapped.key);
  }

  function speakPhrase(phraseKey, fallbackText = "") {
    if (phraseKey === "welcome" && hasCustomRecording("greet_inara")) {
      return playSequence([{ type: "custom", slot: "greet_inara" }]);
    }
    return playSequence([
      { type: "file", path: `assets/audio/id/${phraseKey}.mp3`, fallbackText: fallbackText || phraseKey, lang: "id-ID" }
    ]);
  }

  function speakCustomerGreeting(customerId) {
    const cust = window.INARA_DATA.CUSTOMERS.find((c) => c.id === customerId) || window.INARA_DATA.CUSTOMERS[0];
    if (customerId === "labrador") {
      playPoliceSiren();
      return playSequence([
        { type: "pause", ms: 350 },
        { type: "file", path: "assets/audio/id/greet_labrador.mp3", fallbackText: cust.greeting, lang: "id-ID" }
      ]);
    }
    const key = cust.greetKey || cust.voiceKey;
    return playSequence([
      { type: "file", path: `assets/audio/id/${key}.mp3`, fallbackText: cust.greeting, lang: "id-ID" }
    ]);
  }

  function speakCustomerPraise(customerId, isJapaneseWorld = false) {
    const cust = window.INARA_DATA.CUSTOMERS.find((c) => c.id === customerId) || window.INARA_DATA.CUSTOMERS[0];
    const seq = [];

    if (customerId === "abi" && hasCustomRecording("praise_abi")) {
      seq.push({ type: "custom", slot: "praise_abi" });
    } else if (customerId === "umi" && hasCustomRecording("praise_umi")) {
      seq.push({ type: "custom", slot: "praise_umi" });
    } else if (customerId === "labrador") {
      seq.push({
        type: "file",
        path: "assets/audio/id/praise_labrador.mp3",
        fallbackText: cust.praise,
        lang: "id-ID"
      });
      seq.push({ type: "pause", ms: 200 });
      seq.push({
        type: "file",
        path: "assets/audio/id/labrador_badge.mp3",
        fallbackText: "Ini Lencana Patroli Polisi untuk Chef Inara yang hebat!",
        lang: "id-ID"
      });
    } else {
      seq.push({
        type: "file",
        path: `assets/audio/id/${cust.voiceKey}.mp3`,
        fallbackText: cust.praise,
        lang: "id-ID"
      });
      // Sheriff Labrador Buddy Mission Accomplished & Police Badge Award
      seq.push({ type: "pause", ms: 220 });
      seq.push({
        type: "file",
        path: "assets/audio/id/praise_labrador.mp3",
        fallbackText: "Luar biasa Chef Inara! Misi memasak berhasil dengan sempurna!",
        lang: "id-ID"
      });
      seq.push({ type: "pause", ms: 200 });
      seq.push({
        type: "file",
        path: "assets/audio/id/labrador_badge.mp3",
        fallbackText: "Ini Lencana Patroli Polisi untuk Chef Inara yang hebat!",
        lang: "id-ID"
      });
    }

    if (isJapaneseWorld) {
      seq.push({ type: "pause", ms: 200 });
      seq.push({ type: "file", path: `assets/audio/ja/oishii.m4a`, fallbackText: "おいしい！", lang: "ja-JP" });
    } else {
      seq.push({ type: "pause", ms: 200 });
      seq.push({ type: "file", path: `assets/audio/en/great_job.m4a`, fallbackText: "Wonderful job, Chef Inara!", lang: "en-US" });
    }

    return playSequence(seq);
  }

  function speakJapanesePhrase(key) {
    return playSequence([
      { type: "file", path: `assets/audio/ja/${key}.m4a`, fallbackText: key, lang: "ja-JP" }
    ]);
  }

  function speakStageCut(wordObj) {
    const seq = [
      { type: "file", path: "assets/audio/id/stage_cut.mp3", fallbackText: "Tahap satu! Ketuk bahan makanan untuk memotong sambil membaca suku katanya ya, Inara!", lang: "id-ID" }
    ];
    if (wordObj) {
      seq.push({ type: "pause", ms: 220 });
      const wid = String(wordObj.id || wordObj.word || "").toLowerCase().trim();
      seq.push({ type: "file", path: `assets/audio/id/word_${wid}.mp3`, fallbackText: wordObj.word, lang: "id-ID" });
    }
    return playSequence(seq);
  }

  function speakLabradorArrival(wordObj) {
    playPoliceSiren();
    const seq = [
      { type: "pause", ms: 400 },
      { type: "file", path: "assets/audio/id/greet_labrador.mp3", fallbackText: "Halo Chef Inara! Sheriff Labrador sedang berpatroli dan ingin memesan makanan sehat!", lang: "id-ID" },
      { type: "pause", ms: 260 },
      { type: "file", path: "assets/audio/id/stage_cut.mp3", fallbackText: "Tahap satu! Ketuk bahan makanan untuk memotong ya, Inara!", lang: "id-ID" }
    ];
    if (wordObj) {
      seq.push({ type: "pause", ms: 220 });
      const wid = String(wordObj.id || wordObj.word || "").toLowerCase().trim();
      seq.push({ type: "file", path: `assets/audio/id/word_${wid}.mp3`, fallbackText: wordObj.word, lang: "id-ID" });
    }
    return playSequence(seq);
  }

  function speakStageCount(targetNumber, echoOpts = {}) {
    const num = Math.max(0, Math.min(100, Math.round(targetNumber)));
    const isTens = num > 10;
    const phraseKey = isTens ? "stage_count_tens" : "stage_count";
    const info = window.INARA_DATA.getNumberInfo(num);
    const seq = [
      { type: "file", path: `assets/audio/id/${phraseKey}.mp3`, fallbackText: "Tahap dua! Yuk kita masukkan dan hitung bahan makanannya!", lang: "id-ID" },
      { type: "pause", ms: 240 },
      { type: "file", path: `assets/audio/id/num_${num}.mp3`, fallbackText: info.id, lang: "id-ID" }
    ];
    if (echoOpts.echoEn) {
      seq.push({ type: "pause", ms: 180 });
      seq.push({ type: "file", path: `assets/audio/en/num_${num}.m4a`, fallbackText: info.en, lang: "en-US" });
    }
    if (echoOpts.echoJa) {
      seq.push({ type: "pause", ms: 180 });
      seq.push(...getJapaneseNumberItems(num));
    }
    return playSequence(seq);
  }

  function speakStageBubble(targetChar) {
    const seq = [
      { type: "file", path: "assets/audio/id/stage_bubble.mp3", fallbackText: "Tahap tiga! Ketuk gelembung yang menyala!", lang: "id-ID" }
    ];
    if (targetChar) {
      seq.push({ type: "pause", ms: 220 });
      const raw = String(targetChar).trim();
      const ch = raw.toLowerCase();
      if (/^[a-z]$/.test(ch)) {
        seq.push({ type: "file", path: `assets/audio/id/letter_${ch}.mp3`, fallbackText: raw, lang: "id-ID" });
      } else if (!isNaN(Number(raw))) {
        const num = Number(raw);
        seq.push({ type: "file", path: `assets/audio/id/num_${num}.mp3`, fallbackText: raw, lang: "id-ID" });
      }
    }
    return playSequence(seq);
  }

  function speakStageTrace(target, echoOpts = {}) {
    const seq = [
      { type: "file", path: "assets/audio/id/stage_trace.mp3", fallbackText: "Tahap empat! Ikuti bintang berkilau untuk melukis di atas saus!", lang: "id-ID" },
      { type: "pause", ms: 240 }
    ];
    const raw = String(target || "").trim();
    const ch = raw.toLowerCase();
    if (/^[a-z]$/.test(ch)) {
      seq.push({ type: "file", path: `assets/audio/id/letter_${ch}.mp3`, fallbackText: raw, lang: "id-ID" });
    } else if (!isNaN(Number(raw))) {
      const num = Math.max(0, Math.min(100, Math.round(Number(raw))));
      const info = window.INARA_DATA.getNumberInfo(num);
      seq.push({ type: "file", path: `assets/audio/id/num_${num}.mp3`, fallbackText: info.id, lang: "id-ID" });
      if (echoOpts.echoEn) {
        seq.push({ type: "pause", ms: 160 });
        seq.push({ type: "file", path: `assets/audio/en/num_${num}.m4a`, fallbackText: info.en, lang: "en-US" });
      }
      if (echoOpts.echoJa) {
        seq.push({ type: "pause", ms: 160 });
        seq.push(...getJapaneseNumberItems(num));
      }
    } else {
      const wordObj = window.INARA_DATA.getWordByString(raw) || window.INARA_DATA.getWordById(ch);
      if (wordObj) {
        const wid = String(wordObj.id || wordObj.word || "").toLowerCase().trim();
        seq.push({ type: "file", path: `assets/audio/id/word_${wid}.mp3`, fallbackText: wordObj.word, lang: "id-ID" });
      }
    }
    return playSequence(seq);
  }

  function setMuted(val) {
    isMuted = Boolean(val);
    if (isMuted) stopSpeech();
    return isMuted;
  }

  function getMuted() {
    return isMuted;
  }

  return {
    initVoiceDB,
    saveCustomRecording,
    deleteCustomRecording,
    hasCustomRecording,
    playTap,
    playChop,
    playPop,
    playBasketDrop,
    playMochiBite,
    playSparkle,
    playGentleHint,
    playFanfare,
    playPoliceSiren,
    playSleepyLullaby,
    toggleBgm,
    stopSpeech,
    playSequence,
    getLastSequence,
    speakNumber,
    speakMathEquation,
    speakSyllable,
    speakWord,
    speakSyllablesThenWord,
    speakLetter,
    speakSticker,
    speakPhrase,
    speakCustomerGreeting,
    speakCustomerPraise,
    speakStageCut,
    speakLabradorArrival,
    speakStageCount,
    speakStageBubble,
    speakStageTrace,
    speakJapanesePhrase,
    setMuted,
    getMuted
  };
})();
