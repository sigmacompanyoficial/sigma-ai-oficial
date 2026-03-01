// @ts-nocheck
export function formatAndLogSupabaseError(err) {
    // Always log full error for debugging
    console.error('Supabase Error:', err);

    if (!err) {
        return { ui: 'Ocurrió un error desconocido.' };
    }

    // Supabase errors often have message, details, hint, code
    const parts = [];
    if (err.message) parts.push(String(err.message));
    if (err.details) parts.push(String(err.details));
    if (err.hint) parts.push(String(err.hint));
    if (err.code) parts.push(`code: ${String(err.code)}`);

    const ui = parts.length ? parts.join(' — ') : JSON.stringify(err);
    return { ui };
}

export function formatAndLogSupabaseResult(result) {
    // result may be { data, error }
    if (!result) return { ui: null };
    if (result.error) return formatAndLogSupabaseError(result.error);
    return { ui: null };
}
