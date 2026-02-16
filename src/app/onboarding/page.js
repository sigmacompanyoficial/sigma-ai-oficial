'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import styles from './page.module.css';
import { Sparkles, Send, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [howKnown, setHowKnown] = useState('');
    const [usageIntent, setUsageIntent] = useState('');
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [isUsernameRequiredOnly, setIsUsernameRequiredOnly] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

    const normalizeUsername = (value) =>
        (value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9_]/g, '');

    const validateUsername = (value) => {
        const v = normalizeUsername(value);
        if (!v) return 'Por favor elige un nombre de usuario.';
        if (!USERNAME_REGEX.test(v)) {
            return 'Usa 3-20 caracteres: letras minúsculas, números o _.';
        }
        return '';
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
                // Check if already completed
                const { data } = await supabase
                    .from('profiles')
                    .select('onboarding_completed, username')
                    .eq('id', user.id)
                    .single();

                const hasUsername = !!data?.username?.trim();
                if (data?.onboarding_completed && hasUsername) {
                    router.push('/chat');
                    return;
                }
                if (data?.onboarding_completed && !hasUsername) {
                    setIsUsernameRequiredOnly(true);
                    setStep(1);
                }
            }
        };
        checkUser();
    }, [router]);

    const handleComplete = async () => {
        if (!user) return;
        const normalizedUsername = normalizeUsername(username);
        const usernameValidationError = validateUsername(normalizedUsername);
        if (usernameValidationError) {
            setStep(1);
            setUsernameError(usernameValidationError);
            return;
        }

        // Check if username already exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', normalizedUsername)
            .maybeSingle();

        if (existingUser && existingUser.id !== user.id) {
            setStep(1);
            setUsernameError('Este nombre de usuario ya está en uso.');
            return;
        }

        console.log('🏁 Completing onboarding for user:', user.email);
        setLoading(true);
        try {
            console.log('📝 Saving profile data:', { howKnown, usageIntent, username: normalizedUsername });
            const payload = isUsernameRequiredOnly
                ? {
                    id: user.id,
                    username: normalizedUsername,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                }
                : {
                    id: user.id,
                    username: normalizedUsername,
                    how_known: howKnown,
                    usage_intent: usageIntent,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                };

            const { error } = await supabase
                .from('profiles')
                .upsert(payload);

            if (error) throw error;
            console.log('✅ Onboarding completed successfully.');
            router.push('/chat');
        } catch (error) {
            console.error('❌ Error in handleComplete:', error);
            alert('Hubo un error al guardar tu perfil. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.orb1}></div>
                <div className={styles.orb2}></div>
            </div>

            <div className={styles.content}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.logoIcon}>
                            <Sparkles size={32} />
                        </div>
                        <h1>¡Casi listo!</h1>
                        <p>Ayúdanos a personalizar tu experiencia en Sigma LLM</p>
                    </div>

                    {!isUsernameRequiredOnly && (
                        <div className={styles.steps}>
                            <div className={`${styles.stepIndicator} ${step >= 1 ? styles.active : ''}`}></div>
                            <div className={`${styles.stepIndicator} ${step >= 2 ? styles.active : ''}`}></div>
                            <div className={`${styles.stepIndicator} ${step >= 3 ? styles.active : ''}`}></div>
                        </div>
                    )}

                    {step === 1 || isUsernameRequiredOnly ? (
                        <div className={styles.stepContent}>
                            <h2>Elige tu nombre de usuario</h2>
                            <p className={styles.stepDescription}>
                                {isUsernameRequiredOnly
                                    ? 'Para continuar, necesitas definir un nombre de usuario único.'
                                    : 'Con este nombre podrás iniciar sesión en lugar de tu correo.'}
                            </p>
                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(normalizeUsername(e.target.value));
                                        setUsernameError('');
                                    }}
                                    placeholder="@usuario"
                                    className={`${styles.input} ${usernameError ? styles.inputError : ''}`}
                                />
                                {usernameError && <p className={styles.errorText}>{usernameError}</p>}
                            </div>
                            <button
                                className={styles.nextBtn}
                                disabled={!username || loading}
                                onClick={() => {
                                    const err = validateUsername(username);
                                    if (err) {
                                        setUsernameError(err);
                                        return;
                                    }
                                    if (isUsernameRequiredOnly) {
                                        handleComplete();
                                        return;
                                    }
                                    setStep(2);
                                }}
                            >
                                {isUsernameRequiredOnly ? (loading ? 'Guardando...' : 'Guardar usuario') : 'Siguiente'} <Send size={18} />
                            </button>
                        </div>
                    ) : step === 2 ? (
                        <div className={styles.stepContent}>
                            <h2>¿De dónde nos has conocido?</h2>
                            <div className={styles.options}>
                                {['TikTok / Reels', 'LinkedIn', 'YouTube', 'Búsqueda en Google', 'Un amigo', 'Otro'].map((opt) => (
                                    <button
                                        key={opt}
                                        className={`${styles.optionBtn} ${howKnown === opt ? styles.selected : ''}`}
                                        onClick={() => setHowKnown(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(1)}>Atrás</button>
                                <button
                                    className={styles.nextBtn}
                                    disabled={!howKnown}
                                    onClick={() => setStep(3)}
                                >
                                    Siguiente <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.stepContent}>
                            <h2>¿Para qué vas a usar Sigma LLM?</h2>
                            <div className={styles.options}>
                                {['Estudios / Universidad', 'Trabajo / Productividad', 'Creatividad / Arte', 'Programación', 'Solo por curiosidad'].map((opt) => (
                                    <button
                                        key={opt}
                                        className={`${styles.optionBtn} ${usageIntent === opt ? styles.selected : ''}`}
                                        onClick={() => setUsageIntent(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(2)}>Atrás</button>
                                <button
                                    className={styles.finishBtn}
                                    disabled={!usageIntent || loading}
                                    onClick={handleComplete}
                                >
                                    {loading ? 'Guardando...' : 'Empezar ahora'} <CheckCircle2 size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
