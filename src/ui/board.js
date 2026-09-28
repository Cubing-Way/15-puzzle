function createPuzzleUI(container, puzzle, onMove) {
    puzzle.forEach((square, i) => {
        const squareDiv = document.createElement("div");

        squareDiv.id = "Square-" + (i + 1);
        squareDiv.classList.add("grid-item");
        squareDiv.textContent = square === puzzle.length ? "" : square;
        squareDiv.classList.toggle("empty", square === puzzle.length);

        squareDiv.addEventListener("pointerdown", event => {
            event.preventDefault();
            container.dataset.clickedSquare = i;
            squareDiv.setPointerCapture(event.pointerId);
        });

        squareDiv.addEventListener("pointerup", event => {
            event.preventDefault();

            const clickedSquare = Number(container.dataset.clickedSquare);

            if (!Number.isNaN(clickedSquare)) {
                onMove(clickedSquare, i);
            }

            delete container.dataset.clickedSquare;

            if (squareDiv.hasPointerCapture(event.pointerId)) {
                squareDiv.releasePointerCapture(event.pointerId);
            }
        });

        squareDiv.addEventListener("pointercancel", event => {
            delete container.dataset.clickedSquare;

            if (squareDiv.hasPointerCapture(event.pointerId)) {
                squareDiv.releasePointerCapture(event.pointerId);
            }
        });

        container.appendChild(squareDiv);
    });
}

export { createPuzzleUI };
