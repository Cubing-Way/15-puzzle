import { createPuzzle } from "./core/puzzle.js";
import { scramblePuzzle } from "./core/simulator.js";

import {
    renderPuzzle,
    createOptionsUI,
    createStatsUI,
    createMoveHandler,
    markNewPuzzle
} from "./ui/game.js";

import { createPuzzleUI } from "./ui/board.js";
import { createPuzzleControls } from "./ui/controls.js";
import { showSolvedMessage } from "./ui/solvedMessage.js";
import "./ui/selectBlur.js";

import { STORAGE_KEY, loadGameState, clearSavedState } from "./storage/gameState.js";
import "./theme/themeControls.js";

const puzzleElement = document.getElementById("fifteen-puzzle");
const sizeSelect = document.getElementById("size-select");

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
