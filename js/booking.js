// Local Storage for Booking State
function initAppointments() {
    const localData = localStorage.getItem("besut_counselor_bookings");
    if (localData) {
        state.appointments = JSON.parse(localData);
    } else {
        state.appointments = [...DEMO_APPOINTMENTS];
        localStorage.setItem("besut_counselor_bookings", JSON.stringify(state.appointments));
    }
    updateDashboardStats();
}

function saveAppointmentsToStorage() {
    localStorage.setItem("besut_counselor_bookings", JSON.stringify(state.appointments));
    updateDashboardStats();
    if (typeof refreshHeroAvailability === "function") {
        refreshHeroAvailability();
    }
    if (state.currentView === 'counselor') {
        renderAppointmentsTable();
        renderGeneralAppointmentsTable();
    }
}

// Render Calendar Logic
function adjustMonth(offset) {
    state.currentMonth += offset;
    if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
    } else if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
    }
    renderCalendar();
}

function renderCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const currentMonthYear = document.getElementById("currentMonthYear");

    calendarDays.innerHTML = "";

    const monthNames = t("months");

    currentMonthYear.textContent = `${monthNames[state.currentMonth]} ${state.currentYear}`;

    const counselorVal = document.getElementById("counselorSelect")?.value || "";
    if (!counselorVal) {
        calendarDays.innerHTML = `<p class="select-date-prompt calendar-wide-prompt">${t("booking.chooseCounselorFirst")}</p>`;
        return;
    }

    const firstDayIndex = new Date(state.currentYear, state.currentMonth, 1).getDay();
    const totalDays = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();

    let startingIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < startingIndex; i++) {
        const paddingCell = document.createElement("div");
        calendarDays.appendChild(paddingCell);
    }

    const today = new Date();

    for (let day = 1; day <= totalDays; day++) {
        const dayBtn = document.createElement("button");
        dayBtn.classList.add("calendar-day");
        dayBtn.textContent = day;

        const dateObj = new Date(state.currentYear, state.currentMonth, day);
        const dateString = formatDateToString(dateObj);

        if (dateObj.toDateString() === today.toDateString()) {
            dayBtn.classList.add("today");
        }

        const dayOfWeek = dateObj.getDay();
        const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const hasOpenSlot = typeof hasAvailableSlotOnDate === "function" ? hasAvailableSlotOnDate(dateString) : true;

        if (isWeekend || isPast || !hasOpenSlot) {
            dayBtn.disabled = true;
        } else {
            if (state.selectedDate && dateString === state.selectedDate) {
                dayBtn.classList.add("selected");
            }

            dayBtn.addEventListener("click", () => {
                document.querySelectorAll(".calendar-day").forEach(b => b.classList.remove("selected"));
                dayBtn.classList.add("selected");

                state.selectedDate = dateString;
                state.selectedTimeSlot = null;
                renderTimeSlots(dateString);
                updateBookingFormState();
            });
        }

        calendarDays.appendChild(dayBtn);
    }
}

function formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getReadableDate(dateString) {
    const parts = dateString.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const locale = state.lang === "en" ? "en-US" : "ms-MY";
    return dateObj.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Render Time Slots with Counselor Conflict Checks
function renderTimeSlots(dateStr) {
    const timeSlotsContainer = document.getElementById("timeSlots");
    if (!timeSlotsContainer) return;
    timeSlotsContainer.innerHTML = "";

    const counselorVal = document.getElementById("counselorSelect").value;

    if (!counselorVal) {
        timeSlotsContainer.innerHTML = `<p class="select-date-prompt">${t("booking.chooseCounselorFirst")}</p>`;
        state.selectedTimeSlot = null;
        updateBookingFormState();
        return;
    }

    let hasOpenSlot = false;
    let selectedSlotStillAvailable = false;

    TIME_SLOTS.forEach(slot => {
        const slotBtn = document.createElement("button");
        slotBtn.classList.add("time-slot");
        slotBtn.textContent = slot;

        const isAvailable = typeof isSlotAvailableForSelection === "function"
            ? isSlotAvailableForSelection(counselorVal, dateStr, slot)
            : true;

        if (!isAvailable) {
            slotBtn.disabled = true;
        } else {
            hasOpenSlot = true;
        }

        if (state.selectedTimeSlot === slot && isAvailable) {
            slotBtn.classList.add("selected");
            selectedSlotStillAvailable = true;
        }

        slotBtn.addEventListener("click", () => {
            document.querySelectorAll(".time-slot").forEach(b => b.classList.remove("selected"));
            slotBtn.classList.add("selected");
            state.selectedTimeSlot = slot;
            updateBookingFormState();
        });

        timeSlotsContainer.appendChild(slotBtn);
    });

    if (state.selectedTimeSlot && !selectedSlotStillAvailable) {
        state.selectedTimeSlot = null;
        updateBookingFormState();
    }

    if (!hasOpenSlot) {
        timeSlotsContainer.innerHTML = `<p class="select-date-prompt">${t("booking.noSlots")}</p>`;
        state.selectedTimeSlot = null;
        updateBookingFormState();
    }
}

function focusBookingForm() {
    const bookingSection = document.getElementById("booking");

    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    highlightBookingForm();
}

function highlightBookingForm() {
    const formCard = document.querySelector(".details-form-card");

    if (!formCard) return;

    formCard.classList.remove("booking-card-highlight");
    void formCard.offsetWidth;
    formCard.classList.add("booking-card-highlight");
}

function selectPreferredCounselor(counselorName) {
    const selectEl = document.getElementById("counselorSelect");

    if (!selectEl || !counselorName) return;

    for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value === counselorName) {
            selectEl.selectedIndex = i;
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
            return;
        }
    }
}

function selectSessionType(sessionType) {
    const selectEl = document.getElementById("sessionType");

    if (!selectEl || !sessionType) return;

    selectEl.value = sessionType;
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
}

// Direct Profile Booking Shortcut via event delegation
function setupDirectBookingButtons() {
    const grid = document.getElementById("counselorsGrid");
    if (grid) {
        grid.addEventListener("click", (e) => {
            const btn = e.target.closest(".book-with-counselor-btn");
            if (btn) {
                e.preventDefault();
                const counselorName = btn.getAttribute("data-counselor");

                selectPreferredCounselor(counselorName);
                focusBookingForm();
            }
        });
    }

    // Re-evaluate slots when counselor choice changes
    const selectEl = document.getElementById("counselorSelect");
    if (selectEl) {
        selectEl.addEventListener("change", () => {
            state.selectedDate = null;
            state.selectedTimeSlot = null;
            renderCalendar();
            const timeSlotsContainer = document.getElementById("timeSlots");
            if (timeSlotsContainer) {
                timeSlotsContainer.innerHTML = `<p class="select-date-prompt">${t("booking.selectDatePrompt")}</p>`;
            }
            updateBookingFormState();
        });
    }
}

function setupServiceShortcutButtons() {
    const serviceGrid = document.querySelector(".service-grid");

    if (!serviceGrid) return;

    const openBookingFromService = (card, event) => {
        event.preventDefault();
        const sessionType = card.getAttribute("data-session-type");

        if (typeof openServiceDetailModal === "function") {
            openServiceDetailModal(sessionType);
        } else {
            selectSessionType(sessionType);
            focusBookingForm();
        }
    };

    serviceGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".service-card[data-session-type]");

        if (card) {
            openBookingFromService(card, e);
        }
    });

    serviceGrid.addEventListener("keydown", (e) => {
        const isActivationKey = e.key === "Enter" || e.key === " ";
        const card = e.target.closest(".service-card[data-session-type]");

        if (isActivationKey && card && e.target === card) {
            openBookingFromService(card, e);
        }
    });
}

function setupRequestTypeToggle() {
    const requestTypeInputs = document.querySelectorAll('input[name="requestType"]');

    requestTypeInputs.forEach(input => {
        input.addEventListener("change", updateRequestTypeUI);
    });

    document.querySelectorAll("[data-request-type-link]").forEach(link => {
        link.addEventListener("click", () => {
            setRequestType(link.getAttribute("data-request-type-link"));
        });
    });

    updateRequestTypeUI();
}

function setRequestType(type) {
    const targetInput = document.querySelector(`input[name="requestType"][value="${type}"]`);
    if (!targetInput) return;

    targetInput.checked = true;
    updateRequestTypeUI();
}

function getSelectedRequestType() {
    const selected = document.querySelector('input[name="requestType"]:checked');
    return selected ? selected.value : "self";
}

function updateRequestTypeUI() {
    const isReferral = getSelectedRequestType() === "referral";
    const referralFields = document.getElementById("referralFields");

    if (referralFields) {
        referralFields.hidden = !isReferral;
    }

    document.querySelectorAll("[data-referral-required]").forEach(field => {
        if (isReferral) {
            field.setAttribute("required", "required");
        } else {
            field.removeAttribute("required");
        }
    });

    document.querySelectorAll(".request-type-option").forEach(option => {
        const input = option.querySelector('input[name="requestType"]');
        option.classList.toggle("active", Boolean(input && input.checked));
    });

    const note = document.getElementById("requestTypeNote");
    if (note) {
        note.textContent = isReferral ? t("form.referralFirstNote") : t("form.selfPrivacyNote");
    }
}

// Manage Form Validation & Confirmation Sync
function updateBookingFormState() {
    const summaryWidget = document.getElementById("bookingSummaryWidget");
    const summaryText = document.getElementById("selectedDateTimeText");
    const submitBtn = document.getElementById("submitBookingBtn");

    if (state.selectedDate && state.selectedTimeSlot) {
        const readable = getReadableDate(state.selectedDate);
        summaryText.innerHTML = `<strong>${t("summary.selected")}</strong> ${readable} ${t("summary.at")} ${state.selectedTimeSlot}`;
        summaryWidget.style.borderColor = "var(--primary)";
        submitBtn.disabled = false;
    } else {
        summaryText.textContent = t("booking.noSelection");
        summaryWidget.style.borderColor = "var(--border-color)";
        submitBtn.disabled = true;
    }
}

// Booking form submission handler
function handleFormSubmit(e) {
    e.preventDefault();

    if (!state.selectedDate || !state.selectedTimeSlot) {
        alert(t("alerts.selectDate"));
        return;
    }

    const name = document.getElementById("studentName").value.trim();
    const id = document.getElementById("studentId").value.trim();
    const counselor = document.getElementById("counselorSelect").value;
    const program = document.getElementById("studentProgram").value.trim();
    const sem = document.getElementById("studentSem").value;
    const phone = document.getElementById("studentPhone").value.trim();
    const type = document.getElementById("sessionType").value;
    const reason = document.getElementById("sessionReason").value.trim();
    const requestType = getSelectedRequestType();
    const isReferral = requestType === "referral";
    const attachmentInput = document.getElementById("referralAttachment");

    const slotIsStillAvailable = typeof isSlotAvailableForSelection === "function"
        ? isSlotAvailableForSelection(counselor, state.selectedDate, state.selectedTimeSlot)
        : true;

    if (!slotIsStillAvailable) {
        alert(t("alerts.selectDate"));
        state.selectedTimeSlot = null;
        renderTimeSlots(state.selectedDate);
        updateBookingFormState();
        return;
    }

    const assignedCounselor = counselor;

    // Generate Ticket Ref (T-XXXX)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketRef = `T-${randomNum}`;
    const newId = String(Date.now());

    const newAppointment = {
        id: newId,
        ticketRef: ticketRef,
        studentName: name,
        studentId: id,
        studentProgram: program,
        studentSem: sem,
        studentPhone: phone,
        counselorName: assignedCounselor,
        sessionType: type,
        sessionReason: reason,
        requestType: requestType,
        referralSource: isReferral ? document.getElementById("referralSource").value : "",
        referrerName: isReferral ? document.getElementById("referrerName").value.trim() : "",
        referrerPosition: isReferral ? document.getElementById("referrerPosition").value.trim() : "",
        referrerDepartment: isReferral ? document.getElementById("referrerDepartment").value.trim() : "",
        referralReason: isReferral ? document.getElementById("referralReason").value.trim() : "",
        referralSessionMode: isReferral ? document.getElementById("referralSessionMode").value : "Individual",
        referralPriority: isReferral ? document.getElementById("referralPriority").value : "Normal",
        referralAttachmentName: isReferral && attachmentInput.files.length ? attachmentInput.files[0].name : "",
        dateStr: state.selectedDate,
        timeSlot: state.selectedTimeSlot,
        status: "Pending"
    };

    state.appointments.push(newAppointment);
    saveAppointmentsToStorage();

    showConfirmationModal(newAppointment);

    document.getElementById("appointmentForm").reset();
    updateRequestTypeUI();
    state.selectedDate = null;
    state.selectedTimeSlot = null;
    updateBookingFormState();
    renderCalendar();

    const timeSlotsContainer = document.getElementById("timeSlots");
    timeSlotsContainer.innerHTML = `<p class="select-date-prompt">${t("booking.selectDatePrompt")}</p>`;
}

// Confirmation Modal overlay
function showConfirmationModal(appointment) {
    document.getElementById("confTicket").textContent = appointment.ticketRef;
    document.getElementById("receiptReminderTicket").textContent = appointment.ticketRef;
    document.getElementById("confName").textContent = appointment.studentName;
    document.getElementById("confDateTime").innerHTML = `
        <span>${getReadableDate(appointment.dateStr)}</span>
        <small>${appointment.timeSlot}</small>
    `;
    document.getElementById("confCounselor").textContent = appointment.counselorName;

    document.getElementById("confType").textContent = getSessionTypeLabel(appointment.sessionType);

    document.getElementById("confirmationModal").classList.add("active");
}

function closeConfirmationModal() {
    document.getElementById("confirmationModal").classList.remove("active");
}

function checkStudentBookingStatus() {
    const ticketInput = document.getElementById("statusTicketRef");
    const studentInput = document.getElementById("statusStudentId");
    const resultEl = document.getElementById("studentStatusResult");

    if (!ticketInput || !studentInput || !resultEl) return;

    const ticketRef = ticketInput.value.trim().toUpperCase();
    const studentId = studentInput.value.trim().toUpperCase();
    const appointment = state.appointments.find(app =>
        app.ticketRef.toUpperCase() === ticketRef &&
        app.studentId.toUpperCase() === studentId
    );

    resultEl.classList.add("active");

    if (!appointment) {
        resultEl.innerHTML = `
            <h4>${t("statusChecker.notFound")}</h4>
            <p>${t("statusChecker.note")}</p>
        `;
        return;
    }

    resultEl.innerHTML = `
        <h4>${t("statusChecker.foundTitle")}</h4>
        <p>${t("statusChecker.note")}</p>
        <div class="status-result-meta">
            <span>${t("statusChecker.status")}<strong>${getStatusLabel(appointment.status)}</strong></span>
            <span>${t("statusChecker.requestType")}<strong>${typeof getRequestTypeLabel === "function" ? getRequestTypeLabel(appointment) : t("requestType.self")}</strong></span>
            <span>${t("statusChecker.dateTime")}<strong>${getReadableDate(appointment.dateStr)} ${t("summary.at")} ${appointment.timeSlot}</strong></span>
            <span>${t("statusChecker.counselor")}<strong>${appointment.counselorName}</strong></span>
            <span>${t("statusChecker.type")}<strong>${getSessionTypeLabel(appointment.sessionType)}</strong></span>
        </div>
    `;
}
