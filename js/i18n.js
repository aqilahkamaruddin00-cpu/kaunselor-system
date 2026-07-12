// Language Logic
function t(key) {
    const dictionary = TRANSLATIONS[state.lang] || TRANSLATIONS.ms;
    return dictionary[key] ?? TRANSLATIONS.ms[key] ?? key;
}

function interpolate(template, values = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function initLanguage() {
    const savedLang = localStorage.getItem("besut_language") || "ms";
    state.lang = savedLang === "en" ? "en" : "ms";

    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const nextLang = btn.dataset.lang === "en" ? "en" : "ms";
            if (state.lang === nextLang) return;

            state.lang = nextLang;
            localStorage.setItem("besut_language", state.lang);
            applyLanguage();
        });
    });

    applyLanguage({ staticOnly: true });
}

function applyLanguage(options = {}) {
    const htmlLang = state.lang === "en" ? "en" : "ms";
    document.documentElement.lang = htmlLang;
    document.title = t("document.title");

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute("content", t("document.description"));
    }

    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-html]").forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
        el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });

    document.querySelectorAll(".lang-btn").forEach(btn => {
        const isActive = btn.dataset.lang === state.lang;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });

    const portalBtnText = document.querySelector("#portalToggleBtn .btn-text");
    if (portalBtnText) {
        portalBtnText.textContent = state.currentView === "counselor" ? t("portal.student") : t("nav.portal");
    }

    if (options.staticOnly) return;

    renderCounselorAll();
    renderCalendar();
    if (typeof renderAvailabilityCalendar === "function") {
        renderAvailabilityCalendar();
    }
    if (typeof renderAvailabilitySlotEditor === "function") {
        renderAvailabilitySlotEditor();
    }
    if (typeof refreshHomeContent === "function") {
        refreshHomeContent();
    }
    if (typeof renderAuthAccountList === "function") {
        renderAuthAccountList();
    }
    if (typeof renderCounselorPortalIdentity === "function") {
        renderCounselorPortalIdentity();
    }
    if (typeof updatePasswordToggleLabel === "function") {
        updatePasswordToggleLabel(document.getElementById("portalPassword")?.type === "text");
    }
    if (typeof updateRequestTypeUI === "function") {
        updateRequestTypeUI();
    }
    updateBookingFormState();

    if (state.selectedDate) {
        renderTimeSlots(state.selectedDate);
    }

    if (state.currentView === "counselor") {
        renderAppointmentsTable();
        if (typeof renderGeneralAppointmentsTable === "function") {
            renderGeneralAppointmentsTable();
        }
    }
}

function getStatusLabel(status) {
    return t(`status.${status}`);
}

function getSessionTypeLabel(type) {
    return t(`sessionType.${type}`);
}

function getResourceAlert(type) {
    const alertMap = {
        stress: "alerts.resourceStress",
        career: "alerts.resourceCareer",
        mindfulness: "alerts.resourceMindfulness"
    };
    return t(alertMap[type] || "alerts.resourceStress");
}
