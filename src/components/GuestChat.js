'use client';
import { useState, useRef, useEffect } from 'react';
import {
    Search, Plus, Send, ChevronDown, HelpCircle, Globe, Sparkles, X
} from 'lucide-react';
import Link from 'next/link';
import SigmaMarkdown from './SigmaMarkdown';
import styles from './GuestChat.module.css';

export default function GuestChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false); // Disabled by default to save costs
    const [error, setError] = useState(null);
    const [showRegisterMsg, setShowRegisterMsg] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [showCookies, setShowCookies] = useState(true);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    const modelId = "openai/gpt-oss-120b:free";
    const systemInstructions = "Eres Sigma LLM 1 Mini, un modelo avanzado creado por Sigma Company. Mantén un tono profesional y amigable. Responde de forma clara y concisa.";

    // Rate limiting & Retry logic
    const lastSendTimeRef = useRef(0);
    const RATE_LIMIT_MS = 1500; // 1.5 segundos entre mensajes
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 2000; // 2 segundos

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchWithRetry = async (url, options, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                if (retries > 0) {
                    console.warn(`⏳ Límite de peticiones alcanzado. Reintentando en ${delay / 1000}s... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
                    await sleep(delay);
                    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
                } else {
                    throw new Error('Demasiadas peticiones. Por favor espera un momento e intenta de nuevo.');
                }
            }

            return response;
        } catch (err) {
            if (retries > 0 && err.message.includes('Failed to fetch')) {
                console.warn(`🔄 Error de conexión. Reintentando en ${delay / 1000}s...`);
                await sleep(delay);
                return fetchWithRetry(url, options, retries - 1, delay * 1.5);
            }
            throw err;
        }
    };

    const checkRateLimit = () => {
        const now = Date.now();
        const timeSinceLastSend = now - lastSendTimeRef.current;

        if (timeSinceLastSend < RATE_LIMIT_MS) {
            const waitTime = RATE_LIMIT_MS - timeSinceLastSend;
            console.log(`⏱️ Esperando ${waitTime}ms para enviar siguiente mensaje...`);
            return false;
        }

        lastSendTimeRef.current = now;
        return true;
    };

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

        // Rate limiting check
        if (!checkRateLimit()) {
            const now = Date.now();
            const waitTime = RATE_LIMIT_MS - (now - lastSendTimeRef.current);
            await sleep(waitTime);
        }

        console.log('💬 GuestChat: User sent message:', input);
        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);
        setShowRegisterMsg(false);

        const nextCount = messageCount + 1;
        setMessageCount(nextCount);
        if (nextCount > 0 && nextCount % 5 === 0) {
            setShowRegisterModal(true);
        }

        // Placeholder for assistant
        setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

        try {
            const hasLink = /https?:\/\/[^\s]+/.test(input);
            let searchContext = "";

            // Proactive search ONLY if a link is detected. 
            // Otherwise, let the model decide (reactive search).
            if (hasLink) {
                console.log('🌐 GuestChat: Link detected, triggering proactive search');
                try {
                    const searchResp = await fetchWithRetry('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: input })
                    });

                    if (searchResp.ok) {
                        const searchData = await searchResp.json();
                        if (searchData.success) {
                            console.log('✅ GuestChat: Link search results retrieved');
                            searchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB]:\n${searchData.result}\n\nUtiliza esta información para responder de forma precisa y menciona los detalles del enlace si es relevante.`;
                        }
                    }
                } catch (searchErr) {
                    console.error('❌ GuestChat: Proactive search failed:', searchErr);
                }
            }

            const messagesForAPI = [...newMessages];
            if (searchContext) {
                messagesForAPI[messagesForAPI.length - 1] = {
                    ...messagesForAPI[messagesForAPI.length - 1],
                    content: messagesForAPI[messagesForAPI.length - 1].content + searchContext
                };
            }

            console.log('🚀 GuestChat: Calling Chat API with model:', modelId);
            const response = await fetchWithRetry('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesForAPI,
                    modelId: modelId,
                    botName: "Sigma LLM 1 Mini",
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al comunicarse con la IA');
            }

            console.log('📡 GuestChat: Starting stream...');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            // Reset placeholder
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.role === 'assistant') {
                    return [...prev.slice(0, -1), { ...last, content: '' }];
                }
                return prev;
            });

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('✅ GuestChat: Stream finished');
                    break;
                }

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
                                if (last.role === 'assistant') {
                                    return [...prev.slice(0, -1), { ...last, content: assistantContent }];
                                }
                                return prev;
                            });
                        } catch (e) { }
                    }
                }
            }

            // Handle SEARCH: trigger
            if (!useWebSearch && assistantContent.startsWith('SEARCH:')) {
                const searchQuery = assistantContent.replace('SEARCH:', '').trim();
                console.log('🔍 GuestChat: Auto-search triggered by AI:', searchQuery);
                setMessages(prev => {
                    const last = [...prev];
                    last[last.length - 1] = { ...last[last.length - 1], content: `Buscando: ${searchQuery}...` };
                    return last;
                });

                const searchResp = await fetchWithRetry('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery })
                });

                if (searchResp.ok) {
                    const searchData = await searchResp.json();
                    if (searchData.success) {
                        console.log('✅ GuestChat: Auto-search results retrieved, re-calling API');
                        const secondSearchContext = `\n\n[CONTEXTO DE BÚSQUEDA WEB]:\n${searchData.result}\n\nResponde a la consulta original.`;
                        const secondMessagesForAPI = [...newMessages];
                        secondMessagesForAPI[secondMessagesForAPI.length - 1].content += secondSearchContext;

                        const secondResponse = await fetchWithRetry('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: secondMessagesForAPI,
                                modelId: modelId,
                                botName: "Sigma LLM 1 Mini",
                                stream: true,
                            }),
                        });

                        if (secondResponse.ok) {
                            const secondReader = secondResponse.body.getReader();
                            let secondAssistantContent = '';
                            setMessages(prev => {
                                const last = [...prev];
                                last[last.length - 1] = { ...last[last.length - 1], content: '' };
                                return last;
                            });

                            while (true) {
                                const { done, value } = await secondReader.read();
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
                                            secondAssistantContent += content;
                                            setMessages(prev => {
                                                const last = prev[prev.length - 1];
                                                return [...prev.slice(0, -1), { ...last, content: secondAssistantContent }];
                                            });
                                        } catch (e) { }
                                    }
                                }
                            }
                            console.log('✅ GuestChat: Second stream finished');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('💥 GuestChat: Critical error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRestrictedAction = (e) => {
        e.preventDefault();
        setShowRegisterMsg(true);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.sidebarLogoContainer}>
                        <img src="/logo_fondo_negro-removebg-preview.png" alt="Sigma AI" className={styles.sidebarLogo} />
                        <span className={styles.sidebarBrand}>Sigma AI</span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <Link href="/login" className={styles.loginBtn}>Iniciar sesión</Link>
                    <Link href="/login" className={styles.signupBtn}>Registrarse gratuitamente</Link>
                    <button className={styles.helpBtn}><HelpCircle size={20} /></button>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                {messages.length === 0 ? (
                    <div className={styles.hero}>
                        <h1>¿En qué puedo ayudarte?</h1>
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
                        {isLoading && <div className={styles.loading}>Sigma AI está pensando...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Registration Modal (Every 5 messages) */}
            {showRegisterModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalIcon}><Sparkles size={32} /></div>
                        <h2>Desbloquea todo el potencial</h2>
                        <p>Te estás perdiendo funciones increíbles como el <b>Razonamiento Avanzado</b>, la <b>Búsqueda Web</b> y el <b>Análisis de Imágenes</b>.</p>
                        <div className={styles.modalActions}>
                            <Link href="/login" className={styles.modalLoginBtn}>Registrarse Gratis</Link>
                            <button onClick={() => setShowRegisterModal(false)} className={styles.modalCloseBtn}>Seguir como invitado</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area (Footer) */}
            <div className={styles.footerInputWrapper}>
                <div className={styles.inputWrapper}>
                    {showRegisterMsg && (
                        <div className={styles.registerMsg}>
                            <p>Si quieres subir un archivo, regístrate o inicia sesión</p>
                            <div className={styles.registerActions}>
                                <Link href="/login" className={styles.smallLoginBtn}>Entrar</Link>
                                <button onClick={() => setShowRegisterMsg(false)} className={styles.closeMsg}><X size={14} /></button>
                            </div>
                        </div>
                    )}
                    <div className={styles.inputContainer}>
                        <div className={styles.inputRow}>
                            <button onClick={handleRestrictedAction} className={styles.plusBtn}>
                                <Plus size={22} />
                            </button>
                            <textarea
                                ref={textareaRef}
                                className={styles.textarea}
                                placeholder="Pregunta lo que quieras"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                            />
                            {input.trim() ? (
                                <button onClick={handleSend} className={styles.sendBtn} disabled={isLoading}>
                                    <Send size={18} />
                                </button>
                            ) : (
                                <div className={styles.placeholderIcon}>
                                    <Globe size={18} className={useWebSearch ? styles.activeGlobe : ''} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>
                    Al enviar un mensaje a SIGMA AI, un asistente de IA, aceptas nuestras <Link href="/terms">condiciones</Link> y confirmas que has leído nuestra <Link href="/privacy">política de privacidad</Link>. <Link href="/cookies">Ver preferencias de cookies</Link>.
                </p>
            </footer>

            {/* Cookie Banner */}
            {showCookies && (
                <div className={styles.cookieBanner}>
                    <div className={styles.cookieContent}>
                        <p>Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestra política de cookies.</p>
                        <button onClick={acceptCookies} className={styles.cookieBtn}>Aceptar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
