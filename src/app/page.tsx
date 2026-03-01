// @ts-nocheck
'use client';
import Link from 'next/link';
import { ArrowRight, Brain, Zap, Shield, Globe, Code, Sparkles, Cpu, MessageSquare, CheckCircle2, Play } from 'lucide-react';
import styles from './page.module.css';
import { useState, useEffect } from 'react';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>Σ</div>
                    <span className={styles.logoText}>Sigma Company</span>
                </div>
                <div className={styles.navLinks}>
                    <Link href="/about" className={styles.navLink}>Nosotros</Link>
                    <Link href="/login" className={styles.navLink}>Iniciar Sesión</Link>
                    <Link href="/chat" className={styles.ctaBtn}>
                        Probar Sigma LLM <ArrowRight size={16} />
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.gradientOrb}></div>
                    <div className={styles.gridOverlay}></div>
                </div>

                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <Sparkles size={14} className={styles.sparkleIcon} />
                        <span>Nueva Generación de IA</span>
                    </div>
                    <h1 className={styles.title}>
                        La Inteligencia Artificial <br />
                        <span className={styles.gradientText}>Sin Límites</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Sigma LLM no es solo un chat. Es una suite de inteligencia cognitiva capaz de razonar, programar y ver el mundo contigo. Diseñada por Sigma Company para redefinir el futuro.
                    </p>
                    <div className={styles.heroActions}>
                        <Link href="/chat" className={styles.primaryBtn}>
                            Comenzar Ahora
                            <div className={styles.btnGlow}></div>
                        </Link>
                        <Link href="/about" className={styles.secondaryBtn}>
                            <Play size={16} fill="currentColor" /> Ver Demo
                        </Link>
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    <div className={styles.interfaceCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.dotRed}></div>
                            <div className={styles.dotYellow}></div>
                            <div className={styles.dotGreen}></div>
                            <span className={styles.cardTitle}>Sigma LLM - Análisis en tiempo real</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.chatRow}>
                                <div className={styles.avatarUser}>U</div>
                                <div className={styles.bubbleUser}>Analiza este código y optimízalo.</div>
                            </div>
                            <div className={styles.chatRow}>
                                <div className={styles.avatarBot}><Cpu size={14} /></div>
                                <div className={styles.bubbleBot}>
                                    <div className={styles.typingIndicator}>
                                        <span></span><span></span><span></span>
                                    </div>
                                    <p className={styles.botText}>Analizando lógica... He encontrado 3 optimizaciones críticas.</p>
                                </div>
                            </div>
                            <div className={styles.codeSnippet}>
                                <code>function optimize(data) &#123; return data.filter(x =&gt; x.active); &#125;</code>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className={styles.features}>
                <div className={styles.sectionHeader}>
                    <h2>Potencia Cognitiva Pura</h2>
                    <p>Herramientas diseñadas para profesionales, desarrolladores y creativos.</p>
                </div>
                <div className={styles.grid}>
                    <div className={styles.featureCard}>
                        <div className={styles.iconWrapper}><Brain size={32} /></div>
                        <h3>Razonamiento Avanzado</h3>
                        <p>Capacidad superior para resolver problemas complejos, matemáticas y lógica paso a paso con DeepSeek R1.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.iconWrapper}><Code size={32} /></div>
                        <h3>Sigma Coder</h3>
                        <p>Un asistente de programación experto que escribe, depura y explica código en cualquier lenguaje.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.iconWrapper}><Globe size={32} /></div>
                        <h3>Conexión Web Real</h3>
                        <p>Acceso a internet en tiempo real para proporcionar información actualizada y fuentes verificables.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.iconWrapper}><Shield size={32} /></div>
                        <h3>Seguridad Empresarial</h3>
                        <p>Tus datos están protegidos. Privacidad por diseño y encriptación de extremo a extremo.</p>
                    </div>
                </div>
            </section>

            {/* Stats / Trust Section */}
            <section className={styles.trust}>
                <div className={styles.trustContent}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>120B+</span>
                        <span className={styles.statLabel}>Parámetros</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>0.2s</span>
                        <span className={styles.statLabel}>Latencia Media</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>24/7</span>
                        <span className={styles.statLabel}>Disponibilidad</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerBrand}>
                    <h3>Sigma Company</h3>
                    <p>© 2025 Sigma Company. Innovando el futuro de la IA.</p>
                </div>
                <div className={styles.footerLinks}>
                    <Link href="/terms">Términos</Link>
                    <Link href="/privacy">Privacidad</Link>
                    <Link href="/contact">Contacto</Link>
                </div>
            </footer>
        </div>
    );
}