'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Brain, Zap, Search, FileText, Shield, Sparkles,
    ArrowRight, MessageSquare, Code, Cpu, Globe, Lock,
    CheckCircle2, Play, Star, ChevronRight, Layers,
    BarChart3, Database, Bot, Image, Mic, Upload
} from 'lucide-react';

export default function Home() {
    const router = useRouter();
    const [theme, setTheme] = useState('dark');
    const [mounted, setMounted] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const [counts, setCounts] = useState({ models: 0, accuracy: 0, formats: 0, privacy: 0 });
    const statsRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
        if (window.location.hash && window.location.hash.includes('type=recovery')) {
            router.push(`/login${window.location.hash}`);
            return;
        }
        const savedTheme = localStorage.getItem('sigma-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        setTimeout(() => setTheme(savedTheme), 0);
        setMounted(true);

        const handleScroll = () => setNavScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [router]);

    useEffect(() => {
        if (!mounted || !statsRef.current) return;
        observerRef.current = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setStatsVisible(true);
                observerRef.current?.disconnect();
            }
        }, { threshold: 0.3 });
        observerRef.current.observe(statsRef.current);
        return () => observerRef.current?.disconnect();
    }, [mounted]);

    useEffect(() => {
        if (!statsVisible) return;
        const targets = { models: 3, accuracy: 99, formats: 15, privacy: 100 };
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounts({
                models: Math.round(targets.models * eased),
                accuracy: Math.round(targets.accuracy * eased),
                formats: Math.round(targets.formats * eased),
                privacy: Math.round(targets.privacy * eased),
            });
            if (step >= steps) clearInterval(timer);
        }, interval);
        return () => clearInterval(timer);
    }, [statsVisible]);

    if (!mounted) {
        return (
            <div style={{
                height: '100vh', backgroundColor: '#030303',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '2px solid rgba(99,102,241,0.2)',
                        borderTop: '2px solid #6366F1',
                        borderRadius: '50%', animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <span style={{ color: '#6366F1', fontWeight: 600 }}>Cargando Sigma LLM...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="lp-page">
            {/* Background */}
            <div className="lp-bg-mesh" />
            <div className="lp-noise" />
            <div className="lp-orb lp-orb-1" />
            <div className="lp-orb lp-orb-2" />
            <div className="lp-orb lp-orb-3" />

            {/* ─── NAV ─── */}
            <nav className={`lp-nav ${navScrolled ? 'lp-nav--scrolled' : ''}`}>
                <Link href="/" className="lp-logo">
                    <img
                        src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'}
                        alt="Sigma LLM"
                        className="lp-logo-img"
                    />
                    <span className="lp-logo-text">Sigma LLM</span>
                </Link>
                <div className="lp-nav-links">
                    <Link href="/about" className="lp-nav-link">Tecnología</Link>
                    <Link href="/terms" className="lp-nav-link">Términos</Link>
                    <Link href="/privacy" className="lp-nav-link">Privacidad</Link>
                    <Link href="/guest-demo" className="lp-nav-link">Demo</Link>
                </div>
                <Link href="/chat" className="lp-nav-cta">
                    Empezar Gratis <ArrowRight size={14} />
                </Link>
            </nav>

            {/* ─── HERO ─── */}
            <header className="lp-hero">
                <div className="lp-hero-content">
                    <div className="lp-badge">
                        <Sparkles size={13} />
                        <span>Desarrollado por Sigma Company</span>
                    </div>
                    <h1 className="lp-hero-title">
                        La IA que<br />
                        <span className="lp-gradient-text">transforma</span><br />
                        tu forma de trabajar
                    </h1>
                    <p className="lp-hero-sub">
                        Razona, crea y analiza con una precisión sin precedentes.
                        Modelos multimodales, búsqueda web en tiempo real y análisis
                        de documentos — todo en un solo lugar.
                    </p>
                    <div className="lp-hero-actions">
                        <Link href="/chat" className="lp-btn-primary">
                            Empezar gratis
                            <ArrowRight size={18} />
                        </Link>
                        <Link href="/guest-demo" className="lp-btn-secondary">
                            <Play size={16} fill="currentColor" />
                            Ver demo
                        </Link>
                    </div>
                    <div className="lp-hero-trust">
                        <div className="lp-stars">
                            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />)}
                        </div>
                        <span className="lp-trust-text">Confiado por creadores y empresas</span>
                    </div>
                </div>

                {/* Chat Mockup Visual */}
                <div className="lp-hero-visual">
                    <div className="lp-chat-mock">
                        <div className="lp-chat-mock-header">
                            <div className="lp-chat-mock-dots">
                                <span /><span /><span />
                            </div>
                            <span className="lp-chat-mock-title">Sigma LLM — Chat</span>
                        </div>
                        <div className="lp-chat-mock-body">
                            <div className="lp-msg lp-msg--bot">
                                <div className="lp-msg-avatar"><Bot size={14} /></div>
                                <div className="lp-msg-bubble">
                                    ¡Hola! Soy Sigma LLM. ¿En qué puedo ayudarte hoy?
                                </div>
                            </div>
                            <div className="lp-msg lp-msg--user">
                                <div className="lp-msg-bubble lp-msg-bubble--user">
                                    Analiza este PDF y dame un resumen ejecutivo
                                </div>
                            </div>
                            <div className="lp-msg lp-msg--bot">
                                <div className="lp-msg-avatar"><Bot size={14} /></div>
                                <div className="lp-msg-bubble lp-msg-bubble--typing">
                                    <div className="lp-typing-content">
                                        <div className="lp-typing-line lp-tl-80" />
                                        <div className="lp-typing-line lp-tl-65" />
                                        <div className="lp-typing-line lp-tl-90" />
                                        <div className="lp-typing-line lp-tl-50" />
                                    </div>
                                </div>
                            </div>
                            <div className="lp-msg lp-msg--tool">
                                <div className="lp-tool-pill">
                                    <FileText size={12} /> Analizando documento.pdf...
                                </div>
                            </div>
                        </div>
                        <div className="lp-chat-mock-input">
                            <div className="lp-input-area">
                                <Upload size={14} />
                                <span>Escribe un mensaje o sube un archivo...</span>
                            </div>
                            <div className="lp-send-btn"><ArrowRight size={14} /></div>
                        </div>
                    </div>
                    {/* Floating pills */}
                    <div className="lp-float-pill lp-float-1"><Brain size={14} /> Razonamiento</div>
                    <div className="lp-float-pill lp-float-2"><Globe size={14} /> Web en tiempo real</div>
                    <div className="lp-float-pill lp-float-3"><Shield size={14} /> 100% Privado</div>
                </div>
            </header>

            {/* ─── STATS ─── */}
            <section className="lp-stats-section" ref={statsRef}>
                <div className="lp-stats-grid">
                    {[
                        { val: counts.models, suffix: '', label: 'Modelos Propios', icon: <Cpu size={20} /> },
                        { val: counts.accuracy, suffix: '%', label: 'Precisión', icon: <CheckCircle2 size={20} /> },
                        { val: counts.formats, suffix: '+', label: 'Formatos de Archivo', icon: <FileText size={20} /> },
                        { val: counts.privacy, suffix: '%', label: 'Privacidad Garantizada', icon: <Shield size={20} /> },
                    ].map((s, i) => (
                        <div key={i} className="lp-stat-card">
                            <div className="lp-stat-icon">{s.icon}</div>
                            <div className="lp-stat-num">{s.val}{s.suffix}</div>
                            <div className="lp-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── FEATURES ─── */}
            <section className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-eyebrow">Capacidades Avanzadas</span>
                    <h2 className="lp-section-title">Todo lo que necesitas,<br />en un solo lugar</h2>
                    <p className="lp-section-sub">
                        Sigma LLM combina los mejores modelos de IA con herramientas potentes
                        para que puedas trabajar más rápido y con más precisión.
                    </p>
                </div>

                <div className="lp-features-grid">
                    {[
                        {
                            icon: <Brain size={28} />, color: '#6366F1',
                            title: 'Razonamiento Profundo',
                            desc: 'Chain-of-Thought paso a paso para resolver problemas complejos con total transparencia y precisión.'
                        },
                        {
                            icon: <Code size={28} />, color: '#06B6D4',
                            title: 'Generación de Código',
                            desc: 'Crea apps completas, APIs y componentes con código limpio, comentado y listo para producción.'
                        },
                        {
                            icon: <Globe size={28} />, color: '#10B981',
                            title: 'Búsqueda Web en Tiempo Real',
                            desc: 'Acceso a información actualizada de internet con Tavily integrado para respuestas siempre frescas.'
                        },
                        {
                            icon: <FileText size={28} />, color: '#F472B6',
                            title: 'Análisis de Documentos',
                            desc: 'Procesa PDFs, imágenes, hojas de cálculo y más. Extrae información clave automáticamente.'
                        },
                        {
                            icon: <Image size={28} />, color: '#F59E0B',
                            title: 'Visión Multimodal',
                            desc: 'Analiza imágenes, diagramas y fotos. Entiende el contexto visual con precisión de experto.'
                        },
                        {
                            icon: <Lock size={28} />, color: '#8B5CF6',
                            title: 'Privacidad Garantizada',
                            desc: 'Tus datos nunca se usan para entrenar modelos. Cifrado end-to-end y cumplimiento GDPR total.'
                        },
                    ].map((f, i) => (
                        <div key={i} className="lp-feature-card" style={{ '--feat-color': f.color }}>
                            <div className="lp-feature-icon">{f.icon}</div>
                            <h3 className="lp-feature-title">{f.title}</h3>
                            <p className="lp-feature-desc">{f.desc}</p>
                            <div className="lp-feature-arrow"><ChevronRight size={16} /></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="lp-section lp-how-section">
                <div className="lp-section-header">
                    <span className="lp-eyebrow">Cómo Funciona</span>
                    <h2 className="lp-section-title">Simple, rápido y potente</h2>
                </div>

                <div className="lp-steps">
                    {[
                        {
                            num: '01', icon: <Bot size={32} />,
                            title: 'Elige tu modelo',
                            desc: 'Selecciona entre múltiples modelos de IA según tu tarea. Desde razonamiento avanzado hasta generación creativa.'
                        },
                        {
                            num: '02', icon: <Upload size={32} />,
                            title: 'Sube tu contexto',
                            desc: 'Adjunta documentos, imágenes o activa búsqueda web. Sigma procesa cualquier tipo de información.'
                        },
                        {
                            num: '03', icon: <Sparkles size={32} />,
                            title: 'Obtén resultados',
                            desc: 'Recibe respuestas precisas, estructuradas y listas para usar. En segundos, no minutos.'
                        },
                    ].map((step, i) => (
                        <div key={i} className="lp-step">
                            <div className="lp-step-num">{step.num}</div>
                            <div className="lp-step-icon">{step.icon}</div>
                            <h3 className="lp-step-title">{step.title}</h3>
                            <p className="lp-step-desc">{step.desc}</p>
                            {i < 2 && <div className="lp-step-connector" />}
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── SHOWCASE / MOCKUP GRID ─── */}
            <section className="lp-section">
                <div className="lp-section-header">
                    <span className="lp-eyebrow">Plataforma Completa</span>
                    <h2 className="lp-section-title">Un ecosistema diseñado<br />para la productividad</h2>
                </div>

                <div className="lp-showcase-grid">
                    {/* Chat principal */}
                    <div className="lp-showcase-card lp-showcase-main">
                        <div className="lp-showcase-label">
                            <MessageSquare size={14} /> Chat Inteligente
                        </div>
                        <div className="lp-mock-window">
                            <div className="lp-mock-bar">
                                <span className="lp-mock-dot" /><span className="lp-mock-dot" /><span className="lp-mock-dot" />
                                <span className="lp-mock-url">sigma-llm.vercel.app/chat</span>
                            </div>
                            <div className="lp-mock-content">
                                <div className="lp-mock-sidebar">
                                    <div className="lp-sidebar-logo" />
                                    {[80, 70, 90, 60, 75].map((w, i) => (
                                        <div key={i} className="lp-sidebar-item" style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                                <div className="lp-mock-main">
                                    <div className="lp-mock-bubble lp-mock-bubble-bot" />
                                    <div className="lp-mock-bubble lp-mock-bubble-user" />
                                    <div className="lp-mock-bubble lp-mock-bubble-bot" style={{ width: '85%' }} />
                                    <div className="lp-mock-bubble lp-mock-bubble-bot" style={{ width: '60%' }} />
                                    <div className="lp-mock-input-bar" />
                                </div>
                            </div>
                        </div>
                        <p className="lp-showcase-desc">Conversaciones naturales con streaming en tiempo real</p>
                    </div>

                    {/* Análisis de docs */}
                    <div className="lp-showcase-card">
                        <div className="lp-showcase-label">
                            <FileText size={14} /> Análisis de Documentos
                        </div>
                        <div className="lp-doc-mock">
                            <div className="lp-doc-header">
                                <div className="lp-doc-icon"><FileText size={20} /></div>
                                <div>
                                    <div className="lp-doc-name" />
                                    <div className="lp-doc-size" />
                                </div>
                            </div>
                            <div className="lp-doc-lines">
                                {[100, 85, 95, 70, 88, 60].map((w, i) => (
                                    <div key={i} className="lp-doc-line" style={{ width: `${w}%` }} />
                                ))}
                            </div>
                            <div className="lp-doc-badge"><CheckCircle2 size={12} /> Análisis completo</div>
                        </div>
                        <p className="lp-showcase-desc">PDF, DOCX, XLSX, imágenes y más de 15 formatos</p>
                    </div>

                    {/* Web Search */}
                    <div className="lp-showcase-card">
                        <div className="lp-showcase-label">
                            <Search size={14} /> Búsqueda Web
                        </div>
                        <div className="lp-search-mock">
                            <div className="lp-search-bar">
                                <Search size={12} />
                                <span>últimas noticias de IA...</span>
                            </div>
                            {[
                                { acc: '#10B981' }, { acc: '#6366F1' }, { acc: '#F472B6' }
                            ].map((r, i) => (
                                <div key={i} className="lp-search-result">
                                    <div className="lp-result-dot" style={{ background: r.acc }} />
                                    <div className="lp-result-lines">
                                        <div className="lp-result-title" />
                                        <div className="lp-result-url" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="lp-showcase-desc">Fuentes verificadas actualizadas en tiempo real</p>
                    </div>

                    {/* Modelos */}
                    <div className="lp-showcase-card">
                        <div className="lp-showcase-label">
                            <Bot size={14} /> Múltiples Modelos
                        </div>
                        <div className="lp-models-mock">
                            {[
                                { name: 'Sigma Pro', tag: 'Razonamiento', color: '#6366F1' },
                                { name: 'Sigma Fast', tag: 'Velocidad', color: '#06B6D4' },
                                { name: 'Sigma Vision', tag: 'Multimodal', color: '#F472B6' },
                            ].map((m, i) => (
                                <div key={i} className="lp-model-item" style={{ '--mc': m.color }}>
                                    <div className="lp-model-dot" />
                                    <div className="lp-model-info">
                                        <span className="lp-model-name">{m.name}</span>
                                        <span className="lp-model-tag">{m.tag}</span>
                                    </div>
                                    {i === 0 && <div className="lp-model-active">Activo</div>}
                                </div>
                            ))}
                        </div>
                        <p className="lp-showcase-desc">Elige el modelo ideal para cada tarea</p>
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="lp-cta-section">
                <div className="lp-cta-glow" />
                <div className="lp-cta-content">
                    <div className="lp-badge lp-badge--center">
                        <Zap size={13} />
                        <span>Sin tarjeta de crédito · Gratis para siempre</span>
                    </div>
                    <h2 className="lp-cta-title">
                        ¿Listo para <span className="lp-gradient-text">transformar</span><br />tu forma de trabajar?
                    </h2>
                    <p className="lp-cta-sub">
                        Únete a creadores, desarrolladores y empresas que ya usan Sigma LLM
                        para multiplicar su productividad cada día.
                    </p>
                    <div className="lp-cta-actions">
                        <Link href="/chat" className="lp-btn-primary lp-btn-primary--lg">
                            Empezar gratis ahora
                            <ArrowRight size={20} />
                        </Link>
                        <Link href="/about" className="lp-btn-ghost">
                            Conocer la tecnología
                        </Link>
                    </div>
                    <div className="lp-cta-checks">
                        {['Acceso inmediato', 'Sin compromisos', '100% privado'].map((t, i) => (
                            <span key={i} className="lp-check-item">
                                <CheckCircle2 size={15} /> {t}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="lp-footer">
                <div className="lp-footer-top">
                    <div className="lp-footer-brand">
                        <Link href="/" className="lp-logo">
                            <img
                                src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'}
                                alt="Sigma LLM"
                                className="lp-logo-img"
                            />
                            <span className="lp-logo-text">Sigma LLM</span>
                        </Link>
                        <p className="lp-footer-tagline">
                            Construyendo el futuro de la inteligencia artificial accesible para todos.
                            Un producto de Sigma Company.
                        </p>
                        <div className="lp-social-links">
                            {[
                                { label: 'GitHub', href: 'https://github.com/sigmacompanyoficial' },
                                { label: 'TikTok', href: 'https://tiktok.com/@sigmacompanyoficial' },
                                { label: 'Instagram', href: 'https://instagram.com/sigmacompanyoficial' },
                                { label: 'YouTube', href: 'https://youtube.com/@sigmacompanyoficial' },
                            ].map((s, i) => (
                                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="lp-social-link">
                                    {s.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="lp-footer-links-grid">
                        <div className="lp-footer-col">
                            <h4 className="lp-footer-col-title">Producto</h4>
                            <Link href="/chat" className="lp-footer-link">Chat IA</Link>
                            <Link href="/about" className="lp-footer-link">Tecnología</Link>
                            <Link href="/guest-demo" className="lp-footer-link">Demo</Link>
                        </div>
                        <div className="lp-footer-col">
                            <h4 className="lp-footer-col-title">Legal</h4>
                            <Link href="/terms" className="lp-footer-link">Términos</Link>
                            <Link href="/privacy" className="lp-footer-link">Privacidad</Link>
                            <Link href="/cookies" className="lp-footer-link">Cookies</Link>
                        </div>
                        <div className="lp-footer-col">
                            <h4 className="lp-footer-col-title">Compañía</h4>
                            <span className="lp-footer-link">Sigma Company</span>
                            <span className="lp-footer-link">@sigmacompanyoficial</span>
                            <Link href="/chat" className="lp-footer-link">Soporte</Link>
                        </div>
                    </div>
                </div>
                <div className="lp-footer-bottom">
                    <span>© {new Date().getFullYear()} Sigma Company. Todos los derechos reservados.</span>
                    <div className="lp-footer-bottom-links">
                        <Link href="/privacy" className="lp-footer-link">Privacidad</Link>
                        <Link href="/terms" className="lp-footer-link">Términos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
