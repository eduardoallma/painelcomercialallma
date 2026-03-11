

## Plano: Timer de sessão + Cargo do lead

### 1. Timer de sessão

**Banco de dados**: Adicionar coluna `duration_seconds integer` na tabela `roleplay_sessions`.

**`src/pages/Roleplay.tsx`**:
- Adicionar state `sessionStartTime` (timestamp) — setado quando a primeira mensagem é enviada
- Adicionar state `elapsedSeconds` atualizado via `setInterval` a cada segundo enquanto a sessão estiver ativa
- Exibir timer formatado (MM:SS) ao lado do badge "SDR · BANT" na barra de ações
- Ao salvar sessão, calcular duração e incluir `duration_seconds` no insert/update

**`src/components/roleplay/SessionHistory.tsx`**:
- Adicionar `duration_seconds` à interface `HistorySession`
- Exibir duração formatada nos cards do histórico (ex: "4:32") e na visualização da sessão

**`src/pages/Roleplay.tsx` (loadHistory)**:
- Incluir `duration_seconds` na query de histórico

### 2. Cargo do lead com distribuição ponderada

**`supabase/functions/roleplay-chat/index.ts`**:
- Adicionar campo `position` a cada perfil em `CLIENT_PROFILES` com valores: "Único Proprietário", "Um dos Sócios", "Gerente" ou "Colaborador"
- Implementar seleção ponderada: 90% chance de ser um dos 3 primeiros, 10% Colaborador
- A seleção será determinística (baseada no hash da primeira mensagem, como já é feito para o perfil)
- Incluir `position` no meta event enviado ao frontend

**`src/pages/Roleplay.tsx`**:
- Adicionar `position` ao `ProspectInfo` e exibir no HoverCard do lead

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `duration_seconds` à tabela `roleplay_sessions` |
| `src/pages/Roleplay.tsx` | Timer + exibir cargo + salvar duração |
| `src/components/roleplay/SessionHistory.tsx` | Exibir duração no histórico |
| `supabase/functions/roleplay-chat/index.ts` | Adicionar cargo aos perfis + meta event |

