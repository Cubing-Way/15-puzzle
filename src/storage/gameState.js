// localStorage key for the game in progress
const STORAGE_KEY = "15-puzzle-state";

// Deletes the saved game
const clearSavedState = () => {
    localStorage.removeItem(STORAGE_KEY);
};

// Reads the saved game; returns null (and clears it) when it's missing, broken or already solved
function loadGameState() {
    try {
        // Raw saved JSON
        const saved = localStorage.getItem(STORAGE_KEY);

        // Nothing saved yet
        if (!saved) return null;

        // Parse the saved JSON
        const state = JSON.parse(saved);

        // No usable size: ignore it
        if (!state || !state.size) {
            return null;
        }

        // Only the size was saved (no game in progress)
        if (!state.puzzle) {
            return { size: state.size };
        }

        // Puzzle isn't an array: corrupted, clear it
        if (!Array.isArray(state.puzzle)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        // Tile count doesn't match the size: corrupted, clear it
        if (state.puzzle.length !== state.size * state.size) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        // Already solved: nothing to resume, clear it
        if (isPuzzleSolved(state.puzzle)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        // Valid game to resume
        return state;
    } catch {
        // Invalid JSON: clear it
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

// True when every tile is in its home position
function isPuzzleSolved(state) {
    // Number of tiles (the blank is the highest number)
    const last = state.length;

    // Every tile must sit at its own position
    return state.every(
        (square, index) =>
            square === index + 1 ||
            (index === last - 1 && square === last)
    );
}

// Used by main.js
export {
    STORAGE_KEY,
    loadGameState,
    clearSavedState
};
