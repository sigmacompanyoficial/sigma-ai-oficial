'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Brain, Zap, Search, FileText, Shield, Sparkles,
    ArrowRight, MessageSquare, Code, Cpu, Globe, Lock,
    CheckCircle2, Layers, BarChart3, Database, Workflow
} from 'lucide-react';
import styles from '../landing.module.css';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
    const heroRef = useRef(null);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('sigma-theme');
        if (savedTheme && savedTheme !== theme) {
            setTimeout(() => setTheme(savedTheme), 0);
        }
        document.documentElement.setAttribute('data-theme', savedTheme || 'dark');
    }, [theme]);

    useEffect(() => {
        // Hero Entrance
        gsap.to(`.${styles.heroContent}`, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power4.out",
            delay: 0.2
        });
    }, []);

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
                    <Link href="/about" className={styles.navLink}>Sobre Nosotros</Link>
                    <Link href="/terms" className={styles.navLink}>Términos</Link>
                    <Link href="/privacy" className={styles.navLink}>Privacidad</Link>
                </div>
                <Link href="/chat" className={styles.ctaBtn}>Acceso Directo</Link>
            </nav>

            {/* Hero Section */}
            <header className={styles.hero} ref={heroRef}>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <Sparkles size={14} /> Una compañía de producto
                    </div>
                    <h1 className={styles.mainTitle}>
                        Sobre <span className={styles.highlight}>Sigma Company</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Construimos herramientas de IA accesibles, responsables y de alto impacto. Nuestro compromiso es convertir la inteligencia artificial en una tecnología práctica y útil para todos.
                    </p>
                </div>
            </header>

            {/* About Sigma Company */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Pilares de Sigma Company</h2>
                </div>
                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <h3 className={styles.featureTitle}>Accesibilidad tecnológica</h3>
                        <p className={styles.featureDescription}>
                            Construir herramientas de IA potentes, pero usables por cualquier persona.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <h3 className={styles.featureTitle}>Innovación responsable</h3>
                        <p className={styles.featureDescription}>
                            Avanzar rápido, sin perder de vista la seguridad, la transparencia y la utilidad real para el usuario.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <h3 className={styles.featureTitle}>Calidad de producto</h3>
                        <p className={styles.featureDescription}>
                            Diseñar experiencias claras, modernas y orientadas a resultados.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <h3 className={styles.featureTitle}>Mejora continua</h3>
                        <p className={styles.featureDescription}>
                            Evolución constante del sistema, modelos, rendimiento e interfaz.
                        </p>
                    </div>
                </div>
            </section>

            {/* About Creator */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>El Creador</h2>
                </div>
                <div className={styles.stepRow}>
                    <div className={styles.stepContent}>
                        <h3 className={styles.featureTitle}>Ayoub Louah</h3>
                        <p className={styles.featureDescription}>
                            Sigma LLM ha sido impulsado y desarrollado por Ayoub Louah, fundador de Sigma Company. Este proyecto tiene un componente personal muy fuerte: nace desde la práctica, la iteración diaria y la ambición de construir una IA útil para el mundo real. La historia del producto demuestra que una visión clara, junto con disciplina técnica y mejora continua, puede transformar una idea en una plataforma viva con usuarios reales.
                        </p>
                    </div>
                    <div className={styles.stepVisual}>
                        {/* You can add an image of the creator here */}
                    </div>
                </div>
            </section>
            
            {/* Creator's Message */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Mensaje del Creador</h2>
                </div>
                <div className="text-center">
                    <p className={styles.subtitle}>
                        "Sigma LLM es una apuesta por una IA más útil, más cercana y más humana. Construimos cada mejora pensando en personas reales y problemas reales."
                    </p>
                    <p className={styles.subtitle}>- Ayoub Louah, fundador de Sigma Company.</p>
                </div>
            </section>

            {/* What is Sigma LLM */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>¿Qué es Sigma LLM?</h2>
                </div>
                <p className={styles.subtitle}>
                    Sigma LLM es la plataforma de inteligencia artificial de Sigma Company. Nace para democratizar el acceso a herramientas de IA avanzadas con una experiencia clara, potente y útil para el trabajo real. Es un asistente de nueva generación que no solo responde texto, sino que también "ve", "lee" documentos y "consulta" internet para darte respuestas más completas y más útiles.
                </p>
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
                            Construyendo el futuro de la inteligencia artificial soberana y accesible para todos. Un producto de Sigma Company.
                        </p>
                    </div>
                    <div className={styles.footerGroup}>
                        <h4>Ecosistema</h4>
                        <div className={styles.footerList}>
                            <Link href="/chat" className={styles.footerLink}>Aplicación Chat</Link>
                            <Link href="/about" className={styles.footerLink}>Sobre Nosotros</Link>
                        </div>
                    </div>
                    <div className={styles.footerGroup}>
                        <h4>Legal</h4>
                        <div className={styles.footerList}>
                            <Link href="/terms" className={styles.footerLink}>Condiciones</Link>
                            <Link href="/privacy" className={styles.footerLink}>Privacidad</Link>
                            <Link href="/cookies" className={styles.footerLink}>Cookies</Link>
                        </div>
                    </div>
                    <div className={styles.footerGroup}>
                        <h4>Compañía</h4>
                        <div className={styles.footerList}>
                            <span className={styles.footerLink}>Sigma Company</span>
                            <span className={styles.footerLink}>Ayoub Louah</span>
                        </div>
                    </div>
                </div>
                <div className={styles.copyright}>
                    <span>© {new Date().getFullYear()} Sigma Company. Reservados todos los derechos.</span>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link href="/privacy" className={styles.footerLink}>Privacidad</Link>
                        <Link href="/terms" className={styles.footerLink}>Términos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
