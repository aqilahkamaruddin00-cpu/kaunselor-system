// Dashboard Management Logic
function updateDashboardStats() {
    const visibleAppointments = getVisibleAppointmentsForCurrentCounselor();
    const total = visibleAppointments.length;
    const pending = visibleAppointments.filter(app => app.status === 'Pending').length;
    const approved = visibleAppointments.filter(app => app.status === 'Approved').length;
    const referral = visibleAppointments.filter(app => isReferralAppointment(app)).length;
    const selfBooking = visibleAppointments.filter(app => !isReferralAppointment(app)).length;

    document.getElementById("statsTotal").textContent = total;
    document.getElementById("statsPending").textContent = pending;
    document.getElementById("statsApproved").textContent = approved;
    const referralStat = document.getElementById("statsReferral");
    const selfBookingStat = document.getElementById("statsSelfBooking");
    if (referralStat) referralStat.textContent = referral;
    if (selfBookingStat) selfBookingStat.textContent = selfBooking;
    renderCounselorAlert(pending);
}

function renderCounselorAlert(pendingCount = 0) {
    const alertCard = document.getElementById("counselorAlertCard");
    if (!alertCard) return;

    const hasPending = pendingCount > 0;
    alertCard.classList.toggle("has-pending", hasPending);
    alertCard.innerHTML = `
        <span class="alert-dot" aria-hidden="true"></span>
        <div>
            <strong>${hasPending ? interpolate(t("dashboard.newBookingAlert"), { count: pendingCount }) : t("dashboard.noNewBookingAlert")}</strong>
            <small>${t("dashboard.subtitle")}</small>
        </div>
    `;
}

function isReferralAppointment(app) {
    return app && app.requestType === "referral";
}

function getReferralSourceLabel(source) {
    const labels = {
        Lecturer: "referralSource.Lecturer",
        HEP: "referralSource.HEP",
        Warden: "referralSource.Warden"
    };
    return t(labels[source] || "requestType.referral");
}

function getRequestTypeLabel(app) {
    return isReferralAppointment(app) ? getReferralSourceLabel(app.referralSource) : t("requestType.self");
}

function getSessionModeLabel(mode) {
    const labels = {
        PendingDecision: "sessionMode.PendingDecision",
        Individual: "sessionMode.Individual",
        Group: "sessionMode.Group"
    };
    return t(labels[mode] || "sessionMode.PendingDecision");
}

function getPriorityLabel(priority) {
    return t(priority === "Urgent" ? "priority.Urgent" : "priority.Normal");
}

function renderRequestBadges(app) {
    const isReferral = isReferralAppointment(app);
    const requestClass = isReferral ? "referral" : "self";
    const modeBadge = isReferral
        ? `<span class="request-badge mode">${getSessionModeLabel(app.referralSessionMode)}</span>`
        : "";
    const priorityBadge = isReferral
        ? `<span class="request-badge priority ${app.referralPriority === "Urgent" ? "urgent" : ""}">${getPriorityLabel(app.referralPriority)}</span>`
        : "";

    return `
        <div class="booking-tag-row">
            <span class="request-badge ${requestClass}">${getRequestTypeLabel(app)}</span>
            ${modeBadge}
            ${priorityBadge}
        </div>
    `;
}

function renderSessionModeDecision(app) {
    if (!isReferralAppointment(app)) return "";

    const currentMode = app.referralSessionMode || "PendingDecision";
    const options = ["PendingDecision", "Individual", "Group"].map(mode => {
        const selected = currentMode === mode ? "selected" : "";
        return `<option value="${mode}" ${selected}>${getSessionModeLabel(mode)}</option>`;
    }).join("");

    return `
        <label class="case-mode-control">
            <span>${t("dashboard.sessionDecision")}</span>
            <select onchange="updateAppointmentSessionMode('${app.id}', this.value)">
                ${options}
            </select>
        </label>
    `;
}

function getVisibleAppointmentsForCurrentCounselor() {
    const counselor = typeof getCurrentCounselor === "function" ? getCurrentCounselor() : null;
    if (!counselor) return [...state.appointments];
    return state.appointments.filter(app => app.counselorName === counselor.name);
}

function renderAppointmentsTable() {
    const tableBody = document.getElementById("appointmentsTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const filterStatus = document.getElementById("filterStatus").value;
    const filterCounselor = document.getElementById("filterCounselor").value;

    let filteredList = getVisibleAppointmentsForCurrentCounselor();

    if (filterStatus !== "all") {
        filteredList = filteredList.filter(app => app.status === filterStatus);
    }

    if (filterCounselor !== "all") {
        filteredList = filteredList.filter(app => app.counselorName === filterCounselor);
    }

    filteredList.sort((a, b) => {
        return new Date(b.dateStr + ' ' + b.timeSlot) - new Date(a.dateStr + ' ' + a.timeSlot);
    });

    if (filteredList.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="6" style="text-align: center; color: var(--text-light); padding: 40px;">${t("table.noAppointments")}</td>`;
        tableBody.appendChild(emptyRow);
        return;
    }

    filteredList.forEach(app => {
        const tr = document.createElement("tr");

        const readableDate = getReadableDate(app.dateStr);
        const sessionLabel = getSessionTypeLabel(app.sessionType);
        const displayCounselor = app.counselorName.split(' ').slice(0, 2).join(' ') || app.counselorName;
        const reasonText = isReferralAppointment(app)
            ? (app.referralReason || app.sessionReason || t("table.noDetails"))
            : (app.sessionReason || t("table.noDetails"));
        const referrerText = isReferralAppointment(app) && app.referrerName
            ? `<div class="table-meta-text referral-meta">${t("table.referrer")}: ${app.referrerName} (${app.referrerPosition || "-"})</div>`
            : "";

        tr.innerHTML = `
            <td>
                <div style="font-weight:600;">${readableDate}</div>
                <div class="table-meta-text">${app.timeSlot}</div>
                <div style="font-size:0.75rem; color:var(--text-light); margin-top:2px;">${t("table.ref")}: ${app.ticketRef}</div>
            </td>
            <td>
                <div class="table-student-cell">
                    <span class="table-student-name">${app.studentName}</span>
                    <span class="table-student-id">${app.studentId} - ${app.studentProgram} (${app.studentSem})</span>
                    <span class="table-meta-text" style="margin-top:2px; font-weight:500;">Tel: ${app.studentPhone}</span>
                </div>
            </td>
            <td>
                <div style="font-weight:500;">${displayCounselor}</div>
                <div class="table-meta-text">${t("table.unit")}</div>
            </td>
            <td>
                <span class="specialty" style="background-color:var(--border-color); color:var(--text-primary); padding:2px 8px; border-radius:4px; font-size:0.75rem;">${sessionLabel}</span>
                ${renderRequestBadges(app)}
                ${referrerText}
                <p style="margin-top:6px; font-size:0.8rem; color:var(--text-secondary); max-width: 250px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${reasonText}">
                    ${reasonText}
                </p>
            </td>
            <td>
                <span class="status-badge ${app.status.toLowerCase()}">${getStatusLabel(app.status)}</span>
            </td>
            <td>
                ${renderSessionModeDecision(app)}
                <div class="action-buttons">
                    ${app.status === 'Pending' ? `
                        <button class="btn-icon-only approve" onclick="updateAppointmentStatus('${app.id}', 'Approved')" title="${t("action.approve")}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button class="btn-icon-only reject" onclick="updateAppointmentStatus('${app.id}', 'Cancelled')" title="${t("action.cancelDecline")}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <button class="btn-icon-only transfer" onclick="transferAppointment('${app.id}')" title="${t("action.transfer")}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10l-3-3"></path><path d="M17 17H7l3 3"></path><path d="M17 7 7 17"></path></svg>
                        </button>
                    ` : ''}
                    
                    ${app.status === 'Approved' ? `
                        <button class="btn-icon-only resched" onclick="triggerReschedule('${app.id}')" title="${t("action.reschedule")}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </button>
                        <button class="btn-icon-only transfer" onclick="transferAppointment('${app.id}')" title="${t("action.transfer")}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10l-3-3"></path><path d="M17 17H7l3 3"></path><path d="M17 7 7 17"></path></svg>
                        </button>
                        <button class="btn-icon-only reject" onclick="updateAppointmentStatus('${app.id}', 'Cancelled')" title="${t("action.cancel")}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    ` : ''}
                    
                    ${app.status === 'Cancelled' ? `
                        <button class="btn-icon-only approve" onclick="updateAppointmentStatus('${app.id}', 'Pending')" title="${t("action.reopen")}">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                        </button>
                    ` : ''}
                    <button class="btn-icon-only whatsapp" onclick="openWhatsAppNotice('${app.id}')" title="${t("action.whatsapp")}">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L4 20l.9-4.5A8.5 8.5 0 1 1 21 11.5Z"></path><path d="M9 9c.5 2 2 3.5 4 4"></path></svg>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(tr);
    });
}

function renderGeneralAppointmentsTable() {
    const tableBody = document.getElementById("generalAppointmentsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const appointments = [...state.appointments].sort((a, b) => {
        return new Date(a.dateStr + ' ' + a.timeSlot) - new Date(b.dateStr + ' ' + b.timeSlot);
    });

    if (appointments.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="4" style="text-align: center; color: var(--text-light); padding: 34px;">${t("table.noGeneralAppointments")}</td>`;
        tableBody.appendChild(emptyRow);
        return;
    }

    appointments.forEach(app => {
        const tr = document.createElement("tr");
        const readableDate = getReadableDate(app.dateStr);
        const displayCounselor = app.counselorName.split(' ').slice(0, 3).join(' ') || app.counselorName;

        tr.innerHTML = `
            <td>
                <div style="font-weight:700;">${readableDate}</div>
                <div class="table-meta-text">${app.timeSlot}</div>
                <div style="font-size:0.75rem; color:var(--text-light); margin-top:2px;">${t("table.ref")}: ${app.ticketRef}</div>
            </td>
            <td>
                <div class="table-student-cell">
                    <span class="table-student-name">${app.studentName}</span>
                    <span class="table-student-id">${app.studentId} - ${app.studentProgram} (${app.studentSem})</span>
                    ${renderRequestBadges(app)}
                </div>
            </td>
            <td>
                <div style="font-weight:600;">${displayCounselor}</div>
                <div class="table-meta-text">${t("table.unit")}</div>
            </td>
            <td>
                <span class="status-badge ${app.status.toLowerCase()}">${getStatusLabel(app.status)}</span>
            </td>
        `;

        tableBody.appendChild(tr);
    });
}

function filterAppointments() {
    renderAppointmentsTable();
}

function downloadCurrentCounselorAppointments() {
    const counselor = typeof getCurrentCounselor === "function" ? getCurrentCounselor() : null;
    const appointments = getVisibleAppointmentsForCurrentCounselor();
    const filenameName = counselor ? counselor.name : "kaunselor";
    downloadAppointmentsCsv(appointments, `tempahan-${slugifyFilename(filenameName)}.csv`);
}

function downloadAllAppointments() {
    downloadAppointmentsCsv(state.appointments, "semua-tempahan-pelajar.csv");
}

function downloadAppointmentsCsv(appointments, filename) {
    if (!appointments.length) {
        alert(t("download.empty"));
        return;
    }

    const headers = [
        "Rujukan Tiket",
        "Nama Pelajar",
        "No Pelajar",
        "Program",
        "Semester",
        "No Telefon",
        "Kaunselor",
        "Jenis Permohonan",
        "Kategori Rujukan",
        "Nama Perujuk",
        "Jawatan Perujuk",
        "Jabatan/Program Perujuk",
        "Keputusan Sesi",
        "Tahap Keutamaan",
        "Jenis Sesi",
        "Tarikh",
        "Masa",
        "Status",
        "Keperluan Ringkas",
        "Sebab Rujukan",
        "Lampiran"
    ];

    const rows = appointments.map(app => [
        app.ticketRef,
        app.studentName,
        app.studentId,
        app.studentProgram,
        app.studentSem,
        app.studentPhone,
        app.counselorName,
        getRequestTypeLabel(app),
        isReferralAppointment(app) ? getReferralSourceLabel(app.referralSource) : "",
        app.referrerName || "",
        app.referrerPosition || "",
        app.referrerDepartment || "",
        isReferralAppointment(app) ? getSessionModeLabel(app.referralSessionMode) : "",
        isReferralAppointment(app) ? getPriorityLabel(app.referralPriority) : "",
        getSessionTypeLabel(app.sessionType),
        formatDateForStudent(app.dateStr),
        app.timeSlot,
        getStatusLabel(app.status),
        app.sessionReason || "",
        app.referralReason || "",
        app.referralAttachmentName || ""
    ]);

    const csv = [headers, ...rows].map(row => row.map(escapeCsvValue).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}

function escapeCsvValue(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

function slugifyFilename(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "data";
}

function updateAppointmentStatus(appId, newStatus) {
    const index = state.appointments.findIndex(app => app.id === appId);
    if (index !== -1) {
        state.appointments[index].status = newStatus;
        saveAppointmentsToStorage();
    }
}

function updateAppointmentSessionMode(appId, mode) {
    const appointment = state.appointments.find(app => app.id === appId);
    if (!appointment) return;

    appointment.referralSessionMode = mode;
    saveAppointmentsToStorage();
}

function transferAppointment(appId) {
    const app = state.appointments.find(item => item.id === appId);
    if (!app) return;

    const candidates = state.counselors.filter(counselor => counselor.name !== app.counselorName);
    if (!candidates.length) {
        alert(t("transfer.invalid"));
        return;
    }

    const options = candidates.map((counselor, index) => `${index + 1}. ${counselor.name}`).join("\n");
    const input = prompt(interpolate(t("transfer.prompt"), {
        ref: app.ticketRef,
        options
    }));

    if (!input) return;

    const selectedIndex = Number.parseInt(input, 10) - 1;
    const nextCounselor = candidates[selectedIndex];
    if (!nextCounselor) {
        alert(t("transfer.invalid"));
        return;
    }

    app.transferredFrom = app.counselorName;
    app.counselorName = nextCounselor.name;
    app.status = "Pending";
    saveAppointmentsToStorage();
    alert(t("transfer.success"));
}

function openWhatsAppNotice(appId) {
    const app = state.appointments.find(item => item.id === appId);
    if (!app || !app.studentPhone) {
        alert(t("whatsapp.noPhone"));
        return;
    }

    const phoneNumber = normalizeMalaysiaPhone(app.studentPhone);
    if (!phoneNumber) {
        alert(t("whatsapp.noPhone"));
        return;
    }

    const message = interpolate(t("whatsapp.message"), {
        name: app.studentName,
        ref: app.ticketRef,
        status: getStatusLabel(app.status),
        date: getReadableDate(app.dateStr),
        time: app.timeSlot,
        counselor: app.counselorName
    });

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

function normalizeMalaysiaPhone(value) {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("60")) return digits;
    if (digits.startsWith("0")) return `6${digits}`;
    return digits;
}

function triggerReschedule(appId) {
    const app = state.appointments.find(a => a.id === appId);
    if (!app) return;

    const input = prompt(interpolate(t("reschedule.prompt"), { ref: app.ticketRef, name: app.studentName }), formatDateForStudent(app.dateStr));

    if (input) {
        const parsedDate = parseStudentDateInput(input);
        if (!parsedDate) {
            alert(t("reschedule.invalidDate"));
            return;
        }

        const nextTime = prompt(interpolate(t("reschedule.timePrompt"), { slots: TIME_SLOTS.join(", ") }), app.timeSlot);
        if (!nextTime) return;

        const parsedTime = parseTimeSlotInput(nextTime);
        if (!parsedTime) {
            alert(t("reschedule.invalidTime"));
            return;
        }

        app.dateStr = parsedDate;
        app.timeSlot = parsedTime;
        app.status = 'Pending';
        saveAppointmentsToStorage();
        alert(t("reschedule.success"));
    }
}

function parseStudentDateInput(value) {
    const match = String(value).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!match) return null;

    const day = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const yearRaw = Number.parseInt(match[3], 10);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return formatDateToString(date);
}

function formatDateForStudent(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${String(year).slice(-2)}`;
}

function parseTimeSlotInput(value) {
    const normalized = String(value).trim().toUpperCase().replace(/\s+/g, " ");
    const exact = TIME_SLOTS.find(slot => slot.toUpperCase() === normalized);
    if (exact) return exact;

    const compact = normalized.replace(/\s/g, "");
    const match = compact.match(/^(\d{1,2})(?::?(\d{2}))?(AM|PM)$/);
    if (!match) return null;

    const hour = match[1].padStart(2, "0");
    const minute = match[2] || "00";
    const period = match[3];
    const candidate = `${hour}:${minute} ${period}`;

    return TIME_SLOTS.find(slot => slot.toUpperCase() === candidate) || null;
}
