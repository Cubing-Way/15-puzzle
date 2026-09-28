// Win check and move logic, recording finished solves, and the "Solved!" message
import { isSolved, moveSquare } from "../core/puzzle.js";
import { recordSolve } from "../solves/sidebar.js";
import { showSolvedMessage } from "./solvedMessage.js";

// Puzzle currently on screen
let currentPuzzle = null;
// Moves made in the current solve
let moveCount = 0;
// Time on the clock, in milliseconds
let elapsedTime = 0;
// setInterval handle while the clock is running
let timerInterval = null;

// Options panel checkboxes
let moveCounterEnabled = true;
let timerEnabled = true;
let highlightSolvedEnabled = true;

// True once the first move of this puzzle is made
let puzzleStarted = false;
// True while the clock is paused (by the user or because the puzzle is solved)
let timerPaused = false;
// True after loading a saved game; the clock resumes on the first move
let restoredGame = false;
// After a solve, the next move starts moves and time from zero
let resetStatsOnFirstMove = false;

// Undo/redo snapshots: { puzzle, moveCount, elapsedTime }
let puzzleHistory = [];
// Snapshot currently shown (-1 = none)
let historyIndex = -1;

// main.js function that saves the game in progress
let saveGame = () => {};


// ---- setup ----

// Builds the Options and Stats panels, resumes the saved game (if any) and returns the tile click handler
function createGame({ savedGame, onStateChange, onSolved }) {
    saveGame = onStateChange;

    createOptionsUI();
    createStatsUI();

    if (savedGame) {
        restoreSavedGame(savedGame);
    }

    // Draw the counter, timer, pause button and undo/redo state
    updateStatsUI();

    // Tile click handler: tries to move the clicked tile
    return clickedSquare => {
        // Current puzzle, its size, and the puzzle after the move
        const puzzle = currentPuzzle;
        const size = Math.sqrt(puzzle.length);
        const newPuzzle = moveSquare(puzzle, clickedSquare, size);

        // Same array back: the tile isn't in line with the blank
        if (newPuzzle === puzzle) return;

        // First move after a solve: count moves and time from zero
        if (resetStatsOnFirstMove) {
            resetStatsOnFirstMove = false;
            moveCount = 0;
            elapsedTime = 0;
            timerPaused = false;
            updateMoveCounter();
            updateTimerDisplay();
        }

        // First move of this puzzle: record the starting position so undo can go back to it
        if (!puzzleStarted) {
            puzzleStarted = true;

            if (puzzleHistory.length === 0) {
                resetHistory(puzzle);
            }
        }

        // Count the move
        incrementMoveCounter();

        // Start the clock (a restored game resumes on its first move)
        if (restoredGame) {
            restoredGame = false;
            timerPaused = false;
        }
        startTimer();

        // Store the state after the move so redo can restore it, then redraw
        addToHistory(newPuzzle);
        renderPuzzle(newPuzzle);

        if (isSolved(newPuzzle)) {
            // Solved: stop the clock and save the solve with its full history (used for replays)
            stopTimer();
            recordSolve(elapsedTime, size, { puzzle: newPuzzle, moveCount, elapsedTime, puzzleHistory, historyIndex });

            // Show "Solved!", then let main.js clear the save and set up the next board
            showSolvedMessage(true);
            onSolved();
        } else {
            // Not solved yet: hide the message and save progress
            showSolvedMessage(false);
            saveProgress();
        }
    };
}

// Resumes a saved game's moves, time and undo/redo history; the clock waits for the first move
function restoreSavedGame(saved) {
    moveCount = saved.moveCount || 0;
    elapsedTime = saved.elapsedTime || 0;
    timerPaused = true;
    restoredGame = true;
    puzzleStarted = moveCount > 0;

    // Rebuild the undo/redo history, skipping entries that can't be read
    puzzleHistory = Array.isArray(saved.puzzleHistory)
        ? saved.puzzleHistory.map(readSavedSnapshot).filter(Boolean)
        : [];
    historyIndex = saved.historyIndex ?? -1;
}

// Turns a saved history entry into a snapshot; null if it can't be read
function readSavedSnapshot(entry) {
    // Current format: { puzzle, moveCount, elapsedTime }
    if (Array.isArray(entry?.puzzle)) {
        return { puzzle: entry.puzzle, moveCount: entry.moveCount || 0, elapsedTime: entry.elapsedTime || 0 };
    }

    // Old format: just the puzzle array
    if (Array.isArray(entry)) {
        return { puzzle: entry, moveCount: 0, elapsedTime: 0 };
    }

    return null;
}

// Resets the game for a new puzzle; after a solve (keepLastSolve) the final moves,
// time and undo history stay on screen, and the next move starts moves and time from zero
function markNewPuzzle({ keepLastSolve = false } = {}) {
    stopTimer();

    if (!keepLastSolve) {
        moveCount = 0;
        elapsedTime = 0;
        puzzleHistory = [];
        historyIndex = -1;
    }

    // Fresh start: not paused, not restored, no moves yet
    timerPaused = false;
    restoredGame = false;
    puzzleStarted = false;
    resetStatsOnFirstMove = keepLastSolve;

    // Redraw everything and hide "Solved!"
    updateStatsUI();
    showSolvedMessage(false);
}

// Sends the game to main.js to be saved (nothing to resume before the board is drawn or once it's solved)
function saveProgress() {
    if (!currentPuzzle || isSolved(currentPuzzle)) return;

    saveGame({
        puzzle: currentPuzzle,
        moveCount,
        elapsedTime,
        timerPaused,
        puzzleHistory,
        historyIndex,
        lastSavedAt: Date.now()
    });
}


// ---- board ----

// Updates every tile's number and classes to match the puzzle
function renderPuzzle(puzzle) {
    // Remember what's on screen; the blank is the highest number
    currentPuzzle = puzzle;
    const blank = puzzle.length;

    puzzle.forEach((square, i) => {
        // Tile element at this position (skip if the board isn't built yet)
        const tile = document.getElementById(`Square-${i + 1}`);
        if (!tile) return;

        // Number (the blank shows nothing), blank class, solved highlight
        tile.textContent = square === blank ? "" : square;
        tile.classList.toggle("empty", square === blank);
        tile.classList.toggle("solved", highlightSolvedEnabled && square === i + 1);
    });

    // Enable or disable undo and redo
    updateHistoryButtons();
}


// ---- undo/redo ----

// Copy of a puzzle with the current moves and time
function snapshot(puzzle) {
    return { puzzle: [...puzzle], moveCount, elapsedTime };
}

// Adds a snapshot after a move (and drops any redo steps)
function addToHistory(puzzle) {
    puzzleHistory = puzzleHistory.slice(0, historyIndex + 1);
    puzzleHistory.push(snapshot(puzzle));
    historyIndex = puzzleHistory.length - 1;
    updateHistoryButtons();
}

// Starts a new history with this puzzle as the first snapshot
function resetHistory(puzzle) {
    puzzleHistory = [snapshot(puzzle)];
    historyIndex = 0;
    updateHistoryButtons();
}

// Undo (-1) or redo (+1): loads the neighbouring snapshot
function stepHistory(step) {
    const index = historyIndex + step;

    // Nothing before the first snapshot or after the last
    if (index < 0 || index >= puzzleHistory.length) return;

    // Stop the clock while swapping in the snapshot's puzzle, moves and time
    stopTimer();

    const state = puzzleHistory[index];
    historyIndex = index;
    moveCount = state.moveCount;
    elapsedTime = state.elapsedTime;

    // Redraw the counter, timer and board
    updateMoveCounter();
    updateTimerDisplay();
    renderPuzzle(state.puzzle);

    // Solved: keep the clock stopped; otherwise resume it if it was running
    const solved = isSolved(state.puzzle);
    showSolvedMessage(solved);

    if (solved) {
        timerPaused = true;
    } else {
        startTimer();
    }

    saveProgress();
}

// Disables undo at the start of the history and redo at the end
function updateHistoryButtons() {
    document.getElementById("undo-button").disabled = historyIndex <= 0;
    document.getElementById("redo-button").disabled = historyIndex >= puzzleHistory.length - 1;
}


// ---- move counter ----

// Shows or hides the move counter and writes the current count
function updateMoveCounter() {
    const counter = document.getElementById("move-counter");

    // Hidden while the option is off
    counter.style.display = moveCounterEnabled ? "block" : "none";
    counter.textContent = moveCount;
}

// Adds one move (only while the move counter option is on)
function incrementMoveCounter() {
    if (!moveCounterEnabled) return;

    moveCount++;
    updateMoveCounter();
}

// "Reset" in the Moves panel: sets the move count back to zero
function resetMoveCount() {
    moveCount = 0;
    updateMoveCounter();
}


// ---- timer ----

// Starts the clock unless it's already running, paused or turned off
function startTimer() {
    if (timerInterval || timerPaused || !timerEnabled) return;

    // Add 10 ms every 10 ms and redraw
    timerInterval = setInterval(() => {
        elapsedTime += 10;
        updateTimerDisplay();
    }, 10);

    // Update the Pause/Resume button
    updateTimerButton();
}

// Stops the clock (the elapsed time is kept)
function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    updateTimerButton();
}

// Pause/Resume button (does nothing while the timer option is off)
function toggleTimer() {
    if (!timerEnabled) return;

    timerPaused = !timerPaused;
    restoredGame = false;

    // Pause stops the clock; resume restarts it unless the puzzle is solved
    if (timerPaused) {
        stopTimer();
    } else if (currentPuzzle && !isSolved(currentPuzzle)) {
        startTimer();
    }

    // Update the button label and save
    updateTimerButton();
    saveProgress();
}

// "Reset" in the Time panel: zero the clock; it runs again on the next move
function resetTimer() {
    stopTimer();

    // Zero the time and clear the pause/restore flags
    elapsedTime = 0;
    timerPaused = false;
    restoredGame = false;

    // Redraw and save
    updateTimerDisplay();
    updateTimerButton();
    saveProgress();
}

// Sets the Pause/Resume label, disabled while the timer option is off
function updateTimerButton() {
    const button = document.getElementById("timer-pause-button");

    button.textContent = timerPaused ? "Resume" : "Pause";
    button.disabled = !timerEnabled;
}

// Writes the elapsed time as mm:ss
function updateTimerDisplay() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const pad = number => String(number).padStart(2, "0");

    document.getElementById("timer").textContent = `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

// Redraws the move counter, timer, Pause/Resume button and undo/redo buttons
function updateStatsUI() {
    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
    updateHistoryButtons();
}


// ---- panels ----

// Builds the Options panel (checkboxes)
function createOptionsUI() {
    // Three checkboxes, all on by default
    document.getElementById("options").innerHTML = `
        <h2>Options</h2>

        <label class="option">
            <input type="checkbox" id="move-counter-option" checked>
            <span>Move counter</span>
        </label>

        <label class="option">
            <input type="checkbox" id="timer-option" checked>
            <span>Timer</span>
        </label>

        <label class="option">
            <input type="checkbox" id="highlight-option" checked>
            <span>Highlight solved</span>
        </label>
    `;

    // Move counter checkbox: show or hide the counter (moves aren't counted while it's off)
    document.getElementById("move-counter-option").addEventListener("change", event => {
        moveCounterEnabled = event.target.checked;
        updateMoveCounter();
        saveProgress();
    });

    // Timer checkbox: off stops the clock; on resumes it only if the game has started and isn't paused
    document.getElementById("timer-option").addEventListener("change", event => {
        timerEnabled = event.target.checked;

        if (!timerEnabled) {
            stopTimer();
        } else if (currentPuzzle && !timerPaused && puzzleStarted) {
            startTimer();
        }

        saveProgress();
    });

    // Highlight checkbox: redraw so tiles in place gain or lose their highlight
    document.getElementById("highlight-option").addEventListener("change", event => {
        highlightSolvedEnabled = event.target.checked;

        if (currentPuzzle) {
            renderPuzzle(currentPuzzle);
        }
    });
}

// Builds the Moves and Time panels, wires their buttons and the keyboard shortcuts
function createStatsUI() {
    // Moves panel (undo, redo, reset) and Time panel (pause, reset)
    document.getElementById("stats").innerHTML = `
        <div class="stat">
            <div class="stat-info">
                <span class="stat-label">Moves</span>
                <span id="move-counter">0</span>
            </div>

            <div class="move-controls">
                <button id="undo-button" type="button" disabled aria-label="Undo" title="Undo">←</button>
                <button id="redo-button" type="button" disabled aria-label="Redo" title="Redo">→</button>
                <button id="reset-moves-button" type="button">Reset</button>
            </div>
        </div>

        <div class="stat">
            <div class="stat-info">
                <span class="stat-label">Time</span>
                <span id="timer">00:00</span>
            </div>

            <div class="timer-controls">
                <button id="timer-pause-button" type="button">Pause</button>
                <button id="timer-reset-button" type="button">Reset</button>
            </div>
        </div>
    `;

    // Button handlers
    document.getElementById("undo-button").addEventListener("click", () => stepHistory(-1));
    document.getElementById("redo-button").addEventListener("click", () => stepHistory(1));
    document.getElementById("reset-moves-button").addEventListener("click", resetMoveCount);
    document.getElementById("timer-pause-button").addEventListener("click", toggleTimer);
    document.getElementById("timer-reset-button").addEventListener("click", resetTimer);

    // Ctrl+Z / Ctrl+Y shortcuts
    createKeyboardControls();
}

// Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z or Ctrl+Y redo
function createKeyboardControls() {
    document.addEventListener("keydown", event => {
        // Don't take over keys while a form field has focus
        const target = event.target;
        const isTyping =
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement;

        // Only Ctrl shortcuts, and not while typing
        if (isTyping || !event.ctrlKey) return;

        const key = event.key.toLowerCase();

        if (key === "z" || key === "y") {
            event.preventDefault();
            stepHistory(key === "z" && !event.shiftKey ? -1 : 1);
        }
    });
}

// Used by main.js
export {
    createGame,
    renderPuzzle,
    markNewPuzzle
};
