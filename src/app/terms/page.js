'use client';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import styles from '../legal.module.css'; // I will create legal.module.css instead of global legal.css to follow project patterns

export default function TermsPage() {
    return (
        <div className={styles.legalContainer}>
            <div className={styles.legalContent}>
                <Link href="/" className={styles.backBtn}>
                    <ChevronLeft size={18} /> Volver
                </Link>

                <header className={styles.legalHeader}>
                    <h1>Términos y Condiciones</h1>
                    <p>Última actualización: 14 de febrero de 2026</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><ShieldCheck size={20} /> 1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar Sigma AI, aceptas cumplir con estos términos y condiciones. Sigma AI es una plataforma de inteligencia artificial desarrollada por <b>Sigma Company</b>, bajo la autoría de <b>Ayoub Louah</b>.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. Uso del Servicio</h2>
                    <p>
                        Sigma AI proporciona acceso a diversos modelos de lenguaje. El usuario se compromete a:
                    </p>
                    <ul>
                        <li>No utilizar el servicio para actividades ilegales o dañinas.</li>
                        <li>No intentar vulnerar la seguridad de la plataforma.</li>
                        <li>No utilizar el servicio para generar contenido de odio, violento o sexualmente explícito.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. Propiedad Intelectual</h2>
                    <p>
                        Todo el software, diseño y logotipos de Sigma AI son propiedad de Sigma Company. Los modelos de IA utilizados son proporcionados a través de proveedores externos (OpenRouter, OpenAI, Google, etc.), y sus derechos pertenecen a sus respectivos creadores.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. Limitación de Responsabilidad</h2>
                    <p>
                        Sigma AI se proporciona "tal cual". No garantizamos que las respuestas de la IA sean siempre precisas o veraces. El usuario es responsable de verificar la información generada.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>5. Modificaciones</h2>
                    <p>
                        Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado del servicio implica la aceptación de los nuevos términos.
                    </p>
                </section>
            </div>
        </div>
    );
}
