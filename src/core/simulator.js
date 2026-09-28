// Solved puzzle and move logic
import { createPuzzle, moveSquare } from "./puzzle.js";

// Scrambles by making random legal moves from the solved state (so it's always solvable)
function scramblePuzzle(size, moves = size * size * 100) {
    // Start from a solved puzzle
    let puzzle = createPuzzle(size);
    // Where the blank was one move ago, so a move is never undone right away
    let previousBlank = -1;

    // Make the requested number of random moves
    for (let i = 0; i < moves; i++) {
        // Current blank position and the moves available from it
        const blank = puzzle.indexOf(size * size);
        const possibleMoves = [];

        // Row and column of the blank
        const row = Math.floor(blank / size);
        const col = blank % size;

        // Tile above the blank
        if (row > 0 && blank - size !== previousBlank)
            possibleMoves.push(blank - size);

        // Tile below the blank
        if (row < size - 1 && blank + size !== previousBlank)
            possibleMoves.push(blank + size);

        // Tile left of the blank
        if (col > 0 && blank - 1 !== previousBlank)
            possibleMoves.push(blank - 1);

        // Tile right of the blank
        if (col < size - 1 && blank + 1 !== previousBlank)
            possibleMoves.push(blank + 1);

        // Pick one of them at random
        const randomMove =
            possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        // Remember this blank spot and make the move
        previousBlank = blank;
        puzzle = moveSquare(puzzle, randomMove, size);
    }

    return puzzle;
}

// Used by main.js
export { scramblePuzzle };
