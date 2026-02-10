import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { imageUrl, imageBase64, prompt } = await req.json();
        console.log('📸 Vision API: Processing new image...');

        if (!imageUrl && !imageBase64) {
            console.warn('⚠️ Vision API: No image provided');
            return NextResponse.json({ error: 'Image required' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey === 'your_openrouter_api_key') {
            return NextResponse.json({
                error: 'API Key not configured'
            }, { status: 500 });
        }

        // Prepare image format
        const imageContent = imageUrl
            ? { type: "image_url", image_url: { url: imageUrl } }
            : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

        // Fast vision analysis
        const visionResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'Sigma AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-12b-v2-vl:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Describe brevemente esta imagen. ¿Qué ves?"
                            },
                            imageContent
                        ]
                    }
                ],
                max_tokens: 500,
                temperature: 0.5
            })
        });

        if (!visionResponse.ok) {
            const errorData = await visionResponse.json().catch(() => ({}));
            console.error('Vision Error:', errorData);
            return NextResponse.json({
                error: 'Error al procesar la imagen'
            }, { status: visionResponse.status });
        }

        const visionData = await visionResponse.json();
        const description = visionData.choices?.[0]?.message?.content;
        console.log('✅ Vision Analysis result obtained.');

        if (!description) {
            return NextResponse.json({
                error: 'No se pudo analizar la imagen'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            description: description
        });

    } catch (error) {
        console.error('Vision API Error:', error);
        return NextResponse.json({
            error: 'Error procesando imagen'
        }, { status: 500 });
    }
}
