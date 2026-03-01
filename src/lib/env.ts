// @ts-nocheck
import 'server-only';

/**
 * Centralized env access with lightweight validation.
 * Keep server-only secrets on the server (do not expose via NEXT_PUBLIC_).
 */

export function getOptionalEnv(name, fallback = undefined) {
    const v = process.env[name];
    if (v === undefined || v === null || v === '') return fallback;
    return v;
}

export function getRequiredEnv(name) {
    const v = process.env[name];
    if (v === undefined || v === null || v === '') {
        const err = new Error(`Missing required environment variable: ${name}`);
        err.code = 'ENV_MISSING';
        throw err;
    }
    return v;
}

export function getIntEnv(name, fallback) {
    const raw = getOptionalEnv(name);
    if (raw === undefined) return fallback;
    const n = Number.parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : fallback;
}

export function getPublicSiteUrl() {
    // Used as Referer for OpenRouter (recommended)
    return getOptionalEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
}

