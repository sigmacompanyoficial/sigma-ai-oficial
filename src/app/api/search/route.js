import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/env';

// Simple in-memory cache for search results (TTL: 5 minutes)
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // Max 10 requests per minute per IP

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

        // Rate limiting
        if (!checkRateLimit(ip)) {
            console.warn('⚠️ [SEARCH] Rate limit exceeded for IP:', ip);
            return jsonError('Too many search requests. Please wait a moment.', 429);
        }

        const { query, isGuest } = await req.json();
        console.log(`🌐 [SEARCH] Tavily Request (Guest: ${isGuest}) for:`, query);

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            console.warn('⚠️ [SEARCH] Invalid or empty query');
            return jsonError('Valid query required', 400);
        }

        const cacheKey = getCacheKey(query);
        const cachedResult = searchCache.get(cacheKey);

        if (cachedResult) {
            console.log('💾 [SEARCH] Returning cached result for:', query);
            return NextResponse.json({
                success: true,
                result: cachedResult.data,
                source: 'Tavily (Cached)',
                cached: true
            });
        }

        let apiKey;
        try {
            const keyName = isGuest ? 'GUEST_TAVILY_API_KEY' : 'TAVILY_API_KEY';
            apiKey = getRequiredEnv(keyName);
            console.log(`🔑 [SEARCH] Using ${keyName} (${apiKey.substring(0, 8)}...)`);
        } catch {
            console.error(`❌ [SEARCH] API Key for ${isGuest ? 'guest' : 'standard'} is missing or empty`);
            return jsonError('Search API key not configured', 500);
        }

        console.log('📡 [SEARCH] Calling Tavily API...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch('https://api.tavily.com/search', {
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

        clearTimeout(timeoutId);
        const data = await response.json();
        console.log('📥 [SEARCH] Tavily Response Status:', response.status);

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
