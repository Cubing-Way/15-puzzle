function formatSolveTime(seconds) {
    if (!Number.isFinite(seconds)) return "0.00s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs.toFixed(2)}s`;
    if (minutes > 0) return `${minutes}m ${secs.toFixed(2)}s`;
    return `${secs.toFixed(2)}s`;
}

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
    if (!solves.length) return { count: 0, average: null, standardDeviation: null };

    const total = solves.reduce((sum, solve) => sum + solve.time, 0);
    const average = total / solves.length;
    const variance = solves.reduce((sum, solve) => sum + Math.pow(solve.time - average, 2), 0) / solves.length;

    return {
        count: solves.length,
        average,
        standardDeviation: Math.sqrt(variance)
    };
}

function deleteSolve(id) {
    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    localStorage.setItem("puzzleSolves", JSON.stringify(solves.filter(solve => solve.id !== id)));
    updateDisplay();
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function updateDisplay() {
    const avgRightSidebar = document.getElementById("avgRightSidebar");
    if (!avgRightSidebar) return;

    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const today = new Date().toISOString().split("T")[0];

    const sizes = [...new Set(solves.map(solve => solve.size))].sort((a, b) => Number(a) - Number(b));
    avgRightSidebar.innerHTML = "";

    const recentTitle = document.createElement("strong");
    recentTitle.className = "solve-recent-title";
    recentTitle.textContent = "Today";
    avgRightSidebar.appendChild(recentTitle);

    sizes.forEach(size => {
        const sizeSolves = solves.filter(
            solve => Number(solve.size) === Number(size)
        );

        const todaySolves = sizeSolves.filter(solve =>
            new Date(solve.timestamp).toISOString().split("T")[0] === today
        );

        const todayStats = getStats(todaySolves);

        const todayText = document.createElement("span");
        todayText.className = "solve-stat";

        todayText.textContent = todayStats.count > 0
            ? `${size}x${size} avg:  ${formatSolveTime(todayStats.average)} (${todayStats.count === 1 ? "1 solve" : todayStats.count + " solves"})`
            : `${size}x${size} - No solves`;

        avgRightSidebar.appendChild(todayText);
        avgRightSidebar.appendChild(document.createElement("br"));
    });

    [...solves].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).forEach(solve => {
        const row = document.createElement("div");
        row.className = "solve-preview";

        const info = document.createElement("span");
        info.className = "solve-preview-info";
        info.textContent = `${formatSolveTime(solve.time)} (${solve.size}x${solve.size})`;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "solve-delete";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete solve");
        deleteButton.title = "Delete solve";
        deleteButton.addEventListener("click", () => deleteSolve(solve.id));

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
    const overlay = document.createElement("div");
    overlay.id = "solveModal";

    const modal = document.createElement("div");
    modal.className = "solve-modal";

    const chronologicalSolves = [...solves].sort((a, b) => a.timestamp - b.timestamp);
    const solveIndexes = new Map();
    chronologicalSolves.forEach((solve, index) => solveIndexes.set(solve.id, index + 1));

    const today = new Date().toISOString().split("T")[0];

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

    const sizes = [...new Set(solves.map(solve => Number(solve.size)))].sort((a, b) => a - b);

    const sizesContainer = document.createElement("div");
    sizesContainer.className = "solve-sizes-container";

    sizes.forEach(size => {
        const sizeSolves = solves.filter(solve => Number(solve.size) === size);
        const todaySolves = sizeSolves.filter(solve => new Date(solve.timestamp).toISOString().split("T")[0] === today);
        const todayStats = getStats(todaySolves);
        const allTimeStats = getStats(sizeSolves);

        const todayBest = todaySolves.length ? Math.min(...todaySolves.map(solve => solve.time)) : null;
        const allTimeBest = sizeSolves.length ? Math.min(...sizeSolves.map(solve => solve.time)) : null;

        const sizeSection = document.createElement("div");
        sizeSection.className = "solve-size-section";

        const sizeTitle = document.createElement("strong");
        sizeTitle.className = "solve-size-title";
        sizeTitle.textContent = `${size}x${size}`;
        sizeSection.appendChild(sizeTitle);

        const todaySection = document.createElement("div");
        todaySection.className = "solve-stats-group";

        const todayTitle = document.createElement("strong");
        todayTitle.className = "solve-stats-heading";
        todayTitle.textContent = "Today";

        const todayBestText = document.createElement("span");
        todayBestText.className = "solve-stat";
        todayBestText.textContent = todayBest !== null ? `Best Single: ${formatSolveTime(todayBest)}` : "Best Single: No solves";

        const todayAverage = document.createElement("span");
        todayAverage.className = "solve-stat";
        todayAverage.textContent = todayStats.count ? `Average: ${formatSolveTime(todayStats.average)}` : "Average: No solves";

        const todayStandardDeviation = document.createElement("span");
        todayStandardDeviation.className = "solve-stat";
        todayStandardDeviation.textContent = todayStats.count ? `σ: ${formatSolveTime(todayStats.standardDeviation)}` : "σ: No solves";

        const todayCount = document.createElement("span");
        todayCount.className = "solve-stat";
        todayCount.textContent = `Solves: ${todayStats.count}`;

        todaySection.append(todayTitle, todayBestText, todayAverage, todayStandardDeviation, todayCount);

        const allTimeSection = document.createElement("div");
        allTimeSection.className = "solve-stats-group";

        const allTimeTitle = document.createElement("strong");
        allTimeTitle.className = "solve-stats-heading";
        allTimeTitle.textContent = "All Time";

        const allTimeBestText = document.createElement("span");
        allTimeBestText.className = "solve-stat";
        allTimeBestText.textContent = allTimeBest !== null ? `Best Single: ${formatSolveTime(allTimeBest)}` : "Best Single: No solves";

        const allTimeAverage = document.createElement("span");
        allTimeAverage.className = "solve-stat";
        allTimeAverage.textContent = allTimeStats.count ? `Average: ${formatSolveTime(allTimeStats.average)}` : "Average: No solves";

        const allTimeStandardDeviation = document.createElement("span");
        allTimeStandardDeviation.className = "solve-stat";
        allTimeStandardDeviation.textContent = allTimeStats.count ? `σ: ${formatSolveTime(allTimeStats.standardDeviation)}` : "σ: No solves";

        const allTimeCount = document.createElement("span");
        allTimeCount.className = "solve-stat";
        allTimeCount.textContent = `Solves: ${allTimeStats.count}`;

        allTimeSection.append(allTimeTitle, allTimeBestText, allTimeAverage, allTimeStandardDeviation, allTimeCount);

        sizeSection.append(todaySection, allTimeSection);
        sizesContainer.appendChild(sizeSection);
    });

    modal.appendChild(sizesContainer);

    const historySection = document.createElement("div");
    historySection.className = "solve-history-section";

    const historyTitle = document.createElement("strong");
    historyTitle.className = "solve-history-title";
    historyTitle.textContent = "Solve History";
    historySection.appendChild(historyTitle);

    [...solves].sort((a, b) => b.timestamp - a.timestamp).forEach(solve => {
        const row = document.createElement("div");
        row.className = "solve-row";

        const info = document.createElement("span");
        info.className = "solve-row-info";
        info.textContent = `${solveIndexes.get(solve.id)} - ${formatSolveTime(solve.time)} (${solve.size}x${solve.size})`;

        const actions = document.createElement("div");
        actions.className = "solve-row-actions";

        if (solve.solveState?.puzzleHistory?.length) {
            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "solve-view-button";
            viewButton.textContent = "View";
            viewButton.addEventListener("click", () => showSolveDetails(solve));
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
        row.append(info, actions);
        historySection.appendChild(row);
    });

    if (!solves.length) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "solve-empty";
        emptyMessage.textContent = "No solves recorded.";
        historySection.appendChild(emptyMessage);
    }

    modal.appendChild(historySection);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeSolveModal();
    });
}

function closeSolveModal() {
    document.getElementById("solveModal")?.remove();
}

function showSolveDetails(solve) {
    closeSolveModal();

    const state = solve.solveState;
    if (!state?.puzzleHistory?.length) return;

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
    closeButton.addEventListener("click", () => overlay.remove());

    header.append(title, closeButton);
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

    controls.append(previousButton, moveDisplay, nextButton);

    const timeDisplay = document.createElement("span");
    timeDisplay.className = "solve-replay-time";

    modal.append(puzzleContainer, controls, timeDisplay);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function renderReplayState() {
        const replayState = history[replayIndex];
        if (!replayState) return;

        puzzleContainer.innerHTML = "";

        replayState.puzzle.forEach((square, index) => {
            const squareDiv = document.createElement("div");
            squareDiv.className = "solve-replay-tile";

            const isEmpty = square === solve.size * solve.size;
            const solved = !isEmpty && square === index + 1;

            if (solved) squareDiv.classList.add("solved");
            if (!isEmpty) squareDiv.textContent = square;

            puzzleContainer.appendChild(squareDiv);
        });

        moveDisplay.textContent = `Move ${replayState.moveCount} / ${state.moveCount}`;
        timeDisplay.textContent = `Time ${formatSolveTime(replayState.elapsedTime / 1000)}`;

        previousButton.disabled = replayIndex <= 0;
        nextButton.disabled = replayIndex >= history.length - 1;
    }

    previousButton.addEventListener("click", () => {
        if (replayIndex <= 0) return;
        replayIndex--;
        renderReplayState();
    });

    nextButton.addEventListener("click", () => {
        if (replayIndex >= history.length - 1) return;
        replayIndex++;
        renderReplayState();
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.remove();
    });

    renderReplayState();
}

updateDisplay();

export { storeTimeForAvg };
