import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getIntEnv, getPublicSiteUrl, getRequiredEnv } from '@/lib/env';

const PRO_MODEL_IDS = new Set(['stepfun/step-3.5-flash:free']);
const PRO_ALLOWED_ROLES = new Set(['admin', 'premium', 'superadmin']);

function jsonError(message, status = 500, extras = {}) {
    return NextResponse.json({ error: message, ...extras }, { status });
}

function normalizeMessages(messages) {
    // Keep only fields the model expects.
    return messages.map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
    }));
}

export async function POST(req) {
    try {
        const reqBody = await req.json();
        const { messages, modelId, systemPrompt, botName, stream, tone, detailLevel, language } = reqBody;
        const requestId = globalThis.crypto?.randomUUID?.() || String(Date.now());
        console.log('🤖 Chat API Request:', { requestId, modelId, botName, tone, detailLevel, messagesCount: messages?.length });
        console.log('🤖 Chat API Raw Body:', reqBody);

        // ... existing validation ...
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.warn('⚠️ Chat API: Messages array is missing or empty');
            return jsonError('Messages array is required', 400, { requestId });
        }
        if (!modelId || typeof modelId !== 'string') {
            console.warn('⚠️ Chat API: modelId is missing');
            return jsonError('Valid modelId is required', 400, { requestId });
        }
        if (PRO_MODEL_IDS.has(modelId)) {
            const cookieStore = await cookies();
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll();
                        },
                        setAll() {
                            // Read-only use in API route.
                        },
                    },
                }
            );

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return jsonError('Este modelo está disponible solo para usuarios admin o premium.', 403, { requestId });
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const role = (profile?.role || '').toLowerCase();
            if (profileError || !PRO_ALLOWED_ROLES.has(role)) {
                return jsonError('Este modelo está disponible solo para usuarios admin o premium.', 403, { requestId });
            }
        }

        // Basic abuse protection
        if (messages.length > 60) {
            return jsonError('Too many messages in a single request', 413, { requestId });
        }

        let apiKey;
        try {
            apiKey = getRequiredEnv('OPENROUTER_API_KEY');
        } catch {
            return jsonError('Server configuration error (OPENROUTER_API_KEY missing)', 500, { requestId });
        }

        const activeBotName = botName || 'sigmaLLM 1';
        const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const currentTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        // Personalization Directives
        const toneDirective = tone ? `Responde con un tono **${tone}**.` : '';
        const detailDirective = detailLevel ? `Tu nivel de detalle debe ser **${detailLevel}**.` : '';
        const languageDirective = language ? `Responde siempre en **${language}**.` : '';

        const coderDirective = modelId.includes('coder')
            ? 'Eres un experto en programación de élite. Escribe código limpio, optimizado y documentado. Explica las decisiones técnicas cuando sea necesario.'
            : '';
        const reasoningDirective = modelId.includes('nemotron')
            ? 'Cuando realices razonamiento, escribe tu pensamiento en tiempo real entre etiquetas <think>...</think> y, al terminar, da la respuesta final fuera de esas etiquetas.'
            : '';

        const CORE_IDENTITY = `Eres ${activeBotName} 🤖, creado por Sigma Company (autor: Ayoub Louah).
Fecha actual: ${currentDate}
Hora actual: ${currentTime}

**Personalidad y Estilo:**
- ${toneDirective}
- ${detailDirective}
- ${languageDirective}
- ${coderDirective}
- ${reasoningDirective}
- Amigable, cercano y positivo 😊✨
- Explicas paso a paso, de forma clara
- Usas ejemplos cuando ayudan
- Humor ligero apropiado
- Emojis por defecto (desactiva si el usuario lo pide)
- Responde de forma breve por defecto (3-8 líneas), salvo que el usuario pida explícitamente más detalle

**Formato de Respuesta:**
- Usa Markdown: títulos (##), listas (-), **negritas**, \`código\`
- Bloques de código con sintaxis específica
- Matemáticas: Usa LaTeX encerrado en $...$ para cálculos en línea y $$...$$ para bloques destacados. Ejemplo: $$E=mc^2$$
- Estructura clara y organizada

**Capacidad de Búsqueda en Internet:**
- Si te proporciono información bajo el encabezado [CONTEXTO DE BÚSQUEDA WEB], úsala como tu fuente principal de verdad para datos actuales.
- IMPORTANTE: Si no tienes la información necesaria para responder con precisión o si el usuario pregunta algo sobre eventos actuales o datos que desconoces, DEBES responder únicamente con: "SEARCH: [tu consulta aquí]". No intentes adivinar ni decir que no sabes sin antes intentar buscar.
- Una vez que recibas los resultados de la búsqueda, sintetiza la respuesta de forma clara.
- Prioriza siempre los datos que te paso en el mensaje sobre tu conocimiento previo.

**Reglas:**
1. Si te preguntan quién eres o cuál es tu modelo → "Soy Sigma AI, el modelo SigmaLMM 1, creado por Sigma Company, autor Ayoub Louah"
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
            ...normalizeMessages(messages)
        ];
        console.log('🧾 [CHAT API] formattedMessages preview:', {
            requestId,
            count: formattedMessages.length,
            lastMessage: formattedMessages[formattedMessages.length - 1]
        });

        // Call OpenRouter with optimized settings and limited retries for 429
        let response;
        let retries = 2;
        let delay = 1000;

        const timeoutMs = getIntEnv('OPENROUTER_TIMEOUT_MS', 60_000);
        const requestedMaxTokens = getIntEnv('OPENROUTER_MAX_TOKENS', 900);
        const maxTokens = Math.min(requestedMaxTokens, 1200);
        const wantStream = stream !== false;

        while (retries >= 0) {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), timeoutMs);

            response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': getPublicSiteUrl(),
                    'X-Title': 'Sigma AI',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: formattedMessages,
                    stream: wantStream,
                    temperature: 0.7,
                    max_tokens: maxTokens,
                }),
                signal: controller.signal,
            });
            console.log('📡 [CHAT API] OpenRouter request payload:', {
                requestId,
                model: modelId,
                stream: wantStream,
                temperature: 0.7,
                max_tokens: maxTokens,
                messagesCount: formattedMessages.length
            });

            clearTimeout(t);

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
            return jsonError(
                (errorData.error?.message || 'AI service temporarily unavailable') + ` (${response.status})`,
                response.status,
                { requestId }
            );
        }

        if (!wantStream) {
            const data = await response.json();
            console.log('📥 [CHAT API] Non-stream OpenRouter response:', data);
            const content = data?.choices?.[0]?.message?.content ?? '';
            return NextResponse.json({ requestId, content, raw: data });
        }

        console.log('✅ OpenRouter Response OK. Starting stream...', {
            requestId,
            status: response.status,
            statusText: response.statusText
        });

        // Forward OpenRouter stream directly to client
        // OpenRouter returns proper SSE format, so we can pass it through
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Transfer-Encoding': 'chunked',
                'X-Accel-Buffering': 'no',
                'X-Request-Id': requestId,
            },
        });

    } catch (error) {
        const isAbort = error?.name === 'AbortError';
        console.error('Critical API Error:', error);
        return jsonError(
            isAbort ? 'Upstream request timed out' : 'Internal server error. Please try again.',
            isAbort ? 504 : 500
        );
    }
}
