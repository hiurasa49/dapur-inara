/**
 * Dapur Ceria Inara — Main Interactive Educational Game Application
 * Built for Inara (4 years 2 months) on her Android Tablet
 */

window.INARA_APP = (function () {
  const STORAGE_KEY = "inara_game_state_v1";
  const DATA = window.INARA_DATA;
  const SVG = window.INARA_SVG;
  const AUDIO = window.INARA_AUDIO;

  // Default persistent game state
  function getDefaultState() {
    return {
      stars: 0,
      unlockedStickers: ["stk_inara", "stk_abi", "stk_umi", "stk_mochi"],
      placedStickers: [
        { uid: 1, id: "stk_inara", x: 22, y: 55 },
        { uid: 2, id: "stk_abi", x: 50, y: 52 },
        { uid: 3, id: "stk_umi", x: 76, y: 55 }
      ],
      wardrobe: {
        hatColor: "white",
        apronColor: "pink",
        accessory: "star"
      },
      completedMenus: {},
      mastery: {
        numbers: {},
        letters: {},
        words: {},
        mathAddCorrect: 0,
        mathSubCorrect: 0,
        totalDishes: 0
      },
      customWords: [],
      settings: {
        unlockAllWorlds: false,
        numberFocus: "auto", // 'auto' | '1-10' | '11-20' | '21-50' | '51-100'
        mathFocus: "auto",   // 'auto' | 'always_mix' | 'only_add' | 'only_sub' | 'off'
        langMode: "bilingual", // 'bilingual' | 'trilingual' | 'id_only'
        sleepTimerMode: "unlimited" // 'unlimited' | '15m' | '20m' | '30m' | '3_recipes'
      }
    };
  }

  let state = loadState();
  let currentView = "map"; // 'map' | 'world_menus' | 'cooking' | 'numbers100' | 'mathlab' | 'syllables' | 'tracing' | 'stickers'
  let selectedWorldLevel = 1;
  let activeOrder = null;

  // Station sub-states
  let station100State = {
    selectedNum: 1,
    filter: "all", // 'all' | '1-20' | '21-50' | '51-80' | '81-100' | 'tens'
    quizTarget: null,
    quizScore: 0
  };

  let mathLabState = {
    mode: "easy_add", // 'easy_add' | 'easy_sub' | 'medium_mix' | 'master_mix'
    problem: null,
    streak: 0,
    answered: false,
    countedIndices: []
  };

  let syllableStationState = {
    category: "keluarga", // 'keluarga' | 'sarapan' | 'kue' | 'sayur' | 'buah' | 'jepang' | 'angka_warna' | 'az'
    selectedWordId: "inara",
    selectedLetter: "A",
    activeSyllableIdx: -1
  };

  let tracingStationState = {
    mode: "letters", // 'letters' | 'numbers' | 'words'
    target: "I",
    sauceColor: "#FF5D8F",
    sauceName: "Saus Stroberi",
    progressIdx: 0
  };

  let stickerStationState = {
    tab: "wardrobe", // 'wardrobe' | 'stickers'
    selectedCategory: "Keluarga"
  };

  // Parent gate & recorder state
  let parentModalOpen = false;
  let parentUnlocked = false;
  let parentGateQuestion = { a: 4, b: 3, ans: 12, options: [9, 12, 15, 16] };
  let activeRecorder = null;
  let activeRecordingSlot = null;
  let recordingChunks = [];

  // Screen-time gentle gate ("Dapur Mengantuk")
  let sessionStartTime = Date.now();
  let sessionRecipesCooked = 0;
  let isSleepyKitchenActive = false;
  let deferredInstallPrompt = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const def = getDefaultState();
        DATA.registerCustomWords(def.customWords);
        return def;
      }
      const parsed = JSON.parse(raw);
      const def = getDefaultState();
      const merged = {
        ...def,
        ...parsed,
        wardrobe: { ...def.wardrobe, ...(parsed.wardrobe || {}) },
        mastery: { ...def.mastery, ...(parsed.mastery || {}) },
        settings: { ...def.settings, ...(parsed.settings || {}) },
        customWords: Array.isArray(parsed.customWords) ? parsed.customWords : []
      };
      DATA.registerCustomWords(merged.customWords);
      return merged;
    } catch (e) {
      const def = getDefaultState();
      DATA.registerCustomWords(def.customWords);
      return def;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function getAllWords() {
    return [...state.customWords, ...DATA.WORDS_DB];
  }

  function getChefRank() {
    let current = DATA.CHEF_RANKS[0];
    for (const r of DATA.CHEF_RANKS) {
      if (state.stars >= r.minStars) current = r;
    }
    return current;
  }

  function isWorldUnlocked(worldObj) {
    if (state.settings.unlockAllWorlds) return true;
    return state.stars >= worldObj.unlockStars;
  }

  function getEchoOpts(isJapaneseContext = false) {
    const mode = state.settings.langMode;
    return {
      echoEn: mode === "bilingual" || mode === "trilingual",
      echoJa: mode === "trilingual" || isJapaneseContext
    };
  }

  // =========================================================================
  // SLEEPY KITCHEN TIMER CHECK ("DAPUR MENGANTUK")
  // =========================================================================
  function checkSleepyKitchenCondition() {
    const mode = state.settings.sleepTimerMode;
    if (mode === "unlimited") return false;
    if (mode === "3_recipes" && sessionRecipesCooked >= 3) return true;
    const elapsedMinutes = (Date.now() - sessionStartTime) / 60000;
    if (mode === "15m" && elapsedMinutes >= 15) return true;
    if (mode === "20m" && elapsedMinutes >= 20) return true;
    if (mode === "30m" && elapsedMinutes >= 30) return true;
    return false;
  }

  function triggerSleepyKitchen() {
    isSleepyKitchenActive = true;
    AUDIO.playSleepyLullaby();
    setTimeout(() => {
      AUDIO.speakPhrase(
        "sleepy_kitchen",
        "Wah, dapurnya sudah mengantuk, Inara sayang. Besok kita masak lagi ya bersama Abi dan Umi!"
      );
    }, 800);
    render();
  }

  // =========================================================================
  // INFINITE PROCEDURAL ORDER GENERATOR
  // =========================================================================
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateTargetNumberForOrder(worldObj) {
    const focus = state.settings.numberFocus;
    let min = worldObj.numberRange[0];
    let max = worldObj.numberRange[1];

    if (focus === "1-10") {
      min = 1;
      max = 10;
    } else if (focus === "11-20") {
      min = 11;
      max = 20;
    } else if (focus === "21-50") {
      min = 21;
      max = 50;
    } else if (focus === "51-100") {
      min = 51;
      max = 100;
    }

    // In Level 5, give a special chance for 100 (Seratus!) so Inara gets to celebrate 100
    if (max === 100 && Math.random() < 0.28) {
      return 100;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function shouldIncludeMathStage(worldObj) {
    const mf = state.settings.mathFocus;
    if (mf === "off") return false;
    if (mf === "always_mix" || mf === "only_add" || mf === "only_sub") return true;
    return Boolean(worldObj.hasMathOps);
  }

  function createMathProblemForOrder(worldObj, ingredientObj) {
    const mf = state.settings.mathFocus;
    const lv = worldObj.level >= 2 ? worldObj.level : 2;
    if (mf === "only_add") {
      return DATA.generateMathProblem(lv, ingredientObj, "+");
    }
    if (mf === "only_sub") {
      return DATA.generateMathProblem(lv, ingredientObj, "-");
    }
    return DATA.generateMathProblem(lv, ingredientObj);
  }

  function buildNumberSequenceForWorld(worldObj, targetNumber) {
    if (worldObj.level >= 3 && targetNumber >= 30 && targetNumber % 10 === 0) {
      return [String(targetNumber - 20), String(targetNumber - 10), String(targetNumber)];
    }
    const base = Math.max(1, Math.min(97, targetNumber - 2));
    return [String(base), String(base + 1), String(base + 2), String(base + 3)];
  }

  function startCookingOrder(worldLevel, menuId = null) {
    const worldObj = DATA.WORLDS.find((w) => w.level === worldLevel) || DATA.WORLDS[0];
    const menuObj = menuId
      ? worldObj.menus.find((m) => m.id === menuId) || pickRandom(worldObj.menus)
      : pickRandom(worldObj.menus);

    // Pick customer (rotate between Abi, Umi, Mochi, Bobo, Kuma)
    const customerObj = pickRandom(DATA.CUSTOMERS);

    // Pick 2 syllable words for Stage 1 (Cutting Board):
    // Word 1: Main ingredient from the dish
    const allWords = getAllWords();
    const ingWord1 =
      allWords.find((w) => w.id === menuObj.ingredients[0]) ||
      DATA.getWordById(pickRandom(menuObj.ingredients));

    // Word 2: Another dish ingredient OR a special family/custom word (INARA, ABI, UMI, SAYANG)
    const familyWords = allWords.filter((w) => w.category === "keluarga");
    const secondPool = [
      ...menuObj.ingredients.slice(1).map((id) => DATA.getWordById(id)),
      ...familyWords
    ].filter((w) => w && w.id !== ingWord1.id);
    const ingWord2 = secondPool.length > 0 ? pickRandom(secondPool) : familyWords[0];

    // Stage 2A: Target Number (1 - 100)
    const targetNumber = generateTargetNumberForOrder(worldObj);
    const numInfo = DATA.getNumberInfo(targetNumber);
    const countIngredient = DATA.getWordById(pickRandom(menuObj.ingredients));

    // Stage 2B: Visual Addition (+) or Mochi Subtraction (-)
    const includeMath = shouldIncludeMathStage(worldObj);
    const mathProblem = includeMath ? createMathProblemForOrder(worldObj, countIngredient) : null;

    // Stage 3: Bubble Spelling Word (and optional Number Sequence)
    const spellTarget = pickRandom(menuObj.spellPool || ["INARA", "ABI", "UMI"]);
    const numSeqItems = buildNumberSequenceForWorld(worldObj, targetNumber);

    // Stage 4: Tracing Target (Alternate between the number, first letter, and INARA/ABI/UMI)
    const traceCandidates = [
      String(targetNumber),
      spellTarget[0],
      customerObj.id === "abi" ? "ABI" : customerObj.id === "umi" ? "UMI" : "INARA"
    ];
    const traceTarget = pickRandom(traceCandidates);

    activeOrder = {
      uid: Date.now() + "_" + Math.random(),
      world: worldObj,
      menu: menuObj,
      customer: customerObj,
      stageIndex: 0, // 0: cut, 1: count, 2: math (if enabled), 3: bubble, 4: trace, 5: reward
      includeMath,
      // Stage 1 state
      cutWords: [ingWord1, ingWord2],
      currentCutWordIdx: 0,
      slicesDone: 0,
      // Stage 2A state (Counting 1-100)
      targetNumber,
      numInfo,
      countIngredient,
      currentTens: 0,
      currentUnits: 0,
      ovenDialSet: !worldObj.hasOvenDial,
      countCompleted: false,
      // Stage 2B state (Visual +/- Math)
      mathProblem,
      mathAddedCount: 0, // for '+' interactive feeding
      mathMochiBit: false, // for '-' Mochi animation
      mathSolved: false,
      mathCountedTokens: [],
      // Stage 3 state (Bubble Spelling & Number Sequence)
      bubbleMode: "word", // 'word' | 'numseq'
      spellWord: spellTarget,
      baseSpellWord: spellTarget,
      numSeqItems,
      spellIndex: 0,
      bubbleOptions: [],
      bubbleCompleted: false,
      // Stage 4 state (Tracing)
      traceTarget,
      traceCheckpoints: DATA.getTracingPointsForTarget(traceTarget),
      traceProgressIdx: 0,
      traceCompleted: false,
      sauceColor: "#FF5D8F",
      // Stage 5 state (Reward & Feeding)
      bitesTaken: 0,
      totalBites: 3,
      unlockedSticker: null
    };

    prepareBubbleOptions();
    currentView = "cooking";
    render();
    announceCurrentStage();
  }

  function prepareBubbleOptions() {
    if (!activeOrder) return;
    if (activeOrder.bubbleMode === "numseq") {
      const targetItem = activeOrder.numSeqItems[activeOrder.spellIndex] || "1";
      const targetNum = parseInt(targetItem, 10) || 1;
      const decoys = [];
      const offsets = [1, -1, 2, -2, 10, -10, 3, 5];
      for (const off of offsets) {
        if (decoys.length >= 4) break;
        const cand = Math.max(1, Math.min(100, targetNum + off));
        const candStr = String(cand);
        if (candStr !== targetItem && !decoys.includes(candStr)) {
          decoys.push(candStr);
        }
      }
      const pool = [targetItem, ...decoys];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      activeOrder.bubbleOptions = pool;
      return;
    }

    const targetChar = activeOrder.spellWord[activeOrder.spellIndex] || "A";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const decoys = [];
    while (decoys.length < 4) {
      const ch = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (ch !== targetChar && !decoys.includes(ch)) decoys.push(ch);
    }
    const pool = [targetChar, ...decoys];
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    activeOrder.bubbleOptions = pool;
  }

  function announceCurrentStage() {
    if (!activeOrder) return;
    const orderUid = activeOrder.uid;
    const s = activeOrder.stageIndex;
    if (s === 0) {
      const w = activeOrder.cutWords[activeOrder.currentCutWordIdx];
      if (activeOrder.customer.id === "labrador" && activeOrder.currentCutWordIdx === 0 && !activeOrder.labradorGreeted) {
        activeOrder.labradorGreeted = true;
        AUDIO.speakCustomerGreeting("labrador");
      } else {
        AUDIO.speakPhrase("stage_cut");
        if (w) {
          AUDIO.speakWord(w, false);
        }
      }
    } else if (s === 1) {
      if (activeOrder.targetNumber > 10) {
        AUDIO.speakPhrase("stage_count_tens");
      } else {
        AUDIO.speakPhrase("stage_count");
      }
      AUDIO.speakNumber(activeOrder.targetNumber, getEchoOpts(activeOrder.world.isJapaneseWorld));
    } else if (s === 2) {
      const mp = activeOrder.mathProblem;
      if (mp.op === "+") {
        AUDIO.speakPhrase("stage_math_add");
      } else {
        AUDIO.playMochiBite();
        AUDIO.speakPhrase("stage_math_sub");
      }
    } else if (s === 3) {
      AUDIO.speakPhrase("stage_bubble");
      const targetChar =
        activeOrder.bubbleMode === "numseq"
          ? activeOrder.numSeqItems[activeOrder.spellIndex]
          : activeOrder.spellWord[activeOrder.spellIndex];
      if (targetChar) AUDIO.speakLetter(targetChar);
    } else if (s === 4) {
      AUDIO.speakPhrase("stage_trace");
      AUDIO.speakLetter(activeOrder.traceTarget, getEchoOpts(activeOrder.world.isJapaneseWorld));
    } else if (s === 5) {
      AUDIO.playFanfare();
      if (activeOrder.customer.id === "labrador") {
        AUDIO.speakCustomerPraise("labrador");
      } else {
        AUDIO.speakPhrase("stage_eat");
      }
    }
  }

  function advanceCookingStage() {
    if (!activeOrder) return;
    AUDIO.playFanfare();

    if (activeOrder.stageIndex === 0) {
      activeOrder.stageIndex = 1;
    } else if (activeOrder.stageIndex === 1) {
      activeOrder.stageIndex = activeOrder.includeMath ? 2 : 3;
      if (activeOrder.stageIndex === 2 && activeOrder.mathProblem.op === "-") {
        activeOrder.mathMochiBit = true;
      }
    } else if (activeOrder.stageIndex === 2) {
      activeOrder.stageIndex = 3;
    } else if (activeOrder.stageIndex === 3) {
      activeOrder.stageIndex = 4;
    } else if (activeOrder.stageIndex === 4) {
      // Recipe finished! Award stars & unlock a new sticker
      completeRecipeReward();
      activeOrder.stageIndex = 5;
    }

    render();
    announceCurrentStage();
  }

  function completeRecipeReward() {
    state.stars += 3;
    state.mastery.totalDishes = (state.mastery.totalDishes || 0) + 1;
    state.completedMenus[activeOrder.menu.id] = (state.completedMenus[activeOrder.menu.id] || 0) + 1;
    state.mastery.numbers[activeOrder.targetNumber] = (state.mastery.numbers[activeOrder.targetNumber] || 0) + 1;
    sessionRecipesCooked++;

    if (activeOrder.customer.id === "labrador") {
      if (!state.unlockedStickers.includes("stk_police_badge")) {
        state.unlockedStickers.push("stk_police_badge");
      }
      if (!state.unlockedStickers.includes("stk_labrador")) {
        state.unlockedStickers.push("stk_labrador");
      }
      activeOrder.unlockedSticker = DATA.STICKERS.find((s) => s.id === "stk_police_badge") || DATA.STICKERS.find((s) => s.id === "stk_labrador");
      activeOrder.awardedPoliceBadge = true;
    } else {
      // Unlock a new sticker if any remain locked
      const lockedStickers = DATA.STICKERS.filter((s) => !state.unlockedStickers.includes(s.id));
      if (lockedStickers.length > 0) {
        const newlyUnlocked = lockedStickers[0];
        state.unlockedStickers.push(newlyUnlocked.id);
        activeOrder.unlockedSticker = newlyUnlocked;
      } else {
        activeOrder.unlockedSticker = pickRandom(DATA.STICKERS);
      }
    }

    saveState();
  }

  // =========================================================================
  // STAGE 1 HANDLERS: POTONG SUKU KATA (BA-CA)
  // =========================================================================
  function handleSliceIngredient() {
    if (!activeOrder || activeOrder.stageIndex !== 0) return;
    const orderUid = activeOrder.uid;
    const wordObj = activeOrder.cutWords[activeOrder.currentCutWordIdx];
    const totalSyls = wordObj.syllables.length;

    if (activeOrder.slicesDone < totalSyls) {
      const syl = wordObj.syllables[activeOrder.slicesDone];
      activeOrder.slicesDone++;
      AUDIO.playChop();
      render();

      if (activeOrder.slicesDone < totalSyls) {
        AUDIO.speakSyllable(syl);
      } else {
        // Last syllable sliced! Speak syllable then full word + English echo
        state.mastery.words[wordObj.word] = (state.mastery.words[wordObj.word] || 0) + 1;
        saveState();
        AUDIO.speakSyllablesThenWord(wordObj, getEchoOpts().echoEn);

        setTimeout(() => {
          if (!activeOrder || activeOrder.uid !== orderUid || activeOrder.stageIndex !== 0) return;
          if (activeOrder.currentCutWordIdx + 1 < activeOrder.cutWords.length) {
            activeOrder.currentCutWordIdx++;
            activeOrder.slicesDone = 0;
            render();
            const nextW = activeOrder.cutWords[activeOrder.currentCutWordIdx];
            AUDIO.speakWord(nextW, false);
          } else {
            advanceCookingStage();
          }
        }, 1700);
      }
    }
  }

  // =========================================================================
  // STAGE 2A HANDLERS: TAKAR ANGKA (1-100) VIA PULUHAN (10) & SATUAN (1)
  // =========================================================================
  function handleAddTensBasket() {
    if (!activeOrder || activeOrder.stageIndex !== 1 || activeOrder.countCompleted) return;
    const targetTens = activeOrder.numInfo.tensCount;
    if (activeOrder.currentTens < targetTens) {
      activeOrder.currentTens++;
      AUDIO.playBasketDrop();
      const currentTotal = activeOrder.currentTens * 10 + activeOrder.currentUnits;
      if (currentTotal === activeOrder.targetNumber) activeOrder.ovenDialSet = true;
      render();
      checkCountingCompletionOrSpeak(currentTotal);
    } else {
      AUDIO.playGentleHint();
    }
  }

  function handleAddUnitItem() {
    if (!activeOrder || activeOrder.stageIndex !== 1 || activeOrder.countCompleted) return;
    const isSingleMode = activeOrder.targetNumber <= 10;
    const maxUnits = isSingleMode ? activeOrder.targetNumber : activeOrder.numInfo.unitsCount;

    if (activeOrder.currentUnits < maxUnits) {
      activeOrder.currentUnits++;
      AUDIO.playPop();
      const currentTotal = isSingleMode
        ? activeOrder.currentUnits
        : activeOrder.currentTens * 10 + activeOrder.currentUnits;
      if (currentTotal === activeOrder.targetNumber) activeOrder.ovenDialSet = true;
      render();
      checkCountingCompletionOrSpeak(currentTotal);
    } else {
      AUDIO.playGentleHint();
    }
  }

  function setOvenDialValue(val) {
    if (!activeOrder || activeOrder.stageIndex !== 1 || activeOrder.countCompleted) return;
    const clamped = Math.max(0, Math.min(activeOrder.targetNumber, parseInt(val, 10) || 0));
    const isSingleMode = activeOrder.targetNumber <= 10;
    if (isSingleMode) {
      activeOrder.currentTens = 0;
      activeOrder.currentUnits = clamped;
    } else {
      const targetInfo = activeOrder.numInfo;
      activeOrder.currentTens = Math.min(targetInfo.tensCount, Math.floor(clamped / 10));
      activeOrder.currentUnits = Math.min(targetInfo.unitsCount, clamped % 10);
    }
    const currentTotal = isSingleMode
      ? activeOrder.currentUnits
      : activeOrder.currentTens * 10 + activeOrder.currentUnits;
    if (currentTotal === activeOrder.targetNumber) {
      activeOrder.ovenDialSet = true;
    }
    AUDIO.playTap();
    render();
    checkCountingCompletionOrSpeak(currentTotal);
  }

  function checkCountingCompletionOrSpeak(currentTotal) {
    if (!activeOrder || activeOrder.countCompleted) return;
    const orderUid = activeOrder.uid;
    const isSingleMode = activeOrder.targetNumber <= 10;
    const done = currentTotal === activeOrder.targetNumber;

    if (done) {
      activeOrder.countCompleted = true;
      activeOrder.ovenDialSet = true;
      if (activeOrder.targetNumber === 100) {
        AUDIO.speakPhrase("hundred_party");
      } else {
        AUDIO.speakNumber(currentTotal, getEchoOpts(activeOrder.world.isJapaneseWorld));
      }
      setTimeout(() => {
        if (activeOrder && activeOrder.uid === orderUid && activeOrder.stageIndex === 1) {
          advanceCookingStage();
        }
      }, 1850);
    } else {
      // Speak current running count in Indonesian
      AUDIO.speakNumber(currentTotal, {
        echoEn: false,
        echoJa: isSingleMode && activeOrder.world.isJapaneseWorld
      });
    }
  }

  // =========================================================================
  // STAGE 2B HANDLERS: MASAK TAMBAH (+) & CICIP KURANG MOCHI (-)
  // =========================================================================
  function handleMathTokenTap(idx, displayNum) {
    AUDIO.playPop();
    AUDIO.speakNumber(displayNum, { echoEn: false });
  }

  function handleFeedAddedMathItem() {
    if (!activeOrder || activeOrder.stageIndex !== 2) return;
    const mp = activeOrder.mathProblem;
    if (mp.op === "+" && activeOrder.mathAddedCount < mp.b) {
      activeOrder.mathAddedCount++;
      AUDIO.playPop();
      const totalNow = mp.a + activeOrder.mathAddedCount;
      AUDIO.speakNumber(totalNow, { echoEn: false });
      render();
    }
  }

  function handleMathAnswerChoice(chosenVal) {
    if (!activeOrder || activeOrder.stageIndex !== 2 || activeOrder.mathSolved) return;
    const orderUid = activeOrder.uid;
    const mp = activeOrder.mathProblem;

    if (chosenVal === mp.answer) {
      activeOrder.mathSolved = true;
      if (mp.op === "+") {
        state.mastery.mathAddCorrect = (state.mastery.mathAddCorrect || 0) + 1;
      } else {
        state.mastery.mathSubCorrect = (state.mastery.mathSubCorrect || 0) + 1;
      }
      saveState();
      AUDIO.playFanfare();
      AUDIO.speakMathEquation(mp.a, mp.op, mp.b, mp.answer, getEchoOpts().echoEn);
      render();

      setTimeout(() => {
        if (activeOrder && activeOrder.uid === orderUid && activeOrder.stageIndex === 2) {
          advanceCookingStage();
        }
      }, 3100);
    } else {
      AUDIO.playGentleHint();
      AUDIO.speakPhrase("try_again");
    }
  }

  // =========================================================================
  // STAGE 3 HANDLERS: GELEMBUNG BUMBU HURUF (A-Z SPELLING & NUMBER SEQUENCE)
  // =========================================================================
  function toggleBubbleMode() {
    if (!activeOrder || activeOrder.stageIndex !== 3 || activeOrder.bubbleCompleted) return;
    AUDIO.playTap();
    activeOrder.bubbleMode = activeOrder.bubbleMode === "word" ? "numseq" : "word";
    activeOrder.spellIndex = 0;
    prepareBubbleOptions();
    render();
    const targetItem =
      activeOrder.bubbleMode === "numseq"
        ? activeOrder.numSeqItems[0]
        : activeOrder.spellWord[0];
    if (targetItem) AUDIO.speakLetter(targetItem, getEchoOpts(activeOrder.world.isJapaneseWorld));
  }

  function handleBubbleTap(charTapped) {
    if (!activeOrder || activeOrder.stageIndex !== 3 || activeOrder.bubbleCompleted) return;
    const orderUid = activeOrder.uid;
    const isNumSeq = activeOrder.bubbleMode === "numseq";
    const items = isNumSeq ? activeOrder.numSeqItems : activeOrder.spellWord;
    const targetChar = items[activeOrder.spellIndex];

    if (String(charTapped) === String(targetChar)) {
      AUDIO.playPop();
      AUDIO.speakLetter(charTapped, getEchoOpts(activeOrder.world.isJapaneseWorld));
      if (!isNumSeq) {
        state.mastery.letters[charTapped] = (state.mastery.letters[charTapped] || 0) + 1;
      } else {
        state.mastery.numbers[charTapped] = (state.mastery.numbers[charTapped] || 0) + 1;
      }
      activeOrder.spellIndex++;

      if (activeOrder.spellIndex >= items.length) {
        activeOrder.bubbleCompleted = true;
        saveState();
        render();
        if (!isNumSeq) {
          const wordObj = DATA.getWordByString(activeOrder.spellWord);
          setTimeout(() => {
            if (activeOrder && activeOrder.uid === orderUid) {
              AUDIO.speakWord(wordObj, getEchoOpts().echoEn);
            }
          }, 550);
        }
        setTimeout(() => {
          if (activeOrder && activeOrder.uid === orderUid && activeOrder.stageIndex === 3) {
            advanceCookingStage();
          }
        }, 2000);
      } else {
        prepareBubbleOptions();
        render();
      }
    } else {
      AUDIO.playGentleHint();
      AUDIO.speakLetter(targetChar);
    }
  }

  // =========================================================================
  // STAGE 4 & STATION 4: INTERACTIVE CANVAS TRACING ENGINE
  // =========================================================================
  function initTracingCanvas(canvasId, checkpoints, sauceColor, onCompleteCallback, initialProgress = 0, onProgressChange = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 540;
    canvas.height = rect.height || 265;

    let progressIdx = Math.max(0, Math.min(checkpoints ? checkpoints.length : 0, initialProgress || 0));
    let activePointerId = null;
    const sparkles = [];

    function toPx(pt) {
      return {
        x: (pt.x / 100) * canvas.width,
        y: (pt.y / 100) * canvas.height
      };
    }

    function drawScene() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle flour dust dots
      ctx.fillStyle = "rgba(245, 158, 11, 0.10)";
      for (let i = 0; i < 18; i++) {
        const fx = ((i * 73) % 90 + 5) * (canvas.width / 100);
        const fy = ((i * 41) % 80 + 10) * (canvas.height / 100);
        ctx.beginPath();
        ctx.arc(fx, fy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!checkpoints || checkpoints.length === 0) return;

      // 1. Dashed guide path
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
      checkpoints.forEach((pt, idx) => {
        const p = toPx(pt);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();

      // 2. Drawn sauce path up to progressIdx
      if (progressIdx > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 24;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = sauceColor || "#FF5D8F";
        for (let i = 0; i < progressIdx && i < checkpoints.length; i++) {
          const p = toPx(checkpoints[i]);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Star Checkpoints
      checkpoints.forEach((pt, idx) => {
        const p = toPx(pt);
        const isDone = idx < progressIdx;
        const isCurrent = idx === progressIdx;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, isCurrent ? 22 : 16, 0, Math.PI * 2);
        ctx.fillStyle = isDone ? "#10B981" : isCurrent ? "#FBBF24" : "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = isDone ? "#047857" : isCurrent ? "#D97706" : "#94A3B8";
        ctx.stroke();

        ctx.fillStyle = isDone ? "#FFFFFF" : "#3B232E";
        ctx.font = "900 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isDone ? "✓" : String(idx + 1), p.x, p.y);
        ctx.restore();
      });

      // 4. Sparkles
      sparkles.forEach((sp) => {
        ctx.save();
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function checkPointerAt(clientX, clientY) {
      if (progressIdx >= checkpoints.length) return;
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;

      const targetPt = toPx(checkpoints[progressIdx]);
      const dist = Math.hypot(x - targetPt.x, y - targetPt.y);

      // Generous 56px magnetic snap radius for a 4-year-old's finger!
      if (dist <= 56) {
        AUDIO.playSparkle(progressIdx);
        sparkles.push({
          x: targetPt.x + (Math.random() * 16 - 8),
          y: targetPt.y + (Math.random() * 16 - 8),
          r: 6,
          color: ["#FFD166", "#FF6F91", "#2EC4B6", "#A78BFA"][progressIdx % 4]
        });
        progressIdx++;
        if (onProgressChange) onProgressChange(progressIdx);
        drawScene();

        if (progressIdx >= checkpoints.length) {
          onCompleteCallback();
        }
      }
    }

    canvas.onpointerdown = (e) => {
      // Lock onto primary tracing finger; ignore secondary palm touches
      if (activePointerId === null) {
        activePointerId = e.pointerId !== undefined ? e.pointerId : "mouse";
        if (canvas.setPointerCapture && e.pointerId !== undefined) {
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (err) {}
        }
      }
      if (e.pointerId === undefined || e.pointerId === activePointerId) {
        checkPointerAt(e.clientX, e.clientY);
      }
    };
    canvas.onpointermove = (e) => {
      if (activePointerId === null) return;
      if (e.pointerId !== undefined && e.pointerId !== activePointerId) return;
      checkPointerAt(e.clientX, e.clientY);
    };
    const releasePointer = (e) => {
      if (e && e.pointerId !== undefined && e.pointerId !== activePointerId) return;
      activePointerId = null;
    };
    canvas.onpointerup = releasePointer;
    canvas.onpointercancel = releasePointer;

    drawScene();
  }

  function handleAutoMagicTrace(isCookingStage = true) {
    AUDIO.playSparkle(2);
    if (isCookingStage && activeOrder && activeOrder.stageIndex === 4) {
      if (activeOrder.traceCompleted) return;
      activeOrder.traceCompleted = true;
      activeOrder.traceProgressIdx = activeOrder.traceCheckpoints.length;
      const orderUid = activeOrder.uid;
      render();
      AUDIO.speakLetter(activeOrder.traceTarget, getEchoOpts(activeOrder.world.isJapaneseWorld));
      setTimeout(() => {
        if (activeOrder && activeOrder.uid === orderUid && activeOrder.stageIndex === 4) {
          advanceCookingStage();
        }
      }, 900);
    } else if (!isCookingStage) {
      AUDIO.playFanfare();
      tracingStationState.progressIdx = DATA.getTracingPointsForTarget(tracingStationState.target).length;
      AUDIO.speakLetter(tracingStationState.target, getEchoOpts());
      state.stars += 1;
      saveState();
      render();
    }
  }

  // =========================================================================
  // STAGE 5 HANDLERS: MAKAN BERSAMA & PUJIAN SUARA ASLI ABI/UMI
  // =========================================================================
  function handleFeedCustomerBite() {
    if (!activeOrder || activeOrder.stageIndex !== 5) return;
    if (activeOrder.bitesTaken < activeOrder.totalBites) {
      activeOrder.bitesTaken++;
      AUDIO.playMochiBite();

      if (activeOrder.bitesTaken === 1 && activeOrder.world.isJapaneseWorld) {
        AUDIO.speakJapanesePhrase("itadakimasu");
      }

      if (activeOrder.bitesTaken >= activeOrder.totalBites) {
        setTimeout(() => {
          AUDIO.playFanfare();
          AUDIO.speakCustomerPraise(activeOrder.customer.id, activeOrder.world.isJapaneseWorld);
        }, 350);
      }
      render();
    }
  }

  // =========================================================================
  // RENDERING VIEWS
  // =========================================================================
  function renderTopBar() {
    const rank = getChefRank();
    const langLabel =
      state.settings.langMode === "trilingual"
        ? "🇮🇩🇬🇧🇯🇵 3 Bahasa"
        : state.settings.langMode === "bilingual"
        ? "🇮🇩🇬🇧 Bilingual"
        : "🇮🇩 Indonesia";

    return `
      <header class="top-bar">
        <div class="brand-cluster">
          <button class="btn-home-pill" onclick="INARA_APP.navigate('map')" aria-label="Peta Kedai">
            <span>🗺️</span>
            <span>Peta Kedai</span>
          </button>
          <div class="chef-profile-pill" onclick="INARA_APP.navigate('stickers')" title="Ganti Kostum Chef Inara">
            <div class="mini-avatar">
              ${SVG.renderChefInara(state.wardrobe, "happy", 46)}
            </div>
            <div class="chef-rank-text">
              <span class="chef-rank-title">${rank.badge} ${rank.title}</span>
              <span class="chef-rank-sub">Ketuk untuk Kostum & Stiker</span>
            </div>
          </div>
        </div>

        <div class="top-stats-cluster">
          ${
             deferredInstallPrompt
              ? `<button class="icon-action-btn" style="background:#DCFCE7;border-color:#10B981;color:#065F46;" onclick="INARA_APP.installPWA()">📲 Pasang App</button>`
              : ""
          }
          <div class="star-counter-pill" title="Total Bintang Inara">
            <span>⭐</span>
            <span>${state.stars}</span>
          </div>
          <button class="lang-toggle-btn" onclick="INARA_APP.cycleLangMode()" title="Mode Bahasa">
            ${langLabel}
          </button>
          <button class="icon-action-btn" onclick="INARA_APP.toggleMusic()" title="Musik Dapur">
            🎵
          </button>
          <button class="icon-action-btn parent-corner-btn" onclick="INARA_APP.openParentGate()">
            🔒 Pojok Abi & Umi
          </button>
        </div>
      </header>
    `;
  }

  function renderBottomDock() {
    const stations = [
      { id: "map", emoji: "🗺️", label: "5 Kedai\nMasakan" },
      { id: "numbers100", emoji: "🔢", label: "Papan Angka\n1 – 100" },
      { id: "mathlab", emoji: "➕➖", label: "Mesin Hitung\nTambah Kurang" },
      { id: "syllables", emoji: "🔤", label: "Kartu Baca\nBA-CA & A-Z" },
      { id: "tracing", emoji: "✍️", label: "Lukis Saus\nHuruf & Angka" },
      { id: "stickers", emoji: "⭐", label: "Buku Stiker\n& Kostum" }
    ];

    return `
      <nav class="bottom-dock" aria-label="Stasiun Belajar Inara">
        ${stations
          .map(
            (st) => `
          <button class="dock-btn ${currentView === st.id ? "active" : ""}" onclick="INARA_APP.navigate('${st.id}')">
            <span class="dock-emoji">${st.emoji}</span>
            <span class="dock-label">${st.label.replace("\n", "<br/>")}</span>
          </button>
        `
          )
          .join("")}
      </nav>
    `;
  }

  // -------------------------------------------------------------------------
  // VIEW 1: PETA PETUALANGAN 5 KEDAI MASAKAN (LOBBY)
  // -------------------------------------------------------------------------
  function renderMapLobby() {
    return `
      <div class="lobby-container">
        <div class="lobby-hero-banner">
          <div class="hero-left">
            <div onclick="INARA_AUDIO.speakPhrase('welcome')" style="cursor:pointer;">
              ${SVG.renderChefInara(state.wardrobe, "cheering", 108)}
            </div>
            <div class="speech-bubble-hero">
              <h1>Halo Koki Cilik Inara! 🌟</h1>
              <p>Pilih salah satu dari <strong>5 Kedai Masakan (25 Menu)</strong> di bawah, atau tekan tombol hijau untuk langsung memasak bersama Abi & Umi!</p>
            </div>
          </div>
          <div class="hero-actions">
            <button class="btn-jumbo-cta" onclick="INARA_APP.quickPlaySurprise()">
              <span>🍳</span>
              <span>Masak Pesanan Kejutan!</span>
            </button>
          </div>
        </div>

        <div class="worlds-grid">
          ${DATA.WORLDS.map((w) => {
            const unlocked = isWorldUnlocked(w);
            const cookedCount = w.menus.reduce((acc, m) => acc + (state.completedMenus[m.id] || 0), 0);
            return `
              <div class="world-card ${unlocked ? "" : "locked"}"
                   style="background:${w.bgGradient}; border-color:${w.themeColor};"
                   onclick="INARA_APP.selectWorld(${w.level})">
                <span class="world-level-badge" style="color:${w.themeColor};">
                  Kedai Level ${w.level} • 5 Menu
                </span>
                <div class="world-icon-big">${w.icon}</div>
                <div>
                  <div class="world-title">${w.name}</div>
                  <div class="world-subtitle">${w.subtitle}</div>
                </div>
                <div class="world-action-pill" style="background:${unlocked ? w.themeColor : "#64748B"};">
                  ${
                    unlocked
                      ? `▶️ Buka 5 Menu (${cookedCount}x)`
                      : `🔒 Butuh ${w.unlockStars} ⭐ (Klik Buka)`
                  }
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // VIEW 2: PEMILIHAN 5 MENU UNIK DI DALAM KEDAI
  // -------------------------------------------------------------------------
  function renderWorldMenus() {
    const worldObj = DATA.WORLDS.find((w) => w.level === selectedWorldLevel) || DATA.WORLDS[0];
    const cust = DATA.CUSTOMERS.find((c) => c.id === worldObj.defaultCustomer) || DATA.CUSTOMERS[0];

    return `
      <div class="menu-select-container">
        <div class="world-header-strip" style="border-color:${worldObj.themeColor};">
          <div style="display:flex;align-items:center;gap:14px;">
            <button class="icon-action-btn" onclick="INARA_APP.navigate('map')">⬅️ Kembali</button>
            <span style="font-size:2.4rem;">${worldObj.icon}</span>
            <div>
              <h2 style="font-size:1.35rem;font-weight:900;color:${worldObj.themeColor};">
                Kedai Level ${worldObj.level}: ${worldObj.name}
              </h2>
              <p style="font-size:0.92rem;font-weight:800;color:var(--text-muted);">
                ${worldObj.subtitle} — Pilih menu masakan untuk ${cust.name}!
              </p>
            </div>
          </div>
          <button class="btn-jumbo-cta" style="min-height:58px;font-size:1rem;padding:8px 18px;"
                  onclick="INARA_APP.startCookingOrder(${worldObj.level})">
            🎲 Pesanan Acak di Kedai Ini!
          </button>
        </div>

        <div class="menus-5-grid">
          ${worldObj.menus
            .map((m) => {
              const timesCooked = state.completedMenus[m.id] || 0;
              return `
                <div class="menu-dish-card" onclick="INARA_APP.startCookingOrder(${worldObj.level}, '${m.id}')">
                  <div style="font-size:0.8rem;font-weight:900;color:${m.color};">
                    Menu #${m.number} ${timesCooked > 0 ? `• ⭐ ${timesCooked}x` : ""}
                  </div>
                  <div class="menu-dish-emoji" style="border-color:${m.color};">${m.emoji}</div>
                  <div>
                    <div class="menu-dish-name">${m.name}</div>
                    <div class="menu-dish-en">${m.en}</div>
                  </div>
                  <div class="menu-ingredients-row">
                    ${m.ingredients
                      .slice(0, 4)
                      .map((ingId) => {
                        const ing = DATA.getWordById(ingId);
                        return `<span class="menu-ing-chip">${ing.emoji} ${ing.word}</span>`;
                      })
                      .join("")}
                  </div>
                  <button class="btn-cook-dish" style="background:${m.color};">
                    🍳 Masak Ini!
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // VIEW 3: 4-IN-1 COOKING & LEARNING WORKSPACE
  // -------------------------------------------------------------------------
  function renderCookingWorkspace() {
    if (!activeOrder) return renderMapLobby();

    const s = activeOrder.stageIndex;
    const steps = [
      { idx: 0, icon: "🔪", label: "1. Potong BA-CA" },
      { idx: 1, icon: "🔢", label: `2. Angka ${activeOrder.targetNumber}` },
      ...(activeOrder.includeMath ? [{ idx: 2, icon: "➕➖", label: "Hitung +/-" }] : []),
      { idx: 3, icon: "🫧", label: activeOrder.bubbleMode === "numseq" ? "3. Urut Angka" : "3. Eja Huruf" },
      { idx: 4, icon: "✍️", label: "4. Lukis Saus" },
      { idx: 5, icon: "🎉", label: "5. Makan!" }
    ];

    let boardHtml = "";
    let visualCueHtml = "";

    if (s === 0) {
      const w = activeOrder.cutWords[activeOrder.currentCutWordIdx];
      visualCueHtml = `
        <div class="visual-target-pill">
          <span class="badge-huge-emoji">${w.emoji}</span>
          <span class="badge-syl-text">${w.syllables.join(" • ")}</span>
        </div>
        <div class="visual-cue-hint">
          <span class="bouncing-hand-icon">👆</span>
          <span style="font-weight:900;">Ketuk Potong!</span>
        </div>
      `;
      boardHtml = renderStage1Cut(w);
    } else if (s === 1) {
      visualCueHtml = `
        <div class="visual-target-pill">
          <span class="badge-huge-target">🎯 ${activeOrder.targetNumber}</span>
          <span class="badge-huge-emoji">${activeOrder.countIngredient.emoji}</span>
        </div>
        <div class="visual-cue-hint">
          <span class="bouncing-hand-icon">👆</span>
          <span style="font-weight:900;">Takar ${activeOrder.countIngredient.emoji}!</span>
        </div>
      `;
      boardHtml = renderStage2Count();
    } else if (s === 2) {
      const mp = activeOrder.mathProblem;
      visualCueHtml = `
        <div class="visual-target-pill">
          <span class="badge-huge-math">${mp.a} ${mp.op} ${mp.b} = ❓</span>
        </div>
        <div class="visual-cue-hint">
          <span class="bouncing-hand-icon">👆</span>
          <span style="font-weight:900;">Pilih Jumlah!</span>
        </div>
      `;
      boardHtml = renderStage2Math(mp);
    } else if (s === 3) {
      if (activeOrder.bubbleMode === "numseq") {
        const targetNum = activeOrder.numSeqItems[activeOrder.numSeqMissingIdx];
        visualCueHtml = `
          <div class="visual-target-pill">
            <span class="badge-huge-target">🫧 ${targetNum}</span>
          </div>
          <div class="visual-cue-hint">
            <span class="bouncing-hand-icon">👆</span>
            <span style="font-weight:900;">Pecahkan Angka!</span>
          </div>
        `;
      } else {
        const targetChar = activeOrder.spellWord[activeOrder.spellIndex] || "";
        visualCueHtml = `
          <div class="visual-target-pill">
            <span class="badge-huge-target">🫧 "${targetChar}"</span>
          </div>
          <div class="visual-cue-hint">
            <span class="bouncing-hand-icon">👆</span>
            <span style="font-weight:900;">Pecahkan Huruf!</span>
          </div>
        `;
      }
      boardHtml = renderStage3Bubbles();
    } else if (s === 4) {
      visualCueHtml = `
        <div class="visual-target-pill">
          <span class="badge-huge-target">⭐ "${activeOrder.traceTarget}"</span>
        </div>
        <div class="visual-cue-hint">
          <span class="bouncing-hand-icon">👆</span>
          <span style="font-weight:900;">Lukis Saus!</span>
        </div>
      `;
      boardHtml = renderStage4Trace();
    } else {
      visualCueHtml = `
        <div class="visual-target-pill">
          <span class="badge-huge-emoji">${activeOrder.menu.emoji}</span>
          <span class="badge-syl-text">😋 Nyam!</span>
        </div>
        <div class="visual-cue-hint">
          <span class="bouncing-hand-icon">👆</span>
          <span style="font-weight:900;">Suapi Masakan!</span>
        </div>
      `;
      boardHtml = renderStage5Reward();
    }

    return `
      <div class="cooking-shell">
        <div class="cooking-top-progress">
          <div style="display:flex;align-items:center;gap:10px;">
            <button class="icon-action-btn" style="min-height:46px;" onclick="INARA_APP.selectWorld(${activeOrder.world.level})">
              ⬅️ Menu
            </button>
            <span style="font-size:1.5rem;" class="floating-item-icon">${activeOrder.menu.emoji}</span>
            <strong style="font-size:1.1rem;color:var(--text-dark);">${activeOrder.menu.name}</strong>
          </div>
          <div class="stage-steps-row">
            ${steps
              .map(
                (st) => `
              <div class="stage-step-pill ${s === st.idx ? "active" : s > st.idx ? "done" : ""}">
                <span>${s > st.idx ? "✅" : st.icon}</span>
                <span>${st.label}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="cooking-workspace">
          <aside class="customer-side-panel">
            ${
              activeOrder.customer.id === "labrador"
                ? `<div class="patrol-arrival-banner">
                     ${SVG.renderPatrolCar(105)}
                     <span class="patrol-siren-pill">🚨 Sheriff Labrador</span>
                   </div>`
                : `<div style="font-size:0.9rem;font-weight:900;color:var(--pink-dark);">
                     Pelanggan: ${activeOrder.customer.title}
                   </div>`
            }
            <div class="customer-avatars-pair">
              ${SVG.renderCustomer(
                activeOrder.customer.id,
                s === 5 ? (activeOrder.bitesTaken >= activeOrder.totalBites ? "cheering" : "eating") : "happy",
                112
              )}
              ${SVG.renderChefInara(state.wardrobe, s === 5 ? "cheering" : "cooking", 96)}
            </div>
            <div class="prompt-bubble-card visual-card-only">
              ${visualCueHtml}
            </div>
            <button class="btn-speak-again" onclick="INARA_APP.repeatStageVoice()" title="Dengarkan Suara">
              <span class="speaker-wave-icon">🔊</span>
              <span>Dengarkan Suara</span>
            </button>
          </aside>

          <section class="interactive-board-area">
            ${boardHtml}
          </section>
        </div>
      </div>
    `;
  }

  function renderStage1Cut(wordObj) {
    const totalSyls = wordObj.syllables.length;
    const done = activeOrder.slicesDone;

    return `
      <div style="text-align:center;">
        <span style="font-size:0.9rem;font-weight:900;color:var(--text-muted);">
          Bahan ${activeOrder.currentCutWordIdx + 1} dari ${activeOrder.cutWords.length} • ${wordObj.en} ${wordObj.ja ? `• ${wordObj.ja}` : ""}
        </span>
        <div class="syllable-badges-row" style="margin-top:6px;">
          ${wordObj.syllables
            .map(
              (syl, idx) => `
            <div class="syllable-pill syl-${idx % 4} ${idx < done ? "sliced" : ""}"
                 onclick="INARA_AUDIO.speakSyllable('${syl}')">
              ${syl}
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="wooden-cutting-board" onclick="INARA_APP.handleSliceIngredient()">
        ${wordObj.syllables
          .map((syl, idx) => {
            const isCut = idx < done;
            const showCutLine = idx === done && done < totalSyls;
            return `
              <div class="slice-piece-card ${isCut ? "is-cut" : ""}">
                <div class="slice-piece-emoji">${wordObj.emoji}</div>
                <div class="slice-piece-syl" style="color:${wordObj.color};">${syl}</div>
              </div>
              ${
                showCutLine
                  ? `<div class="cut-line-indicator" title="Ketuk untuk memotong!">
                       <span style="font-size:2.3rem;">🔪</span>
                       <span style="font-size:0.78rem;font-weight:900;color:#E11D48;">POTONG!</span>
                     </div>`
                  : ""
              }
            `;
          })
          .join("")}
      </div>

      <div style="display:flex;gap:14px;align-items:center;">
        <button class="btn-jumbo-cta" style="min-height:68px;" onclick="INARA_APP.handleSliceIngredient()">
          🔪 Potong Suku Kata (${done}/${totalSyls})
        </button>
        <button class="icon-action-btn" style="min-height:68px;padding:0 18px;"
                onclick="INARA_AUDIO.speakSyllablesThenWord(INARA_DATA.getWordById('${wordObj.id}'), true)">
          🔊 Eja "${wordObj.word}"
        </button>
      </div>
    `;
  }

  function renderStage2Count() {
    const target = activeOrder.targetNumber;
    const info = activeOrder.numInfo;
    const ing = activeOrder.countIngredient;
    const isSingleMode = target <= 10;

    const currentTotal = isSingleMode
      ? activeOrder.currentUnits
      : activeOrder.currentTens * 10 + activeOrder.currentUnits;
    const currentInfo = DATA.getNumberInfo(currentTotal);

    const needMoreTens = !isSingleMode && activeOrder.currentTens < info.tensCount;
    const needMoreUnits = isSingleMode
      ? activeOrder.currentUnits < target
      : activeOrder.currentUnits < info.unitsCount;

    return `
      <div class="counting-stage-wrap">
        <div class="number-target-banner">
          <div class="target-big-num" onclick="INARA_AUDIO.speakNumber(${target}, {echoEn:true, echoJa:true})" style="cursor:pointer;">
            ${target}
          </div>
          <div style="text-align:left;flex:1;">
            <div style="font-size:1.25rem;font-weight:900;color:var(--text-dark);">
              Target: ${info.id} <span style="color:#0284C7;">(${info.en})</span>
              ${activeOrder.world.isJapaneseWorld ? `<span style="color:#7C3AED;"> • ${info.jaRomaji} (${info.jaKana})</span>` : ""}
            </div>
            <div class="place-value-pills" style="margin-top:4px;">
              ${
                !isSingleMode
                  ? `<span class="pv-pill pv-tens">🧺 Puluhan (10): <strong>${activeOrder.currentTens} / ${info.tensCount}</strong></span>
                     <span class="pv-pill pv-units">${ing.emoji} Satuan (1): <strong>${activeOrder.currentUnits} / ${info.unitsCount}</strong></span>`
                  : `<span class="pv-pill pv-units">${ing.emoji} Hitung Satuan: <strong>${currentTotal} / ${target}</strong></span>`
              }
              <span class="pv-pill" style="background:#ECFDF5;border-color:#10B981;color:#065F46;">
                🔥 Takaran Digital: <strong>${currentTotal} / ${target} (${currentInfo.id})</strong>
              </span>
            </div>
            ${
              activeOrder.world.hasOvenDial
                ? `<div class="oven-dial-bar" style="margin-top:6px;">
                     <span style="font-size:0.82rem;font-weight:900;color:#B45309;">🌡️ Dial Oven Digital (0–${target}):</span>
                     <input type="range" class="oven-dial-slider" min="0" max="${target}" value="${currentTotal}"
                            oninput="INARA_APP.setOvenDialValue(this.value)" />
                     <button class="tab-pill-btn" style="min-height:36px;padding:4px 10px;font-size:0.8rem;background:#FEF3C7;border-color:#F59E0B;color:#B45309;"
                             onclick="INARA_APP.setOvenDialValue(${target})">
                       ⚡ Pas ${target}°
                     </button>
                   </div>`
                : `<div style="margin-top:6px;width:100%;height:14px;background:#E2E8F0;border-radius:999px;overflow:hidden;border:2px solid #94A3B8;">
                     <div style="width:${Math.min(100, Math.round((currentTotal / Math.max(1, target)) * 100))}%;height:100%;background:linear-gradient(90deg,#38BDF8 0%,#10B981 50%,#F59E0B 100%);transition:width 0.25s ease;"></div>
                   </div>`
            }
          </div>
        </div>

        <div class="cooking-pot-zone" onclick="${needMoreTens ? "INARA_APP.handleAddTensBasket()" : "INARA_APP.handleAddUnitItem()"}">
          ${
            currentTotal === 0
              ? `<div style="color:#64748B;font-size:1.1rem;font-weight:800;">
                   🍲 Panci masih kosong (0). Ketuk tombol di bawah untuk memasukkan ${ing.emoji} ${ing.word}!
                 </div>`
              : ""
          }
          ${Array.from({ length: activeOrder.currentTens })
            .map(() => SVG.renderTensBasket(ing.emoji))
            .join("")}
          ${Array.from({ length: activeOrder.currentUnits })
            .map(
              (_, i) => `
            <div class="unit-item-chip" onclick="event.stopPropagation(); INARA_AUDIO.speakNumber(${activeOrder.currentTens * 10 + i + 1}, {echoEn:false})">
              <span>${ing.emoji}</span>
              <span class="chip-num">${activeOrder.currentTens * 10 + i + 1}</span>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="feeder-buttons-row">
          ${
            !isSingleMode
              ? `<button class="btn-feeder btn-tens ${needMoreTens ? "glow-focus" : ""}"
                         ${!needMoreTens ? "disabled" : ""}
                         onclick="INARA_APP.handleAddTensBasket()">
                   <span style="font-size:2.1rem;">🧺</span>
                   <div style="text-align:left;">
                     <div>+10 Keranjang Puluhan</div>
                     <div style="font-size:0.85rem;opacity:0.9;">(${activeOrder.currentTens}/${info.tensCount} Keranjang = ${activeOrder.currentTens * 10})</div>
                   </div>
                 </button>`
              : ""
          }

          <button class="btn-feeder btn-units ${!needMoreTens && needMoreUnits ? "glow-focus" : ""}"
                  ${!needMoreUnits ? "disabled" : ""}
                  onclick="INARA_APP.handleAddUnitItem()">
            <span style="font-size:2.1rem;">${ing.emoji}</span>
            <div style="text-align:left;">
              <div>+1 ${ing.word} Satuan</div>
              <div style="font-size:0.85rem;opacity:0.9;">
                (${activeOrder.currentUnits}/${isSingleMode ? target : info.unitsCount} Satuan)
              </div>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  function renderStage2Math(mp) {
    const isAdd = mp.op === "+";
    const needFeedingAdd = isAdd && activeOrder.mathAddedCount < mp.b;

    // Build visual food tokens in the bowl
    const tokensHtml = [];
    if (isAdd) {
      if (mp.a >= 10 && mp.a % 10 === 0) {
        const tensCount = mp.a / 10;
        for (let t = 0; t < tensCount; t++) {
          const val = (t + 1) * 10;
          tokensHtml.push(`
            <div onclick="INARA_APP.handleMathTokenTap(${t}, ${val})" style="cursor:pointer;">
              ${SVG.renderTensBasket(mp.ingredient.emoji)}
            </div>
          `);
        }
      } else {
        for (let i = 0; i < mp.a; i++) {
          const num = i + 1;
          tokensHtml.push(`
            <div class="math-food-token" onclick="INARA_APP.handleMathTokenTap(${i}, ${num})">
              <span>${mp.ingredient.emoji}</span>
              <span class="token-count-badge">${num}</span>
            </div>
          `);
        }
      }
      for (let j = 0; j < activeOrder.mathAddedCount; j++) {
        const num = mp.a + j + 1;
        tokensHtml.push(`
          <div class="math-food-token added-item" onclick="INARA_APP.handleMathTokenTap(${mp.a + j}, ${num})">
            <span>${mp.ingredient.emoji}</span>
            <span class="token-count-badge" style="background:#10B981;">${num}</span>
          </div>
        `);
      }
    } else {
      // Subtraction (-): First (mp.a - mp.b) items are whole, last mp.b items are eaten by Mochi!
      const remaining = mp.a - mp.b;
      if (remaining >= 10 && remaining % 10 === 0) {
        const tensCount = remaining / 10;
        for (let t = 0; t < tensCount; t++) {
          const val = (t + 1) * 10;
          tokensHtml.push(`
            <div onclick="INARA_APP.handleMathTokenTap(${t}, ${val})" style="cursor:pointer;">
              ${SVG.renderTensBasket(mp.ingredient.emoji)}
            </div>
          `);
        }
        for (let e = 0; e < mp.b; e++) {
          tokensHtml.push(`
            <div class="math-food-token eaten-by-mochi"
                 onclick="INARA_APP.handleMathTokenTap(${remaining + e}, ${mp.b})">
              <span>🐾</span>
              <span class="token-count-badge" style="background:#F43F5E;">🐱</span>
            </div>
          `);
        }
      } else {
        for (let i = 0; i < mp.a; i++) {
          const isEaten = i >= remaining;
          const num = i + 1;
          tokensHtml.push(`
            <div class="math-food-token ${isEaten ? "eaten-by-mochi" : ""}"
                 onclick="INARA_APP.handleMathTokenTap(${i}, ${isEaten ? mp.b : num})">
              <span>${isEaten ? "🐾" : mp.ingredient.emoji}</span>
              <span class="token-count-badge" style="background:${isEaten ? "#F43F5E" : "#F59E0B"};">
                ${isEaten ? "🐱" : num}
              </span>
            </div>
          `);
        }
      }
    }

    return `
      <div class="counting-stage-wrap">
        <div class="math-equation-banner">
          <span>${mp.a} ${mp.ingredient.emoji}</span>
          <span class="math-op-badge">${mp.op}</span>
          <span>${mp.b} ${mp.ingredient.emoji}</span>
          <span>=</span>
          <span class="math-question-box">${activeOrder.mathSolved ? mp.answer : "?"}</span>
        </div>

        <div class="math-visual-tray">
          ${tokensHtml.join("")}
        </div>

        ${
          needFeedingAdd
            ? `<button class="btn-jumbo-cta" onclick="INARA_APP.handleFeedAddedMathItem()">
                 ➕ Masukkan Tambahan ${mp.ingredient.emoji} ke Mangkuk (${activeOrder.mathAddedCount}/${mp.b})
               </button>`
            : `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
                 <div style="font-size:0.95rem;font-weight:900;color:var(--text-muted);">
                   👆 Ketuk ${mp.ingredient.emoji} di atas untuk menghitung, lalu pilih jawaban yang benar:
                 </div>
                 <div class="math-choices-row">
                   ${mp.choices
                     .map(
                       (c) => `
                     <button class="btn-math-choice" onclick="INARA_APP.handleMathAnswerChoice(${c})">
                       ${c}
                     </button>
                   `
                     )
                     .join("")}
                 </div>
               </div>`
        }
      </div>
    `;
  }

  function renderStage3Bubbles() {
    if (activeOrder.bubbleMode === "numseq") {
      const seq = activeOrder.numSeqItems;
      const missIdx = activeOrder.numSeqMissingIdx;
      const targetNumStr = String(seq[missIdx]);

      return `
        <div class="counting-stage-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:680px;">
            <span style="font-size:0.95rem;font-weight:900;color:var(--purple-dark);">
              🔢 Urutan Angka Mendidih:
            </span>
            <button class="tab-pill-btn" style="min-height:42px;font-size:0.85rem;"
                    onclick="INARA_APP.toggleBubbleMode()">
              🔤 Ganti ke Mode Eja Kata (${activeOrder.spellWord})
            </button>
          </div>

          <div class="spelling-slots-row">
            ${seq
              .map(
                (numVal, i) => `
              <div class="letter-slot-box ${i < missIdx ? "filled" : i === missIdx ? "target-current" : "filled"}"
                   style="min-width:68px;padding:0 10px;">
                ${i === missIdx ? "?" : numVal}
              </div>
            `
              )
              .join("")}
          </div>

          <div class="bubble-pot-arena">
            ${activeOrder.bubbleOptions
              .map(
                (ch, idx) => `
              <button class="floating-bubble-btn ${String(ch) === targetNumStr ? "is-target-hint" : ""}"
                      style="animation-delay:${idx * 0.25}s;"
                      onclick="INARA_APP.handleBubbleTap('${ch}')">
                ${ch}
              </button>
            `
              )
              .join("")}
          </div>

          <div style="font-size:1.05rem;font-weight:900;color:var(--pink-dark);">
            🫧 Ketuk gelembung angka berwarna emas <strong>"${targetNumStr}"</strong> untuk melengkapi urutan!
          </div>
        </div>
      `;
    }

    const word = activeOrder.spellWord;
    const curIdx = activeOrder.spellIndex;
    const targetChar = word[curIdx] || "";

    return `
      <div class="counting-stage-wrap">
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:680px;">
          <span style="font-size:0.95rem;font-weight:900;color:var(--purple-dark);">
            🔤 Eja Kata: <strong>${word}</strong>
          </span>
          <button class="tab-pill-btn" style="min-height:42px;font-size:0.85rem;"
                  onclick="INARA_APP.toggleBubbleMode()">
            🔢 Ganti ke Mode Urutan Angka
          </button>
        </div>

        <div class="spelling-slots-row">
          ${word
            .split("")
            .map(
              (ch, i) => `
            <div class="letter-slot-box ${i < curIdx ? "filled" : i === curIdx ? "target-current" : ""}">
              ${i <= curIdx ? ch : "?"}
            </div>
          `
            )
            .join("")}
        </div>

        <div class="bubble-pot-arena">
          ${activeOrder.bubbleOptions
            .map(
              (ch, idx) => `
            <button class="floating-bubble-btn ${ch === targetChar ? "is-target-hint" : ""}"
                    style="animation-delay:${idx * 0.25}s;"
                    onclick="INARA_APP.handleBubbleTap('${ch}')">
              ${ch}
            </button>
          `
            )
            .join("")}
        </div>

        <div style="font-size:1.05rem;font-weight:900;color:var(--pink-dark);">
          🫧 Ketuk gelembung huruf berwarna emas <strong>"${targetChar}"</strong>!
        </div>
      </div>
    `;
  }

  function renderStage4Trace() {
    const sauces = [
      { name: "Stroberi", color: "#FF5D8F" },
      { name: "Cokelat", color: "#7F4F24" },
      { name: "Keju Emas", color: "#F59E0B" },
      { name: "Pandan", color: "#10B981" },
      { name: "Blueberry", color: "#8B5CF6" }
    ];

    return `
      <div class="tracing-stage-wrap">
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:560px;">
          <div style="font-size:1.25rem;font-weight:900;color:var(--pink-dark);">
            ✍️ Lukis Saus: <span style="font-size:1.65rem;">${activeOrder.traceTarget}</span>
          </div>
          <div style="display:flex;gap:8px;">
            ${sauces
              .map(
                (s) => `
              <button class="sauce-color-btn ${activeOrder.sauceColor === s.color ? "active-sauce" : ""}"
                      onclick="INARA_APP.setCookingSauce('${s.color}')"
                      style="background:${s.color};"
                      title="${s.name}"></button>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="tracing-canvas-holder">
          <canvas id="cooking-trace-canvas"></canvas>
        </div>

        <div style="display:flex;gap:14px;">
          <button class="btn-jumbo-cta" style="min-height:62px;font-size:1.05rem;"
                  onclick="INARA_APP.handleAutoMagicTrace(true)">
            🪄 Tongkat Sihir Bantu Lukis!
          </button>
        </div>
      </div>
    `;
  }

  function renderStage5Reward() {
    const doneEating = activeOrder.bitesTaken >= activeOrder.totalBites;
    const scale = Math.max(0.45, 1 - activeOrder.bitesTaken * 0.2);

    return `
      <div class="counting-stage-wrap" style="justify-content:center;gap:14px;">
        ${
          !doneEating
            ? `
          <div style="font-size:1.3rem;font-weight:900;color:var(--pink-dark);">
            🍽️ Ketuk masakan untuk menyuapi ${activeOrder.customer.name}! (${activeOrder.bitesTaken}/${activeOrder.totalBites})
          </div>
          <div onclick="INARA_APP.handleFeedCustomerBite()"
               style="width:165px;height:165px;border-radius:50%;background:#FFF9DB;border:6px solid #F59E0B;display:flex;align-items:center;justify-content:center;font-size:5.5rem;cursor:pointer;transform:scale(${scale});transition:transform 0.25s ease;box-shadow:0 10px 25px rgba(245,158,11,0.28);">
            ${activeOrder.menu.emoji}
          </div>
          <button class="btn-jumbo-cta" onclick="INARA_APP.handleFeedCustomerBite()">
            🥄 Suapi ${activeOrder.customer.name} ("Nyam Nyam!")
          </button>
        `
            : `
          <div style="background:#FFF9DB;border:4px solid #F59E0B;border-radius:26px;padding:16px 26px;text-align:center;max-width:640px;">
            <div style="font-size:2.2rem;">⭐⭐⭐ +3 Bintang untuk Koki Inara!</div>
            <h2 style="font-size:1.4rem;color:var(--pink-dark);margin:6px 0;">
              "${activeOrder.customer.praise}"
            </h2>
            ${
              activeOrder.unlockedSticker
                ? `<div style="margin-top:8px;background:#FFFFFF;border:3px dashed #10B981;border-radius:18px;padding:8px 16px;display:inline-flex;align-items:center;gap:10px;">
                     <span style="font-size:2.2rem;">${activeOrder.unlockedSticker.emoji}</span>
                     <div style="text-align:left;">
                       <div style="font-size:0.8rem;font-weight:900;color:#059669;">STIKER BARU TERBUKA!</div>
                       <div style="font-size:1.05rem;font-weight:900;">${activeOrder.unlockedSticker.name}</div>
                     </div>
                   </div>`
                : ""
            }
          </div>

          <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;">
            <button class="btn-jumbo-cta" onclick="INARA_APP.afterDishNextAction('again')">
              🔄 Masak Lagi (Pesanan Baru!)
            </button>
            <button class="icon-action-btn" style="min-height:74px;padding:0 22px;font-size:1.1rem;"
                    onclick="INARA_APP.afterDishNextAction('map')">
              🗺️ Peta 5 Kedai
            </button>
            <button class="icon-action-btn" style="min-height:74px;padding:0 22px;font-size:1.1rem;background:#FFF0F5;border-color:#FF6F91;"
                    onclick="INARA_AUDIO.speakCustomerPraise('${activeOrder.customer.id}', ${Boolean(activeOrder.world.isJapaneseWorld)})">
              🔊 Putar Pujian ${activeOrder.customer.name}
            </button>
          </div>
        `
        }
      </div>
    `;
  }

  // =========================================================================
  // STATION 1: PAPAN ANGKA PINTAR 1-100 (10x10 INTERACTIVE GRID)
  // =========================================================================
  function renderStation100() {
    const info = DATA.getNumberInfo(station100State.selectedNum);
    const f = station100State.filter;

    const numbers = [];
    for (let n = 1; n <= 100; n++) {
      if (f === "1-20" && n > 20) continue;
      if (f === "21-50" && (n < 21 || n > 50)) continue;
      if (f === "51-80" && (n < 51 || n > 80)) continue;
      if (f === "81-100" && n < 81) continue;
      if (f === "tens" && n % 10 !== 0) continue;
      numbers.push(n);
    }

    return `
      <div class="station-100-layout">
        <div class="grid-100-panel">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div class="filter-tabs-row">
              ${[
                ["all", "Semua 1–100"],
                ["1-20", "1–20"],
                ["21-50", "21–50"],
                ["51-80", "51–80"],
                ["81-100", "81–100"],
                ["tens", "Puluhan 10..100"]
              ]
                .map(
                  ([key, label]) => `
                <button class="tab-pill-btn ${f === key ? "active" : ""}"
                        onclick="INARA_APP.setStation100Filter('${key}')">
                  ${label}
                </button>
              `
                )
                .join("")}
            </div>

            <button class="tab-pill-btn" style="background:#FEF3C7;border-color:#F59E0B;color:#B45309;"
                    onclick="INARA_APP.startFindNumberQuiz()">
              ${
                station100State.quizTarget
                  ? `🔍 Cari Angka: ${station100State.quizTarget}! (⭐ ${station100State.quizScore})`
                  : "🔍 Main Cari Angka!"
              }
            </button>
          </div>

          <div class="numbers-100-grid" style="${f === "tens" ? "grid-template-columns: repeat(5, 1fr);" : ""}">
            ${numbers
              .map((n) => {
                const rowIdx = Math.floor((n - 1) / 10);
                const isSelected = station100State.selectedNum === n;
                const isQuizHint = station100State.quizTarget === n;
                return `
                  <button class="num-cell-btn row-${rowIdx} ${isSelected ? "selected" : ""} ${isQuizHint ? "quiz-hint" : ""}"
                          onclick="INARA_APP.selectNumber100(${n})">
                    ${n}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>

        <aside class="inspector-100-card">
          <div style="font-size:0.9rem;font-weight:900;color:var(--purple-dark);">
            🔎 Mesin Pembaca Angka 1–100
          </div>
          <div class="inspector-huge-num">${info.value}</div>
          <div>
            <div style="font-size:1.3rem;font-weight:900;color:var(--pink-dark);">🇮🇩 ${info.id}</div>
            <div style="font-size:1.1rem;font-weight:800;color:#0284C7;">🇬🇧 ${info.en}</div>
            <div style="font-size:1rem;font-weight:800;color:#7C3AED;">🇯🇵 ${info.jaRomaji} (${info.jaKana})</div>
          </div>

          <div style="background:#F8FAFC;border:3px solid #E2E8F0;border-radius:18px;padding:10px;width:100%;">
            <div style="font-size:0.82rem;font-weight:900;color:var(--text-muted);margin-bottom:6px;">
              🧺 Nilai Tempat (Puluhan & Satuan):
            </div>
            <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
              <span class="pv-pill pv-tens">🧺 ${info.tensCount} Puluhan (${info.tensCount * 10})</span>
              <span class="pv-pill pv-units">🍓 ${info.unitsCount} Satuan (${info.unitsCount})</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:3px;margin-top:8px;font-size:1.15rem;">
              ${"🧺".repeat(info.tensCount)}${"🍓".repeat(info.unitsCount)}
            </div>
          </div>

          <div style="display:flex;gap:8px;width:100%;">
            <button class="btn-speak-again" style="flex:1;min-height:52px;font-size:0.9rem;"
                    onclick="INARA_AUDIO.speakNumber(${info.value}, {onlyLang:'id'})">
              🇮🇩 ID
            </button>
            <button class="btn-speak-again" style="flex:1;min-height:52px;font-size:0.9rem;background:#10B981;border-color:#059669;"
                    onclick="INARA_AUDIO.speakNumber(${info.value}, {onlyLang:'en'})">
              🇬🇧 EN
            </button>
            <button class="btn-speak-again" style="flex:1;min-height:52px;font-size:0.9rem;background:#8B5CF6;border-color:#6D28D9;"
                    onclick="INARA_AUDIO.speakNumber(${info.value}, {onlyLang:'ja'})">
              🇯🇵 JP
            </button>
          </div>
        </aside>
      </div>
    `;
  }

  // =========================================================================
  // STATION 2: MESIN HITUNG KUE (+ TAMBAH & - KURANG MOCHI)
  // =========================================================================
  function ensureMathLabProblem() {
    if (!mathLabState.problem) {
      const ings = DATA.WORDS_DB.filter((w) => w.isIngredient);
      mathLabState.problem = DATA.generateMathProblem(mathLabState.mode, pickRandom(ings));
      mathLabState.answered = false;
    }
  }

  function renderMathLabStation() {
    ensureMathLabProblem();
    const mp = mathLabState.problem;
    const isAdd = mp.op === "+";

    const tokens = [];
    if (isAdd) {
      if (mp.a >= 10 && mp.a % 10 === 0) {
        const tensCount = mp.a / 10;
        for (let t = 0; t < tensCount; t++) {
          const val = (t + 1) * 10;
          tokens.push(`
            <div onclick="INARA_AUDIO.playPop(); INARA_AUDIO.speakNumber(${val}, {echoEn:false})" style="cursor:pointer;">
              ${SVG.renderTensBasket(mp.ingredient.emoji)}
            </div>
          `);
        }
        for (let j = 0; j < mp.b; j++) {
          const num = mp.a + j + 1;
          tokens.push(`
            <div class="math-food-token added-item"
                 onclick="INARA_AUDIO.playPop(); INARA_AUDIO.speakNumber(${num}, {echoEn:false})">
              <span>${mp.ingredient.emoji}</span>
              <span class="token-count-badge" style="background:#10B981;">${num}</span>
            </div>
          `);
        }
      } else {
        for (let i = 0; i < mp.a + mp.b; i++) {
          const isSecondGroup = i >= mp.a;
          tokens.push(`
            <div class="math-food-token ${isSecondGroup ? "added-item" : ""}"
                 onclick="INARA_AUDIO.playPop(); INARA_AUDIO.speakNumber(${i + 1}, {echoEn:false})">
              <span>${mp.ingredient.emoji}</span>
              <span class="token-count-badge" style="background:${isSecondGroup ? "#10B981" : "#0284C7"};">${i + 1}</span>
            </div>
          `);
        }
      }
    } else {
      const rem = mp.a - mp.b;
      if (rem >= 10 && rem % 10 === 0) {
        const tensCount = rem / 10;
        for (let t = 0; t < tensCount; t++) {
          const val = (t + 1) * 10;
          tokens.push(`
            <div onclick="INARA_AUDIO.playPop(); INARA_AUDIO.speakNumber(${val}, {echoEn:false})" style="cursor:pointer;">
              ${SVG.renderTensBasket(mp.ingredient.emoji)}
            </div>
          `);
        }
        for (let e = 0; e < mp.b; e++) {
          tokens.push(`
            <div class="math-food-token eaten-by-mochi"
                 onclick="INARA_AUDIO.playPop(); INARA_AUDIO.speakNumber(${mp.b}, {echoEn:false})">
              <span>🐾</span>
              <span class="token-count-badge" style="background:#F43F5E;">🐱</span>
            </div>
          `);
        }
      } else {
        for (let i = 0; i < mp.a; i++) {
          const eaten = i >= rem;
          tokens.push(`
            <div class="math-food-token ${eaten ? "eaten-by-mochi" : ""}"
                 onclick="INARA_AUDIO.playPop(); INARA_AUDIO.speakNumber(${eaten ? mp.b : i + 1}, {echoEn:false})">
              <span>${eaten ? "🐾" : mp.ingredient.emoji}</span>
              <span class="token-count-badge" style="background:${eaten ? "#F43F5E" : "#F59E0B"};">
                ${eaten ? "🐱" : i + 1}
              </span>
            </div>
          `);
        }
      }
    }

    return `
      <div class="cooking-shell">
        <div class="cooking-top-progress">
          <div class="filter-tabs-row">
            ${[
              ["easy_add", "➕ Tambah Mudah (1–6)"],
              ["easy_sub", "➖ Kurang Mochi (1–6)"],
              ["medium_mix", "➕➖ Campuran (1–10)"],
              ["master_mix", "🚀 Master Puluhan (1–40)"]
            ]
              .map(
                ([mKey, label]) => `
              <button class="tab-pill-btn ${mathLabState.mode === mKey ? "active" : ""}"
                      onclick="INARA_APP.setMathLabMode('${mKey}')">
                ${label}
              </button>
            `
              )
              .join("")}
          </div>
          <div style="font-weight:900;color:var(--pink-dark);">
            🏆 Skor Beruntun: ${mathLabState.streak} ⭐
          </div>
        </div>

        <div class="cooking-workspace">
          <aside class="customer-side-panel">
            ${SVG.renderCustomer(isAdd ? "umi" : "mochi", mathLabState.answered ? "cheering" : "happy", 112)}
            <div class="prompt-bubble-card">
              ${mp.storyId}
            </div>
            <button class="btn-speak-again"
                    onclick="INARA_AUDIO.speakMathEquation(${mp.a}, '${mp.op}', ${mp.b}, ${mp.answer}, true)">
              🔊 Baca Persamaan
            </button>
          </aside>

          <section class="interactive-board-area">
            <div class="math-equation-banner">
              <span>${mp.a} ${mp.ingredient.emoji}</span>
              <span class="math-op-badge">${mp.op}</span>
              <span>${mp.b} ${mp.ingredient.emoji}</span>
              <span>=</span>
              <span class="math-question-box">${mathLabState.answered ? mp.answer : "?"}</span>
            </div>

            <div class="math-visual-tray">
              ${tokens.join("")}
            </div>

            <div class="math-choices-row">
              ${mp.choices
                .map(
                  (c) => `
                <button class="btn-math-choice" onclick="INARA_APP.answerMathLab(${c})">
                  ${c}
                </button>
              `
                )
                .join("")}
              <button class="icon-action-btn" style="min-height:86px;padding:0 18px;"
                      onclick="INARA_APP.nextMathLabProblem()">
                🔄 Soal Baru
              </button>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // STATION 3: KARTU BACA SUKU KATA (BA-CA) & HURUF A-Z
  // =========================================================================
  function renderSyllableStation() {
    const cat = syllableStationState.category;
    const allWords = getAllWords();
    const filteredWords = allWords.filter((w) => w.category === cat);
    const activeWord =
      allWords.find((w) => w.id === syllableStationState.selectedWordId) ||
      filteredWords[0] ||
      allWords[0];

    return `
      <div class="cooking-shell">
        <div class="cooking-top-progress">
          <div class="filter-tabs-row">
            ${[
              ["keluarga", "💖 Keluarga & Inara"],
              ["sarapan", "🍞 Sarapan"],
              ["kue", "🧁 Kue & Es Krim"],
              ["sayur", "🍕 Pizza & Sayur"],
              ["buah", "🍓 Buah Segar"],
              ["jepang", "🍱 Bento Jepang"],
              ["angka_warna", "🌈 Angka & Warna"],
              ["az", "🔤 Huruf A–Z"]
            ]
              .map(
                ([cKey, label]) => `
              <button class="tab-pill-btn ${cat === cKey ? "active" : ""}"
                      onclick="INARA_APP.setSyllableCategory('${cKey}')">
                ${label}
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        ${
          cat === "az"
            ? renderPhonicsAZView()
            : `
          <div class="station-100-layout" style="grid-template-columns: 360px 1fr;">
            <div class="grid-100-panel" style="gap:8px;">
              <div style="font-size:0.9rem;font-weight:900;color:var(--text-muted);">
                Pilih Kata (${filteredWords.length} Kata):
              </div>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;overflow-y:auto;">
                ${filteredWords
                  .map(
                    (w) => `
                  <button class="tab-pill-btn ${activeWord.id === w.id ? "active" : ""}"
                          style="display:flex;align-items:center;gap:6px;justify-content:flex-start;min-height:54px;"
                          onclick="INARA_APP.selectSyllableWord('${w.id}')">
                    <span style="font-size:1.5rem;">${w.emoji}</span>
                    <span>${w.syllables.join("-")}</span>
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>

            <div class="inspector-100-card" style="justify-content:center;gap:18px;">
              <div style="font-size:5.2rem;line-height:1;">${activeWord.emoji}</div>
              <div class="syllable-badges-row">
                ${activeWord.syllables
                  .map(
                    (syl, idx) => `
                  <button class="syllable-pill syl-${idx % 4}"
                          onclick="INARA_AUDIO.playTap(); INARA_AUDIO.speakSyllable('${syl}')">
                    ${syl}
                  </button>
                `
                  )
                  .join("")}
              </div>
              <div>
                <div style="font-size:2.1rem;font-weight:900;color:var(--text-dark);">${activeWord.word}</div>
                <div style="font-size:1.15rem;font-weight:800;color:#0284C7;">🇬🇧 ${activeWord.en || ""} ${
                  activeWord.ja ? `• 🇯🇵 ${activeWord.ja}` : ""
                }</div>
              </div>
              <div style="display:flex;gap:14px;">
                <button class="btn-jumbo-cta"
                        onclick="INARA_AUDIO.speakSyllablesThenWord(INARA_DATA.getWordById('${activeWord.id}'), true)">
                  🔊 Eja Suku Kata & Baca Utuh!
                </button>
              </div>
            </div>
          </div>
        `
        }
      </div>
    `;
  }

  function renderPhonicsAZView() {
    const activeL =
      DATA.LETTERS_DB.find((l) => l.letter === syllableStationState.selectedLetter) || DATA.LETTERS_DB[0];

    return `
      <div class="station-100-layout">
        <div class="grid-100-panel">
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;">
            ${DATA.LETTERS_DB.map(
              (l) => `
              <button class="num-cell-btn row-${l.letter.charCodeAt(0) % 10} ${
                activeL.letter === l.letter ? "selected" : ""
              }"
                      style="min-height:56px;font-size:1.45rem;"
                      onclick="INARA_APP.selectPhonicsLetter('${l.letter}')">
                ${l.letter}
              </button>
            `
            ).join("")}
          </div>
        </div>

        <aside class="inspector-100-card" style="justify-content:center;gap:12px;">
          <div class="inspector-huge-num" style="font-size:4.2rem;">${activeL.letter}${activeL.letter.toLowerCase()}</div>
          <div style="font-size:3.2rem;">${activeL.emoji}</div>
          <div class="syllable-badges-row">
            ${activeL.syllables
              .map(
                (syl, idx) => `
              <button class="syllable-pill syl-${idx % 4}" style="min-height:56px;padding:8px 18px;font-size:1.4rem;"
                      onclick="INARA_AUDIO.playTap(); INARA_AUDIO.speakSyllable('${syl}')">
                ${syl}
              </button>
            `
              )
              .join("")}
          </div>
          <div style="font-size:1.45rem;font-weight:900;color:var(--pink-dark);">
            ${activeL.syllables.join(" - ")} = ${activeL.word}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="btn-jumbo-cta" style="min-height:56px;font-size:0.95rem;padding:10px 18px;"
                    onclick="INARA_AUDIO.speakLetter('${activeL.letter}')">
              🔊 Huruf "${activeL.letter}"
            </button>
            <button class="icon-action-btn" style="min-height:56px;font-size:0.95rem;padding:10px 16px;"
                    onclick="INARA_AUDIO.speakSyllablesThenWord(INARA_DATA.getWordByString('${activeL.word}'), true)">
              📖 Eja "${activeL.word}"
            </button>
          </div>
        </aside>
      </div>
    `;
  }

  // =========================================================================
  // STATION 4: PAPAN TULIS TEPUNG & SAUS (TRACING STUDIO A-Z, 1-100, INARA)
  // =========================================================================
  function renderTracingStation() {
    const m = tracingStationState.mode;
    const sauces = [
      { name: "Stroberi", color: "#FF5D8F" },
      { name: "Cokelat", color: "#7F4F24" },
      { name: "Keju Emas", color: "#F59E0B" },
      { name: "Pandan", color: "#10B981" },
      { name: "Blueberry", color: "#8B5CF6" }
    ];

    let pickerItems = [];
    if (m === "letters") {
      pickerItems = DATA.LETTERS_DB.map((l) => l.letter);
    } else if (m === "numbers") {
      pickerItems = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
        "11", "12", "15", "20", "25", "30", "40", "50", "60", "70", "80", "90", "100"
      ];
    } else {
      pickerItems = ["INARA", "ABI", "UMI", "ROTI", "SUSU", "KEJU"];
    }

    return `
      <div class="cooking-shell">
        <div class="cooking-top-progress">
          <div class="filter-tabs-row">
            <button class="tab-pill-btn ${m === "letters" ? "active" : ""}"
                    onclick="INARA_APP.setTracingMode('letters', 'I')">🔤 Huruf A–Z</button>
            <button class="tab-pill-btn ${m === "numbers" ? "active" : ""}"
                    onclick="INARA_APP.setTracingMode('numbers', '100')">🔢 Angka 1–100</button>
            <button class="tab-pill-btn ${m === "words" ? "active" : ""}"
                    onclick="INARA_APP.setTracingMode('words', 'INARA')">💖 Kata INARA / ABI / UMI</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:0.88rem;font-weight:900;">Warna Saus:</span>
            ${sauces
              .map(
                (s) => `
              <button class="sauce-color-btn ${tracingStationState.sauceColor === s.color ? "active-sauce" : ""}"
                      onclick="INARA_APP.setTracingStationSauce('${s.color}')"
                      style="background:${s.color};"
                      title="${s.name}"></button>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="station-100-layout" style="grid-template-columns: 320px 1fr;">
          <div class="grid-100-panel">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;overflow-y:auto;">
              ${pickerItems
                .map(
                  (item) => `
                <button class="num-cell-btn row-0 ${tracingStationState.target === item ? "selected" : ""}"
                        style="min-height:48px;font-size:1.1rem;"
                        onclick="INARA_APP.selectTracingTarget('${item}')">
                  ${item}
                </button>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="inspector-100-card" style="justify-content:space-between;">
            <div style="font-size:1.25rem;font-weight:900;color:var(--pink-dark);">
              ✍️ Ikuti Bintang untuk Menulis: <strong>${tracingStationState.target}</strong>
            </div>
            <div class="tracing-canvas-holder">
              <canvas id="station-trace-canvas"></canvas>
            </div>
            <div style="display:flex;gap:12px;">
              <button class="btn-jumbo-cta" style="min-height:58px;font-size:1rem;"
                      onclick="INARA_APP.handleAutoMagicTrace(false)">
                🪄 Bantu Lukis Otomatis
              </button>
              <button class="icon-action-btn" style="min-height:58px;padding:0 16px;"
                      onclick="INARA_APP.selectTracingTarget('${tracingStationState.target}')">
                🔄 Bersihkan Tepung
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // STATION 5: BUKU STIKER (54 STIKER) & LEMARI KOSTUM CHEF INARA
  // =========================================================================
  function renderStickerAndWardrobeStation() {
    const w = state.wardrobe;
    const cats = ["Keluarga", "Kue & Sarapan", "Pizza & Buah", "Bento Jepang", "Bintang Juara"];
    const filteredStickers = DATA.STICKERS.filter((s) => s.category === stickerStationState.selectedCategory);

    return `
      <div class="station-100-layout" style="grid-template-columns: 370px 1fr;">
        <!-- Left: Chef Inara Wardrobe Customizer -->
        <aside class="inspector-100-card" style="justify-content:flex-start;gap:10px;overflow-y:auto;">
          <h3 style="font-size:1.15rem;font-weight:900;color:var(--pink-dark);">
            👗 Lemari Kostum Chef Inara
          </h3>
          <div>
            ${SVG.renderChefInara(w, "cheering", 130)}
          </div>

          <div style="width:100%;text-align:left;">
            <div style="font-size:0.84rem;font-weight:900;margin-bottom:4px;">🎩 Warna Topi Koki:</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${DATA.WARDROBE.hatColors
                .map(
                  (hc) => `
                <button class="tab-pill-btn ${w.hatColor === hc.id ? "active" : ""}"
                        style="min-height:48px;padding:4px 12px;font-size:0.82rem;"
                        onclick="INARA_APP.updateWardrobe('hatColor', '${hc.id}')">
                  ${hc.name}
                </button>
              `
                )
                .join("")}
            </div>
          </div>

          <div style="width:100%;text-align:left;">
            <div style="font-size:0.84rem;font-weight:900;margin-bottom:4px;">🎽 Warna Celemek:</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${DATA.WARDROBE.apronColors
                .map(
                  (ac) => `
                <button class="tab-pill-btn ${w.apronColor === ac.id ? "active" : ""}"
                        style="min-height:48px;padding:4px 12px;font-size:0.82rem;"
                        onclick="INARA_APP.updateWardrobe('apronColor', '${ac.id}')">
                  ${ac.name}
                </button>
              `
                )
                .join("")}
            </div>
          </div>

          <div style="width:100%;text-align:left;">
            <div style="font-size:0.84rem;font-weight:900;margin-bottom:4px;">👑 Hiasan Kepala:</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${DATA.WARDROBE.accessories
                .map(
                  (acc) => `
                <button class="tab-pill-btn ${w.accessory === acc.id ? "active" : ""}"
                        style="min-height:48px;padding:4px 12px;font-size:0.82rem;"
                        onclick="INARA_APP.updateWardrobe('accessory', '${acc.id}')">
                  ${acc.emoji} ${acc.name}
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        </aside>

        <!-- Right: 54 Collectible Stickers & Interactive Scene -->
        <div class="grid-100-panel" style="justify-content:space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h3 style="font-size:1.15rem;font-weight:900;color:var(--purple-dark);">
                ⭐ Buku Koleksi Stiker Inara (${state.unlockedStickers.length} / ${DATA.STICKERS.length} Terbuka)
              </h3>
              <button class="tab-pill-btn" style="min-height:42px;font-size:0.82rem;"
                      onclick="INARA_APP.clearStickerCanvas()">
                🧹 Rapikan Panggung
              </button>
            </div>
            <div class="filter-tabs-row" style="margin-bottom:8px;">
              ${cats
                .map(
                  (c) => `
                <button class="tab-pill-btn ${stickerStationState.selectedCategory === c ? "active" : ""}"
                        style="min-height:44px;font-size:0.84rem;"
                        onclick="INARA_APP.setStickerCategory('${c}')">
                  ${c}
                </button>
              `
                )
                .join("")}
            </div>

            <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;max-height:150px;overflow-y:auto;padding:4px;">
              ${filteredStickers
                .map((stk) => {
                  const unlocked = state.unlockedStickers.includes(stk.id) || state.settings.unlockAllWorlds;
                  return `
                    <button class="num-cell-btn row-0"
                            style="flex-direction:column;min-height:68px;padding:6px;opacity:${unlocked ? 1 : 0.45};"
                            onclick="INARA_APP.placeStickerOnScene('${stk.id}', ${unlocked})">
                      <span style="font-size:1.9rem;">${unlocked ? stk.emoji : "🔒"}</span>
                      <span style="font-size:0.7rem;text-align:center;">${stk.name}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </div>

          <!-- Mini Kitchen Sticker Stage -->
          <div style="flex:1;min-height:145px;background:linear-gradient(180deg,#E0F2FE 0%,#FFF9DB 65%,#FDE68A 100%);border:4px solid #F59E0B;border-radius:22px;position:relative;overflow:hidden;margin-top:8px;">
            <div style="position:absolute;top:6px;left:12px;font-size:0.78rem;font-weight:900;color:#92400E;">
              🏡 Panggung Dapur Stiker Inara (Ketuk stiker di atas untuk menempel!)
            </div>
            ${state.placedStickers
              .map((ps) => {
                const stkObj = DATA.STICKERS.find((s) => s.id === ps.id) || DATA.STICKERS[0];
                return `
                  <div onclick="INARA_AUDIO.playPop(); INARA_AUDIO.speakSticker('${stkObj.id}')"
                       style="position:absolute;left:${ps.x}%;top:${ps.y}%;transform:translate(-50%,-50%);font-size:2.7rem;cursor:pointer;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.16));">
                    ${stkObj.emoji}
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // POJOK ABI & UMI (PARENT GATE & SETTINGS MODAL)
  // =========================================================================
  function generateParentGateQuestion() {
    const a = 3 + Math.floor(Math.random() * 6); // 3..8
    const b = 3 + Math.floor(Math.random() * 5); // 3..7
    const ans = a * b;
    const opts = Array.from(new Set([ans, ans + 2, ans - 3, ans + 5])).sort((x, y) => x - y);
    parentGateQuestion = { a, b, ans, options: opts };
  }

  function renderParentModal() {
    if (!parentModalOpen) return "";

    if (!parentUnlocked) {
      return `
        <div class="modal-backdrop" onclick="INARA_APP.closeParentGate()">
          <div class="modal-card" style="max-width:480px;text-align:center;" onclick="event.stopPropagation()">
            <h2 style="color:var(--pink-dark);font-size:1.45rem;">🔒 Pojok Khusus Abi & Umi</h2>
            <p style="margin:8px 0 16px;font-weight:700;color:var(--text-muted);">
              Jawab soal perkalian ini untuk membuka pengaturan orang tua:
            </p>
            <div style="font-size:2.4rem;font-weight:900;background:#F3EFFE;padding:14px;border-radius:20px;margin-bottom:16px;">
              ${parentGateQuestion.a} × ${parentGateQuestion.b} = ?
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
              ${parentGateQuestion.options
                .map(
                  (opt) => `
                <button class="btn-math-choice" style="min-height:66px;font-size:1.6rem;"
                        onclick="INARA_APP.verifyParentGate(${opt})">
                  ${opt}
                </button>
              `
                )
                .join("")}
            </div>
            <button class="icon-action-btn" style="margin:16px auto 0;width:100%;" onclick="INARA_APP.closeParentGate()">
              Batal
            </button>
          </div>
        </div>
      `;
    }

    const s = state.settings;
    const voiceSlots = [
      { key: "praise_abi", label: "👨🏻‍🍳 Suara Pujian Abi (Saat Masakan Matang)" },
      { key: "praise_umi", label: "🧕🏻 Suara Pujian Umi (Saat Masakan Matang)" },
      { key: "greet_inara", label: "👋 Sapaan Pembuka Lobby untuk Inara" },
      { key: "math_bravo", label: "🌟 Pujian Saat Inara Benar Menjawab Hitung (+/-)" }
    ];

    return `
      <div class="modal-backdrop" onclick="INARA_APP.closeParentGate()">
        <div class="modal-card" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #FFE4EC;padding-bottom:10px;">
            <div>
              <h2 style="color:var(--pink-dark);font-size:1.4rem;">👨🏻‍🍳🧕🏻 Pojok Abi & Umi — Pengaturan & Kurikulum Inara</h2>
              <p style="font-size:0.88rem;color:var(--text-muted);font-weight:700;">
                Kustomisasi level, fokus angka 1–100, soal tambah-kurang (+/-), dan rekam suara asli Abi & Umi!
              </p>
            </div>
            <button class="icon-action-btn" onclick="INARA_APP.closeParentGate()">✖️ Tutup</button>
          </div>

          <div class="parent-grid-sections">
            <!-- 1. Buka Semua Level & Fokus Kurikulum Matematika -->
            <div class="parent-box">
              <h3 style="color:var(--purple-dark);">🔓 1. Akses Kedai & Fokus Matematika (1–100 & +/-)</h3>
              <label style="display:flex;align-items:center;gap:10px;font-weight:900;cursor:pointer;background:#FFFFFF;padding:10px;border-radius:14px;border:2px solid #CBD5E1;">
                <input type="checkbox" style="width:24px;height:24px;"
                       ${s.unlockAllWorlds ? "checked" : ""}
                       onchange="INARA_APP.updateSetting('unlockAllWorlds', this.checked)" />
                <span>Buka Semua 5 Kedai Masakan (25 Menu) & 54 Stiker Sekarang</span>
              </label>

              <div>
                <div style="font-size:0.85rem;font-weight:900;margin-bottom:4px;">🔢 Fokus Rentang Angka:</div>
                <select style="width:100%;padding:10px;border-radius:12px;border:2px solid #CBD5E1;font-weight:800;"
                        onchange="INARA_APP.updateSetting('numberFocus', this.value)">
                  <option value="auto" ${s.numberFocus === "auto" ? "selected" : ""}>Otomatis Sesuai Level Kedai (1–10 s.d. 81–100)</option>
                  <option value="1-10" ${s.numberFocus === "1-10" ? "selected" : ""}>Fokus Angka Dasar 1 – 10</option>
                  <option value="11-20" ${s.numberFocus === "11-20" ? "selected" : ""}>Fokus Angka Belasan 11 – 20</option>
                  <option value="21-50" ${s.numberFocus === "21-50" ? "selected" : ""}>Fokus Puluhan Menengah 21 – 50</option>
                  <option value="51-100" ${s.numberFocus === "51-100" ? "selected" : ""}>Fokus Angka Besar 51 – 100 (Seratus!)</option>
                </select>
              </div>

              <div>
                <div style="font-size:0.85rem;font-weight:900;margin-bottom:4px;">➕➖ Mode Soal Tambah & Kurang:</div>
                <select style="width:100%;padding:10px;border-radius:12px;border:2px solid #CBD5E1;font-weight:800;"
                        onchange="INARA_APP.updateSetting('mathFocus', this.value)">
                  <option value="auto" ${s.mathFocus === "auto" ? "selected" : ""}>Otomatis Sesuai Kedai (Mulai di Level 2–5)</option>
                  <option value="always_mix" ${s.mathFocus === "always_mix" ? "selected" : ""}>Selalu Munculkan Soal Tambah (+) & Kurang (-)</option>
                  <option value="only_add" ${s.mathFocus === "only_add" ? "selected" : ""}>Fokus Penjumlahan (+) Saja</option>
                  <option value="only_sub" ${s.mathFocus === "only_sub" ? "selected" : ""}>Fokus Pengurangan (-) Mochi Saja</option>
                  <option value="off" ${s.mathFocus === "off" ? "selected" : ""}>Matikan Soal +/- (Hanya Hitung Angka)</option>
                </select>
              </div>

              <div>
                <div style="font-size:0.85rem;font-weight:900;margin-bottom:4px;">🌙 Timer "Dapur Mengantuk" (Screen-Time):</div>
                <select style="width:100%;padding:10px;border-radius:12px;border:2px solid #CBD5E1;font-weight:800;"
                        onchange="INARA_APP.updateSetting('sleepTimerMode', this.value)">
                  <option value="unlimited" ${s.sleepTimerMode === "unlimited" ? "selected" : ""}>Tanpa Batas Waktu</option>
                  <option value="3_recipes" ${s.sleepTimerMode === "3_recipes" ? "selected" : ""}>Setelah 3 Resep Masakan Selesai</option>
                  <option value="15m" ${s.sleepTimerMode === "15m" ? "selected" : ""}>15 Menit Bermain</option>
                  <option value="20m" ${s.sleepTimerMode === "20m" ? "selected" : ""}>20 Menit Bermain</option>
                  <option value="30m" ${s.sleepTimerMode === "30m" ? "selected" : ""}>30 Menit Bermain</option>
                </select>
              </div>
            </div>

            <!-- 2. Studio Rekaman Suara Asli Abi & Umi -->
            <div class="parent-box">
              <h3 style="color:var(--pink-dark);">🎙️ 2. Studio Suara Asli Abi & Umi (Tersimpan Offline)</h3>
              <p style="font-size:0.8rem;color:var(--text-muted);font-weight:700;">
                Rekam suara asli Abi & Umi agar diputar otomatis saat memuji Inara!
              </p>
              ${voiceSlots
                .map((slot) => {
                  const hasRec = AUDIO.hasCustomRecording(slot.key);
                  const isRecNow = activeRecordingSlot === slot.key;
                  return `
                    <div style="background:#FFFFFF;border:2px solid #E2E8F0;border-radius:12px;padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <div style="font-size:0.82rem;font-weight:800;">
                        ${slot.label}
                        <span style="display:block;font-size:0.75rem;color:${hasRec ? "#059669" : "#64748B"};">
                          ${hasRec ? "✅ Suara Asli Tersimpan" : "🔊 Menggunakan Suara Bawaan"}
                        </span>
                      </div>
                      <div style="display:flex;gap:6px;">
                        ${
                          isRecNow
                            ? `<button class="tab-pill-btn" style="background:#EF4444;color:#FFF;min-height:38px;"
                                       onclick="INARA_APP.stopVoiceRecording()">⏹️ Stop</button>`
                            : `<button class="tab-pill-btn" style="min-height:38px;"
                                       onclick="INARA_APP.startVoiceRecording('${slot.key}')">🔴 Rekam</button>`
                        }
                        ${
                          hasRec
                            ? `<button class="tab-pill-btn" style="min-height:38px;"
                                       onclick="INARA_AUDIO.playSequence([{type:'custom',slot:'${slot.key}'}])">▶️</button>
                               <button class="tab-pill-btn" style="min-height:38px;"
                                       onclick="INARA_APP.removeVoiceRecording('${slot.key}')">🗑️</button>`
                            : ""
                        }
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>

            <!-- 3. Tambah Kata Suku Kata Baru -->
            <div class="parent-box">
              <h3 style="color:#0D9488;">➕ 3. Tambah Kosakata Suku Kata Baru</h3>
              <p style="font-size:0.8rem;color:var(--text-muted);font-weight:700;">
                Ketik kata dengan pemisah strip (contoh: <code>KA-KAK</code>, <code>NE-NEK</code>, <code>PA-MAN</code>):
              </p>
              <div style="display:flex;gap:8px;">
                <input id="custom-syl-input" type="text" placeholder="Contoh: KA-KAK"
                       style="flex:1;padding:10px;border-radius:12px;border:2px solid #CBD5E1;font-weight:800;" />
                <input id="custom-en-input" type="text" placeholder="Arti Inggris (opsional)"
                       style="width:150px;padding:10px;border-radius:12px;border:2px solid #CBD5E1;font-weight:800;" />
                <button class="tab-pill-btn active" onclick="INARA_APP.addCustomParentWord()">Simpan</button>
              </div>
              <div style="font-size:0.8rem;font-weight:800;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
                <span>Kata Tambahan Abi/Umi (${state.customWords.length}):</span>
                ${
                  state.customWords
                    .map(
                      (cw) => `<span class="menu-ing-chip" style="display:inline-flex;align-items:center;gap:6px;">
                                 <span>${cw.syllables.join("-")}</span>
                                 <button onclick="INARA_APP.removeCustomParentWord('${cw.id}')"
                                         style="border:none;background:transparent;color:#E11D48;font-weight:900;cursor:pointer;padding:0 2px;"
                                         title="Hapus ${cw.word}">✖</button>
                               </span>`
                    )
                    .join(" ") || "<span>Belum ada</span>"
                }
              </div>
            </div>

            <!-- 4. Ringkasan Progres Belajar Inara -->
            <div class="parent-box">
              <h3 style="color:#D97706;">📊 4. Ringkasan Progres Belajar Koki Inara</h3>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:0.88rem;font-weight:800;">
                <div style="background:#FFF;padding:8px 10px;border-radius:12px;border:2px solid #FDE68A;">
                  🍽️ Masakan Selesai: <strong>${state.mastery.totalDishes || 0}</strong>
                </div>
                <div style="background:#FFF;padding:8px 10px;border-radius:12px;border:2px solid #FDE68A;">
                  ⭐ Total Bintang: <strong>${state.stars}</strong>
                </div>
                <div style="background:#FFF;padding:8px 10px;border-radius:12px;border:2px solid #A7F3D0;">
                  ➕ Soal Tambah Benar: <strong>${state.mastery.mathAddCorrect || 0}</strong>
                </div>
                <div style="background:#FFF;padding:8px 10px;border-radius:12px;border:2px solid #A7F3D0;">
                  ➖ Soal Kurang Benar: <strong>${state.mastery.mathSubCorrect || 0}</strong>
                </div>
                <div style="background:#FFF;padding:8px 10px;border-radius:12px;border:2px solid #DDD6FE;">
                  🔢 Angka Dikuasai: <strong>${Object.keys(state.mastery.numbers || {}).length} / 100</strong>
                </div>
                <div style="background:#FFF;padding:8px 10px;border-radius:12px;border:2px solid #DDD6FE;">
                  🔤 Huruf & Kata: <strong>${Object.keys(state.mastery.letters || {}).length} Huruf • ${Object.keys(state.mastery.words || {}).length} Kata</strong>
                </div>
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;">
                💡 Tips Tablet Android: Gunakan fitur <strong>Install App / Tambahkan ke Layar Utama</strong> di Chrome & aktifkan <strong>Sematkan Aplikasi (Screen Pinning)</strong> di Pengaturan Keamanan Android agar Inara tidak keluar aplikasi saat bermain.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSleepyKitchenOverlay() {
    if (!isSleepyKitchenActive) return "";
    return `
      <div class="sleepy-overlay">
        <div style="font-size:3.6rem;">🌙 ✨ ⭐ ✨ 🌙</div>
        <div>
          ${SVG.renderChefInara(state.wardrobe, "sleepy", 160)}
        </div>
        <h1 style="font-size:2rem;color:#FDE68A;">Dapur Ceria Inara Sudah Mengantuk... 😴</h1>
        <p style="max-width:560px;font-size:1.15rem;line-height:1.5;color:#E2E8F0;font-weight:700;">
          Terima kasih Koki Pintar Inara! Hari ini Inara sudah memasak hebat sekali bersama Abi, Umi, dan Mochi Kucing. Sekarang waktunya istirahat dulu ya sayang! 💖
        </p>
        <div style="display:flex;gap:14px;margin-top:10px;">
          <button class="btn-jumbo-cta" onclick="INARA_AUDIO.playSleepyLullaby(); INARA_AUDIO.speakPhrase('sleepy_kitchen')">
            🎵 Putar Lagu Pengantar Tidur
          </button>
          <button class="icon-action-btn" style="background:rgba(255,255,255,0.15);color:#FFF;border-color:#94A3B8;"
                  onclick="INARA_APP.wakeKitchenParent()">
            🔒 Buka oleh Abi/Umi
          </button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MAIN RENDER FUNCTION
  // =========================================================================
  function render() {
    const appEl = document.getElementById("app");
    if (!appEl) return;

    let mainContent = "";
    if (currentView === "map") mainContent = renderMapLobby();
    else if (currentView === "world_menus") mainContent = renderWorldMenus();
    else if (currentView === "cooking") mainContent = renderCookingWorkspace();
    else if (currentView === "numbers100") mainContent = renderStation100();
    else if (currentView === "mathlab") mainContent = renderMathLabStation();
    else if (currentView === "syllables") mainContent = renderSyllableStation();
    else if (currentView === "tracing") mainContent = renderTracingStation();
    else if (currentView === "stickers") mainContent = renderStickerAndWardrobeStation();
    else mainContent = renderMapLobby();

    appEl.innerHTML = `
      ${renderTopBar()}
      <main class="main-stage">
        ${mainContent}
      </main>
      ${renderBottomDock()}
      ${renderParentModal()}
      ${renderSleepyKitchenOverlay()}
    `;

    // Initialize interactive canvas if we are on a tracing view
    if (currentView === "cooking" && activeOrder && activeOrder.stageIndex === 4) {
      initTracingCanvas(
        "cooking-trace-canvas",
        activeOrder.traceCheckpoints,
        activeOrder.sauceColor,
        () => {
          if (!activeOrder || activeOrder.traceCompleted) return;
          activeOrder.traceCompleted = true;
          activeOrder.traceProgressIdx = activeOrder.traceCheckpoints.length;
          AUDIO.playFanfare();
          AUDIO.speakLetter(activeOrder.traceTarget, getEchoOpts(activeOrder.world.isJapaneseWorld));
          const completedOrderUid = activeOrder.orderUid;
          setTimeout(() => {
            if (activeOrder && activeOrder.orderUid === completedOrderUid && activeOrder.stageIndex === 4) {
              advanceCookingStage();
            }
          }, 1200);
        },
        activeOrder.traceProgressIdx || 0,
        (newProg) => {
          if (activeOrder) activeOrder.traceProgressIdx = newProg;
        }
      );
    } else if (currentView === "tracing") {
      const pts = DATA.getTracingPointsForTarget(tracingStationState.target);
      initTracingCanvas(
        "station-trace-canvas",
        pts,
        tracingStationState.sauceColor,
        () => {
          tracingStationState.progressIdx = pts.length;
          AUDIO.playFanfare();
          state.stars += 1;
          saveState();
          render();
          AUDIO.speakLetter(tracingStationState.target, getEchoOpts());
        },
        tracingStationState.progressIdx || 0,
        (newProg) => {
          tracingStationState.progressIdx = newProg;
        }
      );
    }
  }

  // =========================================================================
  // PUBLIC CONTROLLER ACTIONS
  // =========================================================================
  function navigate(viewId) {
    AUDIO.playTap();
    currentView = viewId;
    render();

    if (viewId === "numbers100") {
      AUDIO.speakNumber(station100State.selectedNum, getEchoOpts());
    } else if (viewId === "mathlab") {
      ensureMathLabProblem();
      const mp = mathLabState.problem;
      AUDIO.speakPhrase(mp.op === "+" ? "stage_math_add" : "stage_math_sub");
    } else if (viewId === "syllables") {
      const w = DATA.getWordById(syllableStationState.selectedWordId);
      AUDIO.speakWord(w, false);
    } else if (viewId === "tracing") {
      AUDIO.speakLetter(tracingStationState.target, getEchoOpts());
    }
  }

  function selectWorld(level) {
    AUDIO.playTap();
    const worldObj = DATA.WORLDS.find((w) => w.level === level) || DATA.WORLDS[0];
    if (!isWorldUnlocked(worldObj)) {
      // Gently offer Parent Gate unlock or tell how many stars are needed
      AUDIO.playGentleHint();
      openParentGate();
      return;
    }
    selectedWorldLevel = level;
    currentView = "world_menus";
    render();
    if (worldObj.isJapaneseWorld) {
      AUDIO.speakJapanesePhrase("konnichiwa");
    }
  }

  function quickPlaySurprise() {
    AUDIO.playFanfare();
    const unlockedWorlds = DATA.WORLDS.filter((w) => isWorldUnlocked(w));
    const chosenWorld = pickRandom(unlockedWorlds.length > 0 ? unlockedWorlds : [DATA.WORLDS[0]]);
    startCookingOrder(chosenWorld.level);
  }

  function repeatStageVoice() {
    AUDIO.playTap();
    announceCurrentStage();
  }

  function setCookingSauce(color) {
    if (!activeOrder) return;
    activeOrder.sauceColor = color;
    AUDIO.playTap();
    render();
  }

  function afterDishNextAction(nextType) {
    if (checkSleepyKitchenCondition()) {
      triggerSleepyKitchen();
      return;
    }
    if (nextType === "again" && activeOrder) {
      startCookingOrder(activeOrder.world.level);
    } else {
      navigate("map");
    }
  }

  // Station 100 handlers
  function setStation100Filter(filterKey) {
    AUDIO.playTap();
    station100State.filter = filterKey;
    render();
  }

  function selectNumber100(n) {
    AUDIO.playPop();
    station100State.selectedNum = n;
    state.mastery.numbers[n] = (state.mastery.numbers[n] || 0) + 1;

    if (station100State.quizTarget === n) {
      station100State.quizScore++;
      state.stars += 1;
      station100State.quizTarget = null;
      AUDIO.playFanfare();
    }
    saveState();
    render();
    AUDIO.speakNumber(n, getEchoOpts(n === 100));
  }

  function startFindNumberQuiz() {
    const f = station100State.filter;
    let pool = Array.from({ length: 100 }, (_, i) => i + 1);
    if (f === "1-20") pool = pool.filter((n) => n <= 20);
    else if (f === "21-50") pool = pool.filter((n) => n >= 21 && n <= 50);
    else if (f === "51-80") pool = pool.filter((n) => n >= 51 && n <= 80);
    else if (f === "81-100") pool = pool.filter((n) => n >= 81);
    else if (f === "tens") pool = pool.filter((n) => n % 10 === 0);

    const target = pickRandom(pool);
    station100State.quizTarget = target;
    render();
    AUDIO.speakNumber(target, getEchoOpts());
  }

  // Station 2 (Math Lab) handlers
  function setMathLabMode(modeKey) {
    AUDIO.playTap();
    mathLabState.mode = modeKey;
    mathLabState.problem = null;
    ensureMathLabProblem();
    render();
  }

  function nextMathLabProblem() {
    AUDIO.playTap();
    mathLabState.problem = null;
    ensureMathLabProblem();
    render();
  }

  function answerMathLab(chosenVal) {
    ensureMathLabProblem();
    const mp = mathLabState.problem;
    if (chosenVal === mp.answer) {
      mathLabState.answered = true;
      mathLabState.streak++;
      state.stars += 1;
      if (mp.op === "+") state.mastery.mathAddCorrect++;
      else state.mastery.mathSubCorrect++;
      saveState();
      AUDIO.playFanfare();
      AUDIO.speakMathEquation(mp.a, mp.op, mp.b, mp.answer, getEchoOpts().echoEn);
      render();
      setTimeout(() => {
        if (currentView === "mathlab" && mathLabState.answered) {
          nextMathLabProblem();
        }
      }, 3200);
    } else {
      AUDIO.playGentleHint();
      AUDIO.speakPhrase("try_again");
    }
  }

  // Station 3 (Syllables & A-Z) handlers
  function setSyllableCategory(catKey) {
    AUDIO.playTap();
    syllableStationState.category = catKey;
    if (catKey !== "az") {
      const first = getAllWords().find((w) => w.category === catKey);
      if (first) syllableStationState.selectedWordId = first.id;
    }
    render();
  }

  function selectSyllableWord(wordId) {
    AUDIO.playTap();
    syllableStationState.selectedWordId = wordId;
    const w = getAllWords().find((x) => x.id === wordId);
    render();
    if (w) AUDIO.speakSyllablesThenWord(w, getEchoOpts().echoEn);
  }

  function selectPhonicsLetter(letter) {
    AUDIO.playPop();
    syllableStationState.selectedLetter = letter;
    state.mastery.letters[letter] = (state.mastery.letters[letter] || 0) + 1;
    saveState();
    render();
    AUDIO.speakLetter(letter);
  }

  // Station 4 (Tracing Studio) handlers
  function setTracingMode(mode, defaultTarget) {
    AUDIO.playTap();
    tracingStationState.mode = mode;
    tracingStationState.target = defaultTarget;
    tracingStationState.progressIdx = 0;
    render();
    AUDIO.speakLetter(defaultTarget, getEchoOpts());
  }

  function selectTracingTarget(targetStr) {
    AUDIO.playTap();
    tracingStationState.target = targetStr;
    tracingStationState.progressIdx = 0;
    render();
    AUDIO.speakLetter(targetStr, getEchoOpts());
  }

  function setTracingStationSauce(color) {
    AUDIO.playTap();
    tracingStationState.sauceColor = color;
    render();
  }

  // Station 5 (Stickers & Wardrobe) handlers
  function updateWardrobe(key, val) {
    AUDIO.playPop();
    state.wardrobe[key] = val;
    saveState();
    render();
  }

  function setStickerCategory(cat) {
    AUDIO.playTap();
    stickerStationState.selectedCategory = cat;
    render();
  }

  function placeStickerOnScene(stkId, isUnlocked) {
    if (!isUnlocked) {
      AUDIO.playGentleHint();
      return;
    }
    AUDIO.playPop();
    state.placedStickers.push({
      uid: Date.now() + Math.random(),
      id: stkId,
      x: 14 + Math.floor(Math.random() * 72),
      y: 26 + Math.floor(Math.random() * 56)
    });
    if (state.placedStickers.length > 16) {
      state.placedStickers.shift();
    }
    saveState();
    render();
    AUDIO.speakSticker(stkId, getEchoOpts().echoEn);
  }

  function clearStickerCanvas() {
    AUDIO.playTap();
    state.placedStickers = [];
    saveState();
    render();
  }

  // Header & Parent Gate handlers
  function cycleLangMode() {
    AUDIO.playTap();
    const order = ["bilingual", "trilingual", "id_only"];
    const nextIdx = (order.indexOf(state.settings.langMode) + 1) % order.length;
    state.settings.langMode = order[nextIdx];
    saveState();
    render();
  }

  function toggleMusic() {
    const on = AUDIO.toggleBgm();
    if (on) AUDIO.playTap();
  }

  function openParentGate() {
    AUDIO.playTap();
    generateParentGateQuestion();
    parentModalOpen = true;
    parentUnlocked = false;
    render();
  }

  function closeParentGate() {
    if (activeRecorder && activeRecorder.state === "recording") {
      try {
        activeRecorder.stop();
      } catch (e) {}
    }
    activeRecordingSlot = null;
    parentModalOpen = false;
    render();
  }

  function verifyParentGate(chosenVal) {
    if (chosenVal === parentGateQuestion.ans) {
      AUDIO.playFanfare();
      parentUnlocked = true;
      render();
    } else {
      AUDIO.playGentleHint();
      generateParentGateQuestion();
      render();
    }
  }

  function updateSetting(key, val) {
    state.settings[key] = val;
    if (key === "sleepTimerMode") {
      sessionStartTime = Date.now();
      sessionRecipesCooked = 0;
    }
    saveState();
    render();
  }

  async function startVoiceRecording(slotKey) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Mikrofon tidak tersedia di browser ini.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingChunks = [];
      activeRecordingSlot = slotKey;
      activeRecorder = new MediaRecorder(stream);
      activeRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordingChunks.push(e.data);
      };
      activeRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordingChunks, { type: activeRecorder.mimeType || "audio/webm" });
        await AUDIO.saveCustomRecording(slotKey, blob);
        activeRecordingSlot = null;
        render();
      };
      activeRecorder.start();
      render();
    } catch (err) {
      alert("Izin mikrofon diperlukan untuk merekam suara Abi & Umi.");
    }
  }

  function stopVoiceRecording() {
    if (activeRecorder && activeRecorder.state === "recording") {
      activeRecorder.stop();
    }
  }

  async function removeVoiceRecording(slotKey) {
    await AUDIO.deleteCustomRecording(slotKey);
    render();
  }

  function addCustomParentWord() {
    const sylIn = document.getElementById("custom-syl-input");
    const enIn = document.getElementById("custom-en-input");
    if (!sylIn || !sylIn.value.trim()) return;

    const raw = sylIn.value.toUpperCase().trim();
    const syllables = raw
      .split(/[-\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (syllables.length === 0) return;

    const fullWord = syllables.join("");
    const newEntry = {
      id: "cust_" + fullWord.toLowerCase(),
      word: fullWord,
      syllables,
      en: enIn && enIn.value.trim() ? enIn.value.trim() : fullWord,
      emoji: "🌟",
      color: "#FF6F91",
      category: "keluarga",
      isIngredient: false
    };

    state.customWords = state.customWords.filter((w) => w.word !== fullWord);
    state.customWords.push(newEntry);
    DATA.registerCustomWords(state.customWords);
    saveState();
    AUDIO.playFanfare();
    AUDIO.speakSyllablesThenWord(newEntry, false);
    render();
  }

  function removeCustomParentWord(wordId) {
    state.customWords = state.customWords.filter((w) => w.id !== wordId);
    DATA.registerCustomWords(state.customWords);
    saveState();
    AUDIO.playTap();
    render();
  }

  function wakeKitchenParent() {
    isSleepyKitchenActive = false;
    sessionStartTime = Date.now();
    sessionRecipesCooked = 0;
    openParentGate();
  }

  function installPWA() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(() => {
      deferredInstallPrompt = null;
      render();
    });
  }

  function init() {
    DATA.registerCustomWords(state.customWords);
    AUDIO.initVoiceDB().then(() => {
      render();
    });

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      render();
    });

    // Handle hash shortcuts (#map, #numbers100, #mathlab)
    const hash = window.location.hash.replace("#", "");
    if (["map", "numbers100", "mathlab", "syllables", "tracing", "stickers"].includes(hash)) {
      currentView = hash;
    }

    render();
  }

  return {
    init,
    navigate,
    selectWorld,
    quickPlaySurprise,
    startCookingOrder,
    repeatStageVoice,
    handleSliceIngredient,
    handleAddTensBasket,
    handleAddUnitItem,
    setOvenDialValue,
    handleMathTokenTap,
    handleFeedAddedMathItem,
    handleMathAnswerChoice,
    toggleBubbleMode,
    handleBubbleTap,
    handleAutoMagicTrace,
    handleFeedCustomerBite,
    setCookingSauce,
    afterDishNextAction,
    setStation100Filter,
    selectNumber100,
    startFindNumberQuiz,
    setMathLabMode,
    nextMathLabProblem,
    answerMathLab,
    setSyllableCategory,
    selectSyllableWord,
    selectPhonicsLetter,
    setTracingMode,
    selectTracingTarget,
    setTracingStationSauce,
    updateWardrobe,
    setStickerCategory,
    placeStickerOnScene,
    clearStickerCanvas,
    cycleLangMode,
    toggleMusic,
    openParentGate,
    closeParentGate,
    verifyParentGate,
    updateSetting,
    startVoiceRecording,
    stopVoiceRecording,
    removeVoiceRecording,
    addCustomParentWord,
    removeCustomParentWord,
    wakeKitchenParent,
    installPWA
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  window.INARA_APP.init();
});
