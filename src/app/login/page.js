"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { formatAndLogSupabaseError, formatAndLogSupabaseResult } from '@/lib/supabaseHelpers';
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
    const [captchaValue, setCaptchaValue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
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
        if (!captchaValue) {
            setError("Por favor, completa el hCaptcha.");
            return;
        }
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
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                        captchaToken: captchaValue
                    }
                });
                if (error) throw error;
                setSuccess(true);
                setEmailSent(true);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setName('');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ 
                    email, 
                    password,
                    options: {
                        captchaToken: captchaValue
                    }
                });
                if (error) throw error;
                setSuccess(true);
                // Check user status and redirect immediately
                await checkUserStatus(data.user);
            }
        } catch (err) {
            const { ui } = formatAndLogSupabaseError(err);
            setError(ui || 'Error en la autenticación');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Usuario no autenticado');
                setLoading(false);
                return;
            }

            if (!user.email_confirmed_at) {
                setError('❌ No te has verificado. Revisa tu correo y verifica tu cuenta.');
                setLoading(false);
                return;
            }

            setSuccess(true);
            setEmailSent(false);
            await checkUserStatus(user);
        } catch (err) {
            const { ui } = formatAndLogSupabaseError(err);
            setError(ui || 'Error al verificar');
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
            const { ui } = formatAndLogSupabaseError(err);
            setError(ui || 'Error en la autenticación');
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
                        <h2>{emailSent ? '📧 Verificación Enviada' : isSignUp ? '✨ Únete a Sigma' : '👋 Hola de nuevo'}</h2>
                        <p>{emailSent ? 'Revisa tu correo para confirmar tu cuenta' : isSignUp ? 'Crea tu cuenta en segundos' : 'Accede a tus modelos favoritos'}</p>
                    </div>

                    {emailSent ? (
                        <div className={styles.verificationSection}>
                            <p className={styles.verificationText}>
                                Hemos enviado un correo de confirmación a <strong>{email}</strong>. 
                                Verifica tu cuenta haciendo clic en el enlace que recibiste.
                            </p>
                            <button 
                                type="button" 
                                className={styles.submitBtn} 
                                onClick={handleVerifyEmail}
                                disabled={loading}
                            >
                                {loading ? <div className={styles.loader}></div> : <span>✅ Ya he verificado</span>}
                            </button>
                            <button
                                type="button"
                                className={styles.switchBtn}
                                onClick={() => {
                                    setEmailSent(false);
                                    setError(null);
                                    setIsSignUp(true);
                                }}
                            >
                                ← Volver al registro
                            </button>
                        </div>
                    ) : (
                        <>
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

                                <div className={styles.recaptchaContainer}>
                                    <HCaptcha
                                        sitekey="1e5416e8-7dbe-451a-a77c-06eefca60052"
                                        onVerify={(token) => setCaptchaValue(token)}
                                        theme="dark"
                                    />
                                </div>

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
                        </>
                    )}
                </div>

                <p className={styles.footer}>
                    BY <strong>SIGMA COMPANY</strong>
                </p>
                <p className={styles.disclaimer}>sigma ai puede cometer errores</p>
            </div>
        </div>
    );
}
