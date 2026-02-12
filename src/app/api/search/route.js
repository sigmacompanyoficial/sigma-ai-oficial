import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/env';

function jsonError(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
    try {
        const { query } = await req.json();
        console.log('🌐 [SEARCH] Tavily Request for:', query);

        if (!query) {
            console.warn('⚠️ [SEARCH] No query provided');
            return jsonError('Query required', 400);
        }

        let apiKey;
        try {
            apiKey = getRequiredEnv('TAVILY_API_KEY');
        } catch {
            console.error('❌ [SEARCH] TAVILY_API_KEY is missing');
            return jsonError('Search API key not configured', 500);
        }

        console.log('📡 [SEARCH] Calling Tavily API...');

        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "basic",
                include_answer: true,
                max_results: 5
            })
        });

        const data = await response.json();
        console.log('📥 [SEARCH] Tavily Response Status:', response.status);

        if (!response.ok) {
            console.error('❌ [SEARCH] Tavily API Error:', data);
            return jsonError('Error calling search service', response.status);
        }

        // Tavily usually provides a direct 'answer' if requested, or results
        let finalResult = '';

        if (data.answer) {
            finalResult = data.answer;
            console.log('✅ [SEARCH] Tavily provided a direct answer.');
        } else if (data.results && data.results.length > 0) {
            // Concatenate titles and snippets for context
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

        return NextResponse.json({
            success: true,
            result: finalResult,
            source: 'Tavily'
        });

    } catch (error) {
        console.error('💥 [SEARCH] Critical Error:', error);
        return jsonError('Error interno al procesar la búsqueda', 500);
    }
}
