// Creates an element with an optional class and text
function createElement(tag, className, text) {
    const element = document.createElement(tag);

    // Class and text only when given
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

// Creates a type="button" button (so it never submits a form)
function createButton(className, text) {
    const button = createElement("button", className, text);
    button.type = "button";
    return button;
}

// Button that only shows an icon (×, ←, →), with a tooltip and a screen-reader label
function createIconButton(className, icon, label) {
    const button = createButton(className, icon);
    button.title = label;
    button.setAttribute("aria-label", label);
    return button;
}

// Dark overlay holding a modal box with a title and a × button; × or a click on the overlay closes it
function createModal(overlayId, modalClass, title) {
    // Dark overlay behind the modal
    const overlay = createElement("div");
    overlay.id = overlayId;

    // × close button
    const closeButton = createIconButton("solve-modal-close", "×", "Close");
    closeButton.addEventListener("click", () => overlay.remove());

    // Header row: title and ×
    const header = createElement("div", "solve-modal-header");
    header.append(createElement("strong", "solve-modal-title", title), closeButton);

    // Modal box, starting with the header
    const modal = createElement("div", modalClass);
    modal.appendChild(header);
    overlay.appendChild(modal);

    // Clicking the dark background (not the box) closes it
    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.remove();
    });

    // The caller fills the box and adds the overlay to the page
    return { overlay, modal };
}

// Used by the solves sidebar and modals
export {
    createElement,
    createButton,
    createIconButton,
    createModal
};
