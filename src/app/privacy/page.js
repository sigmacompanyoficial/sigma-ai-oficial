'use client';
import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';
import styles from '../legal.module.css';

export default function PrivacyPage() {
    return (
        <div className={styles.legalContainer}>
            <div className={styles.legalContent}>
                <Link href="/" className={styles.backBtn}>
                    <ChevronLeft size={18} /> Volver
                </Link>

                <header className={styles.legalHeader}>
                    <h1>Política de Privacidad</h1>
                    <p>Última actualización: 14 de febrero de 2026</p>
                </header>

                <section className={styles.legalSection}>
                    <h2><Lock size={20} /> 1. Recopilación de Datos</h2>
                    <p>
                        En Sigma AI, nos tomamos muy en serio tu privacidad. Recopilamos la información mínima necesaria para el funcionamiento del servicio:
                    </p>
                    <ul>
                        <li><b>Información de Cuenta:</b> Nombre y correo electrónico (proporcionado por Supabase Auth).</li>
                        <li><b>Mensajes:</b> Almacenamos tus chats para que puedas acceder a ellos en el futuro.</li>
                        <li><b>Imágenes y Archivos:</b> Se procesan temporalmente para su análisis por la IA.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>2. Uso de la Información</h2>
                    <p>
                        Tu información se utiliza exclusivamente para:
                    </p>
                    <ul>
                        <li>Proporcionar y mejorar la experiencia de chat.</li>
                        <li>Personalizar las respuestas de la IA según tus preferencias.</li>
                        <li>Mantener la seguridad y sincronización de tu cuenta.</li>
                    </ul>
                </section>

                <section className={styles.legalSection}>
                    <h2>3. Compartición de Datos</h2>
                    <p>
                        <b>No vendemos tus datos a terceros.</b> Tus mensajes son enviados de forma anónima a los proveedores de modelos de IA (OpenRouter, Google, etc.) para generar respuestas. No compartimos tu identidad con estos proveedores.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>4. Seguridad</h2>
                    <p>
                        Utilizamos <b>Supabase</b> para garantizar que tus datos estén cifrados y almacenados de forma segura. Eres responsable de mantener la confidencialidad de tu sesión.
                    </p>
                </section>

                <section className={styles.legalSection}>
                    <h2>5. Tus Derechos</h2>
                    <p>
                        Puedes solicitar la eliminación de tu cuenta y todos tus datos asociados en cualquier momento a través de la configuración de perfil o contactando con el soporte de Sigma Company.
                    </p>
                </section>
            </div>
        </div>
    );
}
