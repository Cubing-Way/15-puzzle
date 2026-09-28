// Puzzle logic: solved puzzle and scrambler
import { createPuzzle } from "./core/puzzle.js";
import { scramblePuzzle } from "./core/simulator.js";

// Game UI: board rendering, options, stats and the move handler
import {
    renderPuzzle,
    createOptionsUI,
    createStatsUI,
    createMoveHandler,
    markNewPuzzle
} from "./ui/game.js";

// Tiles, Scramble/Solve buttons, "Solved!" message, select auto-blur
import { createPuzzleUI } from "./ui/board.js";
import { createPuzzleControls } from "./ui/controls.js";
import { showSolvedMessage } from "./ui/solvedMessage.js";
import "./ui/selectBlur.js";

// Saved game, and the theme/color selects (they set themselves up on import)
import { STORAGE_KEY, loadGameState, clearSavedState } from "./storage/gameState.js";
import "./theme/themeControls.js";

// Board container and the size select
const puzzleElement = document.getElementById("fifteen-puzzle");
const sizeSelect = document.getElementById("size-select");

// Fill the size select with 3×3 up to 10×10
for (let size = 3; size <= 10; size++) {
    const option = document.createElement("option");

    // Value is the size, label like "4 × 4 (15 puzzle)"
    option.value = size;
    option.textContent = `${size} × ${size} (${size * size - 1} puzzle)`;

    sizeSelect.appendChild(option);
}

// Game saved from the last visit (null if none)
const savedState = loadGameState();

// Resume the saved size and puzzle, or start a scrambled 4×4
let size = savedState?.size || 4;
let puzzle = savedState?.puzzle || scramblePuzzle(size);

// Show the current size in the select
sizeSelect.value = String(size);

// Lets ui/game.js replace the current puzzle (moves, undo, redo)
const setPuzzle = newPuzzle => {
    puzzle = newPuzzle;
};

// Saves the size plus any extra fields to localStorage
const saveState = extraState => {
    const state = {
        size,
        ...extraState
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Saves only the size (no game in progress)
const savePuzzleSize = () => {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ size })
    );
};

// Saves the size, a copy of the puzzle and the game state (moves, time, history)
const saveActiveState = extraState => {
    saveState({
        puzzle: [...puzzle],
        ...extraState
    });
};

// Build the Options panel
createOptionsUI();

// Build the Moves/Time panels, restoring a saved game if there is one
createStatsUI(setPuzzle, {
    // Save progress whenever the game state changes
    onStateChange: state => {
        if (state) {
            saveActiveState(state);
        }
    },
    // Only pass a save that has a puzzle in it
    initialState: savedState?.puzzle ? savedState : null
});

// Number of columns for the CSS grid
puzzleElement.style.setProperty("--grid-size", size);

// Tile click handler (assigned below)
let moveHandler;

// Clears the board and draws the tiles for the current puzzle
const rebuildPuzzleUI = () => {
    puzzleElement.innerHTML = "";

    // Create the tiles, then fill in numbers and classes
    createPuzzleUI(puzzleElement, puzzle, moveHandler);
    renderPuzzle(puzzle);
};

// Handles tile clicks: moves, saving and what happens after a solve
moveHandler = createMoveHandler({
    // Access to the current puzzle and size
    getPuzzle: () => puzzle,
    setPuzzle,
    getSize: () => size,
    container: puzzleElement,
    // Saved game to resume (if any)
    initialState: savedState?.puzzle ? savedState : null,

    // Save progress after each move
    onStateChange: state => {
        if (state) {
            saveActiveState(state);
        }
    },

    // After a solve: clear the save, then show a solved board after 1 second
    onSolved: () => {
        clearSavedState();

        setTimeout(() => {
            // Solved board; the final time and history stay on screen
            puzzle = createPuzzle(size);

            markNewPuzzle({
                preserveTimer: true,
                preserveHistory: true
            });

            // Hide the message, redraw and save the size
            showSolvedMessage(false);
            rebuildPuzzleUI();
            savePuzzleSize();
        }, 1000);
    }

});

// Draw the board for the first time
rebuildPuzzleUI();

// Scramble and Solve buttons
createPuzzleControls(
    // Scramble: start a new random puzzle
    () => {
        puzzle = scramblePuzzle(size);

        // Reset the game, redraw and save the size
        markNewPuzzle();
        showSolvedMessage(false);
        clearSavedState();
        rebuildPuzzleUI();
        savePuzzleSize();
    },

    // Solve: jump straight to the solved puzzle
    () => {
        puzzle = createPuzzle(size);

        // Reset the game, redraw and save the size
        markNewPuzzle();
        showSolvedMessage(false);
        clearSavedState();
        rebuildPuzzleUI();
        savePuzzleSize();
    }
);

// New size picked: scramble a puzzle of that size
sizeSelect.addEventListener("change", () => {
    size = Number(sizeSelect.value);
    puzzle = scramblePuzzle(size);

    // Resize the grid
    puzzleElement.style.setProperty("--grid-size", size);

    // Reset the game, redraw and save the new size
    markNewPuzzle();
    showSolvedMessage(false);
    clearSavedState();
    rebuildPuzzleUI();
    savePuzzleSize();
});
