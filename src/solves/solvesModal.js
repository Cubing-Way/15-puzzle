// Time formatting, stats, deleting solves and the replay modal
import { formatSolveTime } from "./format.js";
import { getStats } from "./statistics.js";
import { deleteSolve } from "./sidebar.js";
import { showSolveDetails } from "./replayModal.js";

// Opens the "All Solves" modal: stats for each size plus the full solve history
function openSolveModal() {
    // Close any open copy first
    closeSolveModal();

    // All solves, and the dark overlay behind the modal
    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const overlay = document.createElement("div");
    overlay.id = "solveModal";

    // Modal box
    const modal = document.createElement("div");
    modal.className = "solve-modal";

    // Number each solve by age (oldest = 1)
    const chronologicalSolves = [...solves].sort((a, b) => a.timestamp - b.timestamp);
    const solveIndexes = new Map();
    chronologicalSolves.forEach((solve, index) => solveIndexes.set(solve.id, index + 1));

    // Today's date as YYYY-MM-DD (in UTC)
    const today = new Date().toISOString().split("T")[0];

    // Header row
    const header = document.createElement("div");
    header.className = "solve-modal-header";

    // "All Solves" title
    const title = document.createElement("strong");
    title.className = "solve-modal-title";
    title.textContent = "All Solves";

    // × close button
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "solve-modal-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.title = "Close";
    closeButton.addEventListener("click", closeSolveModal);

    // Put the header together
    header.appendChild(title);
    header.appendChild(closeButton);
    modal.appendChild(header);

    // Sizes that have solves, smallest first
    const sizes = [...new Set(solves.map(solve => Number(solve.size)))].sort((a, b) => a - b);

    // Grid with one stats card per size
    const sizesContainer = document.createElement("div");
    sizesContainer.className = "solve-sizes-container";

    // One card per size
    sizes.forEach(size => {
        // This size's solves, today's subset, and stats for both
        const sizeSolves = solves.filter(solve => Number(solve.size) === size);
        const todaySolves = sizeSolves.filter(solve => new Date(solve.timestamp).toISOString().split("T")[0] === today);
        const todayStats = getStats(todaySolves);
        const allTimeStats = getStats(sizeSolves);

        // Best (lowest) time today and all time
        const todayBest = todaySolves.length ? Math.min(...todaySolves.map(solve => solve.time)) : null;
        const allTimeBest = sizeSolves.length ? Math.min(...sizeSolves.map(solve => solve.time)) : null;

        // Card for this size
        const sizeSection = document.createElement("div");
        sizeSection.className = "solve-size-section";

        // Card title, e.g. "4x4"
        const sizeTitle = document.createElement("strong");
        sizeTitle.className = "solve-size-title";
        sizeTitle.textContent = `${size}x${size}`;
        sizeSection.appendChild(sizeTitle);

        // "Today" group
        const todaySection = document.createElement("div");
        todaySection.className = "solve-stats-group";

        // Group heading
        const todayTitle = document.createElement("strong");
        todayTitle.className = "solve-stats-heading";
        todayTitle.textContent = "Today";

        // Best single
        const todayBestText = document.createElement("span");
        todayBestText.className = "solve-stat";
        todayBestText.textContent = todayBest !== null ? `Best Single: ${formatSolveTime(todayBest)}` : "Best Single: No solves";

        // Average
        const todayAverage = document.createElement("span");
        todayAverage.className = "solve-stat";
        todayAverage.textContent = todayStats.count ? `Average: ${formatSolveTime(todayStats.average)}` : "Average: No solves";

        // Standard deviation (σ)
        const todayStandardDeviation = document.createElement("span");
        todayStandardDeviation.className = "solve-stat";
        todayStandardDeviation.textContent = todayStats.count ? `σ: ${formatSolveTime(todayStats.standardDeviation)}` : "σ: No solves";

        // Number of solves
        const todayCount = document.createElement("span");
        todayCount.className = "solve-stat";
        todayCount.textContent = `Solves: ${todayStats.count}`;

        // Fill the group
        todaySection.append(todayTitle, todayBestText, todayAverage, todayStandardDeviation, todayCount);

        // "All Time" group
        const allTimeSection = document.createElement("div");
        allTimeSection.className = "solve-stats-group";

        // Group heading
        const allTimeTitle = document.createElement("strong");
        allTimeTitle.className = "solve-stats-heading";
        allTimeTitle.textContent = "All Time";

        // Best single
        const allTimeBestText = document.createElement("span");
        allTimeBestText.className = "solve-stat";
        allTimeBestText.textContent = allTimeBest !== null ? `Best Single: ${formatSolveTime(allTimeBest)}` : "Best Single: No solves";

        // Average
        const allTimeAverage = document.createElement("span");
        allTimeAverage.className = "solve-stat";
        allTimeAverage.textContent = allTimeStats.count ? `Average: ${formatSolveTime(allTimeStats.average)}` : "Average: No solves";

        // Standard deviation (σ)
        const allTimeStandardDeviation = document.createElement("span");
        allTimeStandardDeviation.className = "solve-stat";
        allTimeStandardDeviation.textContent = allTimeStats.count ? `σ: ${formatSolveTime(allTimeStats.standardDeviation)}` : "σ: No solves";

        // Number of solves
        const allTimeCount = document.createElement("span");
        allTimeCount.className = "solve-stat";
        allTimeCount.textContent = `Solves: ${allTimeStats.count}`;

        // Fill the group
        allTimeSection.append(allTimeTitle, allTimeBestText, allTimeAverage, allTimeStandardDeviation, allTimeCount);

        // Add both groups to the card, and the card to the grid
        sizeSection.append(todaySection, allTimeSection);
        sizesContainer.appendChild(sizeSection);
    });

    // Add the stats grid to the modal
    modal.appendChild(sizesContainer);

    // "Solve History" section
    const historySection = document.createElement("div");
    historySection.className = "solve-history-section";

    // Section heading
    const historyTitle = document.createElement("strong");
    historyTitle.className = "solve-history-title";
    historyTitle.textContent = "Solve History";
    historySection.appendChild(historyTitle);

    // One row per solve, newest first
    [...solves].sort((a, b) => b.timestamp - a.timestamp).forEach(solve => {
        // Row container
        const row = document.createElement("div");
        row.className = "solve-row";

        // "number - time (size)"
        const info = document.createElement("span");
        info.className = "solve-row-info";
        info.textContent = `${solveIndexes.get(solve.id)} - ${formatSolveTime(solve.time)} (${solve.size}x${solve.size})`;

        // Buttons on the right side
        const actions = document.createElement("div");
        actions.className = "solve-row-actions";

        // "View" button, only if the solve has a replay
        if (solve.solveState?.puzzleHistory?.length) {
            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "solve-view-button";
            viewButton.textContent = "View";
            viewButton.addEventListener("click", () => showSolveDetails(solve));
            actions.appendChild(viewButton);
        }

        // × button: delete the solve, then reopen the modal to refresh it
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

        // Put the row together
        actions.appendChild(deleteButton);
        row.append(info, actions);
        historySection.appendChild(row);
    });

    // Placeholder when there are no solves
    if (!solves.length) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "solve-empty";
        emptyMessage.textContent = "No solves recorded.";
        historySection.appendChild(emptyMessage);
    }

    // Assemble and show the modal
    modal.appendChild(historySection);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Clicking the dark background closes it
    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeSolveModal();
    });
}

// Removes the "All Solves" modal if it's open
function closeSolveModal() {
    document.getElementById("solveModal")?.remove();
}

// Used by the sidebar and the replay modal
export { openSolveModal, closeSolveModal };
