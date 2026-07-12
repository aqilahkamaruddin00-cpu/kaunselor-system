// Counselor Portal Mode Toggle
function togglePortalMode() {
    if (state.currentView === 'counselor') {
        switchToView('student');
    } else if (state.counselorLoggedIn) {
        switchToView('counselor');
    } else {
        openPasswordModal();
    }
}

function getCurrentCounselor() {
    return state.counselors.find(c => c.id === state.currentCounselorId) || null;
}

function switchToView(view) {
    state.currentView = view;

    const studentView = document.getElementById("studentView");
    const counselorView = document.getElementById("counselorView");
    const portalBtnText = document.querySelector("#portalToggleBtn .btn-text");

    if (typeof closeMobileMenu === "function") {
        closeMobileMenu();
    }

    if (view === 'counselor') {
        studentView.classList.remove("active");
        counselorView.classList.add("active");
        portalBtnText.textContent = t("portal.student");
        renderCounselorPortalIdentity();
        renderCounselorAll();
        renderAppointmentsTable();
        renderGeneralAppointmentsTable();
        updateDashboardStats();
        setCounselorManagementVisibility(false);
        window.scrollTo(0, 0);
    } else {
        counselorView.classList.remove("active");
        studentView.classList.add("active");
        portalBtnText.textContent = t("nav.portal");
        setCounselorManagementVisibility(true);
        window.scrollTo(0, 0);
    }
}

function exitPortalMode() {
    state.counselorLoggedIn = false;
    state.currentCounselorId = null;
    state.authSelectedCounselorId = null;
    switchToView('student');
}

// Authentication Modal Logic
function openPasswordModal() {
    renderAuthAccountList();
    document.getElementById("passwordModal").classList.add("active");
    document.getElementById("portalPassword").focus();
}

function closePasswordModal() {
    document.getElementById("passwordModal").classList.remove("active");
    document.getElementById("portalPassword").value = "";
    document.getElementById("portalPassword").type = "password";
    updatePasswordToggleLabel(false);
    document.getElementById("authErrorMsg").style.display = "none";
}

function togglePasswordVisibility() {
    const input = document.getElementById("portalPassword");
    if (!input) return;

    const shouldShow = input.type === "password";
    input.type = shouldShow ? "text" : "password";
    updatePasswordToggleLabel(shouldShow);
}

function updatePasswordToggleLabel(isVisible) {
    const button = document.querySelector(".password-toggle-btn");
    if (!button) return;

    button.setAttribute("aria-label", isVisible ? t("auth.hidePassword") : t("auth.showPassword"));
}

function renderAuthAccountList() {
    const accountList = document.getElementById("authAccountList");
    if (!accountList) return;

    if (!state.authSelectedCounselorId && state.counselors.length > 0) {
        state.authSelectedCounselorId = state.counselors[0].id;
    }

    accountList.innerHTML = state.counselors.map(counselor => `
        <button type="button" class="auth-account-card ${state.authSelectedCounselorId === counselor.id ? 'selected' : ''}" data-counselor-id="${counselor.id}">
            <img src="${counselor.photo}" alt="${counselor.name}" onerror="this.style.display='none';">
            <span>
                <strong>${counselor.name}</strong>
                <small>${counselor.role}</small>
            </span>
        </button>
    `).join("");

    accountList.querySelectorAll(".auth-account-card").forEach(card => {
        card.addEventListener("click", () => {
            state.authSelectedCounselorId = card.dataset.counselorId;
            renderAuthAccountList();
            document.getElementById("portalPassword").focus();
        });
    });
}

function handlePortalAuth(e) {
    e.preventDefault();
    const passwordInput = document.getElementById("portalPassword").value;
    const errorMsg = document.getElementById("authErrorMsg");
    const account = COUNSELOR_ACCOUNTS.find(item => item.counselorId === state.authSelectedCounselorId);

    if (account && passwordInput === account.password) {
        state.counselorLoggedIn = true;
        state.currentCounselorId = account.counselorId;
        closePasswordModal();
        switchToView('counselor');
    } else {
        errorMsg.style.display = "block";
        document.getElementById("portalPassword").focus();
    }
}

function renderCounselorPortalIdentity() {
    const card = document.getElementById("currentCounselorCard");
    const counselor = getCurrentCounselor();
    const badge = document.querySelector(".portal-badge");

    if (badge && counselor) {
        badge.textContent = counselor.name;
    }

    if (!card || !counselor) return;

    card.innerHTML = `
        <span class="profile-kicker">${t("availability.profileTitle")}</span>
        <div class="counselor-session-row">
            <img src="${counselor.photo}" alt="${counselor.name}" onerror="this.style.display='none';">
            <span>
                <strong>${counselor.name}</strong>
                <small>${counselor.role}</small>
            </span>
        </div>
    `;
}

function setCounselorManagementVisibility(visible) {
    const managementCard = document.querySelector(".counselor-management-card");
    if (managementCard) {
        managementCard.style.display = visible ? "" : "none";
    }
}
