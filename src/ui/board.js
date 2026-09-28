// Creates one div per tile inside the board and wires up clicks and taps (renderPuzzle fills in the numbers)
function createPuzzleUI(container, puzzle, onMove) {
    // One tile per position
    puzzle.forEach((_, i) => {
        // Tile element, with an id by position
        const tile = document.createElement("div");
        tile.id = `Square-${i + 1}`;
        tile.className = "grid-item";

        // Forgets the press and releases the pointer capture
        const endPress = event => {
            // Forget which tile was pressed
            delete container.dataset.clickedSquare;

            // Release the pointer capture
            if (tile.hasPointerCapture(event.pointerId)) {
                tile.releasePointerCapture(event.pointerId);
            }
        };

        // Press: remember which tile was pressed and capture the pointer
        tile.addEventListener("pointerdown", event => {
            event.preventDefault();
            container.dataset.clickedSquare = i;
            tile.setPointerCapture(event.pointerId);
        });

        // Release: move the pressed tile
        tile.addEventListener("pointerup", event => {
            event.preventDefault();

            // Tile index saved on press
            const clickedSquare = Number(container.dataset.clickedSquare);

            // Only move if a press was recorded
            if (!Number.isNaN(clickedSquare)) {
                onMove(clickedSquare);
            }

            // Forget the press and release the pointer
            endPress(event);
        });

        // Cancelled touch (e.g. the page scrolled): forget the press, no move
        tile.addEventListener("pointercancel", endPress);

        // Add the tile to the board
        container.appendChild(tile);
    });
}

// Used by main.js
export { createPuzzleUI };
