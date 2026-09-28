// Unfocus every select after a change, so keyboard shortcuts (Ctrl+Z/Y) work right away
document.querySelectorAll("select").forEach(select => {
    // Blur as soon as a new option is picked
    select.addEventListener("change", () => {
        select.blur();
    });
});
