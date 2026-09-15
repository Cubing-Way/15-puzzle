function createPuzzle(size) {
    const puzzle = [];

    for (let i = 1; i <= size * size; i++) {
        puzzle.push(i);
    }

    return puzzle;
}

function areAdjacent(square1, square2, size) {
    const row1 = Math.floor(square1 / size);
    const col1 = square1 % size;

    const row2 = Math.floor(square2 / size);
    const col2 = square2 % size;

    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
}

function moveSquare(puzzle, square1, size) {
    const blank = puzzle.indexOf(size * size);

    const row1 = Math.floor(square1 / size);
    const col1 = square1 % size;

    const blankRow = Math.floor(blank / size);
    const blankCol = blank % size;

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

        newPuzzle[square1] = size * size;
        return newPuzzle;
    }

    // Not in the same row or column
    return puzzle;
}

export {
    createPuzzle,
    moveSquare
};
