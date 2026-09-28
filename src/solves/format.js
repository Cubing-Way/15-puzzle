// Formats seconds as "12.34s", "1m 5.00s" or "1h 2m 3.00s"
function formatSolveTime(seconds) {
    // Fallback for missing or invalid values
    if (!Number.isFinite(seconds)) return "0.00s";

    // Split into hours, minutes and seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Only show the units that are needed
    if (hours > 0) return `${hours}h ${minutes}m ${secs.toFixed(2)}s`;
    if (minutes > 0) return `${minutes}m ${secs.toFixed(2)}s`;
    return `${secs.toFixed(2)}s`;
}

// Used by the sidebar and both modals
export { formatSolveTime };
