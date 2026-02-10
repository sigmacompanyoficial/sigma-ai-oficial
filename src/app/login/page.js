'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import styles from './page.module.css';
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

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

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) router.push('/chat');
        };
        checkUser();
    }, [router]);

    const checkUserStatus = async (user) => {
        if (!user) return;

        // Check if onboarding is completed
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
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name: name },
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                });
                if (error) throw error;
                setSuccess(true);
                // Onboarding check after signup (triggered by trigger in DB ideally, but here for safety)
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

    return (
        <div className={styles.container}>
            {/* Animated Background */}
            <div className={styles.background}>
                <div className={styles.bgOrb1}></div>
                <div className={styles.bgOrb2}></div>
                <div className={styles.bgOrb3}></div>
                <div className={styles.gridPattern}></div>
            </div>

            {/* Floating Particles */}
            <div className={styles.particles}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={styles.particle} style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${5 + Math.random() * 10}s`
                    }}></div>
                ))}
            </div>

            <div className={styles.content}>
                {/* Logo */}
                <div className={styles.logoSection}>
                    <div className={styles.logoIcon}>
                        <Sparkles size={40} />
                    </div>
                    <h1 className={styles.logoText}>Sigma AI</h1>
                    <p className={styles.logoSubtext}>Tu asistente de IA de nueva generación</p>
                </div>

                {/* Auth Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>{isSignUp ? '✨ Crear Cuenta' : '👋 Bienvenido de Vuelta'}</h2>
                        <p>{isSignUp ? 'Únete a la revolución de la IA' : 'Inicia sesión para continuar'}</p>
                    </div>

                    <form onSubmit={handleAuth} className={styles.form}>
                        {isSignUp && (
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    <User size={18} />
                                    <span>Nombre Completo</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ayoub Louah"
                                    className={styles.input}
                                    required={isSignUp}
                                />
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Mail size={18} />
                                <span>Email</span>
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
                                    <span>Confirmar Contraseña</span>
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

                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className={styles.success}>
                                ✅ {isSignUp ? '¡Cuenta creada! Redirigiendo...' : '¡Login exitoso! Redirigiendo...'}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className={styles.loader}></div>
                            ) : (
                                <span>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                            )}
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <span>o entra con</span>
                    </div>

                    <button
                        type="button"
                        className={styles.googleBtn}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className={styles.googleIcon} />
                        <span>Continuar con Google</span>
                    </button>

                    <button
                        type="button"
                        className={styles.switchBtn}
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setSuccess(false);
                        }}
                    >
                        {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                    </button>
                </div>

                <p className={styles.footer}>
                    Creado con 💜 por <strong>Ayoub Louah</strong> @ Sigma Company
                </p>
            </div>
        </div>
    );
}
