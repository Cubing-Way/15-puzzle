// Count, average, standard deviation and best of solve times (in seconds)
function getStats(solves) {
    // No solves: nothing to compute
    if (!solves.length) return { count: 0, average: null, standardDeviation: null, best: null };

    // Average time
    const times = solves.map(solve => solve.time);
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    // Average squared distance from the average
    const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;

    // Standard deviation is the square root of the variance
    return {
        count: times.length,
        average,
        standardDeviation: Math.sqrt(variance),
        best: Math.min(...times)
    };
}

// Solves grouped by puzzle size, smallest size first: [{ size, solves }]
function groupBySize(solves) {
    const sizes = [...new Set(solves.map(solve => Number(solve.size)))].sort((a, b) => a - b);
    return sizes.map(size => ({ size, solves: solves.filter(solve => Number(solve.size) === size) }));
}

// A timestamp's date as "YYYY-MM-DD" (in UTC)
const utcDay = timestamp => new Date(timestamp).toISOString().split("T")[0];

// True when the solve happened today (by the UTC date)
function isToday(solve) {
    return utcDay(solve.timestamp) === utcDay(Date.now());
}

// Used by the sidebar and the solves modal
export { getStats, groupBySize, isToday };
