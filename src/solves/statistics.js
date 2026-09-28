function getStats(solves) {
    if (!solves.length) return { count: 0, average: null, standardDeviation: null };

    const total = solves.reduce((sum, solve) => sum + solve.time, 0);
    const average = total / solves.length;
    const variance = solves.reduce((sum, solve) => sum + Math.pow(solve.time - average, 2), 0) / solves.length;

    return {
        count: solves.length,
        average,
        standardDeviation: Math.sqrt(variance)
    };
}

export { getStats };
