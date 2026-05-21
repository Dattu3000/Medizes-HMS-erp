/** Centralized API base URL.
 *  All frontend fetch() calls will route through this.
 *  In production, set NEXT_PUBLIC_API_URL to your domain (e.g. https://api.yourdomain.com)
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Medisys HMS v6.0 — Secure API Fetch Wrapper
 *
 * Wraps the standard fetch() to intercept tenant isolation violations
 * (HTTP 403 with X-Tenant-Violation header) and trigger a security
 * boundary alert in the UI instead of failing silently.
 */
export const apiFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    // Detect tenant isolation violations from the security perimeter
    if (res.status === 403 && res.headers.get('X-Tenant-Violation') === 'true') {
        // Dispatch a custom DOM event for the SecurityBoundary to catch
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('tenant-violation', {
                    detail: {
                        url,
                        status: res.status,
                        message: 'Cross-branch access attempt detected and blocked.',
                    },
                })
            );
        }
    }

    return res;
};
