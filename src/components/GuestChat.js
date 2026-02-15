'use client';
import { useState, useRef, useEffect } from 'react';
import {
    Search, Plus, Send, ChevronDown, HelpCircle, Globe, Sparkles, X, ArrowRight, Mic
} from 'lucide-react';
import Link from 'next/link';
import SigmaMarkdown from './SigmaMarkdown';
import styles from './GuestChat.module.css';

export default function GuestChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [error, setError] = useState(null);
    const [showRegisterMsg, setShowRegisterMsg] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [showCookies, setShowCookies] = useState(true);
    const [theme, setTheme] = useState('dark');
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    const modelId = "arcee-ai/trinity-large-preview:free";
    const systemInstructions = `Eres Sigma LLM 1 Mini, un asistente de IA de vanguardia. Fecha actual: ${new Date().toLocaleDateString('es-ES')}. Tienes acceso a una herramienta de búsqueda en tiempo real. Si el usuario te pregunta por algo actual (como el tiempo, noticias o eventos recientes), DEBES usar el comando SEARCH: 'consulta' para obtener datos reales antes de responder. Ejemplo: Si preguntan por el clima en Madrid, responde primero solo con SEARCH: clima en Madrid. Tu tono debe ser profesional y eficiente.`;

    useEffect(() => {
        const cookiesAccepted = localStorage.getItem('sigma_cookies_accepted');
        if (cookiesAccepted) setShowCookies(false);

        const savedTheme = localStorage.getItem('sigma-theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('sigma_cookies_accepted', 'true');
        setShowCookies(false);
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setError(null);

        const newCount = messageCount + 1;
        setMessageCount(newCount);
        if (newCount % 5 === 0) {
            setShowRegisterModal(true);
        }

        try {
            const apiMessages = [
                { role: 'system', content: systemInstructions },
                ...messages,
                userMsg
            ];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    modelId: modelId,
                    botName: "Sigma LLM 1 Mini",
                    stream: true,
                }),
            });

            if (!response.ok) throw new Error('Error en la respuesta del servidor');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '', isSearching: false }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            const content = data.choices[0]?.delta?.content || '';
                            if (content) {
                                assistantContent += content;

                                // --- AGENTIC SEARCH INTERCEPTOR (GUEST) ---
                                if (assistantContent.includes('SEARCH:')) {
                                    console.log('🔍 [GUEST AGENTIC SEARCH] Trigger detected');

                                    const searchMatch = assistantContent.match(/SEARCH:\s*([^.\n]+)/i);
                                    if (searchMatch) {
                                        const searchQuery = searchMatch[1].trim().replace(/[\[\]]/g, '');
                                        console.log('📡 [GUEST AGENTIC SEARCH] Query:', searchQuery);

                                        // 1. Show searching state
                                        setMessages(prev => {
                                            const next = [...prev];
                                            if (next.length > 0) {
                                                next[next.length - 1].content = '';
                                                next[next.length - 1].isSearching = true;
                                            }
                                            return next;
                                        });

                                        // 2. Call Tavily
                                        const gSearchResp = await fetch('/api/search', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ query: searchQuery, isGuest: true })
                                        });

                                        let gSearchContext = "";
                                        let gSearchSource = "";
                                        if (gSearchResp.ok) {
                                            const gSearchData = await gSearchResp.json();
                                            if (gSearchData.success) {
                                                gSearchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB]:\n${gSearchData.result}`;
                                                gSearchSource = gSearchData.source || 'Tavily';
                                            }
                                        }

                                        // 3. Re-call Chat API with context
                                        const finalApiMessages = [
                                            { role: 'system', content: systemInstructions },
                                            ...messages,
                                            userMsg,
                                            { role: 'system', content: "Información encontrada en la web: " + gSearchContext }
                                        ];

                                        setMessages(prev => {
                                            const next = [...prev];
                                            if (next.length > 0) {
                                                next[next.length - 1] = {
                                                    role: 'assistant',
                                                    content: '...',
                                                    isSearching: false,
                                                    source: gSearchSource
                                                };
                                            }
                                            return next;
                                        });

                                        const nextResp = await fetch('/api/chat', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                messages: finalApiMessages,
                                                modelId: modelId,
                                                botName: "Sigma LLM 1 Mini",
                                                stream: true,
                                            }),
                                        });

                                        if (!nextResp.ok) throw new Error('Error en re-búsqueda');

                                        const nextReader = nextResp.body.getReader();
                                        let finalContent = '';

                                        setMessages(prev => {
                                            const next = [...prev];
                                            if (next.length > 0) next[next.length - 1].content = '';
                                            return next;
                                        });

                                        while (true) {
                                            const { done, value } = await nextReader.read();
                                            if (done) break;
                                            const nChunk = decoder.decode(value);
                                            const nLines = nChunk.split('\n');
                                            for (const nl of nLines) {
                                                if (nl.startsWith('data: ')) {
                                                    try {
                                                        const nData = JSON.parse(nl.slice(6));
                                                        const nContent = nData.choices[0]?.delta?.content || '';
                                                        finalContent += nContent;
                                                        setMessages(prev => {
                                                            const last = prev[prev.length - 1];
                                                            return [...prev.slice(0, -1), { ...last, content: finalContent }];
                                                        });
                                                    } catch (e) { }
                                                }
                                            }
                                        }
                                        return; // Done
                                    }
                                }
                            }
                            setMessages(prev => {
                                const last = prev[prev.length - 1];
                                return [...prev.slice(0, -1), { ...last, content: assistantContent }];
                            });
                        } catch (e) { }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.sidebarLogoContainer}>
                        <img src={theme === 'light' ? '/logo-fondo-claro.png' : '/logo-fondo-negro.png'} alt="Sigma AI" className={styles.sidebarLogo} />
                        <span className={styles.sidebarBrand}>Sigma AI</span>
                        <ChevronDown size={16} className={styles.chevron} />
                    </Link>
                </div>
                <div className={styles.headerRight}>
                    <Link href="/login" className={styles.loginBtn}>Iniciar sesión</Link>
                    <Link href="/login?mode=signup" className={styles.signupBtn}>Registrarse gratuitamente</Link>
                    <button className={styles.helpCircleBtn} onClick={() => setShowHelp(true)}>
                        <HelpCircle size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                {messages.length === 0 ? (
                    <div className={styles.hero}>
                        <h1 className={styles.heroTitle}>¿En qué puedo ayudarte?</h1>

                        <div className={styles.centralInputWrapper}>
                            <div className={styles.inputBoxContainer}>
                                <textarea
                                    ref={textareaRef}
                                    className={styles.textarea}
                                    placeholder="Pregunta lo que quieras"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    rows={1}
                                />

                                <div className={styles.actionRow}>
                                    <div className={styles.actionButtonsLeft}>
                                        {/* Acciones eliminadas */}
                                    </div>
                                    <div className={styles.actionButtonsRight}>
                                        <button className={styles.sendBtnCentral} onClick={handleSend} disabled={!input.trim() || isLoading}>
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.chatArea}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                                <div className={styles.messageContent}>
                                    {msg.isSearching && (
                                        <div className={styles.searchingAnimation}>
                                            <Globe size={16} className={styles.searchIconAnim} />
                                            <span>Buscando en la web...</span>
                                        </div>
                                    )}
                                    <SigmaMarkdown content={msg.content} theme={theme} />
                                    {msg.source && (
                                        <div className={styles.sourceBadge}>
                                            <Globe size={12} />
                                            <span>Fuente: {msg.source}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className={styles.loading}>Propulsado por Sigma LLM...</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Bottom Footer Area (when messages exist) */}
            {messages.length > 0 && (
                <div className={styles.footerInputWrapper}>
                    <div className={styles.inputWrapper}>
                        <form onSubmit={handleSend} className={styles.inputContainer}>
                            <textarea
                                ref={textareaRef}
                                className={styles.textarea}
                                placeholder="Escribe un mensaje..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                rows={1}
                            />
                            <button type="submit" className={styles.sendBtn} disabled={!input.trim() || isLoading}>
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div className={styles.modalOverlay} onClick={() => setShowHelp(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setShowHelp(false)}><X size={20} /></button>
                        <div className={styles.modalIcon}><Sparkles size={32} /></div>
                        <h2>Bienvenido a Sigma AI</h2>
                        <div className={styles.helpText}>
                            <p>Sigma AI es la plataforma de inteligencia artificial de nueva generación desarrollada por <b>Sigma Company</b>.</p>
                            <div className={styles.modelSection}>
                                <h3>Nuestros Modelos:</h3>
                                <ul>
                                    <li><b>Sigma LLM 1 Std:</b> Versátil y rápido para tareas cotidianas.</li>
                                    <li><b>Sigma LLM 1 Coder:</b> Especialista en programación y estructuras lógicas.</li>
                                    <li><b>Sigma LLM 1 PRO:</b> El modelo más potente con razonamiento extendido.</li>
                                    <li><b>Sigma LLM 1 Reasoning:</b> Pensamiento profundo para problemas complejos y matemáticos.</li>
                                </ul>
                            </div>
                            <p>Disfruta de búsqueda web en tiempo real, análisis de archivos y una privacidad de grado militar.</p>
                        </div>
                        <button onClick={() => setShowHelp(false)} className={styles.modalCloseBtn}>Entendido</button>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showRegisterModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalIcon}><Sparkles size={32} /></div>
                        <h2>Has descubierto Sigma AI</h2>
                        <p>Únete a miles de usuarios que ya utilizan <b>Razonamiento Avanzado</b> y <b>Análisis de Archivos</b> para ser más productivos.</p>
                        <div className={styles.modalActions}>
                            <Link href="/login" className={styles.modalLoginBtn}>Empezar Gratis</Link>
                            <button onClick={() => setShowRegisterModal(false)} className={styles.modalCloseBtn}>Seguir probando</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Component */}
            <footer className={styles.footer}>
                <p>
                    Al enviar un mensaje a Sigma AI, un asistente de IA, aceptas nuestras <Link href="/terms">condiciones</Link> y confirmas que has leído nuestra <Link href="/privacy">política de privacidad</Link>. Ver <Link href="/cookies">preferencias de cookies</Link>.
                </p>
            </footer>

            {/* Cookie Banner */}
            {showCookies && (
                <div className={styles.cookieBanner}>
                    <div className={styles.cookieContent}>
                        <p>Utilizamos cookies para personalizar tu experiencia en Sigma AI.</p>
                        <button onClick={acceptCookies} className={styles.cookieBtn}>Entendido</button>
                    </div>
                </div>
            )}
        </div>
    );
}
