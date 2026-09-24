const storedTimesArr = [];

function storeTimeForAvg(storedTime, puzzleSize) {
    storedTime = storedTime / 1000;

    storedTimesArr.push({
        time: storedTime,
        size: puzzleSize
    });

    const avgRightSidebar = document.getElementById("avgRightSidebar");

    // Group solves by puzzle size
    const timesBySize = {};

    storedTimesArr.forEach(entry => {
        if (!timesBySize[entry.size]) {
            timesBySize[entry.size] = [];
        }

        timesBySize[entry.size].push(entry.time);
    });

    avgRightSidebar.innerHTML = "";

    // Show average for each puzzle size that has solves
    Object.keys(timesBySize)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(size => {
            const times = timesBySize[size];

            const average =
                times.reduce((sum, time) => sum + time, 0) / times.length;

            avgRightSidebar.innerHTML +=
                `<div>
                    <strong>${size}x${size} Average:</strong>
                    ${average.toFixed(2)}s
                </div>`;
        });

    // Show individual solves
    avgRightSidebar.innerHTML += "<br>";

    storedTimesArr.forEach((entry, index) => {
        avgRightSidebar.innerHTML +=
            `${index + 1} - ${entry.time.toFixed(2)}s (${entry.size}x${entry.size})<br>`;
    });
}

export { storeTimeForAvg };
