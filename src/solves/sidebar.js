// Time formatting, stats, saved solves, element helpers and the "All Solves" modal
import { formatSolveTime } from "./format.js";
import { getStats, groupBySize, isToday } from "./statistics.js";
import { openSolveModal } from "./solvesModal.js";
import { loadSolves, addSolve, removeSolve } from "../storage/solves.js";
import { createElement, createButton, createIconButton } from "../ui/dom.js";

// How many of the latest solves the sidebar lists
const RECENT_SOLVES_SHOWN = 8;

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

// Redraws the right sidebar: today's averages, the latest solves and the Expand button
function renderSidebar() {
    // Sidebar element (stop if it's missing)
    const sidebar = document.getElementById("avgRightSidebar");
    if (!sidebar) return;

    // All solves; start over with the "Today" heading
    const solves = loadSolves();
    sidebar.replaceChildren(createElement("strong", "solve-recent-title", "Today"));

    // Today's average for each size solved today, e.g. "4x4 avg:  35.20s (3 solves)"
    const todayLines = groupBySize(solves.filter(isToday)).map(({ size, solves: sizeSolves }) => {
        // Count and average of this size's solves today
        const { count, average } = getStats(sizeSolves);
        return `${size}x${size} avg:  ${formatSolveTime(average)} (${count === 1 ? "1 solve" : count + " solves"})`;
    });

    // Show each line, or "-" when nothing was solved today
    todayLines.forEach(text => addTextLine(sidebar, text));
    if (!todayLines.length) addTextLine(sidebar, "-");

    // "Solves" heading over the latest solves
    sidebar.appendChild(createElement("strong", "solve-recent-title", "Solves"));

    // The latest solves, newest first
    const recentSolves = [...solves].sort((a, b) => b.timestamp - a.timestamp).slice(0, RECENT_SOLVES_SHOWN);

    // One row per solve: time and size, e.g. "12.34s (4x4)", and a × delete button
    recentSolves.forEach(solve => {
        // × button that deletes this solve
        const deleteButton = createIconButton("solve-delete", "×", "Delete solve");
        deleteButton.addEventListener("click", () => deleteSolve(solve.id));

        // Row with the time and size, then the button
        const row = createElement("div", "solve-preview");
        row.append(
            createElement("span", "solve-preview-info", `${formatSolveTime(solve.time)} (${solve.size}x${solve.size})`),
            deleteButton
        );
        sidebar.appendChild(row);
    });

    // "-" when there are no solves at all
    if (!recentSolves.length) addTextLine(sidebar, "-");

    // "Expand Solves" button opens the full list
    const expandButton = createButton(null, "Expand Solves");
    expandButton.id = "expandSolvesButton";
    expandButton.addEventListener("click", openSolveModal);
    sidebar.appendChild(expandButton);
}

// Adds a muted line of text to the sidebar, followed by a line break
function addTextLine(sidebar, text) {
    sidebar.append(createElement("span", "solve-stat", text), document.createElement("br"));
}

// Used by main.js, ui/game.js and the solves modal
export { renderSidebar, recordSolve, deleteSolve };
