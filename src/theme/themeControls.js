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

// Valid values of the color select (its options in index.html)
const puzzleColors = [...colorSelect.options].map(option => option.value);

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
    // Resolve "default" to the theme's own color
    const choice = colorSelect.value;
    const color = choice === "default" ? puzzleThemeColors[themeSelect.value] : choice;

    // "natural": drop the attribute so the theme's original colors show
    if (color === "natural") {
        puzzleElement.removeAttribute("data-color");
    } else {
        // Any other color: CSS reads it from data-color
        puzzleElement.dataset.color = color;
    }
}

// Applies the theme and color saved from the last visit, and saves new picks
function initThemeControls() {
    // Theme and color saved from the last visit
    const savedTheme = localStorage.getItem("puzzle-theme");
    const savedColor = localStorage.getItem("puzzle-color");

    // Use them if they're valid, otherwise the defaults
    applyTheme(puzzleThemes.includes(savedTheme) ? savedTheme : DEFAULT_THEME);
    colorSelect.value = puzzleColors.includes(savedColor) ? savedColor : "default";
    applyColor();

    // Theme picked: apply it, save it, refresh the color
    themeSelect.addEventListener("change", () => {
        // Ignore unknown values
        if (!puzzleThemes.includes(themeSelect.value)) return;

        // Apply and remember it; re-apply the color ("default" follows the new theme, a picked color stays)
        applyTheme(themeSelect.value);
        localStorage.setItem("puzzle-theme", themeSelect.value);
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
}

// Used by main.js
export { initThemeControls };
