// Neha's GlamUp - Jewelry Page Logic
let jewelryData = typeof jewelry !== 'undefined' ? jewelry : [];
let searchQuery = '';
let activeCategory = 'all';
let activeSort = 'default';

// Default categories in case backend connection fails
let jewelryCategories = [
    "bracelet", 
    "choker", 
    "anklet", 
    "nose pins", 
    "korean earrings", 
    "hair accessories", 
    "buggadi", 
    "chains for kids", 
    "rented jewelry"
];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Sticky navbar behavior
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.add('scrolled');
        }
    });
    header.classList.add('scrolled'); // Force scrolled styling on load

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');

    menuToggle.addEventListener('click', () => {
        const isOpen = mobileDrawer.classList.toggle('open');
        menuToggle.classList.toggle('open', isOpen);
        
        const menuIcon = menuToggle.querySelector('.icon-menu');
        const closeIcon = menuToggle.querySelector('.icon-close');
        if (isOpen) {
            menuIcon.style.display = 'none';
            closeIcon.style.display = 'block';
        } else {
            menuIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }
    });

    const closeMobileMenu = () => {
        mobileDrawer.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.querySelector('.icon-menu').style.display = 'block';
        menuToggle.querySelector('.icon-close').style.display = 'none';
    };

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Wire escape key for lightbox
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // Initial render, category fetch, and data fetch
    renderGrid();
    fetchCategories();
    fetchLiveJewelry();
});

// Helper to resolve backend image paths
function resolveImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('assets/uploads/')) {
        return `${CONFIG.API_BASE_URL}/${imagePath}`;
    }
    return imagePath;
}

// Fetch categories from backend
async function fetchCategories() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/jewelry-categories?t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                jewelryCategories = data;
                console.log('Loaded dynamic jewelry categories from API');
            }
        }
    } catch (err) {
        console.log('Server API not running. Using default static jewelry categories.');
    }
    renderFilterTabs();
}

// Render dynamic filter tabs
function renderFilterTabs() {
    const wrapper = document.getElementById('filter-tabs-wrapper');
    if (!wrapper) return;
    
    let html = `<button class="filter-tab ${activeCategory === 'all' ? 'active' : ''}" data-filter="all" onclick="filterCategory('all')">All Collections</button>`;
    html += `<button class="filter-tab ${activeCategory === 'korean' ? 'active' : ''}" data-filter="korean" onclick="filterCategory('korean')">Korean Showcase</button>`;
    
    jewelryCategories.forEach(cat => {
        const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        html += `<button class="filter-tab ${isActive ? 'active' : ''}" data-filter="${cat}" onclick="filterCategory('${cat}')">${label}</button>`;
    });
    
    wrapper.innerHTML = html;
}

// Fetch live products to prevent browser caching locally
async function fetchLiveJewelry() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/products?t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            if (data.jewelry && data.jewelry.length > 0) {
                jewelryData = data.jewelry;
                console.log('Successfully loaded live jewelry data from API');
                renderGrid();
            }
        }
    } catch (err) {
        console.log('Server API not running. Running on static products.js fallback.');
    }
}

// Live search input handler
function handleSearch() {
    searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    renderGrid();
}

// Filter Tab Click handler
function filterCategory(category) {
    activeCategory = category;
    
    // Update active tab styling
    document.querySelectorAll('.filter-tab').forEach(tab => {
        if (tab.getAttribute('data-filter') === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    renderGrid();
}

// Sort dropdown handler
function handleSort() {
    activeSort = document.getElementById('sort-select').value;
    renderGrid();
}

// Parse numeric price from a string (e.g. "Rent: ₹1,799 / day" -> 1799)
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const matches = priceStr.toString().replace(/,/g, '').match(/\d+/);
    return matches ? parseInt(matches[0], 10) : 0;
}

// Main rendering engine
function renderGrid() {
    const grid = document.getElementById('jewelry-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!grid) return;
    grid.innerHTML = '';
    
    let items = [...jewelryData];

    // 1. Filter by Category
    if (activeCategory !== 'all') {
        if (activeCategory === 'korean') {
            items = items.filter(item => item.isKorean === true);
        } else {
            // Check if the item category matches the selected category (case-insensitive)
            items = items.filter(item => (item.category || '').toLowerCase() === activeCategory.toLowerCase());
        }
    }

    // 2. Filter by Search Query
    if (searchQuery) {
        items = items.filter(item => 
            item.name.toLowerCase().includes(searchQuery) ||
            item.id.toLowerCase().includes(searchQuery) ||
            (item.description && item.description.toLowerCase().includes(searchQuery))
        );
    }

    // 3. Sorting
    if (activeSort === 'name-asc') {
        items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeSort === 'name-desc') {
        items.sort((a, b) => b.name.localeCompare(a.name));
    } else if (activeSort === 'price-asc') {
        items.sort((a, b) => {
            const priceA = parsePrice(a.price);
            const priceB = parsePrice(b.price);
            return priceA - priceB;
        });
    } else if (activeSort === 'price-desc') {
        items.sort((a, b) => {
            const priceA = parsePrice(a.price);
            const priceB = parsePrice(b.price);
            return priceB - priceA;
        });
    }

    // Toggle Empty State UI
    if (items.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        grid.style.display = 'none';
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        grid.style.display = 'grid';
    }

    // 4. Render product cards
    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card product-card scroll-animate animated';
        card.style.opacity = '0';
        card.style.transform = 'translateY(25px)';
        card.style.transition = `opacity 0.4s ease ${index * 0.03}s, transform 0.4s ease ${index * 0.03}s`;

        // Determine if it is a rented item
        const isRent = (item.category || '').toLowerCase().includes('rent') || (item.category || '').toLowerCase() === 'rented jewelry';
        let actionBadge = isRent ? 'Available for Rent' : 'Available for Sale';
        if (item.isKorean) {
            actionBadge = 'Unique Design';
        }

        const whatsappMessage = item.isKorean 
            ? `Hi Neha, I am interested in the unique Korean jewelry piece "${item.name}". Please let me know its availability! Thank you.`
            : `Hi Neha, I am interested in the jewelry item "${item.name}" listed under category "${item.category}". Can you please share more details? Thanks!`;
            
        const waUrl = `https://wa.me/917337480803?text=${encodeURIComponent(whatsappMessage)}`;

        // Dynamic price rendering
        let priceHtml = '';
        if (!isRent) {
            const offerPrice = item.price || '250';
            const originalPrice = item.originalPrice || '500';
            priceHtml = `<span class="original-price">₹${originalPrice}</span> ₹${offerPrice}`;
        } else {
            const currentPrice = item.price || 'Enquire Rent';
            const originalPrice = item.originalPrice ? `<span class="original-price">₹${item.originalPrice}</span> ` : '';
            priceHtml = `${originalPrice}${currentPrice}`;
        }

        const imageUrl = resolveImageUrl(item.image);
        const escapedImage = imageUrl.replace(/'/g, "\\'");

        card.innerHTML = `
            <div class="p-img-container" onclick="openLightbox('${escapedImage}', '${item.name}', '${waUrl}', '${item.description}')" style="cursor: pointer;">
                <img src="${imageUrl}" alt="${item.name}" class="p-img" loading="lazy">
                <span class="p-badge">${actionBadge}</span>
                <a href="${waUrl}" target="_blank" class="card-wa-float" onclick="event.stopPropagation()" aria-label="Enquire on WhatsApp">
                    <i data-lucide="message-circle"></i>
                </a>
            </div>
            <div class="p-details">
                <h3 class="p-name">${item.name}</h3>
                <p class="p-desc">${item.description || 'Premium design accessory to elevate your aesthetic appearance.'}</p>
                <div class="p-bottom-price">
                    <span class="p-offer-price">${priceHtml}</span>
                    <button class="btn-copy-float" onclick="event.stopPropagation(); copyImageToClipboard('${escapedImage}')" title="Copy photo to clipboard">
                        <i data-lucide="copy"></i> Copy Photo
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    lucide.createIcons();

    // Trigger grid items transition using animation frames
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const cards = grid.querySelectorAll('.product-card');
            cards.forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });
    });
}

// Lightbox controller
window.openLightbox = (imageSrc, titleText, waUrl, descriptionText) => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxWaBtn = document.getElementById('lightbox-wa-btn');
    const lightboxCopyBtn = document.getElementById('lightbox-copy-btn');

    lightboxImg.src = imageSrc;
    lightboxImg.alt = titleText;
    lightboxTitle.textContent = titleText;
    lightboxCaption.textContent = descriptionText || 'Premium catalog jewelry piece.';

    lightboxWaBtn.href = waUrl;
    
    // Bind click event on copy button in lightbox
    lightboxCopyBtn.onclick = () => {
        copyImageToClipboard(imageSrc);
    };

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
};

window.closeLightbox = () => {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('open');
    document.body.style.overflow = 'auto'; // restore background scrolling
};

// Clipboard copy: Fetch image and convert to PNG blob for clipboard
async function copyImageToClipboard(imagePath) {
    showToast("Processing photo copy...", "info");
    
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imagePath;
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                copyTextToClipboard(imagePath, "Could not convert image. Copied link instead!");
                return;
            }
            try {
                // Clipboard API takes png files
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                showToast("Photo copied! You can now paste it directly into WhatsApp.", "success");
            } catch (err) {
                console.error("ClipboardItem write failed, copying text link:", err);
                copyTextToClipboard(imagePath, "Link copied to clipboard!");
            }
        }, 'image/png');

    } catch (err) {
        console.error("Failed to copy image bytes, trying text link copy:", err);
        copyTextToClipboard(imagePath, "Link copied to clipboard!");
    }
}

// Fallback to copy link
async function copyTextToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(message, "success");
    } catch (err) {
        showToast("Unable to copy to clipboard.", "error");
    }
}

// Toast alerts helper
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
    }, 3500);
}
