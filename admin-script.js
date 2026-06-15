// Neha's GlamUp - Admin Dashboard Logic
let allProducts = { services: [], jewelry: [] };
let currentSection = 'dashboard';
let currentCategoryFilter = 'all';
let searchQuery = '';
let selectedImageFile = null;
let searchDebounceTimer = null;

// Lightbox state
let lightboxZoom = 1;
let lightboxPanX = 0;
let lightboxPanY = 0;
let lightboxDragging = false;
let lightboxDragStartX = 0;
let lightboxDragStartY = 0;

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    checkAuth();
    
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

// Get auth passcode from localStorage
function getPasscode() {
    return localStorage.getItem('glamup_admin_passcode') || '';
}

// Check authorization status
async function checkAuth() {
    const passcode = getPasscode();
    if (!passcode) {
        showAuthScreen();
        return;
    }
    
    try {
        const res = await fetch('/api/auth/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode })
        });
        
        if (res.ok) {
            hideAuthScreen();
            loadProducts();
        } else {
            localStorage.removeItem('glamup_admin_passcode');
            showAuthScreen();
        }
    } catch (err) {
        console.error('Auth verification failed:', err);
        showToast('Network error during authentication validation.', 'error');
        showAuthScreen();
    }
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

// Handle Admin authentication form submission
async function handleLogin(e) {
    e.preventDefault();
    const passcode = document.getElementById('passcode').value;
    const errorText = document.getElementById('auth-error');
    errorText.classList.add('hidden');
    
    try {
        const res = await fetch('/api/auth/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode })
        });
        
        if (res.ok) {
            localStorage.setItem('glamup_admin_passcode', passcode);
            hideAuthScreen();
            loadProducts();
            showToast('Authenticated successfully.', 'success');
        } else {
            errorText.classList.remove('hidden');
        }
    } catch (err) {
        showToast('Authentication failed.', 'error');
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('glamup_admin_passcode');
    showAuthScreen();
    closeSidebar();
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

// Fetch all catalog products from the database
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
        showToast('Error connecting to local server APIs.', 'error');
    }
}

// Update Dashboard numbers
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
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        // Add to clicked item
        event.currentTarget.classList.add('active');
    } else {
        // Find match in sidebar list
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
        updateDashboardMetrics();
    } else if (section === 'jewelry') {
        pageTitle.textContent = 'Jewelry Showcase';
        pageSubtitle.textContent = 'Manage inventory of items available for rent and sale.';
        dbSection.classList.add('hidden');
        catalogSection.classList.remove('hidden');
        
        setupFilters(['All Jewelry', 'For Sale (Selling)', 'For Rent (Renting)', 'Korean Showcase']);
        renderTable();
    } else if (section === 'services') {
        pageTitle.textContent = 'Salon Services';
        pageSubtitle.textContent = 'Add, modify, or remove skincare, facials, and makeup artistry services.';
        dbSection.classList.add('hidden');
        catalogSection.classList.remove('hidden');
        
        setupFilters(['All Services', 'Makeup Artistry', 'Beautician Services']);
        renderTable();
    }

    // Close sidebar on mobile after navigation
    closeSidebar();
}

// Render dynamic toolbar categories filters
function setupFilters(tabs) {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';
    
    tabs.forEach((tab, index) => {
        const btn = document.createElement('button');
        btn.className = `filter-tab ${index === 0 ? 'active' : ''}`;
        
        // Map friendly names to internal filter keys
        let filterKey = 'all';
        if (tab.includes('Sale') || tab.includes('Selling')) filterKey = 'selling';
        else if (tab.includes('Rent') || tab.includes('Renting')) filterKey = 'renting';
        else if (tab.includes('Korean')) filterKey = 'korean';
        else if (tab.includes('Makeup')) filterKey = 'makeup';
        else if (tab.includes('Beautician')) filterKey = 'beautician';
        
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

// Debounced search input
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
        // Set Table Headers
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
        
        // Category Filter
        if (currentCategoryFilter !== 'all') {
            if (currentCategoryFilter === 'korean') {
                items = items.filter(item => item.isKorean === true);
            } else {
                items = items.filter(item => item.category === currentCategoryFilter);
            }
        }
        
        // Search Filter
        if (searchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(searchQuery) ||
                item.id.toLowerCase().includes(searchQuery) ||
                (item.description && item.description.toLowerCase().includes(searchQuery))
            );
        }
        
        // Populate lists
        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            document.querySelector('.table-container').classList.add('hidden');
            mobileCards.innerHTML = '';
        } else {
            emptyState.classList.add('hidden');
            document.querySelector('.table-container').classList.remove('hidden');
            
            items.forEach(item => {
                // Desktop table row
                const tr = document.createElement('tr');
                const isKoreanLabel = item.isKorean 
                    ? `<span class="badge badge-gold"><i data-lucide="check" style="width:12px;height:12px;"></i> Yes</span>` 
                    : `<span class="text-muted">No</span>`;
                
                let priceDisplay = '';
                const originalText = item.originalPrice ? `<span class="original-price">\u20b9${item.originalPrice}</span> ` : '';
                const mainPriceText = item.price ? (item.price.toString().startsWith('Rent:') || item.price.toString().includes('\u20b9') ? item.price : `\u20b9${item.price}`) : 'Not Set';
                priceDisplay = `<span class="item-price">${originalText}${mainPriceText}</span>`;

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

                // Mobile card
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
        // Set Table Headers
        tableHeaders.innerHTML = `
            <th style="width: 100px;">Icon</th>
            <th>Service Title</th>
            <th style="width: 180px;">Category Tab</th>
            <th style="width: 140px;">Group Type</th>
            <th>Description</th>
            <th style="width: 150px; text-align: center;">Actions</th>
        `;
        
        items = allProducts.services || [];
        
        // Category Filter
        if (currentCategoryFilter !== 'all') {
            items = items.filter(item => item.type === currentCategoryFilter);
        }
        
        // Search Filter
        if (searchQuery) {
            items = items.filter(item => 
                item.title.toLowerCase().includes(searchQuery) ||
                item.id.toLowerCase().includes(searchQuery) ||
                item.category.toLowerCase().includes(searchQuery) ||
                (item.description && item.description.toLowerCase().includes(searchQuery))
            );
        }
        
        // Populate lists
        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            document.querySelector('.table-container').classList.add('hidden');
            mobileCards.innerHTML = '';
        } else {
            emptyState.classList.add('hidden');
            document.querySelector('.table-container').classList.remove('hidden');
            
            items.forEach(item => {
                // Desktop table row
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

                // Mobile card
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
    
    // Default form configuration based on active section
    const formType = document.getElementById('form-type');
    if (currentSection === 'services') {
        formType.value = 'service';
    } else {
        formType.value = 'jewelry';
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
    formType.disabled = true; // Disable type switching when editing
    
    if (type === 'jewelry') {
        const item = allProducts.jewelry.find(item => item.id === id);
        if (item) {
            document.getElementById('form-jewelry-name').value = item.name;
            document.getElementById('form-jewelry-category').value = item.category;
            document.getElementById('form-jewelry-price').value = item.price;
            document.getElementById('form-jewelry-original-price').value = item.originalPrice || '';
            document.getElementById('form-jewelry-korean').checked = item.isKorean;
            document.getElementById('form-description').value = item.description;
            
            // Show current image preview
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
    
    // Reset image preview state
    const previewContainer = document.getElementById('image-preview-container');
    if (previewContainer) previewContainer.classList.add('hidden');
    const previewImg = document.getElementById('image-preview');
    if (previewImg) previewImg.src = '';
    
    const label = document.getElementById('upload-label');
    if (label) label.textContent = 'Drag & drop jewelry photo or click to browse';
    
    selectedImageFile = null;
}

// Toggle between fields depending on selected product type (Jewelry vs Service)
function toggleFormFields() {
    const type = document.getElementById('form-type').value;
    const jewelryFields = document.getElementById('jewelry-fields-group');
    const serviceFields = document.getElementById('service-fields-group');
    
    if (type === 'jewelry') {
        jewelryFields.classList.remove('hidden');
        serviceFields.classList.add('hidden');
        // Require image file only if it is a new item creation
        const itemId = document.getElementById('form-item-id').value;
        document.getElementById('form-jewelry-image').required = !itemId;
    } else {
        jewelryFields.classList.add('hidden');
        serviceFields.classList.remove('hidden');
        document.getElementById('form-jewelry-image').required = false;
    }
}

// Trigger browser file dialog
function triggerImageInput() {
    document.getElementById('form-jewelry-image').click();
}

// Show preview of selected upload image
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

// Clear selected image
function removeImagePreview(event) {
    if (event) event.stopPropagation();
    
    const input = document.getElementById('form-jewelry-image');
    input.value = ''; // Reset files
    
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.classList.add('hidden');
    
    const previewImg = document.getElementById('image-preview');
    previewImg.src = '';
    
    const label = document.getElementById('upload-label');
    label.textContent = 'Drag & drop jewelry photo or click to browse';
    
    selectedImageFile = null;
    
    // If editing, require image only if there isn't an existing one
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
                'x-admin-passcode': getPasscode()
            },
            body: formData
        });
        
        if (res.ok) {
            const result = await res.json();
            
            // Optimistic update — apply the returned item directly to local state
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
            showToast(isEdit ? 'Product updated successfully!' : 'New product added!', 'success');
            closeModal();
            
            // Re-render the current view with local data (instant, no network)
            if (currentSection !== 'dashboard') {
                renderTable();
            }
        } else {
            const err = await res.json();
            showToast(err.error || 'Server returned an error.', 'error');
        }
    } catch (err) {
        showToast('Network error during form submission.', 'error');
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
    if (!confirm('Are you sure you want to permanently delete this product?')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'x-admin-passcode': getPasscode()
            }
        });
        
        if (res.ok) {
            // Optimistic delete from local state
            const jIdx = allProducts.jewelry.findIndex(j => j.id === id);
            if (jIdx !== -1) {
                allProducts.jewelry.splice(jIdx, 1);
            } else {
                const sIdx = allProducts.services.findIndex(s => s.id === id);
                if (sIdx !== -1) {
                    allProducts.services.splice(sIdx, 1);
                }
            }

            updateDashboardMetrics();
            showToast('Product deleted.', 'success');
            
            if (currentSection !== 'dashboard') {
                renderTable();
            }
        } else {
            const err = await res.json();
            showToast(err.error || 'Failed to delete product.', 'error');
        }
    } catch (err) {
        showToast('Network error during delete operation.', 'error');
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
    
    // Automatically dismiss toast
    setTimeout(() => {
        toast.style.transform = 'translateX(100px)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
