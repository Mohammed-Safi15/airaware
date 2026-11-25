export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAQ_API_KEY?: string;
  CPCB_API_KEY?: string;
  AI: Ai;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/api/health") {
      return Response.json(
        {
          status: "healthy",
          service: "airaware-worker",
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || "production",
        },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      { error: "Not Found", endpoint: url.pathname },
      { status: 404, headers: corsHeaders }
    );
  },
};
