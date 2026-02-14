'use client';
import Link from 'next/link';
import { FileText, ChevronLeft } from 'lucide-react';
import styles from '../landing.module.css';

export default function TermsPage() {
    return (
        <div className={styles.page}>
            <nav className={styles.nav}>
                <Link href="/" className={styles.logoContainer}>
                    <ChevronLeft size={20} />
                    <span className={styles.brand}>Volver</span>
                </Link>
            </nav>

            <header className={styles.hero} style={{ padding: '140px 5% 40px' }}>
                <FileText size={60} color="#6366F1" style={{ marginBottom: '1.5rem' }} />
                <h1 className={styles.title} style={{ fontSize: '3rem' }}>Términos y Condiciones</h1>
                <p className={styles.subtitle}>Normas de uso de la plataforma Sigma AI.</p>
            </header>

            <section className={styles.section} style={{ maxWidth: '800px', margin: '0 auto', color: '#E2E2E2', lineHeight: '1.8' }}>
                <h2>1. Uso Aceptable</h2>
                <p>El usuario se compromete a no utilizar Sigma AI para actividades ilegales, generación de malware o contenido dañino.</p>

                <h2>2. Propiedad Intelectual</h2>
                <p>Sigma AI es propiedad de Sigma Company. Los contenidos generados pertenecen al usuario, pero la infraestructura y los modelos están protegidos por derechos de autor.</p>

                <h2>3. Limitación de Responsabilidad</h2>
                <p>Sigma AI es un asistente de inteligencia artificial y sus respuestas pueden contener errores. Sigma Company no se hace responsable de las decisiones tomadas basándose en sus salidas.</p>

                <h2>4. Modificaciones</h2>
                <p>Nos reservamos el derecho de modificar estos términos en cualquier momento para adaptarlos a nuevas funcionalidades.</p>
            </section>

            <footer className={styles.bottomBar}>
                © {new Date().getFullYear()} Sigma Company.
            </footer>
        </div>
    );
}
