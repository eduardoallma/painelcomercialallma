import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLIENT_PROFILES = [
  {
    name: "Ricardo Mendes",
    role: "Dono / Diretor",
    company: "FitLife Academia",
    segment: "Fitness / Academias",
    revenue: "R$1.2M/ano",
    teamSize: "12 pessoas",
    pains: [
      "Gasta R$5k/mês em Meta Ads sem controle de CAC",
      "Não sabe qual campanha realmente traz novos alunos",
      "Landing page genérica com taxa de conversão abaixo de 2%",
      "Concorrência local investindo pesado em tráfego pago",
    ],
    urgency: "Alta — época de matrículas começa em 2 meses",
    objections: [
      "Já tentei impulsionar posts e não funcionou",
      "Meu sobrinho cuida das redes, não sei se preciso de agência",
      "Meu ticket é baixo, não sei se compensa investir em tráfego",
    ],
  },
  {
    name: "Camila Ferreira",
    role: "Sócia-proprietária",
    company: "Dra. Camila Estética",
    segment: "Clínica de estética",
    revenue: "R$3M/ano",
    teamSize: "18 pessoas",
    pains: [
      "90% dos clientes vêm por indicação — crescimento estagnado",
      "Tentou Google Ads sozinha e gastou R$8k sem resultado",
      "Não tem pixel instalado nem rastreamento de conversões",
      "Não sabe a diferença entre campanha de alcance e conversão",
    ],
    urgency: "Média — quer dobrar o faturamento em 12 meses",
    objections: [
      "Já queimei dinheiro com marketing digital antes",
      "Minha recepcionista não dá conta de atender muitos leads",
      "Tenho medo de atrair paciente que só quer preço baixo",
    ],
  },
  {
    name: "Felipe Andrade",
    role: "Head de Marketing",
    company: "EduPlus Cursos",
    segment: "Educação online",
    revenue: "R$8M/ano",
    teamSize: "35 pessoas",
    pains: [
      "CPL no Google Search acima de R$45 — meta é R$25",
      "Funil de remarketing inexistente, perde leads quentes",
      "Equipe interna júnior, sem expertise em mídia paga",
      "Concorrentes como Hotmart e Udemy dominam os leilões",
    ],
    urgency: "Alta — lançamento de curso novo em 6 semanas",
    objections: [
      "Já temos uma pessoa interna que faz isso",
      "Nosso LTV é longo, difícil provar ROI no curto prazo",
      "Preciso aprovar com o CEO antes de qualquer decisão",
    ],
  },
  {
    name: "Patrícia Duarte",
    role: "Gerente Comercial",
    company: "CasaNova Imóveis",
    segment: "Imobiliária",
    revenue: "R$15M/ano",
    teamSize: "40 pessoas (20 corretores)",
    pains: [
      "Leads do Meta Ads desqualificados — corretores reclamam diariamente",
      "Formulário genérico sem qualificação prévia",
      "Não segmenta campanhas por tipo de imóvel ou faixa de renda",
      "Taxa de conversão lead→visita abaixo de 3%",
    ],
    urgency: "Alta — diretoria cobrando resultado este trimestre",
    objections: [
      "Meus corretores dizem que os leads de internet não prestam",
      "Já trabalhamos com uma agência e não deu certo",
      "O mercado imobiliário é diferente, tráfego pago não funciona pra gente",
    ],
  },
  {
    name: "Marcos Oliveira",
    role: "CEO",
    company: "PetShop Mais",
    segment: "Varejo pet / E-commerce",
    revenue: "R$5M/ano",
    teamSize: "22 pessoas",
    pains: [
      "E-commerce com ROAS abaixo de 2x no Meta Ads",
      "Não usa catálogo dinâmico nem lookalike de compradores",
      "Carrinho abandonado sem automação de recuperação",
      "Google Shopping mal configurado, CPC altíssimo",
    ],
    urgency: "Média — quer escalar antes da Black Friday",
    objections: [
      "Marketplace já me dá venda, por que investir em site próprio?",
      "Meu ticket médio é R$120, será que fecha conta?",
      "Já tentei Google Shopping e o custo comeu toda a margem",
    ],
  },
  {
    name: "Juliana Rocha",
    role: "VP de Growth",
    company: "TechSaaS Pro",
    segment: "SaaS B2B",
    revenue: "R$25M/ano",
    teamSize: "80 pessoas",
    pains: [
      "Custo por trial no LinkedIn Ads acima de R$200",
      "Conversão trial→pago em apenas 8% (meta é 15%)",
      "Google Ads traz leads B2C que não convertem",
      "Sem estratégia de ABM nem retargeting por estágio do funil",
    ],
    urgency: "Alta — board cobrando eficiência de CAC neste quarter",
    objections: [
      "Nosso ciclo de venda é longo, difícil atribuir ao tráfego",
      "Já temos um time interno de growth, por que contratar fora?",
      "LinkedIn Ads é caro demais, estamos pensando em cortar",
    ],
  },
  {
    name: "Eduardo Campos",
    role: "Diretor de Marketing",
    company: "Construtora Horizonte",
    segment: "Construção civil / Incorporadora",
    revenue: "R$60M/ano",
    teamSize: "150 pessoas",
    pains: [
      "Investe R$80k/mês em tráfego sem dashboard unificado",
      "Não mede atribuição — não sabe se a venda veio do Google ou do stand",
      "Agência atual entrega relatório de vaidade (impressões e cliques)",
      "Cada empreendimento tem campanha separada sem estratégia integrada",
    ],
    urgency: "Média — lançamento de novo empreendimento em 4 meses",
    objections: [
      "Já temos agência, por que trocar?",
      "Imóvel de alto padrão não se vende por clique",
      "Nosso processo de decisão envolve o conselho, é demorado",
    ],
  },
  {
    name: "Ana Carolina Lima",
    role: "Fundadora / CEO",
    company: "FoodExpress Delivery",
    segment: "Alimentação / Delivery",
    revenue: "R$12M/ano",
    teamSize: "55 pessoas",
    pains: [
      "Dependência total do iFood — paga 27% de comissão",
      "Quer canal próprio mas não sabe estruturar tráfego para app/site",
      "Tentou panfletagem digital (impulsionamento) sem estratégia",
      "Sem CRM nem automação para base de clientes existente",
    ],
    urgency: "Alta — margem sendo corroída pelo iFood mês a mês",
    objections: [
      "Meu cliente já está no iFood, por que ele viria pro meu app?",
      "Não tenho equipe pra gerenciar mais um canal",
      "O investimento inicial me assusta, e se não der retorno?",
    ],
  },
  {
    name: "Beatriz Monteiro",
    role: "Diretora de E-commerce",
    company: "ModaViva E-commerce",
    segment: "Moda feminina",
    revenue: "R$35M/ano",
    teamSize: "70 pessoas",
    pains: [
      "Escala travada em Meta Ads — CPA subindo 15% ao mês",
      "Sem estratégia de criativos, usa as mesmas peças há 6 meses",
      "Público lookalike saturado, frequência acima de 5",
      "TikTok Ads não decolou, investiu R$20k sem aprender",
    ],
    urgency: "Alta — coleção nova em 3 semanas, precisa de tração",
    objections: [
      "Já gastamos muito em agência e o resultado caiu igual",
      "Nosso time de design não dá conta de produzir criativos no volume necessário",
      "Como vocês vão resolver algo que nossa equipe interna não conseguiu?",
    ],
  },
  {
    name: "Carlos Henrique Souza",
    role: "Diretor Comercial",
    company: "AutoPeças Nacional",
    segment: "Autopeças B2B",
    revenue: "R$100M/ano",
    teamSize: "200 pessoas",
    pains: [
      "Marketing digital praticamente inexistente — 100% via representantes",
      "Site institucional sem geração de demanda",
      "Concorrentes menores ganhando mercado com Google Ads e SEO",
      "Não tem nem Google Analytics configurado corretamente",
    ],
    urgency: "Baixa — reconhece a necessidade mas não tem pressa",
    objections: [
      "Nosso negócio é relacional, não se vende autopeça por clique",
      "Nossos vendedores não vão aceitar leads de internet",
      "Preciso ver cases do nosso segmento específico antes de investir",
    ],
  },
];

function getRandomProfile(messages: any[]): typeof CLIENT_PROFILES[0] {
  const idx = messages.length <= 1
    ? Math.floor(Math.random() * CLIENT_PROFILES.length)
    : Math.abs(JSON.stringify(messages[0]).length) % CLIENT_PROFILES.length;
  return CLIENT_PROFILES[idx];
}

function buildProfileBlock(profile: typeof CLIENT_PROFILES[0]): string {
  return `
PERFIL DO CLIENTE (interprete este personagem):
Nome: ${profile.name}
Cargo: ${profile.role}
Empresa: ${profile.company}
Segmento: ${profile.segment}
Faturamento: ${profile.revenue}
Equipe: ${profile.teamSize}
Dores:
${profile.pains.map((p) => `- ${p}`).join("\n")}
Urgência: ${profile.urgency}
Objeções típicas que você deve usar naturalmente na conversa:
${profile.objections.map((o) => `- "${o}"`).join("\n")}
`;
}

function buildSystemPrompt(roleType: string, methodology: string, playbookContext: string, messages: any[]): string {
  const base = `Você é um assistente de treinamento comercial da Allma. Responda sempre em português brasileiro. Seja desafiador mas justo nas simulações.\n\n`;

  const profile = getRandomProfile(messages);
  const profileBlock = buildProfileBlock(profile);

  const sdrObjective = `
OBJETIVO DA SIMULAÇÃO (SDR — Pré-vendas):
- Você é um PROSPECT que ainda NÃO agendou reunião.
- O vendedor (SDR) precisa convencê-lo a agendar uma reunião com o closer/especialista.
- NÃO aceite a reunião facilmente. Exija que o SDR demonstre que entende seu problema antes de aceitar.
- Se o SDR fizer boas perguntas e gerar valor, aceite agendar a reunião.
- Se o SDR for genérico ou empurrar reunião sem contexto, recuse educadamente.
`;

  const closerObjective = `
OBJETIVO DA SIMULAÇÃO (Closer — Vendas):
- Você é um CLIENTE que já foi qualificado pelo SDR e está em reunião de vendas.
- Você tem interesse mas HESITA em fechar o contrato.
- Faça objeções de preço, ROI, concorrência, timing e necessidade de aprovação interna.
- Se o closer conduzir bem a conversa e resolver suas objeções, demonstre abertura para fechar.
- Se o closer for superficial ou não conectar a solução às suas dores, resista ao fechamento.
`;

  const methodologyPrompts: Record<string, string> = {
    bant: `Você está simulando um PROSPECT em fase de QUALIFICAÇÃO. O vendedor é um SDR (pré-vendas) que deve qualificá-lo usando a metodologia BANT.

INSTRUÇÕES PARA O PROSPECT:
1. Você é um potencial cliente que ainda não foi qualificado
2. Tenha um orçamento definido (mas não revele facilmente)
3. Pode ou não ser o tomador de decisão — faça o vendedor descobrir
4. Tenha dores e necessidades reais, mas exija que o vendedor as descubra com boas perguntas
5. Tenha uma timeline em mente (urgente ou não)
6. Faça objeções naturais usando as objeções do seu perfil
7. Reaja positivamente quando o vendedor fizer boas perguntas de qualificação
${sdrObjective}`,

    spin: `Você está simulando um CLIENTE já qualificado em uma reunião de vendas. O vendedor é um Closer que deve usar a metodologia SPIN Selling.

INSTRUÇÕES PARA O CLIENTE:
1. Você já passou pela qualificação e tem interesse no produto/serviço
2. Tenha uma SITUAÇÃO atual bem definida (use os dados do seu perfil)
3. Tenha PROBLEMAS reais que enfrenta no dia a dia (use as dores do perfil)
4. Quando o vendedor explorar IMPLICAÇÕES, revele impactos maiores (perda de receita, ineficiência)
5. Esteja aberto a reconhecer o valor (NEED-PAYOFF) quando bem conduzido
6. Resista a propostas genéricas — exija que o vendedor entenda seu contexto antes de propor soluções
7. Use as objeções do seu perfil naturalmente
${closerObjective}`,

    gpct: `Você está simulando um CLIENTE já qualificado em uma reunião de vendas. O vendedor é um Closer que deve usar a metodologia GPCT.

INSTRUÇÕES PARA O CLIENTE:
1. Você já passou pela qualificação e tem interesse no produto/serviço
2. Tenha GOALS (metas) claros baseados no seu perfil
3. Tenha PLANS (planos) em andamento para alcançar essas metas
4. Enfrente CHALLENGES (desafios) reais — use as dores do seu perfil
5. Tenha uma TIMELINE definida baseada na urgência do seu perfil
6. Use as objeções do seu perfil naturalmente
7. Valorize quando o vendedor conectar a solução aos seus goals específicos
${closerObjective}`,
  };

  const methodPrompt = methodologyPrompts[methodology] || methodologyPrompts.bant;
  const pbSection = playbookContext
    ? `\nPLAYBOOKS DE REFERÊNCIA:\n\n${playbookContext}`
    : "\nNenhum playbook selecionado. Use um cenário genérico de agência de marketing digital/tráfego pago.";

  return base + profileBlock + "\n" + methodPrompt + pbSection;
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

    const systemPrompt = buildSystemPrompt(role_type, methodology, playbookContext, messages);

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
