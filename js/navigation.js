// Mobile Responsive Navigation Drawer
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mainNav = document.getElementById("mainNav");

    if (!mobileMenuBtn || !mainNav) return;

    mobileMenuBtn.addEventListener("click", () => {
        mainNav.classList.toggle("mobile-active");
        const isOpen = mainNav.classList.contains("mobile-active");
        mobileMenuBtn.classList.toggle("active", isOpen);
        mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
        const menuIsOpen = mainNav.classList.contains("mobile-active");
        const clickedInsideMenu = mainNav.contains(event.target);
        const clickedMenuButton = mobileMenuBtn.contains(event.target);

        if (menuIsOpen && !clickedInsideMenu && !clickedMenuButton) {
            closeMobileMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });

    // Close menu when clicking links
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            closeMobileMenu();

            // Manage Active Class
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        });
    });

    const portalToggleBtn = document.getElementById("portalToggleBtn");
    if (portalToggleBtn) {
        portalToggleBtn.addEventListener("click", closeMobileMenu);
    }
}

function closeMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mainNav = document.getElementById("mainNav");

    if (!mobileMenuBtn || !mainNav) return;

    mainNav.classList.remove("mobile-active");
    mobileMenuBtn.classList.remove("active");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
}

// UI Accordion Logic
function toggleAccordion(button) {
    const item = button.parentNode;
    item.classList.toggle("open");

    document.querySelectorAll(".accordion-item").forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.classList.remove("open");
        }
    });
}
