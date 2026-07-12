let heroQuoteIndex = 0;
let heroQuoteTimer = null;
let heroAvailabilityIndex = 0;
let heroAvailabilityTimer = null;
let activeServiceType = null;

function initHomeFeatures() {
    setupScrollSpy();
    setupBackToTopButton();
    setupHeroQuotes();
    refreshHeroAvailability();
    setupHeroAvailabilityRotation();
    setupServiceModalActions();
}

function refreshHomeContent() {
    renderHeroQuote();
    refreshHeroAvailability();
}

function setupScrollSpy() {
    const navLinks = [...document.querySelectorAll(".nav-link[href^='#']")];
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
        });
    }, {
        rootMargin: "-35% 0px -50% 0px",
        threshold: [0.1, 0.25, 0.5]
    });

    sections.forEach(section => observer.observe(section));
}

function setupBackToTopButton() {
    const button = document.getElementById("backToTopBtn");
    if (!button) return;

    const toggleButton = () => {
        button.classList.toggle("visible", window.scrollY > 480);
    };

    button.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", toggleButton, { passive: true });
    toggleButton();
}

function setupHeroQuotes() {
    renderHeroQuote();
    window.clearInterval(heroQuoteTimer);

    heroQuoteTimer = window.setInterval(() => {
        const quoteCard = document.querySelector(".card-quote");

        if (quoteCard) {
            quoteCard.classList.remove("quote-slide");

            const quotes = getHeroQuotes();
            heroQuoteIndex = (heroQuoteIndex + 1) % quotes.length;
            renderHeroQuote();

            void quoteCard.offsetWidth;

            quoteCard.classList.add("quote-slide");
        }
    }, 6500);
}

function getHeroQuotes() {
    const quotes = t("hero.quotes");
    return Array.isArray(quotes) && quotes.length ? quotes : [t("hero.quote")];
}

function renderHeroQuote() {
    const quoteEl = document.getElementById("heroQuoteText");
    const byEl = document.getElementById("heroQuoteBy");
    if (!quoteEl || !byEl) return;

    const quotes = getHeroQuotes();
    if (heroQuoteIndex >= quotes.length) {
        heroQuoteIndex = 0;
    }

    quoteEl.textContent = quotes[heroQuoteIndex];
    byEl.textContent = t("hero.quoteBy");
}

function refreshHeroAvailability() {
    const list = document.getElementById("heroAvailabilityList");
    const countEl = document.getElementById("heroAvailabilityCount");
    if (!list || !countEl || typeof isSlotAvailableForCounselor !== "function") return;

    const availableSlots = getUpcomingAvailableSlots(6);
    if (heroAvailabilityIndex >= availableSlots.length) {
        heroAvailabilityIndex = 0;
    }

    countEl.textContent = availableSlots.length;

    if (!availableSlots.length) {
        list.innerHTML = `<p>${t("hero.availabilityEmpty")}</p>`;
        return;
    }

    const visibleSlots = getVisibleHeroSlots(availableSlots, 2);
    list.innerHTML = visibleSlots.map(slot => `
        <a href="#booking" class="hero-slot-link hero-slot-slide" data-counselor="${slot.counselor}" data-date="${slot.dateStr}" data-time="${slot.time}">
            <strong>${slot.time}</strong>
            <span>${slot.dateLabel}</span>
            <small>${slot.counselor}</small>
        </a>
    `).join("");

    list.querySelectorAll(".hero-slot-link").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            selectPreferredCounselor(link.dataset.counselor);
            state.selectedDate = link.dataset.date;
            state.selectedTimeSlot = link.dataset.time;
            renderCalendar();
            renderTimeSlots(state.selectedDate);
            updateBookingFormState();
            focusBookingForm();
        });
    });
}

function getVisibleHeroSlots(slots, count = 2) {
    if (slots.length <= count) return slots;

    const visible = [];
    for (let i = 0; i < count; i++) {
        visible.push(slots[(heroAvailabilityIndex + i) % slots.length]);
    }

    return visible;
}

function setupHeroAvailabilityRotation() {
    window.clearInterval(heroAvailabilityTimer);

    heroAvailabilityTimer = window.setInterval(() => {
        const slots = getUpcomingAvailableSlots(6);
        if (slots.length <= 1) return;

        heroAvailabilityIndex = (heroAvailabilityIndex + 1) % slots.length;
        refreshHeroAvailability();
    }, 4200);
}

function getUpcomingAvailableSlots(limit = 3) {
    const slots = [];
    const today = new Date();

    for (let offset = 0; offset < 21 && slots.length < limit; offset++) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) continue;

        const dateStr = formatDateToString(date);

        for (const slot of TIME_SLOTS) {
            const counselorsForSlot = [...state.counselors].sort((a, b) => {
                const aCount = slots.filter(item => item.counselor === a.name).length;
                const bCount = slots.filter(item => item.counselor === b.name).length;
                return aCount - bCount;
            });

            for (const counselor of counselorsForSlot) {
                if (isSlotAvailableForCounselor(counselor, dateStr, slot)) {
                    slots.push({
                        counselor: counselor.name,
                        dateStr,
                        time: slot,
                        dateLabel: getReadableDate(dateStr)
                    });
                }

                if (slots.length >= limit) break;
            }

            if (slots.length >= limit) break;
        }
    }

    return slots;
}

function setupServiceModalActions() {
    const bookBtn = document.getElementById("serviceModalBookBtn");
    const modal = document.getElementById("serviceDetailModal");

    if (bookBtn) {
        bookBtn.addEventListener("click", () => {
            if (activeServiceType) {
                selectSessionType(activeServiceType);
            }
            closeServiceDetailModal();
            focusBookingForm();
        });
    }

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeServiceDetailModal();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeServiceDetailModal();
        }
    });
}

function openServiceDetailModal(serviceType) {
    const modal = document.getElementById("serviceDetailModal");
    const title = document.getElementById("serviceModalTitle");
    const eyebrow = document.getElementById("serviceModalEyebrow");
    const desc = document.getElementById("serviceModalDesc");
    const duration = document.getElementById("serviceModalDuration");
    const suitable = document.getElementById("serviceModalSuitable");
    const focusList = document.getElementById("serviceModalFocusList");

    if (!modal || !title || !eyebrow || !desc || !duration || !suitable || !focusList) return;

    activeServiceType = serviceType;
    const titleKey = getServiceTitleKey(serviceType);
    const durationKey = serviceType === "Financial" ? "services.duration30" : "services.duration45";
    const focusItems = t(`serviceDetail.${serviceType}.focus`);

    eyebrow.textContent = t("serviceModal.eyebrow");
    title.textContent = t(titleKey);
    desc.textContent = t(`serviceDetail.${serviceType}.desc`);
    duration.textContent = t(durationKey);
    suitable.textContent = t(`serviceDetail.${serviceType}.suitable`);
    focusList.innerHTML = (Array.isArray(focusItems) ? focusItems : []).map(item => `<li>${item}</li>`).join("");

    modal.classList.add("active");
}

function closeServiceDetailModal() {
    const modal = document.getElementById("serviceDetailModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function getServiceTitleKey(serviceType) {
    const keyMap = {
        Academic: "services.academicTitle",
        Career: "services.careerTitle",
        Personal: "services.emotionTitle",
        Financial: "services.welfareTitle"
    };

    return keyMap[serviceType] || "services.title";
}
