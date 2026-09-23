const storedTimesArr = [];

function storeTimeForAvg(storedTime) {
    storedTime = (storedTime / 1000).toFixed(2);
    storedTimesArr.push(parseFloat(storedTime));
    const average = storedTimesArr.reduce((sum, n) => sum + n, 0) / storedTimesArr.length;
    const avgRightSidebar = document.getElementById("avgRightSidebar")
    
    if(avgRightSidebar.textContent === "-") {
        avgRightSidebar.textContent = "1 - " + storedTime;
    } else {
        avgRightSidebar.innerHTML = "Average: " + average.toFixed(2);
        storedTimesArr.forEach((time, index) => {
            avgRightSidebar.innerHTML += "</br>" + (index + 1) + " - " + time;
        });
    }
} 

export { storeTimeForAvg };