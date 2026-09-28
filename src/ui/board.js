// Creates one div per tile inside the board and wires up clicks and taps (renderPuzzle fills in the numbers)
function createPuzzleUI(container, puzzle, onMove) {
    puzzle.forEach((_, i) => {
        // Tile element, with an id by position
        const tile = document.createElement("div");
        tile.id = `Square-${i + 1}`;
        tile.className = "grid-item";

        // Forgets the press and releases the pointer capture
        const endPress = event => {
            delete container.dataset.clickedSquare;

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

        // Release: move the pressed tile (only if a press was recorded)
        tile.addEventListener("pointerup", event => {
            event.preventDefault();

            const clickedSquare = Number(container.dataset.clickedSquare);

            if (!Number.isNaN(clickedSquare)) {
                onMove(clickedSquare);
            }

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
