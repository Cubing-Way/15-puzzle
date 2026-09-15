import { isSolved } from "./simulator.js";
import { moveSquare } from "./puzzle.js";

let moveCount = 0;
let timerInterval = null;
let timerSeconds = 0;

let moveCounterEnabled = true;
let timerEnabled = true;

let puzzleStarted = false;


function createPuzzleUI(container, puzzle, onMove) {
    puzzle.forEach((square, i) => {
        const squareDiv =
            document.createElement("div");

        squareDiv.id =
            "Square-" + (i + 1);

        squareDiv.classList.add(
            "grid-item"
        );

        squareDiv.textContent =
            square === puzzle.length
                ? ""
                : square;

        squareDiv.classList.toggle(
            "empty",
            square === puzzle.length
        );

        squareDiv.addEventListener(
            "pointerdown",
            event => {
                event.preventDefault();

                container.dataset.clickedSquare =
                    i;

                squareDiv.setPointerCapture(
                    event.pointerId
                );
            }
        );

        squareDiv.addEventListener(
            "pointerup",
            event => {
                event.preventDefault();

                const clickedSquare =
                    Number(
                        container.dataset.clickedSquare
                    );

                onMove(
                    clickedSquare,
                    i
                );

                delete container.dataset.clickedSquare;

                if (
                    squareDiv.hasPointerCapture(
                        event.pointerId
                    )
                ) {
                    squareDiv.releasePointerCapture(
                        event.pointerId
                    );
                }
            }
        );

        squareDiv.addEventListener(
            "pointercancel",
            event => {
                delete container.dataset.clickedSquare;

                if (
                    squareDiv.hasPointerCapture(
                        event.pointerId
                    )
                ) {
                    squareDiv.releasePointerCapture(
                        event.pointerId
                    );
                }
            }
        );

        container.appendChild(
            squareDiv
        );
    });
}


function renderPuzzle(puzzle) {
    puzzle.forEach((square, i) => {
        const squareDiv =
            document.getElementById(
                "Square-" + (i + 1)
            );

        squareDiv.textContent =
            square === puzzle.length
                ? ""
                : square;

        squareDiv.classList.toggle(
            "empty",
            square === puzzle.length
        );

        squareDiv.classList.toggle(
            "solved",
            square === i + 1
        );
    });
}


function createMoveHandler({
    getPuzzle,
    setPuzzle,
    getSize,
    container,
    onSolved
}) {
    return (
        clickedSquare,
        currSquare
    ) => {
        const puzzle =
            getPuzzle();

        const size =
            getSize();

        const newPuzzle =
            moveSquare(
                puzzle,
                clickedSquare,
                size
            );

        if (
            newPuzzle === puzzle
        ) {
            return;
        }

        /*
         * The first valid move starts the
         * attempt and resets the stats.
         *
         * This means creating/selecting a
         * puzzle does NOT reset anything
         * until the user actually moves.
         */
        if (!puzzleStarted) {
            resetStats();

            puzzleStarted = true;
        }

        setPuzzle(
            newPuzzle
        );

        incrementMoveCounter();
        startTimer();

        renderPuzzle(
            newPuzzle
        );

        if (
            isSolved(newPuzzle)
        ) {
            stopTimer();

            showSolvedMessage(
                true
            );

            onSolved();
        } else {
            showSolvedMessage(
                false
            );
        }
    };
}


function createOptionsUI() {
    const options =
        document.getElementById(
            "options"
        );

    options.innerHTML = `
        <h2>Options</h2>

        <label class="option">
            <input
                type="checkbox"
                id="move-counter-option"
                checked
            >

            <span>Move counter</span>
        </label>

        <label class="option">
            <input
                type="checkbox"
                id="timer-option"
                checked
            >


            <span>Timer</span>
        </label>
    `;

    document
        .getElementById(
            "move-counter-option"
        )
        .addEventListener(
            "change",
            event => {
                moveCounterEnabled =
                    event.target.checked;

                updateMoveCounter();
            }
        );

    document
        .getElementById(
            "timer-option"
        )
        .addEventListener(
            "change",
            event => {
                timerEnabled =
                    event.target.checked;

                if (!timerEnabled) {
                    stopTimer();
                }
            }
        );

    createThemeToggle();
}


function createThemeToggle() {
    const toggle =
        document.getElementById(
            "dark-mode-option"
        );

    const darkMode =
        localStorage.getItem(
            "dark-mode"
        ) === "true";

    toggle.checked =
        darkMode;

    document.body.classList.toggle(
        "dark-mode",
        darkMode
    );

    toggle.addEventListener(
        "change",
        event => {
            const enabled =
                event.target.checked;

            document.body.classList.toggle(
                "dark-mode",
                enabled
            );

            localStorage.setItem(
                "dark-mode",
                enabled
            );
        }
    );
}


function createStatsUI() {
    const stats =
        document.getElementById(
            "stats"
        );

    stats.innerHTML = `
        <div class="stat">
            <span class="stat-label">
                Moves
            </span>

            <span id="move-counter">
                0
            </span>
        </div>

        <div class="stat">
            <span class="stat-label">
                Time
            </span>

            <span id="timer">
                00:00
            </span>
        </div>
    `;
}


function updateMoveCounter() {
    const counter =
        document.getElementById(
            "move-counter"
        );

    counter.style.display =
        moveCounterEnabled
            ? "block"
            : "none";

    counter.textContent =
        moveCount;
}


function incrementMoveCounter() {
    if (!moveCounterEnabled) {
        return;
    }

    moveCount++;

    updateMoveCounter();
}


function startTimer() {
    if (
        !timerEnabled ||
        timerInterval
    ) {
        return;
    }

    timerInterval =
        setInterval(() => {
            timerSeconds++;

            const minutes =
                Math.floor(
                    timerSeconds / 60
                );

            const seconds =
                timerSeconds % 60;

            document.getElementById(
                "timer"
            ).textContent =
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }, 1000);
}


function stopTimer() {
    clearInterval(
        timerInterval
    );

    timerInterval = null;
}


function resetStats() {
    stopTimer();

    moveCount = 0;
    timerSeconds = 0;

    updateMoveCounter();

    document.getElementById(
        "timer"
    ).textContent =
        "00:00";
}


function markNewPuzzle() {
    /*
     * A new puzzle is waiting for its first
     * valid move.
     */
    puzzleStarted = false;
}


function showSolvedMessage(solved) {
    const message =
        document.getElementById(
            "solved-message"
        );

    message.textContent =
        solved
            ? "Solved! 🎉"
            : "";

    message.classList.toggle(
        "visible",
        solved
    );
}


function createPuzzleControls(
    onRescramble,
    onSolve
) {
    const controls =
        document.getElementById(
            "controls"
        );

    controls.innerHTML = `
        <button
            id="rescramble-button"
            type="button"
        >
            Scramble
        </button>

        <button
            id="solve-button"
            type="button"
        >
            Reset
        </button>
    `;

    document
        .getElementById(
            "rescramble-button"
        )
        .addEventListener(
            "click",
            onRescramble
        );

    document
        .getElementById(
            "solve-button"
        )
        .addEventListener(
            "click",
            onSolve
        );
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
    markNewPuzzle,
    showSolvedMessage
};
