import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/env';

const VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { imageUrl, imageDataUrl, imageBase64, prompt } = body;

        // Normalize image input
        const finalImageUrl = imageUrl
            || imageDataUrl
            || (imageBase64 && (String(imageBase64).startsWith('data:image/')
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`));

        if (!finalImageUrl) {
            console.error('❌ [VISION] No image provided in request');
            return jsonError('Image required', 400);
        }

        // Basic validation of data URL format
        if (typeof finalImageUrl !== 'string' || (!finalImageUrl.startsWith('data:image/') && !finalImageUrl.startsWith('http'))) {
            console.error('❌ [VISION] Invalid image format');
            return jsonError('Formato de imagen no soportado', 400);
        }

        const apiKey = getRequiredEnv('OPENROUTER_API_KEY');
        const visionModels = [
            VISION_MODEL,
            'google/gemini-2.0-flash-exp:free',
            'google/gemini-flash-1.5-8b:free',
            'mistralai/pixtral-12b:free'
        ];

        let response = null;
        let lastError = null;
        let visionData = null;

        for (const targetModel of visionModels) {
            for (let attempt = 0; attempt < 2; attempt++) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s per attempt

                try {
                    if (attempt > 0) await new Promise(r => setTimeout(r, 500));

                    console.log(`📸 [VISION] Attempting model: ${targetModel} (Attempt ${attempt + 1})...`);
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
                            temperature: 0.0,
                            messages: [
                                {
                                    role: 'user',
                                    content: [
                                        {
                                            type: 'text',
                                            text: `Actúa como un experto en visión artificial y OCR. 
Instrucciones críticas:
1. Si la imagen contiene TEXTO, extráelo TODO de forma literal y precisa. No resumas el texto, transcríbelo.
2. Si la imagen contiene DIBUJOS, esquemas o fotos, explícalos detalladamente, describiendo objetos, acciones y estilo.
3. Responde de forma rápida y directa siguiendo la solicitud del usuario: ${prompt || 'Analiza la imagen'}`
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

                    if (fetchResponse.status === 429) {
                        lastError = new Error('429 Rate Limit/Provider Overloaded');
                        continue;
                    }

                    if (!fetchResponse.ok) {
                        const errText = await fetchResponse.text();
                        throw new Error(`OpenRouter Error ${fetchResponse.status}: ${errText}`);
                    }

                    visionData = await fetchResponse.json();
                    response = fetchResponse;
                    break; // Success!
                } catch (err) {
                    clearTimeout(timeoutId);
                    lastError = err;
                    const isTimeout = err.name === 'AbortError';
                    console.warn(`⚠️ [VISION] Attempt ${attempt} failed on ${targetModel}:`, isTimeout ? 'Timeout (20s)' : err.message);

                    // If it's a critical error (not 429 or timeout), maybe try next model immediately
                    if (!isTimeout && !err.message.includes('429')) break;
                }
            }
            if (response && response.ok) break;
        }

        if (!response || !response.ok || !visionData) {
            return jsonError(lastError?.message || 'Todos los modelos de visión fallaron.', response?.status || 500);
        }

        const content = visionData.choices?.[0]?.message?.content || '';
        return NextResponse.json({ content });

    } catch (error) {
        console.error('❌ [VISION] Critical handler error:', error);
        return jsonError(error.message || 'Internal Error', 500);
    }
}
