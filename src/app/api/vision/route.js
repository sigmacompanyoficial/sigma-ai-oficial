import { NextResponse } from 'next/server';
import { getPublicSiteUrl, getRequiredEnv } from '@/lib/env';

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(ip) {
    const now = Date.now();
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, [now]);
        return true;
    }
    const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
    if (timestamps.length >= RATE_LIMIT_MAX) return false;
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return true;
}

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

// Validate base64 image size (max 5MB)
function getBase64Size(base64) {
    return (base64.length * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
}

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        if (!checkRateLimit(ip)) {
            console.warn('⚠️ [VISION] Rate limit exceeded for IP:', ip);
            return jsonError('Too many vision requests. Please wait.', 429);
        }

        const { imageUrl, imageBase64, prompt, useNemotron } = await req.json();
        console.log('📸 Vision API: Processing new image...');

        if (!imageUrl && !imageBase64) {
            console.warn('⚠️ Vision API: No image provided');
            return jsonError('Image required', 400);
        }

        // Validate base64 size
        if (imageBase64 && getBase64Size(imageBase64) > 5 * 1024 * 1024) {
            console.warn('⚠️ Vision API: Image too large');
            return jsonError('Image must be under 5MB', 413);
        }

        let apiKey;
        try {
            apiKey = getRequiredEnv('OPENROUTER_API_KEY');
        } catch {
            return jsonError('API Key not configured', 500);
        }

        const imageContent = imageUrl
            ? { type: "image_url", image_url: { url: imageUrl } }
            : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

        const chosenModel = useNemotron ? 'nvidia/nemotron-nano-12b-v2-vl:free' : 'google/gemma-3-27b-it:free';
        console.log('📊 Using model:', chosenModel);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const visionResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': getPublicSiteUrl(),
                'X-Title': 'Sigma AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: chosenModel,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: `Describe esta imagen de forma técnica y concisa para un asistente de IA. Resalta detalles clave.\n\nInstrucción del usuario (si existe): ${prompt || 'N/A'}` },
                            imageContent
                        ]
                    }
                ],
                max_tokens: useNemotron ? 800 : 500,
                temperature: 0.1,
                stream: true
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!visionResponse.ok) {
            const errorData = await visionResponse.json().catch(() => ({}));
            console.error('❌ Vision Error:', errorData);
            return jsonError('Error al procesar la imagen', visionResponse.status);
        }
        console.log('✅ Vision API response streaming...');

        return new Response(visionResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Title': 'Sigma AI',
            }
        });

    } catch (error) {
        if (error?.name === 'AbortError') {
            console.error('⏱️ [VISION] Request timeout');
            return jsonError('Vision request timed out', 504);
        }
        console.error('Vision API Error:', error);
        return jsonError('Error procesando imagen', 500);
    }
}
