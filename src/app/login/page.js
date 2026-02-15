"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { formatAndLogSupabaseError, formatAndLogSupabaseResult } from '@/lib/supabaseHelpers';
import styles from './page.module.css';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Github, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const cardRef = useRef(null);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    useEffect(() => {
        // Detect recovery mode from hash or search params
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
            setIsResettingPassword(true);
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('type') === 'recovery') {
                setIsResettingPassword(true);
            }
            if (urlParams.get('mode') === 'signup') {
                setIsSignUp(true);
            }
        }

        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && !isResettingPassword) await checkUserStatus(user);
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

        // Listen for auth state changes (crucial for recovery mode)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsResettingPassword(true);
                console.log('🔐 Password recovery mode detected via event');
            }
            if (session?.user && !isResettingPassword) {
                await checkUserStatus(session.user);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [router, isResettingPassword]);

    const checkUserStatus = async (user) => {
        console.log('🔍 Comprobando estado del usuario:', user.id);
        if (!user) {
            console.error('❌ No se encontró usuario para comprobar estado');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('onboarding_completed, role, username')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('❌ Error al obtener perfil:', error);
                // Si el error es que no existe el perfil, forzamos onboarding
                router.push('/onboarding');
                return;
            }

            console.log('📄 Perfil encontrado:', data);

            if (!data || !data.onboarding_completed) {
                console.log('🏃 Redirigiendo a onboarding...');
                router.push('/onboarding');
            } else {
                console.log('✅ Onboarding completado, redirigiendo a chat...');
                router.push('/chat');
            }
        } catch (err) {
            console.error('❌ Error inesperado en checkUserStatus:', err);
            router.push('/onboarding');
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
                });
                if (error) throw error;
                setSuccess(true);
                setError('✅ Hemos enviado un correo para restablecer tu contraseña.');
                return;
            }

            if (isSignUp) {
                console.log('🚀 Iniciando proceso de registro para:', email);
                if (password !== confirmPassword) {
                    console.error('❌ Error: Las contraseñas no coinciden');
                    throw new Error('Las contraseñas no coinciden');
                }

                const redirectUrl = `${window.location.origin}/auth/callback`;
                console.log('🔗 URL de redirección configurada:', redirectUrl);

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name: name },
                        emailRedirectTo: redirectUrl
                    }
                });

                if (error) {
                    console.error('❌ Error de Supabase al registrarse:', error);
                    throw error;
                }

                console.log('✅ Registro exitoso en Supabase:', data);
                console.log('📧 Estado del correo:', data?.user?.identities?.length > 0 ? 'Identidad creada' : 'Usuario ya existía o error de identidad');

                setSuccess(true);
                setEmailSent(true);
                // No borramos el email para poder usarlo en el componente de verificación
                setPassword('');
                setConfirmPassword('');
                setName('');
            } else {
                let loginEmail = email;

                // If it doesn't look like an email, assume it's a username
                if (!email.includes('@')) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('username', email.trim())
                        .single();

                    if (profileError || !profile) {
                        throw new Error('Nombre de usuario no encontrado.');
                    }
                    loginEmail = profile.email;
                }

                const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
                if (error) {
                    if (error.message.includes('Email not confirmed')) {
                        setNeedsVerification(true);
                        setEmailSent(true);
                        throw new Error('Tu correo no está verificado.');
                    }
                    throw error;
                }
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

    const handleResendVerification = async () => {
        if (resendCooldown > 0) return;

        // Capture email from state OR from the input if state was lost
        const targetEmail = email.trim();

        if (!targetEmail) {
            setError('❌ No se encontró el correo. Por favor, intenta iniciar sesión para reenviar la verificación.');
            return;
        }

        console.log('📧 Reenviando verificación a:', targetEmail);
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: targetEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
            setResendCooldown(180); // 3 minutes
            setError('✅ Nuevo correo enviado. Revisa tu bandeja de entrada.');
        } catch (err) {
            const { ui } = formatAndLogSupabaseError(err);
            setError(ui || 'Error al reenviar el correo');
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

    const handleGitHubLogin = async () => {
        gsap.to('.github-btn-anim', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
        } catch (err) {
            const { ui } = formatAndLogSupabaseError(err);
            setError(ui || 'Error en la autenticación con GitHub');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!password) {
            setError('Por favor, introduce una nueva contraseña.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Ensure we have the latest session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                console.error('Session check failed:', sessionError);
                throw new Error('No se encontró una sesión activa. Por favor, usa el enlace de recuperación de tu correo nuevamente.');
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setError('✅ Contraseña actualizada correctamente. Redirigiendo...');
            setTimeout(() => {
                router.push('/chat');
            }, 2000);
        } catch (err) {
            const { ui } = formatAndLogSupabaseError(err);
            setError(ui || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
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
                        <h2>{isResettingPassword ? '🔒 Nueva contraseña' : emailSent ? '📧 Verificación Enviada' : isForgotPassword ? '🔑 Recuperar cuenta' : isSignUp ? '✨ Únete a Sigma' : '👋 Hola de nuevo'}</h2>
                        <p>{isResettingPassword ? 'Establece tu nueva contraseña de acceso' : emailSent ? 'Revisa tu correo para confirmar tu cuenta' : isForgotPassword ? 'Introduce tu email para restablecer tu contraseña' : isSignUp ? 'Crea tu cuenta en segundos' : 'Accede a tus modelos favoritos'}</p>
                    </div>

                    {isResettingPassword ? (
                        <form onSubmit={handleResetPassword} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    <Lock size={18} />
                                    <span>Nueva Contraseña</span>
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

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    <Lock size={18} />
                                    <span>Confirmar Nueva Contraseña</span>
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            {error && <div className={error.startsWith('✅') ? styles.success : styles.error}>{error}</div>}

                            <button type="submit" className={styles.submitBtn} disabled={loading} onClick={animateButton}>
                                {loading ? <div className={styles.loader}></div> : <span>Actualizar contraseña</span>}
                            </button>
                        </form>
                    ) : emailSent ? (
                        <div className={styles.verificationSection}>
                            <div className={styles.verificationIcon}>
                                <Mail size={48} />
                            </div>
                            <p className={styles.verificationText}>
                                {needsVerification
                                    ? "Tu cuenta aún no ha sido verificada. Revisa tu correo."
                                    : `Hemos enviado un correo de confirmación a ${email}.`
                                }
                                <br />
                                <span>Verifica tu cuenta haciendo clic en el enlace que recibiste.</span>
                            </p>

                            <div className={styles.verificationActions}>
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
                                    className={`${styles.resendBtn} ${resendCooldown > 0 ? styles.disabled : ''}`}
                                    onClick={handleResendVerification}
                                    disabled={loading || resendCooldown > 0}
                                >
                                    {resendCooldown > 0
                                        ? `Reenviar en ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}`
                                        : <span><RefreshCw size={16} /> Reenviar correo</span>
                                    }
                                </button>
                            </div>

                            <button
                                type="button"
                                className={styles.switchBtn}
                                onClick={() => {
                                    setEmailSent(false);
                                    setNeedsVerification(false);
                                    setError(null);
                                }}
                            >
                                ← Volver al inicio
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
                                        <span>{isForgotPassword ? 'Correo Electrónico' : 'Correo o Usuario'}</span>
                                    </label>
                                    <input
                                        type={isForgotPassword ? "email" : "text"}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={isForgotPassword ? "tu@email.com" : "Email o @usuario"}
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                {!isForgotPassword && (
                                    <div className={styles.inputGroup}>
                                        <div className={styles.labelRow}>
                                            <label className={styles.label}>
                                                <Lock size={18} />
                                                <span>Contraseña</span>
                                            </label>
                                            {!isSignUp && (
                                                <button
                                                    type="button"
                                                    className={styles.forgotLink}
                                                    onClick={() => setIsForgotPassword(true)}
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </button>
                                            )}
                                        </div>
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
                                )}

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

                                {error && <div className={error.startsWith('✅') ? styles.success : styles.error}>{error}</div>}
                                {success && !error?.startsWith('✅') && <div className={styles.success}>✅ Redirigiendo...</div>}

                                <button type="submit" className={styles.submitBtn} disabled={loading} onClick={animateButton}>
                                    {loading ? <div className={styles.loader}></div> : <span>{isForgotPassword ? 'Enviar enlace' : isSignUp ? 'Registrarse' : 'Entrar Now'}</span>}
                                </button>

                                {isForgotPassword && (
                                    <button
                                        type="button"
                                        className={styles.switchBtn}
                                        onClick={() => {
                                            setIsForgotPassword(false);
                                            setError(null);
                                        }}
                                    >
                                        ← Volver al login
                                    </button>
                                )}
                            </form>

                            <div className={styles.divider}>
                                <span>o</span>
                            </div>

                            <div className={styles.socialLogins}>
                                <button type="button" className={`${styles.socialBtn} google-btn-anim`} onClick={handleGoogleLogin}>
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.socialIcon} />
                                    <span>Google</span>
                                </button>

                                <button type="button" className={`${styles.socialBtn} github-btn-anim`} onClick={handleGitHubLogin}>
                                    <Github size={20} className={styles.socialIcon} />
                                    <span>GitHub</span>
                                </button>
                            </div>

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
