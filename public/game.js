(() => {
  'use strict';

  /* Every spelling round uses three letters, so little hands only ever juggle three tiles. */
  const WORDS = [
    { word: 'CAT', emoji: '🐱' },
    { word: 'DOG', emoji: '🐶' },
    { word: 'SUN', emoji: '☀️' },
    { word: 'BUS', emoji: '🚌' },
    { word: 'BEE', emoji: '🐝' },
    { word: 'COW', emoji: '🐄' },
    { word: 'PIG', emoji: '🐷' },
    { word: 'HAT', emoji: '🎩' },
    { word: 'CUP', emoji: '🥤' },
    { word: 'FOX', emoji: '🦊' },
    { word: 'OWL', emoji: '🦉' },
    { word: 'ANT', emoji: '🐜' },
    { word: 'EGG', emoji: '🥚' },
    { word: 'BOX', emoji: '📦' },
    { word: 'PIE', emoji: '🥧' },
    { word: 'JAM', emoji: '🍯' },
    { word: 'BED', emoji: '🛏️' },
    { word: 'KEY', emoji: '🔑' },
    { word: 'BUG', emoji: '🐛' },
    { word: 'TOY', emoji: '🧸' },
    { word: 'CAR', emoji: '🚗' },
    { word: 'BAT', emoji: '🦇' },
    { word: 'VAN', emoji: '🚐' },
    { word: 'BAG', emoji: '🎒' },
    { word: 'TEA', emoji: '🍵' }
  ];

  const COLORS = ['#ef5350', '#fb8c00', '#43a047', '#1e88e5', '#8e24aa', '#00897b'];
  const SOUND_KEY = 'littlespeller.sound';
  const NAME_KEY = 'littlespeller.name';
  const STARS_KEY = 'littlespeller.stars';

  /* Speech recognition often writes a letter name as an ordinary word. */
  const LETTER_NAMES = {
    ay: 'A', a: 'A', bee: 'B', be: 'B', cee: 'C', see: 'C', sea: 'C', dee: 'D',
    ee: 'E', e: 'E', ef: 'F', eff: 'F', gee: 'G', jee: 'G', aitch: 'H', haitch: 'H',
    eye: 'I', i: 'I', jay: 'J', kay: 'K', ell: 'L', el: 'L', em: 'M', en: 'N',
    oh: 'O', o: 'O', pea: 'P', pee: 'P', queue: 'Q', cue: 'Q', are: 'R', ar: 'R',
    ess: 'S', es: 'S', tea: 'T', tee: 'T', you: 'U', ewe: 'U', vee: 'V',
    doubleyou: 'W', ex: 'X', why: 'Y', wye: 'Y', zed: 'Z', zee: 'Z'
  };

  const NAME_FILLERS = new Set([
    'my', 'name', 'is', 'its', 'it', 'im', 'i', 'am', 'the', 'this', 'and',
    'a', 'call', 'me', 'are', 'you', 'hello', 'hi'
  ]);

  const NUM_WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six',
    'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'
  ];

  /* Praise is picked at random every time so it never sounds like a machine. */
  const PRAISE = [
    'Amazing', 'You did it', 'Superstar', 'Fantastic', 'Brilliant',
    'High five', 'So clever', 'Wonderful', 'Clever clogs', 'Hooray'
  ];
  const CHEERS = ['YAY!', 'WOW!', 'YES!', 'SUPER!'];
  const SUM_EMOJI = ['🍎', '⭐', '🐟', '🍓', '🎈', '🍪', '🐣', '🌸', '🚗', '🍌', '🦋'];
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const DECOY_COUNT = 3;
  const MODES = ['spell', 'math', 'word'];
  const MODE_LABELS = { spell: 'Spell a word', math: 'Numbers', word: 'Letter hunt' };

  /* Grown-ups can record these phrases in their own voice. */
  const VOICE_SLOTS = [
    { id: 'amazing', label: 'Amazing!' },
    { id: 'youdidit', label: 'You did it!' },
    { id: 'highfive', label: 'High five!' },
    { id: 'superstar', label: 'Superstar!' },
    { id: 'tryagain', label: 'Almost! Try again.' }
  ];
  const TRY_AGAIN_SLOT = 'tryagain';
  const DB_NAME = 'littlespeller';
  const DB_STORE = 'clips';
  const MAX_RECORD_MS = 5000;

  const el = {
    homeBtn: document.getElementById('homeBtn'),
    player: document.getElementById('player'),
    playerName: document.getElementById('playerName'),
    stars: document.getElementById('stars'),
    starCount: document.getElementById('starCount'),
    micBtn: document.getElementById('micBtn'),
    soundBtn: document.getElementById('soundBtn'),
    skipBtn: document.getElementById('skipBtn'),
    picture: document.getElementById('picture'),
    emoji: document.getElementById('emoji'),
    slots: document.getElementById('slots'),
    tray: document.getElementById('tray'),
    sum: document.getElementById('sum'),
    choices: document.getElementById('choices'),
    wordBoard: document.getElementById('wordBoard'),
    mathBoard: document.getElementById('mathBoard'),
    hint: document.getElementById('hint'),
    home: document.getElementById('homeScreen'),
    pickSurprise: document.getElementById('pickSurprise'),
    grownupBtn: document.getElementById('grownupBtn'),
    start: document.getElementById('startScreen'),
    nameForm: document.getElementById('nameForm'),
    nameInput: document.getElementById('nameInput'),
    nameMic: document.getElementById('nameMic'),
    nameStatus: document.getElementById('nameStatus'),
    grownup: document.getElementById('grownupScreen'),
    voiceList: document.getElementById('voiceList'),
    voiceStatus: document.getElementById('voiceStatus'),
    grownupClose: document.getElementById('grownupClose'),
    toast: document.getElementById('toast')
  };

  let deck = [];
  let current = null;
  let lastWord = '';
  let tiles = [];
  let filled = 0;
  let stars = 0;
  let celebrating = false;
  let cardOpen = false;
  let cardReturnHome = false;
  let playerName = '';
  let soundOn = true;
  let mode = 'spell';
  let screen = 'home';
  let sum = null;
  let grownupOpen = false;
  let transitionTimers = [];

  /* Timers that move a round along, so leaving a game can cancel them. */
  function later(fn, ms) {
    const id = window.setTimeout(() => {
      transitionTimers = transitionTimers.filter((item) => item !== id);
      fn();
    }, ms);
    transitionTimers.push(id);
    return id;
  }

  function clearTransitions() {
    transitionTimers.forEach((id) => window.clearTimeout(id));
    transitionTimers = [];
  }

  function isLocked() {
    return celebrating || cardOpen || grownupOpen || screen !== 'play';
  }

  /* ---------------------------------------------------------------- helpers */

  function shuffle(items) {
    const list = items.slice();
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function restart(node, className) {
    node.classList.remove(className);
    void node.offsetWidth;
    node.classList.add(className);
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      /* private mode: the setting just won't be remembered */
    }
  }

  let toastTimer = 0;

  function toast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.toast.classList.remove('is-on'), 4200);
  }

  /* ------------------------------------------------------------------ speech */

  let voice = null;

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    voice =
      voices.find(
        (v) =>
          /^en[-_]US/i.test(v.lang) &&
          /samantha|google us english|zira|aria|jenny|female/i.test(v.name)
      ) ||
      voices.find((v) => /^en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null;
  }

  if ('speechSynthesis' in window) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  function speak(text, rate = 0.9) {
    if (!soundOn || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) utterance.voice = voice;
      utterance.lang = (voice && voice.lang) || 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      /* speech is a bonus, never a requirement */
    }
  }

  function cancelSpeech() {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      /* ignore */
    }
  }

  function praiseSentence() {
    const base = pick(PRAISE);
    return playerName ? base + ', ' + playerName + '!' : base + '!';
  }

  /* Roughly how long the spoken line takes, so a recorded clip can follow it. */
  function speechMs(text) {
    const length = String(text || '').replace(/\s+/g, ' ').trim().length;
    return Math.min(2600, 420 + length * 52);
  }

  /* ------------------------------------------------------------------ sounds */

  let audioCtx = null;

  function audio() {
    if (!soundOn) return null;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!audioCtx) audioCtx = new AudioCtor();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, options) {
    const opts = options || {};
    const ctx = audio();
    if (!ctx) return;
    const start = ctx.currentTime + (opts.at || 0);
    const dur = opts.dur || 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(opts.gain || 0.14, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function chime() {
    tone(880, { dur: 0.14, gain: 0.12 });
    tone(1320, { dur: 0.2, gain: 0.09, at: 0.08 });
  }

  function boop() {
    tone(196, { dur: 0.15, type: 'triangle', gain: 0.1 });
  }

  function fanfare() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      tone(freq, { dur: 0.28, gain: 0.11, at: i * 0.11 });
    });
  }

  /* ------------------------------------------------------- microphone support */

  const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micSupported = Boolean(RecognitionCtor);

  let recognition = null;
  let listeningMode = null;
  let listenTimer = 0;
  let micBlocked = false;

  function micReady() {
    return micSupported && !micBlocked;
  }

  function ensureRecognition() {
    if (!micSupported) return null;
    if (recognition) return recognition;

    recognition = new RecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 6;

    recognition.onstart = () => setListening(true);

    recognition.onend = () => {
      window.clearTimeout(listenTimer);
      setListening(false);
      listeningMode = null;
    };

    recognition.onerror = (event) => {
      window.clearTimeout(listenTimer);
      setListening(false);
      const usedMode = listeningMode;
      listeningMode = null;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        micBlocked = true;
        if (el.micBtn) el.micBtn.hidden = true;
        updateHint();
        toast('The microphone is blocked — tap the buttons instead. A grown-up can allow the mic in browser settings.');
      } else if (event.error === 'no-speech') {
        toast("Didn't hear anything. Try again?");
      } else if (event.error === 'network') {
        toast('The microphone needs the internet. Tap the buttons instead.');
      } else if (usedMode === 'name') {
        setStatus('Try again, or ask a grown-up to type it.');
      }
    };

    recognition.onresult = (event) => {
      const result = event.results && event.results[0];
      if (!result) return;
      const usedMode = listeningMode;
      let handled = false;
      for (let i = 0; i < result.length && !handled; i += 1) {
        const heard = result[i].transcript;
        if (usedMode === 'name') {
          handled = acceptName(heard);
        } else if (usedMode === 'number') {
          handled = acceptNumber(heard);
        } else {
          handled = acceptSpelling(heard);
        }
      }
      if (!handled && usedMode === 'name') {
        setStatus("Didn't quite catch that — try again, or type it.");
      }
    };

    return recognition;
  }

  function setListening(on) {
    document.body.classList.toggle('is-listening', on);
    if (el.micBtn) {
      el.micBtn.setAttribute('aria-pressed', String(on));
      el.micBtn.classList.toggle('is-live', on);
    }
    if (el.nameMic) el.nameMic.classList.toggle('is-live', on);
    updateHint();
  }

  function startListening(nextMode) {
    if (!micSupported || micBlocked) {
      if (nextMode === 'letter') toast('This browser cannot listen — tap the buttons to play.');
      return;
    }
    const rec = ensureRecognition();
    if (!rec) return;
    if (listeningMode) {
      stopListening();
      return;
    }
    listeningMode = nextMode;
    cancelSpeech();
    try {
      rec.start();
    } catch (err) {
      /* already starting: the safety timer below still closes it */
    }
    window.clearTimeout(listenTimer);
    listenTimer = window.setTimeout(stopListening, 8000);
  }

  function stopListening() {
    window.clearTimeout(listenTimer);
    if (!recognition) {
      listeningMode = null;
      setListening(false);
      return;
    }
    try {
      recognition.stop();
    } catch (err) {
      listeningMode = null;
      setListening(false);
    }
  }

  function nameToLetter(token) {
    const clean = String(token || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return null;
    if (clean.length === 1) return clean.toUpperCase();
    return LETTER_NAMES[clean] || null;
  }

  function parseNumber(text) {
    const clean = String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return null;
    const tokens = clean.split(' ');
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (/^\d+$/.test(token)) return Number(token);
      const index = NUM_WORDS.indexOf(token);
      if (index !== -1) return index;
    }
    return null;
  }

  function placeableTile(letter) {
    return tiles.find((item) => !item.used && item.letter === letter) || null;
  }

  function acceptSpelling(text) {
    if (isLocked() || mode === 'math' || !current) return false;
    const clean = String(text || '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return false;

    /* The whole word, said out loud: fill in the rest and celebrate. */
    if (clean.replace(/ /g, '') === current.word.toLowerCase()) {
      while (filled < current.word.length) {
        const tile = placeableTile(current.word[filled]);
        if (!tile) break;
        place(tile);
      }
      return true;
    }

    const spoken = clean.split(' ').map(nameToLetter).filter(Boolean);
    if (!spoken.length) return false;

    const need = current.word[filled];
    if (spoken.indexOf(need) !== -1) {
      const tile = placeableTile(need);
      if (tile) {
        place(tile);
        return true;
      }
    }

    /* A letter was heard, just not the next one: nudge, never scold. */
    boop();
    nudgeNextSlot();
    return true;
  }

  function acceptNumber(text) {
    if (isLocked() || mode !== 'math' || !sum) return false;
    const value = parseNumber(text);
    if (value === null) return false;
    const button =
      Array.from(el.choices.children).find((node) => Number(node.dataset.value) === value) || null;
    answerSum(value, button);
    return true;
  }

  function extractName(text) {
    const words = String(text || '')
      .toLowerCase()
      .replace(/[^a-z'\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word && !NAME_FILLERS.has(word.replace(/'/g, '')));
    if (!words.length) return '';
    const first = words[0].replace(/[^a-z'-]/g, '').replace(/^[^a-z]+|[^a-z]+$/g, '');
    if (!first) return '';
    return (first.charAt(0).toUpperCase() + first.slice(1, 13)).replace(
      /(['-])([a-z])/g,
      (match, separator, letter) => separator + letter.toUpperCase()
    );
  }

  function acceptName(text) {
    const name = extractName(text);
    if (!name) return false;
    el.nameInput.value = name;
    setStatus('Hi ' + name + '!');
    speak('Hi ' + name + '!');
    return true;
  }

  /* ------------------------------------------------------------------- modes */

  function syncBoards() {
    const math = mode === 'math';
    el.mathBoard.hidden = !(math && screen === 'play');
    el.wordBoard.hidden = math || screen !== 'play';
    el.tray.classList.toggle('tray--hunt', mode === 'word');
  }

  function openHome(announce) {
    screen = 'home';
    clearTransitions();
    stopListening();
    cancelSpeech();
    celebrating = false;
    current = null;
    sum = null;
    deck = [];
    filled = 0;
    el.home.hidden = false;
    el.wordBoard.hidden = true;
    el.mathBoard.hidden = true;
    el.start.hidden = true;
    el.grownup.hidden = true;
    grownupOpen = false;
    cardOpen = false;
    updateHint();
    if (announce) {
      const who = playerName ? 'Hi ' + playerName + '! ' : 'Hi! ';
      speak(who + 'What shall we play?', 0.9);
    }
  }

  function startMode(next) {
    mode = MODES.indexOf(next) === -1 ? 'spell' : next;
    screen = 'play';
    clearTransitions();
    celebrating = false;
    filled = 0;
    current = null;
    sum = null;
    deck = [];
    stopListening();
    cancelSpeech();
    el.home.hidden = true;
    syncBoards();
    updateHint();
    nextRound();
  }

  function nextRound() {
    if (screen !== 'play') return;
    if (mode === 'math') {
      nextSum();
    } else {
      nextWord();
    }
  }

  /* -------------------------------------------------------------- word rounds */

  function nextWord() {
    if (!deck.length) {
      deck = shuffle(WORDS.filter((item) => item.word !== lastWord));
    }
    current = deck.pop();
    lastWord = current.word;
    startWordRound();
  }

  function startWordRound() {
    const letters = current.word.split('');
    celebrating = false;
    filled = 0;
    syncBoards();

    el.emoji.textContent = current.emoji;
    el.picture.classList.remove('is-happy');

    buildSlots(letters);
    buildTray(letters);

    if (!cardOpen) speak(current.word, 0.85);
  }

  function buildSlots(letters) {
    el.slots.replaceChildren();
    letters.forEach((letter, index) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.index = String(index);
      slot.setAttribute('role', 'button');
      slot.setAttribute('tabindex', '0');
      slot.setAttribute('aria-label', 'Letter box ' + (index + 1));
      slot.addEventListener('click', undoLast);
      slot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          undoLast();
        }
      });

      const ghost = document.createElement('span');
      ghost.className = 'slot__ghost';
      ghost.textContent = letter;

      const fill = document.createElement('span');
      fill.className = 'slot__letter';

      slot.append(ghost, fill);
      el.slots.append(slot);
    });
  }

  function decoyLetters(letters) {
    const pool = shuffle(ALPHABET.filter((letter) => letters.indexOf(letter) === -1));
    return pool.slice(0, DECOY_COUNT);
  }

  function buildTray(letters) {
    const hunt = mode === 'word';
    const pool = hunt ? letters.concat(decoyLetters(letters)) : letters.slice();
    el.tray.replaceChildren();

    tiles = shuffle(pool).map((letter, index) => {
      const color = COLORS[index % COLORS.length];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tile is-in';
      button.style.setProperty('--i', String(index));
      button.style.setProperty('--tile-color', color);
      button.textContent = letter;
      button.setAttribute('aria-label', 'Letter ' + letter);
      button.addEventListener('click', () => tapTile(button));
      button.addEventListener('animationend', () => button.classList.remove('is-in'));
      el.tray.append(button);
      return { el: button, letter, color, used: false };
    });
  }

  function nudgeNextSlot() {
    const slot = el.slots.children[filled];
    if (!slot || prefersReducedMotion()) return;
    restart(slot, 'is-next');
  }

  function tapTile(button) {
    if (isLocked() || !current) return;
    const tile = tiles.find((item) => item.el === button);
    if (!tile || tile.used) return;

    if (tile.letter === current.word[filled]) {
      place(tile);
    } else {
      reject(tile);
    }
  }

  function place(tile) {
    if (isLocked() || !current || filled >= current.word.length) return;
    tile.used = true;
    tile.el.classList.add('is-used');

    const slot = el.slots.children[filled];
    slot.dataset.tile = String(tiles.indexOf(tile));
    slot.style.setProperty('--slot-color', tile.color);
    slot.querySelector('.slot__letter').textContent = tile.letter;
    slot.classList.add('is-filled');
    filled += 1;

    chime();
    speak(tile.letter, 0.75);

    if (filled === current.word.length) {
      completeWord();
    } else {
      nudgeNextSlot();
    }
  }

  function reject(tile) {
    if (!prefersReducedMotion()) restart(tile.el, 'is-shake');
    boop();
    speak(tile.letter, 0.75);
    nudgeNextSlot();
  }

  function undoLast() {
    if (isLocked() || !current || filled === 0) return;
    filled -= 1;
    const slot = el.slots.children[filled];
    const tile = tiles[Number(slot.dataset.tile)];

    slot.classList.remove('is-filled');
    slot.querySelector('.slot__letter').textContent = '';
    slot.style.removeProperty('--slot-color');
    delete slot.dataset.tile;

    if (tile) {
      tile.used = false;
      tile.el.classList.remove('is-used');
    }
    boop();
  }

  /* -------------------------------------------------------------- sums (math) */

  function nextSum() {
    celebrating = false;
    syncBoards();

    const a = 1 + Math.floor(Math.random() * 4);
    const b = 1 + Math.floor(Math.random() * 4);
    sum = {
      a,
      b,
      total: a + b,
      emoji: pick(SUM_EMOJI)
    };

    renderSum();
    if (!cardOpen) speakQuestion();
  }

  function speakQuestion() {
    if (!sum) return;
    speak(NUM_WORDS[sum.a] + ' plus ' + NUM_WORDS[sum.b] + '. How many?', 0.85);
  }

  function groupNode(count) {
    const group = document.createElement('div');
    group.className = 'sum__group';
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'sum__dot';
      dot.textContent = sum.emoji;
      group.append(dot);
    }
    return group;
  }

  function opNode(text) {
    const op = document.createElement('span');
    op.className = 'sum__op';
    op.textContent = text;
    return op;
  }

  function renderSum() {
    el.sum.replaceChildren();
    el.sum.setAttribute('aria-label', sum.a + ' plus ' + sum.b);

    const question = document.createElement('div');
    question.className = 'sum__q';
    question.textContent = '?';

    el.sum.append(groupNode(sum.a), opNode('+'), groupNode(sum.b), opNode('='), question);
    renderChoices();
  }

  function renderChoices() {
    const options = [sum.total];
    const candidates = shuffle([
      sum.total - 1,
      sum.total + 1,
      sum.total - 2,
      sum.total + 2,
      sum.total + 3
    ]).filter((value) => value > 0 && value !== sum.total);

    while (options.length < 3 && candidates.length) {
      const value = candidates.pop();
      if (options.indexOf(value) === -1) options.push(value);
    }

    el.choices.replaceChildren();
    shuffle(options).forEach((value, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.style.setProperty('--tile-color', COLORS[index % COLORS.length]);
      button.dataset.value = String(value);
      button.textContent = String(value);
      button.setAttribute('aria-label', 'Answer ' + value);
      button.addEventListener('click', () => answerSum(value, button));
      el.choices.append(button);
    });
  }

  function answerSum(value, button) {
    if (isLocked() || !sum) return;
    if (value === sum.total) {
      if (button) button.classList.add('is-right');
      completeSum();
      return;
    }
    if (button) restart(button, 'is-wrong');
    boop();
    encourage();
  }

  /* --------------------------------------------------- grown-up voice clips */

  const clipUrls = {};
  let activeAudio = null;
  let dbPromise = null;
  let recorder = null;
  let recordChunks = [];
  let recordSlotId = null;
  let recordTimer = 0;
  let recordStream = null;

  function openDb() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      let request = null;
      try {
        request = window.indexedDB.open(DB_NAME, 1);
      } catch (err) {
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
    return dbPromise;
  }

  function storeClip(id, blob) {
    return openDb().then((db) => {
      if (!db) return;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).put(blob, id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        } catch (err) {
          resolve();
        }
      });
    });
  }

  function removeClip(id) {
    return openDb().then((db) => {
      if (!db) return;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        } catch (err) {
          resolve();
        }
      });
    });
  }

  function loadClips() {
    return openDb().then((db) => {
      if (!db) return null;
      return Promise.all(
        VOICE_SLOTS.map(
          (slot) =>
            new Promise((resolve) => {
              try {
                const tx = db.transaction(DB_STORE, 'readonly');
                const request = tx.objectStore(DB_STORE).get(slot.id);
                request.onsuccess = () => {
                  if (request.result) setClipUrl(slot.id, request.result);
                  resolve();
                };
                request.onerror = () => resolve();
              } catch (err) {
                resolve();
              }
            })
        )
      );
    });
  }

  function clearClipUrl(id) {
    if (!clipUrls[id]) return;
    try {
      window.URL.revokeObjectURL(clipUrls[id]);
    } catch (err) {
      /* ignore */
    }
    delete clipUrls[id];
  }

  function setClipUrl(id, blob) {
    clearClipUrl(id);
    try {
      clipUrls[id] = window.URL.createObjectURL(blob);
    } catch (err) {
      return;
    }
    if (grownupOpen) renderVoiceList();
  }

  function clipCount() {
    return Object.keys(clipUrls).length;
  }

  function praiseClipUrl() {
    const ids = VOICE_SLOTS.filter((slot) => slot.id !== TRY_AGAIN_SLOT && clipUrls[slot.id]).map(
      (slot) => slot.id
    );
    return ids.length ? clipUrls[pick(ids)] : null;
  }

  function stopClip() {
    if (!activeAudio) return;
    try {
      activeAudio.pause();
    } catch (err) {
      /* ignore */
    }
    activeAudio = null;
  }

  function playClip(url, fallback) {
    if (!soundOn || !url) return false;
    stopClip();
    try {
      const audio = document.createElement('audio');
      audio.src = url;
      audio.volume = 1;
      activeAudio = audio;
      const attempt = audio.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => {
          if (fallback) speak(fallback, 0.9);
        });
      }
      return true;
    } catch (err) {
      if (fallback) speak(fallback, 0.9);
      return false;
    }
  }

  /* Praise in the grown-up's own voice when a clip exists, otherwise the spoken one. */
  function cheer(prefix) {
    const clip = praiseClipUrl();
    const fallback = praiseSentence();
    if (!clip) {
      speak(prefix + ' ' + fallback, 0.9);
      return;
    }
    speak(prefix, 0.9);
    later(() => playClip(clip, fallback), speechMs(prefix));
  }

  function encourage() {
    const clip = clipUrls[TRY_AGAIN_SLOT];
    if (clip) {
      playClip(clip, 'Almost! Try again.');
    } else {
      speak('Almost! Try again.', 0.9);
    }
  }

  function setVoiceStatus(message) {
    if (el.voiceStatus) el.voiceStatus.textContent = message;
  }

  function recordingSlotId() {
    if (!recorder || recorder.state !== 'recording') return null;
    return recordSlotId;
  }

  function renderVoiceList() {
    if (!el.voiceList) return;
    el.voiceList.replaceChildren();
    const liveId = recordingSlotId();

    VOICE_SLOTS.forEach((slot) => {
      const row = document.createElement('div');
      row.className = 'voice';
      row.dataset.slot = slot.id;

      const label = document.createElement('span');
      label.className = 'voice__label';
      label.textContent = slot.label;

      const actions = document.createElement('div');
      actions.className = 'voice__actions';

      const recordButton = document.createElement('button');
      recordButton.type = 'button';
      const recording = liveId === slot.id;
      recordButton.className = 'voice__btn voice__btn--rec' + (recording ? ' is-recording' : '');
      recordButton.textContent = recording
        ? '\u23f9 Stop'
        : clipUrls[slot.id]
          ? '\u25cf Re-record'
          : '\u25cf Record';
      recordButton.setAttribute(
        'aria-label',
        (recording ? 'Stop recording ' : 'Record ') + slot.label
      );
      recordButton.addEventListener('click', () => toggleRecord(slot.id));

      const playButton = document.createElement('button');
      playButton.type = 'button';
      playButton.className = 'voice__btn';
      playButton.textContent = '\u25b6 Play';
      playButton.disabled = !clipUrls[slot.id];
      playButton.setAttribute('aria-label', 'Play ' + slot.label);
      playButton.addEventListener('click', () => playClip(clipUrls[slot.id], null));

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'voice__btn voice__btn--del';
      deleteButton.textContent = '\ud83d\uddd1';
      deleteButton.disabled = !clipUrls[slot.id];
      deleteButton.setAttribute('aria-label', 'Delete recording of ' + slot.label);
      deleteButton.addEventListener('click', () => {
        clearClipUrl(slot.id);
        removeClip(slot.id);
        renderVoiceList();
        setVoiceStatus('Removed. The robot voice will say this one.');
      });

      actions.append(recordButton, playButton, deleteButton);
      row.append(label, actions);
      el.voiceList.append(row);
    });
  }

  function stopRecording() {
    window.clearTimeout(recordTimer);
    if (!recorder || recorder.state !== 'recording') return;
    try {
      recorder.stop();
    } catch (err) {
      recorder = null;
      recordSlotId = null;
    }
  }

  function toggleRecord(slotId) {
    if (recordingSlotId()) {
      stopRecording();
      return;
    }
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof window.MediaRecorder === 'undefined'
    ) {
      setVoiceStatus("This browser can't record. Try Chrome, Edge or Safari.");
      return;
    }

    setVoiceStatus('Asking for the microphone…');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        recordStream = stream;
        recordSlotId = slotId;
        recordChunks = [];

        let options;
        if (
          window.MediaRecorder.isTypeSupported &&
          window.MediaRecorder.isTypeSupported('audio/mp4')
        ) {
          options = { mimeType: 'audio/mp4' };
        }

        recorder = options
          ? new window.MediaRecorder(stream, options)
          : new window.MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size) recordChunks.push(event.data);
        };

        recorder.onstop = () => {
          window.clearTimeout(recordTimer);
          const chunks = recordChunks.slice();
          recordChunks = [];
          const finishedId = recordSlotId;
          const type = (recorder && recorder.mimeType) || 'audio/webm';
          recorder = null;
          recordSlotId = null;

          if (recordStream) {
            try {
              recordStream.getTracks().forEach((track) => track.stop());
            } catch (err) {
              /* ignore */
            }
            recordStream = null;
          }

          const blob = new Blob(chunks, { type });
          if (finishedId && blob.size > 0) {
            setClipUrl(finishedId, blob);
            storeClip(finishedId, blob);
            setVoiceStatus('Saved! Tap \u25b6 Play to hear it.');
          } else {
            setVoiceStatus('Nothing was recorded — try again.');
          }
          renderVoiceList();
        };

        recorder.start();
        renderVoiceList();
        setVoiceStatus('Recording… say it now');
        window.clearTimeout(recordTimer);
        recordTimer = window.setTimeout(stopRecording, MAX_RECORD_MS);
      })
      .catch((err) => {
        recorder = null;
        recordSlotId = null;
        setVoiceStatus(
          err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
            ? 'Microphone blocked. Allow it in the browser settings, then try again.'
            : 'Could not start recording on this device.'
        );
        renderVoiceList();
      });
  }

  function openGrownups() {
    if (cardOpen) return;
    stopListening();
    cancelSpeech();
    stopClip();
    grownupOpen = true;
    el.grownup.hidden = false;
    renderVoiceList();
    setVoiceStatus(
      clipCount()
        ? 'Your voice is being used for the praise.'
        : 'Record a phrase and the game will use your voice.'
    );
  }

  function closeGrownups() {
    stopRecording();
    stopClip();
    grownupOpen = false;
    el.grownup.hidden = true;
  }

  /* ------------------------------------------------------------ celebration */

  function addStar() {
    stars += 1;
    if (el.starCount) el.starCount.textContent = String(stars);
    storageSet(STARS_KEY, String(stars));
    if (el.stars) restart(el.stars, 'is-bump');
  }

  function completeWord() {
    celebrating = true;
    addStar();
    el.picture.classList.add('is-happy');
    fanfare();
    confetti();
    showYay(pick(CHEERS), current.word);

    later(() => cheer(current.word + '!'), 420);
    window.setTimeout(() => {
      el.picture.classList.remove('is-happy');
    }, 1700);
    later(nextRound, 2600);
  }

  function completeSum() {
    celebrating = true;
    addStar();
    fanfare();
    confetti();
    showYay(pick(CHEERS), sum.a + ' + ' + sum.b + ' = ' + sum.total);

    const line = sum.a + ' plus ' + sum.b + ' is ' + NUM_WORDS[sum.total] + '.';
    later(() => cheer(line), 380);
    later(nextRound, 2800);
  }

  function showYay(big, caption) {
    const yay = document.createElement('div');
    yay.className = 'yay';

    const title = document.createElement('span');
    title.className = 'yay__word';
    title.textContent = big;

    const sub = document.createElement('span');
    sub.className = 'yay__sub';
    sub.textContent = caption;

    yay.append(title, sub);
    document.body.append(yay);
    window.setTimeout(() => yay.remove(), 1800);
  }

  function confetti() {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < 28; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = COLORS[i % COLORS.length];
      piece.style.animationDelay = Math.random() * 0.25 + 's';
      piece.style.setProperty('--x', Math.random() * 160 - 80 + 'px');
      piece.style.setProperty('--r', Math.random() * 720 - 360 + 'deg');
      document.body.append(piece);
      window.setTimeout(() => piece.remove(), 2300);
    }
  }

  /* ------------------------------------------------------------- name setup */

  function setStatus(message) {
    if (el.nameStatus) el.nameStatus.textContent = message;
  }

  function showPlayer(name) {
    if (!el.player) return;
    if (name) {
      el.player.hidden = false;
      el.playerName.textContent = name;
    } else {
      el.player.hidden = true;
    }
  }

  function openNameCard(firstTime) {
    cardOpen = true;
    cardReturnHome = screen === 'home';
    setListening(false);
    el.start.hidden = false;
    el.start.classList.toggle('is-first', Boolean(firstTime));
    el.nameInput.value = playerName || '';
    setStatus('');
    updateHint();
  }

  function closeNameCard() {
    cardOpen = false;
    el.start.hidden = true;
    setStatus('');
    updateHint();
  }

  function finishNameCard(raw) {
    playerName = extractName(raw) || '';
    storageSet(NAME_KEY, playerName);
    showPlayer(playerName);

    const returnHome = cardReturnHome;
    closeNameCard();

    if (returnHome) {
      openHome(true);
      return;
    }

    const who = playerName ? 'Hi ' + playerName + '!' : 'Hi!';
    speak(who, 0.9);
    window.setTimeout(() => {
      if (mode === 'math') {
        speakQuestion();
      } else if (current) {
        speak(current.word, 0.85);
      }
    }, 900);
  }

  function updateHint() {
    if (!el.hint) return;
    if (document.body.classList.contains('is-listening')) {
      el.hint.textContent =
        listeningMode === 'number' ? 'Listening… say the answer' : 'Listening… say a letter or the whole word';
      return;
    }
    if (screen === 'home') {
      el.hint.textContent = 'Pick a game to play';
      return;
    }
    if (mode === 'math') {
      el.hint.textContent = micReady()
        ? 'Count them, then tap or say the answer'
        : 'Count them, then tap the answer';
      return;
    }
    if (mode === 'word') {
      el.hint.textContent = micReady()
        ? 'Tap the letters in order — some tiles are extras'
        : 'Tap the letters in order. Some tiles are extra!';
      return;
    }
    el.hint.textContent = micReady()
      ? 'Tap a letter, or tap the mic and say the word out loud'
      : 'Tap a letter to fill the next box · tap a filled box to take it back';
  }

  /* ------------------------------------------------------------------ chrome */

  function applySound() {
    el.soundBtn.textContent = soundOn ? '🔊' : '🔇';
    el.soundBtn.setAttribute('aria-pressed', String(soundOn));
    el.soundBtn.setAttribute('aria-label', soundOn ? 'Sound on' : 'Sound off');
    storageSet(SOUND_KEY, soundOn ? 'on' : 'off');
  }

  el.soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    applySound();
    if (!soundOn) {
      cancelSpeech();
    } else {
      chime();
    }
  });

  el.skipBtn.addEventListener('click', () => {
    if (isLocked()) return;
    nextRound();
  });

  el.homeBtn.addEventListener('click', () => {
    if (cardOpen) return;
    openHome(true);
  });

  el.picture.addEventListener('click', () => {
    if (!current || cardOpen || mode === 'math') return;
    speak(current.word, 0.8);
    if (!prefersReducedMotion()) restart(el.picture, 'is-happy');
  });

  el.micBtn.addEventListener('click', () => {
    if (cardOpen || screen !== 'play') return;
    startListening(mode === 'math' ? 'number' : 'letter');
  });

  el.nameMic.addEventListener('click', () => {
    if (!micSupported) {
      setStatus("This browser can't listen — a grown-up can type the name.");
      return;
    }
    if (listeningMode === 'name') {
      stopListening();
      return;
    }
    setStatus('Listening… say your name');
    startListening('name');
  });

  el.nameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (listeningMode) stopListening();
    finishNameCard(el.nameInput.value);
  });

  el.player.addEventListener('click', () => {
    openNameCard(false);
  });

  Array.from(document.querySelectorAll('[data-mode]')).forEach((button) => {
    button.addEventListener('click', () => {
      chime();
      startMode(button.dataset.mode);
    });
  });

  el.pickSurprise.addEventListener('click', () => {
    const choice = pick(MODES);
    chime();
    toast('Surprise! ' + MODE_LABELS[choice]);
    startMode(choice);
  });

  /* Hold the grown-up button so a three-year-old can't wander in. */
  let holdTimer = 0;
  let lastGrownupOpen = 0;

  function beginHold(event) {
    if (event && event.pointerType === 'mouse' && event.button !== 0) return;
    window.clearTimeout(holdTimer);
    el.grownupBtn.classList.add('is-holding');
    holdTimer = window.setTimeout(() => {
      holdTimer = 0;
      el.grownupBtn.classList.remove('is-holding');
      lastGrownupOpen = Date.now();
      openGrownups();
    }, 1200);
  }

  function endHold() {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
    el.grownupBtn.classList.remove('is-holding');
  }

  el.grownupBtn.addEventListener('pointerdown', beginHold);
  el.grownupBtn.addEventListener('pointerup', endHold);
  el.grownupBtn.addEventListener('pointerleave', endHold);
  el.grownupBtn.addEventListener('pointercancel', endHold);
  el.grownupBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (grownupOpen || Date.now() - lastGrownupOpen < 1500) return;
    toast('Hold the button for a second to open grown-up settings.');
  });
  el.grownupBtn.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openGrownups();
    }
  });

  el.grownupClose.addEventListener('click', closeGrownups);

  document.addEventListener('keydown', (event) => {
    if (cardOpen || screen !== 'play' || isLocked()) return;

    if (mode === 'math') {
      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit < 0) return;
      const button =
        Array.from(el.choices.children).find((node) => Number(node.dataset.value) === digit) || null;
      if (button) answerSum(digit, button);
      return;
    }

    const letter = event.key.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return;
    const tile = placeableTile(letter);
    if (tile) place(tile);
  });

  /* -------------------------------------------------------------------- boot */

  soundOn = storageGet(SOUND_KEY) !== 'off';
  playerName = storageGet(NAME_KEY) || '';
  stars = Math.max(0, Number(storageGet(STARS_KEY)) || 0);

  applySound();
  if (el.starCount) el.starCount.textContent = String(stars);
  updateHint();

  if (!micSupported) {
    /* the name card keeps its mic button: tapping it explains the fallback */
    el.micBtn.hidden = true;
  }

  showPlayer(playerName);

  loadClips().then(() => {
    if (grownupOpen) renderVoiceList();
  });

  if (playerName) {
    openHome(true);
  } else {
    openNameCard(true);
  }
})();
