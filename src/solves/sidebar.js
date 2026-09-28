// Time formatting, stats and the "All Solves" modal
import { formatSolveTime } from "./format.js";
import { getStats } from "./statistics.js";
import { openSolveModal } from "./solvesModal.js";

// Saves a finished solve (time in ms) with its replay history, then refreshes the sidebar
function storeTimeForAvg(storedTime, puzzleSize, solveState = null) {
    // Milliseconds to seconds
    storedTime /= 1000;

    // All saved solves, and the current time
    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const timestamp = Date.now();

    // New entry with a unique id and a copy of the solve's history
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

    // Save and redraw
    localStorage.setItem("puzzleSolves", JSON.stringify(solves));
    updateDisplay();
}

// Removes a solve by id and refreshes the sidebar
function deleteSolve(id) {
    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    localStorage.setItem("puzzleSolves", JSON.stringify(solves.filter(solve => solve.id !== id)));
    updateDisplay();
}

// Redraws the right sidebar: today's average per size, the last 10 solves, the Expand button
function updateDisplay() {
    // Sidebar element (stop if it's missing)
    const avgRightSidebar = document.getElementById("avgRightSidebar");
    if (!avgRightSidebar) return;

    // All solves, and today's date as YYYY-MM-DD (in UTC)
    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    const today = new Date().toISOString().split("T")[0];

    // Sizes that have solves, smallest first; then clear the sidebar
    const sizes = [...new Set(solves.map(solve => solve.size))].sort((a, b) => Number(a) - Number(b));
    avgRightSidebar.innerHTML = "";

    // "Today" heading
    const recentTitle = document.createElement("strong");
    recentTitle.className = "solve-recent-title";
    recentTitle.textContent = "Today";
    avgRightSidebar.appendChild(recentTitle);

    // One line per size with today's average
    sizes.forEach(size => {
        // Solves of this size
        const sizeSolves = solves.filter(
            solve => Number(solve.size) === Number(size)
        );

        // Only the ones from today
        const todaySolves = sizeSolves.filter(solve =>
            new Date(solve.timestamp).toISOString().split("T")[0] === today
        );

        // Today's stats for this size
        const todayStats = getStats(todaySolves);

        // Text line, e.g. "4x4 avg: 35.20s (3 solves)"
        const todayText = document.createElement("span");
        todayText.className = "solve-stat";

        todayText.textContent = todayStats.count > 0
            ? `${size}x${size} avg:  ${formatSolveTime(todayStats.average)} (${todayStats.count === 1 ? "1 solve" : todayStats.count + " solves"})`
            : `${size}x${size} - No solves`;

        // Add it, followed by a line break
        avgRightSidebar.appendChild(todayText);
        avgRightSidebar.appendChild(document.createElement("br"));
    });

    // The 10 most recent solves, newest first
    [...solves].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).forEach(solve => {
        // Row container
        const row = document.createElement("div");
        row.className = "solve-preview";

        // Time and size, e.g. "12.34s (4x4)"
        const info = document.createElement("span");
        info.className = "solve-preview-info";
        info.textContent = `${formatSolveTime(solve.time)} (${solve.size}x${solve.size})`;

        // × button that deletes this solve
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "solve-delete";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete solve");
        deleteButton.title = "Delete solve";
        deleteButton.addEventListener("click", () => deleteSolve(solve.id));

        // Put the row together
        row.appendChild(info);
        row.appendChild(deleteButton);
        avgRightSidebar.appendChild(row);
    });

    // "Expand Solves" button opens the full list
    const expandButton = document.createElement("button");
    expandButton.type = "button";
    expandButton.id = "expandSolvesButton";
    expandButton.textContent = "Expand Solves";
    expandButton.addEventListener("click", openSolveModal);
    avgRightSidebar.appendChild(expandButton);
}

// Draw the sidebar when the page loads
updateDisplay();

// Used by ui/game.js and the solves modal
export { storeTimeForAvg, deleteSolve };
