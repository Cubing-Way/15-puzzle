import { isSolved } from "./simulator.js";
import { moveSquare } from "./puzzle.js";

let moveCount = 0;
let timerInterval = null;
let timerSeconds = 0;
let currentPuzzle = null;

let moveCounterEnabled = true;
let timerEnabled = true;
let highlightSolvedEnabled = true;

let puzzleStarted = false;
let timerPaused = false;
let restoredFromStorage = false;

let puzzleHistory = [];
let historyIndex = -1;

const STORAGE_KEY = "15-puzzle-state";

function saveGameState() {
    if (!currentPuzzle || isSolved(currentPuzzle)) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        puzzle: [...currentPuzzle],
        moveCount,
        timerSeconds,
        puzzleStarted,
        timerPaused: true
    }));
}

function clearGameState() {
    localStorage.removeItem(STORAGE_KEY);
}

function getSavedGameState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        const state = JSON.parse(saved);

        if (!Array.isArray(state.puzzle) || !state.puzzle.length) return null;

        return state;
    } catch {
        return null;
    }
}

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

            if (!Number.isNaN(clickedSquare)) onMove(clickedSquare, i);

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
        squareDiv.classList.toggle("solved", highlightSolvedEnabled && square === i + 1);
    });

    updateHistoryButtons();
}

function addToHistory(puzzle) {
    puzzleHistory = puzzleHistory.slice(0, historyIndex + 1);
    puzzleHistory.push([...puzzle]);
    historyIndex = puzzleHistory.length - 1;
    updateHistoryButtons();
}

function resetHistory(puzzle) {
    puzzleHistory = [[...puzzle]];
    historyIndex = 0;
    updateHistoryButtons();
}

function updateHistoryButtons() {
    const undoButton = document.getElementById("undo-button");
    const redoButton = document.getElementById("redo-button");

    if (undoButton) undoButton.disabled = historyIndex <= 0;
    if (redoButton) redoButton.disabled = historyIndex >= puzzleHistory.length - 1;
}

function createMoveHandler({ getPuzzle, setPuzzle, getSize, onSolved }) {
    return (clickedSquare, currSquare) => {
        const puzzle = getPuzzle();
        const size = getSize();
        const newPuzzle = moveSquare(puzzle, clickedSquare, size);

        if (newPuzzle === puzzle) return;

        if (!puzzleStarted) {
            resetStats();
            puzzleStarted = true;
            resetHistory(puzzle);
        }

        timerPaused = false;
        restoredFromStorage = false;

        setPuzzle(newPuzzle);
        addToHistory(newPuzzle);

        incrementMoveCounter();
        startTimer();
        renderPuzzle(newPuzzle);
        saveGameState();

        if (isSolved(newPuzzle)) {
            stopTimer();
            clearGameState();
            showSolvedMessage(true);
            onSolved();
        } else {
            showSolvedMessage(false);
        }
    };
}

function undoMove(setPuzzle) {
    if (historyIndex <= 0) return;

    historyIndex--;

    const puzzle = [...puzzleHistory[historyIndex]];

    setPuzzle(puzzle);
    currentPuzzle = puzzle;
    moveCount = Math.max(0, moveCount - 1);

    updateMoveCounter();
    renderPuzzle(puzzle);
    showSolvedMessage(isSolved(puzzle));
    saveGameState();
    updateHistoryButtons();
}

function redoMove(setPuzzle) {
    if (historyIndex >= puzzleHistory.length - 1) return;

    historyIndex++;

    const puzzle = [...puzzleHistory[historyIndex]];

    setPuzzle(puzzle);
    currentPuzzle = puzzle;
    moveCount++;

    updateMoveCounter();
    renderPuzzle(puzzle);
    showSolvedMessage(isSolved(puzzle));

    if (isSolved(puzzle)) {
        stopTimer();
        clearGameState();
    } else {
        saveGameState();
    }

    updateHistoryButtons();
}

function createOptionsUI() {
    const options = document.getElementById("options");

    options.innerHTML = `
        <h2>Options</h2>
        <label class="option"><input type="checkbox" id="move-counter-option" checked><span>Move counter</span></label>
        <label class="option"><input type="checkbox" id="timer-option" checked><span>Timer</span></label>
        <label class="option"><input type="checkbox" id="highlight-option" checked><span>Highlight solved</span></label>
    `;

    document.getElementById("move-counter-option").addEventListener("change", event => {
        moveCounterEnabled = event.target.checked;
        updateMoveCounter();
    });

    document.getElementById("timer-option").addEventListener("change", event => {
        timerEnabled = event.target.checked;
        if (!timerEnabled) stopTimer();
        updateTimerButton();
    });

    document.getElementById("highlight-option").addEventListener("change", event => {
        highlightSolvedEnabled = event.target.checked;
        if (currentPuzzle) renderPuzzle(currentPuzzle);
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

function createStatsUI() {
    const stats = document.getElementById("stats");

    stats.innerHTML = `
        <div class="stat">
            <div class="stat-info"><span class="stat-label">Moves</span><span id="move-counter">0</span></div>
            <div class="move-controls"><button id="undo-button" type="button" disabled>Undo</button><button id="redo-button" type="button" disabled>Redo</button></div>
        </div>
        <div class="stat">
            <div class="stat-info"><span class="stat-label">Time</span><span id="timer">00:00</span></div>
            <div class="timer-controls"><button id="timer-pause-button" type="button">Pause</button><button id="timer-reset-button" type="button">Reset</button></div>
        </div>
    `;

    document.getElementById("timer-pause-button").addEventListener("click", toggleTimer);
    document.getElementById("timer-reset-button").addEventListener("click", resetTimer);

    updateHistoryButtons();
    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
}

function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    timerPaused = true;
    saveGameState();
    updateTimerDisplay();
    updateTimerButton();
}

function updateMoveCounter() {
    const counter = document.getElementById("move-counter");
    if (!counter) return;

    counter.style.display = moveCounterEnabled ? "block" : "none";
    counter.textContent = moveCount;
}

function incrementMoveCounter() {
    moveCount++;
    updateMoveCounter();
}

function startTimer() {
    if (!timerEnabled || timerInterval || timerPaused) return;

    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
        saveGameState();
    }, 1000);

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
        restoredFromStorage = false;
        startTimer();
    } else {
        timerPaused = true;
        stopTimer();
    }

    saveGameState();
    updateTimerButton();
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

    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resetStats() {
    stopTimer();

    moveCount = 0;
    timerSeconds = 0;
    timerPaused = false;

    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();
}

function restoreGameState(state) {
    if (!state) return null;

    currentPuzzle = [...state.puzzle];
    moveCount = Number(state.moveCount) || 0;
    timerSeconds = Number(state.timerSeconds) || 0;
    puzzleStarted = Boolean(state.puzzleStarted);

    // Restored games always wait for Resume or a move.
    timerPaused = true;
    restoredFromStorage = true;

    resetHistory(currentPuzzle);
    updateMoveCounter();
    updateTimerDisplay();
    updateTimerButton();

    return [...currentPuzzle];
}

function markNewPuzzle() {
    puzzleStarted = false;
    puzzleHistory = [];
    historyIndex = -1;

    stopTimer();
    clearGameState();
    updateHistoryButtons();
}

function showSolvedMessage(solved) {
    const message = document.getElementById("solved-message");
    if (!message) return;

    message.textContent = solved ? "Solved! 🎉" : "";
    message.classList.toggle("visible", solved);
}

function createPuzzleControls(onRescramble, onSolve, setPuzzle) {
    const scrambleControl = document.getElementById("scramble-control");
    const resetControl = document.getElementById("reset-control");

    scrambleControl.innerHTML = `<button id="rescramble-button" type="button">Scramble</button>`;
    resetControl.innerHTML = `<button id="solve-button" type="button">Solve</button>`;

    document.getElementById("rescramble-button").addEventListener("click", onRescramble);
    document.getElementById("solve-button").addEventListener("click", onSolve);

    document.getElementById("undo-button")?.addEventListener("click", () => undoMove(setPuzzle));
    document.getElementById("redo-button")?.addEventListener("click", () => redoMove(setPuzzle));
}

export {
    createPuzzleUI,
    renderPuzzle,
    createPuzzleControls,
    createMoveHandler,
    createOptionsUI,
    createStatsUI,
    incrementMoveCounter,
    startTimer,
    stopTimer,
    resetStats,
    resetTimer,
    markNewPuzzle,
    showSolvedMessage,
    undoMove,
    redoMove,
    resetHistory,
    saveGameState,
    clearGameState,
    getSavedGameState,
    restoreGameState
};
