// Unfocuses every select after a change, so keyboard shortcuts (Ctrl+Z/Y) work right away
function blurSelectsOnChange() {
    document.querySelectorAll("select").forEach(select => {
        select.addEventListener("change", () => select.blur());
    });
}

// Used by main.js
export { blurSelectsOnChange };
