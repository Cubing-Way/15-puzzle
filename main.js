import { createPuzzle } from "./puzzle.js";

import {
    createPuzzleUI,
    renderPuzzle,
    createOptionsUI,
    createStatsUI,
    createPuzzleControls,
    createMoveHandler,
    markNewPuzzle,
    showSolvedMessage
} from "./ui.js";


import { scramblePuzzle } from "./simulator.js";

const puzzleElement = document.getElementById("fifteen-puzzle");
const themeSelect = document.getElementById("puzzle-theme-select");
const sizeSelect = document.getElementById("size-select");

const STORAGE_KEY = "15-puzzle-state";

const puzzleThemes = [
    "puzzle-neon-clean",
    "puzzle-neon",
    "puzzle-modern",
    "puzzle-glass",
    "puzzle-soft",
    "puzzle-arcade",
    "puzzle-minimal",
    "puzzle-midnight",
    "puzzle-ocean",
    "puzzle-sunset",
    "puzzle-forest",
    "puzzle-monochrome"
];

const savedTheme = localStorage.getItem("puzzle-theme");
const initialTheme = puzzleThemes.includes(savedTheme)
    ? savedTheme
    : "puzzle-neon-clean";

puzzleElement.classList.remove(...puzzleThemes);
puzzleElement.classList.add(initialTheme);
themeSelect.value = initialTheme;

themeSelect.addEventListener("change", () => {
    const selectedTheme = themeSelect.value;

    if (!puzzleThemes.includes(selectedTheme)) return;

    puzzleElement.classList.remove(...puzzleThemes);
    puzzleElement.classList.add(selectedTheme);
    localStorage.setItem("puzzle-theme", selectedTheme);
});

for (let size = 3; size <= 10; size++) {
    const option = document.createElement("option");

    option.value = size;
    option.textContent = `${size} × ${size} (${size * size - 1} puzzle)`;

    sizeSelect.appendChild(option);
}

const savedState = loadGameState();

let size = savedState?.size || 4;
let puzzle = savedState?.puzzle || scramblePuzzle(size);

sizeSelect.value = String(size);

const setPuzzle = newPuzzle => {
    puzzle = newPuzzle;
};

const saveState = extraState => {
    const state = {
        size,
        ...extraState
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const savePuzzleSize = () => {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ size })
    );
};

const saveActiveState = extraState => {
    saveState({
        puzzle: [...puzzle],
        ...extraState
    });
};

const clearSavedState = () => {
    localStorage.removeItem(STORAGE_KEY);
};

function loadGameState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return null;

        const state = JSON.parse(saved);

        if (!state || !state.size) {
            return null;
        }

        if (!state.puzzle) {
            return { size: state.size };
        }

        if (!Array.isArray(state.puzzle)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        if (state.puzzle.length !== state.size * state.size) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        if (isPuzzleSolved(state.puzzle)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return state;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function isPuzzleSolved(state) {
    const last = state.length;

    return state.every(
        (square, index) =>
            square === index + 1 ||
            (index === last - 1 && square === last)
    );
}

createOptionsUI();

createStatsUI(setPuzzle, {
    onStateChange: state => {
        if (state) {
            saveActiveState(state);
        }
    },
    initialState: savedState?.puzzle ? savedState : null
});

puzzleElement.style.setProperty("--grid-size", size);

let moveHandler;

const rebuildPuzzleUI = () => {
    puzzleElement.innerHTML = "";

    createPuzzleUI(puzzleElement, puzzle, moveHandler);
    renderPuzzle(puzzle);
};

moveHandler = createMoveHandler({
    getPuzzle: () => puzzle,
    setPuzzle,
    getSize: () => size,
    container: puzzleElement,
    initialState: savedState?.puzzle ? savedState : null,

    onStateChange: state => {
        if (state) {
            saveActiveState(state);
        }
    },

    onSolved: () => {
        clearSavedState();

        setTimeout(() => {
            puzzle = createPuzzle(size);

            markNewPuzzle({
                preserveTimer: true,
                preserveHistory: true
            });
            
            showSolvedMessage(false);
            rebuildPuzzleUI();
            savePuzzleSize();
        }, 1000);
    }

});

rebuildPuzzleUI();

createPuzzleControls(
    () => {
        puzzle = scramblePuzzle(size);

        markNewPuzzle();
        showSolvedMessage(false);
        clearSavedState();
        rebuildPuzzleUI();
        savePuzzleSize();
    },

    () => {
        puzzle = createPuzzle(size);

        markNewPuzzle();
        showSolvedMessage(false);
        clearSavedState();
        rebuildPuzzleUI();
        savePuzzleSize();
    }
);

sizeSelect.addEventListener("change", () => {
    size = Number(sizeSelect.value);
    puzzle = scramblePuzzle(size);

    puzzleElement.style.setProperty("--grid-size", size);

    markNewPuzzle();
    showSolvedMessage(false);
    clearSavedState();
    rebuildPuzzleUI();
    savePuzzleSize();
});
