/**
 * ROM Invitation - Main Application Logic
 * Handles all interactions: envelope opening, scratch reveal, countdown, music, gallery, animations
 */

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

function throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Safe element getter - returns element or empty object to prevent null errors
function $safe(selector, context = document) {
    return context.querySelector(selector) || { 
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        style: {},
        hidden: false,
        setAttribute: () => {},
        removeAttribute: () => {},
        textContent: '',
        innerHTML: '',
        dataset: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        focus: () => {},
        offsetHeight: 0,
        appendChild: () => {},
        remove: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        closest: () => null,
        matches: () => false
    };
}

// ==========================================================================
// CONFIGURATION LOADER
// ==========================================================================

function loadConfig() {
    // Config is loaded via config.js script tag
    // This function applies config to the DOM
    const config = window.ROM_CONFIG;
    if (!config) {
        return;
    }

    // Update meta tags for sharing
    updateMetaTags(config);

    // Update page title
    document.title = config.seo.title;

    // Apply theme colors
    applyTheme(config.theme);

    // Update all content
    updateContent(config);

    // Initialize photos and gallery
    renderPhotos(config.photos);
    renderGallery(config.gallery);

    // Store config globally for other modules
    window.invitationConfig = config;
}

function updateMetaTags(config) {
    const { sharing, seo } = config;
    
    // Helper to safely set meta tag content
    function setMeta(selector, content) {
        const el = $(selector);
        if (el) el.setAttribute('content', content);
    }
    
    // Open Graph
    setMeta('meta[property="og:title"]', sharing.title);
    setMeta('meta[property="og:description"]', sharing.description);
    setMeta('meta[property="og:image"]', sharing.image);
    setMeta('meta[property="og:url"]', sharing.url);
    
    // Twitter
    setMeta('meta[name="twitter:title"]', sharing.title);
    setMeta('meta[name="twitter:description"]', sharing.description);
    setMeta('meta[name="twitter:image"]', sharing.image);
    
    // SEO
    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[name="keywords"]', seo.keywords);
}

function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--color-gold', theme.primaryColor);
    root.style.setProperty('--color-gold-light', theme.secondaryColor);
    root.style.setProperty('--color-dark', theme.darkColor);
    root.style.setProperty('--color-white', theme.lightColor);
    root.style.setProperty('--color-gold-pale', theme.accentColor);
    root.style.setProperty('--font-primary', theme.fontPrimary);
    root.style.setProperty('--font-secondary', theme.fontSecondary);
}

function updateContent(config) {
    const { couple, wedding, venue, messages } = config;
    
    // Helper to safely set text content
    function setText(id, text) {
        const el = $safe(`#${id}`);
        if (el && el.textContent !== undefined) {
            el.textContent = text;
        }
    }
    
    function setHTML(id, html) {
        const el = $safe(`#${id}`);
        if (el && el.innerHTML !== undefined) {
            el.innerHTML = html;
        }
    }
    
    // Couple names
    setText('bride-name', couple.brideName);
    setText('groom-name', couple.groomName);
    setText('seal-initials', '&');
    setText('couple-title', ''); // dataset handled separately
    const coupleTitle = $safe('#couple-title');
    if (coupleTitle && coupleTitle.dataset) {
        coupleTitle.dataset.bride = couple.brideName;
        coupleTitle.dataset.groom = couple.groomName;
    }
    
    // Wedding type
    setText('wedding-type', wedding.type);
    
    // Cover details
    const dateObj = new Date(wedding.date + 'T' + wedding.time + ':00');
    const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: wedding.timezone };
    const dayOfWeek = getDayOfWeek(dateObj);
    setText('cover-date', `${dayOfWeek}, ${dateObj.toLocaleDateString('en-GB', options).toUpperCase()}`);
    setText('cover-venue', `${venue.name} · ${venue.city.split(' ')[0]}`);
    
    // Invitation message
    setHTML('invitation-message', messages.invitation.replace(/\n/g, '<br>'));
    setHTML('message-signature', messages.signature);
    
    // Reveal section
    const day = dateObj.getDate();
    const dayWithOrdinal = formatDayWithOrdinal(day);
    const month = dateObj.toLocaleDateString('en-GB', { month: 'long', timeZone: wedding.timezone }).toUpperCase();
    const year = dateObj.getFullYear();
    const fullDate = `${dayWithOrdinal} ${month} ${year}`;
    setText('reveal-day', fullDate);
    setText('reveal-time', `${dayOfWeek}, ${formatTime(wedding.time)}`);
    setText('reveal-venue', `${venue.name}, ${venue.address}, ${venue.city}`);
    const revealDate = $safe('#reveal-date');
    if (revealDate && revealDate.setAttribute) {
        revealDate.setAttribute('dateTime', `${wedding.date}T${wedding.time}:00${getTimezoneOffset(wedding.timezone)}`);
    }
    
    // Countdown target
    window.weddingTimestamp = new Date(`${wedding.date}T${wedding.time}:00${getTimezoneOffset(wedding.timezone)}`).getTime();
    
    // Venue
    setText('venue-name', venue.name);
    setText('venue-address', venue.address);
    setText('venue-city', venue.city);
    const mapBtn = $safe('#map-button');
    if (mapBtn && mapBtn.setAttribute) {
        mapBtn.setAttribute('href', venue.mapLink);
    }
    
    // Closing
    setHTML('closing-text', messages.closing.replace(/\n/g, '<br>'));
    setText('closing-bride', couple.brideName);
    setText('closing-groom', couple.groomName);
    
    // Update sharing config
    window.sharingConfig = config.sharing;
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm} onwards`;
}

function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function getTimezoneOffset(timezone) {
    // Simple offset for common timezones
    const offsets = {
        'Asia/Singapore': '+08:00',
        'Asia/Kuala_Lumpur': '+08:00',
        'UTC': '+00:00'
    };
    return offsets[timezone] || '+00:00';
}

function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function formatDayWithOrdinal(day) {
    return `${day}${getOrdinalSuffix(day)}`;
}

// ==========================================================================
// LOADING SCREEN
// ==========================================================================

function initLoadingScreen() {
    const loadingScreen = document.querySelector('#loading-screen');
    const invitation = document.querySelector('#invitation');
    
    // Simulate loading (replace with actual asset loading if needed)
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            invitation.hidden = false;
            
            // Auto-load default music and show floating button
            const config = window.invitationConfig || window.ROM_CONFIG;
            if (config?.music?.defaultTrack) {
                loadTrack(config.music.defaultTrack, config.music.defaultTrackName);
            }
            showFloatingButton();
            
        }, 600);
    }, 1500);
}

// ==========================================================================
// MUSIC HANDLING
// ==========================================================================

let audioContext = null;
let audioElement = null;
let currentTrack = null;
let isPlaying = false;
let userInteracted = false;

function initMusic() {
    audioElement = document.querySelector('#bg-music');
    const floatingBtn = $safe('#floating-music-btn');
    
    if (!audioElement || audioElement.tagName !== 'AUDIO') {
        return;
    }
    
    // Floating button
    if (floatingBtn.addEventListener) {
        floatingBtn.addEventListener('click', togglePlayback);
    }
    
    // Audio events
    audioElement.addEventListener('ended', () => {
        // Loop is handled by audio.loop = true
    });
    
    audioElement.addEventListener('play', () => {
        isPlaying = true;
        floatingBtn.classList.add('playing');
        floatingBtn.setAttribute('aria-pressed', 'true');
        floatingBtn.setAttribute('aria-label', 'Pause music');
    });
    
    audioElement.addEventListener('pause', () => {
        isPlaying = false;
        floatingBtn.classList.remove('playing');
        floatingBtn.setAttribute('aria-pressed', 'false');
        floatingBtn.setAttribute('aria-label', 'Play music');
    });
    
    audioElement.addEventListener('error', (e) => {
        floatingBtn.classList.remove('playing');
    });
    
    // Try to resume audio context on first user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
    document.addEventListener('keydown', initAudioContext, { once: true });
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    userInteracted = true;
}

function selectMusicOption(button) {
    $$('.music-option').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    const track = button.dataset.track;
    // Use invitationConfig if available, otherwise fall back to ROM_CONFIG
    const config = window.invitationConfig || window.ROM_CONFIG;
    
    if (track === 'custom') {
        $('#music-file-input').click();
    } else if (track === 'default' && config?.music?.defaultTrack) {
        loadTrack(config.music.defaultTrack, config.music.defaultTrackName);
        closeMusicOverlay();
        showFloatingButton();
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
        alert('Please select a valid audio file.');
        return;
    }
    
    const url = URL.createObjectURL(file);
    loadTrack(url, file.name);
    closeMusicOverlay();
    showFloatingButton();
    
    // Reset file input
    event.target.value = '';
}

function loadTrack(url, name) {
    if (!audioElement) {
        audioElement = $('#bg-music');
    }
    currentTrack = { url, name };
    audioElement.src = url;
    audioElement.volume = (window.invitationConfig || window.ROM_CONFIG)?.music?.volume || 0.4;
    audioElement.loop = true;
    audioElement.load();
    
    // Don't auto-play here - wait for user interaction (envelope click)
    // The envelope click handler will attempt to play
}

function togglePlayback() {
    initAudioContext();
    
    if (isPlaying) {
        audioElement.pause();
    } else {
        if (!audioElement.src && currentTrack) {
            audioElement.src = currentTrack.url;
            audioElement.load();
        }
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Still blocked, show overlay again?
            });
        }
    }
}

function closeMusicOverlay() {
    const overlay = document.querySelector('#music-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

function showFloatingButton() {
    const btn = document.querySelector('#floating-music-btn');
    if (btn) {
        btn.hidden = false;
        // Force reflow for animation
        btn.offsetHeight;
        btn.style.animation = 'floatBtnIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }
}

// ==========================================================================
// ENVELOPE OPENING
// ==========================================================================

function initEnvelope() {
    const envelopeWrapper = document.querySelector('#envelope-trigger');
    const envelope = document.querySelector('#envelope');
    const coverDetails = document.querySelector('.cover-details');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const mainContent = document.querySelector('#main-content');
    const tapHint = document.querySelector('.tap-hint');
    
    if (!envelopeWrapper) {
        return;
    }
    if (!envelope) {
        return;
    }
    
    let isOpened = false;
    
    function openEnvelope() {
        if (isOpened) return;
        isOpened = true;
        
        // Attempt to play music on first user interaction
        if (audioElement && !isPlaying) {
            // If audio not loaded yet, wait for it to be ready
            if (audioElement.readyState >= 3) { // HAVE_FUTURE_DATA
                const playPromise = audioElement.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Autoplay blocked, will wait for floating button click
                    });
                }
            } else {
                // Wait for audio to be ready, then play
                audioElement.addEventListener('canplaythrough', function onCanPlay() {
                    audioElement.removeEventListener('canplaythrough', onCanPlay);
                    if (!isPlaying) {
                        const playPromise = audioElement.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(() => {
                                // Autoplay blocked
                            });
                        }
                    }
                }, { once: true });
            }
        }
        
        // Add opening class for animation
        envelope.classList.add('flap-open', 'opening');
        
        // Hide tap hint using class (avoids CSS animation conflict)
        if (tapHint) {
            tapHint.classList.add('hidden');
        }
        
        // Show cover details
        setTimeout(() => {
            if (coverDetails) coverDetails.classList.add('visible');
        }, 400);
        
        // Show scroll indicator using class
        setTimeout(() => {
            if (scrollIndicator) scrollIndicator.classList.add('visible');
        }, 800);
        
        // Start scroll reveal animations after envelope animation
        setTimeout(() => {
            initScrollAnimations();
            initCountdown();
            
            // Auto-scroll to first content section
            const firstSection = $('#main-content section:not(.cover-section)');
            if (firstSection) {
                firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 1200);
        
        // Clean up envelope after animation
        setTimeout(() => {
            envelopeWrapper.style.pointerEvents = 'none';
        }, 1500);
    }
    
    // Click/Tap handler
    envelopeWrapper.addEventListener('click', openEnvelope);
    envelopeWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openEnvelope();
        }
    });
    
    // Touch swipe to open (optional enhancement)
    let touchStartY = 0;
    envelopeWrapper.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    envelopeWrapper.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchStartY - touchEndY > 50) { // Swipe up
            openEnvelope();
        }
    }, { passive: true });
}

// ==========================================================================
// SCRATCH TO REVEAL
// ==========================================================================

function initScratchReveal() {
    const canvas = document.querySelector('#scratch-canvas');
    const wrapper = document.querySelector('#scratch-wrapper');
    const revealCard = document.querySelector('.reveal-card');
    const hint = document.querySelector('#scratch-hint');
    const revealSection = document.querySelector('.reveal-section');
    const config = window.invitationConfig;
    
    if (!canvas || prefersReducedMotion()) {
        setTimeout(() => revealDate(), 1000);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setTimeout(() => revealDate(), 1000);
        return;
    }
    
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hintText = isTouch ? 'Swipe to reveal' : 'Scratch to reveal';
    if (hint) {
        const hintTextEl = hint.querySelector('.hint-text');
        if (hintTextEl) hintTextEl.textContent = hintText;
    }
    
    let isScratching = false;
    let scratchPercentage = 0;
    const threshold = config?.animations?.scratchThreshold || 30;
    let isInitialized = false;
    
    function resizeCanvas() {
        const rect = wrapper.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            setTimeout(resizeCanvas, 100);
            return;
        }
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        drawScratchLayer();
    }
    
    function drawScratchLayer() {
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(0.5, '#2d2d2d');
        gradient.addColorStop(1, '#1a1a1a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'rgba(212, 165, 116, 0.1)';
        for (let x = 0; x < width; x += 20) {
            for (let y = 0; y < height; y += 20) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        const hintText = isTouch ? 'Swipe to reveal' : 'Scratch to reveal';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(212, 165, 116, 0.3)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hintText, width / 2, height / 2);
    }
    
    function getEventCoords(e) {
        const rect = wrapper.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }
    
    function scratch(x, y) {
        const radius = 30;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        calculateScratchPercentage();
    }
    
    function calculateScratchPercentage() {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        let transparentPixels = 0;
        const totalPixels = width * height;
        
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) transparentPixels++;
        }
        
        scratchPercentage = (transparentPixels / totalPixels) * 100;
        if (scratchPercentage >= threshold) revealDate();
    }
    
    function revealDate() {
        if (revealCard.classList.contains('revealed')) return;
        revealCard.classList.add('revealed');
        if (hint) hint.style.display = 'none';
        canvas.style.pointerEvents = 'none';
        createPetalBurst(wrapper);
        cleanup();
    }
    
    function onStart(e) { isScratching = true; scratch(...Object.values(getEventCoords(e))); }
    function onMove(e) { if (!isScratching) return; e.preventDefault(); scratch(...Object.values(getEventCoords(e))); }
    function onEnd() { isScratching = false; }
    
    function cleanup() {
        ['mousedown','mousemove','mouseup','mouseleave','touchstart','touchmove','touchend'].forEach(type => {
            wrapper.removeEventListener(type, type.startsWith('touch') ? (type==='touchstart'?onStart:type==='touchmove'?onMove:onEnd) : (type==='mousedown'?onStart:type==='mousemove'?onMove:onEnd));
        });
    }
    
    function initializeScratch() {
        if (isInitialized) return;
        isInitialized = true;
        
        resizeCanvas();
        requestAnimationFrame(() => drawScratchLayer());
        
        wrapper.addEventListener('mousedown', onStart);
        wrapper.addEventListener('mousemove', onMove);
        wrapper.addEventListener('mouseup', onEnd);
        wrapper.addEventListener('mouseleave', onEnd);
        wrapper.addEventListener('touchstart', onStart, { passive: false });
        wrapper.addEventListener('touchmove', onMove, { passive: false });
        wrapper.addEventListener('touchend', onEnd);
        
        window.addEventListener('resize', debounce(() => {
            if (isInitialized) resizeCanvas();
        }, 100));
    }
    
    // Use IntersectionObserver to wait for section to be visible
    if (revealSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.unobserve(entry.target);
                    initializeScratch();
                }
            });
        }, { threshold: 0.1, rootMargin: '50px' });
        observer.observe(revealSection);
    } else {
        setTimeout(initializeScratch, 2000);
    }
}

// ==========================================================================
// PETAL BURST EFFECT
// ==========================================================================

function createPetalBurst(sourceElement) {
    const config = window.invitationConfig;
    if (!config?.animations?.enablePetals || prefersReducedMotion()) return;
    
    const container = document.querySelector('#petal-container');
    const rect = sourceElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const petalCount = 18;
    const colors = ['#E8B4B4', '#F5C6C6', '#D4A574', '#E8D5B7', '#F7E7CE'];
    
    for (let i = 0; i < petalCount; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal petal-burst';
        
        // Random properties
        const angle = (i / petalCount) * Math.PI * 2;
        const distance = 100 + Math.random() * 150;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 50; // Slight upward bias
        const rot = (Math.random() - 0.5) * 720;
        const delay = Math.random() * 0.3;
        const duration = 1.5 + Math.random() * 1;
        const size = 16 + Math.random() * 16;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Create petal SVG
        const petalSvg = `<svg viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="M10 0C4.5 0 0 4.5 0 10c0 5.5 10 14 10 14s10-8.5 10-14C20 4.5 15.5 0 10 0z"/><path fill="${lightenColor(color, 20)}" d="M10 2c3.5 0 6.5 3 6.5 7.5C16.5 13.5 10 20 10 20S3.5 13.5 3.5 9.5C3.5 5 6.5 2 10 2z"/></svg>`;
        
        petal.style.cssText = `
            left: ${centerX}px;
            top: ${centerY}px;
            width: ${size}px;
            height: ${size * 1.2}px;
            margin-left: -${size/2}px;
            margin-top: -${size*1.2/2}px;
            --tx: ${tx}px;
            --ty: ${ty}px;
            --rot: ${rot}deg;
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
            background-image: url("data:image/svg+xml,${encodeURIComponent(petalSvg)}");
        `;
        
        container.appendChild(petal);
        
        // Remove after animation
        setTimeout(() => {
            petal.remove();
        }, (delay + duration) * 1000);
    }
    
    // Also create some falling petals
    createFallingPetals(centerX, centerY);
}

function createFallingPetals(centerX, centerY) {
    const container = document.querySelector('#petal-container');
    const count = 12;
    const colors = ['#E8B4B4', '#F5C6C6', '#D4A574', '#E8D5B7'];
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const petal = document.createElement('div');
            petal.className = 'petal';
            
            const x = centerX + (Math.random() - 0.5) * 100;
            const size = 14 + Math.random() * 12;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const duration = 3 + Math.random() * 2;
            const delay = Math.random() * 0.5;
            
            const petalSvg = `<svg viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="M10 0C4.5 0 0 4.5 0 10c0 5.5 10 14 10 14s10-8.5 10-14C20 4.5 15.5 0 10 0z"/><path fill="${lightenColor(color, 20)}" d="M10 2c3.5 0 6.5 3 6.5 7.5C16.5 13.5 10 20 10 20S3.5 13.5 3.5 9.5C3.5 5 6.5 2 10 2z"/></svg>`;
            
            petal.style.cssText = `
                left: ${x}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size * 1.2}px;
                margin-left: -${size/2}px;
                margin-top: -${size*1.2/2}px;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                background-image: url("data:image/svg+xml,${encodeURIComponent(petalSvg)}");
            `;
            
            container.appendChild(petal);
            
            setTimeout(() => petal.remove(), (delay + duration) * 1000);
        }, i * 80);
    }
}

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ==========================================================================
// COUNTDOWN TIMER
// ==========================================================================

let countdownInterval = null;

function initCountdown() {
    const daysEl = $('#countdown-days');
    const hoursEl = $('#countdown-hours');
    const minutesEl = $('#countdown-minutes');
    const secondsEl = $('#countdown-seconds');
    
    if (!window.weddingTimestamp) return;
    
    function updateCountdown() {
        const now = Date.now();
        const diff = window.weddingTimestamp - now;
        
        if (diff <= 0) {
            // Wedding has passed
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            clearInterval(countdownInterval);
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Animate number changes
        animateNumber(daysEl, days.toString().padStart(2, '0'));
        animateNumber(hoursEl, hours.toString().padStart(2, '0'));
        animateNumber(minutesEl, minutes.toString().padStart(2, '0'));
        animateNumber(secondsEl, seconds.toString().padStart(2, '0'));
    }
    
    function animateNumber(element, newValue) {
        if (element.textContent !== newValue) {
            element.style.transform = 'scale(1.1)';
            element.style.color = 'var(--color-gold-light)';
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 100);
        }
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// ==========================================================================
// PHOTOS & GALLERY RENDERING
// ==========================================================================

function renderPhotos(photos) {
    const grid = $safe('#photos-grid');
    if (!grid || grid.tagName !== 'DIV') {
        return;
    }
    if (!photos) {
        return;
    }
    
    // Combine couple, bride, groom photos
    const allPhotos = [
        ...(photos.couple || []),
        ...(photos.bride || []),
        ...(photos.groom || [])
    ];
    
    if (allPhotos.length === 0) {
        grid.innerHTML = '<p class="no-photos">Add photos to config.js to display here</p>';
        return;
    }
    
    grid.innerHTML = allPhotos.map((photo, index) => `
        <article class="photo-card" tabindex="0" data-index="${index}" role="button" aria-label="${photo.alt || 'Wedding photo'}">
            <img src="${photo.src}" alt="${photo.alt || ''}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="photo-placeholder" style="display:none; width:100%; height:100%; background:var(--gradient-gold); align-items:center; justify-content:center; color:var(--color-dark); font-family:var(--font-script); font-size:2rem;">&amp;</div>
            ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
        </article>
    `).join('');
    
    // Add click handlers for lightbox
    $$('.photo-card', grid).forEach(card => {
        card.addEventListener('click', () => openLightbox(parseInt(card.dataset.index), allPhotos));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(parseInt(card.dataset.index), allPhotos);
            }
        });
    });
}

function renderGallery(gallery) {
    const grid = $safe('#gallery-grid');
    if (!grid || grid.tagName !== 'DIV') {
        return;
    }
    if (!gallery || gallery.length === 0) {
        if (grid) grid.innerHTML = '<p class="no-photos">Add gallery images to config.js</p>';
        return;
    }
    
    grid.innerHTML = gallery.map((item, index) => `
        <figure class="gallery-item" data-index="${index}" role="listitem" tabindex="0" aria-label="${item.alt || 'Gallery image'}">
            <img src="${item.src}" alt="${item.alt || ''}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="photo-placeholder" style="display:none; width:100%; height:100%; background:var(--gradient-gold); align-items:center; justify-content:center; color:var(--color-dark); font-size:1.5rem;">◆</div>
        </figure>
    `).join('');
    
    // Add click handlers
    $$('.gallery-item', grid).forEach(item => {
        item.addEventListener('click', () => openLightbox(parseInt(item.dataset.index), gallery, true));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(parseInt(item.dataset.index), gallery, true);
            }
        });
    });
}

// ==========================================================================
// LIGHTBOX
// ==========================================================================

let lightboxImages = [];
let lightboxCurrentIndex = 0;
let lightboxIsGallery = false;

function openLightbox(index, images, isGallery = false) {
    lightboxImages = images;
    lightboxCurrentIndex = index;
    lightboxIsGallery = isGallery;
    
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image viewer');
    
    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <button class="lightbox-nav lightbox-prev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
        <button class="lightbox-nav lightbox-next" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
        <div class="lightbox-content">
            <img class="lightbox-image" src="${images[index].src}" alt="${images[index].alt || ''}">
        </div>
        <div class="lightbox-counter">${index + 1} / ${images.length}</div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // Force reflow
    lightbox.offsetHeight;
    lightbox.classList.add('active');
    
    // Event listeners
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    // Keyboard navigation
    const handleKeydown = (e) => {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') navigateLightbox(-1);
        else if (e.key === 'ArrowRight') navigateLightbox(1);
    };
    document.addEventListener('keydown', handleKeydown);
    lightbox._handleKeydown = handleKeydown;
    
    // Focus management
    closeBtn.focus();
}

function navigateLightbox(direction) {
    lightboxCurrentIndex = (lightboxCurrentIndex + direction + lightboxImages.length) % lightboxImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const image = document.querySelector('.lightbox-image');
    const counter = document.querySelector('.lightbox-counter');
    if (image && lightboxImages[lightboxCurrentIndex]) {
        image.src = lightboxImages[lightboxCurrentIndex].src;
        image.alt = lightboxImages[lightboxCurrentIndex].alt || '';
    }
    if (counter) {
        counter.textContent = `${lightboxCurrentIndex + 1} / ${lightboxImages.length}`;
    }
}

function closeLightbox() {
    const lightbox = $('#lightbox');
    if (!lightbox) return;
    
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        document.removeEventListener('keydown', lightbox._handleKeydown);
        lightbox.remove();
    }, 300);
}

// ==========================================================================
// SCROLL ANIMATIONS (Intersection Observer)
// ==========================================================================

function initScrollAnimations() {
    if (prefersReducedMotion()) {
        // Show all immediately
        $$('.reveal-on-scroll').forEach(el => el.classList.add('is-visible'));
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe sections
    $$('section:not(.cover-section)').forEach(section => {
        section.classList.add('reveal-on-scroll');
        observer.observe(section);
        
        // Check if already in view
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            section.classList.add('is-visible');
            observer.unobserve(section);
        }
    });
    
    // Observe individual elements within sections
    $$('.couple-content > *, .message-card, .reveal-card, .countdown-timer, .photo-card, .gallery-item, .venue-card, .closing-message, .share-buttons').forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
        
        // Check if already in view
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('is-visible');
            observer.unobserve(el);
        }
    });
    
    // Stagger children
    $$('.photos-grid, .gallery-grid').forEach(grid => {
        grid.classList.add('stagger-children');
    });
}

// ==========================================================================
// SHARING FUNCTIONALITY
// ==========================================================================

function initSharing() {
    $$('.share-btn').forEach(btn => {
        btn.addEventListener('click', handleShare);
    });
}

async function handleShare(event) {
    const btn = event.currentTarget;
    const platform = btn.dataset.platform;
    const config = window.sharingConfig || {};
    
    const shareData = {
        title: config.title || document.title,
        text: config.description || '',
        url: config.url || window.location.href
    };
    
    if (platform === 'whatsapp') {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } else if (platform === 'copy') {
        try {
            await navigator.clipboard.writeText(shareData.url);
            btn.classList.add('copied');
            btn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.querySelector('span').textContent = 'Copy Link';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = shareData.url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            btn.classList.add('copied');
            btn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.querySelector('span').textContent = 'Copy Link';
            }, 2000);
        }
    }
    
    // Track share event (optional)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
            method: platform,
            content_type: 'invitation'
        });
    }
}

// ==========================================================================
// SMOOTH SCROLL POLYFILL / ENHANCEMENT
// ==========================================================================

function initSmoothScroll() {
    // Smooth scroll for anchor links
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = $(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.focus({ preventScroll: true });
            }
        });
    });
}

// ==========================================================================
// RSVP HANDLING
// ==========================================================================

function initRSVP() {
    const form = document.querySelector('#rsvp-form');
    const successDiv = document.querySelector('#rsvp-success');
    const noteEl = document.querySelector('#rsvp-note');
    const submitBtn = document.querySelector('#rsvp-submit');
    const guestsSelect = document.querySelector('#rsvp-guests');
    const attendanceYes = document.querySelector('#attendance-yes');
    const attendanceNo = document.querySelector('#attendance-no');
    
    if (!form) return;
    
    // Toggle guests field based on attendance
    function toggleGuestsField() {
        if (attendanceYes.checked) {
            guestsSelect.disabled = false;
            guestsSelect.required = true;
            guestsSelect.style.opacity = '1';
        } else {
            guestsSelect.disabled = true;
            guestsSelect.required = false;
            guestsSelect.value = '';
            guestsSelect.style.opacity = '0.5';
        }
    }
    
    if (attendanceYes && attendanceNo) {
        attendanceYes.addEventListener('change', toggleGuestsField);
        attendanceNo.addEventListener('change', toggleGuestsField);
        // Initial state
        toggleGuestsField();
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        const formData = new FormData(form);
        const data = {
            id: Date.now().toString(),
            name: formData.get('name')?.trim(),
            email: formData.get('email')?.trim(),
            phone: formData.get('phone')?.trim(),
            guests: attendanceYes?.checked ? formData.get('guests') : '0',
            attendance: formData.get('attendance'),
            message: formData.get('message')?.trim(),
            submittedAt: new Date().toISOString()
        };
        
        // Client-side validation
        if (!data.name || !data.email || !data.attendance) {
            showNote('Please fill in all required fields.', 'error');
            return;
        }
        
        if (attendanceYes?.checked && !data.guests) {
            showNote('Please select number of guests.', 'error');
            return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            showNote('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        showNote('Submitting...', '');
        
        // Check if running locally
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.protocol === 'file:';
        
        try {
            // Detect environment
            const isLocal = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.protocol === 'file:';
            
            if (isLocal) {
                // Local storage fallback
                const stored = localStorage.getItem('rsvp_data');
                const rsvps = stored ? JSON.parse(stored) : [];
                rsvps.push(data);
                localStorage.setItem('rsvp_data', JSON.stringify(rsvps));
                
                form.hidden = true;
                if (successDiv) successDiv.hidden = false;
                showNote('Thank you! Your RSVP has been received.', 'success');
            } else {
                // Production: MUST use Netlify function - NO localStorage fallback
                const response = await fetch('/.netlify/functions/rsvp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || `Server error: ${response.status}`);
                }
                
                form.hidden = true;
                if (successDiv) successDiv.hidden = false;
                showNote('Thank you! Your RSVP has been received.', 'success');
            }
        } catch (err) {
            // NO localStorage fallback in production - show error to user
            console.error('RSVP submission failed:', err);
            showNote(`Failed to submit RSVP: ${err.message}. Please try again.`, 'error');
            submitBtn.disabled = false;
        }
    });
    
    function showNote(message, type) {
        if (!noteEl) return;
        noteEl.textContent = message;
        noteEl.className = 'rsvp-note';
        if (type) noteEl.classList.add(type);
    }
}

// ==========================================================================
// PERFORMANCE OPTIMIZATIONS
// ==========================================================================

function initPerformanceOptimizations() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });
        
        $$('img[loading="lazy"]').forEach(img => imageObserver.observe(img));
    }
    
    // Preload next gallery images
    $$('.gallery-item img').forEach((img, index, arr) => {
        if (index < arr.length - 1) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = arr[index + 1].src;
            document.head.appendChild(link);
        }
    });
}

// ==========================================================================
// ERROR HANDLING & FALLBACKS
// ==========================================================================

function initErrorHandling() {
    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        // Could send to error tracking service
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
    });
    
    // Image error fallbacks
    $$('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const placeholder = this.nextElementSibling;
            if (placeholder && placeholder.classList.contains('photo-placeholder')) {
                placeholder.style.display = 'flex';
            }
        });
    });
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

function init() {
    // Ensure loading screen hides even if init fails
    const loadingScreen = document.querySelector('#loading-screen');
    const invitation = document.querySelector('#invitation');
    const musicOverlay = document.querySelector('#music-overlay');
    
    function safeInit(fn, name) {
        try {
            fn();
        } catch (err) {
            showInitError(name, err);
        }
    }
    
    function showInitError(name, err) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 10px; right: 10px; z-index: 99999;
            background: #fee; border: 1px solid #f88; padding: 10px;
            border-radius: 8px; font-family: monospace; font-size: 12px;
            max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        errorDiv.innerHTML = `<strong>Error in ${name}:</strong><br>${err.message}<br><small>${err.stack?.split('\n')[1]?.trim() || ''}</small>`;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 10000);
    }
    
    // Load configuration first
    safeInit(loadConfig, 'loadConfig');
    
    // Initialize all modules
    safeInit(initLoadingScreen, 'initLoadingScreen');
    safeInit(initMusic, 'initMusic');
    safeInit(initEnvelope, 'initEnvelope');
    safeInit(initScratchReveal, 'initScratchReveal');
    safeInit(initSharing, 'initSharing');
    safeInit(initSmoothScroll, 'initSmoothScroll');
    safeInit(initPerformanceOptimizations, 'initPerformanceOptimizations');
    safeInit(initErrorHandling, 'initErrorHandling');
    safeInit(initRSVP, 'initRSVP');
    
    // Fallback: force hide loading screen after 3 seconds max
    setTimeout(() => {
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (invitation) invitation.hidden = false;
                if (musicOverlay) musicOverlay.classList.remove('hidden');
            }, 600);
        }
    }, 3000);
    
    // Mark as initialized
    document.body.classList.add('initialized');
    
    // Announce ready for any external scripts
    document.dispatchEvent(new CustomEvent('rom:invitation:ready', {
        detail: { config: window.invitationConfig }
    }));
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadConfig,
        initMusic,
        initEnvelope,
        initScratchReveal,
        initCountdown,
        createPetalBurst,
        initRSVP
    };
}