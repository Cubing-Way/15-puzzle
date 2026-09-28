document.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", () => {
        select.blur();
    });
});
