// Document Ready Initializations
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initMobileMenu();
    initLanguage();
    initCounselors(); // Initialize dynamic counselors list
    initAvailability();
    initAppointments();
    renderCalendar();

    // Calendar nav buttons
    document.getElementById("prevMonthBtn").addEventListener("click", () => adjustMonth(-1));
    document.getElementById("nextMonthBtn").addEventListener("click", () => adjustMonth(1));

    // Handle profile card direct appointment book buttons (delegated)
    setupRequestTypeToggle();
    setupDirectBookingButtons();
    setupServiceShortcutButtons();
    initHomeFeatures();
});
