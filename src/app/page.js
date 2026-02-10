import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={styles.bgGradient1}></div>
        <div className={styles.bgGradient2}></div>
        <div className={styles.bgGradient3}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.content}>
        {/* Animated Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logoGlow}></div>
          <div className={styles.logo}>🤖</div>
        </div>

        {/* Main Title with Gradient Animation */}
        <h1 className={styles.title}>
          <span className={styles.titleWord}>SIGMA</span>
          <span className={`${styles.titleWord} ${styles.titleWordAI}`}>AI</span>
        </h1>

        <p className={styles.subtitle}>
          La próxima generación de inteligencia artificial
        </p>

        <p className={styles.description}>
          Accede a los modelos de IA más avanzados del mundo en una sola plataforma.
          GPT-4, Claude, Gemini, DeepSeek y más, sin configuraciones complejas.
        </p>

        {/* Feature Cards */}
        <div className={styles.features}>
          <div className={`${styles.featureCard} ${styles.feature1}`}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>Ultra Rápido</h3>
            <p>Respuestas en tiempo real con streaming</p>
          </div>
          <div className={`${styles.featureCard} ${styles.feature2}`}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>Privacidad Total</h3>
            <p>Tus datos nunca se usan para entrenar</p>
          </div>
          <div className={`${styles.featureCard} ${styles.feature3}`}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>Interfaz Premium</h3>
            <p>Diseño moderno y personalizable</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className={styles.actions}>
          <Link href="/login" className={styles.btnPrimary}>
            <span>Empezar Ahora</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a href="https://github.com/sigma-ai" target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.165 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
            </svg>
            <span>Ver en GitHub</span>
          </a>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>10+</div>
            <div className={styles.statLabel}>Modelos de IA</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>100%</div>
            <div className={styles.statLabel}>Open Source</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>0ms</div>
            <div className={styles.statLabel}>Latencia (Streaming)</div>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} Sigma AI • Creado por <strong>Ayoub Louah</strong></p>
          <p className={styles.footerSubtext}>Powered by OpenRouter</p>
        </footer>
      </div>
    </main>
  );
}
