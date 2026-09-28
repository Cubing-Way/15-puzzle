// Builds a solved puzzle: tiles 1 to size², where the highest number is the blank
function createPuzzle(size) {
    // Tiles in solved order
    const puzzle = [];

    // Fill 1 up to size * size
    for (let i = 1; i <= size * size; i++) {
        puzzle.push(i);
    }

    return puzzle;
}

// True when two positions touch horizontally or vertically (not used yet)
function areAdjacent(square1, square2, size) {
    // Row and column of the first position
    const row1 = Math.floor(square1 / size);
    const col1 = square1 % size;

    // Row and column of the second position
    const row2 = Math.floor(square2 / size);
    const col2 = square2 % size;

    // Adjacent means exactly one step apart
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
}

// Slides the clicked tile (and any tiles between it and the blank) toward the blank
function moveSquare(puzzle, square1, size) {
    // Position of the blank (the tile numbered size²)
    const blank = puzzle.indexOf(size * size);

    // Row and column of the clicked tile
    const row1 = Math.floor(square1 / size);
    const col1 = square1 % size;

    // Row and column of the blank
    const blankRow = Math.floor(blank / size);
    const blankCol = blank % size;

    // Work on a copy so the original stays unchanged
    const newPuzzle = [...puzzle];

    // Same row: move horizontally toward the blank
    if (row1 === blankRow) {
        if (col1 < blankCol) {
            // Move tiles to the right
            for (let col = blankCol; col > col1; col--) {
                newPuzzle[row1 * size + col] =
                    newPuzzle[row1 * size + col - 1];
            }
        } else if (col1 > blankCol) {
            // Move tiles to the left
            for (let col = blankCol; col < col1; col++) {
                newPuzzle[row1 * size + col] =
                    newPuzzle[row1 * size + col + 1];
            }
        }

        // The blank ends up where the user clicked
        newPuzzle[square1] = size * size;
        return newPuzzle;
    }

    // Same column: move tiles toward the blank
    if (col1 === blankCol) {
        if (row1 < blankRow) {
            // Move tiles down
            for (let row = blankRow; row > row1; row--) {
                newPuzzle[row * size + col1] =
                    newPuzzle[(row - 1) * size + col1];
            }
        } else if (row1 > blankRow) {
            // Move tiles up
            for (let row = blankRow; row < row1; row++) {
                newPuzzle[row * size + col1] =
                    newPuzzle[(row + 1) * size + col1];
            }
        }

        // The blank ends up where the user clicked
        newPuzzle[square1] = size * size;
        return newPuzzle;
    }

    // Not in the same row or column
    return puzzle;
}

// Functions other modules can import
export {
    createPuzzle,
    moveSquare
};
