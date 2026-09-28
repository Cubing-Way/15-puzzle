function createThemeToggle() {
    const toggle = document.getElementById("dark-mode-option");

    if (!toggle) return;

    const darkMode = localStorage.getItem("dark-mode") === "true";

    toggle.checked = darkMode;
    document.body.classList.toggle("dark-mode", darkMode);

    toggle.addEventListener("change", event => {
        const enabled = event.target.checked;

        document.body.classList.toggle("dark-mode", enabled);
        localStorage.setItem("dark-mode", enabled);
    });
}

export { createThemeToggle };
