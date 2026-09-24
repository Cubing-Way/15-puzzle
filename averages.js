function storeTimeForAvg(storedTime, puzzleSize, solveState = null) {
    storedTime /= 1000;

    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const timestamp = Date.now();

    solves.push({
        id: `${timestamp}-${Math.random().toString(36).slice(2)}`,
        time: storedTime,
        size: puzzleSize,
        timestamp,
        solveState: solveState ? {
            puzzle: [...solveState.puzzle],
            moveCount: solveState.moveCount,
            elapsedTime: solveState.elapsedTime,
            puzzleHistory: solveState.puzzleHistory.map(state => ({
                puzzle: [...state.puzzle],
                moveCount: state.moveCount,
                elapsedTime: state.elapsedTime
            })),
            historyIndex: solveState.historyIndex
        } : null
    });

    localStorage.setItem("puzzleSolves", JSON.stringify(solves));
    updateDisplay();
}

function getStats(solves) {


    const total = solves.reduce((sum, solve) => sum + solve.time, 0);

    return {
        count: solves.length,
        average: total / solves.length
    };
}

function deleteSolve(id) {
    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const updatedSolves = solves.filter(solve => solve.id !== id);

    localStorage.setItem("puzzleSolves", JSON.stringify(updatedSolves));
    updateDisplay();
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function updateDisplay() {
    const avgRightSidebar = document.getElementById("avgRightSidebar");

    if (!avgRightSidebar) {
        return;
    }

    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const today = new Date().toISOString().split("T")[0];

    const sizes = [...new Set(solves.map(solve => solve.size))]
        .sort((a, b) => Number(a) - Number(b));

    avgRightSidebar.innerHTML = "";

    sizes.forEach(size => {
        const sizeSolves = solves.filter(
            solve => Number(solve.size) === Number(size)
        );

        const todaySolves = sizeSolves.filter(solve => {
            return new Date(solve.timestamp).toISOString().split("T")[0] === today;
        });

        const todayStats = getStats(todaySolves);
        const allTimeStats = getStats(sizeSolves);

        const section = document.createElement("div");
        section.className = "solve-size-section";

        const title = document.createElement("strong");
        title.className = "solve-size-title";
        title.textContent = `${size}x${size}`;

        const todayText = document.createElement("span");
        todayText.className = "solve-stat";
        todayText.textContent = todayStats
            ? `Today: ${todayStats.average.toFixed(2)}s (${todayStats.count} solves)`
            : "Today: No solves";

        const allTimeText = document.createElement("span");
        allTimeText.className = "solve-stat";
        allTimeText.textContent = allTimeStats
            ? `All Time: ${allTimeStats.average.toFixed(2)}s (${allTimeStats.count} solves)`
            : "All Time: No solves";

        section.appendChild(title);
        section.appendChild(document.createElement("br"));
        section.appendChild(todayText);
        section.appendChild(document.createElement("br"));
        section.appendChild(allTimeText);

        avgRightSidebar.appendChild(section);
    });



    const recentTitle = document.createElement("strong");
    recentTitle.className = "solve-recent-title";
    recentTitle.textContent = "Recent Solves";

    avgRightSidebar.appendChild(recentTitle);

    [...solves]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .forEach(solve => {
            const row = document.createElement("div");
            row.className = "solve-preview";

            const info = document.createElement("span");
            info.className = "solve-preview-info";
            info.textContent = `${solve.time.toFixed(2)}s (${solve.size}x${solve.size})`;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "solve-delete";
            deleteButton.textContent = "×";
            deleteButton.setAttribute("aria-label", "Delete solve");
            deleteButton.title = "Delete solve";

            deleteButton.addEventListener("click", () => {
                deleteSolve(solve.id);
            });

            row.appendChild(info);
            row.appendChild(deleteButton);
            avgRightSidebar.appendChild(row);
        });

    const expandButton = document.createElement("button");
    expandButton.type = "button";
    expandButton.id = "expandSolvesButton";
    expandButton.textContent = "Expand Solves";

    expandButton.addEventListener("click", openSolveModal);

    avgRightSidebar.appendChild(expandButton);
}

function openSolveModal() {
    closeSolveModal();

    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const solvesByDay = {};

    solves.forEach(solve => {
        const date = new Date(solve.timestamp).toISOString().split("T")[0];

        if (!solvesByDay[date]) {
            solvesByDay[date] = [];
        }

        solvesByDay[date].push(solve);
    });

    const dates = Object.keys(solvesByDay).sort().reverse();

    const overlay = document.createElement("div");
    overlay.id = "solveModal";

    const modal = document.createElement("div");
    modal.className = "solve-modal";

    const header = document.createElement("div");
    header.className = "solve-modal-header";

    const title = document.createElement("strong");
    title.className = "solve-modal-title";
    title.textContent = "All Solves";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "solve-modal-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.title = "Close";

    closeButton.addEventListener("click", closeSolveModal);

    header.appendChild(title);
    header.appendChild(closeButton);
    modal.appendChild(header);

    dates.forEach(date => {
        const dayContainer = document.createElement("div");
        dayContainer.className = "solve-day";

        const dateTitle = document.createElement("strong");
        dateTitle.className = "solve-day-title";
        dateTitle.textContent = formatDate(date);

        dayContainer.appendChild(dateTitle);

        solvesByDay[date]
            .sort((a, b) => b.timestamp - a.timestamp)
            .forEach(solve => {
                const row = document.createElement("div");
                row.className = "solve-row";

                const time = new Date(solve.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });

                const info = document.createElement("span");
                info.className = "solve-row-info";
                info.textContent =
                    `${time} — ${solve.time.toFixed(2)}s (${solve.size}x${solve.size})`;

                const actions = document.createElement("div");
                actions.className = "solve-row-actions";

                if (solve.solveState?.puzzleHistory?.length) {
                    const viewButton = document.createElement("button");
                    viewButton.type = "button";
                    viewButton.className = "solve-view-button";
                    viewButton.textContent = "View";

                    viewButton.addEventListener("click", () => {
                        showSolveDetails(solve);
                    });

                    actions.appendChild(viewButton);
                }

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "solve-delete";
                deleteButton.textContent = "×";
                deleteButton.setAttribute("aria-label", "Delete solve");
                deleteButton.title = "Delete solve";

                deleteButton.addEventListener("click", () => {
                    deleteSolve(solve.id);
                    openSolveModal();
                });

                actions.appendChild(deleteButton);

                row.appendChild(info);
                row.appendChild(actions);
                dayContainer.appendChild(row);
            });

        modal.appendChild(dayContainer);
    });

    if (dates.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "solve-empty";
        emptyMessage.textContent = "No solves recorded.";

        modal.appendChild(emptyMessage);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeSolveModal();
        }
    });
}

function closeSolveModal() {
    document.getElementById("solveModal")?.remove();
}

function showSolveDetails(solve) {
    closeSolveModal();

    const state = solve.solveState;

    if (!state?.puzzleHistory?.length) {
        return;
    }

    const history = state.puzzleHistory;
    let replayIndex = 0;

    const overlay = document.createElement("div");
    overlay.id = "solveDetailsModal";

    const modal = document.createElement("div");
    modal.className = "solve-details-modal";

    const header = document.createElement("div");
    header.className = "solve-modal-header";

    const title = document.createElement("strong");
    title.className = "solve-modal-title";
    title.textContent = `${solve.size}x${solve.size} Solve`;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "solve-modal-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.title = "Close";

    header.appendChild(title);
    header.appendChild(closeButton);
    modal.appendChild(header);

    const puzzleContainer = document.createElement("div");
    puzzleContainer.id = "solveReplayPuzzle";
    puzzleContainer.style.gridTemplateColumns = `repeat(${solve.size}, 1fr)`;

    const controls = document.createElement("div");
    controls.className = "solve-replay-controls";

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "solve-replay-button";
    previousButton.textContent = "←";
    previousButton.setAttribute("aria-label", "Previous move");
    previousButton.title = "Previous move";

    const moveDisplay = document.createElement("span");
    moveDisplay.className = "solve-replay-move";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "solve-replay-button";
    nextButton.textContent = "→";
    nextButton.setAttribute("aria-label", "Next move");
    nextButton.title = "Next move";

    controls.appendChild(previousButton);
    controls.appendChild(moveDisplay);
    controls.appendChild(nextButton);

    const timeDisplay = document.createElement("span");
    timeDisplay.className = "solve-replay-time";

    modal.appendChild(puzzleContainer);
    modal.appendChild(controls);
    modal.appendChild(timeDisplay);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function renderReplayState() {
        const replayState = history[replayIndex];

        if (!replayState) {
            return;
        }

        puzzleContainer.innerHTML = "";

        replayState.puzzle.forEach((square, index) => {
            const squareDiv = document.createElement("div");
            squareDiv.className = "solve-replay-tile";

            const isEmpty = square === solve.size * solve.size;
            const solved = !isEmpty && square === index + 1;

            if (solved) {
                squareDiv.classList.add("solved");
            }

            if (!isEmpty) {
                squareDiv.textContent = square;
            }

            puzzleContainer.appendChild(squareDiv);
        });

        moveDisplay.textContent =
            `Move ${replayState.moveCount} / ${state.moveCount}`;

        const totalSeconds = Math.floor(replayState.elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        timeDisplay.textContent =
            `Time ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        previousButton.disabled = replayIndex <= 0;
        nextButton.disabled = replayIndex >= history.length - 1;
    }

    previousButton.addEventListener("click", () => {
        if (replayIndex <= 0) {
            return;
        }

        replayIndex--;
        renderReplayState();
    });

    nextButton.addEventListener("click", () => {
        if (replayIndex >= history.length - 1) {
            return;
        }

        replayIndex++;
        renderReplayState();
    });

    closeButton.addEventListener("click", () => {
        overlay.remove();
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    renderReplayState();
}

updateDisplay();

export { storeTimeForAvg };
