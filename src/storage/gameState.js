const STORAGE_KEY = "15-puzzle-state";

const clearSavedState = () => {
    localStorage.removeItem(STORAGE_KEY);
};

function loadGameState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return null;

        const state = JSON.parse(saved);

        if (!state || !state.size) {
            return null;
        }

        if (!state.puzzle) {
            return { size: state.size };
        }

        if (!Array.isArray(state.puzzle)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        if (state.puzzle.length !== state.size * state.size) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        if (isPuzzleSolved(state.puzzle)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return state;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function isPuzzleSolved(state) {
    const last = state.length;

    return state.every(
        (square, index) =>
            square === index + 1 ||
            (index === last - 1 && square === last)
    );
}

export {
    STORAGE_KEY,
    loadGameState,
    clearSavedState
};
