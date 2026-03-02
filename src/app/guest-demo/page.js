'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import SigmaMarkdown from '@/components/SigmaMarkdown';
import styles from './page.module.css';

export default function GuestDemo() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    const questionText = "¿Cuando sale Sigma LLM?";
    const responseText = `Sigma LLM sale oficialmente el **2 de marzo a las 8:00 de la mañana**.

Será el lanzamiento de la nueva IA, donde podrás hacer preguntas, generar texto, obtener ayuda para programar, estudiar y mucho más.

Si quieres probarla cuando salga, el **link para acceder está en la descripción**.

También puedes encontrarla fácilmente buscando **"Sigma LLM" en Google**, donde aparecerá la página para entrar directamente a la IA.

¡Estate atento al lanzamiento y pruébala cuando esté disponible!`;
    const simulateStreaming = async () => {
        setIsStreaming(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        let currentResponse = "";
        const chunks = responseText.split(' ');

        for (let i = 0; i < chunks.length; i++) {
            currentResponse += chunks[i] + " ";
            setMessages(prev => {
                const next = [...prev];
                next[next.length - 1].content = currentResponse;
                return next;
            });
            await new Promise(resolve => setTimeout(resolve, 40 + Math.random() * 40));
        }
        setIsStreaming(false);
    };

    const handleAutoSend = async (text) => {
        const userMsg = { role: 'user', content: text };
        setMessages([userMsg]);
        setInput('');

        // Step 3: Wait a bit and show thinking animation
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsThinking(true);

        // Step 4: Keep thinking for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsThinking(false);

        // Step 5: Simulate streaming response
        await simulateStreaming();
    };

    const simulateTyping = async () => {
        setIsTyping(true);
        let currentText = "";
        for (let i = 0; i < questionText.length; i++) {
            currentText += questionText[i];
            setInput(currentText);
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
        }

        // Wait a bit after typing before sending
        await new Promise(resolve => setTimeout(resolve, 800));
        handleAutoSend(questionText);
    };

    useEffect(() => {
        // Step 1: Wait 3 seconds
        const startTimer = setTimeout(() => {
            simulateTyping();
        }, 3000);

        return () => clearTimeout(startTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.sidebarLogoContainer}>
                        <img src="/logo-fondo-claro.png" alt="Sigma LLM" className={styles.sidebarLogo} />
                        <span className={styles.sidebarBrand}>Sigma LLM</span>
                        <ChevronDown size={16} className={styles.chevron} />
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button className={styles.loginBtn}>Iniciar sesión</button>
                    <button className={styles.signupBtn}>Registrarse gratuitamente</button>
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
                                    readOnly
                                    rows={1}
                                />

                                <div className={styles.actionRow}>
                                    <div></div>
                                    <div className={styles.actionButtonsRight}>
                                        <button className={styles.sendBtnProps} disabled={!input}>
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
                                    <SigmaMarkdown content={msg.content} theme="light" />
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className={styles.thinkingContainer}>
                                <div className={styles.thinkingPulse}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className={styles.loaderText}>
                                    <span className={styles.loaderTitle}>Sigma LLM está pensando</span>
                                    <span className={styles.loaderSubtitle}>Construyendo la mejor respuesta...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Footer Area (always show input but disabled in this demo) */}
            {messages.length > 0 && (
                <div className={styles.footerInputWrapper}>
                    <div className={styles.inputWrapper}>
                        <div className={styles.inputContainer}>
                            <textarea
                                className={styles.textarea}
                                placeholder="Escribe un mensaje..."
                                value={input}
                                readOnly
                                rows={1}
                            />
                            <button className={styles.sendBtn} disabled>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className={styles.footer}>
                <p>
                    Al enviar un mensaje a Sigma LLM, un asistente de IA, aceptas nuestras condiciones y confirmas que has leído nuestra política de privacidad.
                </p>
            </footer>
        </div>
    );
}