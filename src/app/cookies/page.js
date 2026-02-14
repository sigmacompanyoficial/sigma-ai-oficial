'use client';
import Link from 'next/link';
import { Cookie, ChevronLeft } from 'lucide-react';
import styles from '../landing.module.css';

export default function CookiesPage() {
    return (
        <div className={styles.page}>
            <nav className={styles.nav}>
                <Link href="/" className={styles.logoContainer}>
                    <ChevronLeft size={20} />
                    <span className={styles.brand}>Volver</span>
                </Link>
            </nav>

            <header className={styles.hero} style={{ padding: '140px 5% 40px' }}>
                <Cookie size={60} color="#6366F1" style={{ marginBottom: '1.5rem' }} />
                <h1 className={styles.title} style={{ fontSize: '3rem' }}>Política de Cookies</h1>
                <p className={styles.subtitle}>Cómo utilizamos las cookies para mejorar Sigma AI.</p>
            </header>

            <section className={styles.section} style={{ maxWidth: '800px', margin: '0 auto', color: '#E2E2E2', lineHeight: '1.8' }}>
                <h2>1. ¿Qué son las cookies?</h2>
                <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo. Nos ayudan a recordar tus preferencias y sesiones de usuario.</p>

                <h2>2. Cookies que utilizamos</h2>
                <p><b>Esenciales:</b> Necesarias para que puedas iniciar sesión y mantener tu sesión segura.</p>
                <p><b>Analíticas:</b> Utilizamos Google Analytics para entender cuánta gente usa Sigma AI y qué funciones son las más populares.</p>

                <h2>3. Control de Cookies</h2>
                <p>Puedes desactivar las cookies analíticas desde la configuración de tu navegador, aunque esto puede afectar a algunas funciones de personalización.</p>
            </section>

            <footer className={styles.bottomBar}>
                © {new Date().getFullYear()} Sigma Company.
            </footer>
        </div>
    );
}
