// Time formatting, and closing the "All Solves" modal
import { formatSolveTime } from "./format.js";
import { closeSolveModal } from "./solvesModal.js";

// Opens a step-by-step replay of a saved solve
function showSolveDetails(solve) {
    // Close the "All Solves" modal
    closeSolveModal();

    // Stop if the solve has no saved history
    const state = solve.solveState;
    if (!state?.puzzleHistory?.length) return;

    // Snapshots to step through, starting at the first one
    const history = state.puzzleHistory;
    let replayIndex = 0;

    // Dark overlay behind the modal
    const overlay = document.createElement("div");
    overlay.id = "solveDetailsModal";

    // Modal box
    const modal = document.createElement("div");
    modal.className = "solve-details-modal";

    // Header row
    const header = document.createElement("div");
    header.className = "solve-modal-header";

    // Title, e.g. "4x4 Solve"
    const title = document.createElement("strong");
    title.className = "solve-modal-title";
    title.textContent = `${solve.size}x${solve.size} Solve`;

    // × close button
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "solve-modal-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.title = "Close";
    closeButton.addEventListener("click", () => overlay.remove());

    // Put the header together
    header.append(title, closeButton);
    modal.appendChild(header);

    // Replay board with one column per tile in a row
    const puzzleContainer = document.createElement("div");
    puzzleContainer.id = "solveReplayPuzzle";
    puzzleContainer.style.gridTemplateColumns = `repeat(${solve.size}, 1fr)`;

    // Row with previous / move number / next
    const controls = document.createElement("div");
    controls.className = "solve-replay-controls";

    // ← previous move button
    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "solve-replay-button";
    previousButton.textContent = "←";
    previousButton.setAttribute("aria-label", "Previous move");
    previousButton.title = "Previous move";

    // "Move X / Y" label
    const moveDisplay = document.createElement("span");
    moveDisplay.className = "solve-replay-move";

    // → next move button
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "solve-replay-button";
    nextButton.textContent = "→";
    nextButton.setAttribute("aria-label", "Next move");
    nextButton.title = "Next move";

    // Fill the controls row
    controls.append(previousButton, moveDisplay, nextButton);

    // Time at the current step
    const timeDisplay = document.createElement("span");
    timeDisplay.className = "solve-replay-time";

    // Assemble and show the modal
    modal.append(puzzleContainer, controls, timeDisplay);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Draws the board, move number and time for the current step
    function renderReplayState() {
        // Snapshot for this step
        const replayState = history[replayIndex];
        if (!replayState) return;

        // Clear the board
        puzzleContainer.innerHTML = "";

        // One tile per position
        replayState.puzzle.forEach((square, index) => {
            // Tile element
            const squareDiv = document.createElement("div");
            squareDiv.className = "solve-replay-tile";

            // The blank, and tiles already in their home spot
            const isEmpty = square === solve.size * solve.size;
            const solved = !isEmpty && square === index + 1;

            // Highlight placed tiles; the blank shows no number
            if (solved) squareDiv.classList.add("solved");
            if (!isEmpty) squareDiv.textContent = square;

            // Add it to the board
            puzzleContainer.appendChild(squareDiv);
        });

        // "Move X / Y" and the time at this step
        moveDisplay.textContent = `Move ${replayState.moveCount} / ${state.moveCount}`;
        timeDisplay.textContent = `Time ${formatSolveTime(replayState.elapsedTime / 1000)}`;

        // Disable the buttons at either end
        previousButton.disabled = replayIndex <= 0;
        nextButton.disabled = replayIndex >= history.length - 1;
    }

    // ← goes back one step
    previousButton.addEventListener("click", () => {
        if (replayIndex <= 0) return;
        replayIndex--;
        renderReplayState();
    });

    // → goes forward one step
    nextButton.addEventListener("click", () => {
        if (replayIndex >= history.length - 1) return;
        replayIndex++;
        renderReplayState();
    });

    // Clicking the dark background closes it
    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.remove();
    });

    // Draw the first step
    renderReplayState();
}

// Used by the solves modal
export { showSolveDetails };
