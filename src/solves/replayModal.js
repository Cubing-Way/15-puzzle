// Time formatting, closing the "All Solves" modal, and element helpers
import { formatSolveTime } from "./format.js";
import { closeSolveModal } from "./solvesModal.js";
import { createElement, createIconButton, createModal } from "../ui/dom.js";

// Opens a step-by-step replay of a saved solve
function showSolveDetails(solve) {
    // Close the "All Solves" modal
    closeSolveModal();

    // Stop if the solve has no saved history
    const state = solve.solveState;
    const history = state?.puzzleHistory;
    if (!history?.length) return;

    // Modal titled e.g. "4x4 Solve"
    const { overlay, modal } = createModal("solveDetailsModal", "solve-details-modal", `${solve.size}x${solve.size} Solve`);

    // Replay board with one column per tile in a row
    const board = createElement("div");
    board.id = "solveReplayPuzzle";
    board.style.gridTemplateColumns = `repeat(${solve.size}, 1fr)`;

    // ← previous button, "Move X / Y" label, → next button
    const previousButton = createIconButton("solve-replay-button", "←", "Previous move");
    const moveDisplay = createElement("span", "solve-replay-move");
    const nextButton = createIconButton("solve-replay-button", "→", "Next move");

    // Row holding them
    const controls = createElement("div", "solve-replay-controls");
    controls.append(previousButton, moveDisplay, nextButton);

    // Time at the current step
    const timeDisplay = createElement("span", "solve-replay-time");

    // Assemble and show the modal
    modal.append(board, controls, timeDisplay);
    document.body.appendChild(overlay);

    // Snapshot currently shown
    let replayIndex = 0;

    // Draws the board, move number and time for the current step
    function renderStep() {
        // Snapshot for this step, and the blank's number
        const step = history[replayIndex];
        const blank = solve.size * solve.size;

        // One tile per position: the blank shows no number, tiles in their home spot are highlighted
        board.replaceChildren(...step.puzzle.map((square, index) => {
            const tile = createElement("div", "solve-replay-tile", square === blank ? "" : square);
            tile.classList.toggle("solved", square !== blank && square === index + 1);
            return tile;
        }));

        // "Move X / Y" and the time at this step
        moveDisplay.textContent = `Move ${step.moveCount} / ${state.moveCount}`;
        timeDisplay.textContent = `Time ${formatSolveTime(step.elapsedTime / 1000)}`;

        // Disable the buttons at either end
        previousButton.disabled = replayIndex <= 0;
        nextButton.disabled = replayIndex >= history.length - 1;
    }

    // Moves one step back (-1) or forward (+1), staying inside the history
    function goTo(delta) {
        replayIndex = Math.min(Math.max(replayIndex + delta, 0), history.length - 1);
        renderStep();
    }

    // ← goes back one step, → goes forward one
    previousButton.addEventListener("click", () => goTo(-1));
    nextButton.addEventListener("click", () => goTo(1));

    // Draw the first step
    renderStep();
}

// Used by the solves modal
export { showSolveDetails };
