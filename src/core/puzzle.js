// Builds a solved puzzle: tiles 1 to size², where the highest number is the blank
function createPuzzle(size) {
    return Array.from({ length: size * size }, (_, i) => i + 1);
}

// Slides the clicked tile (and any tiles between it and the blank) toward the blank;
// returns the same array when the tile isn't in line with the blank
function moveSquare(puzzle, square, size) {
    // Position of the blank (the tile numbered size²)
    const blank = puzzle.indexOf(size * size);

    // Is the clicked tile in the blank's row or column?
    const sameRow = Math.floor(square / size) === Math.floor(blank / size);
    const sameColumn = square % size === blank % size;

    // The blank itself, or not in the same row or column: nothing moves
    if (square === blank || (!sameRow && !sameColumn)) return puzzle;

    // Walk from the blank toward the clicked tile: ±1 along a row, ±size along a column
    const step = Math.sign(square - blank) * (sameRow ? 1 : size);

    // Work on a copy so the original stays unchanged
    const newPuzzle = [...puzzle];

    // Shift each tile on the way one place toward the blank
    for (let i = blank; i !== square; i += step) {
        newPuzzle[i] = newPuzzle[i + step];
    }

    // The blank ends up where the user clicked
    newPuzzle[square] = size * size;
    return newPuzzle;
}

// True when every tile is in its home position
function isSolved(puzzle) {
    return puzzle.every((square, i) => square === i + 1);
}

// Functions other modules can import
export {
    createPuzzle,
    moveSquare,
    isSolved
};
