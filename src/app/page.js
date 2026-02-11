'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Sparkles, Zap, Shield, Search, ArrowRight, Github } from 'lucide-react';
import '@/app/landing.css';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [count, setCount] = useState(0);
  const cursorRef = useRef(null);
  const preloaderRef = useRef(null);

  useEffect(() => {
    // --- PRELOADER COUNTER ---
    let start = 0;
    const interval = setInterval(() => {
      start++;
      setCount(start);
      if (start >= 100) {
        clearInterval(interval);
        // Hide preloader
        gsap.to(preloaderRef.current, {
          yPercent: -100,
          duration: 1.5,
          ease: 'power4.inOut',
          delay: 0.5,
          onComplete: () => {
            startHeroAnimation();
          }
        });
      }
    }, 20);

    // --- LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // --- CUSTOM CURSOR ---
    const moveCursor = (e) => {
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });
    };
    window.addEventListener('mousemove', moveCursor);

    // Cursor click effect
    const handleClick = (e) => {
      gsap.to(e.currentTarget, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
      // Minor ripple on cursor
      gsap.to(cursorRef.current, { scale: 0.5, duration: 0.1, yoyo: true, repeat: 1 });
    };

    // Cursor hover effects
    const targets = document.querySelectorAll('a, button, .feature-item, .gallery-item');
    targets.forEach(el => {
      el.addEventListener('mouseenter', () => cursorRef.current?.classList.add('hovered'));
      el.addEventListener('mouseleave', () => cursorRef.current?.classList.remove('hovered'));
      el.addEventListener('click', handleClick);
    });

    // --- HERO ANIMATIONS ---
    const startHeroAnimation = () => {
      const tl = gsap.timeline();
      tl.from('.glitch-text', {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        skewY: 7
      })
        .from('.subtitle', {
          opacity: 0,
          y: 20,
          duration: 1,
          ease: 'power2.out'
        }, '-=1');
    };

    // Parallax Hero
    gsap.to('.hero-bg img', {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // --- SECTION REVEALS ---
    gsap.from('.event-image-wrapper', {
      clipPath: 'inset(100% 0 0 0)',
      duration: 1.5,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '.section-event',
        start: 'top 70%'
      }
    });

    gsap.from('.bio-image', {
      x: -50,
      opacity: 0,
      duration: 1.5,
      scrollTrigger: {
        trigger: '.section-bio',
        start: 'top 70%'
      }
    });

    gsap.from('.feature-item', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      scrollTrigger: {
        trigger: '.section-features',
        start: 'top 80%'
      }
    });

    gsap.from('.gallery-item', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.section-gallery',
        start: 'top 80%'
      }
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="landing-page">
      <div ref={cursorRef} className="cursor"></div>

      {/* Preloader */}
      <div ref={preloaderRef} className="preloader">
        <div className="counter">{count}</div>
      </div>

      <nav className="navbar">
        <Link href="/" className="navbar-brand">Sigma AI</Link>
        <div className="nav-links">
          <a href="#features" className="nav-link">Modelos</a>
          <a href="#about" className="nav-link">Sobre Nosotros</a>
          <Link href="/login" className="nav-link">Login</Link>
        </div>
        <Link href="/login" className="magnetic-btn" style={{ padding: '0.8rem 2rem', marginTop: 0 }}>Entrar</Link>
      </nav>

      <header className="hero">
        <div className="hero-bg">
          <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2074&auto=format&fit=crop" alt="Abstract Background" />
        </div>
        <div className="hero-content">
          <p className="subtitle">Explora la Frontera</p>
          <h1 className="glitch-text" data-value="SIGMA AI">SIGMA AI</h1>
          <Link href="/login" className="magnetic-btn">
            Empezar Experiencia <ArrowRight size={20} style={{ marginLeft: '1rem' }} />
          </Link>
        </div>
      </header>

      <div className="marquee-container">
        <div className="marquee-content">
          <span className="marquee-item">DEEPSEEK R1</span>
          <span className="marquee-item">GEMMA 3 4B</span>
          <span className="marquee-item">GLM-4.5 AIR</span>
          <span className="marquee-item">MISTRAL SMALL</span>
          <span className="marquee-item">GPT-OSS 120B</span>
          <span className="marquee-item">TRINITY LARGE</span>
          <span className="marquee-item">PONY ALPHA</span>
          <span className="marquee-item">STEP-3.5 FLASH</span>
          {/* Duplicate for infinite effect */}
          <span className="marquee-item">DEEPSEEK R1</span>
          <span className="marquee-item">GEMMA 3 4B</span>
          <span className="marquee-item">GLM-4.5 AIR</span>
          <span className="marquee-item">MISTRAL SMALL</span>
        </div>
      </div>

      <section className="section-event">
        <div className="section-event-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>
          <div>
            <span className="event-label">Cómo Funciona</span>
            <h2 className="event-title">Tu Cerebro Digital, Sin Fricciones</h2>
            <div className="step-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="step-item">
                <h4 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'Syne' }}>1. Eliges tu Modelo</h4>
                <p style={{ color: '#666' }}>Selecciona entre DeepSeek R1, GPT-OSS, Gemma 3 o cualquier otro modelo disponible en nuestra librería.</p>
              </div>
              <div className="step-item">
                <h4 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'Syne' }}>2. Consultas en Tiempo Real</h4>
                <p style={{ color: '#666' }}>Tus preguntas viajan a través de nuestra arquitectura de baja latencia vía OpenRouter.</p>
              </div>
              <div className="step-item">
                <h4 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'Syne' }}>3. Obtienes Resultados</h4>
                <p style={{ color: '#666' }}>Recibe respuestas inteligentes, genera código o analiza imágenes de forma instantánea.</p>
              </div>
            </div>
            <Link href="/login" className="magnetic-btn">Pruébalo Gratis</Link>
          </div>
          <div className="event-image-wrapper">
            <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop" alt="Complex AI Grid" />
          </div>
        </div>
      </section>

      <section className="section-bio" id="about">
        <div className="bio-image">
          <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop" alt="Futuristic Tech" />
        </div>
        <div className="bio-content">
          <h2>Creado para Creadores.</h2>
          <p>
            Sigma Company impulsa las herramientas del mañana. Liderado por <strong>Ayoub Louah</strong>, Sigma AI es el resultado de la búsqueda de la simplicidad en la complejidad.
          </p>
          <p>
            Nuestra misión es democratizar el acceso a la computación cognitiva avanzada para cada desarrollador, artista y soñador.
          </p>
          <Link href="https://github.com/sigma-ai" target="_blank" className="magnetic-btn">
            <Github size={20} style={{ marginRight: '1rem' }} /> GitHub
          </Link>
        </div>
      </section>

      <section className="section-features" id="features">
        <div className="feature-item">
          <Zap className="feature-icon" />
          <h3 className="feature-title">Ultra Flash</h3>
          <p style={{ color: '#666' }}>Respuestas en milisegundos con nuestra arquitectura optimizada de streaming.</p>
        </div>
        <div className="feature-item">
          <Shield className="feature-icon" />
          <h3 className="feature-title">Seguridad Sigma</h3>
          <p style={{ color: '#666' }}>Tus datos son sagrados. Encriptación de grado militar en cada consulta.</p>
        </div>
        <div className="feature-item">
          <Sparkles className="feature-icon" />
          <h3 className="feature-title">Visión Pro</h3>
          <p style={{ color: '#666' }}>Análisis de imágenes en tiempo real con modelos de visión de última generación.</p>
        </div>
      </section>

      <section className="section-gallery">
        <div className="gallery-grid">
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop" alt="Art 1" />
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1964&auto=format&fit=crop" alt="Art 2" />
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2070&auto=format&fit=crop" alt="Art 3" />
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=1926&auto=format&fit=crop" alt="Art 4" />
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1932&auto=format&fit=crop" alt="Art 5" />
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1974&auto=format&fit=crop" alt="Art 6" />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">SIGMA AI</div>
        <div className="footer-links">
          <a href="#">Instagram</a>
          <a href="#">X (Twitter)</a>
          <a href="https://github.com/sigma-ai">GitHub</a>
          <p style={{ marginTop: '2rem', color: '#333', fontSize: '0.8rem' }}>
            © 2026 SIGMA COMPANY • BY AYOUB LOUAH
          </p>
        </div>
      </footer>
    </div>
  );
}
