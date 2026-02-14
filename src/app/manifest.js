export default function manifest() {
    return {
        name: 'Sigma AI',
        short_name: 'Sigma AI',
        description: 'La plataforma de Inteligencia Artificial de Sigma Company',
        start_url: '/',
        display: 'standalone',
        background_color: '#0F0F0F',
        theme_color: '#6366F1',
        icons: [
            {
                src: '/logo_fondo_negro-removebg-preview.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
