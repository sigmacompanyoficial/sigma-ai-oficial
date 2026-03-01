// @ts-nocheck
import { NextResponse } from 'next/server';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';

// Simple in-memory cache for search results (TTL: 5 minutes)
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120; // Max requests per minute per IP

function getCacheKey(query) {
    return query.toLowerCase().trim();
}

function cleanCache() {
    const now = Date.now();
    for (const [key, { timestamp }] of searchCache.entries()) {
        if (now - timestamp > CACHE_TTL) {
            searchCache.delete(key);
        }
    }
}

function checkRateLimit(ip) {
    if (!ip || ip === 'unknown') return true;
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

/**
 * Búsqueda con DuckDuckGo como fallback (sin API key necesaria)
 */
async function searchDuckDuckGo(query) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        // DuckDuckGo Instant Answer API
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=sigmaai`;
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'Sigma-LLM/1.0 (AI Assistant)' },
            signal: controller.signal
        });

        if (!resp.ok) throw new Error(`DuckDuckGo HTTP ${resp.status}`);

        const data = await resp.json();
        let result = '';

        if (data.AbstractText) {
            result += `📖 **Resumen**: ${data.AbstractText}`;
            if (data.AbstractSource) result += ` *(Fuente: ${data.AbstractSource})*`;
            result += '\n\n';
        }

        if (data.Answer) {
            result += `✅ **Respuesta directa**: ${data.Answer}\n\n`;
        }

        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            const topics = data.RelatedTopics
                .filter(t => t.Text && !t.Topics)
                .slice(0, 4)
                .map(t => `• ${t.Text}`);
            if (topics.length > 0) {
                result += `🔗 **Temas relacionados**:\n${topics.join('\n')}\n\n`;
            }
        }

        if (data.Infobox?.content?.length > 0) {
            const facts = data.Infobox.content
                .filter(c => c.label && c.value)
                .slice(0, 6)
                .map(c => `• **${c.label}**: ${c.value}`);
            if (facts.length > 0) {
                result += `ℹ️ **Datos clave**:\n${facts.join('\n')}\n\n`;
            }
        }

        return result.trim() || null;
    } catch (err) {
        console.warn('[SEARCH][DDG] Error:', err.message);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Búsqueda con Brave Search API (alternativa gratuita)
 */
async function searchBrave(query, apiKey) {
    if (!apiKey) return null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const resp = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&search_lang=es`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': apiKey
            },
            signal: controller.signal
        });

        if (!resp.ok) throw new Error(`Brave HTTP ${resp.status}`);
        const data = await resp.json();

        let result = '';
        if (data.web?.results?.length > 0) {
            result = data.web.results.slice(0, 5).map(r =>
                `📄 **${r.title}**\n${r.description}\n🔗 ${r.url}`
            ).join('\n\n');
        }

        return result || null;
    } catch (err) {
        console.warn('[SEARCH][BRAVE] Error:', err.message);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Búsqueda con Tavily (principal)
 */
async function searchTavily(query, apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
        // Probar con header auth primero
        let response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query: query.trim(),
                search_depth: 'basic',
                include_answer: true,
                include_raw_content: false,
                max_results: 6,
                include_domains: [],
                exclude_domains: []
            }),
            signal: controller.signal
        });

        // Fallback: api_key en body
        if (!response.ok && (response.status === 401 || response.status === 403)) {
            console.warn('⚠️ [SEARCH][TAVILY] Header auth failed, retrying with body key...');
            response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: query.trim(),
                    search_depth: 'basic',
                    include_answer: true,
                    include_raw_content: false,
                    max_results: 6
                }),
                signal: controller.signal
            });
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Tavily HTTP ${response.status}: ${errData?.message || 'Unknown'}`);
        }

        const data = await response.json();
        console.log('📥 [SEARCH][TAVILY] Status:', response.status, '| Results:', data.results?.length || 0);

        let result = '';

        if (data.answer) {
            result += `✅ **Resumen**: ${data.answer}\n\n`;
        }

        if (data.results && data.results.length > 0) {
            const formatted = data.results.slice(0, 5).map((r, i) => {
                let item = `**${i + 1}. ${r.title || 'Sin título'}**`;
                if (r.url) item += `\n🔗 ${r.url}`;
                if (r.content) item += `\n${r.content.slice(0, 400)}${r.content.length > 400 ? '...' : ''}`;
                return item;
            });
            result += `📚 **Resultados encontrados**:\n\n${formatted.join('\n\n')}`;
        }

        return result.trim() || null;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw err;
        console.warn('[SEARCH][TAVILY] Error:', err.message);
        return null;
    }
}

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        // Rate limiting
        if (!checkRateLimit(ip)) {
            console.warn('⚠️ [SEARCH] Rate limit exceeded for IP:', ip);
            return jsonError('Demasiadas búsquedas. Espera un momento.', 429);
        }

        const body = await req.json();
        const { query, isGuest } = body;
        console.log(`🌐 [SEARCH] Query: "${query}" | Guest: ${isGuest}`);

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return jsonError('Se requiere una consulta válida', 400);
        }

        if (query.trim().length > 500) {
            return jsonError('La consulta es demasiado larga (máx. 500 caracteres)', 400);
        }

        // Check cache
        const cacheKey = getCacheKey(query);
        const cachedResult = searchCache.get(cacheKey);
        if (cachedResult) {
            console.log('💾 [SEARCH] Cache hit for:', query);
            return NextResponse.json({
                success: true,
                result: cachedResult.data,
                source: cachedResult.source + ' (Caché)',
                cached: true
            });
        }

        // Get API keys
        const tavilyKey = getOptionalEnv('TAVILY_API_KEY', '') || getOptionalEnv('GUEST_TAVILY_API_KEY', '');
        const braveKey = getOptionalEnv('BRAVE_SEARCH_API_KEY', '');

        let finalResult = null;
        let source = '';

        // 1. Intentar Tavily
        if (tavilyKey) {
            try {
                console.log('📡 [SEARCH] Trying Tavily...');
                finalResult = await searchTavily(query.trim(), tavilyKey);
                if (finalResult) {
                    source = 'Tavily';
                    console.log('✅ [SEARCH] Tavily success');
                }
            } catch (err) {
                if (err.name === 'AbortError') throw err;
                console.warn('⚠️ [SEARCH] Tavily failed:', err.message);
            }
        }

        // 2. Fallback: Brave Search
        if (!finalResult && braveKey) {
            try {
                console.log('📡 [SEARCH] Trying Brave Search...');
                finalResult = await searchBrave(query.trim(), braveKey);
                if (finalResult) {
                    source = 'Brave Search';
                    console.log('✅ [SEARCH] Brave success');
                }
            } catch (err) {
                console.warn('⚠️ [SEARCH] Brave failed:', err.message);
            }
        }

        // 3. Fallback: DuckDuckGo (sin API key)
        if (!finalResult) {
            try {
                console.log('📡 [SEARCH] Trying DuckDuckGo fallback...');
                finalResult = await searchDuckDuckGo(query.trim());
                if (finalResult) {
                    source = 'DuckDuckGo';
                    console.log('✅ [SEARCH] DuckDuckGo success');
                }
            } catch (err) {
                console.warn('⚠️ [SEARCH] DuckDuckGo failed:', err.message);
            }
        }

        if (!finalResult) {
            console.warn('⚠️ [SEARCH] All search engines failed for:', query);
            return NextResponse.json({
                success: false,
                result: 'No encontré información específica en la web para esa consulta. Intenta reformular la búsqueda.'
            });
        }

        // Cache the result
        searchCache.set(cacheKey, { data: finalResult, source, timestamp: Date.now() });
        cleanCache();

        return NextResponse.json({
            success: true,
            result: finalResult,
            source,
            cached: false
        });

    } catch (error) {
        if (error?.name === 'AbortError') {
            console.error('⏱️ [SEARCH] Timeout');
            return jsonError('La búsqueda tardó demasiado. Intenta de nuevo.', 504);
        }
        console.error('💥 [SEARCH] Critical Error:', error);
        return jsonError('Error interno al procesar la búsqueda', 500);
    }
}
