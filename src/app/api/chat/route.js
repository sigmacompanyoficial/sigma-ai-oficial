import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { messages, modelId, systemPrompt, botName } = await req.json();
        console.log('🤖 Chat API Request:', { modelId, botName, messagesCount: messages.length });

        // Validation
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.warn('⚠️ Chat API: Messages array is missing or empty');
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }
        if (!modelId || typeof modelId !== 'string') {
            console.warn('⚠️ Chat API: modelId is missing');
            return NextResponse.json({ error: 'Valid modelId is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey === 'your_openrouter_api_key') {
            return NextResponse.json({
                error: 'Server configuration error. Please contact support.'
            }, { status: 500 });
        }

        const activeBotName = botName || 'Sigma AI';

        // Enhanced system prompt with search capability
        const CORE_IDENTITY = `Eres ${activeBotName} 🤖, creado por Sigma Company (autor: Ayoub Louah).

**Personalidad Core:**
- Amigable, cercano y positivo 😊✨
- Explicas paso a paso, de forma clara
- Usas ejemplos cuando ayudan
- Humor ligero apropiado
- Emojis por defecto (desactiva si el usuario lo pide)

**Formato de Respuesta:**
- Usa Markdown: títulos (##), listas (-), **negritas**, \`código\`
- Bloques de código con sintaxis específica
- Estructura clara y organizada

**Capacidad de Búsqueda en Internet:**
- Si te preguntan sobre información actual (noticias, eventos recientes, datos actualizados)
- Si te preguntan sobre personas, lugares o eventos que no conoces
- Si necesitas datos en tiempo real (clima, cotizaciones, resultados deportivos)
- RESPONDE EXACTAMENTE: "SEARCH: [tu consulta aquí]"
- Ejemplo: Si preguntan "¿quién ganó el mundial 2026?" → Responde: "SEARCH: mundial 2026 ganador"
- Después de recibir los resultados, formúlalos de manera clara y amigable

**Reglas:**
1. Si te preguntan quién eres → "${activeBotName}, creado por Sigma Company, autor Ayoub Louah"
2. No inventes información, si no estás seguro usa SEARCH
3. Si no sabes algo actual, usa SEARCH
4. Sé educado y profesional siempre
5. Prioriza la claridad sobre la brevedad`;

        const ENHANCED_INSTRUCTIONS = systemPrompt ? `\n\n**Instrucciones Personalizadas:**\n${systemPrompt}` : '';

        const formattedMessages = [
            {
                role: 'system',
                content: CORE_IDENTITY + ENHANCED_INSTRUCTIONS
            },
            ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        // Call OpenRouter with optimized settings and limited retries for 429
        let response;
        let retries = 2;
        let delay = 1000;

        while (retries >= 0) {
            response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                    'X-Title': 'Sigma AI',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: formattedMessages,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 4000,
                })
            });

            if (response.status === 429 && retries > 0) {
                console.warn(`⚠️ Rate limited by OpenRouter. Retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries--;
                delay *= 2; // Exponential backoff
                continue;
            }
            break;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
            console.error('❌ OpenRouter API Error:', errorData);
            return NextResponse.json({
                error: (errorData.error?.message || 'AI service temporarily unavailable') + ` (${response.status})`
            }, { status: response.status });
        }

        console.log('✅ OpenRouter Response OK. Starting stream...');

        // Stream back to client with proper headers
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no', // Disable nginx buffering
            },
        });

    } catch (error) {
        console.error('Critical API Error:', error);
        return NextResponse.json({
            error: 'Internal server error. Please try again.'
        }, { status: 500 });
    }
}
