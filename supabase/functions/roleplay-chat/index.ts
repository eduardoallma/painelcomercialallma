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

    const userId = user.id;

    const { messages, playbook_ids } = await req.json();
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

    const systemPrompt = `Você é um assistente de treinamento comercial da Allma. Seu papel é fazer roleplay de vendas com o usuário.

INSTRUÇÕES:
1. Simule ser um cliente/prospect realista baseado nos playbooks fornecidos
2. Faça objeções naturais que um cliente real faria
3. Após o roleplay, avalie o desempenho do vendedor com feedback construtivo
4. Use o conteúdo dos playbooks como base para cenários e avaliações
5. Responda sempre em português brasileiro
6. Seja desafiador mas justo nas simulações

${playbookContext ? `PLAYBOOKS DE REFERÊNCIA:\n\n${playbookContext}` : "Nenhum playbook selecionado. Faça roleplay genérico de vendas."}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
