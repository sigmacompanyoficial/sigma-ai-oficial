'use client';
import Link from 'next/link';
import { Shield, ChevronLeft } from 'lucide-react';
import styles from '../landing.module.css';

export default function PrivacyPage() {
    return (
        <div className={styles.page}>
            <nav className={styles.nav}>
                <Link href="/" className={styles.logoContainer}>
                    <ChevronLeft size={20} />
                    <span className={styles.brand}>Volver</span>
                </Link>
            </nav>

            <header className={styles.hero} style={{ padding: '140px 5% 40px' }}>
                <Shield size={60} color="#6366F1" style={{ marginBottom: '1.5rem' }} />
                <h1 className={styles.title} style={{ fontSize: '3rem' }}>Privacidad</h1>
                <p className={styles.subtitle}>Tu seguridad es nuestra prioridad en Sigma Company.</p>
            </header>

            <section className={styles.section} style={{ maxWidth: '800px', margin: '0 auto', color: '#E2E2E2', lineHeight: '1.8' }}>
                <h2>1. Recopilación de Datos</h2>
                <p>Sigma AI recopila información básica necesaria para el funcionamiento del servicio, como tu nombre de usuario y correo electrónico (esto último solo si te registras).</p>

                <h2>2. Uso de la Información</h2>
                <p>Utilizamos tus interacciones para mejorar la calidad de las respuestas y personalizar tu experiencia. No compartimos tus chats con terceros para fines publicitarios.</p>

                <h2>3. Almacenamiento Seguro</h2>
                <p>Todos los datos se almacenan en servidores seguros operados por Supabase con cifrado de grado industrial.</p>

                <h2>4. Derechos del Usuario</h2>
                <p>Puedes solicitar la eliminación de tu cuenta y todos tus datos asociados en cualquier momento contactando con el soporte de Sigma Company.</p>
            </section>

            <footer className={styles.bottomBar}>
                © {new Date().getFullYear()} Sigma Company.
            </footer>
        </div>
    );
}
