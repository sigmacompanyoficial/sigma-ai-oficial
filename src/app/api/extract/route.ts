import { NextResponse } from 'next/server';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { urls, isGuest } = body;
        console.log('🔗 [EXTRACT] Incoming request:', { urls, isGuest });

        if (!urls || (Array.isArray(urls) && urls.length === 0) || (!Array.isArray(urls) && typeof urls !== 'string')) {
            console.warn('⚠️ [EXTRACT] Invalid or empty URLs');
            return jsonError('Valid URL(s) required', 400);
        }

        let apiKey = '';
        try {
            const guestKey = getOptionalEnv('GUEST_TAVILY_API_KEY', '');
            const standardKey = getOptionalEnv('TAVILY_API_KEY', '');
            apiKey = isGuest ? (guestKey || standardKey) : (standardKey || guestKey);
            if (!apiKey) {
                getRequiredEnv(isGuest ? 'GUEST_TAVILY_API_KEY' : 'TAVILY_API_KEY');
            }
            console.log(`🔑 [EXTRACT] Using Tavily key (${apiKey.substring(0, 8)}...)`);
        } catch {
            console.error('❌ [EXTRACT] Tavily API key is missing');
            return jsonError('Extract API key not configured', 500);
        }

        console.log('📡 [EXTRACT] Calling Tavily Extract API...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for extraction

        const urlsArray = Array.isArray(urls) ? urls : [urls];

        let response = await fetch('https://api.tavily.com/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                urls: urlsArray,
                include_images: false,
                extract_depth: "basic"
            }),
            signal: controller.signal
        });

        console.log('📡 [EXTRACT] Tavily request payload (header-auth):', {
            urls: urlsArray,
            include_images: false,
            extract_depth: 'basic'
        });

        // Compatibility fallback for deployments expecting api_key in JSON body
        if (!response.ok && (response.status === 401 || response.status === 403)) {
            console.warn('⚠️ [EXTRACT] Header auth failed, retrying with body api_key fallback...');
            response = await fetch('https://api.tavily.com/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    urls: urlsArray,
                    include_images: false,
                    extract_depth: "basic"
                }),
                signal: controller.signal
            });
            console.log('📡 [EXTRACT] Tavily request payload (body api_key fallback)');
        }

        clearTimeout(timeoutId);
        const data = await response.json();
        console.log('📥 [EXTRACT] Tavily Response Status:', response.status);
        console.log('📥 [EXTRACT] Tavily raw response data:', data);

        if (!response.ok) {
            console.error('❌ [EXTRACT] Tavily API Error:', data);
            return jsonError('Error calling extract service', response.status);
        }

        let finalResult = '';

        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            finalResult = data.results.map(r => {
                let content = `URL: ${r.url}\n`;
                if (r.title) content += `Título: ${r.title}\n`;
                if (r.raw_content) content += `\nContenido:\n${r.raw_content}`;
                return content;
            }).join('\n\n---\n\n');
            console.log(`✅ [EXTRACT] Extracted content from ${data.results.length} URL(s).`);
        }

        if (!finalResult) {
            console.warn('⚠️ [EXTRACT] No content extracted from URLs');
            return NextResponse.json({
                success: false,
                result: 'No se pudo extraer contenido de las URLs proporcionadas.'
            });
        }

        return NextResponse.json({
            success: true,
            result: finalResult,
            source: 'Tavily Extract',
            urlCount: data.results?.length || 0
        });

    } catch (error) {
        if (error?.name === 'AbortError') {
            console.error('⏱️ [EXTRACT] Request timeout');
            return jsonError('Extract request timed out', 504);
        }
        console.error('💥 [EXTRACT] Critical Error:', error);
        return jsonError('Error interno al procesar la extracción', 500);
    }
}
