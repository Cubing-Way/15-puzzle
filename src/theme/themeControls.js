// Board and the two header selects
const puzzleElement = document.getElementById("fifteen-puzzle");
const themeSelect = document.getElementById("puzzle-theme-select");
const colorSelect = document.getElementById("puzzle-color-select");

// Each theme's own color for "Default" ("natural" = the theme's original look, no data-color)
const puzzleThemeColors = {
    "puzzle-neon-clean": "blue",
    "puzzle-modern": "blue",
    "puzzle-glass": "purple",
    "puzzle-soft": "blue",
    "puzzle-arcade": "blue",
    "puzzle-minimal": "natural",
    "puzzle-monochrome": "black",
    "puzzle-wood": "orange",
    "puzzle-blueprint": "blue",
    "puzzle-candy": "pink",
    "puzzle-lava": "red",
    "puzzle-aurora": "teal",
    "puzzle-sakura": "pink",
    "puzzle-terminal": "green",
    "puzzle-ice": "cyan",
    "puzzle-gold": "yellow",
    "puzzle-handheld": "lime",
    "puzzle-chalkboard": "natural",
    "puzzle-synthwave": "magenta"
};

// Valid theme class names, and the theme used when none is saved
const puzzleThemes = Object.keys(puzzleThemeColors);
const DEFAULT_THEME = "puzzle-neon-clean";

// Valid values of the color select
const puzzleColors = [
    "default",
    "black",
    "white",
    "red",
    "orange",
    "yellow",
    "lime",
    "green",
    "teal",
    "cyan",
    "blue",
    "purple",
    "magenta",
    "pink"
];

// Swaps the board's theme class and keeps the select in sync
function applyTheme(theme) {
    // Remove every theme class, then add the chosen one
    puzzleElement.classList.remove(...puzzleThemes);
    puzzleElement.classList.add(theme);
    // Show it in the select
    themeSelect.value = theme;
}

// Applies the selected color; "default" follows the theme, any other choice stays as picked
function applyColor() {
    // Current values of both selects
    const choice = colorSelect.value;
    const theme = themeSelect.value;

    // Resolve "default" to the theme's own color
    const color = choice === "default"
        ? puzzleThemeColors[theme]
        : choice;

    // "natural": drop the attribute so the theme's original colors show
    if (color === "natural") {
        puzzleElement.removeAttribute("data-color");
    } else {
        // Any other color: CSS reads it from data-color
        puzzleElement.dataset.color = color;
    }
}


// ---- initial state ----

// Theme and color saved from the last visit
const savedTheme = localStorage.getItem("puzzle-theme");
const savedColor = localStorage.getItem("puzzle-color");

// Use the saved theme if it's valid, otherwise the default
applyTheme(puzzleThemes.includes(savedTheme) ? savedTheme : DEFAULT_THEME);

// Use the saved color if it's valid, otherwise "default", then apply it
colorSelect.value = puzzleColors.includes(savedColor) ? savedColor : "default";
applyColor();


// ---- changes ----

// Theme picked: apply it, save it, refresh the color
themeSelect.addEventListener("change", () => {
    // Chosen theme class
    const selectedTheme = themeSelect.value;

    // Ignore unknown values
    if (!puzzleThemes.includes(selectedTheme)) return;

    // Apply and remember it
    applyTheme(selectedTheme);
    localStorage.setItem("puzzle-theme", selectedTheme);

    // Re-apply the color: "default" follows the new theme, a picked color (e.g. black) stays
    applyColor();
});

// Color picked: apply it and save it
colorSelect.addEventListener("change", () => {
    // Ignore unknown values
    if (!puzzleColors.includes(colorSelect.value)) return;

    // Apply and remember it
    applyColor();
    localStorage.setItem("puzzle-color", colorSelect.value);
});
