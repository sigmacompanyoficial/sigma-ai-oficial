// @ts-nocheck
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
    const cardsRef = useRef([]);
    const statsRef = useRef(null);
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

        // Cards Stagger
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
                    <Link href="/about" className={styles.navLink}>Tecnología</Link>
                    <Link href="/terms" className={styles.navLink}>Términos</Link>
                    <Link href="/privacy" className={styles.navLink}>Privacidad</Link>
                </div>
                <Link href="/chat" className={styles.ctaBtn}>Acceso Directo</Link>
            </nav>

            {/* Hero Section */}
            <header className={styles.hero} ref={heroRef}>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <Sparkles size={14} /> Desarrollado por Sigma Company
                    </div>
                    <h1 className={styles.mainTitle}>
                        Conversaciones que <br /> <span className={styles.highlight}>Transforman Ideas</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Experimenta el poder de la inteligencia artificial propia. Diseñada para razonar, crear y analizar con una precisión sin precedentes.
                    </p>
                    <div className={styles.heroActions}>
                        <Link href="/chat" className={styles.primaryBtn}>
                            Empezar ahora
                        </Link>
                        <a href="#tecnologia" className={styles.secondaryBtn}>Explorar Ecosistema</a>
                    </div>
                </div>
            </header>

            <section className={styles.section} style={{ paddingTop: 0 }}>
                <div className={styles.showcaseShell}>
                    <div className={styles.showcaseHeader}>
                        <div className={styles.logoPill}>
                            <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} alt="Sigma LLM" className={styles.showcaseLogo} />
                            <span>Sigma LLM Product Showcase</span>
                        </div>
                        <p className={styles.showcaseSub}>
                            Interfaz enfocada en velocidad, claridad y análisis contextual de documentos e imágenes.
                        </p>
                    </div>

                    <div className={styles.captureGrid}>
                        <div className={styles.captureCard}>
                            <div className={styles.captureTopBar}>
                                <span className={styles.captureDot}></span>
                                <span className={styles.captureDot}></span>
                                <span className={styles.captureDot}></span>
                                <div className={styles.captureAddress}>sigma-ai/chat</div>
                            </div>
                            <div className={styles.chatMockup}>
                                <aside className={styles.chatMockSidebar}>
                                    <div className={styles.chatMockLogo}></div>
                                    <div className={styles.chatMockItem}></div>
                                    <div className={styles.chatMockItem}></div>
                                    <div className={styles.chatMockItemShort}></div>
                                </aside>
                                <div className={styles.chatMockMain}>
                                    <div className={styles.chatMockHeader}></div>
                                    <div className={styles.chatMockBubbleUser}></div>
                                    <div className={styles.chatMockBubbleBot}></div>
                                    <div className={styles.chatMockBubbleBotLong}></div>
                                    <div className={styles.chatMockInputRow}>
                                        <div className={styles.chatMockPlus}></div>
                                        <div className={styles.chatMockInput}></div>
                                        <div className={styles.chatMockSend}></div>
                                    </div>
                                </div>
                            </div>
                            <span className={styles.captureLabel}>Chat Workspace (HTML Mockup)</span>
                        </div>

                        <div className={styles.captureCard}>
                            <div className={styles.captureTopBar}>
                                <span className={styles.captureDot}></span>
                                <span className={styles.captureDot}></span>
                                <span className={styles.captureDot}></span>
                                <div className={styles.captureAddress}>sigma-ai/admin</div>
                            </div>
                            <div className={styles.adminMockup}>
                                <div className={styles.adminMockHeader}></div>
                                <div className={styles.adminKpis}>
                                    <div></div><div></div><div></div><div></div>
                                </div>
                                <div className={styles.adminTable}>
                                    <div className={styles.adminTableHead}></div>
                                    <div className={styles.adminRow}></div>
                                    <div className={styles.adminRow}></div>
                                    <div className={styles.adminRow}></div>
                                </div>
                            </div>
                            <span className={styles.captureLabel}>Admin Insights (HTML Mockup)</span>
                        </div>

                        <div className={styles.captureCard}>
                            <div className={styles.captureTopBar}>
                                <span className={styles.captureDot}></span>
                                <span className={styles.captureDot}></span>
                                <span className={styles.captureDot}></span>
                                <div className={styles.captureAddress}>sigma-ai/about</div>
                            </div>
                            <div className={styles.aboutMockup}>
                                <div className={styles.aboutHero}></div>
                                <div className={styles.aboutGrid}>
                                    <div></div><div></div><div></div>
                                </div>
                                <div className={styles.aboutStats}>
                                    <div></div><div></div><div></div><div></div>
                                </div>
                            </div>
                            <span className={styles.captureLabel}>Landing / About (HTML Mockup)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.section} style={{ paddingTop: 0 }}>
                <div className={styles.statsContainer} ref={statsRef}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} data-target="3">3</span>
                        <span className={styles.statLabel}>Modelos Propios</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} data-target="99">99</span>
                        <span className={styles.statLabel}>% Precisión Web</span>
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

            {/* Models/Features Bento Grid */}
            <section id="tecnologia" className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>Modelos Sigma LLM 1</span>
                    <h2 className={styles.sectionTitle}>Potencia Adaptativa</h2>
                </div>

                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Cpu size={32} /></div>
                        <h3 className={styles.featureTitle}>Sigma LLM 1 Std</h3>
                        <p className={styles.featureDescription}>
                            Optimizado para el uso diario. Respuestas instantáneas con un balance perfecto entre velocidad y razonamiento creativo.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Code size={32} /></div>
                        <h3 className={styles.featureTitle}>Sigma LLM 1 Coder</h3>
                        <p className={styles.featureDescription}>
                            Arquitectura especializada en estructuras de datos, backend, frontend y optimización algorítmica. Tu compañero de pair programming.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Brain size={32} /></div>
                        <h3 className={styles.featureTitle}>Sigma LLM 1 Reasoning</h3>
                        <p className={styles.featureDescription}>
                            Núcleo de pensamiento profundo. Diseñado para desglosar problemas complejos paso a paso (Chain-of-Thought).
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Globe size={32} /></div>
                        <h3 className={styles.featureTitle}>Búsqueda Omnisciente</h3>
                        <p className={styles.featureDescription}>
                            Integración nativa con la red para extraer información veraz y actualizada al milisegundo.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><FileText size={32} /></div>
                        <h3 className={styles.featureTitle}>Analista Multimodal</h3>
                        <p className={styles.featureDescription}>
                            Lectura inteligente de documentos técnicos, tablas financieras y sistemas de archivos completos sin intervención humana.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Lock size={32} /></div>
                        <h3 className={styles.featureTitle}>Seguridad de Grado Militar</h3>
                        <p className={styles.featureDescription}>
                            Cifrado E2E y gestión de datos soberana. Sigma Company no entrena sus modelos con tus datos privados.
                        </p>
                    </div>
                </div>
            </section>

            {/* Interactive "How it works" */}
            <section className={styles.stepSection}>
                <div className={styles.stepRow}>
                    <div className={styles.stepContent}>
                        <h3 className={styles.featureTitle}>Procesamiento de Lenguaje Soberano</h3>
                        <p className={styles.featureDescription}>
                            Nuestra infraestructura en la nube no depende de intermediarios lentos. Cada petición es procesada por nodos dedicados de Sigma Company, garantizando una latencia mínima de respuesta.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem' }}>
                            <li style={{ display: 'flex', gap: '12px', marginBottom: '1rem', alignItems: 'center', color: '#E2E2E2' }}>
                                <CheckCircle2 size={18} color="#6366F1" /> Balanceo de carga inteligente
                            </li>
                            <li style={{ display: 'flex', gap: '12px', marginBottom: '1rem', alignItems: 'center', color: '#E2E2E2' }}>
                                <CheckCircle2 size={18} color="#6366F1" /> Inferencia en milisegundos
                            </li>
                        </ul>
                    </div>
                    <div className={styles.stepVisual}>
                        <div className={styles.stepNumber}>01</div>
                        <Database size={120} color="#6366F1" opacity={0.2} style={{ animation: 'float 6s ease-in-out infinite' }} />
                        <div className={styles.glow} style={{ top: '20%', left: '30%' }}></div>
                    </div>
                </div>

                <div className={styles.stepRow}>
                    <div className={styles.stepContent}>
                        <h3 className={styles.featureTitle}>Razonamiento Transparente</h3>
                        <p className={styles.featureDescription}>
                            Entiende el &quot;por qué&quot; de cada respuesta. Gracias a Sigma LLM 1 Reasoning, puedes visualizar el proceso cognitivo del modelo antes de recibir la conclusión final.
                        </p>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', marginTop: '2rem' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FBBF24' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div>
                            </div>
                            <code style={{ fontSize: '0.85rem', color: '#94A3B8' }}>sigma_thinking... [DONE]</code>
                        </div>
                    </div>
                    <div className={styles.stepVisual}>
                        <div className={styles.stepNumber}>02</div>
                        <Workflow size={120} color="#6366F1" opacity={0.2} style={{ animation: 'float 4s ease-in-out infinite' }} />
                        <div className={styles.glow} style={{ bottom: '20%', right: '30%' }}></div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className={styles.section} style={{ textAlign: 'center' }}>
                <h2 className={styles.mainTitle} style={{ fontSize: '4rem' }}>Lleva tu flujo de trabajo <br /> al <span className={styles.highlight}>Siguiente Nivel</span></h2>
                <Link href="/chat" className={styles.primaryBtn} style={{ padding: '1.5rem 4rem', fontSize: '1.2rem' }}>
                    Empezar gratis hoy
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
                            Construyendo el futuro de la inteligencia artificial soberana y accesible para todos. Un producto de Sigma Company.
                        </p>
                    </div>
                    <div className={styles.footerGroup}>
                        <h4>Ecosistema</h4>
                        <div className={styles.footerList}>
                            <Link href="/chat" className={styles.footerLink}>Aplicación Chat</Link>
                            <Link href="/about" className={styles.footerLink}>Tecnología</Link>
                            <Link href="/manifest.js" className={styles.footerLink}>PWA Status</Link>
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
                            <span className={styles.footerLink}>Soporte</span>
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
