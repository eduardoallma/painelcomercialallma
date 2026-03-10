

## Plano: Histórico de Roleplays com BANT + Confirmação de Exclusão + Claude API

### 1. Tabela `roleplay_sessions`

```sql
CREATE TABLE public.roleplay_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Sessão sem título',
  messages jsonb NOT NULL DEFAULT '[]',
  playbook_ids uuid[] DEFAULT '{}',
  score smallint,
  bant_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roleplay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON public.roleplay_sessions FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

Usa trigger de validação para score entre 0 e 10 (evita CHECK constraint).

### 2. Edge Function: `evaluate-roleplay`

Nova function que recebe as mensagens do chat e retorna:
- **Nota de 0 a 10** baseada na metodologia BANT (Budget, Authority, Need, Timeline)
- **Feedback detalhado** com pontos fortes e sugestões de melhoria para cada pilar BANT

Usa Claude (Anthropic) via chave de API do usuário. O prompt instrui o modelo a avaliar o desempenho do vendedor em cada dimensão BANT.

### 3. Secret: `ANTHROPIC_API_KEY`

Solicitar ao usuário a chave de API da Anthropic para usar Claude. A chave será armazenada como secret e usada nas edge functions `roleplay-chat` e `evaluate-roleplay`.

### 4. Migrar `roleplay-chat` para Claude

Alterar a edge function existente para chamar a API da Anthropic (`https://api.anthropic.com/v1/messages`) em vez do Lovable AI Gateway. Manter streaming SSE.

### 5. Alterações no frontend

**`src/pages/Roleplay.tsx`:**
- Botão "Finalizar e Avaliar" que salva a sessão no banco e chama `evaluate-roleplay`
- Exibe card com nota (0-10) e feedback BANT após avaliação
- Botão "Nova Sessão" para limpar e iniciar novo chat
- Lista lateral/dropdown com sessões anteriores para consulta

**Nova página `src/pages/RoleplayHistory.tsx`:**
- Lista todas as sessões salvas com título, data e nota
- Ao clicar, exibe mensagens completas + avaliação BANT

**`src/pages/Playbooks.tsx`:**
- Substituir exclusão direta por `AlertDialog` com confirmação: "Tem certeza que deseja excluir este playbook? Esta ação não pode ser desfeita."

**`src/App.tsx` e `SidebarNav.tsx`:**
- Adicionar rota `/roleplay/history` e link "Histórico" na navegação

### 6. Config

```toml
[functions.evaluate-roleplay]
verify_jwt = false
```

### Resumo dos arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `roleplay_sessions` |
| `supabase/functions/roleplay-chat/index.ts` | Migrar para API Claude |
| `supabase/functions/evaluate-roleplay/index.ts` | Nova function (avaliação BANT via Claude) |
| `supabase/config.toml` | Adicionar evaluate-roleplay |
| `src/pages/Roleplay.tsx` | Salvar sessões, avaliar, listar histórico |
| `src/pages/RoleplayHistory.tsx` | Nova página de histórico |
| `src/pages/Playbooks.tsx` | AlertDialog de confirmação de exclusão |
| `src/App.tsx` | Nova rota |
| `src/components/layout/SidebarNav.tsx` | Novo link na nav |

