function showSolvedMessage(solved) {
    const message = document.getElementById("solved-message");

    if (!message) return;

    message.textContent = solved ? "Solved! 🎉" : "";
    message.classList.toggle("visible", solved);
}

export { showSolvedMessage };
