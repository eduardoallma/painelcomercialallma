

## Plano: Fechar avaliação + mostrar usuário no histórico

### Mudanças

**`src/components/roleplay/MethodologyEvaluation.tsx`**
- Adicionar botão de fechar (X) no canto superior direito do card
- Aceitar nova prop `onClose?: () => void` — ao clicar, o card é ocultado

**`src/pages/RoleplayHistory.tsx`**
- Adicionar estado `showEvaluation` (default `true`) que controla a visibilidade do card de avaliação
- Passar `onClose` para o `MethodologyEvaluation` que seta `showEvaluation = false`
- Resetar `showEvaluation = true` ao trocar de sessão
- Corrigir import: trocar `BANTEvaluation` por `MethodologyEvaluation`
- Exibir o nome e email do usuário logado no topo da lista de sessões (usando `useAuth` que já está importado)
- Buscar também `methodology` da sessão para passar ao componente de avaliação

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/roleplay/MethodologyEvaluation.tsx` | Adicionar botão fechar + prop `onClose` |
| `src/pages/RoleplayHistory.tsx` | Estado de visibilidade, mostrar usuário logado, fix import |

