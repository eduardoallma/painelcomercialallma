import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    // Fetch the session
    const { data: session, error: sessionError } = await supabase
      .from("roleplay_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("owner_id", user.id)
      .single();

    if (sessionError || !session) throw new Error("Sessão não encontrada");

    const messages = session.messages as Array<{ role: string; content: string }>;
    if (!messages || messages.length < 2) {
      throw new Error("A sessão precisa ter pelo menos 2 mensagens para ser avaliada");
    }

    const transcript = messages
      .map((m) => `${m.role === "user" ? "VENDEDOR" : "CLIENTE/IA"}: ${m.content}`)
      .join("\n\n");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const evaluationPrompt = `Você é um avaliador especialista em pré-vendas usando a metodologia BANT (Budget, Authority, Need, Timeline).

Avalie o desempenho do VENDEDOR na transcrição abaixo. Analise cada pilar da metodologia BANT:

**B - Budget (Orçamento):** O vendedor explorou o orçamento do prospect? Entendeu a capacidade de investimento?
**A - Authority (Autoridade):** O vendedor identificou o tomador de decisão? Mapeou o processo de aprovação?
**N - Need (Necessidade):** O vendedor descobriu as dores e necessidades reais do prospect? Fez perguntas de qualificação?
**T - Timeline (Prazo):** O vendedor entendeu a urgência? Definiu próximos passos e cronograma?

TRANSCRIÇÃO:
${transcript}

Responda EXATAMENTE no seguinte formato JSON (sem markdown, sem code blocks):
{
  "score": <número de 0 a 10>,
  "summary": "<resumo geral em 2-3 frases>",
  "budget": {"score": <0-10>, "feedback": "<análise do pilar Budget>"},
  "authority": {"score": <0-10>, "feedback": "<análise do pilar Authority>"},
  "need": {"score": <0-10>, "feedback": "<análise do pilar Need>"},
  "timeline": {"score": <0-10>, "feedback": "<análise do pilar Timeline>"},
  "improvements": ["<sugestão 1>", "<sugestão 2>", "<sugestão 3>"]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: evaluationPrompt }],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Anthropic error:", response.status, t);
      throw new Error("Erro no serviço de IA");
    }

    const result = await response.json();
    const content = result.content?.[0]?.text || "";

    // Parse the JSON from Claude's response
    let evaluation;
    try {
      evaluation = JSON.parse(content);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Formato de avaliação inválido");
      }
    }

    const score = Math.min(10, Math.max(0, Math.round(evaluation.score)));
    const bantFeedback = JSON.stringify(evaluation);

    // Update the session with the evaluation
    const { error: updateError } = await supabase
      .from("roleplay_sessions")
      .update({ score, bant_feedback: bantFeedback })
      .eq("id", session_id)
      .eq("owner_id", user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ score, evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-roleplay error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
