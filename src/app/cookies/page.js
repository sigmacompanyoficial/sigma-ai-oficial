'use client';
import Link from 'next/link';
import { Cookie, ChevronLeft, Settings2 } from 'lucide-react';
import styles from '../legal.module.css';

export default function CookiesPage() {
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
                    <Cookie size={46} color="#6366F1" />
                    <h1>Política de Cookies</h1>
                    <p>Última actualización: {lastUpdated}</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><Settings2 size={20} /> 1. ¿Qué son las cookies?</h2>
                    <p>
                        Las cookies y tecnologías similares son pequeños archivos de texto que se almacenan en tu
                        dispositivo (ordenador, tableta, smartphone) cuando visitas nuestro sitio web. Nos permiten reconocer tu navegador,
                        recordar tus preferencias y entender cómo utilizas nuestro servicio.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. ¿Qué cookies utilizamos?</h2>
                    <p>En Sigma LLM, utilizamos las siguientes categorías de cookies:</p>
                    <ul>
                        <li><strong>Cookies Esenciales:</strong> Estas cookies son estrictamente necesarias para que la plataforma funcione. Permiten funciones como la autenticación de usuarios (mantener tu sesión iniciada), la gestión de la seguridad y el acceso a las funcionalidades principales. Sin ellas, el servicio no podría operar correctamente.</li>
                        <li><strong>Cookies de Preferencias:</strong> Estas cookies nos permiten recordar las elecciones que has hecho en el pasado, como tu idioma de preferencia, el tema de la interfaz (claro/oscuro) y otras configuraciones de personalización. Su objetivo es proporcionarte una experiencia más personal y fluida.</li>
                        <li><strong>Cookies de Rendimiento y Analíticas:</strong> Nos ayudan a entender cómo interactúan los visitantes con Sigma LLM. Recopilamos información de forma anónima y agregada sobre el número de usuarios, las páginas que visitan y el tiempo que pasan en la plataforma. Esto nos permite medir y mejorar el rendimiento de nuestro servicio.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. Cookies de Terceros</h2>
                    <p>
                        Utilizamos servicios de terceros de confianza que también pueden establecer cookies en tu dispositivo. Estos proveedores nos ayudan con funciones clave de nuestra plataforma:
                    </p>
                    <ul>
                        <li><strong>Supabase:</strong> Lo utilizamos para la autenticación y gestión de la base de datos. Supabase utiliza cookies para gestionar las sesiones de los usuarios de forma segura.</li>
                        <li><strong>Vercel:</strong> Nuestra plataforma está alojada en Vercel, que puede utilizar cookies para optimizar el rendimiento y la entrega de contenido.</li>
                    </ul>
                    <p>Estos proveedores tienen sus propias políticas de privacidad y de cookies. Te recomendamos revisarlas para obtener más información.</p>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. ¿Cómo puedes gestionar las cookies?</h2>
                    <p>
                        Puedes gestionar tus preferencias de cookies en cualquier momento. La mayoría de los navegadores te permiten bloquear o eliminar cookies a través de su configuración. Sin embargo, ten en cuenta que si bloqueas las cookies esenciales, es posible que algunas partes de Sigma LLM no funcionen correctamente.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>5. Cambios en la Política de Cookies</h2>
                    <p>
                        Podemos actualizar esta Política de Cookies de vez en cuando para reflejar, por ejemplo, cambios en las cookies que utilizamos o por otras razones operativas, legales o reglamentarias. Te recomendamos que visites esta página periódicamente para mantenerte informado.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>6. Contacto</h2>
                    <p>
                        Si tienes alguna pregunta sobre nuestro uso de cookies, puedes contactarnos en: sigmacompanyoficial@gmail.com
                    </p>
                    <p>
                        © {year} Sigma Company. Todos los derechos reservados.
                    </p>
                </section>
            </div>
        </div>
    );
}
