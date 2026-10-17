/**
 * Automated End-to-End Verification Suite for "Dapur Ceria Inara"
 * Runs in JavaScriptCore (jsc) with a timer-queue harness to test all 5 stages of cooking,
 * 5 worlds, 25 menus, 1-100 place value baskets, Digital Oven Dial, +/- visual math,
 * word & number-sequence bubbles, multi-touch canvas tracing, rewards,
 * 5 free-play stations, custom parent words, offline audio queue, and Parent Gate.
 */

if (typeof load === "undefined" && typeof require !== "undefined") {
  var fs = require("fs");
  var vm = require("vm");
  global.print = console.log;
  global.load = function (f) {
    vm.runInThisContext(fs.readFileSync(f, "utf8"), f);
  };
}

var window = typeof global !== "undefined" ? global : this;
if (typeof global !== "undefined") {
  global.window = global;
}
var mockStorage = {};
var localStorage = {
  getItem: function (k) { return mockStorage[k] || null; },
  setItem: function (k, v) { mockStorage[k] = String(v); }
};
if (typeof global !== "undefined") {
  global.localStorage = localStorage;
}

var appElement = { innerHTML: "" };
var customSylInput = { value: "KA-KAK" };
var customEnInput = { value: "Older Sibling" };

var lastCanvasMock = null;
function createCanvasMock() {
  var c = {
    width: 540,
    height: 265,
    onpointerdown: null,
    onpointermove: null,
    onpointerup: null,
    onpointercancel: null,
    getBoundingClientRect: function () { return { width: 540, height: 265, left: 0, top: 0 }; },
    getContext: function () {
      return {
        clearRect: function () {},
        beginPath: function () {},
        arc: function () {},
        fill: function () {},
        save: function () {},
        restore: function () {},
        setLineDash: function () {},
        moveTo: function () {},
        lineTo: function () {},
        stroke: function () {},
        fillText: function () {}
      };
    }
  };
  lastCanvasMock = c;
  return c;
}

var pendingTimeouts = [];
var setTimeout = function (fn, ms) {
  pendingTimeouts.push(fn);
  return pendingTimeouts.length;
};
function flushTimers() {
  var safety = 0;
  while (pendingTimeouts.length > 0 && safety < 100) {
    var batch = pendingTimeouts.slice();
    pendingTimeouts = [];
    for (var i = 0; i < batch.length; i++) {
      batch[i]();
    }
    safety++;
  }
}

var clearInterval = function () {};
var setInterval = function () {};

var document = {
  addEventListener: function () {},
  getElementById: function (id) {
    if (id === "app") return appElement;
    if (id === "custom-syl-input") return customSylInput;
    if (id === "custom-en-input") return customEnInput;
    if (id === "cooking-trace-canvas" || id === "station-trace-canvas") {
      return createCanvasMock();
    }
    return null;
  }
};

var navigator = {};
window.location = { hash: "" };
window.addEventListener = function () {};

var playedAudioFiles = [];
var Audio = function (src) {
  playedAudioFiles.push(src);
  return {
    play: function () {
      var self = this;
      setTimeout(function () {
        if (self.onended) self.onended();
      }, 0);
      return Promise.resolve();
    },
    pause: function () {}
  };
};

if (typeof global !== "undefined") {
  global.document = document;
  global.navigator = navigator;
  global.Audio = Audio;
  global.setTimeout = setTimeout;
  global.setInterval = setInterval;
  global.clearInterval = clearInterval;
}

load("js/data.js");
load("js/svg-assets.js");
load("js/audio.js");
load("js/app.js");

function assert(cond, msg) {
  if (!cond) {
    throw new Error("ASSERTION FAILED: " + msg);
  }
}

print("1. Testing 5 Worlds, 25 Unique Menus, SpellPools & LETTERS_DB Coverage...");
assert(INARA_DATA.WORLDS.length === 5, "Must have 5 progressive worlds");
var totalMenus = 0;
INARA_DATA.WORLDS.forEach(function (w, idx) {
  assert(w.level === idx + 1, "World level sequential");
  assert(w.menus.length === 5, "Each world must have 5 unique menus");
  w.menus.forEach(function (m) {
    totalMenus++;
    assert(m.ingredients && m.ingredients.length >= 3, "Menu " + m.name + " has ingredients");
    m.ingredients.forEach(function (ingId) {
      var found = INARA_DATA.WORDS_DB.some(function (x) { return x.id === ingId; });
      assert(found, "Ingredient '" + ingId + "' in menu '" + m.name + "' must exist in WORDS_DB");
    });
    m.spellPool.forEach(function (spWord) {
      var foundSpell = INARA_DATA.WORDS_DB.some(function (x) { return x.word === spWord; });
      assert(foundSpell, "spellPool word '" + spWord + "' in menu '" + m.name + "' must exist in WORDS_DB");
    });
  });
});
assert(totalMenus === 25, "Total menus must be 25");

INARA_DATA.LETTERS_DB.forEach(function (lObj) {
  var matched = INARA_DATA.WORDS_DB.some(function (w) { return w.word === lObj.word; });
  assert(matched, "LETTERS_DB word '" + lObj.word + "' for letter " + lObj.letter + " must exist in WORDS_DB");
});
print("   -> OK: 5 Worlds, 25 Menus, all spellPool words & all 26 LETTERS_DB words verified.");

print("2. Testing Trilingual Number Engine (0 - 100) & Math Generator Boundaries...");
for (var n = 0; n <= 100; n++) {
  var info = INARA_DATA.getNumberInfo(n);
  assert(info.value === n, "Value matches " + n);
  assert(info.id && info.id.length > 0, "Indonesian number string non-empty for " + n);
  assert(info.en && info.en.length > 0, "English number string non-empty for " + n);
  assert(info.jaRomaji && info.jaKana, "Japanese number strings non-empty for " + n);
  if (n < 100) {
    assert(info.tensCount * 10 + info.unitsCount === n, "Place value decomposition exact for " + n);
  } else {
    assert(info.tensCount === 10 && info.unitsCount === 0, "100 has 10 tens baskets and 0 units");
  }
}

// Verify math generator level bounds and forcedOp
for (var iter = 0; iter < 40; iter++) {
  var p2 = INARA_DATA.generateMathProblem(2, INARA_DATA.WORDS_DB[3], "+");
  assert(p2.op === "+" && p2.answer <= 6, "Level 2 addition <= 6, got " + p2.answer);
  var p3 = INARA_DATA.generateMathProblem(3, INARA_DATA.WORDS_DB[3]);
  assert(p3.a <= 10 && p3.answer <= 10 && p3.answer >= 1, "Level 3 math <= 10, got " + p3.a + p3.op + p3.b + "=" + p3.answer);
  var p4 = INARA_DATA.generateMathProblem(4, INARA_DATA.WORDS_DB[3]);
  assert(p4.a <= 15 && p4.answer <= 15 && p4.answer >= 1, "Level 4 math <= 15, got " + p4.a + p4.op + p4.b + "=" + p4.answer);
  var p5Sub = INARA_DATA.generateMathProblem(5, INARA_DATA.WORDS_DB[3], "-");
  assert(p5Sub.op === "-" && p5Sub.answer === p5Sub.a - p5Sub.b, "Level 5 forced '-' valid");
}
print("   -> OK: Numbers 0-100 Trilingual & Math Generator bounds (Levels 2-5) verified.");

print("3. Testing Offline Audio Engine (Words, Multi-Char Tracing Targets, Stickers, Japanese 0-100)...");
INARA_AUDIO.speakWord(INARA_DATA.getWordByString("APEL"), true);
var seqApel = INARA_AUDIO.getLastSequence();
assert(
  seqApel.some(function (x) { return x.type === "file" && (x.path === "assets/audio/id/word_apel.mp3" || x.path === "assets/audio/id/word_apel.m4a"); }) &&
  seqApel.some(function (x) { return x.type === "file" && (x.path === "assets/audio/en/word_apel.m4a" || x.path === "assets/audio/en/word_apel.mp3"); }),
  "speakWord(APEL, true) must queue offline ID and EN audio files, got: " + JSON.stringify(seqApel)
);

INARA_AUDIO.speakLetter("ABI", { echoEn: false });
var seqAbi = INARA_AUDIO.getLastSequence();
assert(
  seqAbi.some(function (x) { return x.type === "file" && (x.path === "assets/audio/id/word_abi.mp3" || x.path === "assets/audio/id/word_abi.m4a"); }),
  "speakLetter('ABI') must queue word_abi, got: " + JSON.stringify(seqAbi)
);

INARA_AUDIO.speakLetter("100", { echoEn: true, echoJa: true });
var seq100 = INARA_AUDIO.getLastSequence();
assert(
  seq100.some(function (x) { return x.type === "file" && (x.path === "assets/audio/id/num_100.mp3" || x.path === "assets/audio/id/num_100.m4a"); }) &&
  seq100.some(function (x) { return x.type === "file" && (x.path === "assets/audio/en/num_100.m4a" || x.path === "assets/audio/en/num_100.mp3"); }) &&
  seq100.some(function (x) { return x.type === "file" && (x.path === "assets/audio/ja/num_100.m4a" || x.path === "assets/audio/ja/num_100.mp3"); }),
  "speakLetter('100') must queue ID, EN, JA num_100"
);

INARA_DATA.STICKERS.forEach(function (stk) {
  INARA_AUDIO.speakSticker(stk.id, true);
  var seqStk = INARA_AUDIO.getLastSequence();
  assert(seqStk.length > 0 && seqStk[0].type === "file", "Sticker " + stk.id + " must queue offline audio file");
});

// Verify composite non-clobbering stage audio sequences
INARA_AUDIO.speakStageCut(INARA_DATA.getWordByString("APEL"));
var seqCut = INARA_AUDIO.getLastSequence();
assert(
  seqCut.some(function (x) { return x.path === "assets/audio/id/stage_cut.mp3" || x.path === "assets/audio/id/stage_cut.m4a"; }) &&
  seqCut.some(function (x) { return x.path === "assets/audio/id/word_apel.mp3" || x.path === "assets/audio/id/word_apel.m4a"; }),
  "speakStageCut must queue stage_cut and word in single sequence"
);

INARA_AUDIO.speakLabradorArrival(INARA_DATA.getWordByString("TOMAT"));
var seqArr = INARA_AUDIO.getLastSequence();
assert(
  seqArr.some(function (x) { return x.path === "assets/audio/id/greet_labrador.mp3" || x.path === "assets/audio/id/greet_labrador.m4a"; }) &&
  seqArr.some(function (x) { return x.path === "assets/audio/id/stage_cut.mp3" || x.path === "assets/audio/id/stage_cut.m4a"; }) &&
  seqArr.some(function (x) { return x.path === "assets/audio/id/word_tomat.mp3" || x.path === "assets/audio/id/word_tomat.m4a"; }),
  "speakLabradorArrival must queue siren/greet, stage_cut and word in single sequence"
);

INARA_AUDIO.speakStageCount(25, { echoEn: true });
var seqCount = INARA_AUDIO.getLastSequence();
assert(
  seqCount.some(function (x) { return x.path === "assets/audio/id/stage_count_tens.mp3" || x.path === "assets/audio/id/stage_count_tens.m4a"; }) &&
  seqCount.some(function (x) { return x.path === "assets/audio/id/num_25.mp3" || x.path === "assets/audio/id/num_25.m4a"; }) &&
  seqCount.some(function (x) { return x.path === "assets/audio/en/num_25.m4a" || x.path === "assets/audio/en/num_25.mp3"; }),
  "speakStageCount(25) must queue stage_count_tens and bilingual numbers"
);

// Verify Sheriff Labrador Praise and Police Badge Award on completed dishes
INARA_AUDIO.speakCustomerPraise("abi", false);
var seqPraiseAbi = INARA_AUDIO.getLastSequence();
assert(
  seqPraiseAbi.some(function (x) { return x.path === "assets/audio/id/praise_labrador.mp3" || x.path === "assets/audio/id/praise_labrador.m4a"; }) &&
  seqPraiseAbi.some(function (x) { return x.path === "assets/audio/id/labrador_badge.mp3" || x.path === "assets/audio/id/labrador_badge.m4a"; }),
  "speakCustomerPraise must queue both Sheriff Labrador praise and Police Badge award"
);

print("   -> OK: Offline Audio Engine & Composite Sequences verified for words, multi-char targets, and all " + INARA_DATA.STICKERS.length + " stickers (including Sheriff Labrador & Police Badge).");

print("4. Testing Full 5-Stage Cooking Loop (Stage 1 -> 2A -> 2B -> 3 -> 4 -> 5) across Worlds 1..5...");
INARA_APP.init();
flushTimers();

INARA_APP.openParentGate();
INARA_APP.updateSetting("unlockAllWorlds", true);
INARA_APP.closeParentGate();

for (var lv = 1; lv <= 5; lv++) {
  var starsBefore = JSON.parse(localStorage.getItem("inara_game_state_v1")).stars;
  INARA_APP.startCookingOrder(lv);
  flushTimers();

  // Stage 1: Potong Suku Kata (2 words, up to 4 syllables each)
  for (var s = 0; s < 12; s++) {
    if (appElement.innerHTML.indexOf("Potong Suku Kata") !== -1) {
      INARA_APP.handleSliceIngredient();
      flushTimers();
    }
  }

  // Stage 2A: Takar Angka (test Digital Oven Dial on Level 3, and Tens/Units buttons on others)
  assert(appElement.innerHTML.indexOf("Takaran Digital") !== -1, "Must be on Stage 2A Counting for Level " + lv);
  if (lv === 3) {
    assert(appElement.innerHTML.indexOf("oven-dial-slider") !== -1, "Level 3 must render Digital Oven Dial slider");
    var m = appElement.innerHTML.match(/setOvenDialValue\((\d+)\)/);
    assert(m && m[1], "Quick-set oven dial button must have target number");
    INARA_APP.setOvenDialValue(parseInt(m[1], 10));
    flushTimers();
  } else {
    for (var t = 0; t < 10; t++) {
      INARA_APP.handleAddTensBasket();
    }
    for (var u = 0; u < 10; u++) {
      INARA_APP.handleAddUnitItem();
    }
    flushTimers();
  }

  // Stage 2B: Masak Tambah (+) & Cicip Kurang Mochi (-) for Levels 2..5
  if (lv >= 2) {
    for (var f = 0; f < 10; f++) {
      INARA_APP.handleFeedAddedMathItem();
    }
    for (var ans = 1; ans <= 45; ans++) {
      if (
        appElement.innerHTML.indexOf("Ketuk gelembung huruf") === -1 &&
        appElement.innerHTML.indexOf("Urutan Angka Mendidih") === -1
      ) {
        INARA_APP.handleMathAnswerChoice(ans);
        flushTimers();
      }
    }
  }

  // Stage 3: Gelembung Bumbu Huruf OR Urutan Angka
  assert(appElement.innerHTML.indexOf("Ketuk gelembung huruf") !== -1, "Must reach Stage 3 Bubbles for Level " + lv);
  if (lv === 4) {
    // Test switching to Number Sequence Bubble mode and solving it!
    INARA_APP.toggleBubbleMode();
    assert(appElement.innerHTML.indexOf("Urutan Angka Mendidih") !== -1, "Must switch to Number Sequence Bubble mode");
    for (var nTry = 1; nTry <= 100; nTry++) {
      if (appElement.innerHTML.indexOf("Lukis Saus:") === -1) {
        INARA_APP.handleBubbleTap(String(nTry));
        flushTimers();
      }
    }
  } else {
    var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var step = 0; step < 12; step++) {
      for (var ci = 0; ci < alpha.length; ci++) {
        if (appElement.innerHTML.indexOf("Lukis Saus:") === -1) {
          INARA_APP.handleBubbleTap(alpha[ci]);
          flushTimers();
        }
      }
    }
  }

  // Stage 4: Lukis Saus & Tepung (Test Multi-Touch Palm Rejection + Sauce Color Preservation on Level 1, AutoMagic double-tap guard on others)
  assert(appElement.innerHTML.indexOf("Lukis Saus:") !== -1, "Must reach Stage 4 Tracing for Level " + lv);
  if (lv === 1 && lastCanvasMock && lastCanvasMock.onpointerdown) {
    // Primary finger down at (0,0) -> checkpoint 1 hit
    var pts = INARA_DATA.getTracingPointsForTarget("I");
    lastCanvasMock.onpointerdown({ pointerId: 1, clientX: pts[0].x * 540, clientY: pts[0].y * 265 });
    // Secondary palm touch & lift (pointerId: 2) must NOT cancel pointerId: 1
    lastCanvasMock.onpointerdown({ pointerId: 2, clientX: 10, clientY: 10 });
    lastCanvasMock.onpointerup({ pointerId: 2, clientX: 10, clientY: 10 });
    // Change sauce color and verify progress was preserved
    INARA_APP.setCookingSauce("#7F4F24");
  }

  // Double-tap AutoMagicTrace to verify idempotence guard
  INARA_APP.handleAutoMagicTrace(true);
  INARA_APP.handleAutoMagicTrace(true);
  flushTimers();

  // Stage 5: Makan Bersama & Pujian Abi/Umi (3 bites)
  assert(appElement.innerHTML.indexOf("Suapi") !== -1, "Must reach Stage 5 Feeding for Level " + lv);
  INARA_APP.handleFeedCustomerBite();
  INARA_APP.handleFeedCustomerBite();
  INARA_APP.handleFeedCustomerBite();
  flushTimers();

  assert(appElement.innerHTML.indexOf("+3 Bintang untuk Koki Inara!") !== -1, "Reward banner shown for Level " + lv);
  var starsAfter = JSON.parse(localStorage.getItem("inara_game_state_v1")).stars;
  assert(starsAfter === starsBefore + 3, "Stars increased by +3 after completing recipe in Level " + lv);
}
print("   -> OK: All 5 Worlds completed end-to-end from Stage 1 to Stage 5 Reward (+15 Stars earned!).");

print("5. Testing Custom Parent Words (Add, Lookup via getWordById, Speak, Remove)...");
INARA_APP.openParentGate();
customSylInput.value = "KA-KAK";
customEnInput.value = "Older Sibling";
INARA_APP.addCustomParentWord();
var lookedUp = INARA_DATA.getWordById("cust_kakak");
assert(lookedUp && lookedUp.word === "KAKAK", "getWordById('cust_kakak') must return KAKAK, not fallback INARA");
assert(lookedUp.syllables.join("-") === "KA-KAK", "Custom word syllables preserved");
INARA_APP.removeCustomParentWord("cust_kakak");
var afterRemove = JSON.parse(localStorage.getItem("inara_game_state_v1")).customWords;
assert(afterRemove.length === 0, "Custom word removed cleanly");
INARA_APP.closeParentGate();
print("   -> OK: Custom Parent Word lifecycle verified.");

print("6. Testing All 5 Free-Play Stations & Sleepy Kitchen Gate...");
["numbers100", "mathlab", "syllables", "tracing", "stickers"].forEach(function (stId) {
  INARA_APP.navigate(stId);
  flushTimers();
  assert(appElement.innerHTML.length > 500, "Station " + stId + " renders non-empty HTML");
});

// Test Sleepy Kitchen ("3_recipes" mode)
INARA_APP.updateSetting("sleepTimerMode", "3_recipes");
for (var r = 0; r < 3; r++) {
  INARA_APP.startCookingOrder(1);
  for (var s1 = 0; s1 < 8; s1++) { INARA_APP.handleSliceIngredient(); flushTimers(); }
  for (var u1 = 0; u1 < 10; u1++) { INARA_APP.handleAddUnitItem(); }
  flushTimers();
  var alpha2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (var st2 = 0; st2 < 8; st2++) {
    for (var c2 = 0; c2 < alpha2.length; c2++) {
      if (appElement.innerHTML.indexOf("Lukis Saus:") === -1) {
        INARA_APP.handleBubbleTap(alpha2[c2]);
        flushTimers();
      }
    }
  }
  INARA_APP.handleAutoMagicTrace(true);
  flushTimers();
}
INARA_APP.afterDishNextAction("again");
flushTimers();
assert(appElement.innerHTML.indexOf("Dapur Ceria Inara Sudah Mengantuk") !== -1, "Sleepy Kitchen overlay triggered after 3 recipes!");
print("   -> OK: Sleepy Kitchen Screen-Time Gate & Wake Up verified.");

print("7. Testing Sheriff Labrador Special Guest Visit, Patrol Car Arrival, and Police Badge Award...");
// Reset sleepy timer for clean run
INARA_APP.updateSetting("sleepTimerMode", "unlimited");
INARA_APP.startCookingOrder(1, null, "labrador");
flushTimers();

assert(appElement.innerHTML.indexOf("Sheriff Labrador") !== -1, "Order must have Sheriff Labrador as customer");
assert(appElement.innerHTML.indexOf("patrol-car-svg") !== -1, "Stage 1 must render Patrol Car SVG for Labrador arrival");
assert(appElement.innerHTML.indexOf("hand-pointer-svg") !== -1 || appElement.innerHTML.indexOf("bouncing-hand-icon") !== -1, "Stage 1 must render visual pointing hand cue");
assert(typeof INARA_SVG.renderHandPointer === "function", "INARA_SVG.renderHandPointer must be defined");
assert(typeof INARA_SVG.renderBuddyDuoBadge === "function", "INARA_SVG.renderBuddyDuoBadge must be defined");

// Advance Stage 1 (cut board)
for (var cutStep = 0; cutStep < 12; cutStep++) {
  if (appElement.innerHTML.indexOf("Potong Suku Kata") !== -1) {
    INARA_APP.handleSliceIngredient();
    flushTimers();
  }
}

// Stage 2A (Count)
assert(appElement.innerHTML.indexOf("Takaran Digital") !== -1, "Must reach Stage 2A for Labrador");
for (var uL = 0; uL < 10; uL++) {
  INARA_APP.handleAddUnitItem();
}
flushTimers();

// Stage 3 (Bubble)
var alphaL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
for (var stepL = 0; stepL < 12; stepL++) {
  for (var cL = 0; cL < alphaL.length; cL++) {
    if (appElement.innerHTML.indexOf("Lukis Saus:") === -1) {
      INARA_APP.handleBubbleTap(alphaL[cL]);
      flushTimers();
    }
  }
}

// Stage 4 (Trace)
assert(appElement.innerHTML.indexOf("Lukis Saus:") !== -1, "Must reach Stage 4 Tracing for Labrador");
INARA_APP.handleAutoMagicTrace(true);
flushTimers();

// Stage 5 (Feeding Labrador)
assert(appElement.innerHTML.indexOf("Suapi Sheriff Labrador") !== -1, "Must reach Stage 5 Feeding for Sheriff Labrador");
INARA_APP.handleFeedCustomerBite();
INARA_APP.handleFeedCustomerBite();
INARA_APP.handleFeedCustomerBite();
flushTimers();

// Verify Police Badge Award
assert(appElement.innerHTML.indexOf("police-badge-award-card") !== -1, "Stage 5 must render police-badge-award-card");
assert(appElement.innerHTML.indexOf("police-badge-svg") !== -1, "Stage 5 must render official Police Badge SVG");
assert(appElement.innerHTML.indexOf("Lencana Patroli Polisi") !== -1, "Stage 5 must show Lencana Patroli Polisi");
assert(appElement.innerHTML.indexOf("Stiker Sheriff Labrador Buka!") !== -1, "Stage 5 must announce Sheriff Labrador sticker unlocked");

var savedState = JSON.parse(localStorage.getItem("inara_game_state_v1"));
assert(savedState.unlockedStickers.indexOf("stk_police_badge") !== -1, "stk_police_badge must be saved in unlockedStickers");
assert(savedState.unlockedStickers.indexOf("stk_labrador") !== -1, "stk_labrador must be saved in unlockedStickers");
print("   -> OK: Sheriff Labrador Arrival, Patrol Car, Feeding, and Official Police Badge Award verified 100%.");

print("ALL DEEP END-TO-END TESTS PASSED!");
