// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem("counselor_theme") || "light";
    state.theme = savedTheme;
    applyTheme(savedTheme);

    document.getElementById("themeToggleBtn").addEventListener("click", () => {
        state.theme = state.theme === "light" ? "dark" : "light";
        localStorage.setItem("counselor_theme", state.theme);
        applyTheme(state.theme);
    });
}

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
    } else {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
    }
}
