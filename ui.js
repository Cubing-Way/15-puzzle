import { isSolved } from "./simulator.js";
import { moveSquare } from "./puzzle.js";
import { storeTimeForAvg } from "./averages.js";

let moveCount = 0;
let timerInterval = null;
let elapsedTime = 0; // milliseconds
let currentPuzzle = null;

let moveCounterEnabled = true;
let timerEnabled = true;
let highlightSolvedEnabled = true;

let puzzleStarted = false;
let timerPaused = false;
let restoredGame = false;
let resetTimerOnFirstMove = false;
let resetStatsOnFirstMove = false;

let puzzleHistory = [];
let historyIndex = -1;
let stateChangeCallback = null;

function createPuzzleUI(container, puzzle, onMove) {
    puzzle.forEach((square, i) => {
        const squareDiv = document.createElement("div");

        squareDiv.id = "Square-" + (i + 1);
        squareDiv.classList.add("grid-item");
        squareDiv.textContent = square === puzzle.length ? "" : square;
        squareDiv.classList.toggle("empty", square === puzzle.length);

        squareDiv.addEventListener("pointerdown", event => {
            event.preventDefault();
            container.dataset.clickedSquare = i;
            squareDiv.setPointerCapture(event.pointerId);
        });

        squareDiv.addEventListener("pointerup", event => {
            event.preventDefault();

            const clickedSquare = Number(container.dataset.clickedSquare);

            if (!Number.isNaN(clickedSquare)) {
                onMove(clickedSquare, i);
            }

            delete container.dataset.clickedSquare;

            if (squareDiv.hasPointerCapture(event.pointerId)) {
                squareDiv.releasePointerCapture(event.pointerId);
            }
        });

        squareDiv.addEventListener("pointercancel", event => {
            delete container.dataset.clickedSquare;

            if (squareDiv.hasPointerCapture(event.pointerId)) {
                squareDiv.releasePointerCapture(event.pointerId);
            }
        });

        container.appendChild(squareDiv);
    });
}

function renderPuzzle(puzzle) {
    currentPuzzle = puzzle;

    puzzle.forEach((square, i) => {
        const squareDiv = document.getElementById("Square-" + (i + 1));

        if (!squareDiv) return;

        squareDiv.textContent = square === puzzle.length ? "" : square;
        squareDiv.classList.toggle("empty", square === puzzle.length);
        squareDiv.classList.toggle(
            "solved",
            highlightSolvedEnabled && square === i + 1
        );
    });

    updateHistoryButtons();
}

function saveState() {
    if (!currentPuzzle || isSolved(currentPuzzle)) {
        stateChangeCallback?.(null);
        return;
    }

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

function addToHistory(puzzle) {
    // Remove redo states when a new move is made.
    puzzleHistory = puzzleHistory.slice(0, historyIndex + 1);

    puzzleHistory.push({
        puzzle: [...puzzle],
        moveCount,
        elapsedTime
    });

    historyIndex = puzzleHistory.length - 1;

    updateHistoryButtons();
}

function resetHistory(puzzle) {
    puzzleHistory = [{
        puzzle: [...puzzle],
        moveCount,
        elapsedTime
    }];

    historyIndex = 0;

    updateHistoryButtons();
}

function updateHistoryButtons() {
    const undoButton = document.getElementById("undo-button");
    const redoButton = document.getElementById("redo-button");

    if (undoButton) {
        undoButton.disabled = historyIndex <= 0;
    }

    if (redoButton) {
        redoButton.disabled = historyIndex >= puzzleHistory.length - 1;
    }
}

function restoreHistoryState(state, setPuzzle) {
    if (!state) return false;

    stopTimer();

    const puzzle = [...state.puzzle];

    currentPuzzle = puzzle;
    elapsedTime = state.elapsedTime;
    moveCount = state.moveCount;

    setPuzzle(puzzle);

    updateMoveCounter();
    updateTimerDisplay();
    renderPuzzle(puzzle);

    const solved = isSolved(puzzle);

    showSolvedMessage(solved);

    if (solved) {
        timerPaused = true;
    } else if (!timerPaused && timerEnabled) {
        startTimer();
    }

    return true;
}

function createMoveHandler({
    getPuzzle,
    setPuzzle,
    getSize,
    container,
    onSolved,
    onStateChange,
    initialState
}) {
    stateChangeCallback = onStateChange || null;

    if (initialState) {
        moveCount = initialState.moveCount || 0;
        elapsedTime = initialState.elapsedTime || 0;
        timerPaused = true;
        restoredGame = true;

        if (Array.isArray(initialState.puzzleHistory)) {
            puzzleHistory = initialState.puzzleHistory.map(state => {
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

                return null;
            }).filter(Boolean);
        } else {
            puzzleHistory = [];
        }

        historyIndex = initialState.historyIndex ?? -1;
        puzzleStarted = moveCount > 0;

        updateMoveCounter();
        updateTimerDisplay();
        updateTimerButton();
        updateHistoryButtons();
    }

    return (clickedSquare, currSquare) => {
        const puzzle = getPuzzle();
        const size = getSize();
        const newPuzzle = moveSquare(puzzle, clickedSquare, size);

        if (newPuzzle === puzzle) return;

        if (resetStatsOnFirstMove) {
            moveCount = 0;
            elapsedTime = 0;

            resetStatsOnFirstMove = false;
            resetTimerOnFirstMove = false;

            timerPaused = false;

            updateMoveCounter();
            updateTimerDisplay();
        }

        if (!puzzleStarted) {
            puzzleStarted = true;

            if (puzzleHistory.length === 0) {
                resetHistory(puzzle);
            }
        }

        setPuzzle(newPuzzle);

        incrementMoveCounter();

        if (restoredGame) {
            restoredGame = false;
            timerPaused = false;
            startTimer();
        } else if (!timerPaused) {
            startTimer();
        }

        /*
         * Store the state AFTER the move.
         *
         * moveCount and elapsedTime now represent the
         * state that can be restored by redo.
         */
        addToHistory(newPuzzle);

        renderPuzzle(newPuzzle);

        const solved = isSolved(newPuzzle);

if (solved) {
    stopTimer();

    storeTimeForAvg(elapsedTime, size, {
        puzzle: newPuzzle,
        moveCount,
        elapsedTime,
        puzzleHistory,
        historyIndex
    });

    showSolvedMessage(true);
    stateChangeCallback?.(null);
    onSolved();
}
else {
            showSolvedMessage(false);
            saveState();
        }
    };
}

function resetMoveCount() {
    moveCount = 0;

    const counter = document.getElementById("move-counter");

    if (counter) {
        counter.textContent = "0";
    }

    updateMoveCounter();
}

function createOptionsUI() {
    const options = document.getElementById("options");

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

    document.getElementById("move-counter-option").addEventListener("change", event => {
        moveCounterEnabled = event.target.checked;
        updateMoveCounter();
        saveState();
    });

    document.getElementById("timer-option").addEventListener("change", event => {
        timerEnabled = event.target.checked;

        if (!timerEnabled) {
            stopTimer();
        } else if (currentPuzzle && !timerPaused && puzzleStarted) {
            startTimer();
        }

        saveState();
    });

    document.getElementById("highlight-option").addEventListener("change", event => {
        highlightSolvedEnabled = event.target.checked;

        if (currentPuzzle) {
            renderPuzzle(currentPuzzle);
        }
    });

    createThemeToggle();
}

function createThemeToggle() {
    const toggle = document.getElementById("dark-mode-option");

    if (!toggle) return;

    const darkMode = localStorage.getItem("dark-mode") === "true";

    toggle.checked = darkMode;
    document.body.classList.toggle("dark-mode", darkMode);

    toggle.addEventListener("change", event => {
        const enabled = event.target.checked;

        document.body.classList.toggle("dark-mode", enabled);
        localStorage.setItem("dark-mode", enabled);
    });
}

function createStatsUI(setPuzzle, { onStateChange, initialState } = {}) {
    const stats = document.getElementById("stats");

    stateChangeCallback = onStateChange || null;

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

    document.getElementById("timer-pause-button").addEventListener("click", toggleTimer);
    document.getElementById("timer-reset-button").addEventListener("click", resetTimer);
    document.getElementById("undo-button").addEventListener("click", () => undoMove(setPuzzle));
    document.getElementById("redo-button").addEventListener("click", () => redoMove(setPuzzle));
    document.getElementById("reset-moves-button").addEventListener("click", resetMoveCount);

    createKeyboardControls(setPuzzle);

    if (initialState) {
        moveCount = initialState.moveCount || 0;
        elapsedTime = initialState.elapsedTime || 0;

        if (Array.isArray(initialState.puzzleHistory)) {
            puzzleHistory = initialState.puzzleHistory.map(state => {
                if (state && Array.isArray(state.puzzle)) {
                    return {
                        puzzle: [...state.puzzle],
                        moveCount: state.moveCount || 0,
                        elapsedTime: state.elapsedTime || 0
                    };
                }

                if (Array.isArray(state)) {
                    return {
                        puzzle: [...state],
                        moveCount: 0,
                        elapsedTime: 0
                    };
                }

                return null;
            }).filter(Boolean);
        } else {
            puzzleHistory = [];
        }

        historyIndex = initialState.historyIndex ?? -1;
    }

    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
    updateHistoryButtons();
}

function undoMove(setPuzzle) {
    if (historyIndex <= 0) return;

    historyIndex--;

    const state = puzzleHistory[historyIndex];

    if (!restoreHistoryState(state, setPuzzle)) {
        historyIndex++;
        return;
    }

    updateHistoryButtons();
    saveState();
}

function redoMove(setPuzzle) {
    if (historyIndex >= puzzleHistory.length - 1) return;

    historyIndex++;

    const state = puzzleHistory[historyIndex];

    if (!restoreHistoryState(state, setPuzzle)) {
        historyIndex--;
        return;
    }

    updateHistoryButtons();
    saveState();
}

function resetTimer() {
    stopTimer();

    elapsedTime = 0;
    timerPaused = false;
    restoredGame = false;

    updateTimerDisplay();
    updateTimerButton();
    saveState();
}

function updateMoveCounter() {
    const counter = document.getElementById("move-counter");

    if (!counter) return;

    counter.style.display = moveCounterEnabled ? "block" : "none";
    counter.textContent = moveCount;
}

function incrementMoveCounter() {
    if (!moveCounterEnabled) return;

    moveCount++;
    updateMoveCounter();
}

function startTimer() {
    if (timerInterval || timerPaused || !timerEnabled) return;

    timerInterval = setInterval(() => {
        elapsedTime += 10;
        updateTimerDisplay();
    }, 10);

    updateTimerButton();
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    updateTimerButton();
}

function toggleTimer() {
    if (!timerEnabled) return;

    if (timerPaused) {
        timerPaused = false;
        restoredGame = false;

        if (currentPuzzle && !isSolved(currentPuzzle)) {
            startTimer();
        }
    } else {
        timerPaused = true;
        restoredGame = false;
        stopTimer();
    }

    updateTimerButton();
    saveState();
}

function updateTimerButton() {
    const button = document.getElementById("timer-pause-button");

    if (!button) return;

    button.textContent = timerPaused ? "Resume" : "Pause";
    button.disabled = !timerEnabled;
}

function updateTimerDisplay() {
    const timer = document.getElementById("timer");

    if (!timer) return;

    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resetStats() {
    stopTimer();

    moveCount = 0;
    elapsedTime = 0;
    timerPaused = false;
    restoredGame = false;

    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
}

function markNewPuzzle({
    preserveTimer = false,
    preserveHistory = false
} = {}) {
    stopTimer();

    if (!preserveTimer) {
        moveCount = 0;
        elapsedTime = 0;
    }

    timerPaused = false;
    restoredGame = false;
    puzzleStarted = false;

    resetTimerOnFirstMove = preserveTimer;
    resetStatsOnFirstMove = preserveTimer;

    if (!preserveHistory) {
        puzzleHistory = [];
        historyIndex = -1;
    }

    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
    updateHistoryButtons();
}

function showSolvedMessage(solved) {
    const message = document.getElementById("solved-message");

    if (!message) return;

    message.textContent = solved ? "Solved! 🎉" : "";
    message.classList.toggle("visible", solved);
}

function createPuzzleControls(onRescramble, onSolve) {
    const scrambleControl = document.getElementById("scramble-control");
    const resetControl = document.getElementById("reset-control");

    scrambleControl.innerHTML = `
        <button id="rescramble-button" type="button">Scramble</button>
    `;

    resetControl.innerHTML = `
        <button id="solve-button" type="button">Solve</button>
    `;

    document.getElementById("rescramble-button").addEventListener("click", onRescramble);
    document.getElementById("solve-button").addEventListener("click", onSolve);
}

function createKeyboardControls(setPuzzle) {
    document.addEventListener("keydown", event => {
        const target = event.target;

        const isTyping =
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement;

        if (isTyping || !event.ctrlKey) return;

        if (event.key.toLowerCase() === "z") {
            event.preventDefault();

            if (event.shiftKey) {
                redoMove(setPuzzle);
            } else {
                undoMove(setPuzzle);
            }
        }

        if (event.key.toLowerCase() === "y") {
            event.preventDefault();
            redoMove(setPuzzle);
        }
    });
}

document.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", () => {
        select.blur();
    });
});


export {
    createPuzzleUI,
    renderPuzzle,
    createPuzzleControls,
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
    showSolvedMessage,
    undoMove,
    redoMove,
    resetMoveCount,
    resetHistory
};
