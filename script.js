/* ==========================================================================
   Neha's GlamUp - Interactive Script File
   Dynamic rendering, Tab switching, WhatsApp redirect, and Scroll animations.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Safe helper to create Lucide icons without throwing errors if the CDN library fails to load or is blocked
    function createIconsSafely() {
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            try {
                lucide.createIcons();
            } catch (err) {
                console.warn('Failed to render Lucide icons:', err);
            }
        }
    }

    // Initialize Lucide Icons
    createIconsSafely();

    // --- Global Configurations ---
    const WHATSAPP_NUMBER = "917337480803"; // Primary bookings number
    let servicesData = typeof services !== 'undefined' ? services : [];
    let showcaseData = typeof showcase !== 'undefined' ? showcase : [];

    // --- Navigation & Header ---
    const header = document.getElementById('header');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');

    // Sticky header scroll behavior
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        const isOpen = mobileDrawer.classList.toggle('open');
        menuToggle.classList.toggle('open', isOpen);

        // Toggle lucide icons inside menu button
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

    // Close mobile menu when a link is clicked
    const closeMobileMenu = () => {
        mobileDrawer.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.querySelector('.icon-menu').style.display = 'block';
        menuToggle.querySelector('.icon-close').style.display = 'none';
    };

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // --- Active Link Highlighting on Scroll ---
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-item');

    const highlightNavOnScroll = () => {
        let scrollPosition = window.scrollY + 120; // offset for nav height

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPosition >= top && scrollPosition < top + height) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', highlightNavOnScroll);

    // --- Intersection Observers for Scroll Animations ---
    const animatedElements = document.querySelectorAll('.scroll-animate');

    const elementObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                elementObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    animatedElements.forEach(el => elementObserver.observe(el));

    // --- WhatsApp URL Helper ---
    const generateWhatsAppUrl = (message) => {
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    // --- Lightbox Modal for Gallery ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxWaBtn = document.getElementById('lightbox-wa-btn');

    window.openLightbox = (mediaSrc, captionText, waUrl = '', mediaType = 'image') => {
        if (mediaType === 'video') {
            if (lightboxImg) {
                lightboxImg.style.display = 'none';
                lightboxImg.src = '';
            }
            if (lightboxVideo) {
                lightboxVideo.src = mediaSrc;
                lightboxVideo.style.display = 'block';
                lightboxVideo.play().catch(err => {
                    console.log('Autoplay prevented on lightbox video:', err);
                });
            }
        } else {
            if (lightboxVideo) {
                lightboxVideo.style.display = 'none';
                lightboxVideo.pause();
                lightboxVideo.removeAttribute('src');
                lightboxVideo.load();
            }
            if (lightboxImg) {
                lightboxImg.src = mediaSrc;
                lightboxImg.alt = captionText;
                lightboxImg.style.display = 'block';
            }
        }

        lightboxCaption.textContent = captionText;

        if (waUrl) {
            lightboxWaBtn.href = waUrl;
            lightboxWaBtn.style.display = 'inline-flex';
        } else {
            lightboxWaBtn.style.display = 'none';
        }

        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
    };

    window.closeLightbox = () => {
        lightbox.classList.remove('open');
        document.body.style.overflow = 'auto'; // restore background scrolling
        
        if (lightboxVideo) {
            lightboxVideo.pause();
            lightboxVideo.removeAttribute('src');
            lightboxVideo.load();
        }
        if (lightboxImg) {
            lightboxImg.src = '';
        }
    };

    // Close lightbox on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // --- Dynamic Showcase (Gallery) Rendering ---
    const galleryGrid = document.getElementById('gallery-grid');

    const mockShowcase = [
        {
            id: 'mock-1',
            title: 'Bridal Styling',
            mediaUrl: 'assets/owner.jpg',
            mediaType: 'image',
            description: 'Flawless makeup and elegant hair styling customized for a stunning bridal transformation.'
        },
        {
            id: 'mock-2',
            title: 'Royal Kundan Bridal Set',
            mediaUrl: 'assets/jewelry_kundan_set.jpg',
            mediaType: 'image',
            description: 'Premium Royal Kundan jewelry set including choker, long necklace, earrings, and mathapatti.'
        },
        {
            id: 'mock-3',
            title: 'Temple Gold Haram',
            mediaUrl: 'assets/jewelry_temple_haram.jpg',
            mediaType: 'image',
            description: 'Exquisite traditional temple design haram with detailed Nakshi work, perfect for brides.'
        },
        {
            id: 'mock-4',
            title: 'Antique Guttapusalu Choker',
            mediaUrl: 'assets/jewelry_guttapusalu.jpg',
            mediaType: 'image',
            description: 'Elegant antique guttapusalu choker set with delicate pearls and rubies for a classic look.'
        },
        {
            id: 'mock-5',
            title: 'CZ Stone Bangles Set',
            mediaUrl: 'assets/jewelry_cz_bangles.jpg',
            mediaType: 'image',
            description: 'Sparkling cubic zirconia bangles set with premium rhodium plating for wedding occasions.'
        },
        {
            id: 'mock-6',
            title: 'Luxury Polki Jhumkas',
            mediaUrl: 'assets/jewelry_polki_jhumkas.jpg',
            mediaType: 'image',
            description: 'Stunning Polki jhumkas adorned with fresh water pearls and detailed enamel work.'
        }
    ];

    const resolveShowcaseUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('assets/uploads/')) {
            return `${CONFIG.API_BASE_URL}/${url}`;
        }
        return url;
    };

    const renderShowcase = () => {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '';

        const itemsToRender = showcaseData && showcaseData.length > 0 ? showcaseData : mockShowcase;

        itemsToRender.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'gallery-item';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;

            const resolvedUrl = resolveShowcaseUrl(item.mediaUrl);
            const enquiryMessage = `Hi Neha, I saw "${item.title}" in your showcase gallery and I'm interested. Please share more details!`;
            const waUrl = generateWhatsAppUrl(enquiryMessage);

            let mediaHtml = '';
            if (item.mediaType === 'video') {
                mediaHtml = `
                    <video src="${resolvedUrl}#t=0.1" preload="metadata" muted playsinline class="gallery-img"></video>
                    <div class="gallery-play-btn">
                        <i data-lucide="play"></i>
                    </div>
                `;
            } else {
                mediaHtml = `
                    <img src="${resolvedUrl}" alt="${item.title}" class="gallery-img">
                `;
            }

            card.innerHTML = `
                ${mediaHtml}
                <a href="${waUrl}" target="_blank" class="gallery-wa-btn" onclick="event.stopPropagation()" aria-label="Enquire on WhatsApp">
                    <i data-lucide="message-circle"></i>
                </a>
                <div class="gallery-bottom-bar">
                    <span class="gallery-label">${item.title}</span>
                    <span class="gallery-price">Enquire</span>
                </div>
            `;

            card.onclick = () => {
                openLightbox(resolvedUrl, item.title, waUrl, item.mediaType || 'image');
            };

            galleryGrid.appendChild(card);
        });

        createIconsSafely();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const cards = galleryGrid.querySelectorAll('.gallery-item');
                cards.forEach(card => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            });
        });
    };

    // --- Dynamic Services Catalog Rendering ---
    const catalogGrid = document.getElementById('catalog-grid');

    window.switchTab = (tabType) => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        const tabBtn = document.getElementById(`tab-${tabType}`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }

        catalogGrid.classList.add('fade-out');

        setTimeout(() => {
            renderCatalog(tabType);
            catalogGrid.classList.remove('fade-out');
        }, 300);
    };

    const renderCatalog = (tabType) => {
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';
        
        const filteredServices = servicesData.filter(service => service.type === tabType);
        
        filteredServices.forEach((service, index) => {
            const card = document.createElement('div');
            card.className = 'card service-card';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
            
            const enquiryMessage = `Hi Neha, I would like to book the "${service.title}" service in Hyderabad. Please share your availability and quote details. Thank you!`;
            const waUrl = generateWhatsAppUrl(enquiryMessage);
            
            card.innerHTML = `
                <div class="s-header">
                    <div class="s-icon">${service.icon}</div>
                    <div>
                        <span class="s-category">${service.category}</span>
                        <h3 class="s-title">${service.title}</h3>
                    </div>
                </div>
                <p class="s-description">${service.description}</p>
                <div class="s-footer">
                    <a href="${waUrl}" target="_blank" class="btn btn-outline" id="btn-enquire-${service.id}">
                        Enquire & Book <i data-lucide="message-square"></i>
                    </a>
                </div>
            `;
            
            catalogGrid.appendChild(card);
        });
        
        createIconsSafely();
        
        // Trigger animations reliably
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const cards = catalogGrid.querySelectorAll('.card');
                cards.forEach(card => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            });
        });
    };

    // --- Dynamic API Fetching with Caching Prevention ---
    const fetchLiveProducts = async () => {
        try {
            // Fetch live data directly from api (forces bypassing of cache if server is running)
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/products?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                
                if (data.services && data.services.length > 0) {
                    servicesData = data.services;
                    console.log('Successfully fetched live services data from API');
                    
                    // Re-render currently active tab
                    const activeTabBtn = document.querySelector('.tab-btn.active');
                    if (activeTabBtn) {
                        const tabType = activeTabBtn.id.replace('tab-', '');
                        renderCatalog(tabType);
                    }
                }

                if (data.showcase && data.showcase.length > 0) {
                    showcaseData = [...data.showcase].sort((a, b) => {
                        const orderA = parseInt(a.order) || 99999;
                        const orderB = parseInt(b.order) || 99999;
                        return orderA - orderB;
                    });
                    console.log('Successfully fetched live showcase data from API');
                    renderShowcase();
                }
            }
        } catch (err) {
            console.log('Server API not running. Falling back to products.js static arrays.');
        }
    };

    // --- Page Initialization ---
    renderCatalog('makeup');
    renderShowcase();
    fetchLiveProducts();
});
