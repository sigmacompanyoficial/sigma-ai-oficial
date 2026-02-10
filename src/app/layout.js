
import './globals.css';

export const metadata = {
  title: 'Sigma AI - Advanced AI Chatbot',
  description: 'Experience the next generation of AI with Sigma AI. Chat with various open-source and proprietary models like DeepSeek, Mistral, and more.',
  keywords: ['AI', 'Chatbot', 'OpenSource', 'LLM', 'Sigma AI'],
  authors: [{ name: 'Sigma AI Team' }],
};

export const viewport = {
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
