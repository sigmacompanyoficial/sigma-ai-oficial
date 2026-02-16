import './globals.css';
import './globals-theme.css';
import 'katex/dist/katex.min.css';
import Script from 'next/script';


export const metadata = {
  title: 'Sigma AI - El Asistente de Inteligencia Artificial de Sigma Company',
  description: 'Sigma AI: La plataforma definitiva de chat con Inteligencia Artificial. Accede a modelos avanzados, razonamiento lógico, búsqueda web en tiempo real y análisis de archivos. Desarrollado por Sigma Company.',
  keywords: ['Sigma AI', 'Sigma Company', 'Chatbot AI', 'Inteligencia Artificial gratis', 'DeepSeek', 'LLM', 'Productividad AI', 'IA Avanzada', 'Ayoub Louah', 'Chat GPT alternativas'],
  authors: [{ name: 'Ayoub Louah', url: 'https://sigma-ai-oficial.vercel.app/' }, { name: 'Sigma Company' }],
  creator: 'Sigma Company',
  publisher: 'Sigma Company',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo-fondo-negro.png',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sigma-ai-oficial.vercel.app/'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sigma AI | El Futuro de la Inteligencia Artificial',
    description: 'Experimenta la IA de próxima generación con Sigma AI. Productividad, razonamiento y búsqueda web en un solo lugar.',
    url: 'https://sigma-ai-oficial.vercel.app/',
    siteName: 'Sigma AI',
    images: [
      {
        url: '/logo-fondo-negro.png',
        width: 1200,
        height: 630,
        alt: 'Sigma AI - Inteligencia Artificial Avanzada',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sigma AI | Inteligencia Artificial de Sigma Company',
    description: 'El asistente de IA más potente y versátil. Razonamiento, código y búsqueda web.',
    images: ['/logo-fondo-negro.png'],
    creator: '@sigmaCompany',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'tu-codigo-de-verificacion-aqui',
  },
};

export const viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Sigma AI",
                "operatingSystem": "All",
                "applicationCategory": "ProductivityApplication",
                "description": "Sigma AI es la plataforma líder de chat con Inteligencia Artificial, ofreciendo modelos avanzados y razonamiento profundo.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "author": {
                  "@type": "Organization",
                  "name": "Sigma Company",
                  "url": "https://sigma-ai-oficial.vercel.app/"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Sigma AI",
                "url": "https://sigma-ai-oficial.vercel.app/",
                "inLanguage": "es"
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Sigma Company",
                "url": "https://sigma-ai-oficial.vercel.app/",
                "logo": "https://sigma-ai-oficial.vercel.app/logo-fondo-negro.png"
              }
            ])
          }}
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6B7BGYPL9C"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6B7BGYPL9C');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
