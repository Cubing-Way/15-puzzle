import { createPuzzle, moveSquare } from "./puzzle.js";

function scramblePuzzle(size, moves = size * size * 10) {
    let puzzle = createPuzzle(size);

    for (let i = 0; i < moves; i++) {
        const blank = puzzle.indexOf(size * size);
        const possibleMoves = [];

        const row = Math.floor(blank / size);
        const col = blank % size;

        if (row > 0) possibleMoves.push(blank - size);
        if (row < size - 1) possibleMoves.push(blank + size);
        if (col > 0) possibleMoves.push(blank - 1);
        if (col < size - 1) possibleMoves.push(blank + 1);

        const randomMove =
            possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        puzzle = moveSquare(puzzle, randomMove, size);
    }

    return puzzle;
}

function isSolved(puzzle) {
    return puzzle.every((square, i) => square === i + 1);
}

export {
    scramblePuzzle,
    isSolved
};
