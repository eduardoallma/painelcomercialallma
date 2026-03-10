

## Plano: Seleção de Tipo de Roleplay (SDR vs Closer) com Metodologias Específicas

### Conceito

Antes de iniciar o chat, o usuário deve escolher:
1. **Pré-vendas (SDR)** — avaliação pela metodologia **BANT**
2. **Vendas (Closer)** — escolher entre **SPIN** ou **GPCT**

O tipo e metodologia selecionados alteram o system prompt do chat e o prompt de avaliação.

### Mudanças

**`src/pages/Roleplay.tsx`**
- Adicionar estado `roleType`: `"sdr" | "closer" | null` e `methodology`: `"bant" | "spin" | "gpct" | null`
- Antes de permitir o envio de mensagens, exibir uma tela de seleção:
  - Dois cards: "Pré-vendas (SDR)" e "Vendas (Closer)"
  - Se escolher Closer, exibir segunda etapa: "SPIN Selling" ou "GPCT"
  - SDR seleciona BANT automaticamente
- Enviar `role_type` e `methodology` no payload do chat e da avaliação
- Salvar `role_type` e `methodology` na sessão do banco
- Atualizar o botão "Avaliar BANT" para exibir o nome da metodologia correta ("Avaliar BANT", "Avaliar SPIN", "Avaliar GPCT")
- Botão "Nova Sessão" limpa também a seleção de tipo

**`supabase/functions/roleplay-chat/index.ts`**
- Receber `role_type` e `methodology` no body
- Construir system prompt específico por metodologia:
  - **SDR/BANT**: Prospect em fase de qualificação, vendedor deve explorar Budget, Authority, Need, Timeline
  - **Closer/SPIN**: Cliente já qualificado, vendedor deve usar Situation, Problem, Implication, Need-Payoff
  - **Closer/GPCT**: Cliente já qualificado, vendedor deve explorar Goals, Plans, Challenges, Timeline

**`supabase/functions/evaluate-roleplay/index.ts`**
- Receber `methodology` da sessão salva
- Usar prompt de avaliação específico por metodologia:
  - BANT: manter atual (Budget, Authority, Need, Timeline)
  - SPIN: avaliar Situation, Problem, Implication, Need-Payoff
  - GPCT: avaliar Goals, Plans, Challenges, Timeline

**`src/components/roleplay/BANTEvaluation.tsx`**
- Renomear para `MethodologyEvaluation.tsx` (ou torná-lo genérico)
- Aceitar `methodology` como prop para renderizar os pilares corretos:
  - BANT: Budget, Authority, Need, Timeline
  - SPIN: Situation, Problem, Implication, Need-Payoff
  - GPCT: Goals, Plans, Challenges, Timeline

**Migration SQL**
- Adicionar colunas `role_type text` e `methodology text` à tabela `roleplay_sessions`

### Resumo dos arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `role_type` e `methodology` a `roleplay_sessions` |
| `src/pages/Roleplay.tsx` | Tela de seleção, passar tipo/metodologia nas chamadas |
| `supabase/functions/roleplay-chat/index.ts` | Prompts específicos por metodologia |
| `supabase/functions/evaluate-roleplay/index.ts` | Avaliação específica por metodologia |
| `src/components/roleplay/BANTEvaluation.tsx` | Tornar genérico para BANT/SPIN/GPCT |

