/* ==========================================================================
   Neha's GlamUp - Interactive Script File
   Dynamic rendering, Tab switching, WhatsApp redirect, and Scroll animations.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Lucide Icons
    lucide.createIcons();

    // --- Global Configurations ---
    const WHATSAPP_NUMBER = "917337480803"; // Primary bookings number
    let servicesData = typeof services !== 'undefined' ? services : [];

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
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxWaBtn = document.getElementById('lightbox-wa-btn');

    window.openLightbox = (imageSrc, captionText, waUrl = '') => {
        lightboxImg.src = imageSrc;
        lightboxImg.alt = captionText;
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
    };

    // Close lightbox on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // --- Dynamic Services Catalog Rendering ---
    const catalogGrid = document.getElementById('catalog-grid');

    window.switchTab = (tabType) => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        if (tabType === 'makeup') {
            document.getElementById('tab-makeup').classList.add('active');
        } else if (tabType === 'beautician') {
            document.getElementById('tab-beautician').classList.add('active');
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
        
        lucide.createIcons();
        
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
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                if (data.services && data.services.length > 0) {
                    servicesData = data.services;
                    console.log('Successfully fetched live services data from API');
                    
                    // Re-render currently active tab
                    const activeTabBtn = document.querySelector('.tab-btn.active');
                    if (activeTabBtn) {
                        const tabType = activeTabBtn.id === 'tab-beautician' ? 'beautician' : 'makeup';
                        renderCatalog(tabType);
                    }
                }
            }
        } catch (err) {
            console.log('Server API not running. Falling back to products.js static arrays.');
        }
    };

    // --- Page Initialization ---
    renderCatalog('makeup');
    fetchLiveProducts();
});
