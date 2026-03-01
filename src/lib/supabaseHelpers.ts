type SupabaseLikeError = {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
};

type SupabaseLikeResult<T = unknown> = {
    data?: T | null;
    error?: SupabaseLikeError | null;
};

export function formatAndLogSupabaseError(err: SupabaseLikeError | null | undefined): { ui: string } {
    // Always log full error for debugging
    console.error('Supabase Error:', err);

    if (!err) {
        return { ui: 'Ocurrió un error desconocido.' };
    }

    // Supabase errors often have message, details, hint, code
    const parts: string[] = [];
    if (err.message) parts.push(String(err.message));
    if (err.details) parts.push(String(err.details));
    if (err.hint) parts.push(String(err.hint));
    if (err.code) parts.push(`code: ${String(err.code)}`);

    const ui = parts.length ? parts.join(' — ') : JSON.stringify(err);
    return { ui };
}

export function formatAndLogSupabaseResult<T = unknown>(result: SupabaseLikeResult<T> | null | undefined): { ui: string | null } {
    // result may be { data, error }
    if (!result) return { ui: null };
    if (result.error) return formatAndLogSupabaseError(result.error);
    return { ui: null };
}
