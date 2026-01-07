async function sendDeleteRequest(email: string, env: Env): Promise<boolean> {
  const apiResponse = await fetch(`${env.API_URL}/users/deletions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-API-Secret': env.INTERNAL_API_SECRET,
    },
    body: JSON.stringify({ email }),
  });

  if (!apiResponse.ok) {
    const error = await apiResponse.json() as {code: number, messages?: Record<string, string>, message?: string}
    if (error.code === 400 && error?.messages) {
        const message = Object.values(error.messages).join('\n')
        throw new Error(message)
    }

    throw new Error(error.message)
  }

  return apiResponse.json();
}

export default {
    async fetch(request: Request, env: Env) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': env.CORS_ALLOW_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, POST, OPTION',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

    try {
        if(request.url.includes('/deletion-requests')) {
            const {email} = await request.json() as {email: string};
            const result = await sendDeleteRequest(email, env);
            return new Response(
                JSON.stringify(result),
                {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              );
        }

        return new Response(
            JSON.stringify({code: 400, error: 'Invalid request', message: 'Yêu cầu không hợp lệ'}),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
    } catch (error) {
        const err = error as Error;
        return new Response(
            JSON.stringify({ code: 500, error: 'Internal server error', message: err.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }
  };
