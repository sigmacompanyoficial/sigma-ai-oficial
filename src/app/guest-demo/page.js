'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Sparkles, User, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import SigmaMarkdown from '@/components/SigmaMarkdown';
import styles from './page.module.css';

export default function GuestDemo() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    const questionText = "Analiza detalladamente este logotipo y explícame su identidad visual.";
    const responseText = `He analizado la imagen y aquí tienes un desglose detallado de la identidad visual de **Sigma LLM**:

### 1. Simbolismo del Logotipo
El isotipo presenta una forma geométrica fluida y minimalista que evoca tanto la letra **"S"** (de Sigma) como el símbolo matemático del infinito o una estructura de red neuronal. Esta ambigüedad es deliberada, sugiriendo:
*   **Conectividad:** La fluidez de las líneas representa el flujo de información.
*   **Continuidad:** El diseño sugiere un proceso de mejora continua mediante el aprendizaje automático.

### 2. Estética y Estilo
*   **Minimalismo:** Siguiendo las tendencias de las principales compañías tecnológicas (como OpenAI o Anthropic), el diseño prescinde de adornos innecesarios para centrarse en la claridad.
*   **Contraste:** En esta versión, el uso de gris oscuro/negro sobre un lienzo blanco impoluto transmite una sensación de seriedad, transparencia y modernidad clínica.

### 3. Tipografía y Marca
Aunque en el icono no aparece texto, la identidad visual se complementa con la marca denominativa **"Sigma LLM"** en una tipografía sans-serif de estilo geométrico (Outfit/Inter), que refuerza la legibilidad y el carácter técnico pero accesible de la IA.

En resumen, es una identidad diseñada para proyectar **confianza, inteligencia avanzada y simplicidad** en la interacción usuario-máquina.`;

    useEffect(() => {
        const startSequence = async () => {
            // Step 1: Wait 3 seconds
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Step 2: Simulate mouse dragging logo
            setIsDragging(true);
            const startX = -60;
            const startY = 300;

            // Get center of textarea for precise dragging
            const textareaRect = textareaRef.current?.getBoundingClientRect();
            const endX = textareaRect ? textareaRect.left + (textareaRect.width / 2) : window.innerWidth / 2;
            const endY = textareaRect ? textareaRect.top + (textareaRect.height / 2) : window.innerHeight - 150;

            const duration = 2500;
            const startTime = Date.now();

            const moveMouse = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);

                // Advanced easing: easeInOutCubic
                const ease = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const curX = startX + (endX - startX) * ease;
                const curY = startY + (endY - startY) * ease;

                setMousePos({ x: curX, y: curY });

                if (progress < 1) {
                    requestAnimationFrame(moveMouse);
                } else {
                    finishDrag();
                }
            };

            const finishDrag = async () => {
                setIsDragging(false);
                setCapturedImage('/logo-fondo-claro.png');
                setMousePos({ x: -100, y: -100 }); // Hide cursor
                await new Promise(resolve => setTimeout(resolve, 800));
                simulateTyping();
            };

            requestAnimationFrame(moveMouse);
        };

        startSequence();
    }, []);

    const simulateTyping = async () => {
        setIsTyping(true);
        let currentText = "";
        for (let i = 0; i < questionText.length; i++) {
            currentText += questionText[i];
            setInput(currentText);
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
        }

        await new Promise(resolve => setTimeout(resolve, 800));
        handleAutoSend(questionText);
    };

    const handleAutoSend = async (text) => {
        const userMsg = { role: 'user', content: text, image: capturedImage };
        setMessages([userMsg]);
        setInput('');
        setCapturedImage(null);

        // Step 3: Analyze animation (1s)
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsAnalyzing(false);

        // Step 4: Thinking animation (1s)
        setIsThinking(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsThinking(false);

        // Step 5: Simulate streaming response
        await simulateStreaming();
    };

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
            await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 30));
        }
        setIsStreaming(false);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking, isAnalyzing]);

    return (
        <div className={styles.container}>
            {/* Simulated Cursor and Dragged Image */}
            <div
                className={styles.cursor}
                style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
            />
            {isDragging && (
                <img
                    src="/logo-fondo-claro.png"
                    alt="Dragging"
                    className={styles.draggingImage}
                    style={{ transform: `translate(${mousePos.x + 10}px, ${mousePos.y + 10}px)` }}
                />
            )}

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
                                {capturedImage && (
                                    <div className={styles.imagePreviewHeader}>
                                        <img src={capturedImage} alt="Preview" className={styles.imagePreview} />
                                    </div>
                                )}
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
                                    {msg.image && (
                                        <img src={msg.image} alt="User upload" style={{ maxWidth: '300px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #e5e7eb' }} />
                                    )}
                                    <SigmaMarkdown content={msg.content} theme="light" />
                                </div>
                            </div>
                        ))}

                        {isAnalyzing && (
                            <div className={styles.analyzingContainer}>
                                <div className={styles.scannerLine}></div>
                                <div className={styles.loaderText}>
                                    <span className={styles.loaderTitle} style={{ color: '#16a34a' }}>Analizando imagen</span>
                                    <span className={styles.loaderSubtitle}>Gemma está examinando el contenido...</span>
                                </div>
                            </div>
                        )}

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

            {/* Footer Area */}
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
