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
    // In local/dev environments this can be "unknown" for every request.
    // Do not hard-block web search in that case.
    if (!ip || ip === 'unknown') {
        return true;
    }

    const now = Date.now();
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, [now]);
        return true;
    }

    const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
    if (timestamps.length >= RATE_LIMIT_MAX) {
        return false;
    }
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return true;
}

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        console.log('🌐 [SEARCH] Incoming request metadata:', {
            ip,
            userAgent: req.headers.get('user-agent') || 'unknown'
        });

        // Rate limiting
        if (!checkRateLimit(ip)) {
            console.warn('⚠️ [SEARCH] Rate limit exceeded for IP:', ip);
            return jsonError('Too many search requests. Please wait a moment.', 429);
        }

        const body = await req.json();
        const { query, isGuest } = body;
        console.log('🌐 [SEARCH] Incoming body:', body);
        console.log(`🌐 [SEARCH] Tavily Request (Guest: ${isGuest}) for:`, query);

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            console.warn('⚠️ [SEARCH] Invalid or empty query');
            return jsonError('Valid query required', 400);
        }

        const cacheKey = getCacheKey(query);
        const cachedResult = searchCache.get(cacheKey);

        if (cachedResult) {
            console.log('💾 [SEARCH] Returning cached result for:', query);
            console.log('💾 [SEARCH] Cached payload:', cachedResult.data);
            return NextResponse.json({
                success: true,
                result: cachedResult.data,
                source: 'Tavily (Cached)',
                cached: true
            });
        }

        let apiKey = '';
        try {
            const guestKey = getOptionalEnv('GUEST_TAVILY_API_KEY', '');
            const standardKey = getOptionalEnv('TAVILY_API_KEY', '');
            apiKey = isGuest ? (guestKey || standardKey) : (standardKey || guestKey);
            if (!apiKey) {
                // Keep the explicit error semantics.
                getRequiredEnv(isGuest ? 'GUEST_TAVILY_API_KEY' : 'TAVILY_API_KEY');
            }
            console.log(`🔑 [SEARCH] Using Tavily key (${apiKey.substring(0, 8)}...)`);
        } catch {
            console.error('❌ [SEARCH] Tavily API key is missing (TAVILY_API_KEY / GUEST_TAVILY_API_KEY)');
            return jsonError('Search API key not configured', 500);
        }

        console.log('📡 [SEARCH] Calling Tavily API...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        let response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                query: query.trim(),
                search_depth: "basic",
                include_answer: true,
                max_results: 5
            }),
            signal: controller.signal
        });
        console.log('📡 [SEARCH] Tavily request payload (header-auth):', {
            query: query.trim(),
            search_depth: 'basic',
            include_answer: true,
            max_results: 5
        });

        // Compatibility fallback for deployments expecting api_key in JSON body.
        if (!response.ok && (response.status === 401 || response.status === 403)) {
            console.warn('⚠️ [SEARCH] Header auth failed, retrying with body api_key fallback...');
            response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: query.trim(),
                    search_depth: "basic",
                    include_answer: true,
                    max_results: 5
                }),
                signal: controller.signal
            });
            console.log('📡 [SEARCH] Tavily request payload (body api_key fallback):', {
                query: query.trim(),
                search_depth: 'basic',
                include_answer: true,
                max_results: 5
            });
        }

        clearTimeout(timeoutId);
        const data = await response.json();
        console.log('📥 [SEARCH] Tavily Response Status:', response.status);
        console.log('📥 [SEARCH] Tavily raw response data:', data);

        if (!response.ok) {
            console.error('❌ [SEARCH] Tavily API Error:', data);
            return jsonError('Error calling search service', response.status);
        }

        let finalResult = '';

        if (data.answer) {
            finalResult = data.answer;
            console.log('✅ [SEARCH] Tavily provided a direct answer.');
        } else if (data.results && data.results.length > 0) {
            finalResult = data.results.map(r => `Source: ${r.title}\nContent: ${r.content}`).join('\n\n');
            console.log(`✅ [SEARCH] Found ${data.results.length} search results.`);
        }

        if (!finalResult) {
            console.warn('⚠️ [SEARCH] No relevant info found for:', query);
            return NextResponse.json({
                success: false,
                result: 'No encontré información específica en la web.'
            });
        }

        // Cache the result
        searchCache.set(cacheKey, {
            data: finalResult,
            timestamp: Date.now()
        });
        cleanCache(); // Clean old entries periodically

        return NextResponse.json({
            success: true,
            result: finalResult,
            source: 'Tavily',
            cached: false
        });

    } catch (error) {
        if (error?.name === 'AbortError') {
            console.error('⏱️ [SEARCH] Request timeout');
            return jsonError('Search request timed out', 504);
        }
        console.error('💥 [SEARCH] Critical Error:', error);
        return jsonError('Error interno al procesar la búsqueda', 500);
    }
}
