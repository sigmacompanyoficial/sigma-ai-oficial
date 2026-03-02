'use client';
import Link from 'next/link';
import { Shield, ChevronLeft, Lock } from 'lucide-react';
import styles from '../legal.module.css';

export default function PrivacyPage() {
    const lastUpdated = '1 de marzo de 2026';
    const year = new Date().getFullYear();

    return (
        <div className={styles.legalContainer}>
            <div className={styles.legalContent}>
                <Link href="/about" className={styles.backBtn}>
                    <ChevronLeft size={20} />
                    <span>Volver a Sobre Nosotros</span>
                </Link>

                <header className={styles.legalHeader}>
                    <Shield size={46} color="#6366F1" />
                    <h1>Política de Privacidad</h1>
                    <p>Última actualización: {lastUpdated}</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><Lock size={20} /> 1. Nuestro compromiso con tu privacidad</h2>
                    <p>
                        En Sigma Company, la confianza y la transparencia son fundamentales. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información personal cuando utilizas Sigma LLM. Nuestro objetivo es ser claros y honestos sobre nuestras prácticas de datos.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. ¿Quién es el responsable de tus datos?</h2>
                    <p>
                        <strong>Sigma Company</strong> es el responsable del tratamiento de tus datos personales. Si tienes alguna pregunta sobre esta política o sobre cómo manejamos tus datos, puedes contactarnos en: <strong>sigmacompanyoficial@gmail.com</strong>.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. ¿Qué información recopilamos?</h2>
                    <p>Recopilamos la información estrictamente necesaria para ofrecer y mejorar nuestro servicio:</p>
                    <ul>
                        <li><strong>Datos de la cuenta:</strong> Cuando te registras, recopilamos tu dirección de correo electrónico y tu nombre de usuario para crear y gestionar tu cuenta.</li>
                        <li><strong>Contenido:</strong> Almacenamos los mensajes que envías y los archivos que subes (imágenes, documentos) para poder procesar tus solicitudes y mostrarte tu historial de conversaciones.</li>
                        <li><strong>Información de uso:</strong> Recopilamos datos sobre cómo utilizas la plataforma, como las funciones que usas y la frecuencia de uso. Esto nos ayuda a entender qué es lo más útil y a mejorar el servicio.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. ¿Cómo usamos tu información?</h2>
                    <p>Utilizamos tu información para los siguientes propósitos:</p>
                    <ul>
                        <li><strong>Para proporcionar el servicio:</strong> Usamos tus datos de cuenta y contenido para operar la plataforma, procesar tus peticiones a los modelos de IA y mostrarte tus conversaciones.</li>
                        <li><strong>Para mejorar la plataforma:</strong> Analizamos la información de uso para identificar tendencias, corregir errores y desarrollar nuevas funcionalidades.</li>
                        <li><strong>Por seguridad:</strong> Monitorizamos la actividad para prevenir abusos, proteger la integridad de nuestra plataforma y cumplir con nuestras obligaciones legales.</li>
                    </ul>
                    <p><strong>Importante:</strong> No utilizamos tus conversaciones privadas ni tus archivos para entrenar nuestros modelos de inteligencia artificial.</p>
                </section>
                
                <section className={styles.legalSection}>
                    <h2>5. ¿Con quién compartimos tu información?</h2>
                    <p>No vendemos tus datos personales. Solo compartimos información con proveedores de servicios de confianza que nos ayudan a operar la plataforma, siempre bajo estrictos acuerdos de confidencialidad:</p>
                    <ul>
                        <li><strong>Supabase:</strong> Para la autenticación de usuarios y el almacenamiento seguro en la base de datos.</li>
                        <li><strong>Vercel:</strong> Para alojar nuestra aplicación web y garantizar un rendimiento rápido y fiable.</li>
                        <li><strong>OpenRouter:</strong> Para procesar las peticiones a los diferentes modelos de lenguaje (LLM). Solo se comparte el contenido de la petición actual, sin datos personales que te identifiquen.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>6. Seguridad de tus datos</h2>
                    <p>
                        Nos tomamos la seguridad muy en serio. Implementamos medidas técnicas y organizativas para proteger tu información contra el acceso no autorizado, la alteración o la destrucción. Esto incluye el cifrado de datos en tránsito y en reposo.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>7. ¿Durante cuánto tiempo conservamos tus datos?</h2>
                    <p>
                        Conservamos tu información mientras tengas una cuenta activa en Sigma LLM. Si decides eliminar tu cuenta, tus datos personales serán eliminados de nuestros sistemas de producción de acuerdo con nuestros plazos de retención, que están diseñados para cumplir con nuestras obligaciones legales y técnicas.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>8. Tus derechos</h2>
                    <p>
                        Tienes derecho a acceder, rectificar o suprimir tus datos personales. También puedes oponerte al tratamiento de tus datos o solicitar la limitación del mismo. Para ejercer estos derechos, por favor, contáctanos en la dirección de correo electrónico proporcionada anteriormente.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>9. Cambios en esta política</h2>
                    <p>
                        Podemos actualizar esta Política de Privacidad periódicamente. Cuando lo hagamos, publicaremos la versión actualizada en esta página e indicaremos la fecha de la última revisión.
                    </p>
                </section>
                
                <section className={styles.legalSection}>
                    <h2>10. Copyright</h2>
                    <p>
                        © {year} Sigma Company. Todos los derechos reservados.
                    </p>
                </section>
            </div>
        </div>
    );
}
