import { formatSolveTime } from "./format.js";
import { getStats } from "./statistics.js";
import { openSolveModal } from "./solvesModal.js";

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

function deleteSolve(id) {
    const solves = JSON.parse(localStorage.getItem("puzzleSolves") || "[]");
    localStorage.setItem("puzzleSolves", JSON.stringify(solves.filter(solve => solve.id !== id)));
    updateDisplay();
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

updateDisplay();

export { storeTimeForAvg, deleteSolve };
