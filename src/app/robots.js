export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/onboarding/'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/admin/', '/onboarding/'],
            },
        ],
        host: 'https://sigma-ai-oficial.vercel.app',
        sitemap: 'https://sigma-ai-oficial.vercel.app/sitemap.xml',
    }
}
