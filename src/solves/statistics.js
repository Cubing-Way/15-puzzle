// Count, average and standard deviation of solve times (in seconds)
function getStats(solves) {
    // No solves: nothing to compute
    if (!solves.length) return { count: 0, average: null, standardDeviation: null };

    // Average time
    const total = solves.reduce((sum, solve) => sum + solve.time, 0);
    const average = total / solves.length;
    // Average squared distance from the average
    const variance = solves.reduce((sum, solve) => sum + Math.pow(solve.time - average, 2), 0) / solves.length;

    // Standard deviation is the square root of the variance
    return {
        count: solves.length,
        average,
        standardDeviation: Math.sqrt(variance)
    };
}

// Used by the sidebar and the solves modal
export { getStats };
