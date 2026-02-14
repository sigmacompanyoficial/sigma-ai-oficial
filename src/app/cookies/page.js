'use client';
import Link from 'next/link';
import { ChevronLeft, Cookie } from 'lucide-react';
import styles from '../legal.module.css';

export default function CookiesPage() {
    return (
        <div className={styles.legalContainer}>
            <div className={styles.legalContent}>
                <Link href="/" className={styles.backBtn}>
                    <ChevronLeft size={18} /> Volver
                </Link>

                <header className={styles.legalHeader}>
                    <h1>Configuración de Cookies</h1>
                    <p>Última actualización: 14 de febrero de 2026</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><Cookie size={20} /> 1. ¿Qué son las cookies?</h2>
                    <p>
                        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo al visitar un sitio web. Ayudan a que la plataforma funcione correctamente y mejoren tu experiencia.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. Cookies que utilizamos</h2>
                    <p>
                        Sigma AI utiliza principalmente <b>Cookies Esenciales</b>:
                    </p>
                    <ul>
                        <li><b>Autenticación:</b> Mantienen tu sesión iniciada a través de Supabase.</li>
                        <li><b>Preferencias:</b> Guardamos configuraciones locales como el tema (oscuro/claro) y el idioma.</li>
                        <li><b>Seguridad:</b> Ayudan a prevenir fraudes y proteger tus datos.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. Cookies de Terceros</h2>
                    <p>
                        No permitimos cookies publicitarias de terceros. Sin embargo, algunos servicios como Google (si usas Google Login) pueden gestionar sus propias cookies de identificación.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. Control de Cookies</h2>
                    <p>
                        Puedes desactivar las cookies en la configuración de tu navegador. Ten en cuenta que, si lo haces, es posible que no puedas iniciar sesión o que algunas funciones de Sigma AI no operen correctamente.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>5. Consentimiento</h2>
                    <p>
                        Al utilizar Sigma AI, aceptas el uso de las cookies esenciales mencionadas en esta política. No utilizamos cookies de rastreo intrusivas.
                    </p>
                </section>
            </div>
        </div>
    );
}
