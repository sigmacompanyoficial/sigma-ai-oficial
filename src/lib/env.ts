import 'server-only';

/**
 * Centralized env access with lightweight validation.
 * Keep server-only secrets on the server (do not expose via NEXT_PUBLIC_).
 */

export function getOptionalEnv(name: string, fallback: string | undefined = undefined): string | undefined {
    const v = process.env[name];
    if (v === undefined || v === null || v === '') return fallback;
    return v;
}

export function getRequiredEnv(name: string): string {
    const v = process.env[name];
    if (v === undefined || v === null || v === '') {
        const err = new Error(`Missing required environment variable: ${name}`) as Error & { code?: string };
        err.code = 'ENV_MISSING';
        throw err;
    }
    return v;
}

export function getIntEnv(name: string, fallback: number): number {
    const raw = getOptionalEnv(name);
    if (raw === undefined) return fallback;
    const n = Number.parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : fallback;
}

export function getPublicSiteUrl(): string {
    // Used as Referer for OpenRouter (recommended)
    return getOptionalEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
}
