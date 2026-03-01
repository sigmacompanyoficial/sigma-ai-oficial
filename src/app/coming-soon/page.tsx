'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Launch date: 2 March 2026 at 08:00 CET (UTC+1) = 07:00 UTC
const LAUNCH_DATE = new Date('2026-03-02T07:00:00.000Z');
type TimeLeft = { days: number; hours: number; minutes: number; seconds: number; total: number };
type Particle = { id: number; x: number; y: number; size: number; dur: number; delay: number };

declare global {
    interface Window {
        sigma?: string;
    }
}

function getTimeLeft(): TimeLeft | null {
    const now = new Date();
    const diff = LAUNCH_DATE.getTime() - now.getTime();
    if (diff <= 0) return null;
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        total: diff,
    };
}

export default function ComingSoon() {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft());
    const [launched, setLaunched] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Generate random particles only on client
        setParticles(Array.from({ length: 28 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            dur: Math.random() * 12 + 8,
            delay: Math.random() * 6,
        })));

        // Easter egg: type 'sigma' in console to launch
        if (typeof window !== 'undefined') {
            try {
                Object.defineProperty(window, 'sigma', {
                    get: () => {
                        setLaunched(true);
                        return '🚀 Acceso concedido. Bienvenido a Sigma LLM.';
                    },
                    configurable: true
                });
                // Mensaje para confirmar que el comando está activo
                console.log("🔒 [SISTEMA] Escribe 'sigma' y pulsa Enter para acceder.");
            } catch (e) { console.error(e); }
        }

        const interval = setInterval(() => {
            const t = getTimeLeft();
            if (!t) {
                setLaunched(true);
                clearInterval(interval);
                router.push('/chat');
            } else {
                setTimeLeft(t);
            }
        }, 1000);
        return () => {
            clearInterval(interval);
            if (typeof window !== 'undefined') {
                try { delete window.sigma; } catch (e) { }
            }
        };
    }, []);

    const pad = (n: number) => String(n).padStart(2, '0');

    // Percentage of time remaining (based on ~9 days from now)
    const totalMs = LAUNCH_DATE.getTime() - new Date('2026-02-21T22:07:00.000Z').getTime();
    const progressPct = timeLeft
        ? Math.max(0, Math.min(100, ((totalMs - timeLeft.total) / totalMs) * 100))
        : 100;

    if (launched) {
        return (
            <div className="cs-page">
                <div className="cs-orb cs-orb-1" />
                <div className="cs-orb cs-orb-2" />
                <div className="cs-launched">
                    <div className="cs-launch-emoji">🚀</div>
                    <h1 className="cs-launch-title">¡Ya estamos en vivo!</h1>
                    <p className="cs-launch-sub">Sigma LLM ha lanzado. ¡Bienvenido!</p>
                    <Link href="/" className="cs-cta-btn">Ir a la app →</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cs-page">
            {/* Floating particles */}
            <div className="cs-particles" aria-hidden="true">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="cs-particle"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            animationDuration: `${p.dur}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                ))}
            </div>

            {/* Background orbs */}
            <div className="cs-orb cs-orb-1" />
            <div className="cs-orb cs-orb-2" />
            <div className="cs-orb cs-orb-3" />
            <div className="cs-noise" />

            <main className="cs-main">
                {/* Logo */}
                <div className="cs-logo-wrap">
                    <img src="/logo-fondo-negro.png" alt="Sigma LLM" className="cs-logo-img" />
                    <span className="cs-logo-text">Sigma LLM</span>
                </div>

                <Link href="/" className="cs-back-link">
                    ← Volver a Sigma Company
                </Link>

                {/* Badge */}
                <div className="cs-badge">
                    <span className="cs-badge-dot" />
                    Lanzamiento próximo
                </div>

                {/* Headline */}
                <h1 className="cs-title">
                    Algo extraordinario<br />
                    <span className="cs-gradient">está por llegar</span>
                </h1>

                <p className="cs-sub">
                    Estamos preparando el futuro de la inteligencia artificial.<br />
                    <strong>Sigma LLM</strong> abre sus puertas el <strong>2 de marzo de 2026 a las 8:00h</strong> (hora española).
                </p>

                {/* Countdown */}
                <div className="cs-countdown">
                    {[
                        { val: timeLeft?.days ?? 0, label: 'Días' },
                        { val: timeLeft?.hours ?? 0, label: 'Horas' },
                        { val: timeLeft?.minutes ?? 0, label: 'Minutos' },
                        { val: timeLeft?.seconds ?? 0, label: 'Segundos' },
                    ].map((unit, i) => (
                        <div key={i} className="cs-unit">
                            <div className="cs-unit-card">
                                <span className="cs-unit-num">{pad(unit.val)}</span>
                            </div>
                            <span className="cs-unit-label">{unit.label}</span>
                        </div>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="cs-progress-wrap">
                    <div className="cs-progress-track">
                        <div
                            className="cs-progress-bar"
                            style={{ width: `${progressPct}%` }}
                        />
                        <div
                            className="cs-progress-glow"
                            style={{ left: `${progressPct}%` }}
                        />
                    </div>
                    <div className="cs-progress-labels">
                        <span>Inicio</span>
                        <span>{Math.round(progressPct)}% completado</span>
                        <span>Lanzamiento</span>
                    </div>
                </div>

                {/* Footer note */}
                <div className="cs-footer-note">
                    <div className="cs-socials">
                        <a href="https://github.com/sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className="cs-social">GitHub</a>
                        <span className="cs-sep">·</span>
                        <a href="https://instagram.com/sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className="cs-social">Instagram</a>
                        <span className="cs-sep">·</span>
                        <a href="https://tiktok.com/@sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className="cs-social">TikTok</a>
                        <span className="cs-sep">·</span>
                        <a href="https://youtube.com/@sigmacompanyoficial" target="_blank" rel="noopener noreferrer" className="cs-social">YouTube</a>
                    </div>
                    <p className="cs-copyright">© 2026 Sigma Company. Todos los derechos reservados.</p>
                </div>
            </main>

            <style>{`
                .cs-page {
                    min-height: 100vh;
                    background: #030308;
                    color: #fff;
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    padding: 2rem;
                }
                .cs-noise {
                    position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.02;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                }
                .cs-orb {
                    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
                    animation: csOrbDrift 20s ease-in-out infinite;
                }
                .cs-orb-1 {
                    width: 700px; height: 700px; top: -200px; left: -200px;
                    background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%);
                    animation-duration: 25s;
                }
                .cs-orb-2 {
                    width: 500px; height: 500px; bottom: -150px; right: -100px;
                    background: radial-gradient(circle, rgba(244,114,182,0.08) 0%, transparent 70%);
                    animation-duration: 18s; animation-delay: -9s;
                }
                .cs-orb-3 {
                    width: 400px; height: 400px; top: 30%; left: 60%;
                    background: radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%);
                    animation-duration: 22s; animation-delay: -5s;
                }
                @keyframes csOrbDrift {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33% { transform: translate(40px,-30px) scale(1.08); }
                    66% { transform: translate(-20px,25px) scale(0.95); }
                }

                /* Particles */
                .cs-particles { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
                .cs-particle {
                    position: absolute; border-radius: 50%;
                    background: rgba(99,102,241,0.4);
                    animation: csFloat linear infinite;
                    box-shadow: 0 0 6px rgba(129,140,248,0.5);
                }
                @keyframes csFloat {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-120vh) scale(0.5); opacity: 0; }
                }

                .cs-main {
                    position: relative; z-index: 2;
                    display: flex; flex-direction: column; align-items: center;
                    text-align: center; gap: 2rem; max-width: 800px; width: 100%;
                }

                /* Logo */
                .cs-logo-wrap {
                    display: flex; align-items: center; gap: 0.6rem;
                    animation: csFadeUp 0.8s ease both;
                }
                .cs-logo-img { width: 40px; height: 40px; object-fit: contain; }
                .cs-logo-text {
                    font-size: 1.3rem; font-weight: 800;
                    background: linear-gradient(135deg, #fff, #a5b4fc);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent; letter-spacing: -0.02em;
                }

                .cs-back-link {
                    margin-top: -1rem;
                    font-size: 0.9rem; color: rgba(255,255,255,0.6);
                    text-decoration: none; transition: color 0.2s;
                    z-index: 10;
                }
                .cs-back-link:hover { color: #fff; }

                /* Badge */
                .cs-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.45rem 1.1rem;
                    background: rgba(99,102,241,0.08);
                    border: 1px solid rgba(99,102,241,0.25);
                    border-radius: 100px;
                    font-size: 0.75rem; font-weight: 700; color: #818CF8;
                    text-transform: uppercase; letter-spacing: 0.12em;
                    animation: csFadeUp 0.8s 0.1s ease both;
                }
                .cs-badge-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #34D399;
                    box-shadow: 0 0 8px #34D399;
                    animation: csPulse 1.5s ease-in-out infinite;
                }
                @keyframes csPulse {
                    0%,100% { transform: scale(1); opacity:1; }
                    50% { transform: scale(1.4); opacity:0.7; }
                }

                /* Title */
                .cs-title {
                    font-size: clamp(2.5rem, 6vw, 4.5rem);
                    font-weight: 900; letter-spacing: -0.04em; line-height: 1.05;
                    background: linear-gradient(175deg, #fff 0%, rgba(255,255,255,0.7) 100%);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: csFadeUp 0.8s 0.2s ease both;
                }
                .cs-gradient {
                    background: linear-gradient(90deg, #818CF8, #C084FC, #F472B6);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .cs-sub {
                    font-size: 1rem; color: rgba(255,255,255,0.5);
                    line-height: 1.7; max-width: 580px;
                    animation: csFadeUp 0.8s 0.3s ease both;
                }
                .cs-sub strong { color: rgba(255,255,255,0.8); }

                /* Countdown */
                .cs-countdown {
                    display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap; justify-content: center;
                    animation: csFadeUp 0.8s 0.4s ease both;
                }
                .cs-unit { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
                .cs-unit-card {
                    min-width: 110px; min-height: 100px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    display: flex; align-items: center; justify-content: center;
                    position: relative;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.3);
                    transition: border-color 0.3s;
                }
                .cs-unit-card:hover { border-color: rgba(99,102,241,0.3); }
                .cs-unit-num {
                    font-size: 3.5rem; font-weight: 900;
                    background: linear-gradient(175deg, #fff 0%, rgba(255,255,255,0.6) 100%);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.04em; line-height: 1;
                    font-variant-numeric: tabular-nums;
                }
                .cs-unit-label {
                    font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.15em; color: rgba(255,255,255,0.35);
                }

                /* Progress */
                .cs-progress-wrap {
                    width: 100%; max-width: 600px;
                    animation: csFadeUp 0.8s 0.5s ease both;
                }
                .cs-progress-track {
                    height: 4px; background: rgba(255,255,255,0.06);
                    border-radius: 100px; overflow: visible; position: relative;
                    margin-bottom: 0.75rem;
                }
                .cs-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #6366F1, #C084FC, #F472B6);
                    border-radius: 100px;
                    transition: width 1s ease;
                    position: relative;
                }
                .cs-progress-glow {
                    position: absolute; top: 50%; transform: translate(-50%, -50%);
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #C084FC;
                    box-shadow: 0 0 12px 4px rgba(192,132,252,0.6);
                    transition: left 1s ease;
                }
                .cs-progress-labels {
                    display: flex; justify-content: space-between;
                    font-size: 0.68rem; color: rgba(255,255,255,0.25);
                    font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
                }

                /* Footer */
                .cs-footer-note {
                    display: flex; flex-direction: column; align-items: center;
                    gap: 1rem;
                    animation: csFadeUp 0.8s 0.6s ease both;
                }
                .cs-socials { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
                .cs-social {
                    font-size: 0.8rem; font-weight: 600;
                    color: rgba(255,255,255,0.35);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .cs-social:hover { color: rgba(255,255,255,0.8); }
                .cs-sep { color: rgba(255,255,255,0.15); font-size: 0.8rem; }
                .cs-copyright { font-size: 0.72rem; color: rgba(255,255,255,0.2); }

                /* Launched state */
                .cs-launched {
                    position: relative; z-index: 2;
                    display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
                }
                .cs-launch-emoji { font-size: 5rem; animation: csPulse 2s ease-in-out infinite; }
                .cs-launch-title {
                    font-size: 3rem; font-weight: 900;
                    background: linear-gradient(135deg, #fff, #818CF8);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .cs-launch-sub { color: rgba(255,255,255,0.5); font-size: 1.1rem; }
                .cs-cta-btn {
                    padding: 1rem 2.5rem;
                    background: #fff; color: #000;
                    border-radius: 14px; font-weight: 800; font-size: 1rem;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .cs-cta-btn:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(255,255,255,0.2); }

                @keyframes csFadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 600px) {
                    .cs-unit-card { min-width: 70px; min-height: 70px; border-radius: 14px; }
                    .cs-unit-num { font-size: 2.2rem; }
                    .cs-countdown { gap: 0.75rem; }
                    .cs-title { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
}
