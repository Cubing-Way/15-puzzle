function createPuzzleControls(onRescramble, onSolve) {
    const scrambleControl = document.getElementById("scramble-control");
    const resetControl = document.getElementById("reset-control");

    scrambleControl.innerHTML = `
        <button id="rescramble-button" type="button">Scramble</button>
    `;

    resetControl.innerHTML = `
        <button id="solve-button" type="button">Solve</button>
    `;

    document.getElementById("rescramble-button").addEventListener("click", onRescramble);
    document.getElementById("solve-button").addEventListener("click", onSolve);
}

export { createPuzzleControls };
