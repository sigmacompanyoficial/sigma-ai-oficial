'use client';
import { useState, useRef, useEffect } from 'react';
import { 
    Search, Plus, Send, ChevronDown, HelpCircle, Globe, Sparkles, X 
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import styles from './GuestChat.module.css';

export default function GuestChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false); // Disabled by default to save costs
    const [error, setError] = useState(null);
    const [showRegisterMsg, setShowRegisterMsg] = useState(false);
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

        console.log('💬 GuestChat: User sent message:', input);
        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);
        setShowRegisterMsg(false);

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
                    const searchResp = await fetch('/api/search', {
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
            const response = await fetch('/api/chat', {
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
                        } catch (e) {}
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

                const searchResp = await fetch('/api/search', {
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

                        const secondResponse = await fetch('/api/chat', {
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
                                        } catch (e) {}
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
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className={styles.loading}>Sigma AI está pensando...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Area */}
                <div className={styles.inputWrapper}>
                    {showRegisterMsg && (
                        <div className={styles.registerMsg}>
                            <p>Si quieres subir un archivo, regístrate o inicia sesión</p>
                            <div className={styles.registerActions}>
                                <Link href="/login" className={styles.smallLoginBtn}>Entrar</Link>
                                <button onClick={() => setShowRegisterMsg(false)} className={styles.closeMsg}><X size={14}/></button>
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
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>
                    Al enviar un mensaje a SIGMA AI, un asistente de IA, aceptas nuestras <a href="#">condiciones</a> y confirmas que has leído nuestra <a href="#">política de privacidad</a>. <a href="#">Ver preferencias de cookies</a>.
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
