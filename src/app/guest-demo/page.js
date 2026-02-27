'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Sparkles, User, Image as ImageIcon, X, Trophy, ExternalLink, Code } from 'lucide-react';
import Link from 'next/link';
import SigmaMarkdown from '@/components/SigmaMarkdown';
import styles from './page.module.css';

// --- FLAPPY BIRD GAME COMPONENT (BOT ENABLED) ---
const FlappyBirdGame = ({ isBotPlaying }) => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Game state
        let bird = { x: 50, y: 150, width: 34, height: 24, gravity: 0.15, lift: -4.5, velocity: 0 };
        let pipes = [];
        let frameCount = 0;
        let isGameOver = false;

        const spawnPipe = () => {
            const gap = 150;
            const minHeight = 50;
            const maxHeight = canvas.height - gap - minHeight;
            const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            pipes.push({ x: canvas.width, top: height, bottom: canvas.height - height - gap, width: 50 });
        };

        const update = () => {
            if (isGameOver) return;

            bird.velocity += bird.gravity;
            bird.y += bird.velocity;

            // BOT LOGIC: Jump if bird is below the middle of the next gap
            if (isBotPlaying && pipes.length > 0) {
                const nextPipe = pipes.find(p => p.x + p.width > bird.x);
                if (nextPipe) {
                    const gapMiddle = nextPipe.top + 75;
                    if (bird.y > gapMiddle - 5) {
                        bird.velocity = bird.lift;
                    }
                }
            } else if (isBotPlaying && bird.y > canvas.height / 2) {
                bird.velocity = bird.lift;
            }

            if (bird.y + bird.height > canvas.height || bird.y < 0) {
                bird.y = canvas.height / 2; // Reset position for demo instead of full game over
                bird.velocity = 0;
            }

            pipes.forEach((pipe, index) => {
                pipe.x -= 2;
                if (pipe.x + pipe.width < 0) {
                    pipes.splice(index, 1);
                    setScore(s => s + 1);
                }
            });

            if (frameCount % 100 === 0) spawnPipe();
            frameCount++;
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Bird
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);

            // Pipes
            ctx.fillStyle = '#2ecc71';
            pipes.forEach(pipe => {
                ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
                ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
                ctx.strokeRect(pipe.x, 0, pipe.width, pipe.top);
                ctx.strokeRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
            });
        };

        const gameLoop = () => {
            update();
            draw();
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);
        gameLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, [isBotPlaying]);

    return (
        <div className={styles.gameCanvasContainer}>
            <canvas ref={canvasRef} className={styles.gameCanvas} />
            <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '2rem', fontWeight: 'bold', color: 'white', textShadow: '2px 2px 0 #000' }}>
                {score}
            </div>
            {isBotPlaying && (
                <div className={styles.botBadge}>
                    <div className={styles.botDot}></div>
                    BOT JUGANDO
                </div>
            )}
        </div>
    );
};

// --- LANDING PAGE PREVIEW COMPONENT ---
const LandingPreview = () => {
    return (
        <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: '#0d0d12', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
            {/* Minimalist version of the landing page for preview */}
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                    El Futuro de la <span style={{ background: 'linear-gradient(45deg, #6c5ce7, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Inteligencia Artificial</span>
                </h1>
                <p style={{ color: '#a0a0b0', maxWidth: '600px', margin: '0 auto 20px' }}>Desata tu potencial con Sigma LLM. Accede a los modelos más potentes del mundo en una interfaz unificada y elegante.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <div style={{ background: 'linear-gradient(45deg, #6c5ce7, #00cec9)', padding: '10px 20px', borderRadius: '50px', fontWeight: '600' }}>Empezar Ahora</div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>Saber Más</div>
                </div>
            </div>

            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                {[
                    { icon: '🚀', title: 'Velocidad Extrema', desc: 'Respuestas instantáneas impulsadas por la arquitectura más eficiente.' },
                    { icon: '🧠', title: 'Razonamiento Avanzado', desc: 'Capacidad para resolver problemas complejos y análisis profundo.' },
                    { icon: '👁️', title: 'Visión Computacional', desc: 'Sube imágenes y obtén análisis detallados al instante.' },
                    { icon: '🌐', title: 'Búsqueda Web', desc: 'Acceso a información en tiempo real directamente desde la web.' }
                ].map((f, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{f.icon}</div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>{f.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#a0a0b0' }}>{f.desc}</p>
                    </div>
                ))}
            </div>

            <div style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>¿Listo para elevar tu productividad?</h2>
                <div style={{ background: '#6c5ce7', display: 'inline-block', padding: '10px 30px', borderRadius: '50px', fontWeight: 'bold' }}>Abrir Chatbot</div>
            </div>
        </div>
    );
};

// --- MAIN DEMO COMPONENT ---
export default function GuestDemo() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [previewType, setPreviewType] = useState(null); // 'game' or 'landing'
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scenario = {
        question: "Crea una web profesional para Sigma LLM con un diseño moderno y minimalista.",
        response: `¡Excelente elección! Voy a diseñar y programar una landing page de alto impacto para **Sigma LLM**. Aquí tienes el código base utilizando HTML5 moderno y CSS3 avanzado con efectos de glassmorphism.

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Sigma LLM - Futuro de la IA</title>
    <style>
        :root {
            --primary: #6c5ce7;
            --secondary: #00cec9;
            --bg: #0d0d12;
            --glass: rgba(255, 255, 255, 0.05);
        }
        body { background: var(--bg); color: white; font-family: 'Outfit'; }
        .hero { min-height: 100vh; display: flex; align-items: center; }
        .gradient-text { background: linear-gradient(45deg, var(--primary), var(--secondary)); }
        /* Glassmorphism effects and animations */
    </style>
</head>
<body>
    <nav class="navbar">...</nav>
    <header class="hero">
        <h1>Transformando el mañana con <span class="gradient-text">Sigma LLM</span></h1>
    </header>
    <!-- Secciones de características, modelos y FAQ -->
</body>
</html>
\`\`\`
El diseño incluye globos de fondo con desenfoque Gaussiano, tarjetas con efecto cristal y tipografías premium. ¿Quieres ver la vista previa?`
    };

    useEffect(() => {
        const runDemo = async () => {
            // STEP 1: Wait 3 seconds
            await new Promise(r => setTimeout(r, 3000));

            // STEP 2: Start typing prompt
            let currentInput = "";
            for (let char of scenario.question) {
                currentInput += char;
                setInput(currentInput);
                await new Promise(r => setTimeout(r, 20 + Math.random() * 20));
            }
            await new Promise(r => setTimeout(r, 800));

            // STEP 3: "Send" message
            setMessages([{ role: 'user', content: scenario.question }]);
            setInput('');

            // STEP 4: Thinking (short)
            setIsThinking(true);
            await new Promise(r => setTimeout(r, 1000));
            setIsThinking(false);

            // STEP 5: Super fast stream
            setIsStreaming(true);
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            let currentContent = "";
            const chunks = scenario.response.split(' ');

            for (let chunk of chunks) {
                currentContent += chunk + " ";
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1].content = currentContent;
                    return next;
                });
                // Ultra fast delay
                await new Promise(r => setTimeout(r, 3));
            }
            setIsStreaming(false);

            // STEP 6: Modal Preview
            await new Promise(r => setTimeout(r, 1500));
            setPreviewType('landing');

            // Auto close after 20 seconds
            setTimeout(() => setPreviewType(null), 20000);
        };

        runDemo();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <div className={styles.container}>
            {/* Modal de Vista Previa */}
            {previewType && (
                <div className={styles.modalOverlay}>
                    <div className={styles.gameModal} style={{ width: previewType === 'landing' ? '900px' : '400px', height: '80vh' }}>
                        <div className={styles.gameHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {previewType === 'landing' ? <ExternalLink size={18} color="#6366F1" /> : <Sparkles size={18} color="#6366F1" />}
                                <h3>{previewType === 'landing' ? 'Vista previa: Sigma LLM Official Landing' : 'Generative Code: Flappy Bird'}</h3>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setPreviewType(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            {previewType === 'landing' ? <LandingPreview /> : <FlappyBirdGame isBotPlaying={true} />}
                        </div>

                        <div style={{ padding: '16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className={styles.botDot} style={{ width: '10px', height: '10px' }}></div>
                            <span>
                                {previewType === 'landing'
                                    ? 'Renderizando componentes interactivos en tiempo real...'
                                    : 'El bot de Sigma LLM está validando el código generado...'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.sidebarLogoContainer}>
                        <img src="/logo-fondo-claro.png" alt="Sigma LLM" className={styles.sidebarLogo} />
                        <span className={styles.sidebarBrand}>Sigma LLM</span>
                        <ChevronDown size={16} />
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button className={styles.loginBtn}>Iniciar sesión</button>
                    <button className={styles.signupBtn}>Registrarse</button>
                </div>
            </header>

            <main className={styles.main}>
                {messages.length === 0 ? (
                    <div className={styles.hero}>
                        <h1 className={styles.heroTitle}>¿En qué puedo ayudarte?</h1>
                        <div className={styles.centralInputWrapper}>
                            <div className={styles.inputBoxContainer}>
                                <textarea ref={textareaRef} className={styles.textarea} placeholder="Pregunta lo que quieras" value={input} readOnly rows={1} />
                                <div className={styles.actionRow}>
                                    <div></div>
                                    <button className={styles.sendBtnProps} disabled={!input}><Send size={18} /></button>
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
                                <div className={styles.thinkingPulse}><span></span><span></span><span></span></div>
                                <div className={styles.loaderText}>
                                    <span className={styles.loaderTitle}>Sigma LLM está pensando</span>
                                    <span className={styles.loaderSubtitle}>Construyendo arquitectura web...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            <footer className={styles.footer}>
                <p>Al enviar un mensaje a Sigma LLM, aceptas nuestras condiciones y política de privacidad.</p>
            </footer>
        </div>
    );
}
