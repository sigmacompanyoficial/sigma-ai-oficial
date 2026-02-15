'use client';
import Link from 'next/link';
import { Shield, ChevronLeft, Lock } from 'lucide-react';
import styles from '../legal.module.css';

export default function PrivacyPage() {
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
                    <Shield size={46} color="#6366F1" />
                    <h1>Política de Privacidad</h1>
                    <p>Última actualización: {lastUpdated}</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><Lock size={20} /> 1. Responsable del tratamiento</h2>
                    <p>
                        Sigma Company es responsable del tratamiento de los datos personales obtenidos a través de Sigma AI.
                        Para asuntos de privacidad puedes escribir a sigmacompanyoficial@gmail.com.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. Datos que recopilamos</h2>
                    <ul>
                        <li>Datos de cuenta: email, nombre de usuario e identificadores técnicos.</li>
                        <li>Datos de uso: interacción con funciones, eventos de sesión y métricas operativas.</li>
                        <li>Datos de contenido: mensajes y archivos enviados para procesar tus solicitudes.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. Finalidades y base legal</h2>
                    <p>Tratamos datos para prestar el servicio, asegurar la plataforma y mejorar su rendimiento.</p>
                    <ul>
                        <li>Ejecución del contrato de servicio con el usuario.</li>
                        <li>Interés legítimo en seguridad, prevención de abuso y continuidad operativa.</li>
                        <li>Consentimiento cuando sea exigible (por ejemplo, cookies no esenciales).</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. Conservación de datos</h2>
                    <p>
                        Conservamos la información durante el tiempo necesario para cumplir las finalidades indicadas,
                        obligaciones legales y resolución de disputas. Al cerrar la cuenta, aplicamos periodos de retención
                        mínimos y eliminación progresiva según requisitos técnicos y legales.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>5. Compartición con terceros</h2>
                    <p>
                        Podemos apoyarnos en proveedores tecnológicos para autenticación, infraestructura, almacenamiento
                        y análisis operativo bajo acuerdos de confidencialidad y tratamiento de datos.
                    </p>
                    <p>
                        No vendemos datos personales a terceros para publicidad comportamental.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>6. Seguridad</h2>
                    <p>
                        Aplicamos medidas técnicas y organizativas razonables para proteger la información frente a acceso
                        no autorizado, alteración, pérdida o destrucción, incluyendo controles de acceso y cifrado en tránsito
                        cuando corresponde.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>7. Derechos del usuario</h2>
                    <p>
                        Puedes solicitar acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad,
                        cuando aplique conforme a la normativa de tu jurisdicción. Atendemos solicitudes en plazos razonables.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>8. Menores de edad</h2>
                    <p>
                        Sigma AI no está dirigido a menores sin supervisión legal suficiente. Si detectamos tratamiento de datos
                        de menores sin base válida, adoptaremos medidas para su eliminación.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>9. Cambios en esta política</h2>
                    <p>
                        Podemos actualizar esta política para reflejar cambios legales, técnicos u operativos. Publicaremos
                        la fecha de actualización y, cuando proceda, avisos adicionales dentro del producto.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>10. Copyright</h2>
                    <p>
                        © {year} Sigma Company. Todos los derechos reservados. Los materiales, textos, interfaces y activos
                        de Sigma AI están protegidos por copyright y propiedad intelectual.
                    </p>
                </section>
            </div>
        </div>
    );
}
