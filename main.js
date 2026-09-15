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

const puzzleThemes = [
    "puzzle-neon-clean", "puzzle-neon", "puzzle-modern",
    "puzzle-glass", "puzzle-soft", "puzzle-arcade",
    "puzzle-minimal", "puzzle-midnight", "puzzle-ocean",
    "puzzle-sunset", "puzzle-forest", "puzzle-monochrome"
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

    if (!puzzleThemes.includes(selectedTheme)) {
        return;
    }

    puzzleElement.classList.remove(...puzzleThemes);
    puzzleElement.classList.add(selectedTheme);
    localStorage.setItem("puzzle-theme", selectedTheme);
});


const fifteenPuzzle =
    document.getElementById("fifteen-puzzle");

const sizeSelect =
    document.getElementById("size-select");


for (let size = 3; size <= 10; size++) {
    const option =
        document.createElement("option");

    option.value = size;
    option.textContent = `${size} × ${size}`;

    sizeSelect.appendChild(option);
}


sizeSelect.value = "4";


createOptionsUI();
createStatsUI();


let size =
    Number(sizeSelect.value);

let puzzle =
    scramblePuzzle(size);


fifteenPuzzle.style.setProperty(
    "--grid-size",
    size
);


const moveHandler =
    createMoveHandler({
        getPuzzle: () => puzzle,

        setPuzzle: newPuzzle => {
            puzzle = newPuzzle;
        },

        getSize: () => size,

        container: fifteenPuzzle,

        onSolved: () => {
            setTimeout(() => {
                puzzle =
                    createPuzzle(size);

                /*
                 * Do NOT reset the stats here.
                 *
                 * The next attempt starts when
                 * the player makes their first move.
                 */
                markNewPuzzle();

                showSolvedMessage(false);

                fifteenPuzzle.innerHTML = "";

                createPuzzleUI(
                    fifteenPuzzle,
                    puzzle,
                    moveHandler
                );

                renderPuzzle(puzzle);

            }, 1000);
        }
    });


createPuzzleUI(
    fifteenPuzzle,
    puzzle,
    moveHandler
);

renderPuzzle(puzzle);


/*
 * Puzzle controls
 */
createPuzzleControls(

    /*
     * Auto Scramble
     */
    () => {
        puzzle =
            scramblePuzzle(size);

        /*
         * Don't reset stats yet.
         * Wait for the player's first move.
         */
        markNewPuzzle();

        showSolvedMessage(false);

        fifteenPuzzle.innerHTML = "";

        createPuzzleUI(
            fifteenPuzzle,
            puzzle,
            moveHandler
        );

        renderPuzzle(puzzle);
    },


    /*
     * Reset to Solved
     */
    () => {
        puzzle =
            createPuzzle(size);

        /*
         * Don't reset stats yet.
         * The next valid move will reset
         * the counter and start the timer.
         */
        markNewPuzzle();

        showSolvedMessage(false);

        fifteenPuzzle.innerHTML = "";

        createPuzzleUI(
            fifteenPuzzle,
            puzzle,
            moveHandler
        );

        renderPuzzle(puzzle);
    }
);


/*
 * Puzzle size changed
 */
sizeSelect.addEventListener(
    "change",
    () => {
        size =
            Number(sizeSelect.value);

        puzzle =
            scramblePuzzle(size);

        fifteenPuzzle.style.setProperty(
            "--grid-size",
            size
        );

        /*
         * New puzzle, but don't reset stats
         * until the first valid move.
         */
        markNewPuzzle();

        showSolvedMessage(false);

        fifteenPuzzle.innerHTML = "";

        createPuzzleUI(
            fifteenPuzzle,
            puzzle,
            moveHandler
        );

        renderPuzzle(puzzle);
    }
);
