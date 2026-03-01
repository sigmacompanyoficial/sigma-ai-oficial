// @ts-nocheck
'use client';
import Link from 'next/link';
import { FileText, ChevronLeft, Scale } from 'lucide-react';
import styles from '../legal.module.css';

export default function TermsPage() {
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
                    <FileText size={46} color="#6366F1" />
                    <h1>Términos y Condiciones</h1>
                    <p>Última actualización: {lastUpdated}</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><Scale size={20} /> 1. Alcance del servicio</h2>
                    <p>
                        Estos términos regulan el acceso y uso de Sigma LLM, plataforma operada por Sigma Company.
                        Al utilizar el servicio aceptas íntegramente estas condiciones.
                    </p>
                    <p>
                        Si no estás de acuerdo con cualquier disposición, debes abstenerte de utilizar la plataforma.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. Elegibilidad y cuentas</h2>
                    <p>
                        El usuario es responsable de la veracidad de la información proporcionada en su cuenta,
                        la custodia de sus credenciales y toda actividad realizada desde su perfil.
                    </p>
                    <ul>
                        <li>No se permite suplantar identidad o crear cuentas con datos falsos.</li>
                        <li>No se permite compartir credenciales de acceso con terceros no autorizados.</li>
                        <li>Podemos suspender cuentas ante uso fraudulento o incumplimiento de estos términos.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. Uso permitido y restricciones</h2>
                    <p>
                        El servicio debe utilizarse conforme a la legislación aplicable y a estándares de buena fe.
                        Queda prohibido usar Sigma LLM para actividades ilícitas, abusivas o que vulneren derechos de terceros.
                    </p>
                    <ul>
                        <li>Generación o distribución de malware, phishing o contenido dañino.</li>
                        <li>Intentos de acceso no autorizado, extracción masiva o ingeniería inversa del servicio.</li>
                        <li>Uso de la plataforma para infringir propiedad intelectual o normativa de privacidad.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. Contenido y resultados de IA</h2>
                    <p>
                        Sigma LLM puede generar resultados inexactos, incompletos o desactualizados. Las respuestas
                        tienen carácter informativo y no constituyen asesoría profesional.
                    </p>
                    <p>
                        El usuario mantiene la responsabilidad final de revisar, validar y decidir sobre el uso de
                        cualquier contenido generado por la plataforma.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>5. Propiedad intelectual</h2>
                    <p>
                        Sigma LLM, su diseño, marca, código, documentación, interfaces y elementos distintivos son
                        propiedad de Sigma Company o de sus licenciantes y están protegidos por la normativa aplicable.
                    </p>
                    <p>
                        El uso del servicio no implica cesión de derechos de propiedad intelectual sobre la plataforma.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>6. Disponibilidad, cambios y terminación</h2>
                    <p>
                        Podemos modificar, suspender o discontinuar funcionalidades por motivos técnicos, de seguridad
                        o regulatorios. También podemos actualizar estos términos para reflejar cambios operativos.
                    </p>
                    <p>
                        Cuando el cambio sea material, se publicará una versión actualizada con nueva fecha de vigencia.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>7. Limitación de responsabilidad</h2>
                    <p>
                        En la máxima medida permitida por ley, Sigma Company no será responsable por daños indirectos,
                        lucro cesante, pérdida de datos o interrupciones derivadas del uso o imposibilidad de uso de Sigma LLM.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>8. Contacto legal</h2>
                    <p>
                        Para consultas sobre términos, cumplimiento o reclamaciones, puedes contactar a:
                        sigmacompanyoficial@gmail.com
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>9. Copyright</h2>
                    <p>
                        © {year} Sigma Company. Todos los derechos reservados. Sigma LLM y sus elementos de marca están
                        protegidos por leyes de copyright y propiedad intelectual. Queda prohibida su reproducción total
                        o parcial sin autorización previa y por escrito.
                    </p>
                </section>
            </div>
        </div>
    );
}
