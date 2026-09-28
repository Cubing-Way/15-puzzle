// Time formatting, stats, saved solves, deleting solves, the replay modal and element helpers
import { formatSolveTime } from "./format.js";
import { getStats, groupBySize, isToday } from "./statistics.js";
import { deleteSolve } from "./sidebar.js";
import { showSolveDetails } from "./replayModal.js";
import { loadSolves } from "../storage/solves.js";
import { createElement, createButton, createIconButton, createModal } from "../ui/dom.js";

// Opens the "All Solves" modal: stats for each size plus the full solve history
function openSolveModal() {
    // Close any open copy first
    closeSolveModal();

    // All solves, and an empty "All Solves" modal
    const solves = loadSolves();
    const { overlay, modal } = createModal("solveModal", "solve-modal", "All Solves");

    // Grid with one stats card per size
    const sizesContainer = createElement("div", "solve-sizes-container");

    // One card per size
    groupBySize(solves).forEach(({ size, solves: sizeSolves }) => {
        // Card for this size
        const sizeSection = createElement("div", "solve-size-section");

        // Title (e.g. "4x4"), then today's and all-time stats
        sizeSection.append(
            createElement("strong", "solve-size-title", `${size}x${size}`),
            createStatsGroup("Today", sizeSolves.filter(isToday)),
            createStatsGroup("All Time", sizeSolves)
        );

        // Add the card to the grid
        sizesContainer.appendChild(sizeSection);
    });

    // Assemble and show the modal
    modal.append(sizesContainer, createHistorySection(solves));
    document.body.appendChild(overlay);
}

// One stats group ("Today" or "All Time"): best single, average, σ and solve count
function createStatsGroup(title, solves) {
    // Stats for these solves
    const { count, average, standardDeviation, best } = getStats(solves);

    // A formatted time, or "No solves" when there are none
    const show = seconds => count ? formatSolveTime(seconds) : "No solves";

    // Group box
    const group = createElement("div", "solve-stats-group");

    // Heading, then one line per stat
    group.append(
        createElement("strong", "solve-stats-heading", title),
        createElement("span", "solve-stat", `Best Single: ${show(best)}`),
        createElement("span", "solve-stat", `Average: ${show(average)}`),
        createElement("span", "solve-stat", `σ: ${show(standardDeviation)}`),
        createElement("span", "solve-stat", `Solves: ${count}`)
    );

    return group;
}

// "Solve History" section: every solve, newest first, numbered by age
function createHistorySection(solves) {
    // Section with its heading
    const section = createElement("div", "solve-history-section");
    section.appendChild(createElement("strong", "solve-history-title", "Solve History"));

    // Number each solve by age (oldest = 1)
    const solveNumbers = new Map(
        [...solves]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((solve, index) => [solve.id, index + 1])
    );

    // One row per solve, newest first
    [...solves].sort((a, b) => b.timestamp - a.timestamp).forEach(solve => {
        // Buttons on the right side
        const actions = createElement("div", "solve-row-actions");

        // "View" button, only if the solve has a replay
        if (solve.solveState?.puzzleHistory?.length) {
            const viewButton = createButton("solve-view-button", "View");
            viewButton.addEventListener("click", () => showSolveDetails(solve));
            actions.appendChild(viewButton);
        }

        // × button: delete the solve, then reopen the modal to refresh it
        const deleteButton = createIconButton("solve-delete", "×", "Delete solve");
        deleteButton.addEventListener("click", () => {
            deleteSolve(solve.id);
            openSolveModal();
        });
        actions.appendChild(deleteButton);

        // "number - time (size)" and the buttons
        const row = createElement("div", "solve-row");
        row.append(
            createElement("span", "solve-row-info", `${solveNumbers.get(solve.id)} - ${formatSolveTime(solve.time)} (${solve.size}x${solve.size})`),
            actions
        );
        section.appendChild(row);
    });

    // Placeholder when there are no solves
    if (!solves.length) {
        section.appendChild(createElement("div", "solve-empty", "No solves recorded."));
    }

    return section;
}

// Removes the "All Solves" modal if it's open
function closeSolveModal() {
    document.getElementById("solveModal")?.remove();
}

// Used by the sidebar and the replay modal
export { openSolveModal, closeSolveModal };
