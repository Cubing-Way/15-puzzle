// Creates one div per tile inside the board and wires up clicks and taps
function createPuzzleUI(container, puzzle, onMove) {
    // One element per position
    puzzle.forEach((square, i) => {
        // Tile element
        const squareDiv = document.createElement("div");

        // Id by position, tile class, number (the blank shows nothing)
        squareDiv.id = "Square-" + (i + 1);
        squareDiv.classList.add("grid-item");
        squareDiv.textContent = square === puzzle.length ? "" : square;
        squareDiv.classList.toggle("empty", square === puzzle.length);

        // Press: remember which tile was pressed and capture the pointer
        squareDiv.addEventListener("pointerdown", event => {
            event.preventDefault();
            container.dataset.clickedSquare = i;
            squareDiv.setPointerCapture(event.pointerId);
        });

        // Release: move the pressed tile
        squareDiv.addEventListener("pointerup", event => {
            event.preventDefault();

            // Tile index saved on press
            const clickedSquare = Number(container.dataset.clickedSquare);

            // Only move if a press was recorded
            if (!Number.isNaN(clickedSquare)) {
                onMove(clickedSquare, i);
            }

            // Forget the press
            delete container.dataset.clickedSquare;

            // Release the pointer capture
            if (squareDiv.hasPointerCapture(event.pointerId)) {
                squareDiv.releasePointerCapture(event.pointerId);
            }
        });

        // Cancelled touch (e.g. the page scrolled): forget the press, no move
        squareDiv.addEventListener("pointercancel", event => {
            delete container.dataset.clickedSquare;

            // Release the pointer capture
            if (squareDiv.hasPointerCapture(event.pointerId)) {
                squareDiv.releasePointerCapture(event.pointerId);
            }
        });

        // Add the tile to the board
        container.appendChild(squareDiv);
    });
}

// Used by main.js
export { createPuzzleUI };
