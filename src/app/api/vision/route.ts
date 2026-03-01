import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/env';

const VISION_MODEL = 'google/gemma-3-4b-it:free';

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { imageUrl, imageDataUrl, imageBase64, prompt } = body;

        console.log('📸 [VISION] Request received. Prompt:', prompt?.substring(0, 50));

        // Normalize image input
        const finalImageUrl = imageUrl
            || imageDataUrl
            || (imageBase64 && (String(imageBase64).startsWith('data:image/')
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`));

        if (!finalImageUrl) {
            console.error('❌ [VISION] No image provided');
            return jsonError('Se requiere una imagen para el análisis.', 400);
        }

        let apiKey;
        try {
            apiKey = getRequiredEnv('OPENROUTER_API_KEY');
        } catch (e) {
            console.error('❌ [VISION] API Key missing:', e.message);
            return jsonError('Configuración del servidor incompleta (API Key).', 500);
        }

        const visionModels = [
            VISION_MODEL,
            'google/gemini-flash-1.5-8b:free',
            'mistralai/pixtral-12b:free',
            'google/gemini-2.0-flash-exp:free' // Redundant but safe
        ];

        let lastError = null;
        let visionData = null;
        let successResponse = null;

        for (const targetModel of visionModels) {
            console.log(`📸 [VISION] Trying model: ${targetModel}...`);

            // Reintentos cortos por modelo
            for (let attempt = 0; attempt < 1; attempt++) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);

                try {
                    const fetchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://sigmacompany.ai',
                            'X-Title': 'Sigma LLM'
                        },
                        body: JSON.stringify({
                            model: targetModel,
                            stream: false,
                            temperature: 0.1,
                            max_tokens: 1000,
                            messages: [
                                {
                                    role: 'user',
                                    content: [
                                        {
                                            type: 'text',
                                            text: `Analiza la imagen de forma rápida y concisa (máx 5 líneas). 
                                            Responde directamente a: ${prompt || '¿Qué ves en esta imagen?'}`
                                        },
                                        {
                                            type: 'image_url',
                                            image_url: { url: finalImageUrl }
                                        }
                                    ]
                                }
                            ]
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!fetchResponse.ok) {
                        const errBody = await fetchResponse.text().catch(() => 'No error body');
                        console.warn(`⚠️ [VISION] Model ${targetModel} failed (${fetchResponse.status}):`, errBody.substring(0, 100));
                        lastError = new Error(`Status ${fetchResponse.status}: ${errBody.substring(0, 150)}`);
                        continue;
                    }

                    visionData = await fetchResponse.json();
                    if (visionData?.choices?.[0]?.message?.content) {
                        successResponse = visionData.choices[0].message.content;
                        break;
                    } else {
                        console.warn(`⚠️ [VISION] Model ${targetModel} returned empty or invalid JSON:`, JSON.stringify(visionData).substring(0, 100));
                    }
                } catch (err) {
                    clearTimeout(timeoutId);
                    lastError = err;
                    console.warn(`⚠️ [VISION] Error on ${targetModel}:`, err.name === 'AbortError' ? 'Timeout' : err.message);
                }
            }
            if (successResponse) break;
        }

        if (successResponse) {
            console.log('✅ [VISION] Success! Content length:', successResponse.length);
            return NextResponse.json({ content: successResponse });
        }

        console.error('❌ [VISION] All models failed. Last error:', lastError?.message);
        return jsonError(lastError?.message || 'Error en el servicio de visión artificial.', 500);

    } catch (error) {
        console.error('❌ [VISION] Global handler error:', error);
        return jsonError('Error interno en el servidor de visión.', 500);
    }
}
