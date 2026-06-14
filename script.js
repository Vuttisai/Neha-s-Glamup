/* ==========================================================================
   Neha's GlamUp - Interactive Script File
   Dynamic rendering, Tab switching, WhatsApp redirect, Slider, and Scroll animations.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // --- Global Configurations ---
    const WHATSAPP_NUMBER = "917337480803"; // Primary bookings number (no + or spaces)
    
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

    // --- Highlighted Korean Jewelry Slider ---
    const koreanSlider = document.getElementById('korean-slider');
    const prevBtn = document.getElementById('slider-prev-btn');
    const nextBtn = document.getElementById('slider-next-btn');
    const dotsContainer = document.getElementById('slider-dots-container');
    
    let currentSlideIndex = 0;
    let autoPlayInterval;
    let touchStartX = 0;
    let touchEndX = 0;
    
    const koreanItems = jewelry.filter(item => item.isKorean === true);
    
    const getVisibleSlides = () => {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    };
    
    const initKoreanSlider = () => {
        if (!koreanSlider) return;
        
        koreanSlider.innerHTML = '';
        
        koreanItems.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide-item';
            
            const whatsappMessage = `Hi Neha, I am interested in the unique Korean jewelry piece "${item.name}". Please let me know its availability! Thank you.`;
            const waUrl = generateWhatsAppUrl(whatsappMessage);
            
            slide.innerHTML = `
                <div class="slide-img-container" onclick="openLightbox('${item.image}', '${item.name}', '${waUrl}')">
                    <img src="${item.image}" alt="${item.name}" class="slide-img" loading="lazy">
                    <span class="slide-badge">Unique Collection</span>
                    <span class="p-price-tag"><span class="original-price">₹500</span> ₹250</span>
                </div>
                <div class="slide-details">
                    <h3 class="slide-name">${item.name}</h3>
                    <p class="slide-desc">${item.description}</p>
                    <div class="slide-action">
                        <a href="${waUrl}" target="_blank" class="btn btn-primary" onclick="event.stopPropagation()">
                            Enquire on WhatsApp <i data-lucide="message-circle"></i>
                        </a>
                    </div>
                </div>
            `;
            koreanSlider.appendChild(slide);
        });
        
        setupDots();
        updateSliderPosition();
        startAutoPlay();
        
        // Event Listeners
        prevBtn.addEventListener('click', () => {
            moveSlider('prev');
            resetAutoPlay();
        });
        
        nextBtn.addEventListener('click', () => {
            moveSlider('next');
            resetAutoPlay();
        });
        
        // Pause on hover
        koreanSlider.addEventListener('mouseenter', stopAutoPlay);
        koreanSlider.addEventListener('mouseleave', startAutoPlay);
        
        // Touch events for mobile swiping
        koreanSlider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        koreanSlider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    };
    
    const moveSlider = (direction) => {
        const visibleSlides = getVisibleSlides();
        const maxIndex = Math.max(0, koreanItems.length - visibleSlides);
        
        if (direction === 'next') {
            if (currentSlideIndex >= maxIndex) {
                currentSlideIndex = 0; // Wrap around to start
            } else {
                currentSlideIndex++;
            }
        } else if (direction === 'prev') {
            if (currentSlideIndex <= 0) {
                currentSlideIndex = maxIndex; // Wrap around to end
            } else {
                currentSlideIndex--;
            }
        }
        updateSliderPosition();
    };
    
    const updateSliderPosition = () => {
        const visibleSlides = getVisibleSlides();
        const slideWidth = 100 / visibleSlides;
        koreanSlider.style.transform = `translateX(-${currentSlideIndex * slideWidth}%)`;
        updateDots();
    };
    
    const setupDots = () => {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        
        const visibleSlides = getVisibleSlides();
        const totalDots = Math.ceil(koreanItems.length / visibleSlides);
        
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            if (i === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Go to slide page ${i + 1}`);
            dot.addEventListener('click', () => {
                const maxIndex = Math.max(0, koreanItems.length - visibleSlides);
                currentSlideIndex = Math.min(i * visibleSlides, maxIndex);
                updateSliderPosition();
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }
    };
    
    const updateDots = () => {
        if (!dotsContainer) return;
        const visibleSlides = getVisibleSlides();
        const activeDotIndex = Math.floor(currentSlideIndex / visibleSlides);
        
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, index) => {
            if (index === activeDotIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    };
    
    const handleSwipe = () => {
        const threshold = 50; // min distance for swipe
        if (touchStartX - touchEndX > threshold) {
            moveSlider('next');
            resetAutoPlay();
        } else if (touchEndX - touchStartX > threshold) {
            moveSlider('prev');
            resetAutoPlay();
        }
    };
    
    const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayInterval = setInterval(() => {
            moveSlider('next');
        }, 3000);
    };
    
    const stopAutoPlay = () => {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    };
    
    const resetAutoPlay = () => {
        stopAutoPlay();
        startAutoPlay();
    };
    
    window.addEventListener('resize', () => {
        setupDots();
        updateSliderPosition();
    });

    // --- Dynamic Catalog Rendering (Services vs Renting vs Selling) ---
    const catalogGrid = document.getElementById('catalog-grid');
    
    window.switchTab = (tabType) => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        if (tabType === 'makeup') {
            document.getElementById('tab-makeup').classList.add('active');
        } else if (tabType === 'beautician') {
            document.getElementById('tab-beautician').classList.add('active');
        } else if (tabType === 'jewelry-rent') {
            document.getElementById('tab-jewelry-rent').classList.add('active');
        } else if (tabType === 'jewelry-sale') {
            document.getElementById('tab-jewelry-sale').classList.add('active');
        }
        
        catalogGrid.classList.add('fade-out');
        
        setTimeout(() => {
            renderCatalog(tabType);
            catalogGrid.classList.remove('fade-out');
        }, 300);
    };
    
    const renderCatalog = (tabType) => {
        catalogGrid.innerHTML = '';
        
        if (tabType === 'makeup' || tabType === 'beautician') {
            const filteredServices = services.filter(service => service.type === tabType);
            
            filteredServices.forEach((service, index) => {
                const card = document.createElement('div');
                card.className = 'card service-card';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.transitionDelay = `${index * 0.05}s`;
                
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
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            });
            
        } else {
            const filteredJewelry = jewelry.filter(item => item.category === (tabType === 'jewelry-rent' ? 'renting' : 'selling'));
            
            filteredJewelry.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'card product-card';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.transitionDelay = `${index * 0.05}s`;
                
                let actionText = 'Enquire Purchasing';
                let actionBadge = 'Available for Sale';
                let priceHtml = '';
                
                if (item.category === 'selling') {
                    priceHtml = `<span class="p-price-tag"><span class="original-price">₹500</span> ₹250</span>`;
                } else if (item.price) {
                    priceHtml = `<span class="p-price-tag">${item.price}</span>`;
                }
                
                if (item.category === 'renting') {
                    actionText = 'Enquire Renting';
                    actionBadge = 'Available for Rent';
                } else if (item.isKorean) {
                    actionText = 'Enquire Availability';
                    actionBadge = 'Unique Design';
                }
                
                const whatsappMessage = item.isKorean 
                    ? `Hi Neha, I am interested in the unique Korean jewelry piece "${item.name}". Please let me know its availability! Thank you.`
                    : `Hi Neha, I am interested in the jewelry item "${item.name}" listed under ${item.category === 'renting' ? 'Renting' : 'Selling'}. Can you please share more details? Thanks!`;
                    
                const waUrl = generateWhatsAppUrl(whatsappMessage);
                
                card.innerHTML = `
                    <div class="p-img-container" onclick="openLightbox('${item.image}', '${item.name}', '${waUrl}')" style="cursor: pointer;">
                        <img src="${item.image}" alt="${item.name}" class="p-img" loading="lazy">
                        <span class="p-badge">${actionBadge}</span>
                        ${priceHtml}
                    </div>
                    <div class="p-details">
                        <h3 class="p-name">${item.name}</h3>
                        <p class="p-desc">${item.description}</p>
                        <div class="p-action">
                            <a href="${waUrl}" target="_blank" class="btn btn-primary" id="btn-wa-product-${item.id}">
                                ${actionText} <i data-lucide="message-circle"></i>
                            </a>
                        </div>
                    </div>
                `;
                
                catalogGrid.appendChild(card);
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            });
        }
        
        lucide.createIcons();
    };

    // --- Page Initialization ---
    initKoreanSlider();
    renderCatalog('makeup');
});
