// Win check, move logic, solve saving, dark-mode switch and the "Solved!" message
import { isSolved } from "../core/simulator.js";
import { moveSquare } from "../core/puzzle.js";
import { storeTimeForAvg } from "../solves/sidebar.js";
import { createThemeToggle } from "../theme/darkMode.js";
import { showSolvedMessage } from "./solvedMessage.js";

// Moves made in the current solve
let moveCount = 0;
// setInterval handle while the clock is running
let timerInterval = null;
// Time on the clock
let elapsedTime = 0; // milliseconds
// Puzzle currently on screen
let currentPuzzle = null;

// "Move counter" option
let moveCounterEnabled = true;
// "Timer" option
let timerEnabled = true;
// "Highlight solved" option
let highlightSolvedEnabled = true;

// True once the first move of this puzzle is made
let puzzleStarted = false;
// True while the clock is paused (by the user or because the puzzle is solved)
let timerPaused = false;
// True after loading a saved game; the clock resumes on the first move
let restoredGame = false;
// Set when a new puzzle keeps the last time (not read anywhere yet)
let resetTimerOnFirstMove = false;
// After a solve, the next move starts moves and time from zero
let resetStatsOnFirstMove = false;

// Undo/redo snapshots: { puzzle, moveCount, elapsedTime }
let puzzleHistory = [];
// Snapshot currently shown (-1 = none)
let historyIndex = -1;
// main.js function that saves the game
let stateChangeCallback = null;

// Updates every tile's number and classes to match the puzzle
function renderPuzzle(puzzle) {
    // Remember what's on screen
    currentPuzzle = puzzle;

    // Update each tile element
    puzzle.forEach((square, i) => {
        // Tile element at this position
        const squareDiv = document.getElementById("Square-" + (i + 1));

        // Skip if the board isn't built yet
        if (!squareDiv) return;

        // Number (the blank shows nothing), blank class, solved highlight
        squareDiv.textContent = square === puzzle.length ? "" : square;
        squareDiv.classList.toggle("empty", square === puzzle.length);
        squareDiv.classList.toggle(
            "solved",
            highlightSolvedEnabled && square === i + 1
        );
    });

    // Enable or disable undo and redo
    updateHistoryButtons();
}

// Sends the game state to main.js to be saved (null when there's nothing to save)
function saveState() {
    // No puzzle, or already solved: nothing to resume later
    if (!currentPuzzle || isSolved(currentPuzzle)) {
        stateChangeCallback?.(null);
        return;
    }

    // Moves, time, pause state and a copy of the history
    stateChangeCallback?.({
        moveCount,
        elapsedTime,
        timerPaused,
        puzzleHistory: puzzleHistory.map(state => ({
            puzzle: [...state.puzzle],
            moveCount: state.moveCount,
            elapsedTime: state.elapsedTime
        })),
        historyIndex,
        lastSavedAt: Date.now()
    });
}

// Adds a snapshot after a move (and drops any redo steps)
function addToHistory(puzzle) {
    // Remove redo states when a new move is made.
    puzzleHistory = puzzleHistory.slice(0, historyIndex + 1);

    // Save the puzzle with its move count and time
    puzzleHistory.push({
        puzzle: [...puzzle],
        moveCount,
        elapsedTime
    });

    // Point at the newest snapshot
    historyIndex = puzzleHistory.length - 1;

    // Refresh undo/redo
    updateHistoryButtons();
}

// Starts a new history with this puzzle as the first snapshot
function resetHistory(puzzle) {
    // Only the starting position
    puzzleHistory = [{
        puzzle: [...puzzle],
        moveCount,
        elapsedTime
    }];

    // Point at it
    historyIndex = 0;

    // Refresh undo/redo
    updateHistoryButtons();
}

// Disables undo at the start of the history and redo at the end
function updateHistoryButtons() {
    // Buttons in the Moves panel
    const undoButton = document.getElementById("undo-button");
    const redoButton = document.getElementById("redo-button");

    // Nothing before the first snapshot
    if (undoButton) {
        undoButton.disabled = historyIndex <= 0;
    }

    // Nothing after the last snapshot
    if (redoButton) {
        redoButton.disabled = historyIndex >= puzzleHistory.length - 1;
    }
}

// Loads a history snapshot (for undo/redo); returns false if there isn't one
function restoreHistoryState(state, setPuzzle) {
    // No snapshot to restore
    if (!state) return false;

    // Stop the clock while swapping state
    stopTimer();

    // Copy of the snapshot's puzzle
    const puzzle = [...state.puzzle];

    // Restore the puzzle, time and moves
    currentPuzzle = puzzle;
    elapsedTime = state.elapsedTime;
    moveCount = state.moveCount;

    // Tell main.js about the puzzle
    setPuzzle(puzzle);

    // Redraw the counter, timer and board
    updateMoveCounter();
    updateTimerDisplay();
    renderPuzzle(puzzle);

    // Is the restored position solved?
    const solved = isSolved(puzzle);

    // Show or hide the message
    showSolvedMessage(solved);

    // Solved: keep the clock stopped; otherwise resume if it was running
    if (solved) {
        timerPaused = true;
    } else if (!timerPaused && timerEnabled) {
        startTimer();
    }

    return true;
}

// Restores a saved game (if any) and returns the function that handles tile clicks
function createMoveHandler({
    getPuzzle,
    setPuzzle,
    getSize,
    container,
    onSolved,
    onStateChange,
    initialState
}) {
    // Where to send save requests
    stateChangeCallback = onStateChange || null;

    // Resume a saved game
    if (initialState) {
        // Saved moves and time; the clock waits for the first move
        moveCount = initialState.moveCount || 0;
        elapsedTime = initialState.elapsedTime || 0;
        timerPaused = true;
        restoredGame = true;

        // Rebuild the undo/redo history
        if (Array.isArray(initialState.puzzleHistory)) {
            puzzleHistory = initialState.puzzleHistory.map(state => {
                // Current format: { puzzle, moveCount, elapsedTime }
                if (state && Array.isArray(state.puzzle)) {
                    return {
                        puzzle: [...state.puzzle],
                        moveCount: state.moveCount || 0,
                        elapsedTime: state.elapsedTime || 0
                    };
                }

                // Compatibility with the old history format.
                if (Array.isArray(state)) {
                    return {
                        puzzle: [...state],
                        moveCount: 0,
                        elapsedTime: 0
                    };
                }

                // Unknown entry: removed by the filter below
                return null;
            }).filter(Boolean);
        } else {
            // No history saved
            puzzleHistory = [];
        }

        // Saved history position; "started" if moves were made
        historyIndex = initialState.historyIndex ?? -1;
        puzzleStarted = moveCount > 0;

        // Redraw the counter, timer, pause button and undo/redo
        updateMoveCounter();
        updateTimerDisplay();
        updateTimerButton();
        updateHistoryButtons();
    }

    // Click handler: tries to move the clicked tile (currSquare is unused)
    return (clickedSquare, currSquare) => {
        // Current puzzle, size, and the puzzle after the move
        const puzzle = getPuzzle();
        const size = getSize();
        const newPuzzle = moveSquare(puzzle, clickedSquare, size);

        // Same array back: the tile isn't in line with the blank
        if (newPuzzle === puzzle) return;

        // First move after a solve: count moves and time from zero
        if (resetStatsOnFirstMove) {
            moveCount = 0;
            elapsedTime = 0;

            // Clear the pending-reset flags
            resetStatsOnFirstMove = false;
            resetTimerOnFirstMove = false;

            // Let the clock run
            timerPaused = false;

            // Show the zeroed counter and timer
            updateMoveCounter();
            updateTimerDisplay();
        }

        // First move of this puzzle
        if (!puzzleStarted) {
            puzzleStarted = true;

            // Record the starting position so undo can go back to it
            if (puzzleHistory.length === 0) {
                resetHistory(puzzle);
            }
        }

        // Tell main.js about the new puzzle
        setPuzzle(newPuzzle);

        // Count the move
        incrementMoveCounter();

        // Start the clock (a restored game resumes on its first move)
        if (restoredGame) {
            restoredGame = false;
            timerPaused = false;
            startTimer();
        } else if (!timerPaused) {
            startTimer();
        }

        // Store the state after the move so redo can restore it
        addToHistory(newPuzzle);

        // Redraw the board
        renderPuzzle(newPuzzle);

        // Check for a win
        const solved = isSolved(newPuzzle);

        // Solved: stop the clock and record the solve
        if (solved) {
            stopTimer();

            // Save the time plus the full history (used for replays)
            storeTimeForAvg(elapsedTime, size, {
                puzzle: newPuzzle,
                moveCount,
                elapsedTime,
                puzzleHistory,
                historyIndex
            });

            // Show "Solved!", then let main.js clear the save and set up the next board
            showSolvedMessage(true);
            stateChangeCallback?.(null);
            onSolved();
        }
        else {
            // Not solved yet: hide the message and save progress
            showSolvedMessage(false);
            saveState();
        }
    };
}

// "Reset" in the Moves panel: sets the move count back to zero
function resetMoveCount() {
    moveCount = 0;

    // Counter element
    const counter = document.getElementById("move-counter");

    // Show 0 right away
    if (counter) {
        counter.textContent = "0";
    }

    // Redraw the counter
    updateMoveCounter();
}

// Builds the Options panel (checkboxes) and wires the dark-mode switch
function createOptionsUI() {
    // Options container from index.html
    const options = document.getElementById("options");

    // Three checkboxes, all on by default
    options.innerHTML = `
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
        saveState();
    });

    // Timer checkbox: stop the clock, or restart it if a game is running
    document.getElementById("timer-option").addEventListener("change", event => {
        timerEnabled = event.target.checked;

        // Off: stop; on: resume only if the game has started and isn't paused
        if (!timerEnabled) {
            stopTimer();
        } else if (currentPuzzle && !timerPaused && puzzleStarted) {
            startTimer();
        }

        // Save progress
        saveState();
    });

    // Highlight checkbox: redraw so tiles in place gain or lose their highlight
    document.getElementById("highlight-option").addEventListener("change", event => {
        highlightSolvedEnabled = event.target.checked;

        // Redraw the board
        if (currentPuzzle) {
            renderPuzzle(currentPuzzle);
        }
    });

    // Light/dark switch in the header
    createThemeToggle();
}

// Builds the Moves and Time panels, wires their buttons and the keyboard shortcuts
function createStatsUI(setPuzzle, { onStateChange, initialState } = {}) {
    // Stats container from index.html
    const stats = document.getElementById("stats");

    // Where to send save requests
    stateChangeCallback = onStateChange || null;

    // Moves panel (undo, redo, reset) and Time panel (pause, reset)
    stats.innerHTML = `
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
    document.getElementById("timer-pause-button").addEventListener("click", toggleTimer);
    document.getElementById("timer-reset-button").addEventListener("click", resetTimer);
    document.getElementById("undo-button").addEventListener("click", () => undoMove(setPuzzle));
    document.getElementById("redo-button").addEventListener("click", () => redoMove(setPuzzle));
    document.getElementById("reset-moves-button").addEventListener("click", resetMoveCount);

    // Ctrl+Z / Ctrl+Y shortcuts
    createKeyboardControls(setPuzzle);

    // Resume a saved game's moves, time and history
    if (initialState) {
        moveCount = initialState.moveCount || 0;
        elapsedTime = initialState.elapsedTime || 0;

        // Rebuild the undo/redo history
        if (Array.isArray(initialState.puzzleHistory)) {
            puzzleHistory = initialState.puzzleHistory.map(state => {
                // Current format: { puzzle, moveCount, elapsedTime }
                if (state && Array.isArray(state.puzzle)) {
                    return {
                        puzzle: [...state.puzzle],
                        moveCount: state.moveCount || 0,
                        elapsedTime: state.elapsedTime || 0
                    };
                }

                // Old format: just the puzzle array
                if (Array.isArray(state)) {
                    return {
                        puzzle: [...state],
                        moveCount: 0,
                        elapsedTime: 0
                    };
                }

                // Unknown entry: removed by the filter below
                return null;
            }).filter(Boolean);
        } else {
            // No history saved
            puzzleHistory = [];
        }

        // Saved history position
        historyIndex = initialState.historyIndex ?? -1;
    }

    // Draw the counter, timer, pause button and undo/redo state
    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
    updateHistoryButtons();
}

// Goes back one snapshot in the history
function undoMove(setPuzzle) {
    // Already at the start
    if (historyIndex <= 0) return;

    // Step back
    historyIndex--;

    // Snapshot to restore
    const state = puzzleHistory[historyIndex];

    // Restore it (put the index back if it's missing)
    if (!restoreHistoryState(state, setPuzzle)) {
        historyIndex++;
        return;
    }

    // Refresh the buttons and save
    updateHistoryButtons();
    saveState();
}

// Goes forward one snapshot in the history
function redoMove(setPuzzle) {
    // Already at the end
    if (historyIndex >= puzzleHistory.length - 1) return;

    // Step forward
    historyIndex++;

    // Snapshot to restore
    const state = puzzleHistory[historyIndex];

    // Restore it (put the index back if it's missing)
    if (!restoreHistoryState(state, setPuzzle)) {
        historyIndex--;
        return;
    }

    // Refresh the buttons and save
    updateHistoryButtons();
    saveState();
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
    saveState();
}

// Shows or hides the move counter and writes the current count
function updateMoveCounter() {
    // Counter element
    const counter = document.getElementById("move-counter");

    // Stop if the stats panel isn't built yet
    if (!counter) return;

    // Hidden while the option is off
    counter.style.display = moveCounterEnabled ? "block" : "none";
    counter.textContent = moveCount;
}

// Adds one move (only while the move counter option is on)
function incrementMoveCounter() {
    // Not counting while the option is off
    if (!moveCounterEnabled) return;

    moveCount++;
    updateMoveCounter();
}

// Starts the clock unless it's already running, paused or turned off
function startTimer() {
    // Already running, paused, or timer option off
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

// Pause/Resume button
function toggleTimer() {
    // Does nothing while the timer option is off
    if (!timerEnabled) return;

    // Resume: restart the clock unless the puzzle is solved
    if (timerPaused) {
        timerPaused = false;
        restoredGame = false;

        if (currentPuzzle && !isSolved(currentPuzzle)) {
            startTimer();
        }
    } else {
        // Pause: stop the clock
        timerPaused = true;
        restoredGame = false;
        stopTimer();
    }

    // Update the button label and save
    updateTimerButton();
    saveState();
}

// Sets the Pause/Resume label, disabled while the timer option is off
function updateTimerButton() {
    // Pause/Resume button
    const button = document.getElementById("timer-pause-button");

    // Stop if the stats panel isn't built yet
    if (!button) return;

    // Label follows the paused state
    button.textContent = timerPaused ? "Resume" : "Pause";
    button.disabled = !timerEnabled;
}

// Writes the elapsed time as mm:ss
function updateTimerDisplay() {
    // Timer element
    const timer = document.getElementById("timer");

    // Stop if the stats panel isn't built yet
    if (!timer) return;

    // Split milliseconds into minutes and seconds
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Zero-padded mm:ss
    timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Zeroes moves and time and stops the clock (not called anywhere yet)
function resetStats() {
    stopTimer();

    // Clear the counters and flags
    moveCount = 0;
    elapsedTime = 0;
    timerPaused = false;
    restoredGame = false;

    // Redraw
    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
}

// Resets the game state for a new puzzle (after a solve, the time and history can be kept)
function markNewPuzzle({
    preserveTimer = false,
    preserveHistory = false
} = {}) {
    // Stop the clock
    stopTimer();

    // Zero moves and time unless they're kept on screen
    if (!preserveTimer) {
        moveCount = 0;
        elapsedTime = 0;
    }

    // Fresh start: not paused, not restored, no moves yet
    timerPaused = false;
    restoredGame = false;
    puzzleStarted = false;

    // If the time was kept, the next move resets it
    resetTimerOnFirstMove = preserveTimer;
    resetStatsOnFirstMove = preserveTimer;

    // Clear undo/redo unless it's kept
    if (!preserveHistory) {
        puzzleHistory = [];
        historyIndex = -1;
    }

    // Redraw everything
    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
    updateHistoryButtons();
}

// Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z or Ctrl+Y redo
function createKeyboardControls(setPuzzle) {
    // Listen for keys anywhere on the page
    document.addEventListener("keydown", event => {
        // Element that has focus
        const target = event.target;

        // Don't take over keys while a form field has focus
        const isTyping =
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement;

        // Only Ctrl shortcuts, and not while typing
        if (isTyping || !event.ctrlKey) return;

        // Ctrl+Z: undo (with Shift: redo)
        if (event.key.toLowerCase() === "z") {
            event.preventDefault();

            if (event.shiftKey) {
                redoMove(setPuzzle);
            } else {
                undoMove(setPuzzle);
            }
        }

        // Ctrl+Y: redo
        if (event.key.toLowerCase() === "y") {
            event.preventDefault();
            redoMove(setPuzzle);
        }
    });
}

// Functions other modules can import
export {
    renderPuzzle,
    createMoveHandler,
    createOptionsUI,
    createStatsUI,
    createKeyboardControls,
    incrementMoveCounter,
    startTimer,
    stopTimer,
    resetStats,
    resetTimer,
    markNewPuzzle,
    undoMove,
    redoMove,
    resetMoveCount,
    resetHistory
};
