"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import styles from './page.module.css';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const cardRef = useRef(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) router.push('/chat');
        };
        checkUser();

        // Entrance animation
        gsap.from(cardRef.current, {
            y: 30,
            opacity: 0,
            duration: 1.2,
            ease: 'power4.out',
            delay: 0.2
        });
    }, [router]);

    const checkUserStatus = async (user) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        if (error || !data || !data.onboarding_completed) {
            router.push('/onboarding');
        } else {
            router.push('/chat');
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden');
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name: name },
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                });
                if (error) throw error;
                setSuccess(true);
                setTimeout(() => router.push('/onboarding'), 2000);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                setSuccess(true);
                setTimeout(() => checkUserStatus(data.user), 1000);
            }
        } catch (err) {
            setError(err.message || 'Error en la autenticación');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        gsap.to('.google-btn-anim', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
        }
    };

    const animateButton = (e) => {
        gsap.to(e.currentTarget, {
            scale: 0.96,
            duration: 0.1,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
    }

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backBtn}>
                <ArrowLeft size={18} />
                <span>Volver</span>
            </Link>

            {/* Animated Background */}
            <div className={styles.background}>
                <div className={styles.bgOrb1}></div>
                <div className={styles.bgOrb2}></div>
                <div className={styles.bgOrb3}></div>
                <div className={styles.gridPattern}></div>
            </div>

            <div className={styles.content}>
                {/* Logo Section */}
                <div className={styles.logoSection}>
                    <div className={styles.logoIcon}>
                        <Sparkles size={40} />
                    </div>
                    <h1 className={styles.logoText}>SIGMA AI</h1>
                    <p className={styles.logoSubtext}>Tu puerta al futuro de la inteligencia</p>
                </div>

                {/* Auth Card */}
                <div ref={cardRef} className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>{isSignUp ? '✨ Únete a Sigma' : '👋 Hola de nuevo'}</h2>
                        <p>{isSignUp ? 'Crea tu cuenta en segundos' : 'Accede a tus modelos favoritos'}</p>
                    </div>

                    <form onSubmit={handleAuth} className={styles.form}>
                        {isSignUp && (
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    <User size={18} />
                                    <span>Tu Nombre</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nombre"
                                    className={styles.input}
                                    required={isSignUp}
                                />
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Mail size={18} />
                                <span>Correo Electrónico</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Lock size={18} />
                                <span>Contraseña</span>
                            </label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {isSignUp && (
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    <Lock size={18} />
                                    <span>Confirma Contraseña</span>
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required={isSignUp}
                                />
                            </div>
                        )}

                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.success}>✅ Redirigiendo...</div>}

                        <button type="submit" className={styles.submitBtn} disabled={loading} onClick={animateButton}>
                            {loading ? <div className={styles.loader}></div> : <span>{isSignUp ? 'Registrarse' : 'Entrar Now'}</span>}
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <span>o</span>
                    </div>

                    <button type="button" className={`${styles.googleBtn} google-btn-anim`} onClick={handleGoogleLogin}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleIcon} />
                        <span>Google</span>
                    </button>

                    <button
                        type="button"
                        className={styles.switchBtn}
                        onClick={(e) => {
                            animateButton(e);
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                    >
                        {isSignUp ? '¿Ya tienes cuenta? Login' : '¿No tienes cuenta? Registro'}
                    </button>
                </div>

                <p className={styles.footer}>
                    BY <strong>SIGMA COMPANY</strong>
                </p>
            </div>
        </div>
    );
}
