const storedTimesArr = [];

function storeTimeForAvg(storedTime) {
    storedTime = (storedTime / 1000).toFixed(2);
    storedTimesArr.push(storedTime);
    const avgRightSidebar = document.getElementById("avgRightSidebar")
    if(avgRightSidebar.textContent === "-") {
        avgRightSidebar.textContent = "1 - " + storedTime;
    } else {
        avgRightSidebar.innerHTML += "<br>" + storedTimesArr.length + " - " + storedTime;
    }
} 

export { storeTimeForAvg };