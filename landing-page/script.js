document.addEventListener('DOMContentLoaded', () => {
    // --- Typing Effect ---
    const aiMessageElement = document.querySelector('.message.ai p');
    if (aiMessageElement) {
        const originalText = aiMessageElement.textContent;
        aiMessageElement.textContent = '';

        let i = 0;
        const typeSpeed = 30; // ms per char

        function typeWriter() {
            if (i < originalText.length) {
                aiMessageElement.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, typeSpeed);
            }
        }
        setTimeout(typeWriter, 1500); // Start after 1.5s
    }

    // --- Intersection Observer for Scroll Animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Slightly higher threshold for better effect
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll(
        '.feature-card, .model-card, .cta-content, .section-title, .section-subtitle, .use-case-item'
    );

    animatedElements.forEach(el => {
        // Initial state set in CSS, here we just observe
        observer.observe(el);
    });

    // --- FAQ Logic ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other open items (accordion style) - Optional
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current
            item.classList.toggle('active');
        });
    });

    // --- 3D Tilt Effect for Cards (Mouse Movement) ---
    const cards = document.querySelectorAll('.glass-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate rotation based on mouse position
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            // Reset position
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
