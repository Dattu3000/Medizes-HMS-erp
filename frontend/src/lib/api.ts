/** Centralized API base URL.
 *  All frontend fetch() calls will route through this.
 *  In production, set NEXT_PUBLIC_API_URL to your domain (e.g. https://api.yourdomain.com)
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
