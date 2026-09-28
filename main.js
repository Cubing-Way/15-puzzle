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

// Each theme's own color, used when the color select is on "Default".
// "natural" = the theme's original look (no data-color attribute).
const puzzleThemeColors = {
    "puzzle-neon-clean": "blue",
    "puzzle-modern": "blue",
    "puzzle-glass": "purple",
    "puzzle-soft": "blue",
    "puzzle-arcade": "blue",
    "puzzle-minimal": "natural",
    "puzzle-monochrome": "black",
    "puzzle-wood": "orange",
    "puzzle-blueprint": "blue",
    "puzzle-candy": "pink",
    "puzzle-lava": "red",
    "puzzle-aurora": "teal",
    "puzzle-sakura": "pink",
    "puzzle-terminal": "green",
    "puzzle-ice": "cyan",
    "puzzle-gold": "yellow",
    "puzzle-handheld": "lime",
    "puzzle-chalkboard": "natural",
    "puzzle-synthwave": "magenta"
};

const puzzleThemes = Object.keys(puzzleThemeColors);
const DEFAULT_THEME = "puzzle-neon-clean";


const colorSelect = document.getElementById("puzzle-color-select");


const puzzleColors = [
    "default",
    "black",
    "white",
    "red",
    "orange",
    "yellow",
    "lime",
    "green",
    "teal",
    "cyan",
    "blue",
    "purple",
    "magenta",
    "pink"
];

function applyTheme(theme) {
    puzzleElement.classList.remove(...puzzleThemes);
    puzzleElement.classList.add(theme);
    themeSelect.value = theme;
}

// Shows the color for the current select choice.
// "default" follows the theme; any other choice stays as picked.
function applyColor() {
    const choice = colorSelect.value;
    const theme = themeSelect.value;

    const color = choice === "default"
        ? puzzleThemeColors[theme]
        : choice;

    if (color === "natural") {
        puzzleElement.removeAttribute("data-color");
    } else {
        puzzleElement.dataset.color = color;
    }
}


// ---- initial state ----

const savedTheme = localStorage.getItem("puzzle-theme");
const savedColor = localStorage.getItem("puzzle-color");

applyTheme(puzzleThemes.includes(savedTheme) ? savedTheme : DEFAULT_THEME);

colorSelect.value = puzzleColors.includes(savedColor) ? savedColor : "default";
applyColor();


// ---- changes ----

themeSelect.addEventListener("change", () => {
    const selectedTheme = themeSelect.value;

    if (!puzzleThemes.includes(selectedTheme)) return;

    applyTheme(selectedTheme);
    localStorage.setItem("puzzle-theme", selectedTheme);

    // color select is left alone: "default" picks up the new
    // theme's color, a picked color (e.g. black) stays
    applyColor();
});

colorSelect.addEventListener("change", () => {
    if (!puzzleColors.includes(colorSelect.value)) return;

    applyColor();
    localStorage.setItem("puzzle-color", colorSelect.value);
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
