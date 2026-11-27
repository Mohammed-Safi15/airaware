export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAQ_API_KEY?: string;
  CPCB_API_KEY?: string;
  AI: Ai;
  ENVIRONMENT: string;
  /**
   * Comma-separated list of extra browser origins allowed to call the API
   * cross-origin (e.g. the deployed frontend: `https://app.pages.dev`,
   * `https://foo.vercel.app`). The dev origin `http://localhost:5173` is
   * always allowed. Leave unset for a dev-only deployment.
   */
  ALLOWED_ORIGIN?: string;
}
