// Time formatting, stats, saved solves, element helpers and the "All Solves" modal
import { formatSolveTime } from "./format.js";
import { getStats, groupBySize, isToday } from "./statistics.js";
import { openSolveModal } from "./solvesModal.js";
import { loadSolves, addSolve, removeSolve } from "../storage/solves.js";
import { createElement, createButton, createIconButton } from "../ui/dom.js";

// Saves a finished solve (time in ms) with its replay history, then refreshes the sidebar
function recordSolve(timeMs, size, solveState) {
    addSolve({ time: timeMs / 1000, size, solveState });
    renderSidebar();
}

// Removes a solve by id and refreshes the sidebar
function deleteSolve(id) {
    removeSolve(id);
    renderSidebar();
}

// Redraws the right sidebar: today's average per size, the last 10 solves, the Expand button
function renderSidebar() {
    // Sidebar element (stop if it's missing)
    const sidebar = document.getElementById("avgRightSidebar");
    if (!sidebar) return;

    // All solves; start over with the "Today" heading
    const solves = loadSolves();
    sidebar.replaceChildren(createElement("strong", "solve-recent-title", "Today"));

    // One line per size with today's average
    groupBySize(solves).forEach(({ size, solves: sizeSolves }) => {
        // Today's stats for this size
        const { count, average } = getStats(sizeSolves.filter(isToday));

        // Text line, e.g. "4x4 avg:  35.20s (3 solves)" or "4x4 - No solves"
        const text = count > 0
            ? `${size}x${size} avg:  ${formatSolveTime(average)} (${count === 1 ? "1 solve" : count + " solves"})`
            : `${size}x${size} - No solves`;

        // Add it, followed by a line break
        sidebar.append(createElement("span", "solve-stat", text), document.createElement("br"));
    });

    // The 10 most recent solves, newest first
    [...solves].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).forEach(solve => {
        // × button that deletes this solve
        const deleteButton = createIconButton("solve-delete", "×", "Delete solve");
        deleteButton.addEventListener("click", () => deleteSolve(solve.id));

        // Row with the time and size, e.g. "12.34s (4x4)", then the button
        const row = createElement("div", "solve-preview");
        row.append(
            createElement("span", "solve-preview-info", `${formatSolveTime(solve.time)} (${solve.size}x${solve.size})`),
            deleteButton
        );
        sidebar.appendChild(row);
    });

    // "Expand Solves" button opens the full list
    const expandButton = createButton(null, "Expand Solves");
    expandButton.id = "expandSolvesButton";
    expandButton.addEventListener("click", openSolveModal);
    sidebar.appendChild(expandButton);
}

// Used by main.js, ui/game.js and the solves modal
export { renderSidebar, recordSolve, deleteSolve };
