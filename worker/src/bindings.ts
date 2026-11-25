export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAQ_API_KEY?: string;
  CPCB_API_KEY?: string;
  AI: Ai;
  ENVIRONMENT: string;
}
