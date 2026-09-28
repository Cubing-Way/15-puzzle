// Win check (a solved save has nothing to resume)
import { isSolved } from "../core/puzzle.js";

// localStorage key for the game in progress
const STORAGE_KEY = "15-puzzle-state";

// Saves the size, plus the game in progress if there is one
function saveGameState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Deletes the saved game
function clearSavedState() {
    localStorage.removeItem(STORAGE_KEY);
}

// Reads the saved game: { size } alone when no game is in progress;
// null (and clears it) when it's missing, broken or already solved
function loadGameState() {
    let state;

    try {
        state = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
        // Invalid JSON: clear it
        clearSavedState();
        return null;
    }

    // Nothing saved, or no usable size
    if (!state?.size) return null;

    // Only the size was saved (no game in progress)
    if (!state.puzzle) return { size: state.size };

    // Corrupted (wrong tile count) or already solved: nothing to resume, clear it
    const valid = Array.isArray(state.puzzle) && state.puzzle.length === state.size * state.size;

    if (!valid || isSolved(state.puzzle)) {
        clearSavedState();
        return null;
    }

    // Valid game to resume
    return state;
}

// Used by main.js
export {
    loadGameState,
    saveGameState,
    clearSavedState
};
