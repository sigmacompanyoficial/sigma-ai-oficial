import { NextResponse } from 'next/server';
import { getPublicSiteUrl, getRequiredEnv } from '@/lib/env';

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const { imageUrl, imageBase64, prompt, useNemotron } = await req.json();
        console.log('📸 Vision API: Processing new image...');
        console.log('   useNemotron:', useNemotron);
        console.log('   has imageUrl:', !!imageUrl);
        console.log('   has imageBase64:', !!imageBase64);

        if (!imageUrl && !imageBase64) {
            console.warn('⚠️ Vision API: No image provided');
            return jsonError('Image required', 400);
        }

        let apiKey;
        try {
            apiKey = getRequiredEnv('OPENROUTER_API_KEY');
        } catch {
            return jsonError('API Key not configured', 500);
        }

        // Prepare image format
        const imageContent = imageUrl
            ? { type: "image_url", image_url: { url: imageUrl } }
            : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

        // Choose model: use nemotron only when reasoning is requested, otherwise use Gemma 3
        const chosenModel = useNemotron ? 'nvidia/nemotron-nano-12b-v2-vl:free' : 'google/gemma-3-27b-it:free';
        console.log('📊 Using model:', chosenModel);

        // Stream the response from OpenRouter if possible (for reasoning tokens and progressive output)
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
            })
        });

        if (!visionResponse.ok) {
            const errorData = await visionResponse.json().catch(() => ({}));
            console.error('❌ Vision Error:', errorData);
            return jsonError('Error al procesar la imagen', visionResponse.status);
        }
        console.log('✅ Vision API response streaming...');

        // Return the upstream stream directly so client can receive progressive tokens (and usage info)
        console.log('🔄 Returning SSE stream to client...');
        return new Response(visionResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Title': 'Sigma AI',
            }
        });

    } catch (error) {
        console.error('Vision API Error:', error);
        return jsonError('Error procesando imagen', 500);
    }
}
