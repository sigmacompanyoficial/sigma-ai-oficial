import { NextResponse } from 'next/server';
import { getPublicSiteUrl, getRequiredEnv } from '@/lib/env';

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return jsonError('Prompt is required', 400);
        }

        let apiKey;
        try {
            apiKey = getRequiredEnv('OPENROUTER_API_KEY');
        } catch {
            return jsonError('API Key not configured', 500);
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': getPublicSiteUrl(),
                'X-Title': 'Sigma AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "google/gemma-3-27b-it:free",
                messages: [
                    {
                        role: "system",
                        content: "Genera un título muy corto (máximo 4-6 palabras) y descriptivo para este inicio de conversación (usuario + primera respuesta del asistente). Devuelve SOLO el título, sin comillas ni punto final."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 24,
                temperature: 0.4
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Title Gen Error:', errorData);
            // If title generation fails, we'll just fall back to the prompt substring
            return NextResponse.json({ title: prompt.substring(0, 30) });
        }

        const data = await response.json();
        const title = data.choices?.[0]?.message?.content?.trim() || prompt.substring(0, 30);

        return NextResponse.json({ title });

    } catch (error) {
        console.error('Title API Error:', error);
        return jsonError('Error generating title', 500);
    }
}
