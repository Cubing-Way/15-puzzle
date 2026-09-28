const puzzleElement = document.getElementById("fifteen-puzzle");
const themeSelect = document.getElementById("puzzle-theme-select");
const colorSelect = document.getElementById("puzzle-color-select");

// Each theme's own color, used when the color select is on "Default".
// "natural" = the theme's original look (no data-color attribute).
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

const puzzleThemes = Object.keys(puzzleThemeColors);
const DEFAULT_THEME = "puzzle-neon-clean";

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

function applyTheme(theme) {
    puzzleElement.classList.remove(...puzzleThemes);
    puzzleElement.classList.add(theme);
    themeSelect.value = theme;
}

// Shows the color for the current select choice.
// "default" follows the theme; any other choice stays as picked.
function applyColor() {
    const choice = colorSelect.value;
    const theme = themeSelect.value;

    const color = choice === "default"
        ? puzzleThemeColors[theme]
        : choice;

    if (color === "natural") {
        puzzleElement.removeAttribute("data-color");
    } else {
        puzzleElement.dataset.color = color;
    }
}


// ---- initial state ----

const savedTheme = localStorage.getItem("puzzle-theme");
const savedColor = localStorage.getItem("puzzle-color");

applyTheme(puzzleThemes.includes(savedTheme) ? savedTheme : DEFAULT_THEME);

colorSelect.value = puzzleColors.includes(savedColor) ? savedColor : "default";
applyColor();


// ---- changes ----

themeSelect.addEventListener("change", () => {
    const selectedTheme = themeSelect.value;

    if (!puzzleThemes.includes(selectedTheme)) return;

    applyTheme(selectedTheme);
    localStorage.setItem("puzzle-theme", selectedTheme);

    // color select is left alone: "default" picks up the new
    // theme's color, a picked color (e.g. black) stays
    applyColor();
});

colorSelect.addEventListener("change", () => {
    if (!puzzleColors.includes(colorSelect.value)) return;

    applyColor();
    localStorage.setItem("puzzle-color", colorSelect.value);
});
