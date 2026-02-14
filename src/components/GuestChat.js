'use client';
import { useState, useRef, useEffect } from 'react';
import {
    Search, Plus, Send, ChevronDown, HelpCircle, Globe, Sparkles, X, ArrowRight
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
    const [messageCount, setMessageCount] = useState(0);
    const [showCookies, setShowCookies] = useState(true);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    const modelId = "openai/gpt-oss-120b:free";
    const systemInstructions = "Eres Sigma LLM 1 Mini, un modelo avanzado creado por Sigma Company. Mantén un tono profesional y amigable. Responde de forma clara y concisa.";

    useEffect(() => {
        const cookiesAccepted = localStorage.getItem('sigma_cookies_accepted');
        if (cookiesAccepted) setShowCookies(false);
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

            const response = await fetch('/api/chat/openrouter', {
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

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
                            assistantContent += content;
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
            <div className={styles.background}>
                <div className={styles.mesh}></div>
            </div>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft} style={{ zIndex: 10 }}>
                    <Link href="/" className={styles.sidebarLogoContainer}>
                        <img src="/logo_fondo_negro-removebg-preview.png" alt="Sigma AI" className={styles.sidebarLogo} />
                        <span className={styles.sidebarBrand}>Sigma AI</span>
                    </Link>
                </div>
                <div className={styles.headerRight} style={{ zIndex: 10 }}>
                    <Link href="/about" className={styles.helpBtn} style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600, marginRight: '1rem', textDecoration: 'none' }}>TECNOLOGÍA</Link>
                    <Link href="/login" className={styles.loginBtn}>Iniciar Sesión</Link>
                    <Link href="/login" className={styles.signupBtn}>Registrarse</Link>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                {messages.length === 0 ? (
                    <div className={styles.hero}>
                        <h1>El futuro es <br /><span style={{ background: 'linear-gradient(90deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Inteligente</span></h1>
                        <Link href="/about" style={{
                            marginTop: '2rem',
                            color: '#94A3B8',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '10px 20px',
                            borderRadius: '100px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            transition: 'all 0.3s'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            Descubre la tecnología Sigma AI <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className={styles.chatArea}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                                <div className={styles.messageContent}>
                                    <SigmaMarkdown content={msg.content} theme="dark" />
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className={styles.loading}>Propulsado por Sigma LLM...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

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

            {/* Input Area */}
            <div className={styles.footerInputWrapper}>
                <div className={styles.inputWrapper}>
                    <form onSubmit={handleSend} className={styles.inputContainer}>
                        <div className={styles.inputRow}>
                            <textarea
                                ref={textareaRef}
                                className={styles.textarea}
                                placeholder="Pregunta lo que quieras a Sigma AI..."
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
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>
                    <Link href="/about">IA de Sigma Company</Link>. Al usar Sigma AI, aceptas nuestras <Link href="/terms">Condiciones</Link> y <Link href="/privacy">Privacidad</Link>.
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
