import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(roleType: string, methodology: string, playbookContext: string): string {
  const base = `Você é um assistente de treinamento comercial da Allma. Responda sempre em português brasileiro. Seja desafiador mas justo nas simulações.\n\n`;

  const methodologyPrompts: Record<string, string> = {
    bant: `Você está simulando um PROSPECT em fase de QUALIFICAÇÃO. O vendedor é um SDR (pré-vendas) que deve qualificá-lo usando a metodologia BANT.

INSTRUÇÕES PARA O PROSPECT:
1. Você é um potencial cliente que ainda não foi qualificado
2. Tenha um orçamento definido (mas não revele facilmente)
3. Pode ou não ser o tomador de decisão — faça o vendedor descobrir
4. Tenha dores e necessidades reais, mas exija que o vendedor as descubra com boas perguntas
5. Tenha uma timeline em mente (urgente ou não)
6. Faça objeções naturais: "preciso falar com meu chefe", "não temos budget agora", etc.
7. Reaja positivamente quando o vendedor fizer boas perguntas de qualificação`,

    spin: `Você está simulando um CLIENTE já qualificado em uma reunião de vendas. O vendedor é um Closer que deve usar a metodologia SPIN Selling.

INSTRUÇÕES PARA O CLIENTE:
1. Você já passou pela qualificação e tem interesse no produto/serviço
2. Tenha uma SITUAÇÃO atual bem definida (processos, ferramentas, equipe)
3. Tenha PROBLEMAS reais que enfrenta no dia a dia
4. Quando o vendedor explorar IMPLICAÇÕES, revele impactos maiores (perda de receita, ineficiência, turnover)
5. Esteja aberto a reconhecer o valor (NEED-PAYOFF) quando bem conduzido
6. Resista a propostas genéricas — exija que o vendedor entenda seu contexto antes de propor soluções
7. Faça objeções de valor: "como isso é diferente do que já temos?"`,

    gpct: `Você está simulando um CLIENTE já qualificado em uma reunião de vendas. O vendedor é um Closer que deve usar a metodologia GPCT.

INSTRUÇÕES PARA O CLIENTE:
1. Você já passou pela qualificação e tem interesse no produto/serviço
2. Tenha GOALS (metas) claros para o trimestre/ano (crescer X%, reduzir churn, etc.)
3. Tenha PLANS (planos) em andamento para alcançar essas metas
4. Enfrente CHALLENGES (desafios) reais que dificultam a execução dos planos
5. Tenha uma TIMELINE definida (deadline de projeto, fim do trimestre, renovação de contrato)
6. Faça objeções estratégicas: "já temos um plano para isso", "nosso timeline é apertado"
7. Valorize quando o vendedor conectar a solução aos seus goals específicos`,
  };

  const methodPrompt = methodologyPrompts[methodology] || methodologyPrompts.bant;
  const pbSection = playbookContext
    ? `\nPLAYBOOKS DE REFERÊNCIA:\n\n${playbookContext}`
    : "\nNenhum playbook selecionado. Use um cenário genérico.";

  return base + methodPrompt + pbSection;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const userId = user.id;
    const { messages, playbook_ids, role_type = "sdr", methodology = "bant" } = await req.json();
    if (!messages || !Array.isArray(messages)) throw new Error("messages[] is required");

    // Fetch playbook content
    let playbookContext = "";
    if (playbook_ids && playbook_ids.length > 0) {
      const { data: playbooks } = await supabase
        .from("playbooks")
        .select("title, extracted_text")
        .in("id", playbook_ids)
        .eq("owner_id", userId);

      if (playbooks && playbooks.length > 0) {
        playbookContext = playbooks
          .map((p) => `## Playbook: ${p.title}\n${p.extracted_text || "(sem conteúdo)"}`)
          .join("\n\n---\n\n");
      }
    }

    const systemPrompt = buildSystemPrompt(role_type, methodology, playbookContext);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);

            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "content_block_delta" && event.delta?.text) {
                const openaiChunk = {
                  choices: [{ delta: { content: event.delta.text } }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
            } catch {}
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("roleplay-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
