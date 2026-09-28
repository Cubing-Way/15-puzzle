import { formatSolveTime } from "./format.js";
import { closeSolveModal } from "./solvesModal.js";

function showSolveDetails(solve) {
    closeSolveModal();

    const state = solve.solveState;
    if (!state?.puzzleHistory?.length) return;

    const history = state.puzzleHistory;
    let replayIndex = 0;

    const overlay = document.createElement("div");
    overlay.id = "solveDetailsModal";

    const modal = document.createElement("div");
    modal.className = "solve-details-modal";

    const header = document.createElement("div");
    header.className = "solve-modal-header";

    const title = document.createElement("strong");
    title.className = "solve-modal-title";
    title.textContent = `${solve.size}x${solve.size} Solve`;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "solve-modal-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.title = "Close";
    closeButton.addEventListener("click", () => overlay.remove());

    header.append(title, closeButton);
    modal.appendChild(header);

    const puzzleContainer = document.createElement("div");
    puzzleContainer.id = "solveReplayPuzzle";
    puzzleContainer.style.gridTemplateColumns = `repeat(${solve.size}, 1fr)`;

    const controls = document.createElement("div");
    controls.className = "solve-replay-controls";

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "solve-replay-button";
    previousButton.textContent = "←";
    previousButton.setAttribute("aria-label", "Previous move");
    previousButton.title = "Previous move";

    const moveDisplay = document.createElement("span");
    moveDisplay.className = "solve-replay-move";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "solve-replay-button";
    nextButton.textContent = "→";
    nextButton.setAttribute("aria-label", "Next move");
    nextButton.title = "Next move";

    controls.append(previousButton, moveDisplay, nextButton);

    const timeDisplay = document.createElement("span");
    timeDisplay.className = "solve-replay-time";

    modal.append(puzzleContainer, controls, timeDisplay);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function renderReplayState() {
        const replayState = history[replayIndex];
        if (!replayState) return;

        puzzleContainer.innerHTML = "";

        replayState.puzzle.forEach((square, index) => {
            const squareDiv = document.createElement("div");
            squareDiv.className = "solve-replay-tile";

            const isEmpty = square === solve.size * solve.size;
            const solved = !isEmpty && square === index + 1;

            if (solved) squareDiv.classList.add("solved");
            if (!isEmpty) squareDiv.textContent = square;

            puzzleContainer.appendChild(squareDiv);
        });

        moveDisplay.textContent = `Move ${replayState.moveCount} / ${state.moveCount}`;
        timeDisplay.textContent = `Time ${formatSolveTime(replayState.elapsedTime / 1000)}`;

        previousButton.disabled = replayIndex <= 0;
        nextButton.disabled = replayIndex >= history.length - 1;
    }

    previousButton.addEventListener("click", () => {
        if (replayIndex <= 0) return;
        replayIndex--;
        renderReplayState();
    });

    nextButton.addEventListener("click", () => {
        if (replayIndex >= history.length - 1) return;
        replayIndex++;
        renderReplayState();
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.remove();
    });

    renderReplayState();
}

export { showSolveDetails };
