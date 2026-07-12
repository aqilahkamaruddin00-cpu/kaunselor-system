// Dynamic Counselor Management Logic
function initCounselors() {
    state.counselors = DEFAULT_COUNSELORS.map(cloneCounselorProfile);
    renderCounselorAll();
}

function applyCounselorChanges() {
    renderCounselorAll();
    // Re-render time slots if a date is selected, since counselors list changed
    if (state.selectedDate) {
        renderTimeSlots(state.selectedDate);
    }
    if (typeof refreshHeroAvailability === "function") {
        refreshHeroAvailability();
    }
}

function cloneCounselorProfile(counselor) {
    return {
        ...counselor,
        specialties: [...counselor.specialties]
    };
}

function renderCounselorAll() {
    renderCounselorCards();
    renderCounselorSelectOptions();
    renderFilterCounselorOptions();
    renderManagementDirectory();
    if (typeof renderAvailabilityCounselorOptions === "function") {
        renderAvailabilityCounselorOptions();
    }
}

function renderCounselorCards() {
    const grid = document.getElementById("counselorsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (state.counselors.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light); border: 1px dashed var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-card);">
                <p style="font-weight:600; font-size:1.05rem;">${t("counselor.noActiveTitle")}</p>
                <p style="font-size:0.85rem; margin-top:4px;">${t("counselor.noActiveDesc")}</p>
            </div>
        `;
        return;
    }

    // Gradient backgrounds for placeholders to make them look premium
    const colors = [
        "linear-gradient(135deg, hsl(220, 80%, 45%), hsl(170, 80%, 40%))",
        "linear-gradient(135deg, hsl(350, 80%, 45%), hsl(220, 80%, 45%))",
        "linear-gradient(135deg, hsl(170, 80%, 45%), hsl(35, 80%, 45%))",
        "linear-gradient(135deg, hsl(35, 80%, 45%), hsl(350, 80%, 45%))"
    ];

    state.counselors.forEach((c, index) => {
        const initials = c.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
        const grad = colors[index % colors.length];

        const specialtiesHtml = c.specialties.map(spec => `<span class="specialty">${spec.trim()}</span>`).join('');
        const fallbackPhoto = `
            <div class="counselor-photo fallback-photo" style="background: ${grad};${c.photo ? ' display: none;' : ''}">
                <span>${initials}</span>
            </div>
        `;
        const photoHtml = c.photo ? `
            <img src="${c.photo}" alt="${c.name}" class="counselor-photo counselor-profile-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            ${fallbackPhoto}
        ` : fallbackPhoto;

        const card = document.createElement("div");
        card.classList.add("counselor-card");
        card.innerHTML = `
            <div class="counselor-photo-container">
                ${photoHtml}
                <span class="counselor-badge">${c.badge}</span>
            </div>
            <div class="counselor-info">
                <h3 class="counselor-name">${c.name}</h3>
                <p class="counselor-role">${c.role}</p>
                <p class="counselor-bio">${c.bio}</p>
                <div class="specialties">
                    ${specialtiesHtml}
                </div>
                <a href="#booking" class="btn btn-outline btn-sm book-with-counselor-btn" data-counselor="${c.name}">${t("counselor.bookSession")}</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderCounselorSelectOptions() {
    const select = document.getElementById("counselorSelect");
    if (!select) return;

    select.innerHTML = "";

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    defaultOpt.textContent = t("select.chooseCounselor");
    select.appendChild(defaultOpt);

    state.counselors.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.name;
        opt.textContent = `${c.name} (${c.badge})`;
        select.appendChild(opt);
    });
}

function renderFilterCounselorOptions() {
    const select = document.getElementById("filterCounselor");
    if (!select) return;

    const currentCounselor = state.currentCounselorId
        ? state.counselors.find(c => c.id === state.currentCounselorId)
        : null;
    const currentVal = currentCounselor ? currentCounselor.name : (select.value || "all");

    select.innerHTML = "";

    if (!currentCounselor) {
        const allOpt = document.createElement("option");
        allOpt.value = "all";
        allOpt.textContent = t("select.allCounselors");
        select.appendChild(allOpt);
    }

    const counselors = currentCounselor ? [currentCounselor] : state.counselors;
    counselors.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.name;
        const shortName = c.name.split(' ').slice(0, 2).join(' ');
        opt.textContent = shortName;
        select.appendChild(opt);
    });

    select.disabled = Boolean(currentCounselor);

    // Restore value
    if ([...select.options].some(o => o.value === currentVal)) {
        select.value = currentVal;
    } else {
        select.value = "all";
    }
}

function renderManagementDirectory() {
    const container = document.getElementById("directoryItems");
    if (!container) return;

    container.innerHTML = "";

    if (state.counselors.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; font-size: 0.85rem; color: var(--text-light); padding: 20px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">${t("directory.noActive")}</p>
        `;
        return;
    }

    state.counselors.forEach(c => {
        const item = document.createElement("div");
        item.classList.add("directory-item");
        item.innerHTML = `
            <div class="directory-item-details">
                <span class="directory-item-name">${c.name}</span>
                <span class="directory-item-role">${c.role} (${c.badge})</span>
            </div>
            <button class="btn-delete-profile" onclick="deleteCounselorProfile('${c.id}')" title="${t("directory.deleteTitle")}">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        `;
        container.appendChild(item);
    });
}

function deleteCounselorProfile(id) {
    const c = state.counselors.find(c => c.id === id);
    if (!c) return;

    const confirmDelete = confirm(interpolate(t("directory.deleteConfirm"), { name: c.name }));
    if (confirmDelete) {
        state.counselors = state.counselors.filter(c => c.id !== id);
        applyCounselorChanges();
    }
}

function handleAddCounselorSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("newCounselorName").value.trim();
    const role = document.getElementById("newCounselorRole").value.trim();
    const badge = document.getElementById("newCounselorBadge").value.trim();
    const specialtiesVal = document.getElementById("newCounselorSpecialties").value.trim();
    const bio = document.getElementById("newCounselorBio").value.trim();

    const specialties = specialtiesVal.split(',').map(s => s.trim()).filter(Boolean);

    if (!name || !role || !badge || specialties.length === 0 || !bio) {
        alert(t("alerts.requiredFields"));
        return;
    }

    const newId = "c_" + Date.now();
    const newProfile = {
        id: newId,
        name: name,
        role: role,
        badge: badge,
        specialties: specialties,
        bio: bio
    };

    state.counselors.push(newProfile);
    applyCounselorChanges();

    document.getElementById("addCounselorForm").reset();
    alert(interpolate(t("alerts.profileAdded"), { name }));
}
