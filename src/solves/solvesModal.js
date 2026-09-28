import { formatSolveTime } from "./format.js";
import { getStats } from "./statistics.js";
import { deleteSolve } from "./sidebar.js";
import { showSolveDetails } from "./replayModal.js";

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

export { openSolveModal, closeSolveModal };
