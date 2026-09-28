// Shows or hides the "Solved!" message under the board
function showSolvedMessage(solved) {
    // Message element
    const message = document.getElementById("solved-message");

    // Stop if it's missing
    if (!message) return;

    // Set the text and toggle the class that makes it visible
    message.textContent = solved ? "Solved! 🎉" : "";
    message.classList.toggle("visible", solved);
}

// Used by main.js and ui/game.js
export { showSolvedMessage };
