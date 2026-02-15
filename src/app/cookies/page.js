'use client';
import Link from 'next/link';
import { Cookie, ChevronLeft, Settings2 } from 'lucide-react';
import styles from '../legal.module.css';

export default function CookiesPage() {
    const lastUpdated = '15 de febrero de 2026';
    const year = new Date().getFullYear();

    return (
        <div className={styles.legalContainer}>
            <div className={styles.legalContent}>
                <Link href="/" className={styles.backBtn}>
                    <ChevronLeft size={20} />
                    <span>Volver</span>
                </Link>

                <header className={styles.legalHeader}>
                    <Cookie size={46} color="#6366F1" />
                    <h1>Política de Cookies</h1>
                    <p>Última actualización: {lastUpdated}</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><Settings2 size={20} /> 1. ¿Qué son las cookies?</h2>
                    <p>
                        Las cookies y tecnologías similares son archivos o identificadores que se almacenan en tu
                        dispositivo para reconocer tu navegador, recordar preferencias y medir el uso del servicio.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. Categorías de cookies utilizadas</h2>
                    <ul>
                        <li>Esenciales: habilitan autenticación, seguridad y funciones básicas de la plataforma.</li>
                        <li>Preferencias: guardan ajustes como idioma, interfaz y otras elecciones del usuario.</li>
                        <li>Analíticas: permiten medir rendimiento, tráfico y calidad del servicio de forma agregada.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. Base legal y consentimiento</h2>
                    <p>
                        Las cookies esenciales se utilizan por necesidad técnica para prestar el servicio. Las cookies
                        no esenciales se activan conforme al consentimiento del usuario, cuando la normativa aplicable lo exige.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. Duración</h2>
                    <p>
                        Algunas cookies son de sesión y se eliminan al cerrar el navegador; otras son persistentes
                        y permanecen durante un periodo definido o hasta que el usuario las elimine manualmente.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>5. Gestión y desactivación</h2>
                    <p>
                        Puedes gestionar preferencias desde el banner o centro de preferencias de cookies, así como
                        desde la configuración de tu navegador. Desactivar determinadas cookies puede afectar funciones
                        de personalización y continuidad de sesión.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>6. Proveedores de terceros</h2>
                    <p>
                        Algunos servicios de terceros pueden establecer identificadores propios para análisis o soporte
                        técnico del producto, bajo sus propias políticas de privacidad y tratamiento.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>7. Actualizaciones de esta política</h2>
                    <p>
                        Podemos modificar esta política para adaptarla a cambios legales, técnicos o de producto.
                        La versión vigente se publica siempre con su fecha de actualización.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>8. Contacto y copyright</h2>
                    <p>
                        Para dudas sobre cookies o privacidad: sigmacompanyoficial@gmail.com.
                    </p>
                    <p>
                        © {year} Sigma Company. Todos los derechos reservados. El contenido, diseño y marcas de Sigma AI
                        están protegidos por copyright y legislación de propiedad intelectual.
                    </p>
                </section>
            </div>
        </div>
    );
}
