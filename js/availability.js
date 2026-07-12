const AVAILABILITY_STORAGE_KEY = "besut_counselor_availability";

function initAvailability() {
    loadAvailabilitySettings();
    renderAvailabilityCounselorOptions();
    renderAvailabilityCalendar();
    renderAvailabilitySlotEditor();

    const counselorSelect = document.getElementById("availabilityCounselorSelect");
    if (counselorSelect) {
        counselorSelect.addEventListener("change", () => {
            state.selectedAvailabilityDate = null;
            renderAvailabilityCalendar();
            renderAvailabilitySlotEditor();
        });
    }

    const minNoticeInput = document.getElementById("minNoticeHours");
    if (minNoticeInput) {
        minNoticeInput.value = state.minNoticeHours;
        minNoticeInput.addEventListener("change", () => {
            const nextValue = Number.parseInt(minNoticeInput.value, 10);
            state.minNoticeHours = Number.isFinite(nextValue) ? Math.min(Math.max(nextValue, 1), 168) : 24;
            minNoticeInput.value = state.minNoticeHours;
            saveAvailabilitySettings();
            refreshBookingAvailability();
            showAvailabilityStatus(t("availability.saved"));
        });
    }

    const prevBtn = document.getElementById("availabilityPrevMonthBtn");
    const nextBtn = document.getElementById("availabilityNextMonthBtn");

    if (prevBtn) prevBtn.addEventListener("click", () => adjustAvailabilityMonth(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => adjustAvailabilityMonth(1));

    const openAllBtn = document.getElementById("openAllSlotsBtn");
    const closeAllBtn = document.getElementById("closeAllSlotsBtn");

    if (openAllBtn) openAllBtn.addEventListener("click", () => setSelectedDateSlots([...TIME_SLOTS]));
    if (closeAllBtn) closeAllBtn.addEventListener("click", () => setSelectedDateSlots([]));
}

function loadAvailabilitySettings() {
    const stored = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
    if (!stored) return;

    try {
        const settings = JSON.parse(stored);
        state.unavailableDates = settings.unavailableDates || {};
        state.availabilitySlots = settings.availabilitySlots || {};
        state.minNoticeHours = Number.isFinite(settings.minNoticeHours) ? settings.minNoticeHours : 24;
    } catch (error) {
        state.unavailableDates = {};
        state.availabilitySlots = {};
        state.minNoticeHours = 24;
    }
}

function saveAvailabilitySettings() {
    localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify({
        unavailableDates: state.unavailableDates,
        availabilitySlots: state.availabilitySlots,
        minNoticeHours: state.minNoticeHours
    }));
}

function renderAvailabilityCounselorOptions() {
    const select = document.getElementById("availabilityCounselorSelect");
    if (!select) return;

    const currentValue = state.currentCounselorId || select.value;
    select.innerHTML = "";

    if (state.counselors.length === 0) {
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = t("availability.noCounselor");
        select.appendChild(emptyOption);
        renderAvailabilityCalendar();
        return;
    }

    const counselors = state.currentCounselorId
        ? state.counselors.filter(counselor => counselor.id === state.currentCounselorId)
        : state.counselors;

    counselors.forEach(counselor => {
        const option = document.createElement("option");
        option.value = counselor.id;
        option.textContent = counselor.name;
        select.appendChild(option);
    });

    if ([...select.options].some(option => option.value === currentValue)) {
        select.value = currentValue;
    }

    select.disabled = Boolean(state.currentCounselorId);

    renderAvailabilityCalendar();
    renderAvailabilitySlotEditor();
}

function adjustAvailabilityMonth(offset) {
    state.availabilityMonth += offset;

    if (state.availabilityMonth < 0) {
        state.availabilityMonth = 11;
        state.availabilityYear--;
    } else if (state.availabilityMonth > 11) {
        state.availabilityMonth = 0;
        state.availabilityYear++;
    }

    renderAvailabilityCalendar();
}

function renderAvailabilityCalendar() {
    const daysContainer = document.getElementById("availabilityCalendarDays");
    const monthTitle = document.getElementById("availabilityMonthYear");
    const select = document.getElementById("availabilityCounselorSelect");

    if (!daysContainer || !monthTitle || !select) return;

    daysContainer.innerHTML = "";
    monthTitle.textContent = `${t("months")[state.availabilityMonth]} ${state.availabilityYear}`;

    if (!select.value) {
        daysContainer.innerHTML = `<p class="select-date-prompt">${t("availability.noCounselor")}</p>`;
        return;
    }

    const firstDayIndex = new Date(state.availabilityYear, state.availabilityMonth, 1).getDay();
    const totalDays = new Date(state.availabilityYear, state.availabilityMonth + 1, 0).getDate();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < firstDayIndex; i++) {
        daysContainer.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateObj = new Date(state.availabilityYear, state.availabilityMonth, day);
        const dateString = formatDateToString(dateObj);
        const isPast = dateObj < todayStart;
        const hasOpenSlots = hasCounselorOpenSlotsById(select.value, dateString);
        const hasStudentVisibleSlots = hasStudentVisibleSlotForCounselorById(select.value, dateString);
        const isUnavailable = !hasStudentVisibleSlots;
        const isLimited = hasOpenSlots && !hasStudentVisibleSlots;
        const isSelected = state.selectedAvailabilityDate === dateString;

        const dayBtn = document.createElement("button");
        dayBtn.type = "button";
        dayBtn.className = "availability-day";
        dayBtn.textContent = day;
        dayBtn.classList.toggle("unavailable", isUnavailable);
        dayBtn.classList.toggle("limited", isLimited);
        dayBtn.classList.toggle("selected", isSelected);
        dayBtn.classList.toggle("past", isPast);
        dayBtn.setAttribute("aria-pressed", String(isUnavailable));

        if (isPast) {
            dayBtn.disabled = true;
        } else {
            dayBtn.addEventListener("click", () => {
                state.selectedAvailabilityDate = dateString;
                renderAvailabilityCalendar();
                renderAvailabilitySlotEditor();
            });
        }

        daysContainer.appendChild(dayBtn);
    }
}

function renderAvailabilitySlotEditor() {
    const selectedDateEl = document.getElementById("availabilitySelectedDate");
    const hintEl = document.getElementById("availabilitySlotHint");
    const slotsEl = document.getElementById("availabilityTimeSlots");
    const openAllBtn = document.getElementById("openAllSlotsBtn");
    const closeAllBtn = document.getElementById("closeAllSlotsBtn");
    const counselorId = getActiveAvailabilityCounselorId();
    const dateString = state.selectedAvailabilityDate;

    if (!selectedDateEl || !hintEl || !slotsEl || !openAllBtn || !closeAllBtn) return;

    const disabled = !counselorId || !dateString;
    openAllBtn.disabled = disabled;
    closeAllBtn.disabled = disabled;

    if (disabled) {
        selectedDateEl.textContent = t("availability.noDate");
        hintEl.textContent = t("availability.selectDate");
        slotsEl.innerHTML = "";
        return;
    }

    selectedDateEl.textContent = getReadableDate(dateString);
    hintEl.textContent = t("availability.defaultSlots");

    const openSlots = getOpenSlotsForCounselorDate(counselorId, dateString);
    slotsEl.innerHTML = TIME_SLOTS.map(slot => `
        <button type="button" class="availability-time-chip ${getAvailabilitySlotClass(counselorId, dateString, slot, openSlots)}" data-slot="${slot}" aria-pressed="${openSlots.includes(slot)}" title="${getAvailabilitySlotHint(counselorId, dateString, slot, openSlots)}">
            ${slot}
            ${getAvailabilitySlotNote(counselorId, dateString, slot, openSlots)}
        </button>
    `).join("");

    slotsEl.querySelectorAll(".availability-time-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            toggleSelectedDateSlot(chip.dataset.slot);
        });
    });
}

function getAvailabilitySlotClass(counselorId, dateString, slot, openSlots) {
    const classes = [];

    if (openSlots.includes(slot)) {
        classes.push("active");
    }

    if (openSlots.includes(slot) && !respectsMinimumNotice(dateString, slot)) {
        classes.push("notice-blocked");
    }

    const counselor = state.counselors.find(item => item.id === counselorId);
    if (counselor && isSlotBookedForCounselor(counselor.name, dateString, slot)) {
        classes.push("booked");
    }

    return classes.join(" ");
}

function getAvailabilitySlotHint(counselorId, dateString, slot, openSlots) {
    if (!openSlots.includes(slot)) return t("availability.closedSlot");
    if (!respectsMinimumNotice(dateString, slot)) return t("availability.tooSoon");

    const counselor = state.counselors.find(item => item.id === counselorId);
    if (counselor && isSlotBookedForCounselor(counselor.name, dateString, slot)) {
        return t("availability.bookedSlot");
    }

    return t("availability.visibleToStudents");
}

function getAvailabilitySlotNote(counselorId, dateString, slot, openSlots) {
    if (!openSlots.includes(slot)) return `<small>${t("availability.closedShort")}</small>`;
    if (!respectsMinimumNotice(dateString, slot)) return `<small>${t("availability.tooSoonShort")}</small>`;

    const counselor = state.counselors.find(item => item.id === counselorId);
    if (counselor && isSlotBookedForCounselor(counselor.name, dateString, slot)) {
        return `<small>${t("availability.bookedShort")}</small>`;
    }

    return `<small>${t("availability.openShort")}</small>`;
}

function getActiveAvailabilityCounselorId() {
    return state.currentCounselorId || document.getElementById("availabilityCounselorSelect")?.value || "";
}

function ensureAvailabilitySlotBucket(counselorId) {
    if (!state.availabilitySlots[counselorId]) {
        state.availabilitySlots[counselorId] = {};
    }
}

function getOpenSlotsForCounselorDate(counselorId, dateString) {
    const customSlots = state.availabilitySlots[counselorId]?.[dateString];
    if (Array.isArray(customSlots)) return customSlots;
    if (isCounselorUnavailableById(counselorId, dateString)) return [];
    return [...TIME_SLOTS];
}

function setSelectedDateSlots(slots) {
    const counselorId = getActiveAvailabilityCounselorId();
    const dateString = state.selectedAvailabilityDate;
    if (!counselorId || !dateString) return;

    ensureAvailabilitySlotBucket(counselorId);
    state.availabilitySlots[counselorId][dateString] = [...slots];
    syncUnavailableDateFromSlots(counselorId, dateString);
    saveAvailabilitySettings();
    renderAvailabilityCalendar();
    renderAvailabilitySlotEditor();
    refreshBookingAvailability();
    showAvailabilityStatus(t("availability.saved"));
}

function toggleSelectedDateSlot(slot) {
    const counselorId = getActiveAvailabilityCounselorId();
    const dateString = state.selectedAvailabilityDate;
    if (!counselorId || !dateString) return;

    const currentSlots = new Set(getOpenSlotsForCounselorDate(counselorId, dateString));
    if (currentSlots.has(slot)) {
        currentSlots.delete(slot);
    } else {
        currentSlots.add(slot);
    }

    setSelectedDateSlots(TIME_SLOTS.filter(timeSlot => currentSlots.has(timeSlot)));
}

function syncUnavailableDateFromSlots(counselorId, dateString) {
    if (!state.unavailableDates[counselorId]) {
        state.unavailableDates[counselorId] = [];
    }

    const unavailableSet = new Set(state.unavailableDates[counselorId]);
    const slots = state.availabilitySlots[counselorId]?.[dateString];

    if (Array.isArray(slots) && slots.length === 0) {
        unavailableSet.add(dateString);
    } else {
        unavailableSet.delete(dateString);
    }

    state.unavailableDates[counselorId] = [...unavailableSet].sort();
}

function showAvailabilityStatus(message) {
    const statusEl = document.getElementById("availabilityStatus");
    if (!statusEl) return;

    statusEl.textContent = message;
    window.clearTimeout(showAvailabilityStatus.timeoutId);
    showAvailabilityStatus.timeoutId = window.setTimeout(() => {
        statusEl.textContent = "";
    }, 2200);
}

function refreshBookingAvailability() {
    if (typeof renderCalendar === "function") {
        renderCalendar();
    }

    if (state.selectedDate && typeof renderTimeSlots === "function") {
        renderTimeSlots(state.selectedDate);
        updateBookingFormState();
    }

    if (typeof refreshHeroAvailability === "function") {
        refreshHeroAvailability();
    }
}

function getCounselorIdByName(counselorName) {
    const counselor = state.counselors.find(c => c.name === counselorName);
    return counselor ? counselor.id : null;
}

function getCounselorByName(counselorName) {
    return state.counselors.find(c => c.name === counselorName) || null;
}

function isCounselorUnavailableById(counselorId, dateString) {
    return Boolean(counselorId && state.unavailableDates[counselorId]?.includes(dateString));
}

function hasCounselorOpenSlotsById(counselorId, dateString) {
    return getOpenSlotsForCounselorDate(counselorId, dateString).length > 0;
}

function hasStudentVisibleSlotForCounselorById(counselorId, dateString) {
    const counselor = state.counselors.find(item => item.id === counselorId);
    if (!counselor) return false;
    return TIME_SLOTS.some(slot => isSlotAvailableForCounselor(counselor, dateString, slot));
}

function isCounselorUnavailable(counselorName, dateString) {
    const counselorId = getCounselorIdByName(counselorName);
    return isCounselorUnavailableById(counselorId, dateString);
}

function parseSlotDateTime(dateString, slot) {
    const [year, month, day] = dateString.split("-").map(Number);
    const [time, period] = slot.split(" ");
    let [hour, minute] = time.split(":").map(Number);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function respectsMinimumNotice(dateString, slot) {
    const slotTime = parseSlotDateTime(dateString, slot).getTime();
    const earliestAllowedTime = Date.now() + (state.minNoticeHours * 60 * 60 * 1000);
    return slotTime >= earliestAllowedTime;
}

function isSlotBookedForCounselor(counselorName, dateString, slot) {
    return state.appointments.some(app =>
        app.dateStr === dateString &&
        app.timeSlot === slot &&
        app.status === "Approved" &&
        app.counselorName === counselorName
    );
}

function isSlotAvailableForCounselor(counselor, dateString, slot) {
    if (!counselor) return false;
    if (!getOpenSlotsForCounselorDate(counselor.id, dateString).includes(slot)) return false;
    if (!respectsMinimumNotice(dateString, slot)) return false;
    return !isSlotBookedForCounselor(counselor.name, dateString, slot);
}

function isSlotAvailableForSelection(counselorValue, dateString, slot) {
    if (!counselorValue) {
        return false;
    }

    return isSlotAvailableForCounselor(getCounselorByName(counselorValue), dateString, slot);
}

function hasAvailableSlotOnDate(dateString, counselorValue = null) {
    const selectedCounselor = counselorValue ?? document.getElementById("counselorSelect")?.value ?? "";
    return TIME_SLOTS.some(slot => isSlotAvailableForSelection(selectedCounselor, dateString, slot));
}
