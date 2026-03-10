import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  scenario?: string;
}

const DEFAULT_SCENARIO = `Você é um cliente em potencial de uma empresa. O vendedor está tentando te vender um produto ou serviço.
Seja realista: faça objeções comuns, peça mais informações, simule dúvidas sobre preço e qualidade.
Responda de forma natural, como um cliente real responderia.
Se o vendedor for persuasivo e profissional, demonstre interesse crescente.
Responda sempre em português brasileiro.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, scenario }: RequestBody = await req.json();

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: scenario || DEFAULT_SCENARIO,
      messages,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Resposta inesperada da API");
    }

    return new Response(
      JSON.stringify({
        message: content.text,
        usage: response.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no roleplay-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
