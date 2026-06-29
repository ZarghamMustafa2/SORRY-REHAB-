// DOM Elements
const particlesCanvas = document.getElementById('particles-canvas');
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
const envelope = document.getElementById('envelope');
const prevCardBtn = document.getElementById('prev-card');
const nextCardBtn = document.getElementById('next-card');
const promiseCards = document.querySelectorAll('.promise-card');
const dotsContainer = document.getElementById('dots-container');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const successModal = document.getElementById('success-modal');
const closeModalBtn = document.getElementById('close-modal');

// Global State
let audioPlaying = false;
let currentCardIndex = 0;
const totalCards = promiseCards.length;

/* ------------------------------------------------------------------
   1. FLOATING PARTICLES SYSTEM (HTML5 CANVAS)
   ------------------------------------------------------------------ */
const ctx = particlesCanvas.getContext('2d');
let particlesArray = [];
const particleCount = window.innerWidth < 768 ? 12 : 25;

// Pre-render hearts to offscreen canvases for high performance
const heartCache = [];
const cacheColors = [
    'rgba(255, 77, 109, ',   // primary rose
    'rgba(255, 117, 143, ',  // light pink
    'rgba(255, 180, 194, ',  // blush pink
    'rgba(195, 148, 236, ',  // lavender
    'rgba(255, 204, 213, '   // powder pink
];

function createHeartCache() {
    // We cache 15 different hearts (5 colors x 3 sizes)
    const sizes = [8, 12, 16];
    cacheColors.forEach((colorBase) => {
        sizes.forEach((size) => {
            const cacheCanvas = document.createElement('canvas');
            cacheCanvas.width = size * 2.5;
            cacheCanvas.height = size * 2.5;
            const cacheCtx = cacheCanvas.getContext('2d');
            
            cacheCtx.translate(cacheCanvas.width / 2, cacheCanvas.height / 2);
            cacheCtx.beginPath();
            const d = size;
            cacheCtx.moveTo(0, -d / 2);
            cacheCtx.bezierCurveTo(d / 2, -d, d, -d / 3, 0, d);
            cacheCtx.bezierCurveTo(-d, -d / 3, -d / 2, -d, 0, -d / 2);
            
            cacheCtx.fillStyle = colorBase + '1.0)';
            cacheCtx.fill();
            
            heartCache.push({
                canvas: cacheCanvas,
                size: size
            });
        });
    });
}
createHeartCache();

// Set canvas dimensions
function resizeCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Heart Particle Class
class HeartParticle {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * particlesCanvas.width;
        this.y = initial ? Math.random() * particlesCanvas.height : particlesCanvas.height + 20;
        this.speedY = -(Math.random() * 0.8 + 0.4); // float speed up
        this.speedX = Math.sin(Math.random() * 2) * 0.4; // slight side sway
        this.opacity = Math.random() * 0.5 + 0.2;
        this.rotation = Math.random() * Math.PI;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        this.cacheIndex = Math.floor(Math.random() * heartCache.length);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;
        
        const cacheItem = heartCache[this.cacheIndex];
        ctx.drawImage(
            cacheItem.canvas, 
            -cacheItem.canvas.width / 2, 
            -cacheItem.canvas.height / 2
        );
        ctx.restore();
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        
        // Fade out as it nears the top
        if (this.y < 100) {
            this.opacity -= 0.005;
        }

        // Reset if it goes off screen or completely fades
        if (this.y < -20 || this.opacity <= 0) {
            this.reset(false);
        }
    }
}

// Initialize particles
function initParticles() {
    particlesArray = [];
    for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new HeartParticle());
    }
}

// Particle Loop
function animateParticles() {
    ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

/* ------------------------------------------------------------------
   2. INTERSECTION OBSERVER FOR FADE-IN
   ------------------------------------------------------------------ */
const fadeElements = document.querySelectorAll('.fade-in');
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

fadeElements.forEach(el => observer.observe(el));

/* ------------------------------------------------------------------
   3. BACKGROUND AUDIO MANAGEMENT
   ------------------------------------------------------------------ */
function togglePlay() {
    if (audioPlaying) {
        bgMusic.pause();
        musicToggle.classList.remove('playing');
        musicToggle.classList.add('muted');
        audioPlaying = false;
    } else {
        bgMusic.play().then(() => {
            musicToggle.classList.add('playing');
            musicToggle.classList.remove('muted');
            audioPlaying = true;
        }).catch(err => {
            console.log("Audio play failed or blocked by browser: ", err);
        });
    }
}

// Listen to audio button click
musicToggle.addEventListener('click', togglePlay);

// Try to auto-start music on first interaction (browser safety policy)
window.addEventListener('click', () => {
    if (!audioPlaying && bgMusic.paused) {
        // Only trigger once to avoid annoying the user if they manually paused
        window.removeEventListener('click', arguments.callee);
        // Play audio
        bgMusic.play().then(() => {
            musicToggle.classList.add('playing');
            musicToggle.classList.remove('muted');
            audioPlaying = true;
        }).catch(() => {});
    }
}, { once: true });

/* ------------------------------------------------------------------
   4. ENVELOPE / LETTER OPENING
   ------------------------------------------------------------------ */
envelope.addEventListener('click', (e) => {
    // If envelope is clicked, toggle open state
    envelope.classList.toggle('open');
    e.stopPropagation();
});

// Prevent clicking letter text itself from closing it immediately
document.getElementById('letter').addEventListener('click', (e) => {
    if (envelope.classList.contains('open')) {
        e.stopPropagation(); // keep it open
    }
});

/* ------------------------------------------------------------------
   5. WHY I'M SORRY CAROUSEL (CARDS DECK)
   ------------------------------------------------------------------ */
// Generate dots
function buildDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalCards; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === currentCardIndex) dot.classList.add('active');
        dot.addEventListener('click', () => showCard(i));
        dotsContainer.appendChild(dot);
    }
}

function updateCardsClasses() {
    promiseCards.forEach((card, idx) => {
        card.className = 'promise-card'; // clear states
        
        if (idx === currentCardIndex) {
            card.classList.add('active');
        } else if (idx === (currentCardIndex - 1 + totalCards) % totalCards) {
            card.classList.add('prev');
        } else if (idx === (currentCardIndex + 1) % totalCards) {
            card.classList.add('next');
        }
    });

    // Update dots
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        if (idx === currentCardIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function showCard(index) {
    currentCardIndex = index;
    updateCardsClasses();
}

function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % totalCards;
    updateCardsClasses();
}

function prevCard() {
    currentCardIndex = (currentCardIndex - 1 + totalCards) % totalCards;
    updateCardsClasses();
}

prevCardBtn.addEventListener('click', prevCard);
nextCardBtn.addEventListener('click', nextCard);

// Swipe gesture support for mobile touch screens
let touchStartX = 0;
let touchEndX = 0;
const cardsWrapper = document.querySelector('.cards-wrapper');

cardsWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

cardsWrapper.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold) {
        nextCard(); // Swiped left, show next
    } else if (touchEndX - touchStartX > swipeThreshold) {
        prevCard(); // Swiped right, show prev
    }
}

buildDots();
updateCardsClasses();

/* ------------------------------------------------------------------
   6. INTERACTIVE NO BUTTON EVASION & SCALING GAME
   ------------------------------------------------------------------ */
let noClickCount = 0;

function moveNoButton() {
    const parent = document.querySelector('.buttons-group');
    const parentRect = parent.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    
    const padding = 10;
    
    // Calculate boundaries relative to the buttons-group container
    const minX = padding;
    const maxX = parentRect.width - btnRect.width - padding;
    const minY = padding;
    const maxY = parentRect.height - btnRect.height - padding;
    
    // Generate new random positions
    let newX = Math.random() * (maxX - minX) + minX;
    let newY = Math.random() * (maxY - minY) + minY;
    
    // Ensure bounds are non-negative and correct
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));
    
    // Apply absolute positioning inside the buttons-group container
    noBtn.style.position = 'absolute';
    noBtn.style.transition = 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
    
    noClickCount++;
    
    // Scale down No button, scale up Yes button on each tap/hover
    // Min scale of No button is 0.15, Max scale of Yes button is 2
    const noScale = Math.max(0.15, 1 - noClickCount * 0.12);
    const yesScale = Math.min(2.0, 1 + noClickCount * 0.15);
    
    noBtn.style.transform = `scale(${noScale})`;
    yesBtn.style.transform = `scale(${yesScale})`;
    yesBtn.style.zIndex = '5'; // Ensure Yes button stays on top
    
    // Funny apologetic text lines
    const messages = [
        "Are you sure? 🥺",
        "Really? 😭",
        "Please think again... 💔",
        "Rehab pleaseee 🥺",
        "No is not an option! 😤",
        "Just tap Yes! ❤️",
        "Fine, you win, but tap Yes! 😂"
    ];
    
    if (noClickCount <= messages.length) {
        noBtn.textContent = messages[noClickCount - 1];
    }
    
    // Hide No button when it gets too small and make Yes button take full control
    if (noScale <= 0.2) {
        noBtn.style.opacity = '0';
        noBtn.style.pointerEvents = 'none';
    }
}

// Move on Hover (Desktop)
noBtn.addEventListener('mouseover', moveNoButton);

// Move on Touch / Tap (Mobile & touch screens)
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents triggers of mouse clicks/taps
    moveNoButton();
});

// If they somehow manage to click/tap it, trigger the escape
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    moveNoButton();
});

/* ------------------------------------------------------------------
   7. YES BUTTON CELEBRATION & MODAL
   ------------------------------------------------------------------ */
yesBtn.addEventListener('click', () => {
    // Show Modal
    successModal.classList.add('active');
    
    // Play Background music if not playing yet
    if (!audioPlaying) {
        bgMusic.play().then(() => {
            musicToggle.classList.add('playing');
            musicToggle.classList.remove('muted');
            audioPlaying = true;
        }).catch(() => {});
    }

    // Trigger Confetti!
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1100 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // confettis from left side
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
        }));
        // confettis from right side
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
        }));
    }, 250);
});

// Close Success Modal & Reset Game
closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    resetGame();
});

// Close Modal when clicking overlay & Reset Game
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
        resetGame();
    }
});

function resetGame() {
    noClickCount = 0;
    noBtn.style.position = '';
    noBtn.style.left = '';
    noBtn.style.top = '';
    noBtn.style.transform = '';
    noBtn.style.opacity = '1';
    noBtn.style.pointerEvents = 'auto';
    noBtn.textContent = "No 😤";
    yesBtn.style.transform = '';
}
