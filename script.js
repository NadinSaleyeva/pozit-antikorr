document.addEventListener('DOMContentLoaded', () => {
    // Flag to prevent carousel swipe when slider is moving
    let isAnySliderActive = false;

    // === BEFORE/AFTER SLIDER LOGIC ===
    const comparisonCards = document.querySelectorAll('.comparison-card');

    comparisonCards.forEach(card => {
        const slider = card.querySelector('.comparison-slider');
        const beforeImg = card.querySelector('.comparison-img.before');
        let isDragging = false;

        const moveSlider = (clientX) => {
            const rect = card.getBoundingClientRect();
            // ClientX is relative to viewport, rect.left is relative to viewport
            let position = ((clientX - rect.left) / rect.width) * 100;

            // Constrain
            position = Math.max(0, Math.min(100, position));

            slider.style.left = `${position}%`;
            // clip-path for smooth reveals
            beforeImg.style.clipPath = `inset(0 ${100 - position}% 0 0)`;
        };

        const startDragging = (e) => {
            isDragging = true;
            isAnySliderActive = true;
            card.classList.add('is-dragging');

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            moveSlider(clientX);

            // On mobile, prevent swipe/scroll from taking over
            if (e.type.includes('touch')) {
                // e.stopPropagation(); // Don't propagate to carousel parent
            }
        };

        const stopDragging = () => {
            if (isDragging) {
                isDragging = false;
                isAnySliderActive = false;
                card.classList.remove('is-dragging');
                // Small delay to prevent carousel from immediately firing a swipe
                setTimeout(() => { isAnySliderActive = false; }, 100);
            }
        };

        const onMove = (e) => {
            if (!isDragging) return;

            // Stop page scroll on mobile only when dragging
            if (e.cancelable) e.preventDefault();

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            moveSlider(clientX);
        };

        // Local listeners for start
        card.addEventListener('mousedown', startDragging);
        card.addEventListener('touchstart', startDragging, { passive: false });

        // Window-wide listeners for move and end to avoid "losing" the slider
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });

        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);
    });

    // === MOBILE CAROUSEL LOGIC ===
    const grid = document.querySelector('.before-after-grid');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.querySelector('.next-case');
    const prevBtn = document.querySelector('.prev-case');
    const totalItems = comparisonCards.length;
    let currentIndex = 0;

    const updateCarousel = (index) => {
        if (window.innerWidth <= 992) {
            // Loop index
            currentIndex = (index + totalItems) % totalItems;
            const offset = -currentIndex * 100;
            grid.style.transform = `translateX(${offset}%)`;

            // Active dot
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });

            // Reset all comparison sliders to center position
            comparisonCards.forEach(card => {
                const slider = card.querySelector('.comparison-slider');
                const beforeImg = card.querySelector('.comparison-img.before');
                if (slider && beforeImg) {
                    slider.style.left = '50%';
                    beforeImg.style.clipPath = 'inset(0 50% 0 0)';
                }
            });
        }
    };

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => updateCarousel(currentIndex + 1));
        prevBtn.addEventListener('click', () => updateCarousel(currentIndex - 1));
    }

    // Swipe Swipe Swipe
    let touchStartX = 0;
    let touchEndX = 0;

    grid.addEventListener('touchstart', e => {
        if (isAnySliderActive) return; // Block swipe if we are using the comparison slider
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    grid.addEventListener('touchend', e => {
        if (isAnySliderActive) return;
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 60;
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) > threshold) {
            if (diff < 0) {
                updateCarousel(currentIndex + 1);
            } else {
                updateCarousel(currentIndex - 1);
            }
        }
    }

    // Resize fix
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            grid.style.transform = 'none';
        } else {
            updateCarousel(currentIndex);
        }
    });
    // === CAR ZONE INTERACTIVITY ===
    const carZones = document.querySelectorAll('.car-zone');
    const panelDefault = document.getElementById('panelDefault');
    const panelActive = document.getElementById('panelActive');
    const panelPart = document.getElementById('panelPart');
    const panelPrice = document.getElementById('panelPrice');

    if (carZones.length) {
        carZones.forEach(zone => {
            zone.addEventListener('mouseenter', () => {
                const part = zone.dataset.part;
                const price = zone.dataset.price;

                // Update panel
                if (panelDefault) panelDefault.style.display = 'none';
                if (panelActive) {
                    panelActive.style.display = 'block';
                    panelPart.textContent = part;
                    panelPrice.textContent = price;
                }
            });

            zone.addEventListener('mouseleave', () => {
                // Reset panel
                if (panelDefault) panelDefault.style.display = 'block';
                if (panelActive) panelActive.style.display = 'none';
            });
        });
    }

    // === FLOATING ACTION BUTTONS (V2) ===
    const fabUpBtn = document.getElementById('fabUpBtn');
    if (fabUpBtn) {
        // Show/hide up button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                fabUpBtn.classList.add('visible');
            } else {
                fabUpBtn.classList.remove('visible');
            }
        });

        // Smooth scroll to top on click
        fabUpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // === REVIEWS SLIDER ===
    const isMobile = () => window.innerWidth <= 576;

    document.querySelectorAll('.reviews-section').forEach(section => {
        const reviewsTrack = section.querySelector('.reviews-track');
        const reviewsWrapper = section.querySelector('.reviews-track-wrapper');
        const reviewCards = section.querySelectorAll('.review-card');
        const reviewPrev = section.querySelector('.review-prev');
        const reviewNext = section.querySelector('.review-next');
        const reviewDots = section.querySelectorAll('.review-dot');

        if (!reviewsTrack || reviewCards.length === 0) return;

        let currentReviewIndex = window.innerWidth <= 1200 ? 0 : 1;

        const updateReviews = () => {
            reviewCards.forEach((card, i) => {
                card.classList.toggle('active', i === currentReviewIndex);
            });

            if (!isMobile()) {
                let shift = 0;
                if (window.innerWidth > 1200) {
                    shift = (currentReviewIndex - 1) * -410;
                } else {
                    const firstCard = reviewCards[0];
                    const cardWidth = firstCard.offsetWidth;
                    const trackStyle = window.getComputedStyle(reviewsTrack);
                    const gap = parseFloat(trackStyle.gap) || parseFloat(trackStyle.columnGap) || 0;
                    const paddingLeft = parseFloat(trackStyle.paddingLeft) || 0;
                    const step = cardWidth + gap;
                    shift = (window.innerWidth / 2) - (paddingLeft + (currentReviewIndex * step) + (cardWidth / 2));
                }
                reviewsTrack.style.transform = `translateX(${shift}px)`;
            } else {
                reviewDots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentReviewIndex);
                });
            }
        };

        if (reviewPrev && reviewNext) {
            reviewPrev.addEventListener('click', () => {
                if (currentReviewIndex > 0) {
                    currentReviewIndex--;
                    updateReviews();
                }
            });

            reviewNext.addEventListener('click', () => {
                if (currentReviewIndex < reviewCards.length - 1) {
                    currentReviewIndex++;
                    updateReviews();
                }
            });
        }

        if (reviewsWrapper) {
            reviewsWrapper.addEventListener('scroll', () => {
                if (!isMobile()) return;
                const wrapperCenter = reviewsWrapper.scrollLeft + reviewsWrapper.offsetWidth / 2;
                let closestIndex = 0;
                let closestDistance = Infinity;

                reviewCards.forEach((card, i) => {
                    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                    const distance = Math.abs(cardCenter - wrapperCenter);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIndex = i;
                    }
                });

                if (closestIndex !== currentReviewIndex) {
                    currentReviewIndex = closestIndex;
                    reviewCards.forEach((card, i) => {
                        card.classList.toggle('active', i === currentReviewIndex);
                    });
                    reviewDots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentReviewIndex);
                    });
                }
            });
        }

        if (reviewDots.length > 0) {
            reviewDots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    if (!isMobile()) return;
                    currentReviewIndex = index;
                    const cardWidth = reviewCards[0].offsetWidth;
                    const gap = 20;
                    const scrollPosition = currentReviewIndex * (cardWidth + gap);
                    reviewsWrapper.scrollTo({
                        left: scrollPosition,
                        behavior: 'smooth'
                    });
                });
            });
        }

        window.addEventListener('resize', updateReviews);
        updateReviews();
    });

    // === CONTACT FORM ===
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    // Record form load time for bot detection
    const formLoadedAt = document.getElementById('formLoadedAt');
    if (formLoadedAt) {
        formLoadedAt.value = Date.now().toString();
    }

    // BACKEND URL — change this when hosting is ready
    const FORM_ENDPOINT = '/api/callback.php';

    if (contactForm) {
        const formName = document.getElementById('formName');
        const formPhone = document.getElementById('formPhone');
        const formConsent = document.getElementById('formConsent');
        const formHoneypot = document.getElementById('formHoneypot');
        const submitBtn = document.getElementById('formSubmitBtn');

        // Phone mask: +375 (__) ___-__-__
        if (formPhone) {
            formPhone.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 12) value = value.slice(0, 12);

                let formatted = '';
                if (value.length > 0) formatted = '+' + value.slice(0, 3);
                if (value.length > 3) formatted += ' (' + value.slice(3, 5);
                if (value.length > 5) formatted += ') ' + value.slice(5, 8);
                if (value.length > 8) formatted += '-' + value.slice(8, 10);
                if (value.length > 10) formatted += '-' + value.slice(10, 12);

                e.target.value = formatted;
            });

            formPhone.addEventListener('focus', () => {
                if (!formPhone.value) formPhone.value = '+375';
            });
        }

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // Anti-spam: honeypot check
            if (formHoneypot && formHoneypot.value) {
                // Bot detected — silently show success
                contactForm.style.display = 'none';
                formSuccess.style.display = 'block';
                return;
            }

            // Anti-spam: time check (less than 3 seconds = bot)
            if (formLoadedAt && formLoadedAt.value) {
                const elapsed = Date.now() - parseInt(formLoadedAt.value, 10);
                if (elapsed < 3000) {
                    contactForm.style.display = 'none';
                    formSuccess.style.display = 'block';
                    return;
                }
            }

            // Validate name
            if (!formName.value.trim()) {
                formName.classList.add('error');
                isValid = false;
            } else {
                formName.classList.remove('error');
            }

            // Validate phone (at least 11 digits)
            const phoneDigits = formPhone.value.replace(/\D/g, '');
            if (phoneDigits.length < 11) {
                formPhone.classList.add('error');
                isValid = false;
            } else {
                formPhone.classList.remove('error');
            }

            // Validate consent
            const checkmark = formConsent.closest('.contact-form__checkbox-label').querySelector('.contact-form__checkmark');
            if (!formConsent.checked) {
                checkmark.classList.add('error');
                isValid = false;
            } else {
                checkmark.classList.remove('error');
            }

            if (!isValid) return;

            // Disable button
            submitBtn.disabled = true;
            submitBtn.textContent = 'ОТПРАВКА...';

            // Prepare form data
            const formData = new FormData();
            formData.append('name', formName.value.trim());
            formData.append('phone', formPhone.value.trim());
            formData.append('message', document.getElementById('formMessage').value.trim());
            formData.append('consent', 'yes');
            formData.append('consent_duration', '30 days');
            formData.append('source', 'antikor-landing');

            // Send to backend via AJAX
            fetch(FORM_ENDPOINT, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) return response.json();
                throw new Error('Server error');
            })
            .then(() => {
                contactForm.style.display = 'none';
                formSuccess.style.display = 'block';
            })
            .catch(() => {
                // If backend is not yet connected, show success anyway
                // Remove this fallback once PHP backend is live
                contactForm.style.display = 'none';
                formSuccess.style.display = 'block';
            });
        });

        // Remove error on input
        [formName, formPhone].forEach(input => {
            input.addEventListener('input', () => input.classList.remove('error'));
        });

        formConsent.addEventListener('change', () => {
            const checkmark = formConsent.closest('.contact-form__checkbox-label').querySelector('.contact-form__checkmark');
            checkmark.classList.remove('error');
        });
    }

    // === MODALS (Privacy Policy & Consent) ===
    const privacyModal = document.getElementById('privacyModal');
    const consentModal = document.getElementById('consentModal');
    const privacyLink = document.getElementById('privacyPolicyLink');
    const consentLink = document.getElementById('consentLink');
    const cookiePolicyLink = document.getElementById('cookiePolicyLink');
    const modalClose = document.getElementById('modalClose');
    const consentModalClose = document.getElementById('consentModalClose');

    const openModalEl = (modal) => {
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    };

    const closeModalEl = (modal) => {
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
    };

    if (privacyLink) privacyLink.addEventListener('click', (e) => { e.preventDefault(); openModalEl(privacyModal); });
    if (consentLink) consentLink.addEventListener('click', (e) => { e.preventDefault(); openModalEl(consentModal); });
    if (cookiePolicyLink) cookiePolicyLink.addEventListener('click', (e) => { e.preventDefault(); openModalEl(privacyModal); });
    if (modalClose) modalClose.addEventListener('click', () => closeModalEl(privacyModal));
    if (consentModalClose) consentModalClose.addEventListener('click', () => closeModalEl(consentModal));
    if (privacyModal) privacyModal.addEventListener('click', (e) => { if (e.target === privacyModal) closeModalEl(privacyModal); });
    if (consentModal) consentModal.addEventListener('click', (e) => { if (e.target === consentModal) closeModalEl(consentModal); });

    // === COOKIE CONSENT BANNER ===
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieDecline = document.getElementById('cookieDecline');

    if (cookieBanner) {
        const cookieChoice = localStorage.getItem('cookie_consent_antikorr');

        if (!cookieChoice) {
            cookieBanner.classList.add('active');
        }

        if (cookieAccept) {
            cookieAccept.addEventListener('click', () => {
                localStorage.setItem('cookie_consent_antikorr', 'accepted');
                cookieBanner.classList.remove('active');
            });
        }

        if (cookieDecline) {
            cookieDecline.addEventListener('click', () => {
                localStorage.setItem('cookie_consent_antikorr', 'declined');
                cookieBanner.classList.remove('active');
            });
        }
    }

    // === FAQ ACCORDION ===
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-item__header');
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all items
            faqItems.forEach(otherItem => otherItem.classList.remove('active'));

            // Toggle clicked item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // === SCROLL ANIMATIONS ===
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% visible
    };

    const fadeElements = document.querySelectorAll('.fade-up, .fade-in, .section-header');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(item => {
        observer.observe(item);
    });

    // === STICKY HEADER SCROLL ===
    const header = document.querySelector('.header');

    if (header) {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 20) {
                header.classList.add('is-scrolled');
            } else {
                header.classList.remove('is-scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Run once on load to catch current position
        handleScroll();
    }

    // === MOBILE BURGER MENU ===
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (burgerBtn && mobileMenu) {
        burgerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            burgerBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');

            // Force remove any browser-applied outline/border
            burgerBtn.style.outline = 'none';
            burgerBtn.style.border = 'none';
            burgerBtn.style.boxShadow = 'none';
            burgerBtn.blur();
        });

        // Close menu if link inside is clicked
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }

    // === CONTACT FAB (expandable) ===
    const fab = document.getElementById('fab');
    const fabMain = document.getElementById('fabMain');
    const fabBackdrop = document.getElementById('fabBackdrop');

    if (fab && fabMain) {
        const openFab = () => {
            fab.classList.add('open');
            fabMain.setAttribute('aria-expanded', 'true');
        };
        const closeFab = () => {
            fab.classList.remove('open');
            fabMain.setAttribute('aria-expanded', 'false');
        };

        fabMain.addEventListener('click', (e) => {
            e.stopPropagation();
            fab.classList.contains('open') ? closeFab() : openFab();
        });

        if (fabBackdrop) fabBackdrop.addEventListener('click', closeFab);

        document.addEventListener('click', (e) => {
            if (!fab.contains(e.target)) closeFab();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeFab();
        });

        fab.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', () => {
                setTimeout(closeFab, 100);
            });
        });
    }

    // === VIDEO CAROUSELS ===
    document.querySelectorAll('[data-video-carousel]').forEach(carousel => {
        const strip = carousel.querySelector('.video-carousel__strip');
        if (!strip) return;
        const slides = strip.querySelectorAll('.video-carousel__slide');
        const prevBtn = carousel.querySelector('.video-carousel-prev');
        const nextBtn = carousel.querySelector('.video-carousel-next');
        const dotsBox = carousel.querySelector('.video-carousel__dots');

        if (slides.length < 2) return;
        carousel.classList.add('is-multi');

        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Видео ${i + 1}`);
            dot.addEventListener('click', () => {
                strip.scrollTo({ left: i * strip.clientWidth, behavior: 'smooth' });
            });
            dotsBox.appendChild(dot);
        });

        const dots = dotsBox.querySelectorAll('.dot');

        const updateActive = () => {
            const idx = Math.round(strip.scrollLeft / strip.clientWidth);
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            slides.forEach((slide, i) => {
                if (i !== idx) {
                    const v = slide.querySelector('video');
                    if (v && !v.paused) v.pause();
                    const yt = slide.querySelector('iframe[data-youtube-id]');
                    if (yt && yt.contentWindow) {
                        yt.contentWindow.postMessage(
                            '{"event":"command","func":"pauseVideo","args":""}',
                            '*'
                        );
                    }
                }
            });
        };

        strip.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateActive);
        }, { passive: true });

        if (prevBtn) prevBtn.addEventListener('click', () => {
            strip.scrollBy({ left: -strip.clientWidth, behavior: 'smooth' });
        });
        if (nextBtn) nextBtn.addEventListener('click', () => {
            strip.scrollBy({ left: strip.clientWidth, behavior: 'smooth' });
        });
    });

    // === WORKS GALLERY + LIGHTBOX ===
    const worksStrip = document.querySelector('[data-works-strip]');
    const lightbox = document.querySelector('[data-works-lightbox]');

    if (worksStrip && lightbox) {
        const items = worksStrip.querySelectorAll('.works-item');
        const prevBtn = document.querySelector('.works-prev');
        const nextBtn = document.querySelector('.works-next');
        const lbImg = lightbox.querySelector('.works-lightbox__img');
        const lbCounter = lightbox.querySelector('.works-lightbox__counter');
        const lbClose = lightbox.querySelector('.works-lightbox__close');
        const lbPrev = lightbox.querySelector('.works-lightbox__prev');
        const lbNext = lightbox.querySelector('.works-lightbox__next');

        let lbIndex = 0;

        const stepWidth = () => {
            const item = worksStrip.querySelector('.works-item');
            return item ? item.offsetWidth + 16 : 320;
        };

        if (prevBtn) prevBtn.addEventListener('click', () => {
            worksStrip.scrollBy({ left: -stepWidth(), behavior: 'smooth' });
        });
        if (nextBtn) nextBtn.addEventListener('click', () => {
            worksStrip.scrollBy({ left: stepWidth(), behavior: 'smooth' });
        });

        const showLB = () => {
            const img = items[lbIndex].querySelector('img');
            lbImg.src = img.src;
            lbImg.alt = img.alt;
            lbCounter.textContent = `${lbIndex + 1} / ${items.length}`;
        };

        const openLB = (i) => {
            lbIndex = i;
            showLB();
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const closeLB = () => {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        const stepLB = (delta) => {
            lbIndex = (lbIndex + delta + items.length) % items.length;
            showLB();
        };

        items.forEach((item, i) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                openLB(i);
            });
        });

        if (lbClose) lbClose.addEventListener('click', closeLB);
        if (lbPrev) lbPrev.addEventListener('click', () => stepLB(-1));
        if (lbNext) lbNext.addEventListener('click', () => stepLB(1));

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLB();
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeLB();
            else if (e.key === 'ArrowLeft') stepLB(-1);
            else if (e.key === 'ArrowRight') stepLB(1);
        });

        let lbTouchStartX = null;
        lightbox.addEventListener('touchstart', (e) => {
            lbTouchStartX = e.touches[0].clientX;
        }, { passive: true });
        lightbox.addEventListener('touchend', (e) => {
            if (lbTouchStartX === null) return;
            const deltaX = e.changedTouches[0].clientX - lbTouchStartX;
            if (Math.abs(deltaX) > 50) {
                stepLB(deltaX < 0 ? 1 : -1);
            }
            lbTouchStartX = null;
        }, { passive: true });
    }

});
