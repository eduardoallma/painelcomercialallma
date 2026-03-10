

## Plano: 10 Perfis de Clientes com Dores de Marketing Digital

### Mudança

Atualizar `supabase/functions/roleplay-chat/index.ts` para incluir 10 perfis de clientes com dores de marketing digital/tráfego pago. Um perfil é sorteado aleatoriamente a cada sessão e injetado no system prompt.

### Perfis planejados

| # | Empresa | Segmento | Faturamento | Dor principal |
|---|---------|----------|-------------|---------------|
| 1 | FitLife Academia | Fitness | R$1.2M | Gasta em Meta Ads sem controle de CAC, não sabe qual campanha traz alunos |
| 2 | Dra. Camila Estética | Clínica estética | R$3M | Depende de indicação, tentou Google Ads sozinha e queimou budget |
| 3 | EduPlus Cursos | Educação online | R$8M | CPL alto no Google, funil de remarketing inexistente |
| 4 | CasaNova Imóveis | Imobiliária | R$15M | Leads do Meta Ads desqualificados, equipe comercial reclama da qualidade |
| 5 | PetShop Mais | Varejo pet | R$5M | E-commerce com ROAS abaixo de 2x, não usa lookalike nem catálogo dinâmico |
| 6 | TechSaaS Pro | SaaS B2B | R$25M | Alto custo por trial no LinkedIn Ads, baixa conversão trial→pago |
| 7 | Construtora Horizonte | Construção civil | R$60M | Investe R$80k/mês em tráfego sem dashboard unificado, não mede atribuição |
| 8 | FoodExpress Delivery | Alimentação | R$12M | Dependência total de iFood, quer canal próprio mas não sabe estruturar tráfego |
| 9 | ModaViva E-commerce | Moda feminina | R$35M | Escala travada em Meta Ads, CPA subindo mês a mês, sem estratégia de criativos |
| 10 | AutoPeças Nacional | Autopeças B2B | R$100M | Marketing digital inexistente, depende de representantes, quer gerar demanda online |

### Objetivos por papel

- **SDR**: O prospect resiste a agendar reunião. Só aceita se o SDR demonstrar entendimento do problema e propor valor claro. Objetivo = marcar reunião.
- **Closer**: O cliente já foi qualificado mas hesita em fechar. Faz objeções de preço, ROI, timing, concorrência. Objetivo = fechar contrato.

### Implementação

O perfil é selecionado aleatoriamente via `Math.random()` na primeira mensagem (quando `messages.length === 1`). É injetado no system prompt como bloco `PERFIL DO CLIENTE:` com nome, cargo, empresa, segmento, faturamento, equipe, dores, urgência e objeções típicas.

As instruções de objetivo (agendar reunião vs fechar contrato) são adicionadas ao final do prompt de cada metodologia.

### Arquivo alterado

| Arquivo | Ação |
|---|---|
| `supabase/functions/roleplay-chat/index.ts` | Adicionar banco de 10 perfis + seleção aleatória + objetivos por papel |

