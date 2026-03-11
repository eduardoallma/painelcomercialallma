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
    personality: "Direto, impaciente, fala rápido. Não gosta de enrolação. Se o vendedor demorar para chegar ao ponto, encurta a conversa.",
    trafficInvestment: "Entre R$ 1.000 e R$ 3.000",
    trafficResult: "Não trouxe nenhum retorno",
    mainChallenge: "Falta de previsibilidade",
    pains: [
      "Gasta em Meta Ads mas não sabe o CAC real",
      "Não sabe qual campanha realmente traz novos alunos",
      "Concorrência local investindo pesado e aparecendo mais",
      "Sente que joga dinheiro fora todo mês",
    ],
    budget: { range: "R$3k a R$8k/mês", willingness: "Tem caixa mas precisa ver lógica antes de investir mais" },
    authority: "Decide sozinho, mas consulta a esposa que também é sócia",
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
    personality: "Cautelosa, analítica, faz muitas perguntas. Já se queimou antes e não vai se comprometer fácil.",
    trafficInvestment: "Entre R$ 1.000 e R$ 3.000",
    trafficResult: "Não trouxe nenhum retorno",
    mainChallenge: "Receio de investir mais em Tráfego, sem segurança de resultados",
    pains: [
      "90% dos clientes vêm por indicação — crescimento estagnado",
      "Gastou R$8k em Google Ads sozinha sem resultado",
      "Não tem pixel instalado nem rastreamento de conversões",
      "Medo de atrair paciente que só quer preço baixo",
    ],
    budget: { range: "R$5k a R$15k/mês", willingness: "Tem recurso mas está com pé atrás por experiência anterior" },
    authority: "Decide sozinha na clínica, mas quer validar com o marido que é financeiro",
    urgency: "Média — quer dobrar o faturamento em 12 meses",
    objections: [
      "Já queimei dinheiro com marketing digital antes",
      "Minha recepcionista não dá conta de atender muitos leads",
      "Como eu vou saber que dessa vez vai ser diferente?",
    ],
  },
  {
    name: "Felipe Andrade",
    role: "Head de Marketing",
    company: "EduPlus Cursos",
    segment: "Educação online",
    revenue: "R$8M/ano",
    teamSize: "35 pessoas",
    personality: "Técnico, conhece métricas e jargão. Testa o vendedor para ver se realmente entende. Se perceber superficialidade, perde o interesse.",
    trafficInvestment: "Entre R$ 3.000 e R$ 15.000",
    trafficResult: "Sim, mas menos do que gostaria",
    mainChallenge: "Dificuldade em contratar e reter um Time de Marketing qualificado",
    pains: [
      "CPL no Google Search acima de R$45 — meta é R$25",
      "Funil de remarketing inexistente, perde leads quentes",
      "Equipe interna júnior, sem expertise em mídia paga",
      "Concorrentes dominam os leilões",
    ],
    budget: { range: "R$20k a R$50k/mês em mídia", willingness: "Orçamento aprovado, mas precisa justificar alocação para o CEO" },
    authority: "Influencia fortemente mas o CEO assina contratos acima de R$10k/mês",
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
    personality: "Pragmática e orientada a resultado. Fala a língua de vendas. Se não falar em números rápido, acha perda de tempo.",
    trafficInvestment: "Entre R$ 3.000 e R$ 15.000",
    trafficResult: "Sim, mas menos do que gostaria",
    mainChallenge: "Falta de previsibilidade",
    pains: [
      "Leads do Meta Ads desqualificados — corretores reclamam",
      "Formulário genérico sem qualificação prévia",
      "Não segmenta campanhas por tipo de imóvel ou faixa de renda",
      "Taxa de conversão lead→visita abaixo de 3%",
    ],
    budget: { range: "R$15k a R$30k/mês", willingness: "Diretoria já aprovou verba mas quer ver plano concreto" },
    authority: "Gerencia o orçamento de marketing mas a diretoria aprova contratos novos",
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
    personality: "Empreendedor entusiasmado mas disperso. Pula de assunto. Precisa que o vendedor mantenha o foco.",
    trafficInvestment: "Até R$ 1.000",
    trafficResult: "Não trouxe nenhum retorno",
    mainChallenge: "Dependência de indicações para fechar novas vendas",
    pains: [
      "E-commerce com ROAS ruim no Meta Ads",
      "Não usa catálogo dinâmico nem lookalike",
      "Carrinho abandonado sem automação de recuperação",
      "Sente que está perdendo pra concorrente que aparece mais",
    ],
    budget: { range: "R$5k a R$12k/mês", willingness: "Quer investir mas tem medo de não ter retorno rápido" },
    authority: "Decide sozinho, é o dono",
    urgency: "Média — quer escalar antes da Black Friday",
    objections: [
      "Marketplace já me dá venda, por que investir em site próprio?",
      "Meu ticket médio é R$120, será que fecha conta?",
      "Já tentei e o custo comeu toda a margem",
    ],
  },
  {
    name: "Juliana Rocha",
    role: "VP de Growth",
    company: "TechSaaS Pro",
    segment: "SaaS B2B",
    revenue: "R$25M/ano",
    teamSize: "80 pessoas",
    personality: "Estratégica, fala pouco e escuta muito. Respostas curtas. Valoriza dados e cases concretos.",
    trafficInvestment: "Acima de R$ 15.000",
    trafficResult: "Sim, mas menos do que gostaria",
    mainChallenge: "Dificuldade em contratar e reter um Time de Marketing qualificado",
    pains: [
      "Custo por trial no LinkedIn Ads acima de R$200",
      "Conversão trial→pago em apenas 8% (meta é 15%)",
      "Google Ads traz leads B2C que não convertem",
      "Sem estratégia de ABM nem retargeting por estágio do funil",
    ],
    budget: { range: "R$30k a R$80k/mês", willingness: "Verba existe mas o board quer ver eficiência antes de escalar" },
    authority: "Tem autonomia até R$50k/mês, acima disso precisa do board",
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
    personality: "Corporativo e político. Fala com cuidado, nunca se compromete na primeira conversa. Sempre menciona outras pessoas que precisam ser envolvidas.",
    trafficInvestment: "Acima de R$ 15.000",
    trafficResult: "Sim, mas menos do que gostaria",
    mainChallenge: "Falta de previsibilidade",
    pains: [
      "Investe R$80k/mês em tráfego sem dashboard unificado",
      "Não mede atribuição — não sabe se a venda veio do Google ou do stand",
      "Agência atual entrega relatório de vaidade (impressões e cliques)",
      "Cada empreendimento tem campanha separada sem estratégia integrada",
    ],
    budget: { range: "R$50k a R$120k/mês", willingness: "Orçamento existe mas realocar de agência atual é processo interno" },
    authority: "Influenciador — decisão final é do conselho com o diretor financeiro",
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
    personality: "Apaixonada pelo negócio, emocional. Fala muito sobre a história da empresa. Precisa sentir confiança no vendedor como pessoa antes de falar de negócio.",
    trafficInvestment: "Até R$ 1.000",
    trafficResult: "Não trouxe nenhum retorno",
    mainChallenge: "Receio de investir mais em Tráfego, sem segurança de resultados",
    pains: [
      "Dependência total do iFood — paga 27% de comissão",
      "Quer canal próprio mas não sabe estruturar tráfego",
      "Só fez impulsionamento sem estratégia",
      "Sem CRM nem automação para base de clientes existente",
    ],
    budget: { range: "R$8k a R$20k/mês", willingness: "Investiria se sentisse segurança, mas tem trauma de experiência ruim" },
    authority: "Decide sozinha, é a fundadora",
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
    personality: "Exigente e acelerada. Já trabalhou com várias agências e tem expectativa alta. Cobra resultados desde a primeira conversa.",
    trafficInvestment: "Acima de R$ 15.000",
    trafficResult: "Sim, mas menos do que gostaria",
    mainChallenge: "Todas as opções acima",
    pains: [
      "Escala travada em Meta Ads — CPA subindo todo mês",
      "Sem estratégia de criativos, usa as mesmas peças há meses",
      "Público lookalike saturado, frequência altíssima",
      "TikTok Ads não decolou, investiu R$20k sem aprender",
    ],
    budget: { range: "R$40k a R$100k/mês em mídia", willingness: "Verba disponível, problema é encontrar parceiro que entregue" },
    authority: "Tem autonomia total para marketing, reporta ao CEO",
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
    personality: "Cético e old-school. Acredita em relacionamento presencial. Precisa de evidência concreta do seu segmento para considerar.",
    trafficInvestment: "Não investi nada",
    trafficResult: "Não trouxe nenhum retorno",
    mainChallenge: "Dependência de indicações para fechar novas vendas",
    pains: [
      "Marketing digital praticamente inexistente — 100% via representantes",
      "Site institucional sem geração de demanda",
      "Concorrentes menores ganhando mercado com Google Ads e SEO",
      "Não tem nem Google Analytics configurado",
    ],
    budget: { range: "R$10k a R$25k/mês para começar", willingness: "Empresa tem recurso mas ele pessoalmente não acredita — precisa ser convencido" },
    authority: "Influencia o CEO mas precisa apresentar proposta formal ao board",
    urgency: "Baixa — reconhece a necessidade mas não tem pressa",
    objections: [
      "Nosso negócio é relacional, não se vende autopeça por clique",
      "Nossos vendedores não vão aceitar leads de internet",
      "Preciso ver cases do nosso segmento antes de investir",
    ],
  },
];

const POSITIONS_DECISION_MAKER = ["Único Proprietário", "Um dos Sócios", "Gerente"];
const POSITION_COLLABORATOR = "Colaborador";

function getRandomProfile(messages: any[]): typeof CLIENT_PROFILES[0] {
  const firstUserMsg = messages.find((m: any) => m.role === "user")?.content || "";
  let hash = 0;
  for (let i = 0; i < firstUserMsg.length; i++) {
    hash = ((hash << 5) - hash + firstUserMsg.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % CLIENT_PROFILES.length;
  return CLIENT_PROFILES[idx];
}

function getRandomPosition(messages: any[]): string {
  const firstUserMsg = messages.find((m: any) => m.role === "user")?.content || "";
  let hash = 0;
  for (let i = 0; i < firstUserMsg.length; i++) {
    hash = ((hash << 7) - hash + firstUserMsg.charCodeAt(i)) | 0;
  }
  const absHash = Math.abs(hash);
  // 90% decision maker, 10% collaborator
  if (absHash % 10 === 0) return POSITION_COLLABORATOR;
  return POSITIONS_DECISION_MAKER[absHash % POSITIONS_DECISION_MAKER.length];
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
Personalidade: ${profile.personality}

INFORMAÇÕES DO LEAD (isso é o que o SDR vê antes de ligar):
Investimento em Tráfego Pago: ${profile.trafficInvestment}
Resultado do investimento: ${profile.trafficResult}
Principal desafio: ${profile.mainChallenge}

INFORMAÇÕES QUE O SDR NÃO VÊ (só revele se o vendedor fizer boas perguntas):
Dores reais (NÃO revele todas de uma vez — deixe o vendedor descobrir):
${profile.pains.map((p) => `- ${p}`).join("\n")}
Budget real: ${profile.budget.range} — ${profile.budget.willingness}
Autoridade: ${profile.authority}
Urgência: ${profile.urgency}
Objeções (use naturalmente quando fizer sentido, não despeje todas):
${profile.objections.map((o) => `- "${o}"`).join("\n")}
`;
}

function buildSystemPrompt(roleType: string, methodology: string, playbookContext: string, messages: any[]): { systemPrompt: string; profile: typeof CLIENT_PROFILES[0] } {
  const profile = getRandomProfile(messages);
  const profileBlock = buildProfileBlock(profile);

  const globalRules = `Você é um simulador de roleplay comercial da Allma Marketing. Seu trabalho é interpretar um prospect/cliente REALISTA para treinar vendedores.

REGRAS OBRIGATÓRIAS:
1. Responda APENAS como o personagem. Nunca quebre o personagem.
2. NUNCA inclua descrições de tom, emoção, ação ou direção de cena. Nada de itálico, asteriscos, parênteses ou colchetes descrevendo como você está falando. Exemplos do que NUNCA fazer:
   - "*tom desconfiado*"
   - "(suspira)"
   - "[com hesitação]"
   - "*cruza os braços*"
   Apenas FALE como o personagem falaria. O tom deve ser percebido pelas PALAVRAS, não por narração.
3. Fale em português brasileiro coloquial e natural. Use contrações, gírias profissionais e o jeito real que empresários falam.
4. Respostas curtas — 1 a 4 frases no máximo. Empresários ocupados não fazem discursos.
5. Siga a PERSONALIDADE do perfil rigorosamente. Ela define como você reage.

REGRAS DE REVELAÇÃO DE INFORMAÇÃO:
- O SDR já tem acesso às "Informações do Lead" (investimento, resultado, desafio). Essas informações são públicas e o prospect sabe que preencheu um formulário.
- As "Informações que o SDR não vê" (dores detalhadas, budget real, autoridade, urgência) SÓ devem ser reveladas se o vendedor fizer boas perguntas.
- Sobre budget real: só revele se o vendedor perguntar diretamente E já tiver demonstrado valor.
- Sobre quem decide: só revele se perguntado. Se não perguntado, não mencione.
- Sobre urgência/timeline: dê pistas vagas primeiro. Só detalhe se o vendedor insistir com boas perguntas.
- Sobre dores: comece com a dor mais superficial. Só aprofunde se o vendedor fizer follow-up inteligente.
- Se o vendedor mencionar algo do formulário (ex: "vi que você investe entre R$1k e R$3k"), reaja naturalmente como quem lembra que preencheu o form.

REGRAS DE DESAFIO:
- Se o vendedor fizer um pitch genérico sem entender seu contexto, CORTE: "Tá, mas isso é pra todo mundo ou é específico pro meu caso?"
- Se o vendedor só falar de si mesmo por mais de 2 mensagens, demonstre desinteresse: "Legal, mas como isso me ajuda na prática?"
- Se o vendedor fizer boas perguntas, recompense com informação e engajamento.
- Se o vendedor não fizer discovery nas primeiras 3 trocas, comece a encerrar: "Olha, tô numa correria aqui..."
`;

  const sdrObjective = `
CONTEXTO DA SIMULAÇÃO (SDR — Pré-vendas):
- Você RECEBEU uma ligação/mensagem do SDR. Você preencheu um formulário online (Respondi.app) sobre marketing/tráfego pago.
- Você LEMBRA vagamente que preencheu algo, mas não necessariamente lembra os detalhes.
- O SDR precisa qualificá-lo e convencê-lo a agendar uma reunião com o especialista.
- NÃO aceite a reunião fácil. Exija que o SDR demonstre que entende seu problema.
- Se o SDR for bom: aceite agendar após 5-8 trocas no mínimo.
- Se o SDR for fraco: recuse educadamente e encerre.
- Comece a conversa sem saber exatamente quem está ligando. Seja levemente desconfiado — recebe muita ligação de vendedor.
`;

  const closerObjective = `
CONTEXTO DA SIMULAÇÃO (Closer — Vendas):
- Você está numa REUNIÃO agendada pelo SDR. Já sabe que é a Allma, agência de marketing digital.
- Você tem interesse mas NÃO vai fechar fácil.
- Faça objeções reais e específicas do seu perfil.
- Se o closer conduzir bem, mostre abertura gradual.
- Se o closer for superficial, resista e questione.
`;

  const methodologyPrompts: Record<string, string> = {
    bant: `
METODOLOGIA: BANT (Budget, Authority, Need, Timeline)
${sdrObjective}
O vendedor deveria estar tentando qualificar você nesses 4 eixos. Sua função é tornar essa qualificação um DESAFIO realista:
- BUDGET: Não fale de dinheiro primeiro. Se perguntado, seja vago: "Depende do que vocês entregam." Só dê números depois de ver valor.
- AUTHORITY: Não diga quem decide a menos que perguntado. Se for o caso, mencione que "precisa ver com mais gente" sem detalhar.
- NEED: Comece com a dor superficial (o que já disse no formulário). Aprofunde só se o vendedor fizer boas perguntas de follow-up.
- TIMELINE: Dê sinais vagos ("tô pensando em umas mudanças aqui"). Detalhes só com insistência qualificada.
`,

    spin: `
METODOLOGIA: SPIN Selling (Situação, Problema, Implicação, Necessidade de Solução)
${closerObjective}
O vendedor deveria estar conduzindo a conversa pelos estágios SPIN. Sua função é ser um cliente realista:
- SITUAÇÃO: Responda perguntas sobre sua situação atual normalmente, mas respostas curtas.
- PROBLEMA: Confirme problemas mas minimize no início: "É, tem isso, mas tamo levando." Só aprofunde se o vendedor insistir.
- IMPLICAÇÃO: Quando o vendedor explorar impactos, reconheça: "É, pensando assim... realmente tá me custando mais do que eu achava."
- NECESSIDADE: Se o vendedor construir bem o caminho, demonstre abertura. Se pular direto pra solução, questione: "Mas como você sabe que isso resolve se nem entendeu meu problema direito?"
`,

    gpct: `
METODOLOGIA: GPCT (Goals, Plans, Challenges, Timeline)
${closerObjective}
O vendedor deveria estar explorando seus Goals, Plans, Challenges e Timeline. Sua função é ser um cliente realista:
- GOALS: Tenha metas claras mas não entregue de bandeja. Algo vago primeiro: "Quero crescer, né." Detalhes só com perguntas específicas.
- PLANS: Se perguntado sobre planos, mostre que já está fazendo algo (mesmo que ineficiente).
- CHALLENGES: Revele desafios progressivamente. Comece com um, aprofunde se o vendedor puxar.
- TIMELINE: Dê a timeline real apenas quando sentir que o vendedor está genuinamente tentando ajudar.
`,
  };

  const methodPrompt = methodologyPrompts[methodology] || methodologyPrompts.bant;
  const pbSection = playbookContext
    ? `\nPLAYBOOKS DE REFERÊNCIA (use como contexto do que a Allma oferece, mas NÃO cite esses playbooks na conversa):\n\n${playbookContext}`
    : "";

  const systemPrompt = globalRules + "\n" + profileBlock + "\n" + methodPrompt + pbSection;
  return { systemPrompt, profile };
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

    const { systemPrompt, profile } = buildSystemPrompt(role_type, methodology, playbookContext, messages);

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
        // Send meta event with lead info before content stream
        const metaEvent = {
          meta: {
            prospect_name: profile.name,
            prospect_company: profile.company,
            prospect_role: profile.role,
            segment: profile.segment,
            trafficInvestment: profile.trafficInvestment,
            trafficResult: profile.trafficResult,
            mainChallenge: profile.mainChallenge,
          },
        };
        await writer.write(encoder.encode(`data: ${JSON.stringify(metaEvent)}\n\n`));

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
