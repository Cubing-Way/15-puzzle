// Puzzle logic: solved puzzle and scrambler
import { createPuzzle } from "./core/puzzle.js";
import { scramblePuzzle } from "./core/simulator.js";

// Game UI: options, moves, timer, undo/redo, tiles, Scramble/Solve buttons
import { createGame, renderPuzzle, markNewPuzzle } from "./ui/game.js";
import { createPuzzleUI } from "./ui/board.js";
import { createPuzzleControls } from "./ui/controls.js";
import { blurSelectsOnChange } from "./ui/selectBlur.js";

// Saved game, header theme controls and the solves sidebar
import { loadGameState, saveGameState, clearSavedState } from "./storage/gameState.js";
import { initThemeControls } from "./theme/themeControls.js";
import { createThemeToggle } from "./theme/darkMode.js";
import { renderSidebar } from "./solves/sidebar.js";

// Board container and the size select
const puzzleElement = document.getElementById("fifteen-puzzle");
const sizeSelect = document.getElementById("size-select");

// Fill the size select with 3×3 up to 10×10, labelled like "4 × 4 (15 puzzle)"
for (let n = 3; n <= 10; n++) {
    sizeSelect.add(new Option(`${n} × ${n} (${n * n - 1} puzzle)`, n));
}

// Save from the last visit: just the size, or a game to resume (only if it has a puzzle)
const savedState = loadGameState();
const savedGame = savedState?.puzzle ? savedState : null;

// Current puzzle size (4×4 by default), shown in the select
let size = savedState?.size || 4;
sizeSelect.value = String(size);

// Select auto-blur, theme/color selects, light/dark switch, solves sidebar
blurSelectsOnChange();
initThemeControls();
createThemeToggle();
renderSidebar();

// Options and Stats panels, plus the tile click handler
const moveHandler = createGame({
    savedGame,

    // Save progress whenever the game state changes
    onStateChange: state => saveGameState({ size, ...state }),

    // After a solve: clear the save, then show a solved board after 1 second (the final time and history stay)
    onSolved: () => {
        clearSavedState();
        setTimeout(() => startPuzzle(createPuzzle(size), { keepLastSolve: true }), 1000);
    }
});

// Clears the board and draws the tiles for this puzzle
function drawBoard(puzzle) {
    puzzleElement.style.setProperty("--grid-size", size);
    puzzleElement.replaceChildren();
    createPuzzleUI(puzzleElement, puzzle, moveHandler);
    renderPuzzle(puzzle);
}

// Resets the game for a new puzzle, draws it and saves the size
function startPuzzle(puzzle, options) {
    markNewPuzzle(options);
    drawBoard(puzzle);
    saveGameState({ size });
}

// Resume the saved puzzle, or start a scrambled one
drawBoard(savedGame?.puzzle || scramblePuzzle(size));

// Scramble: start a new random puzzle; Solve: jump straight to the solved puzzle
createPuzzleControls(
    () => startPuzzle(scramblePuzzle(size)),
    () => startPuzzle(createPuzzle(size))
);

// New size picked: scramble a puzzle of that size
sizeSelect.addEventListener("change", () => {
    size = Number(sizeSelect.value);
    startPuzzle(scramblePuzzle(size));
});
