// Neha's GlamUp - Admin Dashboard Logic (Google Sign-In Auth)
let allProducts = { services: [], jewelry: [] };
let currentSection = 'dashboard';
let currentCategoryFilter = 'all';
let searchQuery = '';
let selectedImageFile = null;
let searchDebounceTimer = null;
let adminSession = null; // { token, user: { name, email, picture } }

// Lightbox state
let lightboxZoom = 1;
let lightboxPanX = 0;
let lightboxPanY = 0;
let lightboxDragging = false;
let lightboxDragStartX = 0;
let lightboxDragStartY = 0;

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initializeAuth();
    
    // Drag & Drop image files
    const dropZone = document.getElementById('image-drop-zone');
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-active');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                const input = document.getElementById('form-jewelry-image');
                input.files = files;
                const event = { target: input };
                previewSelectedImage(event);
            }
        });
    }

    // Lightbox keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('image-lightbox');
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === '+' || e.key === '=') zoomLightbox(1);
        if (e.key === '-') zoomLightbox(-1);
        if (e.key === '0') resetLightboxZoom();
    });

    // Lightbox touch pinch-to-zoom
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
        let initialPinchDistance = 0;
        let initialZoom = 1;

        lightboxImg.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialPinchDistance = getPinchDistance(e.touches);
                initialZoom = lightboxZoom;
            } else if (e.touches.length === 1 && lightboxZoom > 1) {
                lightboxDragging = true;
                lightboxDragStartX = e.touches[0].clientX - lightboxPanX;
                lightboxDragStartY = e.touches[0].clientY - lightboxPanY;
            }
        }, { passive: false });

        lightboxImg.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = getPinchDistance(e.touches);
                const scale = currentDistance / initialPinchDistance;
                lightboxZoom = Math.max(0.5, Math.min(5, initialZoom * scale));
                applyLightboxTransform();
            } else if (e.touches.length === 1 && lightboxDragging && lightboxZoom > 1) {
                e.preventDefault();
                lightboxPanX = e.touches[0].clientX - lightboxDragStartX;
                lightboxPanY = e.touches[0].clientY - lightboxDragStartY;
                applyLightboxTransform();
            }
        }, { passive: false });

        lightboxImg.addEventListener('touchend', () => {
            lightboxDragging = false;
        });

        // Mouse drag for desktop
        lightboxImg.addEventListener('mousedown', (e) => {
            if (lightboxZoom > 1) {
                lightboxDragging = true;
                lightboxDragStartX = e.clientX - lightboxPanX;
                lightboxDragStartY = e.clientY - lightboxPanY;
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (lightboxDragging) {
                lightboxPanX = e.clientX - lightboxDragStartX;
                lightboxPanY = e.clientY - lightboxDragStartY;
                applyLightboxTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            lightboxDragging = false;
        });

        // Mouse wheel zoom
        lightboxImg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            zoomLightbox(delta);
        }, { passive: false });
    }
});

function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// =============================================
// GOOGLE SIGN-IN AUTHENTICATION
// =============================================

function getSessionToken() {
    return localStorage.getItem('glamup_admin_session') || '';
}

function setSessionData(token, user) {
    localStorage.setItem('glamup_admin_session', token);
    localStorage.setItem('glamup_admin_user', JSON.stringify(user));
    adminSession = { token, user };
}

function clearSessionData() {
    localStorage.removeItem('glamup_admin_session');
    localStorage.removeItem('glamup_admin_user');
    adminSession = null;
}

// Initialize auth — check existing session or show Google Sign-In
async function initializeAuth() {
    const savedToken = getSessionToken();
    const savedUser = localStorage.getItem('glamup_admin_user');

    // If we have a saved session, try to validate it
    if (savedToken && savedUser) {
        try {
            const res = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-session': savedToken
                }
            });
            if (res.ok) {
                const data = await res.json();
                adminSession = { token: savedToken, user: data.user };
                onAuthSuccess();
                return;
            }
        } catch (err) {
            console.error('Session validation failed:', err);
        }
        clearSessionData();
    }

    // No valid session — initialize Google Sign-In button
    showAuthScreen();
    initGoogleSignIn();
}

// Initialize Google Sign-In button
async function initGoogleSignIn() {
    try {
        // Get client ID from server
        const res = await fetch('/api/auth/config');
        const config = await res.json();

        if (!config.configured || !config.googleClientId) {
            document.getElementById('auth-config-error').classList.remove('hidden');
            return;
        }

        // Wait for Google Identity Services to load
        if (typeof google === 'undefined' || !google.accounts) {
            // GIS script hasn't loaded yet, wait for it
            await new Promise((resolve) => {
                const check = setInterval(() => {
                    if (typeof google !== 'undefined' && google.accounts) {
                        clearInterval(check);
                        resolve();
                    }
                }, 200);
                // Timeout after 10 seconds
                setTimeout(() => { clearInterval(check); resolve(); }, 10000);
            });
        }

        if (typeof google === 'undefined' || !google.accounts) {
            document.getElementById('auth-config-error').textContent = 'Failed to load Google Sign-In. Please refresh the page.';
            document.getElementById('auth-config-error').classList.remove('hidden');
            return;
        }

        google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            {
                theme: 'filled_black',
                size: 'large',
                width: 300,
                text: 'signin_with',
                shape: 'pill',
                logo_alignment: 'left'
            }
        );

    } catch (err) {
        console.error('Failed to initialize Google Sign-In:', err);
        document.getElementById('auth-config-error').textContent = 'Error setting up Google Sign-In. Check server configuration.';
        document.getElementById('auth-config-error').classList.remove('hidden');
    }
}

// Handle the Google credential response
async function handleGoogleCredential(response) {
    const errorEl = document.getElementById('auth-error');
    errorEl.classList.add('hidden');

    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            setSessionData(data.session, data.user);
            onAuthSuccess();
            showToast(`Welcome, ${data.user.name}!`, 'success');
        } else {
            errorEl.textContent = data.message || data.error || 'Access denied.';
            errorEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Google auth error:', err);
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.classList.remove('hidden');
    }
}

// Called after successful authentication
function onAuthSuccess() {
    hideAuthScreen();
    updateAdminProfile();
    loadJewelryCategories().then(() => {
        loadProducts();
    });
}

// Update sidebar with admin's profile
function updateAdminProfile() {
    if (!adminSession || !adminSession.user) return;
    const { name, email, picture } = adminSession.user;

    const avatarEl = document.getElementById('admin-avatar');
    const nameEl = document.getElementById('admin-name');
    const emailEl = document.getElementById('admin-email');

    if (avatarEl && picture) {
        avatarEl.src = picture;
        avatarEl.style.display = 'block';
    }
    if (nameEl) nameEl.textContent = name || 'Admin';
    if (emailEl) emailEl.textContent = email || 'Admin Console';
}

function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('admin-layout').classList.add('hidden');
    document.getElementById('hamburger-btn').classList.add('hidden');
}

function hideAuthScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('admin-layout').classList.remove('hidden');
    document.getElementById('hamburger-btn').classList.remove('hidden');
}

// Handle Logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'x-admin-session': getSessionToken() }
        });
    } catch (err) {
        // Ignore network errors on logout
    }
    clearSessionData();
    showAuthScreen();
    closeSidebar();
    // Re-render Google Sign-In button
    initGoogleSignIn();
    showToast('Logged out successfully.', 'info');
}

// =============================================
// SIDEBAR TOGGLE (Mobile)
// =============================================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
}

// =============================================
// IMAGE LIGHTBOX
// =============================================
function openLightbox(src) {
    const overlay = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = src;
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
    applyLightboxTransform();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const overlay = document.getElementById('image-lightbox');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function closeLightboxOutside(e) {
    if (e.target === e.currentTarget || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
    }
}

function zoomLightbox(direction) {
    lightboxZoom = Math.max(0.5, Math.min(5, lightboxZoom + direction * 0.3));
    if (lightboxZoom <= 1) {
        lightboxPanX = 0;
        lightboxPanY = 0;
    }
    applyLightboxTransform();
}

function resetLightboxZoom() {
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
    applyLightboxTransform();
}

function applyLightboxTransform() {
    const img = document.getElementById('lightbox-img');
    img.style.transform = `scale(${lightboxZoom}) translate(${lightboxPanX / lightboxZoom}px, ${lightboxPanY / lightboxZoom}px)`;
    document.getElementById('zoom-level').textContent = Math.round(lightboxZoom * 100) + '%';
}

// =============================================
// DATA MANAGEMENT
// =============================================

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        if (res.ok) {
            allProducts = await res.json();
            updateDashboardMetrics();
            if (currentSection !== 'dashboard') {
                renderTable();
            }
        } else {
            showToast('Failed to load products.', 'error');
        }
    } catch (err) {
        showToast('Error connecting to server.', 'error');
    }
}

function updateDashboardMetrics() {
    const jewelry = allProducts.jewelry || [];
    const services = allProducts.services || [];
    
    document.getElementById('val-total-jewelry').textContent = jewelry.length;
    document.getElementById('val-selling-jewelry').textContent = jewelry.filter(item => item.category === 'selling').length;
    document.getElementById('val-renting-jewelry').textContent = jewelry.filter(item => item.category === 'renting').length;
    document.getElementById('val-total-services').textContent = services.length;
}

// Navigation sections switching
function switchSection(section, event) {
    if (event) {
        event.preventDefault();
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
    } else {
        document.querySelectorAll('.nav-item').forEach(item => {
            const label = item.textContent.trim().toLowerCase();
            if (label.includes(section)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    currentSection = section;
    currentCategoryFilter = 'all';
    searchQuery = '';
    document.getElementById('search-input').value = '';

    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const dbSection = document.getElementById('section-dashboard');
    const catalogSection = document.getElementById('section-catalog');

    if (section === 'dashboard') {
        pageTitle.textContent = 'Dashboard Overview';
        pageSubtitle.textContent = 'Quick insights and operational controls.';
        dbSection.classList.remove('hidden');
        catalogSection.classList.add('hidden');
        document.getElementById('btn-manage-categories').style.display = 'none';
        updateDashboardMetrics();
    } else if (section === 'jewelry') {
        pageTitle.textContent = 'Jewelry Showcase';
        pageSubtitle.textContent = 'Manage inventory of items available for rent and sale.';
        dbSection.classList.add('hidden');
        catalogSection.classList.remove('hidden');
        document.getElementById('btn-manage-categories').style.display = 'block';
        setupFilters(['All Jewelry', 'Korean Showcase', ...jewelryCategories]);
        renderTable();
    } else if (section === 'services') {
        pageTitle.textContent = 'Salon Services';
        pageSubtitle.textContent = 'Add, modify, or remove skincare, facials, and makeup artistry services.';
        dbSection.classList.add('hidden');
        catalogSection.classList.remove('hidden');
        document.getElementById('btn-manage-categories').style.display = 'none';
        setupFilters(['All Services', 'Makeup Artistry', 'Beautician Services', 'Mehendi Designs']);
        renderTable();
    }

    closeSidebar();
}

function setupFilters(tabs) {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';
    
    tabs.forEach((tab, index) => {
        const btn = document.createElement('button');
        btn.className = `filter-tab ${index === 0 ? 'active' : ''}`;
        
        let filterKey = tab.toLowerCase();
        if (tab.includes('All Jewelry') || tab.includes('All Services')) filterKey = 'all';
        else if (tab.includes('Korean')) filterKey = 'korean';
        else if (tab.includes('Makeup')) filterKey = 'makeup';
        else if (tab.includes('Beautician')) filterKey = 'beautician';
        else if (tab.includes('Mehendi')) filterKey = 'mehendi';
        
        btn.textContent = tab;
        btn.onclick = () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryFilter = filterKey;
            renderTable();
        };
        
        container.appendChild(btn);
    });
}

// Debounced search
function handleSearch() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
        renderTable();
    }, 250);
}

// =============================================
// TABLE & CARD RENDERING
// =============================================
function renderTable() {
    const listBody = document.getElementById('catalog-list');
    const tableHeaders = document.getElementById('table-headers');
    const emptyState = document.getElementById('no-items-msg');
    const mobileCards = document.getElementById('mobile-cards');
    
    listBody.innerHTML = '';
    mobileCards.innerHTML = '';
    
    let items = [];
    
    if (currentSection === 'jewelry') {
        tableHeaders.innerHTML = `
            <th style="width: 100px;">Photo</th>
            <th>Name</th>
            <th style="width: 140px;">Category</th>
            <th style="width: 180px;">Price Tag</th>
            <th>Description</th>
            <th style="width: 120px;">Korean Style</th>
            <th style="width: 150px; text-align: center;">Actions</th>
        `;
        
        items = allProducts.jewelry || [];
        
        if (currentCategoryFilter !== 'all') {
            if (currentCategoryFilter === 'korean') {
                items = items.filter(item => item.isKorean === true);
            } else {
                items = items.filter(item => item.category === currentCategoryFilter);
            }
        }
        
        if (searchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(searchQuery) ||
                item.id.toLowerCase().includes(searchQuery) ||
                (item.description && item.description.toLowerCase().includes(searchQuery))
            );
        }
        
        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            document.querySelector('.table-container').classList.add('hidden');
            mobileCards.innerHTML = '';
        } else {
            emptyState.classList.add('hidden');
            document.querySelector('.table-container').classList.remove('hidden');
            
            items.forEach(item => {
                const tr = document.createElement('tr');
                const isKoreanLabel = item.isKorean 
                    ? `<span class="badge badge-gold"><i data-lucide="check" style="width:12px;height:12px;"></i> Yes</span>` 
                    : `<span class="text-muted">No</span>`;
                
                const originalText = item.originalPrice ? `<span class="original-price">\u20b9${item.originalPrice}</span> ` : '';
                const mainPriceText = item.price ? (item.price.toString().startsWith('Rent:') || item.price.toString().includes('\u20b9') ? item.price : `\u20b9${item.price}`) : 'Not Set';
                const priceDisplay = `<span class="item-price">${originalText}${mainPriceText}</span>`;
                const escapedImage = (item.image || '').replace(/'/g, "\\'");

                tr.innerHTML = `
                    <td><img src="${item.image}" class="table-img" alt="${item.name}" onclick="openLightbox('${escapedImage}')"></td>
                    <td><strong>${item.name}</strong><br><span class="text-muted" style="font-size:0.75rem;">${item.id}</span></td>
                    <td><span class="item-badge ${item.category}">${item.category === 'selling' ? 'Sale' : 'Rent'}</span></td>
                    <td>${priceDisplay}</td>
                    <td><p class="text-muted" style="font-size:0.85rem; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.description}">${item.description || '-'}</p></td>
                    <td>${isKoreanLabel}</td>
                    <td style="text-align: center;">
                        <div class="table-actions">
                            <button class="btn btn-secondary btn-sm" onclick="openEditModal('jewelry', '${item.id}')"><i data-lucide="edit-3" style="width:14px;height:14px;"></i> Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${item.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> Delete</button>
                        </div>
                    </td>
                `;
                listBody.appendChild(tr);

                const card = document.createElement('div');
                card.className = 'mobile-card';
                card.innerHTML = `
                    <img src="${item.image}" class="mobile-card-img" alt="${item.name}" onclick="openLightbox('${escapedImage}')">
                    <div class="mobile-card-body">
                        <div class="mobile-card-name">${item.name}</div>
                        <div class="mobile-card-meta">
                            <span class="item-badge ${item.category}">${item.category === 'selling' ? 'Sale' : 'Rent'}</span>
                            ${priceDisplay}
                            ${item.isKorean ? '<span class="badge badge-gold" style="font-size:0.7rem;">Korean</span>' : ''}
                        </div>
                        ${item.description ? `<div class="mobile-card-desc">${item.description}</div>` : ''}
                        <div class="mobile-card-actions">
                            <button class="btn btn-secondary btn-sm" onclick="openEditModal('jewelry', '${item.id}')"><i data-lucide="edit-3" style="width:14px;height:14px;"></i> Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${item.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                        </div>
                    </div>
                `;
                mobileCards.appendChild(card);
            });
        }
        
    } else if (currentSection === 'services') {
        tableHeaders.innerHTML = `
            <th style="width: 100px;">Icon</th>
            <th>Service Title</th>
            <th style="width: 180px;">Category Tab</th>
            <th style="width: 140px;">Group Type</th>
            <th>Description</th>
            <th style="width: 150px; text-align: center;">Actions</th>
        `;
        
        items = allProducts.services || [];
        
        if (currentCategoryFilter !== 'all') {
            items = items.filter(item => item.type === currentCategoryFilter);
        }
        
        if (searchQuery) {
            items = items.filter(item => 
                item.title.toLowerCase().includes(searchQuery) ||
                item.id.toLowerCase().includes(searchQuery) ||
                item.category.toLowerCase().includes(searchQuery) ||
                (item.description && item.description.toLowerCase().includes(searchQuery))
            );
        }
        
        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            document.querySelector('.table-container').classList.add('hidden');
            mobileCards.innerHTML = '';
        } else {
            emptyState.classList.add('hidden');
            document.querySelector('.table-container').classList.remove('hidden');
            
            items.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="table-icon">${item.icon || '🌸'}</div></td>
                    <td><strong>${item.title}</strong><br><span class="text-muted" style="font-size:0.75rem;">${item.id}</span></td>
                    <td><span class="badge badge-gold">${item.category}</span></td>
                    <td><span class="item-badge ${item.type}">${item.type === 'makeup' ? 'Makeup' : 'Beautician'}</span></td>
                    <td><p class="text-muted" style="font-size:0.85rem; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.description}">${item.description || '-'}</p></td>
                    <td style="text-align: center;">
                        <div class="table-actions">
                            <button class="btn btn-secondary btn-sm" onclick="openEditModal('service', '${item.id}')"><i data-lucide="edit-3" style="width:14px;height:14px;"></i> Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${item.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> Delete</button>
                        </div>
                    </td>
                `;
                listBody.appendChild(tr);

                const card = document.createElement('div');
                card.className = 'mobile-card';
                card.innerHTML = `
                    <div class="mobile-card-icon">${item.icon || '🌸'}</div>
                    <div class="mobile-card-body">
                        <div class="mobile-card-name">${item.title}</div>
                        <div class="mobile-card-meta">
                            <span class="item-badge ${item.type}">${item.type === 'makeup' ? 'Makeup' : 'Beautician'}</span>
                            <span class="badge badge-gold" style="font-size:0.7rem;">${item.category}</span>
                        </div>
                        ${item.description ? `<div class="mobile-card-desc">${item.description}</div>` : ''}
                        <div class="mobile-card-actions">
                            <button class="btn btn-secondary btn-sm" onclick="openEditModal('service', '${item.id}')"><i data-lucide="edit-3" style="width:14px;height:14px;"></i> Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${item.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                        </div>
                    </div>
                `;
                mobileCards.appendChild(card);
            });
        }
    }
    
    lucide.createIcons();
}

// =============================================
// MODAL HANDLING
// =============================================
function openAddModal() {
    resetForm();
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('btn-save-submit').innerHTML = 'Add Product <i data-lucide="plus"></i>';
    
    const formType = document.getElementById('form-type');
    if (currentSection === 'services') {
        formType.value = 'service';
    } else {
        formType.value = 'jewelry';
        populateJewelryCategorySelect();
    }
    
    toggleFormFields();
    document.getElementById('product-modal').classList.remove('hidden');
    lucide.createIcons();
}

function openEditModal(type, id) {
    resetForm();
    document.getElementById('modal-title').textContent = 'Edit Product Details';
    document.getElementById('btn-save-submit').innerHTML = 'Save Changes <i data-lucide="check"></i>';
    document.getElementById('form-item-id').value = id;
    
    const formType = document.getElementById('form-type');
    formType.value = type;
    formType.disabled = true;
    
    if (type === 'jewelry') {
        populateJewelryCategorySelect();
        const item = allProducts.jewelry.find(item => item.id === id);
        if (item) {
            document.getElementById('form-jewelry-name').value = item.name;
            document.getElementById('form-jewelry-category').value = item.category;
            document.getElementById('form-jewelry-price').value = item.price;
            document.getElementById('form-jewelry-original-price').value = item.originalPrice || '';
            document.getElementById('form-jewelry-korean').checked = item.isKorean;
            document.getElementById('form-description').value = item.description;
            
            if (item.image) {
                const previewImg = document.getElementById('image-preview');
                const previewContainer = document.getElementById('image-preview-container');
                const label = document.getElementById('upload-label');
                previewImg.src = item.image;
                previewContainer.classList.remove('hidden');
                label.textContent = "Uploaded jewelry image is set";
            }
        }
    } else if (type === 'service') {
        const item = allProducts.services.find(item => item.id === id);
        if (item) {
            document.getElementById('form-service-title').value = item.title;
            document.getElementById('form-service-category').value = item.category;
            document.getElementById('form-service-icon').value = item.icon;
            document.getElementById('form-description').value = item.description;
        }
    }
    
    toggleFormFields();
    document.getElementById('product-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('form-type').disabled = false;
    resetForm();
}

function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('form-item-id').value = '';
    
    const previewContainer = document.getElementById('image-preview-container');
    if (previewContainer) previewContainer.classList.add('hidden');
    const previewImg = document.getElementById('image-preview');
    if (previewImg) previewImg.src = '';
    
    const label = document.getElementById('upload-label');
    if (label) label.textContent = 'Drag & drop jewelry photo or click to browse';
    
    selectedImageFile = null;
}

function toggleFormFields() {
    const type = document.getElementById('form-type').value;
    const jewelryFields = document.getElementById('jewelry-fields-group');
    const serviceFields = document.getElementById('service-fields-group');
    
    if (type === 'jewelry') {
        jewelryFields.classList.remove('hidden');
        serviceFields.classList.add('hidden');
        const itemId = document.getElementById('form-item-id').value;
        document.getElementById('form-jewelry-image').required = !itemId;
    } else {
        jewelryFields.classList.add('hidden');
        serviceFields.classList.remove('hidden');
        document.getElementById('form-jewelry-image').required = false;
    }
}

function triggerImageInput() {
    document.getElementById('form-jewelry-image').click();
}

function previewSelectedImage(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        selectedImageFile = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('image-preview');
            const previewContainer = document.getElementById('image-preview-container');
            const label = document.getElementById('upload-label');
            previewImg.src = e.target.result;
            previewContainer.classList.remove('hidden');
            label.textContent = selectedImageFile.name;
        };
        reader.readAsDataURL(selectedImageFile);
    }
}

function removeImagePreview(event) {
    if (event) event.stopPropagation();
    const input = document.getElementById('form-jewelry-image');
    input.value = '';
    document.getElementById('image-preview-container').classList.add('hidden');
    document.getElementById('image-preview').src = '';
    document.getElementById('upload-label').textContent = 'Drag & drop jewelry photo or click to browse';
    selectedImageFile = null;
    const itemId = document.getElementById('form-item-id').value;
    input.required = !itemId;
}

// =============================================
// FORM SUBMISSION (Optimistic Updates)
// =============================================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('form-item-id').value;
    const type = document.getElementById('form-type').value;
    const isEdit = !!id;
    
    const formData = new FormData();
    formData.append('type', type);
    
    if (type === 'jewelry') {
        const name = document.getElementById('form-jewelry-name').value;
        const category = document.getElementById('form-jewelry-category').value;
        const price = document.getElementById('form-jewelry-price').value;
        const originalPrice = document.getElementById('form-jewelry-original-price').value;
        const isKorean = document.getElementById('form-jewelry-korean').checked;
        const imageInput = document.getElementById('form-jewelry-image');
        const description = document.getElementById('form-description').value;
        
        if (!name || !category) {
            showToast('Please fill in required jewelry fields.', 'error');
            return;
        }
        
        formData.append('name', name);
        formData.append('category', category);
        formData.append('price', price);
        formData.append('originalPrice', originalPrice);
        formData.append('isKorean', isKorean);
        formData.append('description', description);
        
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
    } else {
        const title = document.getElementById('form-service-title').value;
        const category = document.getElementById('form-service-category').value;
        const icon = document.getElementById('form-service-icon').value;
        const description = document.getElementById('form-description').value;
        
        if (!title || !category || !icon) {
            showToast('Please fill in all required service fields.', 'error');
            return;
        }
        
        formData.append('title', title);
        formData.append('category', category);
        formData.append('icon', icon);
        formData.append('description', description);
    }
    
    const url = isEdit ? `/api/products/${id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';
    
    const saveButton = document.getElementById('btn-save-submit');
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="btn-spinner"></span> Saving...';
    
    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'x-admin-session': getSessionToken()
            },
            body: formData
        });
        
        if (res.ok) {
            const result = await res.json();
            
            // Optimistic update
            if (type === 'jewelry') {
                if (isEdit) {
                    const idx = allProducts.jewelry.findIndex(j => j.id === id);
                    if (idx !== -1) allProducts.jewelry[idx] = result.item;
                } else {
                    allProducts.jewelry.push(result.item);
                }
            } else {
                if (isEdit) {
                    const idx = allProducts.services.findIndex(s => s.id === id);
                    if (idx !== -1) allProducts.services[idx] = result.item;
                } else {
                    allProducts.services.push(result.item);
                }
            }

            updateDashboardMetrics();
            showToast(isEdit ? 'Product updated!' : 'New product added!', 'success');
            closeModal();
            
            if (currentSection !== 'dashboard') {
                renderTable();
            }
        } else if (res.status === 401) {
            showToast('Session expired. Please sign in again.', 'error');
            clearSessionData();
            showAuthScreen();
            initGoogleSignIn();
        } else {
            const err = await res.json();
            showToast(err.error || 'Server error.', 'error');
        }
    } catch (err) {
        showToast('Network error.', 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
        lucide.createIcons();
    }
}

// =============================================
// DELETE (Optimistic)
// =============================================
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-session': getSessionToken() }
        });
        
        if (res.ok) {
            const jIdx = allProducts.jewelry.findIndex(j => j.id === id);
            if (jIdx !== -1) {
                allProducts.jewelry.splice(jIdx, 1);
            } else {
                const sIdx = allProducts.services.findIndex(s => s.id === id);
                if (sIdx !== -1) allProducts.services.splice(sIdx, 1);
            }

            updateDashboardMetrics();
            showToast('Product deleted.', 'success');
            if (currentSection !== 'dashboard') renderTable();
        } else if (res.status === 401) {
            showToast('Session expired. Please sign in again.', 'error');
            clearSessionData();
            showAuthScreen();
            initGoogleSignIn();
        } else {
            const err = await res.json();
            showToast(err.error || 'Failed to delete.', 'error');
        }
    } catch (err) {
        showToast('Network error.', 'error');
    }
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100px)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =============================================
// JEWELRY CATEGORIES MANAGEMENT LOGIC
// =============================================
let jewelryCategories = [];

// Fetch categories on load
async function loadJewelryCategories() {
    try {
        const res = await fetch('/api/jewelry-categories');
        if (res.ok) {
            jewelryCategories = await res.json();
            populateJewelryCategorySelect();
        }
    } catch (err) {
        console.error('Failed to load categories', err);
    }
}

// Populate the select dropdown in the add/edit form
function populateJewelryCategorySelect() {
    const select = document.getElementById('form-jewelry-category');
    if (!select) return;
    
    // Clear and build options dynamically
    select.innerHTML = '';
    jewelryCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        select.appendChild(opt);
    });
}

// Open categories modal
function openCategoriesModal() {
    const modal = document.getElementById('categories-modal');
    if (modal) {
        modal.classList.remove('hidden');
        renderCategoriesEditList();
    }
}

// Close categories modal
function closeCategoriesModal() {
    const modal = document.getElementById('categories-modal');
    if (modal) modal.classList.add('hidden');
}

// Render the edit list inside the modal
function renderCategoriesEditList() {
    const container = document.getElementById('categories-list-items');
    if (!container) return;
    
    container.innerHTML = '';
    jewelryCategories.forEach((cat, index) => {
        const div = document.createElement('div');
        div.className = 'categories-edit-item';
        div.innerHTML = `
            <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            <button type="button" onclick="deleteJewelryCategory(${index})" title="Delete category">
                <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
            </button>
        `;
        container.appendChild(div);
    });
    
    lucide.createIcons();
}

// Add a category
async function addJewelryCategory() {
    const input = document.getElementById('new-category-input');
    const val = input.value.trim().toLowerCase();
    
    if (!val) {
        showToast("Please enter a category name.", "error");
        return;
    }
    
    if (jewelryCategories.includes(val)) {
        showToast("Category already exists.", "error");
        return;
    }
    
    jewelryCategories.push(val);
    input.value = '';
    
    await saveJewelryCategories();
}

// Delete a category
async function deleteJewelryCategory(index) {
    if (index < 0 || index >= jewelryCategories.length) return;
    
    const cat = jewelryCategories[index];
    if (!confirm('Are you sure you want to delete the category "' + cat + '"? Products under this category will not be deleted but their category will remain unset.')) return;
    
    jewelryCategories.splice(index, 1);
    await saveJewelryCategories();
}

// Save categories to server
async function saveJewelryCategories() {
    try {
        const res = await fetch('/api/jewelry-categories', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-session': getSessionToken()
            },
            body: JSON.stringify({ categories: jewelryCategories })
        });
        
        if (res.ok) {
            const data = await res.json();
            jewelryCategories = data.categories;
            populateJewelryCategorySelect();
            renderCategoriesEditList();
            showToast("Categories updated successfully!", "success");
            
            // Re-render filters and catalog if currently looking at jewelry showcase
            if (currentSection === 'jewelry') {
                setupFilters(['All Jewelry', 'Korean Showcase', ...jewelryCategories]);
                renderTable();
            }
        } else {
            const err = await res.json();
            showToast(err.error || "Failed to save categories.", "error");
        }
    } catch (err) {
        showToast("Network error.", "error");
    }
}
