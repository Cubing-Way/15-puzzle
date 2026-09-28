// Wires the header's light/dark switch and restores the saved choice
function createThemeToggle() {
    // Checkbox inside the switch
    const toggle = document.getElementById("dark-mode-option");

    // Stop if the page has no switch
    if (!toggle) return;

    // Saved preference ("true" means dark)
    const darkMode = localStorage.getItem("dark-mode") === "true";

    // Apply it to the switch and the page
    toggle.checked = darkMode;
    document.body.classList.toggle("dark-mode", darkMode);

    // Switch flipped: update the page and save the choice
    toggle.addEventListener("change", event => {
        // New switch state
        const enabled = event.target.checked;

        // Toggle the dark-mode class and remember it
        document.body.classList.toggle("dark-mode", enabled);
        localStorage.setItem("dark-mode", enabled);
    });
}

// Used by main.js
export { createThemeToggle };
