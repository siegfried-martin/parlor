// Eldrow - Wordle Clone Game Logic

(function() {
    'use strict';

    // Word lists cache
    const wordLists = {};

    // Presets
    const PRESETS = {
        wordle: { wordLength: 5, boardCount: 1, maxGuesses: 6, name: 'Wordle' },
        quordle: { wordLength: 5, boardCount: 4, maxGuesses: 9, name: 'Quordle' },
        octordle: { wordLength: 5, boardCount: 8, maxGuesses: 13, name: 'Octordle' }
    };

    // Game state
    let state = {
        config: {
            wordLength: 5,
            boardCount: 1,
            maxGuesses: 6,
            mode: 'daily',
            preset: 'wordle'
        },
        phase: 'setup',
        targetWords: [],
        guesses: [],
        currentInput: '',
        selectedBoard: null,
        boards: [],
        won: false,
        animating: false
    };

    // DOM Elements
    const screens = {};
    let toastTimeout = null;

    // Initialize
    function init() {
        screens.setup = document.getElementById('setup-screen');
        screens.game = document.getElementById('game-screen');
        screens.results = document.getElementById('results-screen');

        setupEventListeners();
        updateSetupUI();
        showScreen('setup');
    }

    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if (screens[name]) {
            screens[name].classList.add('active');
        }
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Steppers
        document.querySelectorAll('.stepper-btn').forEach(btn => {
            btn.addEventListener('click', handleStepperClick);
        });

        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', handlePresetClick);
        });

        // Start buttons
        document.getElementById('start-daily')?.addEventListener('click', () => startGame('daily'));
        document.getElementById('start-practice')?.addEventListener('click', () => startGame('practice'));

        // Header buttons
        document.getElementById('new-game-btn')?.addEventListener('click', () => startGame(state.config.mode));
        document.getElementById('setup-btn')?.addEventListener('click', () => {
            state.phase = 'setup';
            showScreen('setup');
        });

        // Results buttons
        document.getElementById('copy-results-btn')?.addEventListener('click', copyResults);
        document.getElementById('play-again-btn')?.addEventListener('click', () => {
            state.phase = 'setup';
            showScreen('setup');
        });

        // Keyboard input
        document.addEventListener('keydown', handleKeyDown);

        // On-screen keyboard
        document.getElementById('keyboard')?.addEventListener('click', handleKeyboardClick);

        // Board selection for multi-board
        document.getElementById('boards-container')?.addEventListener('click', handleBoardClick);
    }

    function handleStepperClick(e) {
        const btn = e.target.closest('.stepper-btn');
        if (!btn || btn.disabled) return;

        const field = btn.dataset.field;
        const delta = parseInt(btn.dataset.delta);
        const limits = {
            wordLength: { min: 4, max: 8 },
            boardCount: { min: 1, max: 10 },
            maxGuesses: { min: 4, max: 15 }
        };

        const limit = limits[field];
        const newValue = state.config[field] + delta;

        if (newValue >= limit.min && newValue <= limit.max) {
            state.config[field] = newValue;
            state.config.preset = 'custom';

            // Auto-update guesses when boards change
            if (field === 'boardCount' || field === 'wordLength') {
                state.config.maxGuesses = suggestGuesses(state.config.wordLength, state.config.boardCount);
            }

            updateSetupUI();
        }
    }

    function handlePresetClick(e) {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;

        const presetId = btn.dataset.preset;
        const preset = PRESETS[presetId];

        if (preset) {
            state.config.wordLength = preset.wordLength;
            state.config.boardCount = preset.boardCount;
            state.config.maxGuesses = preset.maxGuesses;
            state.config.preset = presetId;
            updateSetupUI();
        }
    }

    function suggestGuesses(wordLength, boardCount) {
        const baseByLength = { 4: 5, 5: 5, 6: 5, 7: 6, 8: 6 };
        const base = baseByLength[wordLength] || 5;
        const boardBonus = Math.ceil(boardCount * 0.9);
        return Math.min(15, Math.max(4, base + boardBonus));
    }

    function updateSetupUI() {
        // Update stepper values
        document.getElementById('word-length-value').textContent = state.config.wordLength;
        document.getElementById('board-count-value').textContent = state.config.boardCount;
        document.getElementById('max-guesses-value').textContent = state.config.maxGuesses;

        // Update stepper buttons
        updateStepperButtons('wordLength', 4, 8);
        updateStepperButtons('boardCount', 1, 10);
        updateStepperButtons('maxGuesses', 4, 15);

        // Update suggested hint
        const suggested = suggestGuesses(state.config.wordLength, state.config.boardCount);
        const hint = document.getElementById('guesses-hint');
        if (hint) {
            hint.textContent = state.config.maxGuesses === suggested ? '(suggested)' : '';
        }

        // Update preset selection
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.preset === state.config.preset);
        });

        // Update daily badges
        Object.keys(PRESETS).forEach(presetId => {
            const badge = document.querySelector(`.preset-btn[data-preset="${presetId}"] .daily-badge`);
            if (badge) {
                const completion = isDailyComplete(presetId);
                badge.classList.toggle('completed', !!completion);
                badge.textContent = completion ? (completion.won ? 'Done' : 'X') : 'Daily';
            }
        });
    }

    function updateStepperButtons(field, min, max) {
        const value = state.config[field];
        document.querySelector(`.stepper-btn[data-field="${field}"][data-delta="-1"]`).disabled = value <= min;
        document.querySelector(`.stepper-btn[data-field="${field}"][data-delta="1"]`).disabled = value >= max;
    }

    // Word list loading
    async function loadWordList(length) {
        if (!wordLists[length]) {
            showLoading(true);
            try {
                const [answers, valid] = await Promise.all([
                    fetch(`/static/data/eldrow/answers_${length}.json`).then(r => r.json()),
                    fetch(`/static/data/eldrow/valid_${length}.json`).then(r => r.json())
                ]);
                wordLists[length] = {
                    answers: new Set(answers),
                    valid: new Set([...answers, ...valid])
                };
            } catch (err) {
                showToast('Failed to load word list');
                throw err;
            } finally {
                showLoading(false);
            }
        }
        return wordLists[length];
    }

    function showLoading(show) {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.classList.toggle('hidden', !show);
        }
    }

    // Daily seeding
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function mulberry32(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

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

    function getRandomWords(wordLength, boardCount) {
        const answers = Array.from(wordLists[wordLength].answers);
        const words = [];
        const used = new Set();

        while (words.length < boardCount) {
            const idx = Math.floor(Math.random() * answers.length);
            if (!used.has(idx)) {
                used.add(idx);
                words.push(answers[idx]);
            }
        }
        return words;
    }

    // Start game
    async function startGame(mode) {
        state.config.mode = mode;

        try {
            await loadWordList(state.config.wordLength);
        } catch {
            return;
        }

        // Get target words
        if (mode === 'daily') {
            state.targetWords = getDailyWords(
                state.config.preset,
                state.config.wordLength,
                state.config.boardCount
            );
        } else {
            state.targetWords = getRandomWords(
                state.config.wordLength,
                state.config.boardCount
            );
        }

        // Initialize boards
        state.boards = state.targetWords.map(() => ({
            solved: false,
            solvedOnGuess: null,
            letterStates: {}
        }));

        state.guesses = [];
        state.currentInput = '';
        state.selectedBoard = state.config.boardCount > 1 ? 0 : null;
        state.phase = 'playing';
        state.won = false;
        state.animating = false;

        showScreen('game');
        renderGame();
    }

    // Game rendering
    function renderGame() {
        const container = document.getElementById('boards-container');
        const isMulti = state.config.boardCount > 1;

        if (isMulti) {
            renderMultiBoard(container);
        } else {
            renderSingleBoard(container);
        }

        renderKeyboard();
        updateGuessCounter();
    }

    function renderSingleBoard(container) {
        container.innerHTML = '';
        const board = createBoardElement(0, false);
        container.appendChild(board);
    }

    function renderMultiBoard(container) {
        container.innerHTML = '';

        // Determine grid columns
        const count = state.config.boardCount;
        let cols = 2;
        if (count > 4) cols = 3;
        if (count > 6) cols = 4;

        const grid = document.createElement('div');
        grid.className = `multi-board-container cols-${cols}`;

        for (let i = 0; i < count; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'mini-board';
            wrapper.dataset.board = i;

            if (state.selectedBoard === i) wrapper.classList.add('selected');
            if (state.boards[i].solved) wrapper.classList.add('solved');

            const board = createBoardElement(i, true);
            wrapper.appendChild(board);

            const label = document.createElement('div');
            label.className = 'mini-board-label';
            label.textContent = state.boards[i].solved ?
                state.targetWords[i].toUpperCase() :
                `Board ${i + 1}`;
            wrapper.appendChild(label);

            grid.appendChild(wrapper);
        }

        container.appendChild(grid);

        // Input display
        const inputDisplay = document.createElement('div');
        inputDisplay.className = 'input-display';
        inputDisplay.id = 'input-display';
        for (let i = 0; i < state.config.wordLength; i++) {
            const span = document.createElement('span');
            span.textContent = state.currentInput[i] || '';
            inputDisplay.appendChild(span);
        }
        container.appendChild(inputDisplay);

        // Guess counter
        const counter = document.createElement('div');
        counter.className = 'guess-counter';
        counter.id = 'guess-counter';
        container.appendChild(counter);
    }

    function createBoardElement(boardIndex, mini) {
        const boardEl = document.createElement('div');
        boardEl.className = 'board';

        for (let row = 0; row < state.config.maxGuesses; row++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'board-row';
            rowEl.dataset.row = row;

            for (let col = 0; col < state.config.wordLength; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.col = col;

                // Fill in guessed letters
                if (row < state.guesses.length) {
                    const guess = state.guesses[row];
                    const result = evaluateGuess(guess, state.targetWords[boardIndex]);
                    cell.textContent = guess[col];
                    cell.classList.add(result[col], 'filled');
                } else if (row === state.guesses.length && !mini) {
                    // Current input row (only for single board)
                    cell.textContent = state.currentInput[col] || '';
                    if (state.currentInput[col]) cell.classList.add('filled');
                }

                rowEl.appendChild(cell);
            }

            boardEl.appendChild(rowEl);
        }

        return boardEl;
    }

    function updateGuessCounter() {
        const counter = document.getElementById('guess-counter');
        if (counter) {
            counter.textContent = `Guess ${state.guesses.length + 1} of ${state.config.maxGuesses}`;
        }
    }

    function updateInputDisplay() {
        const display = document.getElementById('input-display');
        if (!display) return;

        const spans = display.querySelectorAll('span');
        for (let i = 0; i < state.config.wordLength; i++) {
            spans[i].textContent = state.currentInput[i] || '';
        }
    }

    // Guess evaluation
    function evaluateGuess(guess, target) {
        const result = Array(guess.length).fill('absent');
        const targetChars = target.split('');
        const guessChars = guess.split('');

        // First pass: exact matches
        for (let i = 0; i < guess.length; i++) {
            if (guessChars[i] === targetChars[i]) {
                result[i] = 'correct';
                targetChars[i] = null;
                guessChars[i] = null;
            }
        }

        // Second pass: present but wrong position
        for (let i = 0; i < guess.length; i++) {
            if (guessChars[i] !== null) {
                const targetIdx = targetChars.indexOf(guessChars[i]);
                if (targetIdx !== -1) {
                    result[i] = 'present';
                    targetChars[targetIdx] = null;
                }
            }
        }

        return result;
    }

    // Keyboard
    function renderKeyboard() {
        const keyboard = document.getElementById('keyboard');
        if (!keyboard) return;

        const rows = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace']
        ];

        const keyboardState = getKeyboardState();

        keyboard.innerHTML = '';
        rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';

            row.forEach(key => {
                const keyEl = document.createElement('button');
                keyEl.className = 'key';
                keyEl.dataset.key = key;

                if (key === 'Enter' || key === 'Backspace') {
                    keyEl.classList.add('wide');
                    keyEl.textContent = key === 'Enter' ? 'ENTER' : '⌫';
                } else {
                    keyEl.textContent = key.toUpperCase();
                    if (keyboardState[key]) {
                        keyEl.classList.add(keyboardState[key]);
                    }
                }

                rowEl.appendChild(keyEl);
            });

            keyboard.appendChild(rowEl);
        });
    }

    function getKeyboardState() {
        // If multi-board with selection, show that board's state
        if (state.config.boardCount > 1 && state.selectedBoard !== null) {
            return state.boards[state.selectedBoard].letterStates;
        }

        // Otherwise aggregate across unsolved boards
        const aggregate = {};
        const priority = { correct: 3, present: 2, absent: 1 };

        for (const board of state.boards) {
            if (board.solved) continue;
            for (const [letter, boardState] of Object.entries(board.letterStates)) {
                if (!aggregate[letter] || priority[boardState] > priority[aggregate[letter]]) {
                    aggregate[letter] = boardState;
                }
            }
        }
        return aggregate;
    }

    function updateBoardLetterStates(boardIndex, guess, result) {
        const letterStates = state.boards[boardIndex].letterStates;
        const priority = { correct: 3, present: 2, absent: 1 };

        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i];
            const newState = result[i];

            if (!letterStates[letter] || priority[newState] > priority[letterStates[letter]]) {
                letterStates[letter] = newState;
            }
        }
    }

    // Input handling
    function handleKeyDown(e) {
        if (state.phase !== 'playing' || state.animating) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            submitGuess();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            deleteChar();
        } else if (/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            addChar(e.key.toLowerCase());
        }
    }

    function handleKeyboardClick(e) {
        if (state.phase !== 'playing' || state.animating) return;

        const key = e.target.closest('.key');
        if (!key) return;

        const keyValue = key.dataset.key;
        if (keyValue === 'Enter') {
            submitGuess();
        } else if (keyValue === 'Backspace') {
            deleteChar();
        } else {
            addChar(keyValue);
        }
    }

    function handleBoardClick(e) {
        const miniBoard = e.target.closest('.mini-board');
        if (!miniBoard) return;

        const boardIndex = parseInt(miniBoard.dataset.board);
        if (state.selectedBoard === boardIndex) {
            state.selectedBoard = null;
        } else {
            state.selectedBoard = boardIndex;
        }

        renderGame();
    }

    function addChar(char) {
        if (state.currentInput.length < state.config.wordLength) {
            state.currentInput += char;
            if (state.config.boardCount > 1) {
                updateInputDisplay();
            } else {
                updateCurrentRow();
            }
        }
    }

    function deleteChar() {
        if (state.currentInput.length > 0) {
            state.currentInput = state.currentInput.slice(0, -1);
            if (state.config.boardCount > 1) {
                updateInputDisplay();
            } else {
                updateCurrentRow();
            }
        }
    }

    function updateCurrentRow() {
        const board = document.querySelector('.board');
        if (!board) return;

        const row = board.querySelectorAll('.board-row')[state.guesses.length];
        if (!row) return;

        const cells = row.querySelectorAll('.cell');
        cells.forEach((cell, i) => {
            cell.textContent = state.currentInput[i] || '';
            cell.classList.toggle('filled', !!state.currentInput[i]);
        });
    }

    async function submitGuess() {
        const guess = state.currentInput.toLowerCase();

        if (guess.length !== state.config.wordLength) {
            showToast('Not enough letters');
            shakeCurrentRow();
            return;
        }

        const lists = wordLists[state.config.wordLength];
        if (!lists.valid.has(guess)) {
            showToast('Not in word list');
            shakeCurrentRow();
            return;
        }

        // Record guess
        state.guesses.push(guess);
        state.currentInput = '';

        // Evaluate and animate
        state.animating = true;

        // Evaluate against all boards
        for (let i = 0; i < state.boards.length; i++) {
            if (state.boards[i].solved) continue;

            const result = evaluateGuess(guess, state.targetWords[i]);
            updateBoardLetterStates(i, guess, result);

            if (result.every(r => r === 'correct')) {
                state.boards[i].solved = true;
                state.boards[i].solvedOnGuess = state.guesses.length;
            }
        }

        // Animate reveal
        await animateReveal(guess);

        state.animating = false;
        checkGameEnd();
        renderGame();
    }

    function shakeCurrentRow() {
        if (state.config.boardCount > 1) {
            const display = document.getElementById('input-display');
            if (display) {
                display.classList.add('shake');
                setTimeout(() => display.classList.remove('shake'), 500);
            }
        } else {
            const board = document.querySelector('.board');
            const row = board?.querySelectorAll('.board-row')[state.guesses.length];
            if (row) {
                row.classList.add('shake');
                setTimeout(() => row.classList.remove('shake'), 500);
            }
        }
    }

    async function animateReveal(guess) {
        const delay = 300;
        const flipDuration = 500;

        if (state.config.boardCount === 1) {
            // Single board animation
            const board = document.querySelector('.board');
            const rowIndex = state.guesses.length - 1;
            const row = board?.querySelectorAll('.board-row')[rowIndex];
            if (!row) return;

            const result = evaluateGuess(guess, state.targetWords[0]);
            const cells = row.querySelectorAll('.cell');

            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                cell.classList.add('flip');

                await new Promise(r => setTimeout(r, flipDuration / 2));
                cell.classList.add(result[i]);
                await new Promise(r => setTimeout(r, flipDuration / 2));

                if (i < cells.length - 1) {
                    await new Promise(r => setTimeout(r, delay - flipDuration));
                }
            }
        } else {
            // Multi-board: just wait a moment for visual feedback
            await new Promise(r => setTimeout(r, 500));
        }
    }

    function checkGameEnd() {
        if (state.boards.every(b => b.solved)) {
            state.phase = 'complete';
            state.won = true;
            showResults();
        } else if (state.guesses.length >= state.config.maxGuesses) {
            state.phase = 'complete';
            state.won = false;
            showResults();
        }
    }

    // Results
    function showResults() {
        showScreen('results');

        // Mark daily complete
        if (state.config.mode === 'daily') {
            markDailyComplete(state.config.preset, state.won, state.guesses.length);
        }

        // Title
        const title = document.getElementById('results-title');
        if (title) {
            if (state.won) {
                title.textContent = state.config.boardCount > 1 ? 'All Boards Solved!' : 'You Won!';
                title.className = 'results-title win';
            } else {
                title.textContent = state.config.boardCount > 1 ? 'Game Over' : 'Better Luck Next Time';
                title.className = 'results-title lose';
            }
        }

        // Summary
        const summary = document.getElementById('results-summary');
        if (summary) {
            if (state.won) {
                const boardText = state.config.boardCount > 1 ?
                    `all ${state.config.boardCount} boards` : 'the puzzle';
                summary.textContent = `Solved ${boardText} in ${state.guesses.length} guess${state.guesses.length !== 1 ? 'es' : ''}`;
            } else {
                const unsolvedCount = state.boards.filter(b => !b.solved).length;
                if (state.config.boardCount > 1) {
                    summary.textContent = `${unsolvedCount} board${unsolvedCount !== 1 ? 's' : ''} unsolved`;
                } else {
                    summary.textContent = `The word was: ${state.targetWords[0].toUpperCase()}`;
                }
            }
        }

        // Emoji grid
        const emojiGrid = document.getElementById('emoji-grid');
        if (emojiGrid) {
            emojiGrid.textContent = generateEmojiGrid();
        }
    }

    function generateEmojiGrid() {
        const guessText = state.won ? state.guesses.length : 'X';
        let header = '';

        if (state.config.preset !== 'custom') {
            const presetName = PRESETS[state.config.preset]?.name || state.config.preset;
            const modeLabel = state.config.mode === 'daily' ? ' Daily' : '';
            header = `Eldrow (${presetName}${modeLabel}) ${guessText}/${state.config.maxGuesses}\n\n`;
        } else {
            header = `Eldrow (${state.config.wordLength} letters, ${state.config.boardCount} board${state.config.boardCount > 1 ? 's' : ''}) ${guessText}/${state.config.maxGuesses}\n\n`;
        }

        if (state.config.boardCount === 1) {
            // Single board
            let grid = '';
            for (const guess of state.guesses) {
                const result = evaluateGuess(guess, state.targetWords[0]);
                grid += result.map(r => r === 'correct' ? '🟩' : r === 'present' ? '🟨' : '⬛').join('') + '\n';
            }
            return header + grid.trim();
        } else {
            // Multi-board
            let grids = '';
            const boardsPerRow = state.config.boardCount <= 4 ? 2 : (state.config.boardCount <= 6 ? 3 : 4);

            for (let row = 0; row < Math.ceil(state.config.boardCount / boardsPerRow); row++) {
                const startIdx = row * boardsPerRow;
                const endIdx = Math.min(startIdx + boardsPerRow, state.config.boardCount);
                const boardsInRow = [];

                for (let b = startIdx; b < endIdx; b++) {
                    boardsInRow.push(b);
                }

                // Build rows for this set of boards
                const maxRows = Math.max(...boardsInRow.map(b =>
                    state.boards[b].solved ? state.boards[b].solvedOnGuess : state.guesses.length
                ));

                for (let r = 0; r < maxRows; r++) {
                    const rowParts = [];
                    for (const b of boardsInRow) {
                        const board = state.boards[b];
                        if (board.solved && r >= board.solvedOnGuess) {
                            if (r === board.solvedOnGuess) {
                                // Show solve indicator
                                const num = board.solvedOnGuess;
                                rowParts.push(num <= 9 ? `${num}️⃣` + ' '.repeat(state.config.wordLength - 1) : `${num}`.padEnd(state.config.wordLength));
                            } else {
                                rowParts.push(' '.repeat(state.config.wordLength));
                            }
                        } else if (r < state.guesses.length) {
                            const guess = state.guesses[r];
                            const result = evaluateGuess(guess, state.targetWords[b]);
                            rowParts.push(result.map(res => res === 'correct' ? '🟩' : res === 'present' ? '🟨' : '⬛').join(''));
                        } else {
                            rowParts.push(' '.repeat(state.config.wordLength));
                        }
                    }
                    grids += rowParts.join('  ') + '\n';
                }
                grids += '\n';
            }

            return header + grids.trim();
        }
    }

    function copyResults() {
        const text = generateEmojiGrid() + '\n\nparlor.marstol.com/solo/eldrow';
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(() => {
            showToast('Failed to copy');
        });
    }

    // Local storage
    const STORAGE_KEY = 'eldrow_daily';

    function markDailyComplete(preset, won, guesses) {
        const today = new Date().toDateString();
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        data[`${preset}_${today}`] = { won, guesses, timestamp: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function isDailyComplete(preset) {
        const today = new Date().toDateString();
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return data[`${preset}_${today}`] || null;
    }

    // Toast
    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.remove('hidden');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 1500);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
