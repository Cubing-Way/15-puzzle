// Adds the Scramble and Solve buttons above the board
function createPuzzleControls(onRescramble, onSolve) {
    // Placeholders from index.html
    const scrambleControl = document.getElementById("scramble-control");
    const resetControl = document.getElementById("reset-control");

    // Scramble button
    scrambleControl.innerHTML = `
        <button id="rescramble-button" type="button">Scramble</button>
    `;

    // Solve button (jumps to the solved puzzle)
    resetControl.innerHTML = `
        <button id="solve-button" type="button">Solve</button>
    `;

    // Hook both buttons to the callbacks from main.js
    document.getElementById("rescramble-button").addEventListener("click", onRescramble);
    document.getElementById("solve-button").addEventListener("click", onSolve);
}

// Used by main.js
export { createPuzzleControls };
