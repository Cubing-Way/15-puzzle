// localStorage key for the list of finished solves
const SOLVES_KEY = "puzzleSolves";

// Every saved solve, in the order they were recorded
function loadSolves() {
    return JSON.parse(localStorage.getItem(SOLVES_KEY) || "[]");
}

// Replaces the saved list
function saveSolves(solves) {
    localStorage.setItem(SOLVES_KEY, JSON.stringify(solves));
}

// Saves a finished solve with a unique id and the current time
function addSolve({ time, size, solveState }) {
    const solves = loadSolves();
    const timestamp = Date.now();

    solves.push({
        id: `${timestamp}-${Math.random().toString(36).slice(2)}`,
        time,
        size,
        timestamp,
        solveState
    });

    saveSolves(solves);
}

// Deletes a solve by id
function removeSolve(id) {
    saveSolves(loadSolves().filter(solve => solve.id !== id));
}

// Used by the sidebar and the solves modal
export {
    loadSolves,
    addSolve,
    removeSolve
};
