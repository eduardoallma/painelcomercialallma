

## Plano: Cartão de informações do lead na tela de roleplay

### O que será feito

Exibir um cartão compacto ao lado dos badges (SDR · BANT / Playbooks) com as informações que o SDR tem acesso do lead, conforme preenchido no formulário. O nome e empresa do prospect continuam visíveis para título da sessão.

### Mudanças

**1. Edge function (`roleplay-chat/index.ts`)**
- Restaurar o envio do evento `meta` via SSE antes do stream de conteúdo
- Incluir campos: `prospect_name`, `prospect_company`, `prospect_role`, `segment`, `trafficInvestment`, `trafficResult`, `mainChallenge`
- Refatorar `buildSystemPrompt` para retornar `{ systemPrompt, profile }` novamente

**2. Frontend (`Roleplay.tsx`)**
- Expandir o tipo de `prospectInfo` para incluir os novos campos (`role`, `segment`, `trafficInvestment`, `trafficResult`, `mainChallenge`)
- Renderizar um `Card` compacto após os badges/playbooks com:
  - Nome e cargo do lead
  - Empresa e segmento
  - Investimento em tráfego
  - Resultado do investimento
  - Principal desafio
- O cartão aparece assim que o primeiro evento `meta` chega do stream (primeira mensagem)
- Resetar em `startNewSession`

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `supabase/functions/roleplay-chat/index.ts` | Restaurar meta SSE com campos expandidos |
| `src/pages/Roleplay.tsx` | Expandir `prospectInfo`, renderizar cartão do lead |

