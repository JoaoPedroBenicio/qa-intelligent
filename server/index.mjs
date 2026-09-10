const MODEL = 'meta/llama-3.1-70b-instruct';
const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/generate') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
    if (!env.NVIDIA_API_KEY) return json({ error: 'A IA ainda não está configurada.' }, 503);
    try {
      const input = await request.json();
      if (!input || typeof input.text !== 'string' || input.text.length > 12000) return json({ error: 'Envie uma descrição de até 12 mil caracteres.' }, 400);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.NVIDIA_API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'Você é especialista em QA. Responda apenas JSON válido.' },
            { role: 'user', content: `Crie um caso de teste de QA para: ${input.text}. Use {title,description,preconditions,priority,tags,environment,mode,verdict,steps}; cada passo possui action e expected. mode deve ser video e verdict NEEDS_REVIEW.` },
          ],
          temperature: 0.2,
          max_tokens: 1400,
        }),
      });
      if (!response.ok) return json({ error: 'O serviço de IA não respondeu. Tente novamente.' }, 502);
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') return json({ error: 'A IA retornou uma resposta inválida.' }, 502);
      return json(JSON.parse(content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')));
    } catch {
      return json({ error: 'Não foi possível interpretar a resposta da IA.' }, 502);
    }
  },
};
