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

// Reads the saved game: { size } only, a game to resume, or null (broken and solved saves are deleted)
function loadGameState() {
    // Parse the saved JSON (null when nothing is saved)
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

    // The puzzle must be an array with one tile per position
    const valid = Array.isArray(state.puzzle) && state.puzzle.length === state.size * state.size;

    // Corrupted or already solved: nothing to resume, clear it
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
