# Eldrow: Customizable Wordle Clone

A single-player word guessing game with configurable word length, board count, and guess limits. Supports daily challenges and unlimited practice mode.

## Game Overview

Eldrow is a Wordle variant where players can customize:

- **Word length**: 4-8 letters
- **Board count**: 1-10 simultaneous puzzles
- **Guess limit**: 4-15 guesses (auto-suggested based on difficulty)

Three preset configurations mirror popular games:

- **Wordle**: 5 letters, 1 board, 6 guesses
- **Quordle**: 5 letters, 4 boards, 9 guesses
- **Octordle**: 5 letters, 8 boards, 13 guesses

Each preset has a daily challenge (deterministic, seeded by date) plus unlimited practice mode.

## URL Structure

```
/solo/eldrow              # Game page (setup screen → active game)
```

No instance IDs needed - all state is client-side.

## Architecture

Pure client-side game. Server only serves the static HTML template.

### Word Lists

Two dictionaries per word length (4-8), loaded as JSON:

- `answers_{n}.json` - Common words suitable as puzzle answers (~500-2500 per length)
- `valid_{n}.json` - All accepted guesses including obscure words (~2000-10000 per length)

**Source**: Derived from [skedwards88/word_lists](https://github.com/skedwards88/word_lists) which provides frequency-sorted common/uncommon word lists by length.

**Loading strategy**: Lazy-load only the needed length on game start. Cache in memory.

```javascript
const wordLists = {};

async function loadWordList(length) {
  if (!wordLists[length]) {
    const [answers, valid] = await Promise.all([
      fetch(`/static/data/eldrow/answers_${length}.json`).then((r) => r.json()),
      fetch(`/static/data/eldrow/valid_${length}.json`).then((r) => r.json()),
    ]);
    wordLists[length] = {
      answers: new Set(answers),
      valid: new Set([...answers, ...valid]),
    };
  }
  return wordLists[length];
}
```

### Daily Puzzle Seeding

Daily puzzles are deterministic using client-side seeded PRNG. Same date = same words for everyone.

```javascript
function getDailyWords(preset, wordLength, boardCount) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const seed = hashString(`${dateStr}-${preset}`);
  const rng = mulberry32(seed);

  const answers = Array.from(wordLists[wordLength].answers);
  const words = [];
  const used = new Set();

  while (words.length < boardCount) {
    const idx = Math.floor(rng() * answers.length);
    if (!used.has(idx)) {
      used.add(idx);
      words.push(answers[idx]);
    }
  }
  return words;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

## Game State

```javascript
const state = {
  // Configuration
  config: {
    wordLength: 5,
    boardCount: 1,
    maxGuesses: 6,
    mode: "daily", // 'daily' | 'practice'
    preset: "wordle", // 'wordle' | 'quordle' | 'octordle' | 'custom'
  },

  // Active game
  phase: "setup", // 'setup' | 'playing' | 'complete'
  targetWords: [], // One per board
  guesses: [], // Shared across all boards
  currentInput: "",
  selectedBoard: null, // Index or null (aggregate view)

  // Per-board results
  boards: [
    {
      solved: false,
      solvedOnGuess: null,
      letterStates: {}, // { 'a': 'correct', 'b': 'present', 'c': 'absent' }
    },
  ],
};
```

## Guess Evaluation

Standard Wordle coloring with proper duplicate letter handling:

```javascript
function evaluateGuess(guess, target) {
  const result = Array(guess.length).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");

  // First pass: mark exact matches (green)
  for (let i = 0; i < guess.length; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
      targetChars[i] = null;
      guessChars[i] = null;
    }
  }

  // Second pass: mark present but wrong position (yellow)
  for (let i = 0; i < guess.length; i++) {
    if (guessChars[i] !== null) {
      const targetIdx = targetChars.indexOf(guessChars[i]);
      if (targetIdx !== -1) {
        result[i] = "present";
        targetChars[targetIdx] = null;
      }
    }
  }

  return result; // ['correct', 'present', 'absent', ...]
}
```

## Suggested Guesses Formula

```javascript
function suggestGuesses(wordLength, boardCount) {
  const baseByLength = { 4: 5, 5: 5, 6: 5, 7: 6, 8: 6 };
  const base = baseByLength[wordLength];
  const boardBonus = Math.ceil(boardCount * 0.9);
  return Math.min(15, Math.max(4, base + boardBonus));
}

// Examples:
// 5 letters, 1 board  → 6  (Wordle)
// 5 letters, 4 boards → 9  (Quordle)
// 5 letters, 8 boards → 13 (Octordle)
```

## UI Layout

### Setup Screen

```
┌──────────────────────────────────────────────────────────────┐
│                          Eldrow                              │
│                                                              │
│  ┌────────────────────────────┐   ┌────────────────────────┐ │
│  │                            │   │       Presets          │ │
│  │  Word Length   ◀ [5] ▶     │   │                        │ │
│  │                            │   │  ┌──────────────────┐  │ │
│  │  Boards        ◀ [1] ▶     │   │  │ Wordle    [Daily]│  │ │
│  │                            │   │  │ 5 letters, 1 bd  │  │ │
│  │  Guesses       ◀ [6] ▶     │   │  └──────────────────┘  │ │
│  │                  (suggested)│   │  ┌──────────────────┐  │ │
│  │                            │   │  │ Quordle   [Daily]│  │ │
│  └────────────────────────────┘   │  │ 5 letters, 4 bds │  │ │
│                                   │  └──────────────────┘  │ │
│                                   │  ┌──────────────────┐  │ │
│  ┌─────────────┐ ┌─────────────┐  │  │ Octordle  [Daily]│  │ │
│  │ Start Daily │ │  Practice   │  │  │ 5 letters, 8 bds │  │ │
│  └─────────────┘ └─────────────┘  │  └──────────────────┘  │ │
│                                   └────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- Preset buttons fill all three values and enable "Daily" mode
- Modifying any value clears preset selection (becomes custom)
- Guesses field shows "(suggested)" when using auto value
- Daily completion tracked in localStorage per preset per date

### Game Screen - Single Board

```
┌──────────────────────────────────────────────────────────────┐
│  Eldrow                                   [New Game] [Setup] │
│                                                              │
│                     ┌───┬───┬───┬───┬───┐                    │
│                     │ S │ T │ A │ R │ E │                    │
│                     ├───┼───┼───┼───┼───┤                    │
│                     │ C │ R │ A │ N │ E │                    │
│                     ├───┼───┼───┼───┼───┤                    │
│                     │ P │ L │ A │ _ │ _ │  ← typing          │
│                     ├───┼───┼───┼───┼───┤                    │
│                     │   │   │   │   │   │                    │
│                     ├───┼───┼───┼───┼───┤                    │
│                     │   │   │   │   │   │                    │
│                     ├───┼───┼───┼───┼───┤                    │
│                     │   │   │   │   │   │                    │
│                     └───┴───┴───┴───┴───┘                    │
│                                                              │
│     ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐               │
│     │ Q │ W │ E │ R │ T │ Y │ U │ I │ O │ P │               │
│     ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┘               │
│     │ A │ S │ D │ F │ G │ H │ J │ K │ L │                   │
│     ├───┼───┼───┼───┼───┼───┼───┼───┴───┘                   │
│     │ ↵ │ Z │ X │ C │ V │ B │ N │ M │ ⌫ │                   │
│     └───┴───┴───┴───┴───┴───┴───┴───┴───┘                   │
└──────────────────────────────────────────────────────────────┘
```

### Game Screen - Multiple Boards

```
┌──────────────────────────────────────────────────────────────┐
│  Eldrow (4 boards)                        [New Game] [Setup] │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────┐ │
│  │ S T A R E   │  │ S T A R E   │  │ S T A R E   │  │✓PLANE│ │
│  │ C R A N E   │  │ C R A N E   │  │ C R A N E   │  │      │ │
│  │ _ _ _ _ _   │  │ P L A N E   │  │ _ _ _ _ _   │  │      │ │
│  │             │  │ _ _ _ _ _   │  │             │  │      │ │
│  │   [1]       │  │   [2]  ◄───│──│── selected  │  │ [4]  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────┘ │
│                                                              │
│  Typing: C R A _ _                           Guess 3 of 9    │
│                                                              │
│     ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐               │
│     │ Q │ W │ E │ R │ T │ Y │ U │ I │ O │ P │               │
│     └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘               │
│         (keyboard colors from selected board 2)              │
└──────────────────────────────────────────────────────────────┘
```

- Click board to select → keyboard shows that board's letter colors
- Click selected board to deselect → keyboard shows aggregate (best state per letter)
- Solved boards show ✓ + answer, grayed out
- Grid layout adapts: 2 cols for ≤4, 3 cols for 5-6, 4 cols for 7-10

### Keyboard Color Aggregation (no selection)

```javascript
function getAggregateKeyboardState(boards) {
  const aggregate = {};
  const priority = { correct: 3, present: 2, absent: 1 };

  for (const board of boards) {
    if (board.solved) continue;
    for (const [letter, state] of Object.entries(board.letterStates)) {
      if (!aggregate[letter] || priority[state] > priority[aggregate[letter]]) {
        aggregate[letter] = state;
      }
    }
  }
  return aggregate;
}
```

### Results / Game Over Screen

```
┌──────────────────────────────────────────────────────────────┐
│                        🎉 You Won!                           │
│                                                              │
│              Solved all 4 boards in 7 guesses                │
│                                                              │
│    ⬛🟨⬛⬛🟩   🟨⬛⬛🟩⬛   ⬛⬛🟨⬛⬛   🟩🟩🟩🟩🟩        │
│    ⬛🟩🟩⬛⬛   ⬛🟩🟩⬛🟩   ⬛🟨⬛⬛🟨   1️⃣              │
│    🟩🟩🟩🟩🟩   ⬛🟩🟩🟩🟩   🟨⬛⬛🟩⬛                     │
│    3️⃣           🟩🟩🟩🟩🟩   🟩🟩🟩🟩🟩                     │
│                 4️⃣           4️⃣                             │
│                                                              │
│          [ Copy Results ]    [ Play Again ]                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Share Text Format

"Copy Results" generates shareable emoji grid:

```
Eldrow (Quordle Daily) 7/9

🟨⬛⬛⬛🟩  🟨⬛⬛🟩⬛
⬛🟩🟩⬛⬛  ⬛🟩🟩⬛🟩
🟩🟩🟩🟩🟩  ⬛🟩🟩🟩🟩
3️⃣          🟩🟩🟩🟩🟩
            4️⃣

⬛⬛🟨⬛⬛  🟩🟩🟩🟩🟩
⬛🟨⬛⬛🟨  1️⃣
🟨⬛⬛🟩⬛
🟩🟩🟩🟩🟩
4️⃣

parlor.marstol.com/solo/eldrow
```

For custom configs: `Eldrow (6 letters, 3 boards) 8/10`
For losses: `Eldrow (Wordle Daily) X/6`

## Input Handling

```javascript
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitGuess();
  else if (e.key === "Backspace") deleteChar();
  else if (/^[a-zA-Z]$/.test(e.key)) addChar(e.key);
});

async function submitGuess() {
  const guess = state.currentInput.toLowerCase();

  if (guess.length !== state.config.wordLength) {
    showToast("Not enough letters");
    shakeInput();
    return;
  }

  const lists = await loadWordList(state.config.wordLength);
  if (!lists.valid.has(guess)) {
    showToast("Not in word list");
    shakeInput();
    return;
  }

  // Record guess and evaluate against all boards
  state.guesses.push(guess);
  state.currentInput = "";

  for (let i = 0; i < state.boards.length; i++) {
    if (state.boards[i].solved) continue;

    const result = evaluateGuess(guess, state.targetWords[i]);
    updateBoardLetterStates(i, guess, result);

    if (result.every((r) => r === "correct")) {
      state.boards[i].solved = true;
      state.boards[i].solvedOnGuess = state.guesses.length;
    }
  }

  checkGameEnd();
  render();
}

function checkGameEnd() {
  if (state.boards.every((b) => b.solved)) {
    state.phase = "complete";
    state.won = true;
  } else if (state.guesses.length >= state.config.maxGuesses) {
    state.phase = "complete";
    state.won = false;
  }
}
```

## Local Storage

Track daily completion to show checkmarks on setup:

```javascript
const STORAGE_KEY = "eldrow_daily";

function markDailyComplete(preset, won, guesses) {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  data[`${preset}_${today}`] = { won, guesses, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isDailyComplete(preset) {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  return data[`${preset}_${today}`] || null;
}
```

## File Structure

```
static/
├── css/
│   └── solo/
│       └── eldrow.css
├── js/
│   └── solo/
│       └── eldrow.js
└── data/
    └── eldrow/
        ├── answers_4.json
        ├── answers_5.json
        ├── answers_6.json
        ├── answers_7.json
        ├── answers_8.json
        ├── valid_4.json
        ├── valid_5.json
        ├── valid_6.json
        ├── valid_7.json
        └── valid_8.json

templates/
└── solo/
    └── eldrow.html
```

## CSS Color Variables

```css
:root {
  --cell-empty: #121213;
  --cell-border: #3a3a3c;
  --cell-absent: #3a3a3c;
  --cell-present: #b59f3b;
  --cell-correct: #538d4e;
  --key-bg: #818384;
  --key-text: #ffffff;
}
```

## Animations

### Cell Flip Reveal

After submitting a guess, cells reveal their colors one-by-one with a flip animation rather than all at once:

- Each cell flips after a staggered delay (roughly 300ms between cells)
- The flip is a 3D rotation on the X-axis (card flip effect)
- Color is revealed at the midpoint of the flip (when card is edge-on)
- Total reveal time for a 5-letter word: ~1.5 seconds
- User input is blocked during the reveal animation
- For multi-board games, all boards animate simultaneously (same timing per column)

### Other Animations

- **Invalid guess shake**: Row shakes horizontally when word not in list or too short
- **Toast notifications**: Slide down from top, auto-dismiss after 1.5s
- **Win celebration**: Brief bounce on solved board, optional confetti for full game win
- **Keyboard press**: Subtle scale-down on tap for tactile feedback

## Mobile Considerations

- Touch-friendly on-screen keyboard (min 44px tap targets)
- Boards scale down on smaller screens (smaller cells, tighter grid)
- Prevent zoom on double-tap via `touch-action: manipulation`
- Viewport height handling for keyboard visibility

## Implementation Checklist

- [ ] Setup screen with sliders/steppers for config
- [ ] Preset buttons with daily badge indicators
- [ ] Word list loading and caching
- [ ] Daily seeding with deterministic PRNG
- [ ] Practice mode with random words
- [ ] Single board game UI
- [ ] Multi-board grid layout (responsive)
- [ ] Guess input (physical + on-screen keyboard)
- [ ] Word validation against valid list
- [ ] Guess evaluation with correct duplicate handling
- [ ] Board-specific keyboard coloring on selection
- [ ] Aggregate keyboard coloring when no selection
- [ ] Solved board display (checkmark + word)
- [ ] Win/loss detection
- [ ] Results screen with emoji grid
- [ ] Copy to clipboard functionality
- [ ] localStorage for daily completion tracking
- [ ] Toast notifications for invalid input
- [ ] Shake animation for rejected guesses
- [ ] Cell flip animation on reveal
