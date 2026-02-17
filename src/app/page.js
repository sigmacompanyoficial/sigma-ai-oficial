'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Brain, Zap, Search, FileText, Shield, Sparkles,
    ArrowRight, MessageSquare, Code, Cpu, Globe, Lock,
    CheckCircle2, Layers, BarChart3, Database, Workflow, Play
} from 'lucide-react';
import styles from './landing.module.css';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
    const router = useRouter();
    const heroRef = useRef(null);
    const statsRef = useRef(null);
    const [theme, setTheme] = useState('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Handle password recovery redirect
        if (window.location.hash && window.location.hash.includes('type=recovery')) {
            router.push(`/login${window.location.hash}`);
            return;
        }

        const savedTheme = localStorage.getItem('sigma-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        setTimeout(() => setTheme(savedTheme), 0);
        setMounted(true);
    }, [router]);

    useEffect(() => {
        if (!mounted) return;

        // Hero Entrance Animation
        gsap.to(`.${styles.heroContent}`, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power4.out",
            delay: 0.2
        });

        // Stats Counter Animation
        const stats = statsRef.current?.querySelectorAll(`.${styles.statValue}`);
        stats?.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            gsap.fromTo(stat,
                { innerText: 0 },
                {
                    innerText: target,
                    duration: 2,
                    ease: "power2.out",
                    snap: { innerText: 1 },
                    scrollTrigger: {
                        trigger: stat,
                        start: "top 90%"
                    }
                }
            );
        });

        // Cards Stagger Animation
        gsap.from(`.${styles.featureCard}`, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.7)",
            scrollTrigger: {
                trigger: `.${styles.featureGrid}`,
                start: "top 80%"
            }
        });
    }, [mounted]);

    if (!mounted) {
        return (
            <div style={{
                height: '100vh',
                backgroundColor: '#0a0a0f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontFamily: 'Outfit, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '3px solid rgba(99, 102, 241, 0.2)',
                        borderTop: '3px solid #6366F1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    Cargando Sigma LLM...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.noise}></div>
            <div className={styles.meshContainer}>
                <div className={styles.meshGradient}></div>
            </div>

            {/* Navigation */}
            <nav className={styles.nav}>
                <Link href="/" className={styles.logoContainer}>
                    <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} alt="Sigma LLM" className={styles.logo} />
                    <span className={styles.brand}>Sigma LLM</span>
                </Link>
                <div className={styles.navLinks}>
                    <Link href="/about" className={styles.navLink}>Tecnología</Link>
                    <Link href="/terms" className={styles.navLink}>Términos</Link>
                    <Link href="/privacy" className={styles.navLink}>Privacidad</Link>
                </div>
                <Link href="/chat" className={styles.ctaBtn}>Empezar Gratis</Link>
            </nav>

            {/* Hero Section */}
            <header className={styles.hero} ref={heroRef}>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <Sparkles size={14} /> Desarrollado por Sigma Company
                    </div>
                    <h1 className={styles.mainTitle}>
                        El Futuro de la <br /> <span className={styles.highlight}>Inteligencia Artificial</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Experimenta el poder de la IA de próxima generación. Diseñada para razonar, crear y analizar con una precisión sin precedentes. Acceso instantáneo, sin tarjeta de crédito.
                    </p>
                    <div className={styles.heroActions}>
                        <Link href="/chat" className={styles.primaryBtn}>
                            Empezar ahora <ArrowRight size={18} />
                        </Link>
                        <Link href="/guest-demo" className={styles.secondaryBtn}>
                            <Play size={18} /> Ver Demo
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats Section */}
            <section className={styles.section} style={{ paddingTop: 0 }}>
                <div className={styles.statsContainer} ref={statsRef}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} data-target="3">3</span>
                        <span className={styles.statLabel}>Modelos Propios</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} data-target="99">99</span>
                        <span className={styles.statLabel}>% Precisión</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} data-target="15">15</span>
                        <span className={styles.statLabel}>Formatos de Archivo</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} data-target="100">100</span>
                        <span className={styles.statLabel}>% Privacidad</span>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Capacidades Avanzadas</span>
                    <h2 className={styles.sectionTitle}>Todo lo que necesitas en un solo lugar</h2>
                </div>

                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Brain size={32} /></div>
                        <h3 className={styles.featureTitle}>Razonamiento Profundo</h3>
                        <p className={styles.featureDescription}>
                            Capacidad de pensamiento paso a paso (Chain-of-Thought) para resolver problemas complejos con transparencia total.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Code size={32} /></div>
                        <h3 className={styles.featureTitle}>Generación de Código</h3>
                        <p className={styles.featureDescription}>
                            Crea aplicaciones completas, APIs, y componentes con código limpio, comentado y listo para producción.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Globe size={32} /></div>
                        <h3 className={styles.featureTitle}>Búsqueda Web en Tiempo Real</h3>
                        <p className={styles.featureDescription}>
                            Acceso a información actualizada de internet con integración nativa de Tavily para respuestas precisas.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><FileText size={32} /></div>
                        <h3 className={styles.featureTitle}>Análisis de Documentos</h3>
                        <p className={styles.featureDescription}>
                            Procesa PDFs, imágenes, hojas de cálculo y más. Extrae información clave automáticamente.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Zap size={32} /></div>
                        <h3 className={styles.featureTitle}>Respuestas Instantáneas</h3>
                        <p className={styles.featureDescription}>
                            Streaming ultra-rápido con latencia mínima. Arquitectura optimizada para máximo rendimiento.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Lock size={32} /></div>
                        <h3 className={styles.featureTitle}>Privacidad Garantizada</h3>
                        <p className={styles.featureDescription}>
                            Tus datos nunca se usan para entrenar modelos. Cifrado end-to-end y cumplimiento GDPR.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.section} style={{ textAlign: 'center', paddingTop: '8rem', paddingBottom: '8rem' }}>
                <h2 className={styles.mainTitle} style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>
                    Listo para <span className={styles.highlight}>transformar</span> tu flujo de trabajo?
                </h2>
                <p className={styles.subtitle} style={{ marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    Únete a miles de usuarios que ya están aprovechando el poder de Sigma LLM para aumentar su productividad.
                </p>
                <Link href="/chat" className={styles.primaryBtn} style={{ padding: '1.5rem 4rem', fontSize: '1.2rem' }}>
                    Empezar gratis ahora
                </Link>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerInfo}>
                        <Link href="/" className={styles.logoContainer}>
                            <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} alt="Sigma LLM" className={styles.logo} />
                            <span className={styles.brand}>Sigma LLM</span>
                        </Link>
                        <p>
                            Construyendo el futuro de la inteligencia artificial accesible para todos. Un producto de Sigma Company.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <a href="https://github.com/sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>GitHub</a>
                            <a href="https://tiktok.com/@sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>TikTok</a>
                            <a href="https://instagram.com/sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Instagram</a>
                            <a href="https://youtube.com/@sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>YouTube</a>
                        </div>
                    </div>
                    <div className={styles.footerGroup}>
                        <h4>Producto</h4>
                        <div className={styles.footerList}>
                            <Link href="/chat" className={styles.footerLink}>Chat</Link>
                            <Link href="/about" className={styles.footerLink}>Tecnología</Link>
                            <Link href="/guest-demo" className={styles.footerLink}>Demo</Link>
                        </div>
                    </div>
                    <div className={styles.footerGroup}>
                        <h4>Legal</h4>
                        <div className={styles.footerList}>
                            <Link href="/terms" className={styles.footerLink}>Términos</Link>
                            <Link href="/privacy" className={styles.footerLink}>Privacidad</Link>
                            <Link href="/cookies" className={styles.footerLink}>Cookies</Link>
                        </div>
                    </div>
                    <div className={styles.footerGroup}>
                        <h4>Compañía</h4>
                        <div className={styles.footerList}>
                            <span className={styles.footerLink}>Sigma Company</span>
                            <span className={styles.footerLink}>@sigmacompanyoficial</span>
                            <Link href="/chat" className={styles.footerLink}>Soporte</Link>
                        </div>
                    </div>
                </div>
                <div className={styles.copyright}>
                    <span>© {new Date().getFullYear()} Sigma Company. Todos los derechos reservados.</span>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link href="/privacy" className={styles.footerLink}>Privacidad</Link>
                        <Link href="/terms" className={styles.footerLink}>Términos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
