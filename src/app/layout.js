
import './globals.css';
import 'katex/dist/katex.min.css';


export const metadata = {
  title: 'Sigma AI | El Futuro de la Inteligencia Artificial',
  description: 'Descubre Sigma AI, la plataforma de chat avanzada con modelos de última generación. Optimizado para productividad, búsqueda web y razonamiento profundo.',
  keywords: ['Sigma AI', 'Chatbot AI', 'Inteligencia Artificial', 'DeepSeek', 'LLM', 'Productividad AI', 'IA Avanzada'],
  authors: [{ name: 'Sigma AI Team', url: 'https://sigma-ai.com' }],
  creator: 'Sigma AI',
  publisher: 'Sigma AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sigma-ai.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sigma AI | El Futuro de la Inteligencia Artificial',
    description: 'La plataforma de IA más avanzada para profesionales y entusiastas.',
    url: 'https://sigma-ai.com',
    siteName: 'Sigma AI',
    images: [
      {
        url: '/logo_fondo_negro-removebg-preview.png',
        width: 800,
        height: 600,
        alt: 'Sigma AI Logo',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sigma AI | El Futuro de la Inteligencia Artificial',
    description: 'Chat inteligente con modelos de vanguardia.',
    images: ['/logo_fondo_negro-removebg-preview.png'],
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
      </head>
      <body>{children}</body>
    </html>
  );
}
