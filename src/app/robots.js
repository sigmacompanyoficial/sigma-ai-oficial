export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/', '/onboarding/'],
        },
        sitemap: 'https://sigma-ai-oficial.vercel.app/sitemap.xml',
    }
}
