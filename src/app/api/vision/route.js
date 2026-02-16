import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/env';

const VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const { imageUrl, imageDataUrl, imageBase64, prompt } = await req.json();

        // Normalize image input
        const finalImageUrl = imageUrl
            || imageDataUrl
            || (String(imageBase64).startsWith('data:image/')
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`);

        if (!finalImageUrl) {
            return jsonError('Image required', 400);
        }

        // Basic validation of data URL format
        if (typeof finalImageUrl === 'string' && finalImageUrl.startsWith('data:image/')) {
            // Good
        } else if (typeof finalImageUrl === 'string' && (finalImageUrl.startsWith('http://') || finalImageUrl.startsWith('https://'))) {
            // Good
        } else {
            return jsonError('Formato de imagen no soportado (debe ser Data URL o HTTP URL)', 400);
        }

        const apiKey = getRequiredEnv('OPENROUTER_API_KEY');

        console.log(`📸 [VISION] Sending request to OpenRouter (${VISION_MODEL})...`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://sigma.ai', // Reemplaza con tu dominio real si tienes
                'X-Title': 'Sigma LLM'
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                stream: true,
                temperature: 0.1,
                max_tokens: 700,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Describe detalladamente el contenido de esta imagen. Céntrate en los objetos visibles, textos, colores y acciones. Esta descripción será usada por un asistente para responder preguntas sobre la imagen. Proporciona solo la descripción objetiva.\n\nInstrucción adicional del usuario (si aplica): ${prompt || 'Describe la imagen'}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: finalImageUrl
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('❌ [VISION] OpenRouter API Error:', response.status, errText);
            return jsonError(`OpenRouter Error: ${response.status}`, response.status);
        }

        // Pass the stream through directly
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error('❌ [VISION] Handler logic error:', error);
        return jsonError(error.message || 'Internal Error', 500);
    }
}
