function formatSolveTime(seconds) {
    if (!Number.isFinite(seconds)) return "0.00s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs.toFixed(2)}s`;
    if (minutes > 0) return `${minutes}m ${secs.toFixed(2)}s`;
    return `${secs.toFixed(2)}s`;
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export { formatSolveTime, formatDate };
